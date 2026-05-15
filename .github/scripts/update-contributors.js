#!/usr/bin/env node
/**
 * update-contributors.js
 * 根据 Issue 提交者的 nickname 和类型，更新 contributors.yml 积分。
 * 资源推荐 +10，生存指南 +5。
 */

const fs = require('fs');
const path = require('path');

// --- 读取 Issue 数据 ---
const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('GITHUB_EVENT_PATH not set');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue;
const labels = (issue.labels || []).map(l => l.name);

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

const fields = parseFields(issue.body);

// --- 确定贡献类型和积分 ---
let entryType = '';
let points = 0;

if (labels.includes('recommendation') || labels.includes('resource-submission')) {
  entryType = 'recommendation';
  points = 10;
} else if (labels.includes('survival-guide')) {
  entryType = 'survival-guide';
  points = 5;
} else {
  console.log('Not a scoring submission, skipping.');
  process.exit(0);
}

// 获取昵称
const nickname = fields['nickname'] || fields['你的昵称（可选）'] || fields['你的昵称'] || '';
const displayName = nickname && nickname !== '匿名' ? nickname : `用户#${issue.number}`;

// --- 读取 contributors.yml ---
const dataDir = path.join(process.env.GITHUB_WORKSPACE || '.', '_data');
const filePath = path.join(dataDir, 'contributors.yml');

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error('Failed to read contributors.yml:', e.message);
  process.exit(1);
}

// --- 查找或创建贡献者 ---
// 使用简单字符串操作来修改 YAML
const lines = content.split('\n');
let foundContributor = false;
let inContributor = false;
let contributorStartLine = -1;
let nameLine = -1;
let resourcesLine = -1;
let pointsLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // 检测新条目开始
  if (line.startsWith('- name:')) {
    const nameVal = line.replace('- name:', '').trim().replace(/^["']|["']$/g, '');
    if (nameVal === displayName) {
      foundContributor = true;
      inContributor = true;
      contributorStartLine = i;
      nameLine = i;
    } else {
      inContributor = false;
    }
    continue;
  }

  if (inContributor) {
    if (line.startsWith('- name:') || (line.startsWith('- ') && !line.startsWith('- name:'))) {
      // 遇到下一个条目
      inContributor = false;
      continue;
    }

    if (line.startsWith('resources:')) {
      resourcesLine = i;
    }
    if (line.startsWith('points:')) {
      pointsLine = i;
    }
  }
}

if (foundContributor && pointsLine >= 0) {
  // 更新已有贡献者的积分和资源数
  const currentPoints = parseInt(lines[pointsLine].replace('points:', '').trim()) || 0;
  lines[pointsLine] = `  points: ${currentPoints + points}`;

  if (resourcesLine >= 0 && entryType === 'recommendation') {
    const currentRes = parseInt(lines[resourcesLine].replace('resources:', '').trim()) || 0;
    lines[resourcesLine] = `  resources: ${currentRes + 1}`;
  }

  console.log(`Updated contributor "${displayName}": +${points} points`);
} else {
  // 创建新贡献者条目
  const newEntry = [
    '',
    `- name: "${displayName}"`,
    `  github: ""`,
    `  avatar: "https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random"`,
    `  resources: ${entryType === 'recommendation' ? 1 : 0}`,
    `  answers: 0`,
    `  points: ${points}`,
    `  join_date: "${new Date().toISOString().slice(0, 7)}"`,
    `  bio: "通过 Issue 提交加入"`,
  ];

  // 追加到文件末尾
  lines.push(...newEntry);
  console.log(`Created new contributor "${displayName}": +${points} points`);
}

// --- 写回文件 ---
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done!');
