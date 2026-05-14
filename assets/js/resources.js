/* Resources page JS — uses allResources embedded by Liquid */

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

/* Max downloads across all resources (for popularity bar) */
var MAX_DOWNLOADS = 0;
allResources.forEach(function(r) {
  if (r.downloads > MAX_DOWNLOADS) MAX_DOWNLOADS = r.downloads;
});
if (MAX_DOWNLOADS === 0) MAX_DOWNLOADS = 1;

function renderStars(rating) {
  var html = '';
  for (var i = 1; i <= 5; i++) {
    html += '<i class="fas fa-star star' + (i <= Math.round(rating) ? ' filled' : '') + '"></i>';
  }
  return html;
}

function buildCardHTML(r) {
  var tagsHtml = r.tags.map(function(t) {
    return '<span class="tag">' + t + '</span>';
  }).join('');

  var fav = Favorites.isFavorited(r.id);
  var heartClass = fav ? 'fas fa-heart favorited' : 'far fa-heart';
  var heartTitle = fav ? '取消收藏' : '收藏';
  var accents = CATEGORY_ACCENTS[r.category] || CATEGORY_ACCENTS['其他'];
  var popularity = Math.round((r.downloads / MAX_DOWNLOADS) * 100);

  return '<div class="resource-card" style="--card-accent:' + accents[0] + ';--card-accent-end:' + accents[1] + ';">' +
    '<div class="resource-card-body">' +
      '<div class="resource-header">' +
        '<span class="resource-category-badge">' + r.category + '</span>' +
        '<button class="favorite-btn' + (fav ? ' active' : '') + '" data-id="' + r.id + '" title="' + heartTitle + '">' +
          '<i class="' + heartClass + '"></i>' +
        '</button>' +
      '</div>' +
      '<h3 class="resource-title">' + r.title + '</h3>' +
      '<div class="resource-meta">' +
        '<span class="meta-user"><i class="fas fa-user"></i> ' + r.uploader + '</span>' +
        '<span class="meta-date"><i class="fas fa-calendar"></i> ' + r.date + '</span>' +
        '<span class="resource-downloads"><i class="fas fa-arrow-down"></i> ' + r.downloads + '</span>' +
        '<span class="resource-rating">' + renderStars(r.rating) + '<span class="rating-num">' + r.rating + '</span></span>' +
      '</div>' +
      '<p class="resource-description">' + r.description + '</p>' +
      '<div class="resource-tags">' + tagsHtml + '</div>' +
      '<div class="resource-popularity"><div class="resource-popularity-bar" style="width:' + popularity + '%;"></div></div>' +
    '</div>' +
    '<div class="resource-actions">' +
      '<a href="' + r.link + '" class="download-btn" target="_blank" rel="noopener"><i class="fas fa-download"></i> 下载资源</a>' +
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
      this.title = nowFav ? '取消收藏' : '收藏';

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
