/**
 * live2d-init.js — Live2D 看板娘初始化脚本
 * 替代原 pixel-character.js，使用 live2d-widget 实现更精美的 Live2D 角色
 * 模型通过 CDN 加载，核心库从本地 assets/live2d/ 加载
 * 配置项: 拖拽、工具栏（一言/切换模型/换装/拍照/关闭）、自动隐藏
 */
(function() {
  /* 移动端不加载（屏幕太小体验差） */
  if (screen.width < 768) return;

  /* 资源路径 — 指向本地 assets/live2d/ */
  var live2d_path = '/The-Last-Supper/assets/live2d/';

  /* 封装异步资源加载 */
  function loadResource(url, type) {
    return new Promise(function(resolve, reject) {
      var tag;
      if (type === 'css') {
        tag = document.createElement('link');
        tag.rel = 'stylesheet';
        tag.href = url;
      } else if (type === 'js') {
        tag = document.createElement('script');
        tag.type = 'module';
        tag.src = url;
      }
      if (tag) {
        tag.onload = function() { resolve(url); };
        tag.onerror = function() { reject(url); };
        document.head.appendChild(tag);
      }
    });
  }

  /* 避免图片资源跨域问题 */
  var OrigImage = window.Image;
  window.Image = function() {
    var img = new (Function.prototype.bind.apply(OrigImage, [null].concat(Array.prototype.slice.call(arguments))))();
    img.crossOrigin = 'anonymous';
    return img;
  };
  window.Image.prototype = OrigImage.prototype;

  /* 加载并初始化 */
  Promise.all([
    loadResource(live2d_path + 'waifu.css', 'css'),
    loadResource(live2d_path + 'waifu-tips.js', 'js')
  ]).then(function() {
    initWidget({
      waifuPath: live2d_path + 'waifu-tips.json',
      cubism2Path: live2d_path + 'live2d.min.js',
      cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
      tools: ['hitokoto', 'switch-model', 'switch-texture', 'photo', 'quit'],
      logLevel: 'warn',
      drag: true
    });
  }).catch(function(err) {
    console.warn('[Live2D] 加载失败:', err);
  });
})();
