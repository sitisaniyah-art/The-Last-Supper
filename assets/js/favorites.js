/* Favorites module — localStorage based, no backend needed */
var Favorites = (function() {
  var STORAGE_KEY = 'tls_favorites';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function isFavorited(id) {
    return getAll().indexOf(id) !== -1;
  }

  function toggle(id) {
    var ids = getAll();
    var idx = ids.indexOf(id);
    if (idx !== -1) {
      ids.splice(idx, 1);
    } else {
      ids.push(id);
    }
    save(ids);
    return idx === -1; // returns true if now favorited
  }

  function count() {
    return getAll().length;
  }

  function remove(id) {
    var ids = getAll();
    var idx = ids.indexOf(id);
    if (idx !== -1) {
      ids.splice(idx, 1);
      save(ids);
    }
  }

  return {
    getAll: getAll,
    isFavorited: isFavorited,
    toggle: toggle,
    count: count,
    remove: remove
  };
})();
