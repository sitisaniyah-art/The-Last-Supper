/**
 * pixel-character.js — 交互式像素角色
 * 状态: idle, blink, wave, jump, happy, yawn
 * 交互: hover放大、眼睛跟随鼠标、点击随机动作+台词、30s idle打哈欠
 * 双击切换显示/隐藏
 */
var PixelChar = (function() {
  var _visible = true;
  var _state = 'idle';
  var _idleTimer = null;
  var _blinkTimer = null;
  var _speechTimer = null;
  var _container = null;
  var _eyes = null;
  var _body = null;

  var LINES = [
    '加油学习！',
    '今天也要元气满满哦~',
    '知识就是力量！',
    '别忘了休息一会儿~',
    '你是最棒的！',
    '冲鸭！考试必过！',
    '学累了就去嗨玩榜看看吧',
    '一起进步，共同成长',
    '坚持就是胜利！',
    '代码写累了？喝杯奶茶吧'
  ];

  function _rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _pick(arr) {
    return arr[_rand(0, arr.length - 1)];
  }

  function _buildHTML() {
    return '<div id="pixel-char-container">' +
      '<div id="pixel-char-speech" class="pixel-char-speech"></div>' +
      '<div id="pixel-char-body" class="pixel-char-body">' +
        // Head
        '<div class="pixel-head">' +
          '<div class="pixel-eyes">' +
            '<div class="pixel-eye pixel-eye-left"><div class="pixel-pupil"></div></div>' +
            '<div class="pixel-eye pixel-eye-right"><div class="pixel-pupil"></div></div>' +
          '</div>' +
          '<div class="pixel-mouth"></div>' +
        '</div>' +
        // Body
        '<div class="pixel-torso">' +
          '<div class="pixel-arm pixel-arm-left"></div>' +
          '<div class="pixel-arm pixel-arm-right"></div>' +
        '</div>' +
        // Legs
        '<div class="pixel-legs">' +
          '<div class="pixel-leg pixel-leg-left"></div>' +
          '<div class="pixel-leg pixel-leg-right"></div>' +
        '</div>' +
      '</div>' +
      '<div id="pixel-char-shadow" class="pixel-char-shadow"></div>' +
    '</div>';
  }

  function _setState(state) {
    if (!_container) return;
    _container.classList.remove('state-idle', 'state-blink', 'state-wave', 'state-jump', 'state-happy', 'state-yawn');
    _container.classList.add('state-' + state);
    _state = state;
  }

  function _showSpeech(text) {
    var el = document.getElementById('pixel-char-speech');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(_speechTimer);
    _speechTimer = setTimeout(function() {
      el.classList.remove('show');
    }, 2500);
  }

  function _doBlink() {
    if (_state !== 'idle') return;
    _setState('blink');
    setTimeout(function() {
      if (_state === 'blink') _setState('idle');
    }, 200);
  }

  function _scheduleBlink() {
    clearTimeout(_blinkTimer);
    _blinkTimer = setTimeout(function() {
      _doBlink();
      _scheduleBlink();
    }, _rand(2000, 5000));
  }

  function _doIdleAction() {
    if (_state !== 'idle') return;
    _setState('yawn');
    _showSpeech('哈~ 学累了...');
    setTimeout(function() {
      if (_state === 'yawn') _setState('idle');
    }, 2000);
  }

  function _scheduleIdle() {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(function() {
      _doIdleAction();
      _scheduleIdle();
    }, 30000);
  }

  function _resetIdle() {
    clearTimeout(_idleTimer);
    _scheduleIdle();
  }

  function _randomAction() {
    var actions = ['wave', 'jump', 'happy'];
    var action = _pick(actions);
    _setState(action);
    _showSpeech(_pick(LINES));
    _resetIdle();

    var duration = action === 'jump' ? 600 : 800;
    setTimeout(function() {
      _setState('idle');
    }, duration);
  }

  function _eyeFollow(e) {
    if (!_eyes || _state === 'blink') return;
    var pupils = _container.querySelectorAll('.pixel-pupil');
    pupils.forEach(function(pupil) {
      var rect = pupil.parentElement.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var angle = Math.atan2(dy, dx);
      var dist = Math.min(2, Math.sqrt(dx * dx + dy * dy) / 50);
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist;
      pupil.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
    });
  }

  function _toggle() {
    _visible = !_visible;
    if (_container) {
      _container.style.display = _visible ? '' : 'none';
    }
  }

  function init() {
    // Inject HTML
    document.body.insertAdjacentHTML('beforeend', _buildHTML());
    _container = document.getElementById('pixel-char-container');
    _eyes = _container.querySelector('.pixel-eyes');
    _body = document.getElementById('pixel-char-body');

    // Click → random action
    _body.addEventListener('click', function(e) {
      e.stopPropagation();
      _randomAction();
    });

    // Double-click → toggle visibility
    _body.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      _toggle();
    });

    // Mouse move → eye follow
    document.addEventListener('mousemove', _eyeFollow);

    // Hover → scale up
    _body.addEventListener('mouseenter', function() {
      _container.classList.add('hovering');
    });
    _body.addEventListener('mouseleave', function() {
      _container.classList.remove('hovering');
    });

    // Start timers
    _setState('idle');
    _scheduleBlink();
    _scheduleIdle();

    // Show greeting after 2s
    setTimeout(function() {
      _showSpeech(_pick(LINES));
    }, 2000);
  }

  // Public API
  function show() { _visible = true; if (_container) _container.style.display = ''; }
  function hide() { _visible = false; if (_container) _container.style.display = 'none'; }
  function isVisible() { return _visible; }
  function say(text) { _showSpeech(text); }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    show: show,
    hide: hide,
    isVisible: isVisible,
    say: say
  };
})();
