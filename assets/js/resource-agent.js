/**
 * resource-agent.js — 学习资源 AI 助手
 * 复刻 search-agent.js 的 UI 结构，数据源为 allResources
 */
var ResourceAgent = (function() {
  var _isOpen = false;
  var _panel = null;

  // Data source
  function _getData() {
    return (typeof allResources !== 'undefined') ? allResources : [];
  }

  // Search
  function _search(query) {
    var data = _getData();
    var q = (query || '').toLowerCase().trim();
    if (!q || !data.length) return [];

    // Also search via pinyin
    var qPinyin = '';
    if (typeof pinyinPro !== 'undefined') {
      try { qPinyin = pinyinPro.pinyin(q, { toneType: 'none', type: 'array' }).join('').toLowerCase(); } catch(e) {}
    }

    return data.filter(function(r) {
      var fields = [r.title, r.uploader, r.description, r.category, r.subcategory, (r.tags || []).join(' ')];
      return fields.some(function(f) {
        var lf = (f || '').toLowerCase();
        if (lf.includes(q)) return true;
        if (qPinyin && typeof pinyinPro !== 'undefined') {
          try {
            var fp = pinyinPro.pinyin(lf, { toneType: 'none', type: 'array' }).join('').toLowerCase();
            if (fp.includes(qPinyin)) return true;
          } catch(e) {}
        }
        return false;
      });
    }).sort(function(a, b) { return (b.downloads || 0) - (a.downloads || 0); }).slice(0, 5);
  }

  function _getRandom(count) {
    var data = _getData();
    if (!data.length) return [];
    return data.slice().sort(function() { return Math.random() - 0.5; }).slice(0, count || 3);
  }

  function _getPopular(count) {
    var data = _getData();
    return data.slice().sort(function(a, b) { return (b.downloads || 0) - (a.downloads || 0); }).slice(0, count || 5);
  }

  function _getLatest(count) {
    var data = _getData();
    return data.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, count || 5);
  }

  // UI: Widget
  function _createWidget() {
    var widget = document.createElement('div');
    widget.id = 'resource-agent-widget';
    widget.className = 'search-agent-widget';
    widget.style.cssText = 'position:fixed;bottom:90px;right:20px;z-index:9990;cursor:pointer;';
    widget.innerHTML =
      '<div class="agent-character">' +
        '<div class="agent-body">' +
          '<div class="agent-face">' +
            '<div class="agent-eye agent-eye-left"></div>' +
            '<div class="agent-eye agent-eye-right"></div>' +
            '<div class="agent-mouth"></div>' +
          '</div>' +
        '</div>' +
        '<div class="agent-shadow"></div>' +
      '</div>';

    widget.addEventListener('click', function(e) {
      e.stopPropagation();
      _togglePanel();
    });

    document.body.appendChild(widget);

    document.addEventListener('click', function(e) {
      if (_isOpen && _panel && !_panel.contains(e.target) && !widget.contains(e.target)) {
        _togglePanel();
      }
    });
  }

  function _togglePanel() {
    if (_isOpen) _closePanel(); else _openPanel();
  }

  function _openPanel() {
    if (_panel) _panel.remove();
    _isOpen = true;

    _panel = document.createElement('div');
    _panel.id = 'resource-agent-panel';
    _panel.className = 'search-agent-panel';
    _panel.innerHTML =
      '<div class="agent-panel-header">' +
        '<span><i class="fas fa-robot"></i> 学习资源助手</span>' +
        '<button class="agent-panel-close"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="agent-panel-messages" id="resource-agent-messages"></div>' +
      '<div class="agent-panel-quick">' +
        '<button class="agent-quick-btn" data-action="random"><i class="fas fa-dice"></i> 随机推荐</button>' +
        '<button class="agent-quick-btn" data-action="popular"><i class="fas fa-fire"></i> 热门推荐</button>' +
        '<button class="agent-quick-btn" data-action="latest"><i class="fas fa-clock"></i> 最新资源</button>' +
      '</div>' +
      '<div class="agent-panel-input">' +
        '<input type="text" id="resource-agent-input" placeholder="问我任何关于学习资源的问题...">' +
        '<button id="resource-agent-send"><i class="fas fa-paper-plane"></i></button>' +
      '</div>';

    document.body.appendChild(_panel);

    _panel.querySelector('.agent-panel-close').addEventListener('click', _togglePanel);

    var input = _panel.querySelector('#resource-agent-input');
    var sendBtn = _panel.querySelector('#resource-agent-send');

    function doSend() {
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      _handleUserInput(text);
    }

    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSend();
    });

    _panel.querySelectorAll('.agent-quick-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _handleQuickAction(this.dataset.action);
      });
    });

    _addAgentMessage('你好！我是学习资源助手，可以帮你找到合适的学习资料。试试问我 "高数真题" 或 "推荐编程书籍" 吧！');
    input.focus();
  }

  function _closePanel() {
    _isOpen = false;
    if (_panel) { _panel.remove(); _panel = null; }
  }

  function _handleUserInput(text) {
    _addUserMessage(text);
    _showThinking();

    setTimeout(function() {
      _hideThinking();
      var results = _search(text);
      if (results.length > 0) {
        _addAgentMessage('找到了 ' + results.length + ' 个相关资源：');
        _addResultCards(results);
      } else {
        _addAgentMessage('抱歉，没有找到 "' + text + '" 相关的资源。试试其他关键词？比如 "真题"、"课件"、"高数"。');
        // Show random recommendations
        var recs = _getRandom(3);
        if (recs.length) {
          _addAgentMessage('也许你会喜欢这些资源：');
          _addResultCards(recs);
        }
      }
    }, 500 + Math.random() * 300);
  }

  function _handleQuickAction(action) {
    var labels = { random: '随机推荐', popular: '热门推荐', latest: '最新资源' };
    _addUserMessage(labels[action]);
    _showThinking();

    setTimeout(function() {
      _hideThinking();
      var results, msg;
      switch (action) {
        case 'random':
          results = _getRandom(3);
          msg = '为你随机推荐几个优质资源：';
          break;
        case 'popular':
          results = _getPopular(5);
          msg = '当前最受欢迎的学习资源：';
          break;
        case 'latest':
          results = _getLatest(5);
          msg = '最新添加的学习资源：';
          break;
      }
      if (results && results.length) {
        _addAgentMessage(msg);
        _addResultCards(results);
      } else {
        _addAgentMessage('暂无数据，请稍后再试。');
      }
    }, 400 + Math.random() * 200);
  }

  function _addUserMessage(text) {
    var msgArea = document.getElementById('resource-agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg user';
    div.innerHTML = '<div class="agent-msg-bubble">' + _escapeHtml(text) + '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _addAgentMessage(text) {
    var msgArea = document.getElementById('resource-agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';
    div.innerHTML = '<div class="agent-msg-bubble">' + text + '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _addResultCards(resources) {
    var msgArea = document.getElementById('resource-agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';

    var cards = resources.map(function(r) {
      return '<div class="agent-result-card" style="text-decoration:none;color:inherit;">' +
        '<a href="' + r.link + '" target="_blank" rel="noopener" class="agent-result-info" style="flex:1;text-decoration:none;color:inherit;">' +
          '<div class="agent-result-name">' + _escapeHtml(r.title) + '</div>' +
          '<div class="agent-result-desc">' + _escapeHtml(r.uploader) + ' · ' + r.category + ' · ' + r.grade + '</div>' +
        '</a>' +
        '<a href="' + r.link + '" target="_blank" rel="noopener" class="agent-result-link"><i class="fas fa-download"></i></a>' +
      '</div>';
    }).join('');

    div.innerHTML = '<div class="agent-result-cards">' + cards + '</div>';
    msgArea.appendChild(div);

    _scrollToBottom();
  }

  function _showThinking() {
    var msgArea = document.getElementById('resource-agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';
    div.id = 'resource-agent-thinking';
    div.innerHTML = '<div class="agent-thinking"><span class="agent-thinking-dot"></span><span class="agent-thinking-dot"></span><span class="agent-thinking-dot"></span></div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _hideThinking() {
    var el = document.getElementById('resource-agent-thinking');
    if (el) el.remove();
  }

  function _scrollToBottom() {
    var msgArea = document.getElementById('resource-agent-messages');
    if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
  }

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    _createWidget();
  }

  return { init: init };
})();
