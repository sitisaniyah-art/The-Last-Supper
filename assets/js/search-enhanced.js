/**
 * search-enhanced.js — 全局搜索引擎模块 v2
 * 支持: 模糊搜索、拼音搜索（含首字母）、搜索建议、5种排序、历史记录、关键词高亮、相关度评分
 * 依赖: pinyin-pro (CDN) 可选，无依赖时退化为纯中文搜索
 * 数据源: allResources (学习资源) + tlsPlacesIndex/allPlaces (嗨玩榜)
 */
var TLSearch = (function() {
  var HISTORY_KEY = 'tls_search_history';
  var MAX_HISTORY = 20;

  // --- Pinyin helpers ---
  function _toPinyin(str) {
    if (typeof pinyinPro === 'undefined') return '';
    try {
      return pinyinPro.pinyin(str, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    } catch(e) { return ''; }
  }

  function _getFirstLetter(str) {
    if (typeof pinyinPro === 'undefined') return '';
    try {
      return pinyinPro.pinyin(str, { toneType: 'none', type: 'array' }).map(function(s) { return s.charAt(0); }).join('').toLowerCase();
    } catch(e) { return ''; }
  }

  // --- Data sources ---
  function _getResources() {
    return (typeof allResources !== 'undefined') ? allResources : [];
  }

  function _getPlaces() {
    if (typeof tlsPlacesIndex !== 'undefined') return tlsPlacesIndex;
    if (typeof allPlaces !== 'undefined') return allPlaces;
    return [];
  }

  // --- Match function: returns match quality score (0=no match, 1=partial, 2=exact) ---
  function _matchScore(text, query, queryPinyin, queryInitials) {
    if (!text || !query) return 0;
    var lt = text.toLowerCase();
    // Exact match
    if (lt === query) return 3;
    // Starts with query
    if (lt.indexOf(query) === 0) return 2.5;
    // Contains query
    if (lt.includes(query)) return 2;
    // Pinyin match
    if (queryPinyin) {
      var tp = _toPinyin(lt);
      if (tp === queryPinyin) return 2.5;
      if (tp.includes(queryPinyin)) return 1.5;
    }
    // First letter match (only for queries >= 2 chars)
    if (queryInitials && query.length >= 2) {
      var ti = _getFirstLetter(lt);
      if (ti.includes(queryInitials)) return 1;
    }
    return 0;
  }

  // Simple boolean match (backward compat)
  function _matchField(text, query, queryPinyin, queryInitials) {
    return _matchScore(text, query, queryPinyin, queryInitials) > 0;
  }

  // --- Relevance scoring for resources ---
  function _resourceRelevance(r, query, queryPinyin, queryInitials) {
    var score = 0;
    // Title match (highest weight)
    var titleScore = _matchScore(r.title, query, queryPinyin, queryInitials);
    score += titleScore * 10;
    // Uploader/author match (high weight for author search)
    var uploaderScore = _matchScore(r.uploader, query, queryPinyin, queryInitials);
    score += uploaderScore * 7;
    // Subcategory match
    score += _matchScore(r.subcategory, query, queryPinyin, queryInitials) * 4;
    // Category match
    score += _matchScore(r.category, query, queryPinyin, queryInitials) * 3;
    // Tags match
    (r.tags || []).forEach(function(t) {
      score += _matchScore(t, query, queryPinyin, queryInitials) * 3;
    });
    // Description match
    score += _matchScore(r.description, query, queryPinyin, queryInitials) * 1;
    // Boost by rating
    score += (r.rating || 0) * 0.5;
    return score;
  }

  // --- Relevance scoring for places ---
  function _placeRelevance(p, query, queryPinyin, queryInitials) {
    var score = 0;
    score += _matchScore(p.name, query, queryPinyin, queryInitials) * 10;
    score += _matchScore(p.address, query, queryPinyin, queryInitials) * 4;
    score += _matchScore(p.category, query, queryPinyin, queryInitials) * 3;
    (p.tags || []).forEach(function(t) {
      score += _matchScore(t, query, queryPinyin, queryInitials) * 3;
    });
    score += _matchScore(p.description, query, queryPinyin, queryInitials) * 1;
    score += (p.rating || 0) * 0.5;
    return score;
  }

  // --- Search resources ---
  function _searchResources(query, sort) {
    var q = (query || '').toLowerCase().trim();
    if (!q) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);

    var results = _getResources().filter(function(r) {
      return _matchField(r.title, q, qPinyin, qInitials) ||
             _matchField(r.uploader, q, qPinyin, qInitials) ||
             _matchField(r.description, q, qPinyin, qInitials) ||
             _matchField(r.category, q, qPinyin, qInitials) ||
             _matchField(r.subcategory, q, qPinyin, qInitials) ||
             (r.tags || []).some(function(t) { return _matchField(t, q, qPinyin, qInitials); });
    });

    // Add relevance scores
    results.forEach(function(r) {
      r._relevance = _resourceRelevance(r, q, qPinyin, qInitials);
    });

    return _sortResults(results, sort, 'resource');
  }

  // --- Search places ---
  function _searchPlaces(query, sort) {
    var q = (query || '').toLowerCase().trim();
    if (!q) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);

    var results = _getPlaces().filter(function(p) {
      return _matchField(p.name, q, qPinyin, qInitials) ||
             _matchField(p.description, q, qPinyin, qInitials) ||
             _matchField(p.address, q, qPinyin, qInitials) ||
             _matchField(p.category, q, qPinyin, qInitials) ||
             (p.tags || []).some(function(t) { return _matchField(t, q, qPinyin, qInitials); });
    });

    results.forEach(function(p) {
      p._relevance = _placeRelevance(p, q, qPinyin, qInitials);
    });

    return _sortResults(results, sort, 'place');
  }

  // --- Sorting ---
  function _sortResults(results, sort, type) {
    switch (sort) {
      case 'name-asc':
        return results.sort(function(a, b) {
          return (a.title || a.name || '').localeCompare(b.title || b.name || '', 'zh-CN');
        });
      case 'name-desc':
        return results.sort(function(a, b) {
          return (b.title || b.name || '').localeCompare(a.title || a.name || '', 'zh-CN');
        });
      case 'newest':
        return results.sort(function(a, b) {
          return (b.date || '').localeCompare(a.date || '');
        });
      case 'oldest':
        return results.sort(function(a, b) {
          return (a.date || '').localeCompare(b.date || '');
        });
      case 'relevance':
      default:
        // Relevance: use computed relevance score
        return results.sort(function(a, b) {
          return (b._relevance || 0) - (a._relevance || 0);
        });
    }
  }

  // --- Highlight: supports pinyin-aware partial matching ---
  function highlightMatch(text, query) {
    if (!text || !query) return text || '';
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // --- Public API ---
  function search(query, options) {
    options = options || {};
    var section = options.section || 'all';
    var sort = options.sort || 'relevance';
    var limit = options.limit || 50;

    var results = [];
    if (section === 'all' || section === 'resources') {
      var res = _searchResources(query, sort);
      res.forEach(function(r) { r._type = 'resource'; });
      results = results.concat(res);
    }
    if (section === 'all' || section === 'places') {
      var pls = _searchPlaces(query, sort);
      pls.forEach(function(p) { p._type = 'place'; });
      results = results.concat(pls);
    }

    // For 'all' section with relevance, sort by combined relevance score
    if (section === 'all' && sort === 'relevance') {
      results.sort(function(a, b) { return (b._relevance || 0) - (a._relevance || 0); });
    } else if (section === 'all') {
      // For other sorts, apply the sort to combined results
      results = _sortResults(results, sort, 'mixed');
    }

    return results.slice(0, limit);
  }

  // --- Suggestions with pinyin support ---
  function suggest(query) {
    var q = (query || '').toLowerCase().trim();
    if (!q || q.length < 1) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);
    var suggestions = [];

    // Resource title + author suggestions (pinyin-aware)
    _getResources().forEach(function(r) {
      if (_matchField(r.title, q, qPinyin, qInitials)) {
        suggestions.push({ text: r.title, type: 'resource', icon: 'fa-book' });
      }
      if (_matchField(r.uploader, q, qPinyin, qInitials)) {
        suggestions.push({ text: r.uploader + ' 的资源', type: 'author', icon: 'fa-user', raw: r.uploader });
      }
    });

    // Place name suggestions (pinyin-aware)
    _getPlaces().forEach(function(p) {
      if (_matchField(p.name, q, qPinyin, qInitials)) {
        suggestions.push({ text: p.name, type: 'place', icon: 'fa-map-marker-alt' });
      }
    });

    // Deduplicate by text
    var seen = {};
    var unique = [];
    suggestions.forEach(function(s) {
      var key = s.text;
      if (!seen[key]) { seen[key] = true; unique.push(s); }
    });

    return unique.slice(0, 8);
  }

  // --- Search history ---
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch(e) { return []; }
  }

  function addToHistory(query) {
    if (!query || !query.trim()) return;
    var q = query.trim();
    var hist = getHistory();
    hist = hist.filter(function(h) { return h !== q; });
    hist.unshift(q);
    if (hist.length > MAX_HISTORY) hist = hist.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  return {
    search: search,
    suggest: suggest,
    highlightMatch: highlightMatch,
    getHistory: getHistory,
    addToHistory: addToHistory,
    clearHistory: clearHistory
  };
})();
