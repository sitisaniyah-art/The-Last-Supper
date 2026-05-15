# 最后的晚餐 — 运营与开发指南

> 面向新合作者的完整运营手册。读完本文件，你就能独立维护和扩展这个平台。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与环境搭建](#2-技术栈与环境搭建)
3. [目录结构速查](#3-目录结构速查)
4. [核心架构：数据驱动模式](#4-核心架构数据驱动模式)
5. [日常运营操作](#5-日常运营操作)
   - 5.1 [添加学习资源](#51-添加学习资源)
   - 5.2 [上传 PDF 文件](#52-上传-pdf-文件)
   - 5.3 [管理公告](#53-管理公告)
   - 5.4 [管理贡献者排行榜](#54-管理贡献者排行榜)
   - 5.5 [管理导航栏](#55-管理导航栏)
   - 5.6 [管理嗨玩榜（美食推荐）](#56-管理嗨玩榜美食推荐)
   - 5.7 [管理生存指南](#57-管理生存指南)
   - 5.8 [处理用户提问（Issues）](#58-处理用户提问issues)
6. [添加新功能页面](#6-添加新功能页面)
7. [CSS 样式系统](#7-css-样式系统)
8. [JavaScript 模块说明](#8-javascript-模块说明)
9. [配置文件详解](#9-配置文件详解)
10. [部署与发布流程](#10-部署与发布流程)
11. [常见问题排查](#11-常见问题排查)
12. [扩展功能指南](#12-扩展功能指南)
13. [GitHub Actions 自动化](#13-github-actions-自动化)
14. [用户举报功能](#14-用户举报功能)
15. [管理员后台](#15-管理员后台)
16. [滚动公告栏](#16-滚动公告栏)
17. [嗨玩榜图片管理系统](#17-嗨玩榜图片管理系统)
18. [评论系统](#18-评论系统)
19. [智能检索 Agent](#19-智能检索-agent)
20. [资源目录结构](#20-资源目录结构)

---

## 1. 项目概览

**"最后的晚餐"** 是一个 AI 协助搭建的资源互助社区，基于 Jekyll 静态站点生成器，使用 Minimal Mistakes 主题，托管在 GitHub Pages。

**核心功能：**
- **学习资源库** — 按学科/年级/类型筛选的资源库（5种资源类型 × 36个学科）
- **我的收藏** — 基于 localStorage 的收藏夹
- **疑问区** — 基于 GitHub Issues 的问答系统
- **嗨玩榜** — 浙大紫金港附近吃喝玩乐推荐（图片轮播 + 评论 + 搜索Agent）
- **生存指南** — 浙大学生必备信息汇总
- **社区公告** — 贡献者排行榜 + 站点公告
- **暗黑模式** — 全站主题切换
- **GitHub Actions 自动化** — Issue 提交自动审核、生成 PR
- **内容审核** — 违规关键词检测、链接安全检查
- **用户举报** — 一键举报跳转 GitHub Issue 模板
- **管理员后台** — 密码保护的数据管理面板（含图片管理 + 评论举报）
- **滚动公告栏** — 页面顶部实时动态展示
- **评论系统** — 嗨玩榜地点独立评论（点赞/踩/举报）
- **智能检索 Agent** — 全站悬浮搜索助手（关键词搜索 + 快捷推荐）

**核心理念：所有内容都存储在 `_data/*.yml` 文件中，HTML 页面在构建时通过 Liquid 模板引擎读取 YAML 数据并嵌入为 JavaScript 对象，由前端 JS 负责渲染和交互。**

---

## 2. 技术栈与环境搭建

### 依赖

| 组件 | 说明 |
|------|------|
| Jekyll | 静态站点生成器 |
| Minimal Mistakes | 远程主题 (`mmistakes/minimal-mistakes`) |
| GitHub Pages | 托管平台 |
| GitHub Issues API | 问答系统后端 |
| Font Awesome 6.5.1 | 图标库（CDN 加载） |
| Imgbb API v1 | 图片托管（免费） |
| Jest 29.x | 单元测试（仅 `filter-resources.js`） |

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/sitisaniyah-art/The-Last-Supper.git
cd The-Last-Supper

# 2. 安装 Ruby 依赖（需要 Ruby 2.7+ 和 Bundler）
bundle install

# 3. 启动本地开发服务器
bundle exec jekyll serve

# 访问 http://localhost:4000/The-Last-Supper/
```

### 运行测试

```bash
# 安装 Node 依赖（仅 Jest）
npm install

# 运行 filter-resources.js 的单元测试
npm test
```

### 前置知识要求

- **YAML 语法** — 所有数据文件的格式
- **Liquid 模板引擎** — Jekyll 的模板语言（{% raw %}`{% %}`{% endraw %} 和 {% raw %}`{{ }}`{% endraw %}）
- **HTML/CSS/JS 基础** — 页面结构和交互逻辑
- **Git 基本操作** — clone, add, commit, push, branch, PR

---

## 3. 目录结构速查

```
The-Last-Supper/
├── _config.yml                    # Jekyll 全局配置
├── Gemfile                        # Ruby 依赖
├── .gitignore                     # Git 忽略规则
│
├── _data/                         # ★ 核心数据文件（运营最常操作）
│   ├── resources.yml              #   学习资源数据
│   ├── announcements.yml          #   公告数据
│   ├── contributors.yml           #   贡献者数据
│   ├── navigation.yml             #   导航栏菜单
│   ├── zju-fun.yml                #   嗨玩榜数据
│   ├── zju-survival.yml           #   生存指南数据
│   ├── moderation.yml             #   内容审核规则配置
│   ├── logs.yml                   #   操作日志
│   └── stats.yml                  #   全站统计数据
│
├── _includes/                     # Jekyll 模板片段
│   ├── head/custom.html           #   <head> 自定义内容（CSS/JS/公告栏）
│   └── footer/custom.html         #   页脚（链接+暗黑模式切换）
│
├── assets/
│   ├── css/
│   │   ├── custom.css             # ★ 全站自定义样式
│   │   └── admin.css              #   管理后台样式
│   └── js/
│       ├── favorites.js           #   收藏夹模块（localStorage）
│       ├── resources.js           #   资源页渲染与筛选
│       ├── admin.js               #   管理后台逻辑
│       ├── image-upload.js        #   图片压缩/Imgbb上传
│       ├── comments.js            #   评论数据模块（CRUD/投票/举报）
│       ├── comment-modal.js       #   评论弹窗UI
│       ├── search-agent.js        #   智能检索Agent
│       ├── recommendations.js     #   资源推荐算法
│       ├── stats.js               #   动态排行榜
│       └── lib/
│           └── filter-resources.js #  纯函数：资源过滤逻辑（可测试）
│
├── 视频课程/                      # 资源类型母文件夹（仅链接，无视频文件）
│   └── [学科分类]/[具体学科]/     #   学科子文件夹
├── 课件讲义/                      # PPT/PDF/Word 等课件
│   └── [学科分类]/[具体学科]/
├── 习题试卷/                      # 真题/习题/答案
│   └── [学科分类]/[具体学科]/
├── 书籍/                          # PDF/电子书（原 books/ 已迁移）
│   └── [学科分类]/[具体学科]/     #   例：计算机科学与技术类/机器学习/
└── 其他/                          # 不属于以上类型的资源
    └── [学科分类]/[具体学科]/
│
├── index.html                     # 首页
├── resources/index.html           # 学习资源页
├── favorites/index.html           # 我的收藏页
├── questions/index.html           # 疑问区页
├── zju-fun/index.html             # 嗨玩榜页
├── zju-survival/index.html        # 生存指南页
├── community/index.html           # 社区页
├── contribute.html                # 贡献指南页
├── admin/index.html               # 管理后台页
├── guide/index.html               # 使用指南页
├── faq.html                       # 常见问题页
├── about/index.html               # 关于我们页
│
├── .github/
│   ├── ISSUE_TEMPLATE/            # GitHub Issue 模板
│   │   ├── config.yml             #   模板配置（禁用空白 Issue）
│   │   ├── ask-question.yml       #   提问模板
│   │   ├── recommend-place.yml    #   推荐好去处模板
│   │   ├── suggest-guide.yml      #   推荐生存指南模板
│   │   ├── submit-resource.yml    #   提交学习资源模板
│   │   └── report.yml             #   举报模板
│   ├── scripts/                   #   GitHub Actions 脚本
│   │   ├── process-issue.js       #     Issue 解析和 YAML 生成
│   │   ├── moderation-check.js    #     内容违规检测
│   │   ├── update-contributors.js #     贡献者积分更新
│   │   └── check-consistency.js   #     数据一致性检查
│   └── workflows/                 #   GitHub Actions 工作流
│       ├── process-submissions.yml #    自动处理提交
│       └── data-consistency.yml   #     数据一致性检查
│
├── __tests__/
│   └── filter-resources.test.js   # filter-resources.js 的测试
└── package.json                   # Node 配置（仅测试用）
```

**标注 ★ 的文件是运营中最高频操作的文件。**

---

## 4. 核心架构：数据驱动模式

理解这个架构是运营本站的关键：

```
┌─────────────┐     Liquid 模板引擎      ┌──────────────┐
│ _data/*.yml │ ──────────────────────▶ │  HTML 页面    │
│  YAML 数据  │   构建时嵌入为 JSON      │  内嵌 <script> │
└─────────────┘                          └──────┬───────┘
                                                │
                                          浏览器加载
                                                │
                                                ▼
┌─────────────┐     调用函数            ┌──────────────┐
│  用户操作   │ ──────────────────────▶ │   JS 模块    │
│ 筛选/搜索   │                        │ 渲染/过滤/排序 │
└─────────────┘                          └──────────────┘
```

### 数据流向示例

以学习资源页为例：

**第 1 步：** 在 `_data/resources.yml` 中定义数据
```yaml
- id: 16
  title: "高等数学（上册）"
  category: 数学
  subcategory: 高等数学
  grade: 大一
  type: 真题
  # ...更多字段
```

**第 2 步：** `resources/index.html` 通过 Liquid 在构建时将数据转为 JS 对象
```html
<script>
const allResources = [
  {% for r in site.data.resources %}
  {
    "id": {{ r.id }},
    "title": "{{ r.title | escape }}",
    "link": "{{ r.link | relative_url }}",
    // ...其他字段
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
</script>
```

**第 3 步：** 浏览器加载页面，`resources.js` 读取 `allResources` 数组并渲染卡片
```javascript
renderResources(allResources);
setupFilters(allResources);
```

**关键点：** 你只需要修改 YAML 数据文件，HTML 和 JS 会自动读取新数据。不需要修改页面代码。

---

## 5. 日常运营操作

### 5.1 添加学习资源

**操作文件：** `_data/resources.yml`

在文件末尾追加一个新条目，格式如下：

```yaml
- id: 16                                    # 递增 ID（当前最大 15）
  title: "高等数学（上册）期末真题"           # 资源标题
  category: 数学                             # 学科分类
  subcategory: 高等数学                      # 具体学科
  grade: 大一                                # 年级
  type: 真题                                 # 资源类型
  uploader: 你的昵称                         # 上传者
  date: 2026-05-15                          # 日期（YYYY-MM-DD）
  downloads: 0                               # 下载次数（初始为 0）
  rating: 4.5                                # 评分（1.0-5.0）
  description: "2025-2026学年高等数学上册期末考试真题及参考答案"  # 描述
  link: "/books/数学/高数上册期末真题.pdf"    # 下载链接（见下方说明）
  tags: [高数, 期末, 真题, 大一]             # 标签数组
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | 整数 | 是 | 唯一标识，递增不重复 |
| `title` | 字符串 | 是 | 资源全名，会显示在卡片上 |
| `category` | 枚举 | 是 | 学科：`数学` / `编程` / `英语` / `物理` / `其他` |
| `subcategory` | 字符串 | 是 | 具体学科，如 `高等数学`、`Python`、`机器学习` |
| `grade` | 枚举 | 是 | 年级：`大一` / `大二` / `大三` / `通用` |
| `type` | 枚举 | 是 | 类型：`真题` / `课件` / `笔记` / `习题` / `书籍` |
| `uploader` | 字符串 | 是 | 上传者昵称 |
| `date` | 日期 | 是 | 格式 `YYYY-MM-DD` |
| `downloads` | 整数 | 是 | 下载量，新资源填 `0` |
| `rating` | 浮点数 | 是 | 评分 1.0-5.0，建议 4.0+ |
| `description` | 字符串 | 是 | 详细描述，50-100 字为宜 |
| `link` | 字符串 | 是 | 下载链接路径（见下方规则） |
| `tags` | 数组 | 是 | 2-5 个关键词标签 |

#### `category` 的可用值及其对应的筛选器

筛选器在 `resources/index.html` 第 19-26 行定义。当前支持的值：
- `数学` — 有筛选选项
- `编程` — 有筛选选项
- `英语` — 有筛选选项
- `物理` — 有筛选选项
- `其他` — 有筛选选项

如需添加新的学科分类（如 `化学`），需要同时修改：
1. `_data/resources.yml` 中的 `category` 值
2. `resources/index.html` 中的 `<select id="category-filter">` 添加 `<option>`
3. `assets/js/resources.js` 中的 `CATEGORY_ACCENTS` 对象添加颜色映射

#### `type` 的可用值及其对应的筛选器

当前筛选器支持：`真题` / `课件` / `笔记` / `习题` / `书籍`

如需添加新类型，同样需要在 `resources/index.html` 的 `<select id="type-filter">` 中添加选项。

#### `link` 字段规则

- **直接托管的 PDF**：`/books/子目录/文件名.pdf`（文件放在 `books/` 目录下）
- **外部链接**：直接填完整 URL，如 `https://example.com/file.pdf`

> **重要：** link 路径在 `resources/index.html` 中会通过 `| relative_url` 过滤器自动加上 baseurl 前缀。你只需填 `/books/...` 开头的路径，不要手动加 `/The-Last-Supper`。

---

### 5.2 上传 PDF 文件

**操作目录：** `books/`

1. 在 `books/` 下创建子目录（如 `books/数学/`、`books/编程/`）
2. 将 PDF 文件放入对应目录
3. 文件名尽量使用英文和短横线，避免空格（如 `advanced-math-2026.pdf`）
4. 在 `_data/resources.yml` 中的 `link` 字段填写路径：`/books/数学/advanced-math-2026.pdf`

**注意事项：**
- GitHub 单个文件大小限制 100MB
- 仓库总大小建议不超过 1GB（GitHub Pages 限制）
- 文件名中的中文和空格在 URL 中会被编码，可能导致 404，建议用英文命名

---

### 5.3 管理公告

**操作文件：** `_data/announcements.yml`

公告显示在全站顶部的固定横幅中。控制逻辑在 `_includes/head/custom.html`。

```yaml
- title: "新学期资料征集"
  date: 2026-05-15
  content: "欢迎上传各科复习资料！"
  pinned: true    # true = 高优先级，关闭后仍会在24h后重新显示
```

#### 公告显示规则

- **pinned: true** — 置顶公告，用户关闭后 24 小时会重新出现
- **pinned: false** — 普通公告，用户关闭后 24 小时内不再显示任何普通公告
- 多个 pinned 公告时，取第一个（YAML 中最靠前的）
- 无 pinned 公告时，取日期最新的一条

#### 操作指南

| 操作 | 方法 |
|------|------|
| 发布新公告 | 在文件**开头**插入新条目（最新在最前） |
| 置顶公告 | 设置 `pinned: true` |
| 取消置顶 | 改为 `pinned: false` |
| 下线公告 | 直接删除该条目 |

---

### 5.4 管理贡献者排行榜

**操作文件：** `_data/contributors.yml`

```yaml
- name: 新同学
  github: new-github-username
  avatar: https://github.com/new-github-username.png
  resources: 5
  answers: 10
  points: 80               # 手动计算：resources×10 + answers×5
  join_date: "2026-05"
  bio: "擅长Python编程"
```

#### 积分规则（在 faq.html 中定义）

| 行为 | 积分 |
|------|------|
| 上传资源 | +10 |
| 回答问题 | +5 |
| 回答被采纳 | +15 |

#### 字段说明

| 字段 | 说明 |
|------|------|
| `name` | 显示名称 |
| `github` | GitHub 用户名（用于生成头像 URL） |
| `avatar` | 头像 URL。格式：`https://github.com/{用户名}.png` |
| `resources` | 贡献的资源数 |
| `answers` | 回答的问题数 |
| `points` | 总积分（页面会按此字段降序排列） |
| `join_date` | 加入日期，格式 `"YYYY-MM"` |
| `bio` | 个人简介，约 20 字 |

排行榜在 `contribute.html` 和 `community/index.html` 中展示，按 `points` 降序排列。前三名会显示奖杯/奖章图标。

---

### 5.5 管理导航栏

**操作文件：** `_data/navigation.yml`

```yaml
main:
  - title: "首页"
    url: /
  - title: "学习资源"
    url: /resources/
  # 添加新页面：
  - title: "新页面"
    url: /new-page/
```

Minimal Mistakes 主题会自动读取此文件生成顶部导航菜单。添加新页面后，在这里加一行即可出现在导航中。

---

### 5.6 管理嗨玩榜（美食推荐）

**操作文件：** `_data/zju-fun.yml`

```yaml
- id: 60
  name: "新推荐店铺"
  category: 美食              # 美食/外卖/奶茶咖啡/约会聚餐/景点/娱乐/超市便利店
  subcategory: 中餐
  rating: 4.5
  like_count: 0
  address: "紫金港校区xxx"
  description: "推荐理由..."
  recommender: 你的昵称
  date: 2026-05-15
  image: ""                   # 图片 URL（可留空）
  tags: [美食, 中餐]
  opening_hours: "10:00-22:00"
  price: "人均30元"
```

用户也可以通过 GitHub Issue 的「推荐好去处」模板提交推荐，管理员审核后手动添加到此文件。

**category 的可用值：** `美食` / `外卖` / `奶茶咖啡` / `约会聚餐` / `景点` / `娱乐` / `超市便利店`

如需添加新分类，需同时修改 `zju-fun/index.html` 中的分类筛选器。

---

### 5.7 管理生存指南

**操作文件：** `_data/zju-survival.yml`

此文件包含三个部分：

#### categories（分类）

```yaml
categories:
  - id: freshman
    name: 新生必看
    icon: fas fa-graduation-cap
    emoji: 🎓
```

#### guides（指南条目）

```yaml
guides:
  - title: "指南标题"
    category: freshman         # 对应 categories 中的 id
    source: CC98               # CC98/官网/学长学姐整理
    description: "简介..."
    url: "https://..."
    tags: [新生, 报到]
    date: 2026-05-15
    need_intranet: false       # 是否需要校内网
```

#### websites（快捷网站）

```yaml
websites:
  - name: 网站名称
    icon: fas fa-globe         # Font Awesome 图标类名
    description: "简介..."
    url: "https://..."
    category: 教务类           # 教务类/学习类/生活类/工具类
```

用户通过 GitHub Issue 的「推荐生存指南资源」模板提交推荐。

---

### 5.8 处理用户提问（Issues）

疑问区从 GitHub Issues API 实时拉取数据。管理流程：

1. **用户提问** → 自动创建 Issue，标签 `question` + `unanswered`
2. **有人回答** → 在 Issue 中评论讨论
3. **标记已回答** → 给 Issue 添加 `answered` 标签，移除 `unanswered` 标签
4. **问题解决** → 关闭 Issue

**在 GitHub 上操作标签：**
- 进入 Issue 页面 → 右侧 Labels 区域
- 添加 `answered` 标签 → 疑问区显示绿色「已回答」
- 移除 `unanswered` 标签 → 清理状态

**页面会自动同步：** 疑问区通过 GitHub API 实时获取 Issue 数据，缓存 5 分钟在 sessionStorage 中。

---

## 6. 添加新功能页面

假设你要添加一个「考研专区」页面：

### 第 1 步：创建页面文件

创建 `kaoyan/index.html`：

```html
---
layout: single
title: 考研专区
permalink: /kaoyan/
author_profile: false
---

<h2 class="section-title"><i class="fas fa-graduation-cap"></i> 考研专区</h2>

<p style="color:var(--text-light);line-height:1.7;margin-bottom:2rem;">
  这里汇集考研相关资源和经验分享。
</p>

<!-- 你的页面内容 -->
```

### 第 2 步：（可选）创建数据文件

如果需要管理数据，创建 `_data/kaoyan.yml`：

```yaml
- id: 1
  title: "2026考研数学真题"
  # ...其他字段
```

然后在页面中通过 Liquid 嵌入：

```html
<script>
const allKaoyanData = [
  {% for item in site.data.kaoyan %}
  {
    "id": {{ item.id }},
    "title": "{{ item.title | escape }}"
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];
</script>
```

### 第 3 步：添加导航

编辑 `_data/navigation.yml`，在 `main` 下添加：

```yaml
  - title: "考研专区"
    url: /kaoyan/
```

### 第 4 步：（可选）添加样式

如果需要特殊样式，在 `assets/css/custom.css` 末尾添加。**务必使用 CSS 变量**（如 `var(--card-bg)`），以确保暗黑模式兼容。

### 第 5 步：部署

```bash
git add kaoyan/ _data/kaoyan.yml _data/navigation.yml
git commit -m "feat: 添加考研专区页面"
git push origin main
```

---

## 7. CSS 样式系统

### 7.1 CSS 变量

所有颜色和效果都通过 CSS 自定义属性定义（`assets/css/custom.css` 前 55 行）。

**亮色模式（`:root`）：**

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--primary-color` | `#2563eb` | 主色调（蓝色） |
| `--primary-hover` | `#1d4ed8` | 主色 hover 状态 |
| `--primary-light` | `#dbeafe` | 主色浅色背景 |
| `--accent-color` | `#f59e0b` | 强调色（琥珀色） |
| `--success-color` | `#10b981` | 成功状态（绿色） |
| `--warning-color` | `#f59e0b` | 警告状态 |
| `--danger-color` | `#ef4444` | 危险/错误（红色） |
| `--bg-color` | `#ffffff` | 页面背景 |
| `--bg-alt` | `#f8fafc` | 次要背景色 |
| `--card-bg` | `#ffffff` | 卡片背景 |
| `--text-color` | `#1e293b` | 正文颜色 |
| `--text-light` | `#64748b` | 次要文字 |
| `--text-lighter` | `#94a3b8` | 更浅文字 |
| `--border-color` | `#e2e8f0` | 边框颜色 |
| `--shadow` | `0 1px 3px...` | 基础阴影 |
| `--shadow-md` | `0 4px 6px...` | 中等阴影 |
| `--shadow-lg` | `0 10px 25px...` | 大阴影 |
| `--transition` | `all 0.25s ease` | 默认过渡动画 |
| `--radius` | `8px` | 圆角半径 |
| `--tag-bg` | `#f1f5f9` | 标签背景 |
| `--tag-color` | `#475569` | 标签文字 |

**暗黑模式（`[data-theme="dark"]`）：** 自动覆盖以上变量为暗色值。

### 7.2 添加新样式

```css
/* 在 custom.css 末尾添加 */

.my-new-component {
  background-color: var(--card-bg);    /* 用变量，不要硬编码颜色 */
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: var(--transition);
}

/* 流式响应式：用 clamp() 不用媒体查询 */
.my-new-component h3 {
  font-size: clamp(1rem, 1.3vw, 1.3rem);
}

.my-new-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(240px, 30vw, 320px), 1fr));
  gap: clamp(1rem, 2vw, 2rem);
}
```

### 7.3 样式规范

1. **永远使用 CSS 变量** — 不要硬编码颜色值，确保暗黑模式兼容
2. **用 `clamp()` 实现响应式** — 不要用固定像素断点式媒体查询
3. **唯一的硬断点：600px** — 用于侧边栏折叠等必须的布局变化
4. **触摸目标最小 40px** — 所有可点击元素的最小尺寸
5. **参考现有组件** — 复用 `.card`、`.tag`、`.btn-primary` 等已有类

---

## 8. JavaScript 模块说明

### 8.1 `assets/js/favorites.js`

**职责：** 收藏夹功能（localStorage）

```javascript
// 全局暴露 Favorites 对象
Favorites.getAll()           // 返回所有收藏的资源 ID 数组
Favorites.isFavorited(1)     // ID 为 1 的资源是否已收藏
Favorites.toggle(1)          // 切换收藏状态，返回 true/false
Favorites.count()            // 收藏数量
Favorites.remove(1)          // 移除收藏
```

- 存储 key：`tls_favorites`
- 纯前端，无后端

### 8.2 `assets/js/lib/filter-resources.js`

**职责：** 资源过滤逻辑（纯函数，可测试）

```javascript
// 浏览器中作为全局函数使用
filterResources(resources, {
  category: '数学',     // 或 'all'
  grade: '大一',       // 或 'all'
  type: '真题',        // 或 'all'
  term: '期末'         // 搜索关键词（可选）
});
// 返回过滤后的资源数组
```

- 同时支持 Node.js（UMD 导出，用于 Jest 测试）
- 修改此文件后需运行 `npm test` 验证

### 8.3 `assets/js/resources.js`

**职责：** 资源页的渲染和筛选交互

关键函数：
- `buildCardHTML(r)` — 生成单个资源卡片的 HTML
- `renderResources(resources)` — 渲染资源列表
- `setupFilters(resources)` — 绑定筛选器事件

**颜色映射：** `CATEGORY_ACCENTS` 对象定义了每个学科分类的渐变色。添加新分类时需要在这里添加：

```javascript
var CATEGORY_ACCENTS = {
  '数学': ['#6366f1', '#818cf8'],
  '编程': ['#10b981', '#34d399'],
  '英语': ['#f59e0b', '#fbbf24'],
  '物理': ['#ef4444', '#f87171'],
  '化学': ['#06b6d4', '#22d3ee'],  // ← 新增分类
  '其他': ['#8b5cf6', '#a78bfa']
};
```

### 8.4 `assets/js/image-upload.js`

**职责：** 图片压缩、WebP转换、Imgbb API上传

```javascript
ImageUpload.getApiKey()                    // 获取 API Key（优先 localStorage，fallback 默认 key）
ImageUpload.setApiKey('xxx')               // 设置自定义 API Key
ImageUpload.compressImage(file, callback)  // 压缩图片（最大1200px，WebP）
ImageUpload.blobToBase64(blob, callback)   // Blob 转 Base64
ImageUpload.uploadToImgbb(source, cb, opts) // 上传到 Imgbb
// source: Blob/base64/URL
// opts: { name: '文件名', expiration: 60-15552000 }
// cb: function(result) — result = { url, display_url, thumb_url, medium_url, delete_url, id }
ImageUpload.handleFileSelect(files, onProgress, onComplete) // 多文件处理
ImageUpload.createDropZone(container, onComplete, maxFiles) // 拖拽上传UI
```

- **Imgbb API v1：** `POST https://api.imgbb.com/1/upload`，参数 key + image(base64)
- 默认 API Key 已内置，管理员可自定义覆盖
- 存储 key：`tls_imgbb_key`

### 8.5 `assets/js/comments.js`

**职责：** 评论数据模块（CRUD、投票、举报）

```javascript
Comments.getComments(placeId, page)        // 分页获取评论（20条/页）
Comments.addComment(placeId, nick, content) // 添加评论（验证+XSS防护）
Comments.getCommentCount(placeId)          // 评论数
Comments.canVote(commentId)                // 检查24h投票限制
Comments.getVoteType(commentId)            // 获取投票类型（like/dislike/null）
Comments.vote(commentId, placeId, type)    // 投票（支持取消/切换）
Comments.report(commentId, placeId, reason, detail, nick, content) // 举报
Comments.getReports()                      // 获取所有举报
Comments.deleteReport(index)               // 删除举报记录
```

- 存储 keys：`tls_comments`, `tls_comment_votes`, `tls_comment_reports`
- 投票有效期 24 小时，过期自动清除

### 8.6 `assets/js/comment-modal.js`

**职责：** 评论弹窗UI

```javascript
CommentModal.open(placeId, placeName)      // 打开评论弹窗
CommentModal.close()                       // 关闭弹窗
```

- 弹窗结构：头部（标题+计数）、表单（昵称+内容+字数统计）、评论列表（无限滚动）、举报子模态

### 8.7 `assets/js/search-agent.js`

**职责：** 智能检索Agent（悬浮角色+聊天面板）

```javascript
SearchAgent.init()                         // 初始化：创建悬浮按钮和事件绑定
```

- 搜索数据源：`tlsPlacesIndex`（head/custom.html 注入）或 `allPlaces`
- 匹配字段：name, description, address, category, tags
- 快捷按钮：附近推荐、热门榜单、最新添加、随机推荐
- CSS 纯绘制角色：呼吸动画、眨眼动画、阴影脉冲

### 8.8 其他页面的内联 JS

以下页面有内联 JavaScript（不单独提取为文件）：

| 页面 | 内联 JS 功能 |
|------|-------------|
| `questions/index.html` | GitHub Issues API 数据获取、筛选、渲染 |
| `zju-fun/index.html` | 嗨玩榜数据渲染、筛选、点赞、图片轮播、评论按钮、Agent初始化 |
| `zju-survival/index.html` | 生存指南数据渲染、筛选、搜索高亮 |
| `favorites/index.html` | 收藏列表渲染、取消收藏 |
| `_includes/head/custom.html` | 公告栏逻辑、暗黑模式预加载、tlsPlacesIndex 注入 |
| `_includes/footer/custom.html` | 暗黑模式切换按钮 |
| `contribute.html` | 资源上传向导（类型选择→学科选择→提交指引） |

---

## 9. 配置文件详解

### `_config.yml`

```yaml
# 必须正确配置的字段
url: "https://sitisaniyah-art.github.io"  # GitHub Pages 的域名
baseurl: "/The-Last-Supper"               # 仓库名前加 /

# 如果你 fork 到自己的仓库，需要修改：
#   url: "https://你的用户名.github.io"
#   baseurl: "/你的仓库名"
#   github_username: "你的用户名"
#   github_repo: "你的仓库名"
```

**同时需要修改的地方：**
- `_config.yml` 中的 4 个字段
- `.github/ISSUE_TEMPLATE/` 下所有文件中的 `sitisaniyah-art` 和仓库名
- `_includes/footer/custom.html` 中的 GitHub 链接
- `questions/index.html` 中通过 `site.github_username` 自动获取（无需修改）
- `contribute.html` 中通过 `site.github_username` 自动获取（无需修改）

### `Gemfile`

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins  # GitHub Pages 全家桶
gem "jekyll-remote-theme"                    # 远程主题支持
```

一般不需要修改。

### `.gitignore`

```
_site/              # Jekyll 构建输出
.sass-cache/        # Sass 缓存
.jekyll-cache/      # Jekyll 缓存
vendor/             # Ruby 依赖
Gemfile.lock        # 锁定文件
node_modules/       # Node 依赖
package-lock.json   # Node 锁定文件
.DS_Store           # macOS 系统文件
```

---

## 10. 部署与发布流程

### 标准发布流程

```bash
# 1. 创建功能分支（推荐）
git checkout -b feature/my-change

# 2. 修改文件
#    编辑 _data/resources.yml, 添加 PDF 等

# 3. 本地测试
bundle exec jekyll serve
# 访问 http://localhost:4000/The-Last-Supper/ 检查效果

# 4. 提交
git add -A
git commit -m "feat: 添加xxx资源"

# 5. 推送到 GitHub
git push origin feature/my-change

# 6. 创建 Pull Request
#    在 GitHub 网页上操作，审核后合并到 main
```

### 快速发布（直接推 main）

```bash
git add -A
git commit -m "update: 更新xxx"
git push origin main
```

### 推送后

- GitHub Pages 会自动构建（通常 1-5 分钟）
- 构建日志：仓库 Settings → Pages → 查看部署状态
- 构建完成后访问 `https://sitisaniyah-art.github.io/The-Last-Supper/`

### 大文件注意事项

- GitHub 单文件限制 100MB
- 如果 PDF 文件很大，推送可能超时。建议稳定网络下操作
- 如遇网络问题，可以先推代码再单独传文件

---

## 11. 常见问题排查

### 页面空白 / 未更新

| 原因 | 解决 |
|------|------|
| GitHub Pages 构建失败 | 检查 Actions 页面的构建日志 |
| YAML 语法错误 | 在线 YAML 校验器验证 `_data/*.yml` |
| 缓存 | 强制刷新浏览器（Ctrl+Shift+R） |

### YAML 语法错误

常见错误：
```yaml
# 错误：缩进不一致（混用空格和 Tab）
- id: 1
	title: "测试"    # ← Tab 缩进，会报错

# 正确：统一用 2 个空格
- id: 1
  title: "测试"

# 错误：特殊字符未转义
title: "周志华《机器学习》"   # 中文书名号在 YAML 中可能有问题

# 正确：用引号包裹
title: "周志华《机器学习》"

# 错误：冒号后缺少空格
- id:1

# 正确
- id: 1
```

验证方法：
```bash
# 用 Ruby 验证 YAML
ruby -ryaml -e "YAML.load_file('_data/resources.yml'); puts 'OK'"
```

### 下载链接 404

| 原因 | 解决 |
|------|------|
| PDF 文件路径错误 | 检查 `books/` 目录下的实际文件名 |
| link 字段缺少 `/books/` 前缀 | 确保路径以 `/books/` 开头 |
| 文件名含空格/中文导致编码问题 | 改用英文短横线命名 |
| 文件未提交到仓库 | `git add` 并推送文件 |

### 暗黑模式不生效

- 检查 CSS 中是否使用了硬编码颜色而非 `var(--xxx)` 变量
- 检查 `_includes/head/custom.html` 中的暗黑模式预加载脚本是否被修改

### 疑问区不显示问题

- 检查 GitHub Issues 中是否有 `question` 标签的 Issue
- 检查浏览器控制台是否有 API 错误（403 = 速率限制）
- GitHub API 未认证时每小时 60 次请求限制

---

## 12. 扩展功能指南

### 12.1 添加新的学科分类

需要修改 4 个文件：

1. **`_data/resources.yml`** — 新资源使用新的 `category` 值
2. **`resources/index.html`** — 在 `<select id="category-filter">` 中添加 `<option value="化学">化学</option>`
3. **`assets/js/resources.js`** — 在 `CATEGORY_ACCENTS` 中添加颜色：
   ```javascript
   '化学': ['#06b6d4', '#22d3ee'],
   ```
4. **`assets/css/custom.css`** — （可选）如果需要特殊样式

### 12.2 添加新的资源类型

需要修改 2 个文件：

1. **`resources/index.html`** — 在 `<select id="type-filter">` 中添加 `<option value="试卷">试卷</option>`
2. **`_data/resources.yml`** — 新资源使用新的 `type` 值

### 12.3 添加新的 Issue 模板

在 `.github/ISSUE_TEMPLATE/` 下创建新的 `.yml` 文件：

```yaml
name: 模板名称
description: 模板描述
title: "[前缀] "
labels: ["label1"]
assignees: ["sitisaniyah-art"]

body:
  - type: input
    id: field-name
    attributes:
      label: 字段标签
      placeholder: 提示文字
    validations:
      required: true
```

完整字段类型参考 [GitHub Issue 表单语法](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)。

### 12.4 添加新的筛选维度

以在资源页添加「学期」筛选为例：

1. **`_data/resources.yml`** — 每个资源添加 `semester` 字段
2. **`resources/index.html`** — 添加筛选器 HTML：
   ```html
   <div class="filter-group">
     <label>学期：</label>
     <select id="semester-filter">
       <option value="all">全部学期</option>
       <option value="大一上">大一上</option>
       <option value="大一下">大一下</option>
     </select>
   </div>
   ```
3. **`assets/js/lib/filter-resources.js`** — 添加学期过滤逻辑
4. **`assets/js/resources.js`** — 在 `setupFilters()` 中绑定新筛选器事件
5. **`__tests__/filter-resources.test.js`** — 添加对应的测试用例

### 12.5 修改站点主题颜色

编辑 `assets/css/custom.css` 中的 `:root` 变量：

```css
:root {
  --primary-color: #8b5cf6;    /* 改为紫色 */
  --primary-hover: #7c3aed;
  --primary-light: #ede9fe;
  /* ...同步修改暗黑模式的对应值 */
}
```

### 12.6 修改页脚

编辑 `_includes/footer/custom.html`。

### 12.7 修改首页

编辑 `index.html`。首页使用 Minimal Mistakes 的 `single` 布局，内容为纯 HTML。

---

## 附录：Liquid 模板语法速查

```liquid
<!-- 变量输出 -->
{{ site.title }}
{{ page.title }}
{{ variable | escape }}         <!-- HTML 转义 -->
{{ variable | relative_url }}   <!-- 添加 baseurl 前缀 -->
{{ variable | jsonify }}        <!-- 转为 JSON -->
{{ variable | default: false }} <!-- 默认值 -->

<!-- 循环 -->
{% for item in site.data.resources %}
  {{ item.title }}
{% endfor %}

<!-- 条件 -->
{% if variable %}
  ...
{% elsif other_variable %}
  ...
{% else %}
  ...
{% endif %}

<!-- 排序 -->
{% assign sorted = site.data.contributors | sort: "points" | reverse %}

<!-- 过滤 -->
{% unless forloop.last %},{% endunless %}
```

---

## 附录：Git 操作速查

```bash
# 日常更新
git add -A
git commit -m "描述性的提交信息"
git push origin main

# 创建功能分支
git checkout -b feature/描述

# 同步远程最新代码
git pull --rebase origin main

# 查看状态
git status
git log --oneline -5

# 撤销未提交的修改
git checkout -- 文件路径

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1
```

---

## 附录：新功能说明（2026-05-15 更新）

### 登录系统

**如何使用：**
1. 点击页脚的 "登录" 按钮
2. 输入 GitHub 用户名即可登录（无需密码）
3. 可选填 Personal Access Token（gist 权限）启用跨设备同步
4. 登录后收藏、点赞等数据与 GitHub 账号关联

**技术细节：**
- 用户名验证：调用 `api.github.com/users/{username}` 验证用户存在
- 数据存储：`tls_userdata_{username}` localStorage key
- Gist 同步：查找/创建 description 为 `the-last-supper-data` 的私有 Gist
- 相关文件：`assets/js/auth.js`, `_includes/auth-modal.html`

### 点赞系统

**数据结构：**
- 未登录：`tls_zju_likes = { [id]: true }`
- 已登录：`tls_zju_likes = { [id]: ["user1", "user2"] }`
- 自动迁移旧格式数据

### 下载量统计

**工作原理：**
- 基础下载量来自 `_data/resources.yml` 中的 `downloads` 字段
- 用户点击下载时，`tls_downloads` localStorage 自动 +1
- 显示值 = 基础值 + 本地累计值

### 资源评分

**如何使用：**
- 在资源卡片上 hover 星星可预览评分
- 点击星星提交 1-5 分评分
- 评分存储在 `tls_ratings` localStorage key
- 显示"我的评分"标记

### 资源推荐

**算法：**
- 基于收藏资源的标签权重匹配
- 同品类资源加分
- 返回得分最高的 N 个未收藏资源
- 相关文件：`assets/js/recommendations.js`

### Service Worker 离线支持

- 首次访问时自动缓存静态资源
- 离线时显示降级页面
- 策略：network-first，离线回退 cache
- 相关文件：`sw.js`, `offline.html`

### 页面加载进度条

- 固定在页面顶部 3px 渐变条
- 页面加载 30%，`window.load` 时 100% 后消失
- 实现在 `_includes/head/custom.html`

---

## 13. GitHub Actions 自动化

### Issue 自动处理流程

当用户通过 Issue 模板提交资源推荐或生存指南时，会自动触发 GitHub Actions：

**工作流文件：** `.github/workflows/process-submissions.yml`

**处理流程：**
1. 内容审核（`moderation-check.js`）— 关键词检测、链接安全、垃圾检测
2. 解析 Issue 字段（`process-issue.js`）— 提取表单数据，验证必填项
3. 更新贡献者积分（`update-contributors.js`）— 资源+10，指南+5
4. 创建分支 + PR — 等待管理员手动合并

**审核不通过：** Issue 自动关闭并回复原因
**审核通过：** 创建 `auto/submission-{number}` 分支和 PR

### 内容审核规则

配置文件：`_data/moderation.yml`

- `blocked_keywords` — 违禁关键词列表
- `blocked_domains` — 屏蔽域名
- `allowed_domains` — 允许域名白名单
- `min_description_length` / `max_description_length` — 描述长度限制

### 数据一致性检查

**工作流文件：** `.github/workflows/data-consistency.yml`

每周一自动运行，检查：
- zju-fun.yml 中 ID 是否有重复
- contributors.yml 中贡献者是否与资源上传者匹配
- 积分数值是否正确
- 自动更新 stats.yml 统计数据

---

## 14. 用户举报功能

每张资源卡片底部有举报按钮（旗帜图标），点击后跳转到 GitHub Issue 模板页面：
- 模板：`.github/ISSUE_TEMPLATE/report.yml`
- 标签：`report`
- 字段：举报内容类型、标题/ID、举报类型、详细原因

管理员在 GitHub Issues 中查看和处理举报。

---

## 15. 管理员后台

访问 `/admin/` 页面，输入密码 `ZJUNB` 进入管理面板。

**功能 Tab：**
- **数据概览** — 资源总数、下载量、平均评分、贡献者数、分类分布
- **举报管理** — 读取 GitHub 上带 `report` label 的 Issues
- **操作日志** — 显示 `_data/logs.yml` 中的操作记录
- **资源管理** — 搜索和查看所有资源
- **嗨玩项目** — 管理嗨玩榜项目图片（编辑/上传/删除），支持 Imgbb 上传和 URL 粘贴
- **评论举报** — 查看和处理用户提交的评论举报（本地存储）

**注意：** 密码验证在前端 JS 中进行，密码存储在 `assets/js/admin.js` 中。适合小团队使用，不适合高安全要求场景。

---

## 16. 滚动公告栏

页面顶部固定显示一个滚动动态栏，内容包括：
- 置顶公告
- 最新 3 条资源
- 热门 3 条资源（按下载量）

**实现：** `_includes/head/custom.html` 中的 CSS `@keyframes` 动画
**特性：** 鼠标悬停暂停、自适应滚动速度、暗黑模式兼容

---

## 17. 嗨玩榜图片管理系统

### 功能概述

嗨玩榜（zju-fun）卡片支持多图轮播，管理员可在后台编辑项目图片。

### 数据存储

- **Key：** `tls_zju_images`（localStorage）
- **格式：** `{ "1": ["url1", "url2"], "4": ["url3"] }`
- 最多 5 张/项目，第一张为封面
- 无数据时回退到 `zju-fun.yml` 的 `image` 字段

### 卡片轮播

- 左右箭头 + 底部点指示器 + 图片计数标签
- 支持触摸滑动切换（touchstart/touchend）
- 图片切换有 opacity 渐变过渡

### Imgbb 上传

- 管理后台点击"编辑图片"弹出编辑器
- 支持：URL 粘贴 / 拖拽上传 / 文件选择
- 上传流程：文件 → Canvas 压缩（最大 1200px） → WebP → Imgbb API → 返回 URL
- 默认 API Key 已内置，管理员可自定义

### 用户图片提交

用户可通过推荐 Issue 模板提交图片 URL（每行一个，最多 3 张）。

---

## 18. 评论系统

### 功能概述

嗨玩榜每个地点支持独立评论，无需登录，使用昵称+内容发表。

### 数据存储

| Key | 用途 |
|-----|------|
| `tls_comments` | `{[placeId]: Comment[]}` — 评论数据 |
| `tls_comment_votes` | `{[commentId]: {type, time}}` — 24h 投票限制 |
| `tls_comment_reports` | `Report[]` — 评论举报 |

### 功能特性

- **分页加载** — 20条/页，无限滚动
- **点赞/踩** — 24小时内可切换/取消，超时后可重新投票
- **动画效果** — 点赞爱心飘出动画、踩抖动动画
- **举报** — 二级模态框，选择理由+补充说明
- **XSS 防护** — `textContent` → `innerHTML` 转义
- **管理** — 管理后台"评论举报"Tab 可查看和忽略举报

### 使用方式

点击嗨玩榜卡片底部的评论图标（气泡），弹出评论弹窗。

---

## 19. 智能检索 Agent

### 功能概述

全站右下角悬浮一个小助手角色，点击展开聊天面板，支持关键词搜索嗨玩榜地点。

### CSS 角色

- 蓝紫渐变圆形身体
- 白色眼睛 + 4s 眨眼动画
- 微笑嘴巴
- 3s 呼吸动画 + 阴影脉冲
- 默认半透明（0.6），hover 全透明 + 放大

### 聊天面板

- **搜索逻辑** — 匹配 name, description, address, category, tags，按评分排序，最多返回 8 条
- **快捷按钮** — 附近推荐（随机5条）、热门榜单（按点赞）、最新添加、随机推荐
- **思考动画** — 3个弹跳圆点
- **结果卡片** — 名称+评分+简介，点击跳转高德地图导航

### 数据源

- `_includes/head/custom.html` 注入 `tlsPlacesIndex` 全局变量
- 轻量级数据：id, name, category, rating, address, description, tags
- fallback：页面内联 `allPlaces` 变量

### 响应式

| 设备 | 角色大小 | 面板宽度 |
|------|---------|---------|
| 桌面 (>768px) | 80×80px | 360px |
| iPad (768px) | 60×60px | calc(100vw-32px) |
| 手机 (<480px) | 50×50px | calc(100vw-32px) |

---

## 20. 资源目录结构

### 目录规范

资源按 **类型 + 学科** 两级分类存放，共 5 个母文件夹，7 个学科大类，36 个具体学科。

**母文件夹：** 视频课程、课件讲义、习题试卷、书籍、其他

**学科大类：** 数学与统计类（7）、计算机科学与技术类（10）、电子信息与电气工程类（7）、机械与能源工程类（9）、材料科学与工程类（2）、人文社科与公共基础类（6）、综合类（1）

### 视频课程规则

**本仓库不存储视频文件**，仅存放链接文件。格式：

```
课程名称：高等数学（上）
主讲人：张三老师
链接地址：https://pan.baidu.com/s/xxx
提取码：abcd
有效期：永久
```

### 书籍命名建议

`书名_作者_出版社_版本号.pdf`

例如：`机器学习_周志华_清华大学出版社_第2版.pdf`

### 用户上传引导

`contribute.html` 页面包含交互式上传向导：
1. 选择资源类型（视频/课件/习题/书籍/其他）
2. 选择学科分类（36个学科）
3. 显示对应的提交指南和文件夹路径
4. 提供 Issue 提交链接

---

> **最后更新：2026-05-15**
> **维护者：sitisaniyah-art**
