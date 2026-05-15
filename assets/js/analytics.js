/**
 * analytics.js — 本地数据分析模块
 * 存储: localStorage (tls_analytics)
 * 追踪: 页面访问、按钮点击、资源查看、会话时长
 * 纯本地，无外部API调用
 */
var TLSAnalytics = (function() {
  var STORAGE_KEY = 'tls_analytics';
  var SAVE_INTERVAL = 30000; // 30秒批量保存
  var _sessionStart = Date.now();
  var _timer = null;

  function _isBot() {
    var ua = navigator.userAgent.toLowerCase();
    var bots = ['bot', 'crawler', 'spider', 'lighthouse', 'headless', 'chrome-lighthouse', 'pagespeed', 'gtmetrix', 'curl', 'wget'];
    for (var i = 0; i < bots.length; i++) {
      if (ua.indexOf(bots[i]) !== -1) return true;
    }
    return false;
  }

  function _getData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || _defaultData(); }
    catch(e) { return _defaultData(); }
  }

  function _defaultData() {
    return { pageViews: [], clicks: [], resourceViews: [], sessions: 0, totalDuration: 0 };
  }

  function _save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  function trackPageView() {
    if (_isBot()) return;
    var data = _getData();
    data.pageViews.push({ url: location.pathname, ts: Date.now() });
    data.sessions++;
    if (data.pageViews.length > 500) data.pageViews = data.pageViews.slice(-500);
    _save(data);
  }

  function trackClick(element, page) {
    if (_isBot()) return;
    var data = _getData();
    data.clicks.push({ el: element, page: page || location.pathname, ts: Date.now() });
    if (data.clicks.length > 500) data.clicks = data.clicks.slice(-500);
    _save(data);
  }

  function trackResourceView(resourceId) {
    if (_isBot()) return;
    var data = _getData();
    data.resourceViews.push({ id: resourceId, ts: Date.now() });
    if (data.resourceViews.length > 500) data.resourceViews = data.resourceViews.slice(-500);
    _save(data);
  }

  function _batchSave() {
    var data = _getData();
    data.totalDuration = (data.totalDuration || 0) + Math.round((Date.now() - _sessionStart) / 1000);
    _save(data);
    _sessionStart = Date.now();
  }

  function getStats() {
    var data = _getData();
    return {
      totalPageViews: data.pageViews.length,
      totalClicks: data.clicks.length,
      totalResourceViews: data.resourceViews.length,
      sessions: data.sessions,
      totalDuration: data.totalDuration || 0
    };
  }

  function getPageViews() { return _getData().pageViews; }
  function getClicks() { return _getData().clicks; }
  function getResourceViews() { return _getData().resourceViews; }

  function init() {
    if (_isBot()) return;
    trackPageView();
    _timer = setInterval(_batchSave, SAVE_INTERVAL);
    window.addEventListener('beforeunload', _batchSave);

    // 自动追踪按钮点击
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.download-btn, .favorite-btn, .zj-like-btn, .report-btn, .zj-share-btn, .btn-primary, .btn-outline, .zj-comment-btn');
      if (btn) {
        var label = btn.getAttribute('data-tooltip') || btn.getAttribute('title') || btn.textContent.trim().substring(0, 20);
        trackClick(label);
      }
    });
  }

  init();

  return {
    trackPageView: trackPageView,
    trackClick: trackClick,
    trackResourceView: trackResourceView,
    getStats: getStats,
    getPageViews: getPageViews,
    getClicks: getClicks,
    getResourceViews: getResourceViews
  };
})();
