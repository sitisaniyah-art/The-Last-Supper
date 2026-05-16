/**
 * admin.js — 管理后台逻辑
 * 认证: GitHub Personal Access Token
 * 锁定: 5次失败 → 24小时前端锁定
 * 统计: 本地 TLSAnalytics 数据展示
 */
(function() {
  var GITHUB_API = 'https://api.github.com';
  var REPO_OWNER = window.TLS_GITHUB_USERNAME || 'sitisaniyah-art';
  var REPO_NAME = window.TLS_GITHUB_REPO || 'The-Last-Supper';
  var ALLOWED_USERS = ['sitisaniyah-art'];
  var SESSION_KEY = 'tls_admin_auth';
  var LOCK_KEY = 'tls_admin_lock';
  var MAX_FAILURES = 5;
  var LOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // --- Lock mechanism ---
  function _getLock() {
    try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { failures: 0, lockedUntil: null }; }
    catch(e) { return { failures: 0, lockedUntil: null }; }
  }

  function _saveLock(lock) {
    localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  }

  function _isLocked() {
    var lock = _getLock();
    if (lock.lockedUntil && Date.now() < lock.lockedUntil) return true;
    if (lock.lockedUntil && Date.now() >= lock.lockedUntil) {
      _saveLock({ failures: 0, lockedUntil: null });
      return false;
    }
    return false;
  }

  function _recordFailure() {
    var lock = _getLock();
    lock.failures++;
    if (lock.failures >= MAX_FAILURES) {
      lock.lockedUntil = Date.now() + LOCK_DURATION;
    }
    _saveLock(lock);
  }

  function _resetLock() {
    _saveLock({ failures: 0, lockedUntil: null });
  }

  function _getLockRemaining() {
    var lock = _getLock();
    if (!lock.lockedUntil) return '';
    var ms = lock.lockedUntil - Date.now();
    if (ms <= 0) return '';
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    return h + '小时' + m + '分钟';
  }

  // --- Token auth ---
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function _validateToken(token) {
    return fetch(GITHUB_API + '/user', {
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
    }).then(function(res) {
      if (!res.ok) throw new Error('Invalid token');
      return res.json();
    }).then(function(user) {
      var username = user.login;
      // Check if user is in allowed list
      if (ALLOWED_USERS.indexOf(username) !== -1) {
        return { valid: true, username: username };
      }
      // Check if user is a collaborator
      return fetch(GITHUB_API + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/collaborators/' + username, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      }).then(function(colRes) {
        if (colRes.ok) return { valid: true, username: username };
        throw new Error('Not a collaborator');
      });
    });
  }

  function login() {
    if (_isLocked()) {
      var lockedEl = document.getElementById('login-locked');
      lockedEl.style.display = 'block';
      lockedEl.textContent = '账户已锁定，请 ' + _getLockRemaining() + ' 后重试';
      return;
    }

    var tokenInput = document.getElementById('admin-token');
    var token = tokenInput.value.trim();
    var errorEl = document.getElementById('login-error');
    var loginBtn = document.getElementById('admin-login-btn');

    if (!token) {
      errorEl.textContent = '请输入 Token';
      errorEl.style.display = 'block';
      return;
    }

    loginBtn.textContent = '验证中...';
    loginBtn.disabled = true;
    errorEl.style.display = 'none';

    _validateToken(token).then(function(result) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem('tls_admin_token', token);
      sessionStorage.setItem('tls_admin_user', result.username);
      _resetLock();
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      initPanel();
    }).catch(function(err) {
      _recordFailure();
      var lock = _getLock();
      if (lock.lockedUntil) {
        errorEl.style.display = 'none';
        var lockedEl = document.getElementById('login-locked');
        lockedEl.style.display = 'block';
        lockedEl.textContent = '验证失败次数过多，账户已锁定 ' + _getLockRemaining();
      } else {
        var remaining = MAX_FAILURES - lock.failures;
        errorEl.textContent = '验证失败：' + (err.message === 'Not a collaborator' ? '非项目协作者' : 'Token 无效') + '（剩余 ' + remaining + ' 次机会）';
        errorEl.style.display = 'block';
      }
      tokenInput.value = '';
    }).finally(function() {
      loginBtn.textContent = '验证身份';
      loginBtn.disabled = false;
    });
  }

  // Auto-login if session exists
  if (isLoggedIn()) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
  }

  // Check lock state on load
  if (_isLocked()) {
    var lockedEl = document.getElementById('login-locked');
    if (lockedEl) {
      lockedEl.style.display = 'block';
      lockedEl.textContent = '账户已锁定，请 ' + _getLockRemaining() + ' 后重试';
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var loginBtn = document.getElementById('admin-login-btn');
    var tokenInput = document.getElementById('admin-token');
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (tokenInput) tokenInput.addEventListener('keydown', function(e) {
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
    renderSurvivalGuides();
    renderAnalytics();
  }

  // --- Overview ---
  function renderOverview() {
    var stats = document.getElementById('admin-stats');
    if (!stats) return;

    var totalRes = allResources.length;
    var totalDl = 0;
    allResources.forEach(function(r) {
      totalDl += r.downloads;
    });

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

      var catColors = { '数学与统计类': '#6366f1', '计算机科学与技术类': '#10b981', '电子信息与电气工程类': '#0ea5e9', '机械与能源工程类': '#f97316', '材料科学与工程类': '#a855f7', '物理学类': '#ef4444', '化学与化工类': '#14b8a6', '生命科学与医学类': '#22c55e', '地球与空间科学类': '#0d9488', '土木水利与建筑类': '#d97706', '交通运输与航空航天类': '#3b82f6', '环境与安全科学类': '#65a30d', '农学与食品科学类': '#84cc16', '经济与管理类': '#eab308', '法学与政治学类': '#dc2626', '人文与教育类': '#ec4899', '艺术与设计类': '#f43f5e', '交叉学科类': '#8b5cf6', '公共基础类': '#64748b', '综合类': '#78716c' };
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
            '<span class="admin-list-meta">' + r.category + ' · 下载 ' + r.downloads + '</span>' +
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

    var headers = { 'Accept': 'application/vnd.github.v3+json' };
    var token = sessionStorage.getItem('tls_admin_token');
    if (token) headers['Authorization'] = 'token ' + token;

    fetch(GITHUB_API + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/issues?labels=report&state=open&per_page=20', { headers: headers })
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

  // --- Survival Guide Websites ---
  var SURVIVAL_KEY = 'tls_survival_websites';
  var _defaultWebsites = (typeof allSurvivalWebsites !== 'undefined') ? JSON.parse(JSON.stringify(allSurvivalWebsites)) : [];

  function _getSurvivalWebsites() {
    try {
      var stored = JSON.parse(localStorage.getItem(SURVIVAL_KEY));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch(e) {}
    return _defaultWebsites.slice();
  }

  function _saveSurvivalWebsites(data) {
    localStorage.setItem(SURVIVAL_KEY, JSON.stringify(data));
  }

  function renderSurvivalGuides() {
    var list = document.getElementById('admin-survival-list');
    var search = document.getElementById('admin-survival-search');
    var catFilter = document.getElementById('admin-survival-category-filter');
    if (!list) return;

    function doRender() {
      var term = (search ? search.value : '').toLowerCase();
      var cat = catFilter ? catFilter.value : 'all';
      var websites = _getSurvivalWebsites();

      var filtered = websites.filter(function(w) {
        var matchTerm = !term || w.name.toLowerCase().includes(term) || w.description.toLowerCase().includes(term) || w.url.toLowerCase().includes(term);
        var matchCat = cat === 'all' || w.category === cat;
        return matchTerm && matchCat;
      });

      // Group by category
      var groups = {};
      filtered.forEach(function(w) {
        if (!groups[w.category]) groups[w.category] = [];
        groups[w.category].push(w);
      });

      var html = '';
      var catOrder = ['教务类', '学习类', '生活类', '工具类'];
      catOrder.forEach(function(catName) {
        if (!groups[catName]) return;
        html += '<div class="admin-survival-group"><h4 style="margin:1rem 0 .5rem;color:var(--text-light);font-size:.85rem;"><i class="fas fa-folder"></i> ' + catName + ' (' + groups[catName].length + ')</h4>';
        groups[catName].forEach(function(w, idx) {
          var globalIdx = websites.indexOf(w);
          html += '<div class="admin-list-item admin-survival-item" data-idx="' + globalIdx + '">' +
            '<div class="admin-survival-icon"><i class="' + (w.icon || 'fas fa-link') + '"></i></div>' +
            '<div class="admin-list-main" style="flex:1;min-width:0;">' +
              '<div class="admin-survival-view">' +
                '<strong>' + w.name + '</strong>' +
                '<span class="admin-list-meta">' + w.description + '</span>' +
                '<a href="' + w.url + '" target="_blank" rel="noopener" class="admin-list-meta" style="color:var(--primary-color);word-break:break-all;">' + w.url + '</a>' +
              '</div>' +
              '<div class="admin-survival-edit" style="display:none;">' +
                '<div class="admin-survival-fields">' +
                  '<label>名称</label><input type="text" class="admin-survival-input" data-field="name" value="' + w.name.replace(/"/g, '&quot;') + '">' +
                  '<label>URL</label><input type="text" class="admin-survival-input" data-field="url" value="' + w.url.replace(/"/g, '&quot;') + '">' +
                  '<label>描述</label><input type="text" class="admin-survival-input" data-field="description" value="' + w.description.replace(/"/g, '&quot;') + '">' +
                  '<label>分类</label>' +
                  '<select class="admin-survival-input" data-field="category">' +
                    '<option value="教务类"' + (w.category === '教务类' ? ' selected' : '') + '>教务类</option>' +
                    '<option value="学习类"' + (w.category === '学习类' ? ' selected' : '') + '>学习类</option>' +
                    '<option value="生活类"' + (w.category === '生活类' ? ' selected' : '') + '>生活类</option>' +
                    '<option value="工具类"' + (w.category === '工具类' ? ' selected' : '') + '>工具类</option>' +
                  '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="admin-survival-actions" style="flex-shrink:0;display:flex;gap:4px;">' +
              '<button class="btn btn-outline admin-survival-edit-btn" data-idx="' + globalIdx + '" style="font-size:.75rem;padding:4px 8px;"><i class="fas fa-edit"></i></button>' +
              '<button class="btn btn-outline admin-survival-save-btn" data-idx="' + globalIdx + '" style="font-size:.75rem;padding:4px 8px;display:none;color:var(--success-color);"><i class="fas fa-check"></i></button>' +
              '<button class="btn btn-outline admin-survival-cancel-btn" data-idx="' + globalIdx + '" style="font-size:.75rem;padding:4px 8px;display:none;"><i class="fas fa-times"></i></button>' +
              '<button class="btn btn-outline admin-survival-delete-btn" data-idx="' + globalIdx + '" style="font-size:.75rem;padding:4px 8px;color:var(--danger-color);"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      });

      if (!html) html = '<p style="color:var(--text-light);">没有匹配的网站</p>';
      list.innerHTML = html;

      // Bind edit buttons
      list.querySelectorAll('.admin-survival-edit-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var item = this.closest('.admin-survival-item');
          item.querySelector('.admin-survival-view').style.display = 'none';
          item.querySelector('.admin-survival-edit').style.display = 'block';
          item.querySelector('.admin-survival-edit-btn').style.display = 'none';
          item.querySelector('.admin-survival-delete-btn').style.display = 'none';
          item.querySelector('.admin-survival-save-btn').style.display = '';
          item.querySelector('.admin-survival-cancel-btn').style.display = '';
        });
      });

      // Bind cancel buttons
      list.querySelectorAll('.admin-survival-cancel-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          doRender(); // Re-render to discard changes
        });
      });

      // Bind save buttons
      list.querySelectorAll('.admin-survival-save-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.dataset.idx);
          var item = this.closest('.admin-survival-item');
          var websites = _getSurvivalWebsites();
          var inputs = item.querySelectorAll('.admin-survival-input');
          inputs.forEach(function(input) {
            var field = input.dataset.field;
            if (field) websites[idx][field] = input.value.trim();
          });
          _saveSurvivalWebsites(websites);
          doRender();
        });
      });

      // Bind delete buttons
      list.querySelectorAll('.admin-survival-delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.dataset.idx);
          var websites = _getSurvivalWebsites();
          var name = websites[idx].name;
          if (confirm('确定要删除「' + name + '」吗？')) {
            websites.splice(idx, 1);
            _saveSurvivalWebsites(websites);
            doRender();
          }
        });
      });
    }

    doRender();
    if (search) search.addEventListener('input', doRender);
    if (catFilter) catFilter.addEventListener('change', doRender);

    // Export YAML
    var exportBtn = document.getElementById('admin-survival-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        var websites = _getSurvivalWebsites();
        var yaml = '# --- 实用网站导航 ---\nwebsites:\n';
        var currentCat = '';
        websites.forEach(function(w) {
          if (w.category !== currentCat) {
            yaml += '  # ' + w.category + '\n';
            currentCat = w.category;
          }
          yaml += '  - name: "' + w.name + '"\n';
          yaml += '    icon: "' + w.icon + '"\n';
          yaml += '    description: "' + w.description + '"\n';
          yaml += '    url: "' + w.url + '"\n';
          yaml += '    category: "' + w.category + '"\n\n';
        });

        var blob = new Blob([yaml], { type: 'text/yaml' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'zju-survival-websites.yml';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Reset to defaults
    var resetBtn = document.getElementById('admin-survival-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('确定要恢复默认数据吗？所有修改将丢失。')) {
          localStorage.removeItem(SURVIVAL_KEY);
          doRender();
        }
      });
    }
  }

  // --- Analytics ---
  function renderAnalytics() {
    var statsEl = document.getElementById('admin-analytics-stats');
    var downloadsEl = document.getElementById('admin-analytics-downloads');
    var pagesEl = document.getElementById('admin-analytics-pages');
    if (!statsEl) return;

    var totalRes = allResources.length;
    var totalDl = 0;
    allResources.forEach(function(r) { totalDl += r.downloads; });

    var cards = [
      { icon: 'fa-book', label: '资源总数', value: totalRes, color: '#6366f1' },
      { icon: 'fa-download', label: '总下载量(静态)', value: totalDl, color: '#10b981' },
      { icon: 'fa-users', label: '贡献者', value: allContributors.length, color: '#f59e0b' },
      { icon: 'fa-map-marker-alt', label: '嗨玩项目', value: allPlaces.length, color: '#ef4444' },
      { icon: 'fa-compass', label: '导航网站', value: (typeof allSurvivalWebsites !== 'undefined' ? allSurvivalWebsites.length : 0), color: '#8b5cf6' }
    ];

    statsEl.innerHTML = cards.map(function(c) {
      return '<div class="admin-stat-card" style="--stat-color:' + c.color + ';">' +
        '<i class="fas ' + c.icon + '"></i>' +
        '<div class="admin-stat-value">' + c.value + '</div>' +
        '<div class="admin-stat-label">' + c.label + '</div>' +
      '</div>';
    }).join('');

    if (downloadsEl) {
      downloadsEl.innerHTML = '<p style="color:var(--text-light);">动态下载统计已移除（静态站点无法实现跨用户统计）</p>';
    }
    if (pagesEl) {
      pagesEl.innerHTML = '<p style="color:var(--text-light);">动态访问统计已移除（静态站点无法实现跨用户统计）</p>';
    }
  }

})();
