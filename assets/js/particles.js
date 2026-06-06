/**
 * 🌟 Particles.js - 星空粒子背景引擎
 * 灵感来源: Ant Motion、G3D
 * 功能: 流星、星星、连线粒子效果
 */

(function() {
  'use strict';

  // 配置
  const CONFIG = {
    particles: {
      count: 80,           // 粒子数量
      color: '99, 102, 241', // 主色调 (靛蓝)
      opacity: {
        min: 0.2,
        max: 0.8
      },
      size: {
        min: 1,
        max: 3
      },
      speed: {
        min: 0.2,
        max: 0.8
      }
    },
    shootingStars: {
      enabled: true,
      frequency: 0.002,    // 每帧出现概率
      speed: 8,
      length: 80,
      color: '#818cf8'
    },
    connections: {
      enabled: true,
      distance: 150,       // 连线最大距离
      opacity: 0.15,
      color: '99, 102, 241'
    },
    mouse: {
      enabled: true,
      radius: 200,         // 鼠标影响半径
      attraction: 0.03     // 吸引力强度
    }
  };

  // 粒子类
  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height;
      this.size = randomBetween(CONFIG.particles.size.min, CONFIG.particles.size.max);
      this.speedX = randomBetween(-CONFIG.particles.speed.max, CONFIG.particles.speed.max);
      this.speedY = randomBetween(-CONFIG.particles.speed.max, CONFIG.particles.speed.max);
      this.opacity = randomBetween(CONFIG.particles.opacity.min, CONFIG.particles.opacity.max);
      this.opacitySpeed = randomBetween(0.005, 0.02);
      this.opacityDirection = 1;
    }

    update(mouseX, mouseY) {
      // 移动
      this.x += this.speedX;
      this.y += this.speedY;

      // 边界检测
      if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;

      // 闪烁效果
      this.opacity += this.opacitySpeed * this.opacityDirection;
      if (this.opacity >= CONFIG.particles.opacity.max) this.opacityDirection = -1;
      if (this.opacity <= CONFIG.particles.opacity.min) this.opacityDirection = 1;

      // 鼠标交互
      if (CONFIG.mouse.enabled && mouseX !== null && mouseY !== null) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.mouse.radius) {
          const force = (CONFIG.mouse.radius - distance) / CONFIG.mouse.radius;
          this.speedX += dx * force * CONFIG.mouse.attraction;
          this.speedY += dy * force * CONFIG.mouse.attraction;
        }
      }

      // 速度限制
      const maxSpeed = CONFIG.particles.speed.max * 2;
      const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
      if (currentSpeed > maxSpeed) {
        this.speedX = (this.speedX / currentSpeed) * maxSpeed;
        this.speedY = (this.speedY / currentSpeed) * maxSpeed;
      }
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.particles.color}, ${this.opacity})`;
      ctx.fill();

      // 发光效果
      if (this.size > 1.5) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CONFIG.particles.color}, ${this.opacity * 0.3})`;
        ctx.fill();
      }
    }
  }

  // 流星类
  class ShootingStar {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = 0;
      this.length = CONFIG.shootingStars.length;
      this.speed = CONFIG.shootingStars.speed;
      this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      this.opacity = 1;
      this.active = false;
    }

    activate() {
      this.x = Math.random() * this.canvas.width * 1.5;
      this.y = -50;
      this.opacity = 1;
      this.active = true;
    }

    update() {
      if (!this.active) return;

      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.opacity -= 0.015;

      if (this.opacity <= 0 || this.y > this.canvas.height) {
        this.active = false;
      }
    }

    draw(ctx) {
      if (!this.active) return;

      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;

      const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 头部光点
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  // 主类
  class ParticlesEngine {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
      this.container.style.position = 'relative';
      this.container.insertBefore(this.canvas, this.container.firstChild);

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.shootingStars = [];
      this.mouseX = null;
      this.mouseY = null;
      this.animationId = null;

      this.init();
    }

    init() {
      this.resize();
      this.createParticles();
      this.createShootingStars();
      this.bindEvents();
      this.animate();
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < CONFIG.particles.count; i++) {
        this.particles.push(new Particle(this.canvas));
      }
    }

    createShootingStars() {
      if (!CONFIG.shootingStars.enabled) return;
      for (let i = 0; i < 3; i++) {
        this.shootingStars.push(new ShootingStar(this.canvas));
      }
    }

    bindEvents() {
      // 窗口大小改变
      window.addEventListener('resize', () => {
        this.resize();
        this.createParticles();
      });

      // 鼠标移动
      if (CONFIG.mouse.enabled) {
        this.container.addEventListener('mousemove', (e) => {
          const rect = this.container.getBoundingClientRect();
          this.mouseX = e.clientX - rect.left;
          this.mouseY = e.clientY - rect.top;
        });

        this.container.addEventListener('mouseleave', () => {
          this.mouseX = null;
          this.mouseY = null;
        });
      }
    }

    drawConnections() {
      if (!CONFIG.connections.enabled) return;

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.connections.distance) {
            const opacity = (1 - distance / CONFIG.connections.distance) * CONFIG.connections.opacity;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `rgba(${CONFIG.connections.color}, ${opacity})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 更新和绘制粒子
      this.particles.forEach(particle => {
        particle.update(this.mouseX, this.mouseY);
        particle.draw(this.ctx);
      });

      // 绘制连线
      this.drawConnections();

      // 流星效果
      if (CONFIG.shootingStars.enabled) {
        // 随机激活流星
        if (Math.random() < CONFIG.shootingStars.frequency) {
          const inactiveStar = this.shootingStars.find(s => !s.active);
          if (inactiveStar) inactiveStar.activate();
        }

        this.shootingStars.forEach(star => {
          star.update();
          star.draw(this.ctx);
        });
      }

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // 工具函数
  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 导出
  window.ParticlesEngine = ParticlesEngine;

  // 自动初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 首页英雄区
    const heroSection = document.querySelector('.page__content > div:first-child');
    if (heroSection) {
      heroSection.id = heroSection.id || 'particles-hero';
      new ParticlesEngine(heroSection.id);
    }
  });
})();
