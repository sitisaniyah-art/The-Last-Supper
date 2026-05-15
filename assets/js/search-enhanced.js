/**
 * search-enhanced.js — 全局搜索引擎模块
 * 支持: 模糊搜索、拼音搜索、搜索建议、排序、历史记录、关键词高亮
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

  // --- Match function ---
  function _matchField(text, query, queryPinyin, queryInitials) {
    if (!text || !query) return false;
    var lt = text.toLowerCase();
    if (lt.includes(query)) return true;
    if (queryPinyin) {
      var tp = _toPinyin(lt);
      if (tp.includes(queryPinyin)) return true;
    }
    if (queryInitials && query.length >= 2) {
      var ti = _getFirstLetter(lt);
      if (ti.includes(queryInitials)) return true;
    }
    return false;
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

    return _sortResults(results, sort, 'place');
  }

  // --- Sorting ---
  function _sortResults(results, sort, type) {
    switch (sort) {
      case 'name-asc':
        return results.sort(function(a, b) {
          var na = (a.title || a.name || '').localeCompare(b.title || b.name || '', 'zh-CN');
          return na;
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
        // Relevance: exact title match first, then by rating
        var q = ''; // we can't re-access query here easily, so sort by rating
        if (type === 'resource') {
          return results.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); });
        }
        return results.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); });
    }
  }

  // --- Highlight ---
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

    // For 'all' section, sort combined results by rating
    if (section === 'all') {
      results.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); });
    }

    return results.slice(0, limit);
  }

  function suggest(query) {
    var q = (query || '').toLowerCase().trim();
    if (!q || q.length < 1) return [];
    var suggestions = [];

    // Resource title + author suggestions
    _getResources().forEach(function(r) {
      if ((r.title || '').toLowerCase().includes(q)) {
        suggestions.push({ text: r.title, type: 'resource', icon: 'fa-book' });
      }
      if ((r.uploader || '').toLowerCase().includes(q)) {
        suggestions.push({ text: r.uploader + ' 的资源', type: 'author', icon: 'fa-user', raw: r.uploader });
      }
    });

    // Place name suggestions
    _getPlaces().forEach(function(p) {
      if ((p.name || '').toLowerCase().includes(q)) {
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

    return unique.slice(0, 5);
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
    // Remove duplicate
    hist = hist.filter(function(h) { return h !== q; });
    // Add to front
    hist.unshift(q);
    // Cap
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
