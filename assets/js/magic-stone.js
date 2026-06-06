/**
 * 🪨 Magic Stone - 魔法石板效果
 * 浮空、3D 鼠标交互、星空鎏金文字
 */

(function() {
  'use strict';

  class MagicStone {
    constructor(container) {
      this.container = container;
      this.mouseX = 0;
      this.mouseY = 0;
      this.targetRotateX = 0;
      this.targetRotateY = 0;
      this.currentRotateX = 0;
      this.currentRotateY = 0;
      this.isHovering = false;
      this.particles = [];
      this.animationId = null;

      this.init();
    }

    init() {
      this.createStone();
      this.createParticles();
      this.bindEvents();
      this.animate();
    }

    createStone() {
      // 创建石板容器
      this.stone = document.createElement('div');
      this.stone.className = 'magic-stone';
      this.stone.innerHTML = `
        <div class="magic-stone-glow"></div>
        <div class="magic-stone-surface">
          <div class="magic-stone-text">最后的晚餐</div>
          <div class="magic-stone-subtitle">The Last Supper</div>
        </div>
        <div class="magic-stone-shadow"></div>
        <canvas class="magic-stone-particles"></canvas>
      `;

      this.container.appendChild(this.stone);

      // 获取 canvas
      this.canvas = this.stone.querySelector('.magic-stone-particles');
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    resizeCanvas() {
      const rect = this.stone.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          hue: Math.random() * 60 + 200 // 蓝紫色调
        });
      }
    }

    bindEvents() {
      // 鼠标移动
      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / rect.width;
        this.mouseY = (e.clientY - rect.top) / rect.height;

        // 计算目标旋转角度
        this.targetRotateX = (this.mouseY - 0.5) * 30;
        this.targetRotateY = (this.mouseX - 0.5) * -30;
      });

      // 鼠标进入
      this.container.addEventListener('mouseenter', () => {
        this.isHovering = true;
        this.stone.classList.add('hovering');
      });

      // 鼠标离开
      this.container.addEventListener('mouseleave', () => {
        this.isHovering = false;
        this.targetRotateX = 0;
        this.targetRotateY = 0;
        this.stone.classList.remove('hovering');
      });

      // 窗口大小改变
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      });
    }

    updateParticles() {
      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        // 边界检测
        if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;

        // 鼠标交互
        if (this.isHovering) {
          const dx = this.mouseX * this.canvas.width - p.x;
          const dy = this.mouseY * this.canvas.height - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            p.speedX += dx * 0.001;
            p.speedY += dy * 0.001;
          }
        }

        // 速度限制
        const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
        if (speed > 1) {
          p.speedX = (p.speedX / speed) * 1;
          p.speedY = (p.speedY / speed) * 1;
        }
      });
    }

    drawParticles() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
        this.ctx.fill();

        // 发光效果
        if (p.size > 1) {
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          this.ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity * 0.3})`;
          this.ctx.fill();
        }
      });

      // 绘制连线
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            const opacity = (1 - distance / 80) * 0.2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `rgba(147, 130, 255, ${opacity})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }
    }

    animate() {
      // 平滑插值
      this.currentRotateX += (this.targetRotateX - this.currentRotateX) * 0.1;
      this.currentRotateY += (this.targetRotateY - this.currentRotateY) * 0.1;

      // 应用变换
      this.stone.style.transform = `
        perspective(1000px)
        rotateX(${this.currentRotateX}deg)
        rotateY(${this.currentRotateY}deg)
        translateZ(${this.isHovering ? 20 : 0}px)
      `;

      // 更新粒子
      this.updateParticles();
      this.drawParticles();

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // 导出
  window.MagicStone = MagicStone;

  // 自动初始化
  document.addEventListener('DOMContentLoaded', function() {
    const containers = document.querySelectorAll('.magic-stone-container');
    containers.forEach(container => {
      new MagicStone(container);
    });
  });
})();
