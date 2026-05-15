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
    renderPlaces();
    renderCommentReports();
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

  // --- Places (嗨玩项目) ---
  var _editingPlaceId = null;
  var _editingImages = [];

  function renderPlaces() {
    var list = document.getElementById('admin-places-list');
    var search = document.getElementById('admin-place-search');
    if (!list || typeof allPlaces === 'undefined') return;

    function doRender(term) {
      var filtered = allPlaces;
      if (term) {
        term = term.toLowerCase();
        filtered = allPlaces.filter(function(p) {
          return p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
        });
      }

      list.innerHTML = filtered.map(function(p) {
        var images = _getPlaceImages(p.id);
        var imgCount = images.length;
        return '<div class="admin-list-item admin-place-item">' +
          '<div class="admin-place-thumb">' +
            '<img src="' + (images[0] || p.image) + '" alt="" onerror="this.src=\'https://picsum.photos/80/80?random=' + p.id + '\'">' +
          '</div>' +
          '<div class="admin-list-main">' +
            '<strong>' + p.name + '</strong>' +
            '<span class="admin-list-meta">' + p.category + ' · 评分 ' + p.rating + ' · ' + imgCount + ' 张图片</span>' +
          '</div>' +
          '<button class="btn btn-outline admin-place-edit-btn" data-id="' + p.id + '" data-name="' + encodeURIComponent(p.name) + '">' +
            '<i class="fas fa-edit"></i> 编辑图片' +
          '</button>' +
        '</div>';
      }).join('');

      // Bind edit buttons
      list.querySelectorAll('.admin-place-edit-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = parseInt(this.dataset.id);
          var name = decodeURIComponent(this.dataset.name);
          openImageEditor(id, name);
        });
      });
    }

    doRender('');
    if (search) {
      search.addEventListener('input', function() {
        doRender(this.value);
      });
    }
  }

  function _getPlaceImages(placeId) {
    try {
      var stored = JSON.parse(localStorage.getItem('tls_zju_images')) || {};
      if (stored[String(placeId)] && stored[String(placeId)].length > 0) {
        return stored[String(placeId)].slice(0, 5);
      }
    } catch(e) {}
    var place = allPlaces.find(function(p) { return p.id === placeId; });
    return place ? [place.image] : [];
  }

  function _savePlaceImages(placeId, images) {
    try {
      var stored = JSON.parse(localStorage.getItem('tls_zju_images')) || {};
      stored[String(placeId)] = images;
      localStorage.setItem('tls_zju_images', JSON.stringify(stored));
    } catch(e) {}
  }

  function openImageEditor(placeId, placeName) {
    _editingPlaceId = placeId;
    _editingImages = _getPlaceImages(placeId).slice();

    var overlay = document.getElementById('img-editor-overlay');
    var title = document.getElementById('img-editor-title');
    title.innerHTML = '<i class="fas fa-images"></i> ' + placeName;

    _renderEditorImages();
    overlay.style.display = 'flex';

    // Drop zone
    var dropZone = document.getElementById('admin-img-drop-zone');
    var fileInput = document.getElementById('admin-img-file-input');

    dropZone.onclick = function() { fileInput.click(); };
    dropZone.ondragover = function(e) { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = function() { dropZone.classList.remove('dragover'); };
    dropZone.ondrop = function(e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      _handleImgUpload(e.dataTransfer.files);
    };
    fileInput.onchange = function() {
      _handleImgUpload(this.files);
      this.value = '';
    };
  }

  function _renderEditorImages() {
    var container = document.getElementById('img-editor-current');
    if (!_editingImages.length) {
      container.innerHTML = '<p style="color:var(--text-light);font-size:.85rem;">暂无图片</p>';
      return;
    }
    container.innerHTML = _editingImages.map(function(url, i) {
      return '<div class="img-editor-thumb">' +
        '<img src="' + url + '" alt="">' +
        '<button class="img-editor-thumb-del" data-idx="' + i + '" title="删除"><i class="fas fa-times"></i></button>' +
        (i === 0 ? '<span class="img-editor-cover-badge">封面</span>' : '') +
      '</div>';
    }).join('');

    container.querySelectorAll('.img-editor-thumb-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _editingImages.splice(parseInt(this.dataset.idx), 1);
        _renderEditorImages();
      });
    });
  }

  function _handleImgUpload(files) {
    if (!files || !files.length) return;
    var status = document.getElementById('admin-img-upload-status');
    var remaining = 5 - _editingImages.length;
    if (remaining <= 0) { status.textContent = '已达上限（5张）'; return; }

    var toProcess = Array.from(files).slice(0, remaining);
    status.textContent = '上传中... (0/' + toProcess.length + ')';

    var done = 0;
    toProcess.forEach(function(file) {
      if (typeof ImageUpload !== 'undefined') {
        ImageUpload.compressImage(file, function(blob) {
          ImageUpload.uploadToImgbb(blob, function(url) {
            if (url) _editingImages.push(url);
            done++;
            status.textContent = '上传中... (' + done + '/' + toProcess.length + ')';
            _renderEditorImages();
            if (done >= toProcess.length) status.textContent = '上传完成';
          });
        });
      } else {
        done++;
        status.textContent = 'ImageUpload 模块未加载';
      }
    });
  }

  // Close editor
  function closeImageEditor() {
    document.getElementById('img-editor-overlay').style.display = 'none';
    _editingPlaceId = null;
    _editingImages = [];
  }

  document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('img-editor-overlay');
    if (!overlay) return;

    overlay.querySelector('.img-editor-close').addEventListener('click', closeImageEditor);
    document.getElementById('img-editor-cancel').addEventListener('click', closeImageEditor);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeImageEditor();
    });

    // URL add
    document.getElementById('img-editor-url-add').addEventListener('click', function() {
      var input = document.getElementById('img-editor-url-input');
      var url = input.value.trim();
      if (!url) return;
      if (_editingImages.length >= 5) return;
      _editingImages.push(url);
      input.value = '';
      _renderEditorImages();
    });
    document.getElementById('img-editor-url-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('img-editor-url-add').click();
    });

    // Save
    document.getElementById('img-editor-save').addEventListener('click', function() {
      if (_editingPlaceId !== null) {
        _savePlaceImages(_editingPlaceId, _editingImages);
        closeImageEditor();
        renderPlaces();
      }
    });
  });

  // --- Comment Reports ---
  function renderCommentReports() {
    var list = document.getElementById('admin-comment-reports-list');
    if (!list || typeof Comments === 'undefined') return;

    var reports = Comments.getReports();
    if (reports.length === 0) {
      list.innerHTML = '<p style="color:var(--text-light);">暂无评论举报</p>';
      return;
    }

    list.innerHTML = reports.map(function(r, i) {
      var time = '';
      try { time = new Date(r.time).toLocaleString('zh-CN'); } catch(e) {}
      return '<div class="admin-list-item admin-report-item">' +
        '<div class="admin-list-main">' +
          '<strong>' + r.reason + '</strong>' +
          '<span class="admin-list-meta">项目ID: ' + r.placeId + ' · ' + r.nickname + ' · ' + time + '</span>' +
          '<p class="admin-report-body">"' + (r.content || '').substring(0, 100) + '"</p>' +
          (r.detail ? '<p class="admin-report-detail">补充: ' + r.detail + '</p>' : '') +
        '</div>' +
        '<button class="btn btn-outline admin-report-dismiss" data-idx="' + i + '" style="flex-shrink:0;font-size:.78rem;">忽略</button>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.admin-report-dismiss').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Comments.deleteReport(parseInt(this.dataset.idx));
        renderCommentReports();
      });
    });
  }

})();
