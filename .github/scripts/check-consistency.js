#!/usr/bin/env node
/**
 * check-consistency.js
 * 数据一致性检查：ID 连续性、贡献者匹配、积分校验、stats 更新。
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.env.GITHUB_WORKSPACE || '.', '_data');
let hasChanges = false;
const issues = [];

// --- 工具函数 ---
function readFile(name) {
  try {
    return fs.readFileSync(path.join(dataDir, name), 'utf8');
  } catch (e) {
    return '';
  }
}

function writeFile(name, content) {
  fs.writeFileSync(path.join(dataDir, name), content, 'utf8');
  hasChanges = true;
}

// --- 检查 1: zju-fun.yml ID 连续性 ---
function checkZjuFunIds() {
  const content = readFile('zju-fun.yml');
  if (!content) return;

  const ids = [];
  const re = /^\s*id:\s*(\d+)/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    ids.push(parseInt(m[1]));
  }

  // 检查重复
  const seen = new Set();
  const duplicates = [];
  ids.forEach(function(id) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  });

  if (duplicates.length > 0) {
    issues.push('zju-fun.yml 存在重复 ID: ' + duplicates.join(', '));
  }

  console.log(`zju-fun.yml: ${ids.length} entries, ${duplicates.length} duplicates`);
}

// --- 检查 2: 贡献者匹配 ---
function checkContributorMatch() {
  const resContent = readFile('resources.yml');
  const conContent = readFile('contributors.yml');
  if (!conContent) return;

  // 提取 contributors.yml 中的 name 值
  const conNames = [];
  const nameRe = /^\s*-\s*name:\s*["']?([^"'\n]+)/gm;
  let m;
  while ((m = nameRe.exec(conContent)) !== null) {
    conNames.push(m[1].trim());
  }

  console.log(`contributors.yml: ${conNames.length} contributors`);

  // 检查 resources.yml 中的 uploader 是否有对应贡献者
  if (resContent) {
    const uploaderRe = /^\s*uploader:\s*["']?([^"'\n]+)/gm;
    const uploaders = new Set();
    while ((m = uploaderRe.exec(resContent)) !== null) {
      uploaders.add(m[1].trim());
    }

    uploaders.forEach(function(uploader) {
      if (uploader && !conNames.includes(uploader)) {
        issues.push(`资源上传者 "${uploader}" 在 contributors.yml 中无对应条目`);
      }
    });
  }
}

// --- 检查 3: 贡献者积分校验 ---
function checkContributorPoints() {
  const content = readFile('contributors.yml');
  if (!content) return;

  // 解析每个贡献者的 resources, answers, points
  const lines = content.split('\n');
  let currentName = '';
  let currentResources = 0;
  let currentAnswers = 0;
  let currentPoints = 0;
  let lineStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('- name:')) {
      // 处理前一个贡献者
      if (currentName) {
        var expectedPoints = currentResources * 10 + currentAnswers * 2;
        if (currentPoints !== expectedPoints && currentPoints > 0) {
          // 不自动修复积分，只记录
          console.log(`${currentName}: expected ${expectedPoints}, actual ${currentPoints}`);
        }
      }
      currentName = line.replace('- name:', '').trim().replace(/^["']|["']$/g, '');
      currentResources = 0;
      currentAnswers = 0;
      currentPoints = 0;
      lineStart = i;
      continue;
    }

    if (currentName && line.startsWith('resources:')) {
      currentResources = parseInt(line.replace('resources:', '').trim()) || 0;
    }
    if (currentName && line.startsWith('answers:')) {
      currentAnswers = parseInt(line.replace('answers:', '').trim()) || 0;
    }
    if (currentName && line.startsWith('points:')) {
      currentPoints = parseInt(line.replace('points:', '').trim()) || 0;
    }
  }

  // 处理最后一个
  if (currentName) {
    var expected = currentResources * 10 + currentAnswers * 2;
    if (currentPoints !== expected && currentPoints > 0) {
      console.log(`${currentName}: expected ${expected}, actual ${currentPoints}`);
    }
  }
}

// --- 检查 4: 更新 stats.yml ---
function updateStats() {
  const content = readFile('stats.yml');
  if (!content) return;

  // 计数
  const resContent = readFile('resources.yml');
  const funContent = readFile('zju-fun.yml');
  const survContent = readFile('zju-survival.yml');

  const resCount = resContent ? (resContent.match(/^\s*-?\s*id:\s*\d+/gm) || []).length : 0;
  const funCount = funContent ? (funContent.match(/^\s*-?\s*id:\s*\d+/gm) || []).length : 0;
  // 生存指南的 guide 条目
  const guideCount = survContent ? (survContent.match(/^\s*-?\s*title:\s/gm) || []).length : 0;

  const today = new Date().toISOString().slice(0, 10);

  // 重写 stats.yml
  const newStats = `# =============================================\n` +
    `# 全站统计数据（由 GitHub Actions 自动更新）\n` +
    `# =============================================\n\n` +
    `total_resources: ${resCount}\n` +
    `total_places: ${funCount}\n` +
    `total_guides: ${guideCount}\n` +
    `total_questions: 0\n` +
    `last_updated: "${today}"\n`;

  const oldContent = content.trim();
  if (newStats.trim() !== oldContent) {
    writeFile('stats.yml', newStats);
    console.log('Updated stats.yml');
  } else {
    console.log('stats.yml is up to date');
  }
}

// --- 执行所有检查 ---
console.log('=== Data Consistency Check ===\n');

checkZjuFunIds();
checkContributorMatch();
checkContributorPoints();
updateStats();

// --- 报告 ---
console.log('\n--- Summary ---');
if (issues.length > 0) {
  console.log('Issues found:');
  issues.forEach(function(issue) { console.log('  - ' + issue); });
} else {
  console.log('No issues found.');
}

console.log(`Changes made: ${hasChanges}`);
console.log('Done!');

// 输出到 GITHUB_OUTPUT
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  fs.appendFileSync(outputFile, `has_changes=${hasChanges}\n`);
  fs.appendFileSync(outputFile, `issue_count=${issues.length}\n`);
}
