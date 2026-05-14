const { filterResources } = require('../assets/js/lib/filter-resources');

/* ============================================================
   Test fixtures — covers all categories, grades, types
   ============================================================ */
const fixtures = [
  {
    id: 1,
    title: '高等数学上册期末真题汇总',
    category: '数学',
    subcategory: '高等数学',
    grade: '大一',
    type: '真题',
    description: '包含近5年的期末真题及详细解答',
    tags: ['高数', '期末', '真题'],
  },
  {
    id: 2,
    title: 'Python入门到精通学习笔记',
    category: '编程',
    subcategory: 'Python',
    grade: '通用',
    type: '笔记',
    description: '从基础语法到进阶应用的学习笔记',
    tags: ['Python', '编程', '入门'],
  },
  {
    id: 3,
    title: '线性代数课件及习题解答',
    category: '数学',
    subcategory: '线性代数',
    grade: '大一',
    type: '课件',
    description: '矩阵、行列式、向量空间等章节课件',
    tags: ['线代', '课件'],
  },
  {
    id: 4,
    title: '大学英语四级真题及听力材料',
    category: '英语',
    subcategory: '四级',
    grade: '大一',
    type: '真题',
    description: '四级历年真题合集含听力音频',
    tags: ['四级', '英语', '听力'],
  },
  {
    id: 5,
    title: '数据结构与算法课程笔记',
    category: '编程',
    subcategory: '数据结构',
    grade: '大二',
    type: '笔记',
    description: '链表、树、图、排序算法等核心内容',
    tags: ['数据结构', '算法'],
  },
  {
    id: 6,
    title: '大学物理期末复习提纲',
    category: '物理',
    subcategory: '大学物理',
    grade: '大一',
    type: '笔记',
    description: '力学、热学、电磁学重点公式整理',
    tags: ['物理', '公式'],
  },
];

/* ============================================================
   1. Category filter
   ============================================================ */
describe('filterResources — category', () => {
  test('returns all when category is "all"', () => {
    const result = filterResources(fixtures, { category: 'all' });
    expect(result).toHaveLength(6);
  });

  test('filters by 数学', () => {
    const result = filterResources(fixtures, { category: '数学' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '数学')).toBe(true);
  });

  test('filters by 编程', () => {
    const result = filterResources(fixtures, { category: '编程' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '编程')).toBe(true);
  });

  test('filters by 英语', () => {
    const result = filterResources(fixtures, { category: '英语' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  test('filters by 物理', () => {
    const result = filterResources(fixtures, { category: '物理' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
  });

  test('returns empty for non-existent category', () => {
    const result = filterResources(fixtures, { category: '化学' });
    expect(result).toHaveLength(0);
  });
});

/* ============================================================
   2. Grade filter
   ============================================================ */
describe('filterResources — grade', () => {
  test('returns all when grade is "all"', () => {
    const result = filterResources(fixtures, { grade: 'all' });
    expect(result).toHaveLength(6);
  });

  test('filters by 大一', () => {
    const result = filterResources(fixtures, { grade: '大一' });
    expect(result).toHaveLength(4);
    expect(result.every(r => r.grade === '大一')).toBe(true);
  });

  test('filters by 大二', () => {
    const result = filterResources(fixtures, { grade: '大二' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  test('filters by 通用', () => {
    const result = filterResources(fixtures, { grade: '通用' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('returns empty for 大三 (no fixtures)', () => {
    const result = filterResources(fixtures, { grade: '大三' });
    expect(result).toHaveLength(0);
  });
});

/* ============================================================
   3. Type filter
   ============================================================ */
describe('filterResources — type', () => {
  test('returns all when type is "all"', () => {
    const result = filterResources(fixtures, { type: 'all' });
    expect(result).toHaveLength(6);
  });

  test('filters by 真题', () => {
    const result = filterResources(fixtures, { type: '真题' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === '真题')).toBe(true);
  });

  test('filters by 笔记', () => {
    const result = filterResources(fixtures, { type: '笔记' });
    expect(result).toHaveLength(3);
    expect(result.every(r => r.type === '笔记')).toBe(true);
  });

  test('filters by 课件', () => {
    const result = filterResources(fixtures, { type: '课件' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('returns empty for 习题 (no fixtures)', () => {
    const result = filterResources(fixtures, { type: '习题' });
    expect(result).toHaveLength(0);
  });
});

/* ============================================================
   4. Keyword search
   ============================================================ */
describe('filterResources — keyword search', () => {
  test('returns all when term is empty', () => {
    expect(filterResources(fixtures, { term: '' })).toHaveLength(6);
    expect(filterResources(fixtures, { term: '   ' })).toHaveLength(6);
    expect(filterResources(fixtures, {})).toHaveLength(6);
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
    // "期末" appears in title of id:1, description of id:1, and tag of id:1
    // Also "期末" appears in title of id:6
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
      category: '数学',
      grade: '大一',
    });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.category === '数学' && r.grade === '大一')).toBe(true);
  });

  test('category + grade (no overlap)', () => {
    const result = filterResources(fixtures, {
      category: '英语',
      grade: '大二',
    });
    expect(result).toHaveLength(0);
  });

  test('category + type', () => {
    const result = filterResources(fixtures, {
      category: '数学',
      type: '真题',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('grade + type', () => {
    const result = filterResources(fixtures, {
      grade: '大一',
      type: '笔记',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
  });

  test('category + grade + type', () => {
    const result = filterResources(fixtures, {
      category: '数学',
      grade: '大一',
      type: '课件',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  test('category + keyword', () => {
    const result = filterResources(fixtures, {
      category: '编程',
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
    // id:1 (大一, title含期末) and id:6 (大一, title含期末)
    expect(result).toHaveLength(2);
  });

  test('type + keyword', () => {
    const result = filterResources(fixtures, {
      type: '真题',
      term: '英语',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  test('all filters together — match', () => {
    const result = filterResources(fixtures, {
      category: '数学',
      grade: '大一',
      type: '真题',
      term: '期末',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('all filters together — no match', () => {
    const result = filterResources(fixtures, {
      category: '编程',
      grade: '大一',
      type: '真题',
      term: 'Python',
    });
    // 编程+大一: id:4 is 英语 not 编程. No match.
    expect(result).toHaveLength(0);
  });

  test('"all" filters are transparent', () => {
    const result = filterResources(fixtures, {
      category: 'all',
      grade: 'all',
      type: 'all',
      term: '',
    });
    expect(result).toHaveLength(6);
  });
});

/* ============================================================
   6. Edge cases
   ============================================================ */
describe('filterResources — edge cases', () => {
  test('empty resources array', () => {
    const result = filterResources([], { category: '数学' });
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  test('all filters set to non-matching values', () => {
    const result = filterResources(fixtures, {
      category: '化学',
      grade: '大三',
      type: '习题',
    });
    expect(result).toHaveLength(0);
  });

  test('does not mutate original array', () => {
    const original = fixtures.slice();
    filterResources(fixtures, { category: '数学' });
    expect(fixtures).toEqual(original);
    expect(fixtures).toHaveLength(6);
  });

  test('resource with empty tags array', () => {
    const resources = [{ id: 99, title: '无标签', category: '数学', grade: '大一', type: '笔记', description: '测试', tags: [] }];
    const result = filterResources(resources, { term: '标签' });
    // title "无标签" matches
    expect(result).toHaveLength(1);
  });

  test('resource with missing tags field', () => {
    const resources = [{ id: 99, title: '测试', category: '数学', grade: '大一', type: '笔记', description: '描述' }];
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
    expect(result).toHaveLength(6);
  });
});
