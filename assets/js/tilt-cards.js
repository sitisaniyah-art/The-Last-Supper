/**
 * 🎴 Tilt Cards - 3D 卡片悬浮效果库
 * 灵感来源: G3D、Semi Design
 * 功能: 鼠标跟随 3D 倾斜、光晕效果
 */

(function() {
  'use strict';

  const CONFIG = {
    maxTilt: 15,           // 最大倾斜角度
    perspective: 1000,     // 透视距离
    scale: 1.05,           // 悬浮放大比例
    speed: 400,            // 过渡速度 (ms)
    glare: true,           // 光晕效果
    glareMaxOpacity: 0.3,  // 光晕最大透明度
    mouseEvent: 'mousemove'
  };

  class TiltCard {
    constructor(element, options = {}) {
      this.element = element;
      this.config = { ...CONFIG, ...options };
      this.glareElement = null;

      this.init();
    }

    init() {
      // 设置基础样式
      this.element.style.transformStyle = 'preserve-3d';
      this.element.style.transition = `transform ${this.config.speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;

      // 创建光晕元素
      if (this.config.glare) {
        this.createGlare();
      }

      this.bindEvents();
    }

    createGlare() {
      this.glareElement = document.createElement('div');
      this.glareElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.5) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        opacity: 0;
        transition: opacity ${this.config.speed}ms ease;
        pointer-events: none;
        border-radius: inherit;
        z-index: 10;
      `;
      this.element.style.position = 'relative';
      this.element.style.overflow = 'hidden';
      this.element.appendChild(this.glareElement);
    }

    bindEvents() {
      this.element.addEventListener('mouseenter', (e) => this.onMouseEnter(e));
      this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.element.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
    }

    onMouseEnter(e) {
      this.element.style.transition = 'none';
    }

    onMouseMove(e) {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 计算倾斜角度
      const rotateX = ((y - centerY) / centerY) * -this.config.maxTilt;
      const rotateY = ((x - centerX) / centerX) * this.config.maxTilt;

      // 应用变换
      this.element.style.transform = `
        perspective(${this.config.perspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(${this.config.scale}, ${this.config.scale}, ${this.config.scale})
      `;

      // 更新光晕
      if (this.config.glare && this.glareElement) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        this.glareElement.style.background = `
          radial-gradient(
            circle at ${glareX}% ${glareY}%,
            rgba(255, 255, 255, ${this.config.glareMaxOpacity}) 0%,
            rgba(255, 255, 255, 0) 60%
          )
        `;
        this.glareElement.style.opacity = '1';
      }
    }

    onMouseLeave(e) {
      this.element.style.transition = `transform ${this.config.speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
      this.element.style.transform = `
        perspective(${this.config.perspective}px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
      `;

      if (this.glareElement) {
        this.glareElement.style.opacity = '0';
      }
    }

    destroy() {
      this.element.style.transform = '';
      this.element.style.transformStyle = '';
      this.element.style.transition = '';
      if (this.glareElement) {
        this.glareElement.remove();
      }
    }
  }

  // 自动初始化
  function initTiltCards(selector = '.tilt-card', options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];

    elements.forEach(el => {
      instances.push(new TiltCard(el, options));
    });

    return instances;
  }

  // 导出
  window.TiltCard = TiltCard;
  window.initTiltCards = initTiltCards;

  // DOMContentLoaded 自动初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 为资源卡片添加 3D 效果
    initTiltCards('.resource-card', { maxTilt: 10, scale: 1.02 });

    // 为功能卡片添加 3D 效果
    initTiltCards('.feature-card', { maxTilt: 12, scale: 1.05 });

    // 为嗨玩榜卡片添加 3D 效果
    initTiltCards('.zj-card', { maxTilt: 10, scale: 1.02 });
  });
})();
