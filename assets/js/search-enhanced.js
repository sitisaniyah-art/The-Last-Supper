/**
 * search-enhanced.js — 全局搜索引擎模块 v3
 * 支持: Fuse.js 模糊搜索、拼音搜索（含首字母）、搜索建议、5种排序、历史记录、关键词高亮、相关度评分
 * 依赖: Fuse.js (assets/js/fuse.min.js) 可选, pinyin-pro (CDN) 可选
 * 数据源: allResources (学习资源) + tlsPlacesIndex/allPlaces (嗨玩榜)
 */
var TLSearch = (function() {
  var HISTORY_KEY = 'tls_search_history';
  var MAX_HISTORY = 20;

  // --- Fuse.js instances (lazy init) ---
  var _fuseResources = null;
  var _fusePlaces = null;

  function _initFuse() {
    if (typeof Fuse === 'undefined') return;

    var resources = _getResources();
    var places = _getPlaces();

    if (resources.length && !_fuseResources) {
      _fuseResources = new Fuse(resources, {
        keys: [
          { name: 'title', weight: 0.35 },
          { name: 'uploader', weight: 0.2 },
          { name: 'subcategory', weight: 0.15 },
          { name: 'category', weight: 0.1 },
          { name: 'tags', weight: 0.12 },
          { name: 'description', weight: 0.08 }
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        ignoreLocation: true
      });
    }

    if (places.length && !_fusePlaces) {
      _fusePlaces = new Fuse(places, {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'address', weight: 0.2 },
          { name: 'category', weight: 0.15 },
          { name: 'tags', weight: 0.15 },
          { name: 'description', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        ignoreLocation: true
      });
    }
  }

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

  // --- Match function: returns match quality score (0=no match) ---
  function _matchScore(text, query, queryPinyin, queryInitials) {
    if (!text || !query) return 0;
    var lt = text.toLowerCase();
    if (lt === query) return 3;
    if (lt.indexOf(query) === 0) return 2.5;
    if (lt.includes(query)) return 2;
    if (queryPinyin) {
      var tp = _toPinyin(lt);
      if (tp === queryPinyin) return 2.5;
      if (tp.includes(queryPinyin)) return 1.5;
    }
    if (queryInitials && query.length >= 2) {
      var ti = _getFirstLetter(lt);
      if (ti.includes(queryInitials)) return 1;
    }
    return 0;
  }

  function _matchField(text, query, queryPinyin, queryInitials) {
    return _matchScore(text, query, queryPinyin, queryInitials) > 0;
  }

  // --- Relevance scoring for resources ---
  function _resourceRelevance(r, query, queryPinyin, queryInitials) {
    var score = 0;
    score += _matchScore(r.title, query, queryPinyin, queryInitials) * 10;
    score += _matchScore(r.uploader, query, queryPinyin, queryInitials) * 7;
    score += _matchScore(r.subcategory, query, queryPinyin, queryInitials) * 4;
    score += _matchScore(r.category, query, queryPinyin, queryInitials) * 3;
    (r.tags || []).forEach(function(t) {
      score += _matchScore(t, query, queryPinyin, queryInitials) * 3;
    });
    score += _matchScore(r.description, query, queryPinyin, queryInitials) * 1;
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

  // --- Search resources (Fuse.js + pinyin hybrid) ---
  function _searchResources(query, sort) {
    var q = (query || '').toLowerCase().trim();
    if (!q) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);

    var resultMap = {};

    // Layer 1: Fuse.js fuzzy search
    if (_fuseResources) {
      var fuseResults = _fuseResources.search(q);
      fuseResults.forEach(function(fr) {
        var r = fr.item;
        var id = r.id;
        if (!resultMap[id]) {
          resultMap[id] = Object.assign({}, r);
          resultMap[id]._relevance = (1 - (fr.score || 1)) * 15; // Fuse score (lower is better)
          resultMap[id]._fuseMatches = fr.matches;
        }
      });
    }

    // Layer 2: Pinyin search (supplement for Chinese queries)
    _getResources().forEach(function(r) {
      var id = r.id;
      var pinyinScore = _resourceRelevance(r, q, qPinyin, qInitials);
      if (pinyinScore > 0) {
        if (resultMap[id]) {
          // Boost existing result if pinyin also matches
          resultMap[id]._relevance = Math.max(resultMap[id]._relevance, pinyinScore);
        } else {
          resultMap[id] = Object.assign({}, r);
          resultMap[id]._relevance = pinyinScore;
        }
      }
    });

    // If Fuse.js not available, fall back to pure pinyin/manual search
    if (!_fuseResources) {
      _getResources().forEach(function(r) {
        var id = r.id;
        if (!resultMap[id]) {
          var ms = _matchField(r.title, q, qPinyin, qInitials) ||
                   _matchField(r.uploader, q, qPinyin, qInitials) ||
                   _matchField(r.description, q, qPinyin, qInitials) ||
                   _matchField(r.category, q, qPinyin, qInitials) ||
                   _matchField(r.subcategory, q, qPinyin, qInitials) ||
                   (r.tags || []).some(function(t) { return _matchField(t, q, qPinyin, qInitials); });
          if (ms) {
            resultMap[id] = Object.assign({}, r);
            resultMap[id]._relevance = _resourceRelevance(r, q, qPinyin, qInitials);
          }
        }
      });
    }

    var results = Object.values(resultMap);
    return _sortResults(results, sort, 'resource');
  }

  // --- Search places (Fuse.js + pinyin hybrid) ---
  function _searchPlaces(query, sort) {
    var q = (query || '').toLowerCase().trim();
    if (!q) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);

    var resultMap = {};

    // Layer 1: Fuse.js fuzzy search
    if (_fusePlaces) {
      var fuseResults = _fusePlaces.search(q);
      fuseResults.forEach(function(fr) {
        var p = fr.item;
        var key = p.name + '|' + p.address;
        if (!resultMap[key]) {
          resultMap[key] = Object.assign({}, p);
          resultMap[key]._relevance = (1 - (fr.score || 1)) * 15;
        }
      });
    }

    // Layer 2: Pinyin search
    _getPlaces().forEach(function(p) {
      var key = p.name + '|' + p.address;
      var pinyinScore = _placeRelevance(p, q, qPinyin, qInitials);
      if (pinyinScore > 0) {
        if (resultMap[key]) {
          resultMap[key]._relevance = Math.max(resultMap[key]._relevance, pinyinScore);
        } else {
          resultMap[key] = Object.assign({}, p);
          resultMap[key]._relevance = pinyinScore;
        }
      }
    });

    // Fallback
    if (!_fusePlaces) {
      _getPlaces().forEach(function(p) {
        var key = p.name + '|' + p.address;
        if (!resultMap[key]) {
          var ms = _matchField(p.name, q, qPinyin, qInitials) ||
                   _matchField(p.description, q, qPinyin, qInitials) ||
                   _matchField(p.address, q, qPinyin, qInitials) ||
                   _matchField(p.category, q, qPinyin, qInitials) ||
                   (p.tags || []).some(function(t) { return _matchField(t, q, qPinyin, qInitials); });
          if (ms) {
            resultMap[key] = Object.assign({}, p);
            resultMap[key]._relevance = _placeRelevance(p, q, qPinyin, qInitials);
          }
        }
      });
    }

    var results = Object.values(resultMap);
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

    // Lazy init Fuse.js
    _initFuse();

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

    if (section === 'all' && sort === 'relevance') {
      results.sort(function(a, b) { return (b._relevance || 0) - (a._relevance || 0); });
    } else if (section === 'all') {
      results = _sortResults(results, sort, 'mixed');
    }

    return results.slice(0, limit);
  }

  // --- Suggestions with Fuse.js + pinyin support ---
  function suggest(query) {
    var q = (query || '').toLowerCase().trim();
    if (!q || q.length < 1) return [];
    var qPinyin = _toPinyin(q);
    var qInitials = _getFirstLetter(q);
    var suggestions = [];

    // Use Fuse.js for suggestions if available
    _initFuse();

    if (_fuseResources) {
      var resFuse = _fuseResources.search(q).slice(0, 5);
      resFuse.forEach(function(fr) {
        var r = fr.item;
        suggestions.push({ text: r.title, type: 'resource', icon: 'fa-book' });
        if (_matchField(r.uploader, q, qPinyin, qInitials)) {
          suggestions.push({ text: r.uploader + ' 的资源', type: 'author', icon: 'fa-user', raw: r.uploader });
        }
      });
    } else {
      _getResources().forEach(function(r) {
        if (_matchField(r.title, q, qPinyin, qInitials)) {
          suggestions.push({ text: r.title, type: 'resource', icon: 'fa-book' });
        }
        if (_matchField(r.uploader, q, qPinyin, qInitials)) {
          suggestions.push({ text: r.uploader + ' 的资源', type: 'author', icon: 'fa-user', raw: r.uploader });
        }
      });
    }

    if (_fusePlaces) {
      var plFuse = _fusePlaces.search(q).slice(0, 3);
      plFuse.forEach(function(fr) {
        suggestions.push({ text: fr.item.name, type: 'place', icon: 'fa-map-marker-alt' });
      });
    } else {
      _getPlaces().forEach(function(p) {
        if (_matchField(p.name, q, qPinyin, qInitials)) {
          suggestions.push({ text: p.name, type: 'place', icon: 'fa-map-marker-alt' });
        }
      });
    }

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
