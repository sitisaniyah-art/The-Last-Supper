/**
 * Auth Module - GitHub 用户名登录 + Gist 同步
 *
 * 存储结构:
 *   tls_auth = { username, avatar, token|null }
 *   tls_userdata_{username} = { favorites:[], likes:{}, downloads:{}, ratings:{} }
 *
 * Gist 同步 (需要 PAT):
 *   查找/创建 description="the-last-supper-data" 的私有 Gist
 *   Gist 内 data.json 文件存储完整用户数据
 */
var Auth = (function() {
  'use strict';

  var AUTH_KEY = 'tls_auth';
  var GIST_DESC = 'the-last-supper-data';

  // 回调列表
  var onLoginCallbacks = [];
  var onLogoutCallbacks = [];

  // --- 内部工具 ---

  function _getAuth() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
    catch(e) { return null; }
  }

  function _saveAuth(data) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  }

  function _getUserDataKey(username) {
    return 'tls_userdata_' + username;
  }

  function _getDefaultData() {
    return { favorites: [], likes: {}, downloads: {}, ratings: {} };
  }

  function _mergeData(local, remote) {
    var merged = _getDefaultData();
    // favorites: union
    merged.favorites = _unique((local.favorites || []).concat(remote.favorites || []));
    // likes: merge objects
    merged.likes = Object.assign({}, local.likes || {}, remote.likes || {});
    // downloads: take max per key
    var dlSources = [local.downloads || {}, remote.downloads || {}];
    var allKeys = _unique(Object.keys(dlSources[0]).concat(Object.keys(dlSources[1])));
    allKeys.forEach(function(k) {
      merged.downloads[k] = Math.max(dlSources[0][k] || 0, dlSources[1][k] || 0);
    });
    // ratings: local takes priority
    merged.ratings = Object.assign({}, remote.ratings || {}, local.ratings || {});
    return merged;
  }

  function _unique(arr) {
    var seen = {};
    return arr.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function _fireCallbacks(list) {
    for (var i = 0; i < list.length; i++) {
      try { list[i](); } catch(e) { console.error('Auth callback error:', e); }
    }
  }

  // --- Gist API ---

  function _gistHeaders(token) {
    return {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  function _findGist(token) {
    return fetch('https://api.github.com/gists', {
      headers: _gistHeaders(token)
    })
    .then(function(res) {
      if (!res.ok) throw new Error('获取 Gist 列表失败: ' + res.status);
      return res.json();
    })
    .then(function(gists) {
      for (var i = 0; i < gists.length; i++) {
        if (gists[i].description === GIST_DESC) return gists[i];
      }
      return null;
    });
  }

  function _createGist(token) {
    var data = _getDefaultData();
    return fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: _gistHeaders(token),
      body: JSON.stringify({
        description: GIST_DESC,
        public: false,
        files: { 'data.json': { content: JSON.stringify(data, null, 2) } }
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('创建 Gist 失败: ' + res.status);
      return res.json();
    });
  }

  function _readGistData(gist) {
    if (!gist || !gist.files || !gist.files['data.json']) return _getDefaultData();
    try { return JSON.parse(gist.files['data.json'].content); }
    catch(e) { return _getDefaultData(); }
  }

  function _writeGistData(token, gistId, data) {
    return fetch('https://api.github.com/gists/' + gistId, {
      method: 'PATCH',
      headers: _gistHeaders(token),
      body: JSON.stringify({
        files: { 'data.json': { content: JSON.stringify(data, null, 2) } }
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('写入 Gist 失败: ' + res.status);
      return res.json();
    });
  }

  // --- 公开 API ---

  var Auth = {
    AUTH_KEY: AUTH_KEY,
    GIST_DESC: GIST_DESC,
    onLogin: onLoginCallbacks,
    onLogout: onLogoutCallbacks,

    isLoggedIn: function() {
      var auth = _getAuth();
      return !!(auth && auth.username);
    },

    getUsername: function() {
      var auth = _getAuth();
      return auth ? auth.username : null;
    },

    getAvatar: function() {
      var auth = _getAuth();
      return auth ? auth.avatar : null;
    },

    getToken: function() {
      var auth = _getAuth();
      return auth ? auth.token : null;
    },

    /**
     * 登录
     * @param {string} username - GitHub 用户名
     * @param {string} [token] - 可选的 Personal Access Token (gist scope)
     * @returns {Promise} resolves with { username, avatar }
     */
    login: function(username, token) {
      var self = this;
      username = (username || '').trim().toLowerCase();
      if (!username) return Promise.reject(new Error('请输入 GitHub 用户名'));

      // 1. 验证用户名
      return fetch('https://api.github.com/users/' + encodeURIComponent(username))
        .then(function(res) {
          if (res.status === 404) throw new Error('GitHub 用户 "' + username + '" 不存在');
          if (!res.ok) throw new Error('验证用户名失败，请稍后重试');
          return res.json();
        })
        .then(function(user) {
          var avatar = user.avatar_url + '&s=40';
          var authData = { username: username, avatar: avatar, token: token || null };
          _saveAuth(authData);

          // 2. 合并匿名数据到 per-user 数据
          var userKey = _getUserDataKey(username);
          var existingUserData;
          try { existingUserData = JSON.parse(localStorage.getItem(userKey)); }
          catch(e) { existingUserData = null; }
          if (!existingUserData) existingUserData = _getDefaultData();

          // 合并匿名的 favorites 和 likes
          var anonFavs, anonLikes;
          try { anonFavs = JSON.parse(localStorage.getItem('tls_favorites')) || []; }
          catch(e) { anonFavs = []; }
          try { anonLikes = JSON.parse(localStorage.getItem('tls_zju_likes')) || {}; }
          catch(e) { anonLikes = {}; }

          var localData = {
            favorites: anonFavs,
            likes: anonLikes,
            downloads: existingUserData.downloads || {},
            ratings: existingUserData.ratings || {}
          };

          var merged = _mergeData(existingUserData, localData);

          // 3. 如果有 token，同步 Gist
          if (token) {
            return self.syncFromGist().then(function(gistData) {
              if (gistData) {
                merged = _mergeData(merged, gistData);
              }
              localStorage.setItem(userKey, JSON.stringify(merged));
              return self.syncToGist().then(function() {
                _fireCallbacks(onLoginCallbacks);
                return { username: username, avatar: avatar };
              });
            }).catch(function(e) {
              console.warn('Gist 同步失败，使用本地数据:', e);
              localStorage.setItem(userKey, JSON.stringify(merged));
              _fireCallbacks(onLoginCallbacks);
              return { username: username, avatar: avatar };
            });
          }

          localStorage.setItem(userKey, JSON.stringify(merged));
          _fireCallbacks(onLoginCallbacks);
          return { username: username, avatar: avatar };
        });
    },

    logout: function() {
      _saveAuth(null);
      localStorage.removeItem(AUTH_KEY);
      _fireCallbacks(onLogoutCallbacks);
    },

    getUserData: function() {
      var auth = _getAuth();
      if (!auth || !auth.username) return _getDefaultData();
      try { return JSON.parse(localStorage.getItem(_getUserDataKey(auth.username))) || _getDefaultData(); }
      catch(e) { return _getDefaultData(); }
    },

    saveUserData: function(data) {
      var auth = _getAuth();
      if (!auth || !auth.username) return;
      localStorage.setItem(_getUserDataKey(auth.username), JSON.stringify(data));
      // 异步同步到 Gist
      if (auth.token) {
        this.syncToGist().catch(function(e) {
          console.warn('Gist 同步失败:', e);
        });
      }
    },

    /**
     * 从 Gist 拉取数据并合并到 localStorage
     */
    syncFromGist: function() {
      var auth = _getAuth();
      if (!auth || !auth.token) return Promise.resolve(null);

      return _findGist(auth.token).then(function(gist) {
        if (!gist) return null;
        // 保存 gist ID 以便后续写入
        auth.gistId = gist.id;
        _saveAuth(auth);
        return _readGistData(gist);
      });
    },

    /**
     * 将本地数据推送到 Gist
     */
    syncToGist: function() {
      var auth = _getAuth();
      if (!auth || !auth.token) return Promise.resolve();

      var data = this.getUserData();

      if (auth.gistId) {
        return _writeGistData(auth.token, auth.gistId, data);
      }

      // 需要先查找或创建 Gist
      var self = this;
      return _findGist(auth.token).then(function(gist) {
        if (gist) {
          auth.gistId = gist.id;
          _saveAuth(auth);
          return _writeGistData(auth.token, gist.id, data);
        }
        return _createGist(auth.token).then(function(newGist) {
          auth.gistId = newGist.id;
          _saveAuth(auth);
          return _writeGistData(auth.token, newGist.id, data);
        });
      });
    },

    /**
     * 更新用户数据中的某个字段并同步
     */
    updateField: function(field, value) {
      var data = this.getUserData();
      data[field] = value;
      this.saveUserData(data);
    }
  };

  return Auth;
})();
