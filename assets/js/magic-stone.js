/**
 * 🪨 Magic Stone — 魔法石板
 * 真正的3D交互：鼠标追踪、浮空、粒子、鎏金文字
 */
(function() {
  'use strict';

  var stone = null;
  var canvas = null;
  var ctx = null;
  var particles = [];
  var mouseX = 0.5, mouseY = 0.5;
  var targetRX = 0, targetRY = 0;
  var currentRX = 0, currentRY = 0;
  var floatPhase = 0;
  var running = false;

  function init() {
    var container = document.querySelector('.magic-stone-container');
    if (!container) return;

    // 创建石板HTML
    stone = document.createElement('div');
    stone.className = 'magic-stone';
    stone.innerHTML =
      '<div class="ms-glow"></div>' +
      '<canvas class="ms-canvas"></canvas>' +
      '<div class="ms-surface">' +
        '<div class="ms-rune ms-rune-tl"></div>' +
        '<div class="ms-rune ms-rune-tr"></div>' +
        '<div class="ms-rune ms-rune-bl"></div>' +
        '<div class="ms-rune ms-rune-br"></div>' +
        '<div class="ms-title">最后的晚餐</div>' +
        '<div class="ms-subtitle">The Last Supper</div>' +
      '</div>' +
      '<div class="ms-shadow"></div>' +
      '<style>' +
        '.ms-title, .ms-subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important; }' +
      '</style>';

    container.appendChild(stone);

    canvas = stone.querySelector('.ms-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    createParticles(60);
    bindEvents();
    running = true;
    animate();
  }

  function resizeCanvas() {
    if (!canvas || !stone) return;
    var rect = stone.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  function createParticles(count) {
    particles = [];
    var w = canvas.width / (window.devicePixelRatio || 1);
    var h = canvas.height / (window.devicePixelRatio || 1);
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        hue: 220 + Math.random() * 60,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function bindEvents() {
    var parent = stone.parentElement;
    parent.addEventListener('mousemove', function(e) {
      var rect = parent.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
      targetRX = (mouseY - 0.5) * 25;
      targetRY = (mouseX - 0.5) * -25;
    });

    parent.addEventListener('mouseleave', function() {
      targetRX = 0;
      targetRY = 0;
      mouseX = 0.5;
      mouseY = 0.5;
    });

    window.addEventListener('resize', function() {
      resizeCanvas();
      createParticles(60);
    });
  }

  function updateParticles() {
    var w = canvas.width / (window.devicePixelRatio || 1);
    var h = canvas.height / (window.devicePixelRatio || 1);
    var cx = mouseX * w;
    var cy = mouseY * h;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.pulse += 0.02;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      var dx = cx - p.x;
      var dy = cy - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        var force = (120 - dist) / 120 * 0.02;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1.5) {
        p.vx = (p.vx / speed) * 1.5;
        p.vy = (p.vy / speed) * 1.5;
      }
    }
  }

  function drawParticles() {
    var w = canvas.width / (window.devicePixelRatio || 1);
    var h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var glow = 0.5 + 0.5 * Math.sin(p.pulse);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.8 + glow * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 70%, ' + (p.opacity * glow) + ')';
      ctx.fill();

      if (p.size > 1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 70%, ' + (p.opacity * 0.15) + ')';
        ctx.fill();
      }
    }

    // 连线
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(139, 120, 255, ' + ((1 - dist / 80) * 0.15) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // 鼠标光晕
    var mx = mouseX * w;
    var my = mouseY * h;
    var gradient = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    gradient.addColorStop(0, 'rgba(139, 120, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(139, 120, 255, 0)');
    ctx.beginPath();
    ctx.arc(mx, my, 80, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function animate() {
    if (!running) return;

    currentRX += (targetRX - currentRX) * 0.08;
    currentRY += (targetRY - currentRY) * 0.08;

    floatPhase += 0.015;
    var floatY = Math.sin(floatPhase) * 8;
    var floatRX = Math.sin(floatPhase * 0.7) * 1.5;
    var floatRY = Math.cos(floatPhase * 0.5) * 1.5;

    var finalRX = currentRX + floatRX;
    var finalRY = currentRY + floatRY;
    var hoverZ = (targetRX !== 0 || targetRY !== 0) ? 30 : 0;

    stone.style.transform =
      'translateY(' + floatY + 'px) ' +
      'perspective(1000px) ' +
      'rotateX(' + finalRX + 'deg) ' +
      'rotateY(' + finalRY + 'deg) ' +
      'translateZ(' + hoverZ + 'px)';

    // 阴影跟随
    var shadow = stone.querySelector('.ms-shadow');
    if (shadow) {
      var shadowScale = 1 - Math.abs(floatY) / 20;
      var shadowOpacity = 0.3 * shadowScale;
      shadow.style.transform = 'scaleX(' + shadowScale + ')';
      shadow.style.opacity = shadowOpacity;
    }

    // 发光跟随鼠标
    var glow = stone.querySelector('.ms-glow');
    if (glow) {
      glow.style.background =
        'radial-gradient(ellipse at ' + (mouseX * 100) + '% ' + (mouseY * 100) + '%, ' +
        'rgba(139, 120, 255, 0.4) 0%, rgba(99, 102, 241, 0.15) 40%, transparent 70%)';
    }

    updateParticles();
    drawParticles();

    requestAnimationFrame(animate);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
