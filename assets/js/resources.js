/* Resources page JS — uses allResources embedded by Liquid */
var TLS_GITHUB_REPO_URL = 'https://github.com/sitisaniyah-art/The-Last-Supper';
function reportUrl(type, title) {
  return TLS_GITHUB_REPO_URL + '/issues/new?template=report.yml&title=' + encodeURIComponent('[举报] ' + type + ' - ' + title);
}

document.addEventListener('DOMContentLoaded', function() {
  renderResources(allResources);
  setupFilters(allResources);
});

/* Category accent colors for card top bar */
var CATEGORY_ACCENTS = {
  '数学': ['#6366f1', '#818cf8'],
  '编程': ['#10b981', '#34d399'],
  '英语': ['#f59e0b', '#fbbf24'],
  '物理': ['#ef4444', '#f87171'],
  '其他': ['#8b5cf6', '#a78bfa']
};

/* 当前搜索关键词（用于高亮） */
var currentSearchQuery = '';

function buildCardHTML(r) {
  var tagsHtml = r.tags.map(function(t) {
    var displayTag = currentSearchQuery && typeof TLSearch !== 'undefined' ? TLSearch.highlightMatch(t, currentSearchQuery) : t;
    return '<span class="tag">' + displayTag + '</span>';
  }).join('');

  var fav = Favorites.isFavorited(r.id);
  var heartClass = fav ? 'fas fa-heart favorited' : 'far fa-heart';
  var accents = CATEGORY_ACCENTS[r.category] || CATEGORY_ACCENTS['其他'];

  /* 关键词高亮：标题、作者、描述 */
  var title = currentSearchQuery && typeof TLSearch !== 'undefined' ? TLSearch.highlightMatch(r.title, currentSearchQuery) : r.title;
  var uploader = currentSearchQuery && typeof TLSearch !== 'undefined' ? TLSearch.highlightMatch(r.uploader, currentSearchQuery) : r.uploader;
  var desc = currentSearchQuery && typeof TLSearch !== 'undefined' ? TLSearch.highlightMatch(r.description, currentSearchQuery) : r.description;

  return '<div class="resource-card" style="--card-accent:' + accents[0] + ';--card-accent-end:' + accents[1] + ';">' +
    '<div class="resource-card-body">' +
      '<div class="resource-header">' +
        '<span class="resource-category-badge">' + r.category + '</span>' +
        '<button class="favorite-btn' + (fav ? ' active' : '') + '" data-id="' + r.id + '" data-tooltip="收藏">' +
          '<i class="' + heartClass + '"></i>' +
        '</button>' +
      '</div>' +
      '<h3 class="resource-title">' + title + '</h3>' +
      '<div class="resource-meta">' +
        '<span class="meta-user"><i class="fas fa-user"></i> ' + uploader + '</span>' +
        '<span class="meta-date"><i class="fas fa-calendar"></i> ' + r.date + '</span>' +
      '</div>' +
      '<p class="resource-description">' + desc + '</p>' +
      '<div class="resource-tags">' + tagsHtml + '</div>' +
    '</div>' +
    '<div class="resource-actions">' +
      '<a href="' + r.link + '" class="download-btn" target="_blank" rel="noopener" data-tooltip="下载资源"><i class="fas fa-download"></i> 下载资源</a>' +
      '<a href="' + reportUrl('学习资源', r.title) + '" class="report-btn" target="_blank" rel="noopener" data-tooltip="举报"><i class="fas fa-flag"></i></a>' +
      '<span class="resource-grade">' + r.grade + ' · ' + r.subcategory + '</span>' +
    '</div>' +
  '</div>';
}

function renderResources(resources) {
  var grid = document.getElementById('resources-grid');
  var noResults = document.getElementById('no-results');
  var countEl = document.getElementById('resource-count');

  if (resources.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    countEl.textContent = '';
    return;
  }

  noResults.style.display = 'none';
  countEl.textContent = '共 ' + resources.length + ' 个资源';

  grid.innerHTML = resources.map(buildCardHTML).join('');
  bindFavoriteEvents(grid);
}

function bindFavoriteEvents(container) {
  container.querySelectorAll('.favorite-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var id = parseInt(this.getAttribute('data-id'));
      var nowFav = Favorites.toggle(id);
      this.classList.toggle('active', nowFav);
      this.querySelector('i').className = nowFav ? 'fas fa-heart favorited' : 'far fa-heart';
      this.setAttribute('data-tooltip', nowFav ? '取消收藏' : '收藏');

      this.classList.add('pulse');
      var self = this;
      setTimeout(function() { self.classList.remove('pulse'); }, 350);
    });
  });
}

function setupFilters(resources) {
  var categoryFilter = document.getElementById('category-filter');
  var gradeFilter = document.getElementById('grade-filter');
  var typeFilter = document.getElementById('type-filter');
  var searchInput = document.getElementById('resource-search');

  function applyFilters() {
    var filtered = filterResources(resources, {
      category: categoryFilter.value,
      grade: gradeFilter.value,
      type: typeFilter.value,
      term: searchInput.value
    });
    renderResources(filtered);
  }

  categoryFilter.addEventListener('change', applyFilters);
  gradeFilter.addEventListener('change', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
}
