/**
 * pixel-character.js — 互动角色系统 v2.0（原神Q版风格）
 * 7个可切换角色：软萌少女、兽耳少女、狼耳少年、橘猫、柴犬、大熊猫(默认)、狐耳少女
 * 支持：SVG内联渲染、长按切换、20种状态动画、拖拽移动、部位点击、50+台词、5个彩蛋
 * 性能：requestAnimationFrame、throttle、visibilitychange暂停
 */
var PixelChar = (function() {
  // ==================== State ====================
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
  var _paused = false;
  var _currentChar = 'panda';
  var _longPressTimer = null;
  var _longPressing = false;
  var _selectorOpen = false;
  var _selectorOverlay = null;

  // ==================== SVG Character Data ====================
  var CHARACTERS = {
    panda: {
      name: '大熊猫',
      emoji: '🐼',
      quotes: {
        special: [
          '竹子最好吃了~ 嘎嘣脆！',
          '圆滚滚的我最可爱了~',
          '别看我胖，我超灵活的！',
          '今天也要认真吃竹子哦',
          '黑白配永远的经典~',
          '抱着竹子睡一觉，人生圆满了',
          '我可是国宝，要对我好一点',
          '打个滚给你们看看~',
          '爬树？那可是我的强项！',
          '今天的竹子特别新鲜呢'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<ellipse class="char-leg char-leg-left" cx="42" cy="125" rx="14" ry="12" fill="#2d2d2d"/>' +
              '<ellipse class="char-leg char-leg-right" cx="86" cy="125" rx="14" ry="12" fill="#2d2d2d"/>' +
            '</g>' +
            '<ellipse class="char-body" cx="64" cy="92" rx="32" ry="28" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>' +
            '<ellipse cx="64" cy="88" rx="18" ry="16" fill="white" opacity="0.5"/>' +
            '<g class="char-arm char-arm-left">' +
              '<ellipse cx="30" cy="90" rx="12" ry="16" fill="#2d2d2d" transform="rotate(-15,30,90)"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<ellipse cx="98" cy="90" rx="12" ry="16" fill="#2d2d2d" transform="rotate(15,98,90)"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="40" rx="30" ry="28" fill="white" stroke="#e0e0e0" stroke-width="1"/>' +
            '<ellipse cx="38" cy="22" rx="12" ry="10" fill="#2d2d2d"/>' +
            '<ellipse cx="90" cy="22" rx="12" ry="10" fill="#2d2d2d"/>' +
            '<ellipse class="char-eye char-eye-left" cx="52" cy="40" rx="7" ry="8" fill="#2d2d2d"/>' +
            '<ellipse class="char-eye char-eye-right" cx="76" cy="40" rx="7" ry="8" fill="#2d2d2d"/>' +
            '<circle class="char-pupil char-pupil-left" cx="54" cy="39" r="3" fill="white"/>' +
            '<circle class="char-pupil char-pupil-right" cx="78" cy="39" r="3" fill="white"/>' +
            '<ellipse cx="64" cy="48" rx="4" ry="3" fill="#333"/>' +
            '<path class="char-mouth" d="M58,53 Q64,58 70,53" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
          '</g>' +
          '<g class="char-accessory">' +
            '<rect class="char-bamboo" x="95" y="72" width="6" height="40" rx="3" fill="#7cb342" opacity="0"/>' +
            '<ellipse class="char-blush char-blush-left" cx="44" cy="48" rx="6" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
            '<ellipse class="char-blush char-blush-right" cx="84" cy="48" rx="6" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
          '</g>' +
        '</svg>';
      }
    },

    'soft-girl': {
      name: '软萌少女',
      emoji: '👩',
      quotes: {
        special: [
          '人家会害羞的啦~',
          '今天穿了新裙子，好看吗？',
          '一起学习吧，不会的我教你~',
          '给你比个心！',
          '甜甜的奶茶最好喝了~',
          '今天的阳光好温柔呀',
          '想养一只小猫咪...',
          '日记写满了好多页呢！',
          '抱抱你~ 一切都会好的',
          '哇！这个好可爱呀！'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<rect class="char-leg char-leg-left" x="46" y="110" width="14" height="26" rx="7" fill="#f8bbd0"/>' +
              '<rect class="char-leg char-leg-right" x="68" y="110" width="14" height="26" rx="7" fill="#f8bbd0"/>' +
              '<ellipse cx="53" cy="136" rx="9" ry="4" fill="#e91e63"/>' +
              '<ellipse cx="75" cy="136" rx="9" ry="4" fill="#e91e63"/>' +
            '</g>' +
            '<path d="M48,68 Q48,62 54,60 L74,60 Q80,62 80,68 L82,112 L46,112 Z" fill="#f48fb1"/>' +
            '<path d="M56,60 L64,68 L72,60" fill="none" stroke="#e91e63" stroke-width="1"/>' +
            '<g class="char-arm char-arm-left">' +
              '<rect x="34" y="72" width="12" height="24" rx="6" fill="#ffccbc"/>' +
              '<circle cx="40" cy="96" r="5" fill="#ffccbc"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<rect x="82" y="72" width="12" height="24" rx="6" fill="#ffccbc"/>' +
              '<circle cx="88" cy="96" r="5" fill="#ffccbc"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="36" rx="26" ry="25" fill="#ffccbc"/>' +
            '<path d="M38,28 Q32,8 42,16" stroke="#e8b4b8" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            '<path d="M90,28 Q96,8 86,16" stroke="#e8b4b8" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            '<path d="M38,22 Q42,12 52,16" stroke="#e8b4b8" stroke-width="3" fill="none" stroke-linecap="round"/>' +
            '<path d="M90,22 Q86,12 76,16" stroke="#e8b4b8" stroke-width="3" fill="none" stroke-linecap="round"/>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="36" rx="5" ry="6" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="36" rx="5" ry="6" fill="white"/>' +
            '<circle class="char-pupil char-pupil-left" cx="55" cy="36" r="3.5" fill="#4a148c"/>' +
            '<circle class="char-pupil char-pupil-right" cx="75" cy="36" r="3.5" fill="#4a148c"/>' +
            '<circle cx="56" cy="34" r="1.5" fill="white"/>' +
            '<circle cx="76" cy="34" r="1.5" fill="white"/>' +
            '<path class="char-mouth" d="M59,46 Q64,50 69,46" stroke="#e57373" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
            '<ellipse class="char-blush char-blush-left" cx="46" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
            '<ellipse class="char-blush char-blush-right" cx="82" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
          '</g>' +
          '<g class="char-accessory">' +
            '<circle cx="72" cy="14" r="6" fill="#e91e63"/>' +
            '<circle cx="72" cy="14" r="3" fill="#f48fb1"/>' +
            '<path class="char-heart" d="M60,80 C58,76 52,76 52,80 C52,84 58,88 60,90 C62,88 68,84 68,80 C68,76 62,76 60,80" fill="#e91e63" opacity="0"/>' +
          '</g>' +
        '</svg>';
      }
    },

    'beast-girl': {
      name: '兽耳少女',
      emoji: '🧚',
      quotes: {
        special: [
          '喵呜~ 你来找我玩啦？',
          '耳朵被摸会很痒的！',
          '今天也是元气满满的一天~',
          '本小姐可是很厉害的哦！',
          '想要摸摸头...',
          '呜呜，尾巴藏不住了啦',
          '哼哼，别小看我！',
          '一起出去玩吧~',
          '偷偷告诉你一个秘密...',
          '这个好好玩呀！'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<rect class="char-leg char-leg-left" x="46" y="110" width="14" height="26" rx="7" fill="#ce93d8"/>' +
              '<rect class="char-leg char-leg-right" x="68" y="110" width="14" height="26" rx="7" fill="#ce93d8"/>' +
              '<ellipse cx="53" cy="136" rx="9" ry="4" fill="#7b1fa2"/>' +
              '<ellipse cx="75" cy="136" rx="9" ry="4" fill="#7b1fa2"/>' +
            '</g>' +
            '<rect x="48" y="66" width="32" height="46" rx="8" fill="#ce93d8"/>' +
            '<g class="char-arm char-arm-left">' +
              '<rect x="34" y="70" width="12" height="24" rx="6" fill="#ffccbc"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<rect x="82" y="70" width="12" height="24" rx="6" fill="#ffccbc"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="36" rx="26" ry="25" fill="#ffccbc"/>' +
            '<g class="char-ear char-ear-left">' +
              '<path d="M38,22 L30,2 L46,16 Z" fill="#ffccbc" stroke="#e8b4b8" stroke-width="1"/>' +
              '<path d="M38,18 L34,6 L44,16 Z" fill="#ffb7c5"/>' +
            '</g>' +
            '<g class="char-ear char-ear-right">' +
              '<path d="M90,22 L98,2 L82,16 Z" fill="#ffccbc" stroke="#e8b4b8" stroke-width="1"/>' +
              '<path d="M90,18 L94,6 L84,16 Z" fill="#ffb7c5"/>' +
            '</g>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="36" rx="5" ry="6" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="36" rx="5" ry="6" fill="white"/>' +
            '<circle class="char-pupil char-pupil-left" cx="55" cy="36" r="3.5" fill="#7b1fa2"/>' +
            '<circle class="char-pupil char-pupil-right" cx="75" cy="36" r="3.5" fill="#7b1fa2"/>' +
            '<circle cx="56" cy="34" r="1.5" fill="white"/>' +
            '<circle cx="76" cy="34" r="1.5" fill="white"/>' +
            '<path class="char-mouth" d="M59,46 Q64,50 69,46" stroke="#e57373" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
            '<ellipse class="char-blush char-blush-left" cx="46" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
            '<ellipse class="char-blush char-blush-right" cx="82" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
          '</g>' +
          '<g class="char-accessory">' +
            '<path class="char-tail" d="M88,105 Q105,95 108,80 Q110,70 105,65" stroke="#ce93d8" stroke-width="6" fill="none" stroke-linecap="round"/>' +
          '</g>' +
        '</svg>';
      }
    },

    'wolf-boy': {
      name: '狼耳少年',
      emoji: '🐺',
      quotes: {
        special: [
          '...别误会，我才不是关心你',
          '安静点，我在学习',
          '外面的世界很大，去看看吧',
          '弱者才需要安慰...但你不一样',
          '狼群永不放弃',
          '月光下的思考最清晰',
          '别走丢了，我不会去找你的...才怪',
          '这道题？太简单了',
          '孤独？习惯了就好',
          '保护同伴是本能'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<rect class="char-leg char-leg-left" x="46" y="110" width="14" height="26" rx="7" fill="#546e7a"/>' +
              '<rect class="char-leg char-leg-right" x="68" y="110" width="14" height="26" rx="7" fill="#546e7a"/>' +
              '<ellipse cx="53" cy="136" rx="9" ry="4" fill="#37474f"/>' +
              '<ellipse cx="75" cy="136" rx="9" ry="4" fill="#37474f"/>' +
            '</g>' +
            '<rect x="48" y="66" width="32" height="46" rx="8" fill="#546e7a"/>' +
            '<rect x="54" y="66" width="20" height="8" rx="2" fill="#78909c"/>' +
            '<g class="char-arm char-arm-left">' +
              '<rect x="34" y="70" width="12" height="24" rx="6" fill="#d7ccc8"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<rect x="82" y="70" width="12" height="24" rx="6" fill="#d7ccc8"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="36" rx="26" ry="25" fill="#d7ccc8"/>' +
            '<path d="M38,24 L28,2 L48,18 Z" fill="#78909c"/>' +
            '<path d="M90,24 L100,2 L80,18 Z" fill="#78909c"/>' +
            '<path d="M40,20 L34,6 L46,18 Z" fill="#b0bec5"/>' +
            '<path d="M88,20 L94,6 L82,18 Z" fill="#b0bec5"/>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="36" rx="5" ry="5" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="36" rx="5" ry="5" fill="white"/>' +
            '<circle class="char-pupil char-pupil-left" cx="55" cy="36" r="3" fill="#263238"/>' +
            '<circle class="char-pupil char-pupil-right" cx="75" cy="36" r="3" fill="#263238"/>' +
            '<circle cx="56" cy="34.5" r="1.2" fill="white"/>' +
            '<circle cx="76" cy="34.5" r="1.2" fill="white"/>' +
            '<ellipse cx="64" cy="44" rx="3" ry="2.5" fill="#5d4037"/>' +
            '<path class="char-mouth" d="M59,48 Q64,51 69,48" stroke="#5d4037" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
          '</g>' +
          '<g class="char-accessory">' +
            '<g class="char-note" opacity="0">' +
              '<text x="100" y="60" font-size="16" fill="#90a4ae">♪</text>' +
              '<text x="108" y="50" font-size="12" fill="#b0bec5">♫</text>' +
            '</g>' +
          '</g>' +
        '</svg>';
      }
    },

    'orange-cat': {
      name: '橘猫',
      emoji: '🐱',
      quotes: {
        special: [
          '小鱼干呢？本喵饿了！',
          '铲屎官，过来给我挠挠',
          '这个箱子是我的了~',
          '今天的伙食不错嘛~',
          '别挡着我的阳光！',
          '咕噜咕噜~ 被摸得好舒服',
          '本喵要睡了，别吵...',
          '这个毛线球好有意思！',
          '又胖了？那叫可爱！',
          '偷偷去吃点零食...'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<ellipse class="char-leg char-leg-left" cx="44" cy="122" rx="10" ry="14" fill="#ff9800"/>' +
              '<ellipse class="char-leg char-leg-right" cx="84" cy="122" rx="10" ry="14" fill="#ff9800"/>' +
              '<ellipse cx="44" cy="134" rx="8" ry="4" fill="#fff3e0"/>' +
              '<ellipse cx="84" cy="134" rx="8" ry="4" fill="#fff3e0"/>' +
            '</g>' +
            '<ellipse class="char-body" cx="64" cy="90" rx="30" ry="28" fill="#ff9800"/>' +
            '<ellipse cx="64" cy="95" rx="20" ry="18" fill="#fff3e0" opacity="0.6"/>' +
            '<path class="char-tail cat-tail" d="M92,95 Q115,80 112,60 Q110,48 105,42" stroke="#ff9800" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<g class="char-arm char-arm-left">' +
              '<ellipse cx="34" cy="88" rx="10" ry="14" fill="#ff9800" transform="rotate(-10,34,88)"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<ellipse cx="94" cy="88" rx="10" ry="14" fill="#ff9800" transform="rotate(10,94,88)"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="42" rx="26" ry="24" fill="#ff9800"/>' +
            '<path d="M40,28 L34,6 L50,22 Z" fill="#ff9800"/>' +
            '<path d="M88,28 L94,6 L78,22 Z" fill="#ff9800"/>' +
            '<path d="M42,24 L38,10 L48,22 Z" fill="#ffcc80"/>' +
            '<path d="M86,24 L90,10 L80,22 Z" fill="#ffcc80"/>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="40" rx="5" ry="6" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="40" rx="5" ry="6" fill="white"/>' +
            '<ellipse class="char-pupil char-pupil-left" cx="55" cy="40" rx="2.5" ry="5" fill="#e65100"/>' +
            '<ellipse class="char-pupil char-pupil-right" cx="75" cy="40" rx="2.5" ry="5" fill="#e65100"/>' +
            '<ellipse cx="64" cy="48" rx="3.5" ry="2.5" fill="#ffccbc"/>' +
            '<path d="M64,50 L61,53" stroke="#5d4037" stroke-width="1" stroke-linecap="round"/>' +
            '<path d="M64,50 L67,53" stroke="#5d4037" stroke-width="1" stroke-linecap="round"/>' +
            '<path class="char-mouth" d="M57,54 Q64,58 71,54" stroke="#5d4037" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
            '<line x1="40" y1="44" x2="28" y2="42" stroke="#e0e0e0" stroke-width="0.8"/>' +
            '<line x1="40" y1="47" x2="28" y2="48" stroke="#e0e0e0" stroke-width="0.8"/>' +
            '<line x1="88" y1="44" x2="100" y2="42" stroke="#e0e0e0" stroke-width="0.8"/>' +
            '<line x1="88" y1="47" x2="100" y2="48" stroke="#e0e0e0" stroke-width="0.8"/>' +
            '<ellipse class="char-blush char-blush-left" cx="46" cy="47" rx="5" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
            '<ellipse class="char-blush char-blush-right" cx="82" cy="47" rx="5" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
          '</g>' +
        '</svg>';
      }
    },

    shiba: {
      name: '柴犬',
      emoji: '🐶',
      quotes: {
        special: [
          '汪汪！主人回来啦！',
          '一起去散步好不好？',
          '飞盘！飞盘！扔飞盘！',
          '今天也要忠实地守护你~',
          '尾巴摇摇=心情好好！',
          '这个球是我的！谁也别抢！',
          '呜呜...你是不是不要我了？',
          '汪！我找到宝藏了！',
          '主人的手最温暖了~',
          '摇尾巴是因为看到你开心呀！'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<ellipse class="char-leg char-leg-left" cx="44" cy="122" rx="10" ry="14" fill="#d7a86e"/>' +
              '<ellipse class="char-leg char-leg-right" cx="84" cy="122" rx="10" ry="14" fill="#d7a86e"/>' +
              '<ellipse cx="44" cy="134" rx="8" ry="4" fill="#fff8e1"/>' +
              '<ellipse cx="84" cy="134" rx="8" ry="4" fill="#fff8e1"/>' +
            '</g>' +
            '<ellipse class="char-body" cx="64" cy="90" rx="28" ry="26" fill="#d7a86e"/>' +
            '<ellipse cx="64" cy="92" rx="18" ry="16" fill="#fff8e1" opacity="0.7"/>' +
            '<path class="char-tail shiba-tail" d="M90,90 Q110,75 108,58 Q106,48 100,44" stroke="#d7a86e" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<g class="char-arm char-arm-left">' +
              '<ellipse cx="36" cy="88" rx="10" ry="14" fill="#d7a86e" transform="rotate(-10,36,88)"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<ellipse cx="92" cy="88" rx="10" ry="14" fill="#d7a86e" transform="rotate(10,92,88)"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="40" rx="26" ry="24" fill="#d7a86e"/>' +
            '<path d="M40,26 L36,8 L50,22 Z" fill="#d7a86e" transform="rotate(-10,42,16)"/>' +
            '<path d="M88,26 L92,8 L78,22 Z" fill="#d7a86e" transform="rotate(10,86,16)"/>' +
            '<path d="M42,22 L40,12 L48,20 Z" fill="#c4935a"/>' +
            '<path d="M86,22 L88,12 L80,20 Z" fill="#c4935a"/>' +
            '<ellipse cx="64" cy="44" rx="14" ry="10" fill="#fff8e1"/>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="38" rx="4" ry="5" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="38" rx="4" ry="5" fill="white"/>' +
            '<circle class="char-pupil char-pupil-left" cx="55" cy="38" r="3" fill="#4e342e"/>' +
            '<circle class="char-pupil char-pupil-right" cx="75" cy="38" r="3" fill="#4e342e"/>' +
            '<circle cx="55.5" cy="36.5" r="1.2" fill="white"/>' +
            '<circle cx="75.5" cy="36.5" r="1.2" fill="white"/>' +
            '<ellipse cx="64" cy="46" rx="4" ry="3" fill="#333"/>' +
            '<path class="char-mouth" d="M58,52 Q64,57 70,52" stroke="#5d4037" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
            '<path class="char-tongue" d="M62,54 Q64,60 66,54" fill="#ef9a9a" opacity="0"/>' +
            '<ellipse class="char-blush char-blush-left" cx="46" cy="45" rx="5" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
            '<ellipse class="char-blush char-blush-right" cx="82" cy="45" rx="5" ry="3" fill="#ffcdd2" opacity="0.5"/>' +
          '</g>' +
        '</svg>';
      }
    },

    'fox-girl': {
      name: '狐耳少女',
      emoji: '🦊',
      quotes: {
        special: [
          '嘻嘻~ 你想知道什么秘密？',
          '狐仙大人可是很灵的哦~',
          '月亮下的许愿最灵验',
          '别被我的外表骗了~',
          '尾巴要藏好...哎呀又露出来了',
          '今天的运势是大吉！',
          '偷偷告诉你，桃花运要来了~',
          '九条尾巴？那是传说啦',
          '优雅是一种态度~',
          '幻术？那只是障眼法而已'
        ]
      },
      svg: function() {
        return '<svg viewBox="0 0 128 140" class="char-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<g class="char-body-group">' +
            '<g class="char-legs">' +
              '<rect class="char-leg char-leg-left" x="46" y="110" width="14" height="26" rx="7" fill="#ef9a9a"/>' +
              '<rect class="char-leg char-leg-right" x="68" y="110" width="14" height="26" rx="7" fill="#ef9a9a"/>' +
              '<ellipse cx="53" cy="136" rx="9" ry="4" fill="#c62828"/>' +
              '<ellipse cx="75" cy="136" rx="9" ry="4" fill="#c62828"/>' +
            '</g>' +
            '<rect x="48" y="66" width="32" height="46" rx="8" fill="#ef9a9a"/>' +
            '<rect x="48" y="66" width="32" height="12" rx="4" fill="#e57373"/>' +
            '<g class="char-arm char-arm-left">' +
              '<rect x="34" y="70" width="12" height="24" rx="6" fill="#ffccbc"/>' +
            '</g>' +
            '<g class="char-arm char-arm-right">' +
              '<rect x="82" y="70" width="12" height="24" rx="6" fill="#ffccbc"/>' +
            '</g>' +
          '</g>' +
          '<g class="char-head">' +
            '<ellipse cx="64" cy="36" rx="26" ry="25" fill="#ffccbc"/>' +
            '<g class="char-ear char-ear-left">' +
              '<path d="M38,24 L26,0 L48,18 Z" fill="#ef9a9a" stroke="#e57373" stroke-width="1"/>' +
              '<path d="M38,20 L32,6 L44,18 Z" fill="#ffcdd2"/>' +
            '</g>' +
            '<g class="char-ear char-ear-right">' +
              '<path d="M90,24 L102,0 L80,18 Z" fill="#ef9a9a" stroke="#e57373" stroke-width="1"/>' +
              '<path d="M90,20 L96,6 L84,18 Z" fill="#ffcdd2"/>' +
            '</g>' +
            '<ellipse class="char-eye char-eye-left" cx="54" cy="36" rx="5" ry="6" fill="white"/>' +
            '<ellipse class="char-eye char-eye-right" cx="74" cy="36" rx="5" ry="6" fill="white"/>' +
            '<circle class="char-pupil char-pupil-left" cx="55" cy="36" r="3.5" fill="#c62828"/>' +
            '<circle class="char-pupil char-pupil-right" cx="75" cy="36" r="3.5" fill="#c62828"/>' +
            '<circle cx="56" cy="34" r="1.5" fill="white"/>' +
            '<circle cx="76" cy="34" r="1.5" fill="white"/>' +
            '<path class="char-mouth" d="M59,46 Q64,50 69,46" stroke="#e57373" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
            '<ellipse class="char-blush char-blush-left" cx="46" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
            '<ellipse class="char-blush char-blush-right" cx="82" cy="42" rx="5" ry="3" fill="#ffcdd2" opacity="0.6"/>' +
          '</g>' +
          '<g class="char-accessory">' +
            '<path class="char-tail fox-tail" d="M88,100 Q112,85 115,65 Q116,55 110,48" stroke="#ef9a9a" stroke-width="8" fill="none" stroke-linecap="round"/>' +
            '<path d="M112,58 Q114,52 110,48" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '</g>' +
        '</svg>';
      }
    }
  };

  // ==================== Quotes ====================
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
      '夜深了！别太晚睡觉~',
      '晚上学习效率也很高呢！'
    ],
    night: [
      '夜深了，早点休息吧~',
      '熀夜对身体不好哦，早点睡',
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
      '代码写多了会变秃的... 等等',
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
    scrollToBottom: { triggered: false },
    darkModeSwitch: { triggered: false },
    searchPixel: { triggered: false }
  };

  // ==================== Helpers ====================
  function _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function _pick(arr) { return arr[_rand(0, arr.length - 1)]; }

  function _getChar() { return CHARACTERS[_currentChar] || CHARACTERS.panda; }

  function _getTimeQuotes() {
    var h = new Date().getHours();
    if (h >= 6 && h < 12) return QUOTES.morning;
    if (h >= 12 && h < 18) return QUOTES.afternoon;
    if (h >= 18 && h < 22) return QUOTES.evening;
    return QUOTES.night;
  }

  function _getHolidayQuotes() {
    var now = new Date();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    if (m === 1 && d === 1) return QUOTES.holiday.slice(0, 1);
    if (m === 1 || m === 2) return QUOTES.holiday.slice(1, 2);
    if (m === 10 && d <= 7) return QUOTES.holiday.slice(3, 4);
    if ((m === 9 || m === 10) && d >= 10 && d <= 20) return QUOTES.holiday.slice(2, 3);
    if (m === 11 && d === 11) return QUOTES.holiday.slice(4);
    return null;
  }

  function _getRandomQuote() {
    var ch = _getChar();
    var holiday = _getHolidayQuotes();
    if (holiday) return _pick(holiday);
    var all = QUOTES.study.concat(_getTimeQuotes(), QUOTES.knowledge, QUOTES.humor);
    if (ch.quotes && ch.quotes.special) all = all.concat(ch.quotes.special);
    return _pick(all);
  }

  // ==================== Build HTML ====================
  function _buildHTML() {
    return '<div id="pixel-char-container">' +
      '<div id="pixel-char-speech" class="pixel-char-speech"></div>' +
      '<div id="pixel-char-body" class="pixel-char-body">' +
        '<div class="char-svg-wrapper" id="char-svg-wrapper"></div>' +
        '<div class="char-longpress-indicator" id="char-longpress-indicator">' +
          '<svg viewBox="0 0 36 36">' +
            '<circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>' +
            '<circle class="lp-progress" cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-dasharray="100.5" stroke-dashoffset="100.5" stroke-linecap="round" transform="rotate(-90,18,18)"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div id="pixel-char-shadow" class="pixel-char-shadow"></div>' +
    '</div>';
  }

  function _buildSelectorHTML() {
    var keys = Object.keys(CHARACTERS);
    var thumbs = keys.map(function(id) {
      var ch = CHARACTERS[id];
      var active = id === _currentChar ? ' active' : '';
      return '<div class="char-selector-thumb' + active + '" data-char="' + id + '" title="' + ch.name + '">' +
        '<div class="char-selector-preview">' + ch.svg() + '</div>' +
        '<span class="char-selector-name">' + ch.name + '</span>' +
      '</div>';
    }).join('');
    return '<div class="char-selector-overlay" id="char-selector-overlay">' +
      '<div class="char-selector">' +
        '<div class="char-selector-title">选择角色</div>' +
        '<div class="char-selector-grid">' + thumbs + '</div>' +
        '<button class="char-selector-close" id="char-selector-close"><i class="fas fa-times"></i></button>' +
      '</div>' +
    '</div>';
  }

  // ==================== Character Rendering ====================
  function _renderCharacter() {
    var wrapper = document.getElementById('char-svg-wrapper');
    if (!wrapper) return;
    var ch = _getChar();
    wrapper.innerHTML = ch.svg();
    // Ensure SVG groups have proper transform-box for CSS animations
    var svg = wrapper.querySelector('.char-svg');
    if (svg) {
      var groups = svg.querySelectorAll('.char-arm, .char-leg, .char-ear, .char-tail, .char-head, .char-body-group');
      for (var i = 0; i < groups.length; i++) {
        groups[i].style.transformBox = 'fill-box';
      }
      // Set arm transform origins
      var arms = svg.querySelectorAll('.char-arm');
      for (var j = 0; j < arms.length; j++) {
        arms[j].style.transformOrigin = 'center top';
      }
      // Set leg transform origins
      var legs = svg.querySelectorAll('.char-leg');
      for (var k = 0; k < legs.length; k++) {
        legs[k].style.transformOrigin = 'center top';
      }
    }
  }

  // ==================== State Management ====================
  function _setState(state, duration) {
    if (!_container) return;
    var classes = _container.className.split(' ').filter(function(c) {
      return !c.startsWith('state-') && !c.startsWith('face-');
    });
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
      stars.textContent = '✨';
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

  // ==================== Speech ====================
  function _showSpeech(text) {
    var el = document.getElementById('pixel-char-speech');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(_speechTimer);
    _speechTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
  }

  // ==================== Blink ====================
  function _doBlink() {
    if (_state !== 'idle' || _paused) return;
    _setState('blink');
    setTimeout(function() { if (_state === 'blink') _setState('idle'); }, 200);
  }
  function _scheduleBlink() {
    clearTimeout(_blinkTimer);
    _blinkTimer = setTimeout(function() { _doBlink(); _scheduleBlink(); }, _rand(2000, 5000));
  }

  // ==================== Idle Yawn ====================
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

  // ==================== Eye Follow ====================
  function _eyeFollow(e) {
    if (!_container || _state === 'blink' || _state === 'sleep' || _paused) return;
    var svg = _container.querySelector('.char-svg');
    if (!svg) return;
    var pupils = svg.querySelectorAll('.char-pupil');
    for (var i = 0; i < pupils.length; i++) {
      var pupil = pupils[i];
      var rect = pupil.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var angle = Math.atan2(dy, dx);
      var dist = Math.min(2.5, Math.sqrt(dx * dx + dy * dy) / 60);
      pupil.setAttribute('transform', 'translate(' + (Math.cos(angle) * dist) + ',' + (Math.sin(angle) * dist) + ')');
    }
  }

  // ==================== Part Click Reactions ====================
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
        _showSpeech(_pick(['嘿呧！', '跳起来！', '弹跳！']));
        break;
      case 'body':
      case 'torso':
        _setState('happy', 1000);
        _showSpeech(_pick(['被你戳到了！', '哈哈好痒~', '不要戳我啦！']));
        break;
      default:
        _randomAction();
    }
  }

  // ==================== Random Action ====================
  function _randomAction() {
    var actions = ['wave', 'jump', 'happy', 'dance', 'spin', 'greet', 'proud'];
    var action = _pick(actions);
    _setState(action, action === 'spin' ? 800 : 1200);
    _showSpeech(_getRandomQuote());
    _resetIdle();
  }

  // ==================== Drag ====================
  function _startDrag(e) {
    if (_dragging || _selectorOpen) return;
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

  // ==================== Long Press ====================
  function _startLongPress(e) {
    if (_dragging || _selectorOpen) return;
    _longPressing = true;
    var indicator = document.getElementById('char-longpress-indicator');
    if (indicator) indicator.classList.add('active');
    var progress = indicator ? indicator.querySelector('.lp-progress') : null;
    if (progress) {
      progress.style.transition = 'stroke-dashoffset 1s linear';
      progress.style.strokeDashoffset = '0';
    }
    _longPressTimer = setTimeout(function() {
      if (_longPressing) _showSelector();
      _cancelLongPress();
    }, 1000);
  }
  function _cancelLongPress() {
    _longPressing = false;
    clearTimeout(_longPressTimer);
    var indicator = document.getElementById('char-longpress-indicator');
    if (indicator) indicator.classList.remove('active');
    var progress = indicator ? indicator.querySelector('.lp-progress') : null;
    if (progress) {
      progress.style.transition = 'none';
      progress.style.strokeDashoffset = '100.5';
    }
  }

  // ==================== Character Selector ====================
  function _showSelector() {
    if (_selectorOpen) return;
    _selectorOpen = true;
    // Build overlay if not exists
    _selectorOverlay = document.getElementById('char-selector-overlay');
    if (!_selectorOverlay) {
      document.body.insertAdjacentHTML('beforeend', _buildSelectorHTML());
      _selectorOverlay = document.getElementById('char-selector-overlay');
    }
    _selectorOverlay.classList.add('show');

    // Bind click events
    var thumbs = _selectorOverlay.querySelectorAll('.char-selector-thumb');
    for (var i = 0; i < thumbs.length; i++) {
      (function(thumb) {
        thumb.addEventListener('click', function() {
          var charId = this.getAttribute('data-char');
          if (charId && charId !== _currentChar) {
            _switchCharacter(charId);
          }
          _hideSelector();
        });
      })(thumbs[i]);
    }

    var closeBtn = document.getElementById('char-selector-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', _hideSelector);
    }
    _selectorOverlay.addEventListener('click', function(e) {
      if (e.target === _selectorOverlay) _hideSelector();
    });
  }

  function _hideSelector() {
    _selectorOpen = false;
    if (_selectorOverlay) _selectorOverlay.classList.remove('show');
  }

  function _switchCharacter(charId) {
    if (!CHARACTERS[charId]) return;
    _currentChar = charId;
    try { localStorage.setItem('tls_current_char', charId); } catch(e) {}
    // Fade transition
    if (_body) _body.style.opacity = '0';
    setTimeout(function() {
      _renderCharacter();
      // Update active thumb
      var thumbs = document.querySelectorAll('.char-selector-thumb');
      for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].classList.toggle('active', thumbs[i].getAttribute('data-char') === charId);
      }
      if (_body) {
        _body.style.opacity = '1';
        _body.style.transition = 'opacity 0.3s ease';
      }
      var ch = _getChar();
      _showSpeech(ch.name + '出场了！');
    }, 200);
  }

  // ==================== Body Click ====================
  function _onBodyClick(e) {
    if (_dragging || _selectorOpen) return;
    e.stopPropagation();

    // Detect SVG part click
    var target = e.target;
    var part = null;
    // Walk up SVG parents to find data-part or known classes
    var el = target;
    while (el && el !== _body) {
      var cls = el.getAttribute('class') || '';
      if (cls.indexOf('char-head') >= 0 || cls.indexOf('pixel-head') >= 0) { part = 'head'; break; }
      if (cls.indexOf('char-arm-left') >= 0 || cls.indexOf('pixel-arm-left') >= 0) { part = 'arm-left'; break; }
      if (cls.indexOf('char-arm-right') >= 0 || cls.indexOf('pixel-arm-right') >= 0) { part = 'arm-right'; break; }
      if (cls.indexOf('char-leg-left') >= 0 || cls.indexOf('pixel-leg-left') >= 0) { part = 'leg-left'; break; }
      if (cls.indexOf('char-leg-right') >= 0 || cls.indexOf('pixel-leg-right') >= 0) { part = 'leg-right'; break; }
      if (cls.indexOf('char-body') >= 0 || cls.indexOf('pixel-torso') >= 0) { part = 'body'; break; }
      el = el.parentElement;
    }

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

  // ==================== Double Click ====================
  function _onDblClick(e) {
    e.stopPropagation();
    _setState('spin', 1600);
    _showSpeech(_pick(['变身！✨', '闪亮登场！⭐', 'Surprise！🎉', '你触发了隐崟彩蛋！']));
  }

  // ==================== Mouse Speed ====================
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
          if (_container) {
            var charRect = _container.getBoundingClientRect();
            var charCx = charRect.left + charRect.width / 2;
            _container.style.transform = last.x > charCx ? 'scaleX(1)' : 'scaleX(-1)';
          }
        }
      }
    }
  }, 100);

  // ==================== Scroll Easter Egg ====================
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

  // ==================== Dark Mode Easter Egg ====================
  var _lastTheme = null;
  function _checkThemeChange() {
    var current = document.documentElement.getAttribute('data-theme');
    if (_lastTheme !== null && current !== _lastTheme && !_easterEggs.darkModeSwitch.triggered) {
      _easterEggs.darkModeSwitch.triggered = true;
      if (current === 'dark') {
        _setState('sleep', 2000);
        _showSpeech('天黑了... 我也要睡觉了...');
      } else {
        _setState('happy', 1500);
        _showSpeech('天亮了！又是新的一天！');
      }
      setTimeout(function() { _easterEggs.darkModeSwitch.triggered = false; }, 5000);
    }
    _lastTheme = current;
  }

  // ==================== Visibility Pause ====================
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

  // ==================== Passive Avoidance ====================
  function _avoidElements() {
    if (_dragging || _state !== 'idle' || !_container) return;
    var charRect = _container.getBoundingClientRect();
    var elements = document.querySelectorAll('.btn, .resource-card, .zj-card, .feature-card, .agent-panel-close');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var elRect = el.getBoundingClientRect();
      var dx = charRect.left - elRect.left;
      var dy = charRect.top - elRect.top;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80 && dist > 0) {
        var moveX = (dx / dist) * 5;
        var moveY = (dy / dist) * 5;
        var curLeft = parseInt(_container.style.left) || charRect.left;
        var curTop = parseInt(_container.style.top) || charRect.top;
        _container.style.left = Math.max(0, Math.min(window.innerWidth - 60, curLeft + moveX)) + 'px';
        _container.style.top = Math.max(0, Math.min(window.innerHeight - 80, curTop + moveY)) + 'px';
        _container.style.bottom = 'auto';
      }
    }
  }

  // ==================== Toggle ====================
  function _toggle() {
    _visible = !_visible;
    if (_container) _container.classList.toggle('hidden-char', !_visible);
  }

  // ==================== Init ====================
  function init() {
    // Load saved character
    try {
      var saved = localStorage.getItem('tls_current_char');
      if (saved && CHARACTERS[saved]) _currentChar = saved;
    } catch(e) {}

    document.body.insertAdjacentHTML('beforeend', _buildHTML());
    _container = document.getElementById('pixel-char-container');
    _body = document.getElementById('pixel-char-body');

    // Render current character SVG
    _renderCharacter();

    // Click (with part detection)
    _body.addEventListener('click', _onBodyClick);
    _body.addEventListener('dblclick', _onDblClick);

    // Drag
    _body.addEventListener('mousedown', function(e) { _startDrag(e); });
    _body.addEventListener('touchstart', function(e) { _startDrag(e); }, { passive: false });
    document.addEventListener('mousemove', function(e) { _onDrag(e); _trackMouseSpeed(e); });
    document.addEventListener('touchmove', function(e) { _onDrag(e); }, { passive: false });
    document.addEventListener('mouseup', function() { _endDrag(); _cancelLongPress(); });
    document.addEventListener('touchend', function() { _endDrag(); _cancelLongPress(); });

    // Long press for character selector
    _body.addEventListener('mousedown', function(e) { _startLongPress(e); });
    _body.addEventListener('touchstart', function(e) { _startLongPress(e); }, { passive: true });

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

  // ==================== Public API ====================
  function show() { _visible = true; if (_container) _container.classList.remove('hidden-char'); }
  function hide() { _visible = false; if (_container) _container.classList.add('hidden-char'); }
  function isVisible() { return _visible; }
  function say(text) { _showSpeech(text); }
  function doAction(action) { _setState(action, 1200); }
  function switchTo(charId) { _switchCharacter(charId); }
  function getCharacters() {
    var result = {};
    var keys = Object.keys(CHARACTERS);
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = CHARACTERS[keys[i]].name;
    }
    return result;
  }
  function getCurrentChar() { return _currentChar; }

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
    say: say,
    doAction: doAction,
    switchTo: switchTo,
    getCharacters: getCharacters,
    getCurrentChar: getCurrentChar
  };
})();
