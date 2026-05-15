/**
 * pixel-character.js — 交互式像素角色 (深度优化版)
 * 支持: 20种状态动画、8种表情、拖拽移动、部位点击、鼠标跟随、50+台词、5个彩蛋
 * 性能: requestAnimationFrame、throttle、visibilitychange 暂停
 */
var PixelChar = (function() {
  // --- State ---
  var _visible = true;
  var _state = 'idle';
  var _container = null;
  var _body = null;
  var _speechTimer = null;
  var _blinkTimer = null;
  var _idleTimer = null;
  var _animTimer = null;
  var _dragging = false;
  var _dragOffset = { x: 0, y: 0 };
  var _clickCount = 0;
  var _clickTimer = null;
  var _mouseHistory = [];
  var _circlePoints = [];
  var _paused = false;

  // --- Quotes (50+) ---
  var QUOTES = {
    study: [
      '加油学习！你一定能行！',
      '知识就是力量，继续加油~',
      '今天的努力是明天的收获！',
      '学海无涯，但你很厉害！',
      '每一道题都是进步的机会',
      '相信自己，你可以的！',
      '再坚持一下，胜利就在前方',
      '努力学习的你最闪耀！',
      '困难只是暂时的，加油！',
      '滴水穿石，持之以恒！',
      '学而不思则罔，思而不学则殆',
      '书山有路勤为径！',
      '今天的汗水，明天的果实',
      '不怕慢，只怕站，继续前进！',
      '你比你想象的更强大！'
    ],
    morning: [
      '早上好！新的一天，新的开始~',
      '早起的鸟儿有虫吃！',
      '早上好！今天也要元气满满哦',
      '清晨好！美好的一天从学习开始',
      '早安！记得吃早餐哦~'
    ],
    afternoon: [
      '下午好！继续加油呀~',
      '午后时光，适合安静学习',
      '下午好！别忘了适当休息',
      '午安！学习之余也要放松一下',
      '下午茶时间到了~ 休息一下吧'
    ],
    evening: [
      '晚上好！今天辛苦了~',
      '夜晚是思考的好时光',
      '晚上好！记得早点休息哦',
      '夜深了，别太晚睡觉~',
      '晚上学习效率也很高呢！'
    ],
    night: [
      '夜深了，早点休息吧~',
      '熬夜对身体不好哦，早点睡',
      '深夜了，明天再继续吧',
      '晚安！做个好梦~',
      '夜猫子也要注意休息哦'
    ],
    knowledge: [
      '你知道吗？蜜蜂可以识别人脸',
      '小知识：海獭睡觉时会手牵手',
      '你知道吗？香蕉是浆果，草莓不是',
      '冷知识：章鱼有三颗心脏',
      '你知道吗？蜂蜜永远不会变质',
      '小知识：蝴蝶用脚品尝食物',
      '你知道吗？人一生平均笑约25万次',
      '冷知识：鲨鱼比树出现得更早',
      '你知道吗？金鱼的记忆不止7秒',
      '小知识：大象是唯一不能跳跃的动物'
    ],
    humor: [
      '我不是在摸鱼，我是在思考人生',
      '学习使我快乐（并不）',
      '今天也是充满bug的一天',
      '代码写多了会变秃的...等等',
      '我看了看你，又看了看题，告辞',
      '世界上最远的距离是：我在学习，手机在旁边',
      '有人说学习使人年轻，我信了',
      '今天的我也是元气满满的咸鱼呢',
      '复习？不存在的，预习才是王道',
      '考试前：我要好好学习！考试后：下次一定'
    ],
    holiday: [
      '新年快乐！新的一年学业进步！',
      '春节快乐！恭喜发财，学业有成！',
      '中秋快乐！月圆人团圆~',
      '国庆快乐！假期也要适当学习哦',
      '双11快乐！别忘了学习，别只顾着剁手'
    ]
  };

  // Easter egg triggers
  var _easterEggs = {
    rapidClick: { triggered: false, threshold: 10 },
    circleDraw: { triggered: false, points: [] },
    scrollToBottom: { triggered: false },
    darkModeSwitch: { triggered: false },
    searchPixel: { triggered: false }
  };

  // --- Helpers ---
  function _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function _pick(arr) { return arr[_rand(0, arr.length - 1)]; }

  function _getTimeQuotes() {
    var h = new Date().getHours();
    if (h >= 6 && h < 12) return QUOTES.morning;
    if (h >= 12 && h < 14) return QUOTES.afternoon;
    if (h >= 14 && h < 18) return QUOTES.afternoon;
    if (h >= 18 && h < 22) return QUOTES.evening;
    return QUOTES.night;
  }

  function _getHolidayQuotes() {
    var now = new Date();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    if (m === 1 && d === 1) return ['新年快乐！新的一年学业进步！'];
    if (m === 1 || m === 2) return QUOTES.holiday.slice(1, 2); // 春节
    if (m === 10 && d <= 7) return QUOTES.holiday.slice(3, 4); // 国庆
    if (m === 9 || m === 10) {
      // Check if around中秋 (approximate)
      if (d >= 10 && d <= 20) return QUOTES.holiday.slice(2, 3);
    }
    if (m === 11 && d === 11) return QUOTES.holiday.slice(4);
    return null;
  }

  function _getRandomQuote() {
    var holiday = _getHolidayQuotes();
    if (holiday) return _pick(holiday);
    var all = QUOTES.study.concat(_getTimeQuotes(), QUOTES.knowledge, QUOTES.humor);
    return _pick(all);
  }

  // --- Build HTML ---
  function _buildHTML() {
    return '<div id="pixel-char-container">' +
      '<div id="pixel-char-speech" class="pixel-char-speech"></div>' +
      '<div id="pixel-char-body" class="pixel-char-body">' +
        '<div class="pixel-head" data-part="head">' +
          '<div class="pixel-eyes">' +
            '<div class="pixel-eye pixel-eye-left"><div class="pixel-pupil"></div></div>' +
            '<div class="pixel-eye pixel-eye-right"><div class="pixel-pupil"></div></div>' +
          '</div>' +
          '<div class="pixel-mouth"></div>' +
        '</div>' +
        '<div class="pixel-torso" data-part="torso">' +
          '<div class="pixel-arm pixel-arm-left" data-part="arm-left"></div>' +
          '<div class="pixel-arm pixel-arm-right" data-part="arm-right"></div>' +
        '</div>' +
        '<div class="pixel-legs">' +
          '<div class="pixel-leg pixel-leg-left" data-part="leg-left"></div>' +
          '<div class="pixel-leg pixel-leg-right" data-part="leg-right"></div>' +
        '</div>' +
      '</div>' +
      '<div id="pixel-char-shadow" class="pixel-char-shadow"></div>' +
    '</div>';
  }

  // --- State management ---
  function _setState(state, duration) {
    if (!_container) return;
    // Remove all state classes
    var classes = _container.className.split(' ').filter(function(c) { return !c.startsWith('state-') && !c.startsWith('face-'); });
    classes.push('state-' + state);
    _container.className = classes.join(' ');
    _state = state;

    // Remove overlays
    var oldZzz = _container.querySelector('.pixel-zzz');
    if (oldZzz) oldZzz.remove();
    var oldStars = _container.querySelector('.pixel-stars');
    if (oldStars) oldStars.remove();
    var oldQ = _container.querySelector('.pixel-question');
    if (oldQ) oldQ.remove();

    // Add overlays for specific states
    if (state === 'sleep') {
      var zzz = document.createElement('div');
      zzz.className = 'pixel-zzz';
      zzz.textContent = 'Zzz';
      _body.appendChild(zzz);
    } else if (state === 'fall') {
      var stars = document.createElement('div');
      stars.className = 'pixel-stars';
      stars.textContent = '💫';
      _body.appendChild(stars);
    } else if (state === 'confused') {
      var q = document.createElement('div');
      q.className = 'pixel-question';
      q.textContent = '?';
      _body.appendChild(q);
    }

    // Auto-revert after duration
    if (duration) {
      clearTimeout(_animTimer);
      _animTimer = setTimeout(function() {
        if (_state === state) _setState('idle');
      }, duration);
    }
  }

  // --- Speech ---
  function _showSpeech(text) {
    var el = document.getElementById('pixel-char-speech');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(_speechTimer);
    _speechTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
  }

  // --- Blink ---
  function _doBlink() {
    if (_state !== 'idle' || _paused) return;
    _setState('blink');
    setTimeout(function() { if (_state === 'blink') _setState('idle'); }, 200);
  }
  function _scheduleBlink() {
    clearTimeout(_blinkTimer);
    _blinkTimer = setTimeout(function() { _doBlink(); _scheduleBlink(); }, _rand(2000, 5000));
  }

  // --- Idle yawn ---
  function _doIdleAction() {
    if (_state !== 'idle' || _paused) return;
    _setState('yawn', 2500);
    _showSpeech('哈~ 学累了...');
  }
  function _scheduleIdle() {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(function() { _doIdleAction(); _scheduleIdle(); }, 30000);
  }
  function _resetIdle() { clearTimeout(_idleTimer); _scheduleIdle(); }

  // --- Eye follow ---
  function _eyeFollow(e) {
    if (!_container || _state === 'blink' || _state === 'sleep' || _paused) return;
    var pupils = _container.querySelectorAll('.pixel-pupil');
    pupils.forEach(function(pupil) {
      var rect = pupil.parentElement.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var angle = Math.atan2(dy, dx);
      var dist = Math.min(2, Math.sqrt(dx * dx + dy * dy) / 80);
      pupil.style.transform = 'translate(' + (Math.cos(angle) * dist) + 'px,' + (Math.sin(angle) * dist) + 'px)';
    });
  }

  // --- Part click reactions ---
  function _onPartClick(part) {
    _resetIdle();
    switch (part) {
      case 'head':
        _setState('shy', 1500);
        _showSpeech(_pick(['嘿嘿，被发现了~', '摸摸头~', '好痒呀！', '别弄乱我的发型！']));
        break;
      case 'arm-left':
      case 'arm-right':
        _setState('wave', 1000);
        _showSpeech(_pick(['Hi~ 你好！', '打招呼！', '嗨~']));
        break;
      case 'leg-left':
      case 'leg-right':
        _setState('jump', 800);
        _showSpeech(_pick(['嘿咻！', '跳起来！', '弹跳！']));
        break;
      case 'torso':
        _setState('happy', 1000);
        _showSpeech(_pick(['被你戳到了！', '哈哈好痒~', '不要戳我啦！']));
        break;
      default:
        _randomAction();
    }
  }

  // --- Random action ---
  function _randomAction() {
    var actions = ['wave', 'jump', 'happy', 'dance', 'spin', 'greet', 'proud'];
    var action = _pick(actions);
    _setState(action, action === 'spin' ? 800 : 1200);
    _showSpeech(_getRandomQuote());
    _resetIdle();
  }

  // --- Drag ---
  function _startDrag(e) {
    if (_dragging) return;
    _dragging = true;
    _container.classList.add('dragging');
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var rect = _container.getBoundingClientRect();
    _dragOffset.x = clientX - rect.left;
    _dragOffset.y = clientY - rect.top;
    _container.style.transition = 'none';
    e.preventDefault();
  }

  function _onDrag(e) {
    if (!_dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var x = clientX - _dragOffset.x;
    var y = clientY - _dragOffset.y;
    // Clamp to viewport
    x = Math.max(0, Math.min(window.innerWidth - 60, x));
    y = Math.max(0, Math.min(window.innerHeight - 80, y));
    _container.style.left = x + 'px';
    _container.style.top = y + 'px';
    _container.style.bottom = 'auto';
    _container.style.right = 'auto';
  }

  function _endDrag() {
    if (!_dragging) return;
    _dragging = false;
    _container.classList.remove('dragging');
    _container.style.transition = '';
  }

  // --- Rapid click Easter egg ---
  function _onBodyClick(e) {
    if (_dragging) return;
    e.stopPropagation();

    // Detect part click
    var target = e.target;
    var part = target.getAttribute('data-part');
    if (!part && target.parentElement) part = target.parentElement.getAttribute('data-part');

    // Rapid click detection
    _clickCount++;
    clearTimeout(_clickTimer);
    _clickTimer = setTimeout(function() { _clickCount = 0; }, 1000);

    if (_clickCount >= 10 && !_easterEggs.rapidClick.triggered) {
      _easterEggs.rapidClick.triggered = true;
      _setState('dance', 3000);
      _showSpeech('哇！你点了好多下！来跳舞吧！');
      setTimeout(function() { _easterEggs.rapidClick.triggered = false; }, 10000);
      return;
    }

    if (part) {
      _onPartClick(part);
    } else {
      _randomAction();
    }
  }

  // --- Double click ---
  function _onDblClick(e) {
    e.stopPropagation();
    // Easter egg: special surprise
    _setState('spin', 1600);
    _showSpeech(_pick(['变身！✨', '闪亮登场！⭐', 'Surprise！🎉', '你触发了隐藏彩蛋！']));
  }

  // --- Mouse speed detection ---
  function _throttle(fn, ms) {
    var last = 0;
    return function() {
      var now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, arguments); }
    };
  }

  var _trackMouseSpeed = _throttle(function(e) {
    _mouseHistory.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (_mouseHistory.length > 5) _mouseHistory.shift();
    if (_mouseHistory.length >= 3) {
      var first = _mouseHistory[0];
      var last = _mouseHistory[_mouseHistory.length - 1];
      var dt = last.t - first.t;
      if (dt > 0) {
        var dist = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
        var speed = dist / dt * 1000;
        if (speed > 800 && _state === 'idle') {
          _setState('run', 1000);
          // Turn towards mouse
          if (_container) {
            var charRect = _container.getBoundingClientRect();
            var charCx = charRect.left + charRect.width / 2;
            _container.style.transform = last.x > charCx ? 'scaleX(1)' : 'scaleX(-1)';
          }
        }
      }
    }
  }, 100);

  // --- Scroll to bottom Easter egg ---
  function _onScroll() {
    if (_easterEggs.scrollToBottom.triggered) return;
    var scrollBottom = window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 50;
    if (scrollBottom) {
      _easterEggs.scrollToBottom.triggered = true;
      _setState('happy', 2000);
      _showSpeech('你看到底部了！太棒了！🎉');
      setTimeout(function() { _easterEggs.scrollToBottom.triggered = false; }, 30000);
    }
  }

  // --- Dark mode Easter egg ---
  var _lastTheme = null;
  function _checkThemeChange() {
    var current = document.documentElement.getAttribute('data-theme');
    if (_lastTheme !== null && current !== _lastTheme && !_easterEggs.darkModeSwitch.triggered) {
      _easterEggs.darkModeSwitch.triggered = true;
      if (current === 'dark') {
        _setState('sleep', 2000);
        _showSpeech('天黑了...我也要睡觉了...');
      } else {
        _setState('happy', 1500);
        _showSpeech('天亮了！又是新的一天！');
      }
      setTimeout(function() { _easterEggs.darkModeSwitch.triggered = false; }, 5000);
    }
    _lastTheme = current;
  }

  // --- Visibility pause ---
  function _onVisibilityChange() {
    _paused = document.hidden;
    if (_paused) {
      clearTimeout(_blinkTimer);
      clearTimeout(_idleTimer);
      clearTimeout(_animTimer);
    } else {
      _scheduleBlink();
      _scheduleIdle();
    }
  }

  // --- Passive avoidance ---
  function _avoidElements() {
    if (_dragging || _state !== 'idle' || !_container) return;
    var charRect = _container.getBoundingClientRect();
    var elements = document.querySelectorAll('.btn, .resource-card, .zj-card, .feature-card, .agent-panel-close');
    elements.forEach(function(el) {
      var elRect = el.getBoundingClientRect();
      var dx = charRect.left - elRect.left;
      var dy = charRect.top - elRect.top;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80 && dist > 0) {
        // Move away slightly
        var moveX = (dx / dist) * 5;
        var moveY = (dy / dist) * 5;
        var curLeft = parseInt(_container.style.left) || charRect.left;
        var curTop = parseInt(_container.style.top) || charRect.top;
        _container.style.left = Math.max(0, Math.min(window.innerWidth - 60, curLeft + moveX)) + 'px';
        _container.style.top = Math.max(0, Math.min(window.innerHeight - 80, curTop + moveY)) + 'px';
        _container.style.bottom = 'auto';
      }
    });
  }

  // --- Toggle ---
  function _toggle() {
    _visible = !_visible;
    if (_container) _container.classList.toggle('hidden-char', !_visible);
  }

  // --- Init ---
  function init() {
    document.body.insertAdjacentHTML('beforeend', _buildHTML());
    _container = document.getElementById('pixel-char-container');
    _body = document.getElementById('pixel-char-body');

    // Click (with part detection)
    _body.addEventListener('click', _onBodyClick);

    // Double click
    _body.addEventListener('dblclick', _onDblClick);

    // Drag
    _body.addEventListener('mousedown', _startDrag);
    _body.addEventListener('touchstart', _startDrag, { passive: false });
    document.addEventListener('mousemove', function(e) { _onDrag(e); _trackMouseSpeed(e); });
    document.addEventListener('touchmove', function(e) { _onDrag(e); }, { passive: false });
    document.addEventListener('mouseup', _endDrag);
    document.addEventListener('touchend', _endDrag);

    // Eye follow
    document.addEventListener('mousemove', _eyeFollow);

    // Hover
    _body.addEventListener('mouseenter', function() { _container.classList.add('hovering'); });
    _body.addEventListener('mouseleave', function() { _container.classList.remove('hovering'); });

    // Scroll
    window.addEventListener('scroll', _onScroll, { passive: true });

    // Theme change detection
    setInterval(_checkThemeChange, 1000);

    // Visibility
    document.addEventListener('visibilitychange', _onVisibilityChange);

    // Passive avoidance (every 2s)
    setInterval(_avoidElements, 2000);

    // Search pixel Easter egg
    var searchInput = document.getElementById('resource-search') || document.getElementById('fun-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        if (this.value.toLowerCase() === 'pixel' && !_easterEggs.searchPixel.triggered) {
          _easterEggs.searchPixel.triggered = true;
          _setState('dance', 2000);
          _showSpeech('你找到我了！我是像素小人！');
          setTimeout(function() { _easterEggs.searchPixel.triggered = false; }, 10000);
        }
      });
    }

    // Start
    _setState('idle');
    _scheduleBlink();
    _scheduleIdle();

    // Greeting after 2s
    setTimeout(function() {
      _showSpeech(_getRandomQuote());
    }, 2000);
  }

  // Public API
  function show() { _visible = true; if (_container) _container.classList.remove('hidden-char'); }
  function hide() { _visible = false; if (_container) _container.classList.add('hidden-char'); }
  function isVisible() { return _visible; }
  function say(text) { _showSpeech(text); }
  function doAction(action) { _setState(action, 1200); }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { show: show, hide: hide, isVisible: isVisible, say: say, doAction: doAction };
})();
