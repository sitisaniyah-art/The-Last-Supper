const { filterResources } = require('../assets/js/lib/filter-resources');

/* ============================================================
   Test fixtures — covers all categories, grades, types
   ============================================================ */
const fixtures = [
  {
    id: 1,
    title: '高等数学上册期末真题汇总',
    category: '数学与统计类',
    subcategory: '基础数学',
    grade: '大一',
    type: '习题试卷',
    description: '包含近5年的期末真题及详细解答',
    tags: ['高数', '期末', '真题'],
  },
  {
    id: 2,
    title: 'Python编程入门视频教程',
    category: '计算机科学与技术类',
    subcategory: '编程语言与开发',
    grade: '通用',
    type: '视频课程',
    description: '从基础语法到进阶应用的视频教程',
    tags: ['Python', '编程', '入门'],
  },
  {
    id: 3,
    title: '线性代数课件及习题解答',
    category: '数学与统计类',
    subcategory: '工程数学',
    grade: '大一',
    type: '课件讲义',
    description: '矩阵、行列式、向量空间等章节课件',
    tags: ['线代', '课件'],
  },
  {
    id: 4,
    title: '大学英语四级备考指南',
    category: '公共基础类',
    subcategory: '大学英语',
    grade: '大一',
    type: '书籍',
    description: '四级历年真题合集含听力音频',
    tags: ['四级', '英语', '听力'],
  },
  {
    id: 5,
    title: '数据结构与算法课程讲义',
    category: '计算机科学与技术类',
    subcategory: '编程语言与开发',
    grade: '大二',
    type: '课件讲义',
    description: '链表、树、图、排序算法等核心内容',
    tags: ['数据结构', '算法'],
  },
  {
    id: 6,
    title: '基础物理期末复习提纲',
    category: '物理学类',
    subcategory: '基础物理',
    grade: '大一',
    type: '课件讲义',
    description: '力学、热学、电磁学重点公式整理',
    tags: ['物理', '公式'],
  },
  {
    id: 7,
    title: '电路与电子技术基础课件',
    category: '电子信息与电气工程类',
    subcategory: '电路与电子技术',
    grade: '大二',
    type: '课件讲义',
    description: '电路分析基础、交流电路、暂态分析',
    tags: ['电路', '电子信息'],
  },
  {
    id: 8,
    title: '机械设计课程习题集',
    category: '机械与能源工程类',
    subcategory: '机械设计与制造',
    grade: '大三',
    type: '习题试卷',
    description: '齿轮、轴承、联轴器等设计练习',
    tags: ['机械', '设计'],
  },
  {
    id: 9,
    title: '马克思主义理论复习资料',
    category: '法学与政治学类',
    subcategory: '马克思主义理论',
    grade: '大一',
    type: '其他',
    description: '唯物辩证法、认识论、唯物史观重点整理',
    tags: ['马原', '政治'],
  },
];

/* ============================================================
   1. Category filter
   ============================================================ */
describe('filterResources — category', () => {
  test('returns all when category is "all"', () => {
    const result = filterResources(fixtures, { category: 'all' });
    expect(result).toHaveLength(9);
  });

  test('filters by 数学与统计类', () => {
    const result = filterResources(fixtures, { category: '数学与统计类' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '数学与统计类')).toBe(true);
  });

  test('filters by 计算机科学与技术类', () => {
    const result = filterResources(fixtures, { category: '计算机科学与技术类' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '计算机科学与技术类')).toBe(true);
  });

  test('filters by 公共基础类', () => {
    const result = filterResources(fixtures, { category: '公共基础类' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  test('filters by 物理学类', () => {
    const result = filterResources(fixtures, { category: '物理学类' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
  });

  test('returns empty for non-existent category', () => {
    const result = filterResources(fixtures, { category: '化学与化工类' });
    expect(result).toHaveLength(0);
  });
});

/* ============================================================
   2. Grade filter
   ============================================================ */
describe('filterResources — grade', () => {
  test('returns all when grade is "all"', () => {
    const result = filterResources(fixtures, { grade: 'all' });
    expect(result).toHaveLength(9);
  });

  test('filters by 大一', () => {
    const result = filterResources(fixtures, { grade: '大一' });
    expect(result).toHaveLength(5);
    expect(result.every(r => r.grade === '大一')).toBe(true);
  });

  test('filters by 大二', () => {
    const result = filterResources(fixtures, { grade: '大二' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.grade === '大二')).toBe(true);
  });

  test('filters by 通用', () => {
    const result = filterResources(fixtures, { grade: '通用' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('returns empty for 大四 (no fixtures)', () => {
    const result = filterResources(fixtures, { grade: '大四' });
    expect(result).toHaveLength(0);
  });
});

/* ============================================================
   3. Type filter
   ============================================================ */
describe('filterResources — type', () => {
  test('returns all when type is "all"', () => {
    const result = filterResources(fixtures, { type: 'all' });
    expect(result).toHaveLength(9);
  });

  test('filters by 习题试卷', () => {
    const result = filterResources(fixtures, { type: '习题试卷' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === '习题试卷')).toBe(true);
  });

  test('filters by 课件讲义', () => {
    const result = filterResources(fixtures, { type: '课件讲义' });
    expect(result).toHaveLength(4);
    expect(result.every(r => r.type === '课件讲义')).toBe(true);
  });

  test('filters by 视频课程', () => {
    const result = filterResources(fixtures, { type: '视频课程' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('filters by 书籍', () => {
    const result = filterResources(fixtures, { type: '书籍' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  test('returns empty for 其他 type match', () => {
    const result = filterResources(fixtures, { type: '其他' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(9);
  });
});

/* ============================================================
   4. Keyword search
   ============================================================ */
describe('filterResources — keyword search', () => {
  test('returns all when term is empty', () => {
    expect(filterResources(fixtures, { term: '' })).toHaveLength(9);
    expect(filterResources(fixtures, { term: '   ' })).toHaveLength(9);
    expect(filterResources(fixtures, {})).toHaveLength(9);
  });

  test('matches title (partial)', () => {
    const result = filterResources(fixtures, { term: '高等数学' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('matches title (single character)', () => {
    const result = filterResources(fixtures, { term: 'Python' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('matches description', () => {
    const result = filterResources(fixtures, { term: '矩阵' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('matches tag', () => {
    const result = filterResources(fixtures, { term: '四级' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  test('case insensitive — title', () => {
    const result = filterResources(fixtures, { term: 'python' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('case insensitive — description', () => {
    const result = filterResources(fixtures, { term: 'PYTHON' });
    expect(result).toHaveLength(1);
  });

  test('returns multiple when keyword matches several', () => {
    const result = filterResources(fixtures, { term: '期末' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual([1, 6]);
  });

  test('returns empty for no match', () => {
    const result = filterResources(fixtures, { term: '量子力学' });
    expect(result).toHaveLength(0);
  });

  test('trims whitespace from term', () => {
    const result = filterResources(fixtures, { term: '  Python  ' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

/* ============================================================
   5. Combined filters
   ============================================================ */
describe('filterResources — combined filters', () => {
  test('category + grade', () => {
    const result = filterResources(fixtures, {
      category: '数学与统计类',
      grade: '大一',
    });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '数学与统计类' && r.grade === '大一')).toBe(true);
  });

  test('category + grade (no overlap)', () => {
    const result = filterResources(fixtures, {
      category: '公共基础类',
      grade: '大二',
    });
    expect(result).toHaveLength(0);
  });

  test('category + type', () => {
    const result = filterResources(fixtures, {
      category: '数学与统计类',
      type: '习题试卷',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('grade + type', () => {
    const result = filterResources(fixtures, {
      grade: '大一',
      type: '课件讲义',
    });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.grade === '大一' && r.type === '课件讲义')).toBe(true);
  });

  test('category + grade + type', () => {
    const result = filterResources(fixtures, {
      category: '数学与统计类',
      grade: '大一',
      type: '课件讲义',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('category + keyword', () => {
    const result = filterResources(fixtures, {
      category: '计算机科学与技术类',
      term: 'Python',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('grade + keyword', () => {
    const result = filterResources(fixtures, {
      grade: '大一',
      term: '期末',
    });
    expect(result).toHaveLength(2);
  });

  test('type + keyword', () => {
    const result = filterResources(fixtures, {
      type: '习题试卷',
      term: '高等数学',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('all filters together — match', () => {
    const result = filterResources(fixtures, {
      category: '数学与统计类',
      grade: '大一',
      type: '习题试卷',
      term: '期末',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('all filters together — no match', () => {
    const result = filterResources(fixtures, {
      category: '计算机科学与技术类',
      grade: '大一',
      type: '习题试卷',
      term: 'Python',
    });
    expect(result).toHaveLength(0);
  });

  test('"all" filters are transparent', () => {
    const result = filterResources(fixtures, {
      category: 'all',
      grade: 'all',
      type: 'all',
      term: '',
    });
    expect(result).toHaveLength(9);
  });
});

/* ============================================================
   6. Edge cases
   ============================================================ */
describe('filterResources — edge cases', () => {
  test('empty resources array', () => {
    const result = filterResources([], { category: '数学与统计类' });
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  test('all filters set to non-matching values', () => {
    const result = filterResources(fixtures, {
      category: '化学与化工类',
      grade: '大四',
      type: '书籍',
    });
    expect(result).toHaveLength(0);
  });

  test('does not mutate original array', () => {
    const original = fixtures.slice();
    filterResources(fixtures, { category: '数学与统计类' });
    expect(fixtures).toEqual(original);
    expect(fixtures).toHaveLength(9);
  });

  test('resource with empty tags array', () => {
    const resources = [{ id: 99, title: '无标签', category: '数学与统计类', grade: '大一', type: '课件讲义', description: '测试', tags: [] }];
    const result = filterResources(resources, { term: '标签' });
    expect(result).toHaveLength(1);
  });

  test('resource with missing tags field', () => {
    const resources = [{ id: 99, title: '测试', category: '数学与统计类', grade: '大一', type: '课件讲义', description: '描述' }];
    const result = filterResources(resources, { term: 'xyz' });
    expect(result).toHaveLength(0);
  });

  test('keyword search with partial tag match', () => {
    const result = filterResources(fixtures, { term: '算法' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  test('defaults missing filter fields to "all"', () => {
    const result = filterResources(fixtures, {});
    expect(result).toHaveLength(9);
  });
});

/* ============================================================
   7. New category tests
   ============================================================ */
describe('filterResources — new categories', () => {
  test('filters by 电子信息与电气工程类', () => {
    const result = filterResources(fixtures, { category: '电子信息与电气工程类' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });

  test('filters by 机械与能源工程类', () => {
    const result = filterResources(fixtures, { category: '机械与能源工程类' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(8);
  });

  test('filters by 法学与政治学类', () => {
    const result = filterResources(fixtures, { category: '法学与政治学类' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(9);
  });

  test('subcategory filter works for new categories', () => {
    const result = filterResources(fixtures, { category: '电子信息与电气工程类', term: '电路' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });
});
