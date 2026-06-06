/**
 * ✨ Interactions - 酷炫交互效果库
 * 灵感来源: Material Design、Ant Motion
 * 功能: 涟漪效果、磁性按钮、滚动动画、数字动画
 */

(function() {
  'use strict';

  // ========== 涟漪效果 ==========
  class RippleEffect {
    constructor(element) {
      this.element = element;
      this.element.style.position = 'relative';
      this.element.style.overflow = 'hidden';
      this.bindEvents();
    }

    bindEvents() {
      this.element.addEventListener('click', (e) => this.createRipple(e));
    }

    createRipple(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out forwards;
        pointer-events: none;
        width: ${size}px;
        height: ${size}px;
        left: ${x - size/2}px;
        top: ${y - size/2}px;
      `;

      this.element.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }

  // 添加涟漪动画样式
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple-animation {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(rippleStyle);

  // ========== 磁性按钮效果 ==========
  class MagneticButton {
    constructor(element, options = {}) {
      this.element = element;
      this.strength = options.strength || 25;
      this.speed = options.speed || 0.3;
      this.bindEvents();
    }

    bindEvents() {
      this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.element.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
    }

    onMouseMove(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = (x / rect.width) * this.strength;
      const moveY = (y / rect.height) * this.strength;

      this.element.style.transition = `transform ${this.speed}s ease`;
      this.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    onMouseLeave(e) {
      this.element.style.transition = `transform 0.5s ease`;
      this.element.style.transform = 'translate(0, 0)';
    }
  }

  // ========== 滚动入场动画 ==========
  class ScrollReveal {
    constructor(options = {}) {
      this.threshold = options.threshold || 0.15;
      this.rootMargin = options.rootMargin || '0px 0px -50px 0px';
      this.init();
    }

    init() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: this.threshold,
        rootMargin: this.rootMargin
      });

      // 观察所有需要动画的元素
      document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-rotate').forEach(el => {
        observer.observe(el);
      });
    }

    reveal(element) {
      const delay = element.dataset.delay || 0;
      setTimeout(() => {
        element.classList.add('revealed');
      }, delay);
    }
  }

  // 添加滚动动画样式
  const scrollStyle = document.createElement('style');
  scrollStyle.textContent = `
    /* 基础隐藏状态 */
    .reveal-up,
    .reveal-left,
    .reveal-right,
    .reveal-scale,
    .reveal-rotate {
      opacity: 0;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .reveal-up { transform: translateY(40px); }
    .reveal-left { transform: translateX(-40px); }
    .reveal-right { transform: translateX(40px); }
    .reveal-scale { transform: scale(0.9); }
    .reveal-rotate { transform: rotate(-10deg) scale(0.9); }

    /* 显示状态 */
    .reveal-up.revealed,
    .reveal-left.revealed,
    .reveal-right.revealed,
    .reveal-scale.revealed,
    .reveal-rotate.revealed {
      opacity: 1;
      transform: translateY(0) translateX(0) scale(1) rotate(0);
    }
  `;
  document.head.appendChild(scrollStyle);

  // ========== 数字滚动动画 ==========
  class CountUp {
    constructor(element, options = {}) {
      this.element = element;
      this.target = parseInt(element.dataset.count || element.textContent);
      this.duration = options.duration || 2000;
      this.start = 0;
      this.startTime = null;
    }

    animate(currentTime) {
      if (!this.startTime) this.startTime = currentTime;
      const progress = Math.min((currentTime - this.startTime) / this.duration, 1);

      // 缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * this.target);

      this.element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame((time) => this.animate(time));
      } else {
        this.element.textContent = this.target;
      }
    }

    start() {
      requestAnimationFrame((time) => this.animate(time));
    }
  }

  // ========== 打字机效果 ==========
  class Typewriter {
    constructor(element, options = {}) {
      this.element = element;
      this.text = element.dataset.text || element.textContent;
      this.speed = options.speed || 50;
      this.delay = options.delay || 0;
      this.element.textContent = '';
      this.index = 0;
    }

    start() {
      setTimeout(() => {
        this.type();
      }, this.delay);
    }

    type() {
      if (this.index < this.text.length) {
        this.element.textContent += this.text.charAt(this.index);
        this.index++;
        setTimeout(() => this.type(), this.speed);
      }
    }
  }

  // ========== 粒子爆炸效果 ==========
  class ParticleExplosion {
    constructor(x, y, options = {}) {
      this.x = x;
      this.y = y;
      this.particles = [];
      this.count = options.count || 20;
      this.colors = options.colors || ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
      this.create();
    }

    create() {
      for (let i = 0; i < this.count; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const angle = (Math.PI * 2 / this.count) * i;
        const velocity = Math.random() * 100 + 50;
        const moveX = Math.cos(angle) * velocity;
        const moveY = Math.sin(angle) * velocity;

        particle.style.cssText = `
          position: fixed;
          left: ${this.x}px;
          top: ${this.y}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          animation: particle-explosion-${i} 0.6s ease-out forwards;
        `;

        // 创建动画
        const style = document.createElement('style');
        style.textContent = `
          @keyframes particle-explosion-${i} {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(${moveX}px, ${moveY}px) scale(0); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(particle);

        setTimeout(() => {
          particle.remove();
          style.remove();
        }, 600);
      }
    }
  }

  // ========== 自动初始化 ==========
  document.addEventListener('DOMContentLoaded', function() {
    // 1. 涟漪效果
    document.querySelectorAll('.btn, .download-btn, .zj-like-btn, .favorite-btn').forEach(el => {
      new RippleEffect(el);
    });

    // 2. 磁性按钮
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(el => {
      new MagneticButton(el, { strength: 15 });
    });

    // 3. 滚动动画
    new ScrollReveal();

    // 4. 数字动画
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = new CountUp(entry.target);
          counter.start();
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => {
      countObserver.observe(el);
    });

    // 5. 标题打字机效果
    document.querySelectorAll('[data-typewriter]').forEach(el => {
      const typewriter = new Typewriter(el);
      typewriter.start();
    });
  });

  // ========== 导出 ==========
  window.RippleEffect = RippleEffect;
  window.MagneticButton = MagneticButton;
  window.ScrollReveal = ScrollReveal;
  window.CountUp = CountUp;
  window.Typewriter = Typewriter;
  window.ParticleExplosion = ParticleExplosion;
})();
