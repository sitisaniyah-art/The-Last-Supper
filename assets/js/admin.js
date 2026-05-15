/**
 * admin.js — 管理后台逻辑
 * 密码: ZJUNB
 */
(function() {
  var ADMIN_PASSWORD = 'ZJUNB';
  var SESSION_KEY = 'tls_admin_auth';
  var GITHUB_API = 'https://api.github.com';
  var REPO_OWNER = window.TLS_GITHUB_USERNAME || 'sitisaniyah-art';
  var REPO_NAME = window.TLS_GITHUB_REPO || 'The-Last-Supper';

  // --- Password auth ---
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function login() {
    var input = document.getElementById('admin-password').value;
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      initPanel();
    } else {
      var err = document.getElementById('login-error');
      err.style.display = 'block';
      document.getElementById('admin-password').value = '';
    }
  }

  // Auto-login if session exists
  if (isLoggedIn()) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', function() {
    var loginBtn = document.getElementById('admin-login-btn');
    var pwInput = document.getElementById('admin-password');
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (pwInput) pwInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') login();
    });

    if (isLoggedIn()) initPanel();
  });

  // --- Tab switching ---
  function initPanel() {
    document.querySelectorAll('.admin-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.admin-content').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById('tab-' + this.getAttribute('data-tab')).classList.add('active');
      });
    });

    renderOverview();
    renderResources();
    loadReports();
    renderLogs();
  }

  // --- Overview ---
  function renderOverview() {
    var stats = document.getElementById('admin-stats');
    if (!stats) return;

    var totalRes = allResources.length;
    var totalDl = 0;
    var avgRating = 0;
    allResources.forEach(function(r) {
      totalDl += r.downloads;
      avgRating += r.rating;
    });
    avgRating = totalRes ? (avgRating / totalRes).toFixed(1) : '0.0';

    var totalContributors = allContributors.length;
    var totalPoints = 0;
    allContributors.forEach(function(c) { totalPoints += c.points; });

    // Category distribution
    var catCount = {};
    allResources.forEach(function(r) {
      catCount[r.category] = (catCount[r.category] || 0) + 1;
    });

    var cards = [
      { icon: 'fa-book', label: '资源总数', value: totalRes, color: '#6366f1' },
      { icon: 'fa-download', label: '总下载量', value: totalDl, color: '#10b981' },
      { icon: 'fa-star', label: '平均评分', value: avgRating, color: '#f59e0b' },
      { icon: 'fa-users', label: '贡献者', value: totalContributors, color: '#ef4444' },
      { icon: 'fa-trophy', label: '总积分', value: totalPoints, color: '#8b5cf6' },
      { icon: 'fa-list', label: '操作日志', value: (typeof allLogs !== 'undefined' ? allLogs.length : 0), color: '#06b6d4' }
    ];

    stats.innerHTML = cards.map(function(c) {
      return '<div class="admin-stat-card" style="--stat-color:' + c.color + ';">' +
        '<i class="fas ' + c.icon + '"></i>' +
        '<div class="admin-stat-value">' + c.value + '</div>' +
        '<div class="admin-stat-label">' + c.label + '</div>' +
      '</div>';
    }).join('');

    // Category chart
    var chart = document.getElementById('admin-category-chart');
    if (chart) {
      var maxCount = 1;
      for (var cat in catCount) { if (catCount[cat] > maxCount) maxCount = catCount[cat]; }

      var catColors = { '数学': '#6366f1', '编程': '#10b981', '英语': '#f59e0b', '物理': '#ef4444', '其他': '#8b5cf6' };
      chart.innerHTML = '<div class="admin-bar-chart">' +
        Object.keys(catCount).map(function(cat) {
          var pct = Math.round((catCount[cat] / maxCount) * 100);
          var color = catColors[cat] || '#6b7280';
          return '<div class="admin-bar-row">' +
            '<span class="admin-bar-label">' + cat + '</span>' +
            '<div class="admin-bar-track"><div class="admin-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
            '<span class="admin-bar-value">' + catCount[cat] + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    }
  }

  // --- Resources ---
  function renderResources() {
    var list = document.getElementById('admin-resources-list');
    var search = document.getElementById('admin-resource-search');
    if (!list) return;

    function doRender(term) {
      var filtered = allResources;
      if (term) {
        term = term.toLowerCase();
        filtered = allResources.filter(function(r) {
          return r.title.toLowerCase().includes(term) || r.category.toLowerCase().includes(term);
        });
      }

      list.innerHTML = filtered.map(function(r) {
        return '<div class="admin-list-item">' +
          '<div class="admin-list-main">' +
            '<strong>' + r.title + '</strong>' +
            '<span class="admin-list-meta">' + r.category + ' · 下载 ' + r.downloads + ' · 评分 ' + r.rating + '</span>' +
          '</div>' +
          '<span class="admin-list-id">#' + r.id + '</span>' +
        '</div>';
      }).join('');
    }

    doRender('');
    if (search) {
      search.addEventListener('input', function() {
        doRender(this.value);
      });
    }
  }

  // --- Reports (GitHub Issues) ---
  function loadReports() {
    var list = document.getElementById('admin-reports-list');
    if (!list) return;

    list.innerHTML = '<p style="color:var(--text-light);">正在加载举报 Issue...</p>';

    fetch(GITHUB_API + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/issues?labels=report&state=open&per_page=20')
      .then(function(res) { return res.json(); })
      .then(function(issues) {
        if (!Array.isArray(issues) || issues.length === 0) {
          list.innerHTML = '<p style="color:var(--text-light);">暂无待处理的举报</p>';
          return;
        }
        list.innerHTML = issues.map(function(issue) {
          var created = new Date(issue.created_at).toLocaleString('zh-CN');
          return '<div class="admin-list-item admin-report-item">' +
            '<div class="admin-list-main">' +
              '<a href="' + issue.html_url + '" target="_blank" rel="noopener"><strong>' + issue.title + '</strong></a>' +
              '<span class="admin-list-meta">#' + issue.number + ' · ' + created + ' · ' + issue.user.login + '</span>' +
              '<p class="admin-report-body">' + (issue.body || '').substring(0, 200) + '</p>' +
            '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function() {
        list.innerHTML = '<p style="color:var(--danger-color);">加载失败，请检查网络</p>';
      });
  }

  // --- Logs ---
  function renderLogs() {
    var list = document.getElementById('admin-logs-list');
    if (!list || typeof allLogs === 'undefined') return;

    if (allLogs.length === 0) {
      list.innerHTML = '<p style="color:var(--text-light);">暂无操作日志</p>';
      return;
    }

    list.innerHTML = allLogs.slice().reverse().map(function(log) {
      return '<div class="admin-list-item">' +
        '<div class="admin-list-main">' +
          '<strong>' + log.action + '</strong>' +
          '<span class="admin-list-meta">' + log.timestamp + ' · ' + log.operator + ' · ' + log.target + '</span>' +
        '</div>' +
        '<span class="admin-list-badge ' + (log.result === '成功' ? 'admin-badge-success' : 'admin-badge-error') + '">' + log.result + '</span>' +
      '</div>';
    }).join('');
  }

})();
