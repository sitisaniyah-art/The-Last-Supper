/**
 * Pure filter function for resources.
 * Enhanced: added uploader, subcategory search + pinyin support.
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

  // Pinyin support: convert Chinese query to pinyin if library available
  var termPinyin = '';
  if (term && typeof pinyinPro !== 'undefined') {
    try {
      termPinyin = pinyinPro.pinyin(term, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    } catch(e) { termPinyin = ''; }
  }

  return resources.filter(function(r) {
    var matchCat   = category === 'all' || r.category === category;
    var matchGrade = grade    === 'all' || r.grade    === grade;
    var matchType  = type     === 'all' || r.type     === type;

    var matchSearch = true;
    if (term !== '') {
      var searchFields = [
        r.title || '',
        r.description || '',
        r.uploader || '',
        r.subcategory || '',
        r.category || ''
      ];
      var tagStr = (r.tags || []).join(' ');
      searchFields.push(tagStr);

      matchSearch = searchFields.some(function(field) {
        var lf = field.toLowerCase();
        if (lf.includes(term)) return true;
        // Pinyin match
        if (termPinyin && typeof pinyinPro !== 'undefined') {
          try {
            var fp = pinyinPro.pinyin(lf, { toneType: 'none', type: 'array' }).join('').toLowerCase();
            if (fp.includes(termPinyin)) return true;
          } catch(e) {}
        }
        return false;
      });
    }

    return matchCat && matchGrade && matchType && matchSearch;
  });
}

/* UMD export: works in Node (Jest) and browser */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { filterResources: filterResources };
}
