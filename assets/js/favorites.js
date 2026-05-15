/* Favorites module — localStorage based with Auth awareness */
var Favorites = (function() {
  var STORAGE_KEY = 'tls_favorites';

  /* Returns the correct data source depending on login state */
  function _getAll() {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      return Auth.getUserData().favorites || [];
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _save(ids) {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      Auth.updateField('favorites', ids);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function getAll() {
    return _getAll();
  }

  function isFavorited(id) {
    return _getAll().indexOf(id) !== -1;
  }

  function toggle(id) {
    var ids = _getAll();
    var idx = ids.indexOf(id);
    if (idx !== -1) {
      ids.splice(idx, 1);
    } else {
      ids.push(id);
    }
    _save(ids);
    return idx === -1; // returns true if now favorited
  }

  function count() {
    return _getAll().length;
  }

  function remove(id) {
    var ids = _getAll();
    var idx = ids.indexOf(id);
    if (idx !== -1) {
      ids.splice(idx, 1);
      _save(ids);
    }
  }

  /* Listen for auth state changes to refresh UI */
  if (typeof Auth !== 'undefined') {
    Auth.onLogin.push(function() {
      // Re-render if on resources or favorites page
      if (typeof renderResources === 'function' && typeof allResources !== 'undefined') {
        renderResources(allResources);
      }
      if (typeof renderFavorites === 'function') {
        renderFavorites();
      }
    });
    Auth.onLogout.push(function() {
      if (typeof renderResources === 'function' && typeof allResources !== 'undefined') {
        renderResources(allResources);
      }
      if (typeof renderFavorites === 'function') {
        renderFavorites();
      }
    });
  }

  return {
    getAll: getAll,
    isFavorited: isFavorited,
    toggle: toggle,
    count: count,
    remove: remove
  };
})();
