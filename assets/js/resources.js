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

/* Download tracking */
var DL_KEY = 'tls_downloads';
function getDownloads() {
  try { return JSON.parse(localStorage.getItem(DL_KEY)) || {}; } catch(e) { return {}; }
}
function trackDownload(id) {
  var dl = getDownloads();
  dl[id] = (dl[id] || 0) + 1;
  localStorage.setItem(DL_KEY, JSON.stringify(dl));
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    Auth.updateField('downloads', dl);
  }
}
function getLocalDownloadCount(id) {
  return getDownloads()[id] || 0;
}

/* Max downloads across all resources (for popularity bar) */
var MAX_DOWNLOADS = 0;
allResources.forEach(function(r) {
  var total = r.downloads + getLocalDownloadCount(r.id);
  if (total > MAX_DOWNLOADS) MAX_DOWNLOADS = total;
});
if (MAX_DOWNLOADS === 0) MAX_DOWNLOADS = 1;

/* Rating system */
var RTG_KEY = 'tls_ratings';
function getRatings() {
  try { return JSON.parse(localStorage.getItem(RTG_KEY)) || {}; } catch(e) { return {}; }
}
function getMyRating(id) {
  return getRatings()[id] || 0;
}
function setRating(id, rating) {
  var rtg = getRatings();
  rtg[id] = rating;
  localStorage.setItem(RTG_KEY, JSON.stringify(rtg));
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    Auth.updateField('ratings', rtg);
  }
}

function renderStars(rating, resourceId) {
  var myRtg = resourceId ? getMyRating(resourceId) : 0;
  var html = '<span class="star-rating' + (resourceId ? ' star-interactive' : '') + '"' +
    (resourceId ? ' data-resource-id="' + resourceId + '"' : '') + '>';
  for (var i = 1; i <= 5; i++) {
    var filled = myRtg ? (i <= myRtg) : (i <= Math.round(rating));
    html += '<i class="fas fa-star star' + (filled ? ' filled' : '') + '" data-value="' + i + '"></i>';
  }
  html += '</span>';
  if (myRtg) html += '<span class="my-rating-badge" title="我的评分">★' + myRtg + '</span>';
  return html;
}

/* Bind interactive star events */
function bindStarEvents(container) {
  container.querySelectorAll('.star-interactive').forEach(function(span) {
    var resourceId = parseInt(span.getAttribute('data-resource-id'));
    var stars = span.querySelectorAll('.star');

    stars.forEach(function(star) {
      star.addEventListener('mouseenter', function() {
        var val = parseInt(this.getAttribute('data-value'));
        stars.forEach(function(s, idx) {
          s.classList.toggle('filled', idx < val);
        });
      });

      star.addEventListener('click', function() {
        var val = parseInt(this.getAttribute('data-value'));
        setRating(resourceId, val);
        // Re-render this card's stars
        var card = span.closest('.resource-card');
        if (card) {
          var ratingEl = card.querySelector('.resource-rating');
          if (ratingEl) {
            // Find the original resource data for the avg rating
            var r = allResources.find(function(x) { return x.id === resourceId; });
            if (r) ratingEl.innerHTML = renderStars(r.rating, r.id) + '<span class="rating-num">' + r.rating + '</span>';
          }
        }
      });
    });

    span.addEventListener('mouseleave', function() {
      var myRtg = getMyRating(resourceId);
      var r = allResources.find(function(x) { return x.id === resourceId; });
      var baseRtg = r ? r.rating : 0;
      stars.forEach(function(s, idx) {
        var filled = myRtg ? (idx < myRtg) : (idx < Math.round(baseRtg));
        s.classList.toggle('filled', filled);
      });
    });
  });
}

function buildCardHTML(r) {
  var tagsHtml = r.tags.map(function(t) {
    return '<span class="tag">' + t + '</span>';
  }).join('');

  var fav = Favorites.isFavorited(r.id);
  var heartClass = fav ? 'fas fa-heart favorited' : 'far fa-heart';
  var heartTitle = fav ? '取消收藏' : '收藏';
  var accents = CATEGORY_ACCENTS[r.category] || CATEGORY_ACCENTS['其他'];
  var totalDl = r.downloads + getLocalDownloadCount(r.id);
  var popularity = Math.round((totalDl / MAX_DOWNLOADS) * 100);

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
        '<span class="resource-downloads"><i class="fas fa-arrow-down"></i> ' + totalDl + '</span>' +
        '<span class="resource-rating">' + renderStars(r.rating, r.id) + '<span class="rating-num">' + r.rating + '</span></span>' +
      '</div>' +
      '<p class="resource-description">' + r.description + '</p>' +
      '<div class="resource-tags">' + tagsHtml + '</div>' +
      '<div class="resource-popularity"><div class="resource-popularity-bar" style="width:' + popularity + '%;"></div></div>' +
    '</div>' +
    '<div class="resource-actions">' +
      '<a href="' + r.link + '" class="download-btn" target="_blank" rel="noopener" onclick="trackDownload(' + r.id + ')"><i class="fas fa-download"></i> 下载资源</a>' +
      '<a href="' + reportUrl('学习资源', r.title) + '" class="report-btn" target="_blank" rel="noopener" title="举报"><i class="fas fa-flag"></i></a>' +
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
  bindStarEvents(grid);
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
