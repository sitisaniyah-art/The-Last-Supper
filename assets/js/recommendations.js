/**
 * Recommendations Module — 基于标签的资源推荐
 *
 * 内容推荐算法：收集收藏资源的标签，按权重匹配未收藏资源
 * 使用场景：收藏页面 "你可能还喜欢" 区域
 */
var Recommendations = (function() {
  'use strict';

  /**
   * 获取推荐资源
   * @param {number[]} favorites - 已收藏的资源 ID 数组
   * @param {Object[]} allResources - 所有资源数据
   * @param {number} [limit=4] - 返回数量上限
   * @returns {Object[]} 推荐的资源数组
   */
  function getRecommended(favorites, allResources, limit) {
    limit = limit || 4;
    if (!favorites || !favorites.length || !allResources) return [];

    // 收集收藏资源的标签并计算权重
    var favTags = {};
    var favIdSet = {};
    favorites.forEach(function(id) {
      favIdSet[id] = true;
      var r = allResources.find(function(x) { return x.id === id; });
      if (r && r.tags) {
        r.tags.forEach(function(t) {
          favTags[t] = (favTags[t] || 0) + 1;
        });
      }
    });

    // 同品类加权：如果收藏了某个 category，同 category 的其他资源加分
    var favCategories = {};
    favorites.forEach(function(id) {
      var r = allResources.find(function(x) { return x.id === id; });
      if (r) favCategories[r.category] = (favCategories[r.category] || 0) + 1;
    });

    // 对未收藏资源评分
    var scored = allResources
      .filter(function(r) { return !favIdSet[r.id]; })
      .map(function(r) {
        var score = 0;
        // 标签匹配
        (r.tags || []).forEach(function(t) { score += (favTags[t] || 0) * 2; });
        // 同品类加分
        score += (favCategories[r.category] || 0) * 1;
        return { resource: r, score: score };
      })
      .filter(function(x) { return x.score > 0; })
      .sort(function(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return b.resource.rating - a.resource.rating; // 评分高的优先
      })
      .slice(0, limit);

    return scored.map(function(x) { return x.resource; });
  }

  /**
   * 渲染推荐区域
   * @param {string} containerId - 容器元素 ID
   * @param {Object[]} recommended - 推荐的资源数组
   */
  function renderRecommendations(containerId, recommended) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!recommended.length) {
      container.style.display = 'none';
      return;
    }

    var cards = recommended.map(function(r) {
      return '<div class="rec-card">' +
        '<div class="rec-card-body">' +
          '<span class="resource-category-badge" style="font-size:0.7rem;">' + r.category + '</span>' +
          '<h4 class="rec-card-title">' + r.title + '</h4>' +
          '<p class="rec-card-desc">' + r.description.substring(0, 60) + '...</p>' +
          '<div class="rec-card-meta">' +
            '<span><i class="fas fa-star" style="color:#f59e0b;"></i> ' + r.rating + '</span>' +
            '<span>' + r.type + '</span>' +
          '</div>' +
        '</div>' +
        '<a href="/The-Last-Supper/resources/" class="rec-card-link" title="前往资源页查看"><i class="fas fa-arrow-right"></i></a>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<hr style="margin:2rem 0;border:none;border-top:1px solid var(--border-color);">' +
      '<h3 style="font-size:1.1rem;margin-bottom:1rem;"><i class="fas fa-magic" style="color:var(--primary-color);"></i> 你可能还喜欢</h3>' +
      '<div class="rec-grid">' + cards + '</div>';
    container.style.display = 'block';
  }

  return {
    getRecommended: getRecommended,
    renderRecommendations: renderRecommendations
  };
})();
