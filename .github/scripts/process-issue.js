#!/usr/bin/env node
/**
 * process-issue.js
 * GitHub Actions 运行：解析 Issue body，生成 YAML 条目追加到数据文件。
 * 支持：recommendation (zju-fun.yml) / survival-guide (zju-survival.yml)
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

console.log(`Processing issue #${issue.number}: ${issue.title}`);
console.log(`Labels: ${labels.join(', ')}`);

// --- 判断 Issue 类型 ---
let issueType = null;
if (labels.includes('recommendation') || labels.includes('resource-submission')) {
  issueType = 'recommendation';
} else if (labels.includes('survival-guide')) {
  issueType = 'survival-guide';
}

if (!issueType) {
  console.log('Not a submission issue, skipping.');
  process.exit(0);
}

// --- 解析 Issue body 字段 ---
function parseFields(body) {
  const fields = {};
  if (!body) return fields;
  // GitHub Issue Form 格式：### field-id\n\nvalue
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
console.log('Parsed fields:', JSON.stringify(fields, null, 2));

// --- 工具函数 ---
function escapeYaml(str) {
  if (!str) return '';
  // 如果包含特殊字符，用双引号包裹并转义
  if (/[\n\r:#{}[\],&*?|>!%@`]/.test(str) || str.startsWith(' ') || str.endsWith(' ')) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return str;
}

function parseRating(val) {
  if (!val) return 3;
  const m = val.match(/^(\d)/);
  return m ? parseInt(m[1]) : 3;
}

function parseTags(val) {
  if (!val) return [];
  return val.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// --- 读取数据文件 ---
const dataDir = path.join(process.env.GITHUB_WORKSPACE || '.', '_data');

function readYamlRaw(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

function writeYamlRaw(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function findMaxId(yamlContent) {
  let maxId = 0;
  const re = /^\s*id:\s*(\d+)/gm;
  let m;
  while ((m = re.exec(yamlContent)) !== null) {
    const id = parseInt(m[1]);
    if (id > maxId) maxId = id;
  }
  return maxId;
}

function checkDuplicate(yamlContent, title, link) {
  const lower = (yamlContent || '').toLowerCase();
  if (title && lower.includes(title.toLowerCase())) {
    // 进一步检查是否有 name: "title" 的条目
    const nameRe = new RegExp('name:\\s*["\']?' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (nameRe.test(yamlContent)) return true;
  }
  if (link && lower.includes(link.toLowerCase())) {
    const urlRe = new RegExp('url:\\s*["\']?' + link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const linkRe = new RegExp('link:\\s*["\']?' + link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (urlRe.test(yamlContent) || linkRe.test(yamlContent)) return true;
  }
  return false;
}

// --- 处理推荐 (recommendation) ---
function processRecommendation() {
  const name = fields['place-name'] || fields['name'] || '';
  const category = fields['category'] || '其他';
  const address = fields['address'] || '';
  const description = fields['description'] || '';
  const rating = parseRating(fields['rating']);
  const price = fields['price'] || '未知';
  const openingHours = fields['opening-hours'] || '未知';
  const nickname = fields['nickname'] || '匿名';

  // 验证必填字段
  const errors = [];
  if (!name) errors.push('店名/地点名称不能为空');
  if (!category) errors.push('分类不能为空');
  if (!address) errors.push('地址不能为空');
  if (!description) errors.push('推荐理由不能为空');
  if (description && description.length < 10) errors.push('推荐理由至少10个字');

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const filePath = path.join(dataDir, 'zju-fun.yml');
  const content = readYamlRaw(filePath);

  // 检查重复
  if (checkDuplicate(content, name, address)) {
    return { success: false, errors: ['该地点已存在，请勿重复提交'] };
  }

  // 计算新 ID
  const newId = findMaxId(content) + 1;

  // 根据分类推断子分类
  const subcategoryMap = {
    '美食': '推荐',
    '外卖': '外卖',
    '奶茶咖啡': '饮品',
    '约会聚餐': '聚餐',
    '景点': '景点',
    '娱乐': '娱乐',
    '超市便利店': '购物',
    '其他': '其他'
  };
  const subcategory = subcategoryMap[category] || '其他';

  // 生成默认图片（随机 Pexels 食物图）
  const pexelsIds = [1640777, 1099680, 376464, 1279330, 704971, 1580105, 769289, 2641886, 958545, 1633578];
  const imgId = pexelsIds[newId % pexelsIds.length];
  const image = `https://images.pexels.com/photos/${imgId}/pexels-photo-${imgId}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400`;

  // 构建 YAML 条目
  const entry = `
- id: ${newId}
  name: ${escapeYaml(name)}
  category: ${escapeYaml(category)}
  subcategory: ${escapeYaml(subcategory)}
  rating: ${rating}.0
  like_count: 0
  address: ${escapeYaml(address)}
  description: ${escapeYaml(description)}
  recommender: ${escapeYaml(nickname)}
  date: "${today()}"
  image: "${image}"
  tags: [${parseTags(fields['tags'] || '').map(t => `"${t}"`).join(', ')}]
  opening_hours: ${escapeYaml(openingHours)}
  price: ${escapeYaml(price)}
`;

  // 追加到文件末尾
  writeYamlRaw(filePath, content.trimEnd() + '\n' + entry);

  return { success: true, id: newId, title: name, type: 'recommendation' };
}

// --- 处理生存指南 (survival-guide) ---
function processSurvivalGuide() {
  const title = fields['title'] || '';
  const category = fields['category'] || '';
  const source = fields['source'] || '';
  const description = fields['description'] || '';
  const url = fields['url'] || '';
  const tags = parseTags(fields['tags']);
  const intranet = fields['intranet'] === '是';
  const nickname = fields['nickname'] || '匿名';

  // 验证必填字段
  const errors = [];
  if (!title) errors.push('资源标题不能为空');
  if (!category) errors.push('所属分类不能为空');
  if (!source) errors.push('资源来源不能为空');
  if (!description) errors.push('资源简介不能为空');
  if (!url) errors.push('资源链接不能为空');
  if (url && !/^https?:\/\//.test(url)) errors.push('资源链接格式不正确，需要以 http:// 或 https:// 开头');
  if (description && description.length < 10) errors.push('资源简介至少10个字');

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const filePath = path.join(dataDir, 'zju-survival.yml');
  const content = readYamlRaw(filePath);

  // 检查重复
  if (checkDuplicate(content, title, url)) {
    return { success: false, errors: ['该资源已存在，请勿重复提交'] };
  }

  // 分类名 → category id 映射
  const categoryIdMap = {
    '新生必看': 'freshman',
    '学习考试': 'study',
    '校园生活': 'campus-life',
    '校内资源': 'resources',
    '出行交通': 'transport',
    '财务相关': 'finance',
    '实用工具': 'tools',
    '常见问题': 'faq'
  };
  const categoryId = categoryIdMap[category] || 'tools';

  // 构建 YAML 条目
  const entry = `
  - title: ${escapeYaml(title)}
    category: "${categoryId}"
    source: ${escapeYaml(source)}
    description: ${escapeYaml(description)}
    url: ${escapeYaml(url)}
    tags: [${tags.map(t => `"${t}"`).join(', ')}]
    date: "${today()}"
    need_intranet: ${intranet}
`;

  // 追加到文件末尾
  writeYamlRaw(filePath, content.trimEnd() + '\n' + entry);

  return { success: true, title, type: 'survival-guide' };
}

// --- 执行处理 ---
let result;
if (issueType === 'recommendation') {
  result = processRecommendation();
} else {
  result = processSurvivalGuide();
}

// --- 输出结果 ---
console.log('\n--- Result ---');
console.log(JSON.stringify(result, null, 2));

// 输出到 GITHUB_OUTPUT（供后续 step 使用）
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  fs.appendFileSync(outputFile, `success=${result.success}\n`);
  if (result.success) {
    fs.appendFileSync(outputFile, `entry_title=${result.title || ''}\n`);
    fs.appendFileSync(outputFile, `entry_type=${result.type || ''}\n`);
    fs.appendFileSync(outputFile, `entry_id=${result.id || ''}\n`);
  } else {
    fs.appendFileSync(outputFile, `errors=${result.errors.join('; ')}\n`);
  }
}

if (!result.success) {
  console.error('Validation failed:', result.errors);
  process.exit(1);
}

console.log('Done!');
