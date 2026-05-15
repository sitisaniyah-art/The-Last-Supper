/**
 * Stats Module — 贡献者排行榜自动化
 *
 * 从 GitHub API 获取贡献者数据，合并本地统计，渲染动态排行榜
 * 渐进增强：静态排行榜由 Liquid 渲染，JS 加载后替换
 */
var Stats = (function() {
  'use strict';

  var CACHE_KEY = 'tls_stats_cache';
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  var GITHUB_USERNAME = '';
  var GITHUB_REPO = '';

  // 从页面配置中读取（由 Liquid 注入）
  function _initConfig() {
    if (typeof window.TLS_GITHUB_USERNAME !== 'undefined') {
      GITHUB_USERNAME = window.TLS_GITHUB_USERNAME;
      GITHUB_REPO = window.TLS_GITHUB_REPO;
    }
  }

  function _getCache() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    } catch(e) {}
    return null;
  }

  function _setCache(data) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, timestamp: Date.now() }));
  }

  /**
   * 从 GitHub API 获取仓库贡献者
   */
  function fetchContributors() {
    if (!GITHUB_USERNAME || !GITHUB_REPO) return Promise.resolve([]);

    var cached = _getCache();
    if (cached) return Promise.resolve(cached);

    return fetch('https://api.github.com/repos/' + GITHUB_USERNAME + '/' + GITHUB_REPO + '/contributors?per_page=30')
      .then(function(res) {
        if (!res.ok) throw new Error('API error: ' + res.status);
        return res.json();
      })
      .then(function(contribs) {
        var result = contribs.map(function(c) {
          return {
            login: c.login,
            avatar: c.avatar_url + '&s=40',
            contributions: c.contributions
          };
        });
        _setCache(result);
        return result;
      })
      .catch(function() { return []; });
  }

  /**
   * 统计 resources.yml 中各 uploader 的资源数
   */
  function countResourcesByUploader(allResources) {
    var counts = {};
    (allResources || []).forEach(function(r) {
      var name = r.uploader;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }

  /**
   * 渲染动态排行榜
   * @param {string} containerId - 排行榜容器元素 ID
   * @param {Array} staticContributors - 来自 contributors.yml 的静态数据
   * @param {Array} allResources - 来自 resources.yml 的资源数据
   */
  function renderDynamicLeaderboard(containerId, staticContributors, allResources) {
    _initConfig();

    var resourceCounts = countResourcesByUploader(allResources);

    // 合并静态数据和资源统计
    var contributors = (staticContributors || []).map(function(c) {
      var autoResources = resourceCounts[c.name] || 0;
      return {
        name: c.name,
        github: c.github,
        avatar: c.avatar,
        resources: Math.max(c.resources || 0, autoResources),
        answers: c.answers || 0,
        points: c.points || 0,
        bio: c.bio || ''
      };
    });

    // 添加只有 resources.yml 中出现但不在 contributors.yml 中的上传者
    var knownNames = {};
    contributors.forEach(function(c) { knownNames[c.name] = true; });

    Object.keys(resourceCounts).forEach(function(name) {
      if (!knownNames[name]) {
        contributors.push({
          name: name,
          github: '',
          avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random&size=40',
          resources: resourceCounts[name],
          answers: 0,
          points: resourceCounts[name] * 10,
          bio: ''
        });
      }
    });

    // 按积分排序
    contributors.sort(function(a, b) { return b.points - a.points; });

    // 渲染
    var container = document.getElementById(containerId);
    if (!container) return;

    var medals = ['<i class="fas fa-crown" style="color:#f59e0b;"></i>',
                  '<i class="fas fa-medal" style="color:#94a3b8;"></i>',
                  '<i class="fas fa-medal" style="color:#cd7f32;"></i>'];

    var rows = contributors.slice(0, 10).map(function(c, i) {
      var rank = i < 3 ? medals[i] : (i + 1);
      return '<tr>' +
        '<td class="leaderboard-rank">' + rank + '</td>' +
        '<td><img class="leaderboard-avatar" src="' + c.avatar + '" alt="' + c.name + '" loading="lazy"> <strong>' + c.name.replace(/</g, '&lt;') + '</strong></td>' +
        '<td>' + c.resources + '</td>' +
        '<td>' + c.answers + '</td>' +
        '<td class="leaderboard-points">' + c.points + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div style="overflow-x:auto;">' +
        '<table class="leaderboard-table">' +
          '<thead><tr>' +
            '<th class="leaderboard-rank">排名</th>' +
            '<th>贡献者</th>' +
            '<th>资源</th>' +
            '<th>回答</th>' +
            '<th>积分</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  return {
    fetchContributors: fetchContributors,
    countResourcesByUploader: countResourcesByUploader,
    renderDynamicLeaderboard: renderDynamicLeaderboard
  };
})();
