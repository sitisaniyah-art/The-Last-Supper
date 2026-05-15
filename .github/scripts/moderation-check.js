#!/usr/bin/env node
/**
 * moderation-check.js
 * 内容违规检测：关键词、链接安全、重复检查、垃圾检测。
 * 输出: { passed: boolean, reasons: string[] }
 */

const fs = require('fs');
const path = require('path');

// --- 简易 YAML 解析（仅支持 moderation.yml 的格式）---
function parseSimpleYaml(content) {
  const result = {};
  let currentKey = null;
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // key: value 或 key:
    const kvMatch = trimmed.match(/^(\w[\w_]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '' || val === undefined) {
        // 可能是一个数组块的开始
        result[key] = [];
        currentKey = key;
      } else {
        // 标量值
        const num = Number(val);
        result[key] = isNaN(num) ? val : num;
        currentKey = null;
      }
      continue;
    }

    // 数组项: - value
    const arrMatch = trimmed.match(/^-\s+(.+)$/);
    if (arrMatch && currentKey && Array.isArray(result[currentKey])) {
      result[currentKey].push(arrMatch[1].trim());
    }
  }

  return result;
}

// --- 读取配置 ---
const workspace = process.env.GITHUB_WORKSPACE || '.';
const modConfigPath = path.join(workspace, '_data', 'moderation.yml');

let config;
try {
  const raw = fs.readFileSync(modConfigPath, 'utf8');
  config = parseSimpleYaml(raw);
} catch (e) {
  console.error('Failed to load moderation.yml:', e.message);
  config = {};
}

// 填充默认值
config.blocked_keywords = config.blocked_keywords || ['广告', '代写', '刷单', '赌博', '色情'];
config.blocked_domains = config.blocked_domains || ['bit.ly', 'tinyurl.com'];
config.allowed_domains = config.allowed_domains || [];
config.min_description_length = config.min_description_length || 10;
config.max_description_length = config.max_description_length || 2000;
config.min_title_length = config.min_title_length || 2;
config.max_title_length = config.max_title_length || 100;

// --- 读取 Issue ---
const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('GITHUB_EVENT_PATH not set');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue;
const title = issue.title || '';
const body = issue.body || '';

// --- 解析字段 ---
function parseFields(body) {
  const fields = {};
  if (!body) return fields;
  const regex = /^### (.+)\n\n([\s\S]*?)(?=\n### |\n*$)/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim();
    fields[key] = val === '_No response_' ? '' : val;
  }
  return fields;
}

const fields = parseFields(body);
const reasons = [];

// --- 1. 关键词检测 ---
function checkKeywords() {
  const blocked = config.blocked_keywords || [];
  const textFields = ['place-name', 'name', 'title', 'description', '推荐理由', '资源简介', 'address', '地址'];
  const allText = [title];

  for (const key of textFields) {
    if (fields[key]) allText.push(fields[key]);
  }

  // 检查标签
  const tagField = fields['tags'] || '';
  if (tagField) allText.push(tagField);

  const combinedText = allText.join(' ').toLowerCase();

  for (const keyword of blocked) {
    if (combinedText.includes(keyword.toLowerCase())) {
      reasons.push(`包含违禁关键词: "${keyword}"`);
    }
  }
}

// --- 2. 链接安全检测 ---
function checkLinks() {
  const urlFields = ['url', '资源链接', 'link'];
  const blocked = config.blocked_domains || [];
  const allowed = config.allowed_domains || [];

  for (const key of urlFields) {
    const url = fields[key];
    if (!url || !/^https?:\/\//.test(url)) continue;

    try {
      const hostname = new URL(url).hostname.toLowerCase();

      // 白名单优先
      if (allowed.some(d => hostname === d || hostname.endsWith('.' + d))) {
        continue;
      }

      // 检查屏蔽域名
      if (blocked.some(d => hostname === d || hostname.endsWith('.' + d))) {
        reasons.push(`链接域名被屏蔽: ${hostname}`);
      }

      // 检查短链接（域名很短且不在白名单中）
      if (hostname.split('.').length === 2 && hostname.length < 10) {
        reasons.push(`疑似短链接，请使用原始链接: ${hostname}`);
      }
    } catch (e) {
      reasons.push(`链接格式不正确: ${url}`);
    }
  }
}

// --- 3. 描述长度检测 ---
function checkDescriptionLength() {
  const descFields = ['description', '推荐理由', '资源简介', '补充说明'];
  const minLength = config.min_description_length || 10;
  const maxLength = config.max_description_length || 2000;

  for (const key of descFields) {
    const val = fields[key];
    if (!val) continue;
    if (val.length < minLength) {
      reasons.push(`描述太短（${val.length}字），最少${minLength}字`);
    }
    if (val.length > maxLength) {
      reasons.push(`描述太长（${val.length}字），最多${maxLength}字`);
    }
  }
}

// --- 4. 标题长度检测 ---
function checkTitleLength() {
  const nameField = fields['place-name'] || fields['name'] || fields['title'] || '';
  const minLength = config.min_title_length || 2;
  const maxLength = config.max_title_length || 100;

  if (nameField && nameField.length < minLength) {
    reasons.push(`标题太短（${nameField.length}字），最少${minLength}字`);
  }
  if (nameField && nameField.length > maxLength) {
    reasons.push(`标题太长（${nameField.length}字），最多${maxLength}字`);
  }
}

// --- 5. 垃圾内容检测 ---
function checkSpam() {
  const desc = fields['description'] || fields['推荐理由'] || fields['资源简介'] || '';

  // 检测重复字符（如 "aaaaaaaa"）
  if (/(.)\1{7,}/.test(desc)) {
    reasons.push('检测到疑似垃圾内容（重复字符过多）');
  }

  // 检测广告模式（多处 URL 密集出现）
  const urlCount = (desc.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 3) {
    reasons.push('描述中链接过多，疑似广告');
  }

  // 检测联系方式密集（手机号、微信、QQ）
  const phoneCount = (desc.match(/1[3-9]\d{9}/g) || []).length;
  const qqCount = (desc.match(/[Qq]{1,2}[:\s]*\d{5,}/g) || []).length;
  if (phoneCount > 2 || qqCount > 2) {
    reasons.push('联系方式过多，疑似广告');
  }
}

// --- 执行所有检测 ---
checkKeywords();
checkLinks();
checkDescriptionLength();
checkTitleLength();
checkSpam();

const passed = reasons.length === 0;

// --- 输出结果 ---
console.log('\n--- Moderation Check ---');
console.log(`Passed: ${passed}`);
if (!passed) {
  console.log('Reasons:');
  reasons.forEach(r => console.log(`  - ${r}`));
}

// 输出到 GITHUB_OUTPUT
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  fs.appendFileSync(outputFile, `moderation_passed=${passed}\n`);
  if (!passed) {
    fs.appendFileSync(outputFile, `moderation_reasons<<EOF\n${reasons.join('\n')}\nEOF\n`);
  }
}

process.exit(passed ? 0 : 1);
