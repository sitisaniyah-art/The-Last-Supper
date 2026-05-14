/**
 * Pure filter function for resources.
 *
 * @param {Array}  resources - Array of resource objects
 * @param {Object} filters   - Filter criteria
 * @param {string} filters.category - Category name or 'all'
 * @param {string} filters.grade    - Grade name or 'all'
 * @param {string} filters.type     - Type name or 'all'
 * @param {string} filters.term     - Search keyword (case-insensitive)
 * @returns {Array} Filtered resources
 */
function filterResources(resources, filters) {
  var category = filters.category || 'all';
  var grade    = filters.grade    || 'all';
  var type     = filters.type     || 'all';
  var term     = (filters.term || '').toLowerCase().trim();

  return resources.filter(function(r) {
    var matchCat   = category === 'all' || r.category === category;
    var matchGrade = grade    === 'all' || r.grade    === grade;
    var matchType  = type     === 'all' || r.type     === type;
    var matchSearch = term === '' ||
      r.title.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      (r.tags && r.tags.some(function(tag) {
        return tag.toLowerCase().includes(term);
      }));

    return matchCat && matchGrade && matchType && matchSearch;
  });
}

/* UMD export: works in Node (Jest) and browser */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { filterResources: filterResources };
}
