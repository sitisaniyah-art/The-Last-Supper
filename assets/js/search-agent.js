/**
 * search-agent.js — 智能检索 Agent
 * 依赖: tlsPlacesIndex 全局变量（由 head/custom.html 注入）或 allPlaces
 */
var SearchAgent = (function() {
  var _isOpen = false;
  var _chatHistory = [];
  var _panel = null;

  // 获取数据源
  function _getData() {
    if (typeof tlsPlacesIndex !== 'undefined') return tlsPlacesIndex;
    if (typeof allPlaces !== 'undefined') return allPlaces;
    return [];
  }

  // 搜索逻辑
  function _search(query) {
    var data = _getData();
    var q = (query || '').toLowerCase().trim();
    if (!q || !data.length) return [];

    return data.filter(function(p) {
      var name = (p.name || '').toLowerCase();
      var desc = (p.description || '').toLowerCase();
      var addr = (p.address || '').toLowerCase();
      var cat = (p.category || '').toLowerCase();
      var tags = (p.tags || []).join(' ').toLowerCase();
      return name.includes(q) || desc.includes(q) || addr.includes(q) || cat.includes(q) || tags.includes(q);
    }).sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); }).slice(0, 8);
  }

  function _getRandom(count) {
    var data = _getData();
    if (!data.length) return [];
    var shuffled = data.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, count || 5);
  }

  function _getPopular(count) {
    var data = _getData();
    return data.slice().sort(function(a, b) {
      return (b.like_count || 0) - (a.like_count || 0);
    }).slice(0, count || 5);
  }

  function _getLatest(count) {
    var data = _getData();
    return data.slice().sort(function(a, b) {
      return (b.date || '').localeCompare(a.date || '');
    }).slice(0, count || 5);
  }

  // UI: 创建悬浮按钮
  function _createWidget() {
    var widget = document.createElement('div');
    widget.id = 'search-agent-widget';
    widget.className = 'search-agent-widget';
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

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (_isOpen && _panel && !_panel.contains(e.target) && !widget.contains(e.target)) {
        _togglePanel();
      }
    });
  }

  function _togglePanel() {
    if (_isOpen) {
      _closePanel();
    } else {
      _openPanel();
    }
  }

  function _openPanel() {
    if (_panel) _panel.remove();
    _isOpen = true;

    _panel = document.createElement('div');
    _panel.id = 'search-agent-panel';
    _panel.className = 'search-agent-panel';
    _panel.innerHTML =
      '<div class="agent-panel-header">' +
        '<span><i class="fas fa-robot"></i> 嗨玩小助手</span>' +
        '<button class="agent-panel-close"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="agent-panel-messages" id="agent-messages"></div>' +
      '<div class="agent-panel-quick">' +
        '<button class="agent-quick-btn" data-action="nearby"><i class="fas fa-location-crosshairs"></i> 附近推荐</button>' +
        '<button class="agent-quick-btn" data-action="popular"><i class="fas fa-fire"></i> 热门榜单</button>' +
        '<button class="agent-quick-btn" data-action="latest"><i class="fas fa-clock"></i> 最新添加</button>' +
        '<button class="agent-quick-btn" data-action="random"><i class="fas fa-dice"></i> 随机推荐</button>' +
      '</div>' +
      '<div class="agent-panel-input">' +
        '<input type="text" id="agent-input" placeholder="问我任何关于嗨玩榜的问题...">' +
        '<button id="agent-send"><i class="fas fa-paper-plane"></i></button>' +
      '</div>';

    document.body.appendChild(_panel);

    // 关闭按钮
    _panel.querySelector('.agent-panel-close').addEventListener('click', _togglePanel);

    // 输入
    var input = _panel.querySelector('#agent-input');
    var sendBtn = _panel.querySelector('#agent-send');

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

    // 快捷按钮
    _panel.querySelectorAll('.agent-quick-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = this.dataset.action;
        _handleQuickAction(action);
      });
    });

    // 欢迎消息
    _addAgentMessage('你好！我是嗨玩小助手，可以帮你搜索附近的美食、景点和好玩的地方。试试问我 "奶茶" 或 "约会" 吧！');

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
        _addAgentMessage('找到了 ' + results.length + ' 个相关推荐：');
        _addResultCards(results);
      } else {
        _addAgentMessage('抱歉，没有找到 "' + text + '" 相关的地点。试试其他关键词？比如 "美食"、"奶茶"、"约会"。');
      }
    }, 500 + Math.random() * 300);
  }

  function _handleQuickAction(action) {
    var labels = { nearby: '附近推荐', popular: '热门榜单', latest: '最新添加', random: '随机推荐' };
    _addUserMessage(labels[action]);
    _showThinking();

    setTimeout(function() {
      _hideThinking();
      var results;
      var msg;
      switch (action) {
        case 'nearby':
          results = _getRandom(5);
          msg = '为你推荐附近的热门地点：';
          break;
        case 'popular':
          results = _getPopular(5);
          msg = '最受欢迎的地点：';
          break;
        case 'latest':
          results = _getLatest(5);
          msg = '最新添加的地点：';
          break;
        case 'random':
          results = _getRandom(3);
          msg = '随机为你推荐：';
          break;
      }
      if (results && results.length > 0) {
        _addAgentMessage(msg);
        _addResultCards(results);
      } else {
        _addAgentMessage('暂无数据，请稍后再试。');
      }
    }, 400 + Math.random() * 200);
  }

  function _addUserMessage(text) {
    var msgArea = document.getElementById('agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg user';
    div.innerHTML = '<div class="agent-msg-bubble">' + _escapeHtml(text) + '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _addAgentMessage(text) {
    var msgArea = document.getElementById('agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';
    div.innerHTML = '<div class="agent-msg-bubble">' + text + '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _addResultCards(places) {
    var msgArea = document.getElementById('agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';
    var cards = places.map(function(p) {
      var mapUrl = 'https://uri.amap.com/marker?position=&name=' + encodeURIComponent(p.name) + '&address=' + encodeURIComponent(p.address || '');
      return '<a class="agent-result-card" href="' + mapUrl + '" target="_blank" rel="noopener">' +
        '<div class="agent-result-info">' +
          '<div class="agent-result-name">' + _escapeHtml(p.name) + '</div>' +
          '<div class="agent-result-desc">' + _escapeHtml((p.description || '').substring(0, 40)) + '...</div>' +
        '</div>' +
        '<span class="agent-result-rating"><i class="fas fa-star"></i> ' + (p.rating || '-') + '</span>' +
        '<span class="agent-result-link"><i class="fas fa-arrow-right"></i></span>' +
      '</a>';
    }).join('');
    div.innerHTML = '<div class="agent-result-cards">' + cards + '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _showThinking() {
    var msgArea = document.getElementById('agent-messages');
    if (!msgArea) return;
    var div = document.createElement('div');
    div.className = 'agent-msg agent';
    div.id = 'agent-thinking-msg';
    div.innerHTML = '<div class="agent-thinking">' +
      '<span class="agent-thinking-dot"></span>' +
      '<span class="agent-thinking-dot"></span>' +
      '<span class="agent-thinking-dot"></span>' +
    '</div>';
    msgArea.appendChild(div);
    _scrollToBottom();
  }

  function _hideThinking() {
    var el = document.getElementById('agent-thinking-msg');
    if (el) el.remove();
  }

  function _scrollToBottom() {
    var msgArea = document.getElementById('agent-messages');
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
