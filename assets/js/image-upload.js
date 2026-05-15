/**
 * image-upload.js — 图片压缩、WebP转换、Imgbb上传
 * 依赖: 无（纯浏览器 API）
 */
var ImageUpload = (function() {
  var IMGBB_KEY = 'tls_imgbb_key';
  var MAX_WIDTH = 1200;
  var QUALITY = 0.8;
  var MAX_SIZE = 5 * 1024 * 1024; // 5MB

  function getApiKey() {
    return localStorage.getItem(IMGBB_KEY) || '';
  }

  function setApiKey(key) {
    localStorage.setItem(IMGBB_KEY, key);
  }

  /**
   * 压缩图片为 WebP
   * @param {File} file - 图片文件
   * @param {Function} callback - function(blob) 或 function(null) on error
   */
  function compressImage(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
      callback(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('图片大小不能超过 5MB');
      callback(null);
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width;
        var h = img.height;
        if (w > MAX_WIDTH) {
          h = Math.round(h * (MAX_WIDTH / w));
          w = MAX_WIDTH;
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // 尝试 WebP，不支持则 fallback JPEG
        var mimeType = 'image/webp';
        canvas.toBlob(function(blob) {
          if (!blob) {
            mimeType = 'image/jpeg';
            canvas.toBlob(function(b) { callback(b); }, mimeType, QUALITY);
          } else {
            callback(blob);
          }
        }, mimeType, QUALITY);
      };
      img.onerror = function() { callback(null); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * 上传到 Imgbb
   * @param {Blob} blob - 图片 blob
   * @param {Function} callback - function(url) 或 function(null, error)
   */
  function uploadToImgbb(blob, callback) {
    var apiKey = getApiKey();
    if (!apiKey) {
      alert('请先在管理员后台配置 Imgbb API Key');
      callback(null, 'no_api_key');
      return;
    }

    var formData = new FormData();
    formData.append('image', blob);

    fetch('https://api.imgbb.com/1/upload?key=' + apiKey, {
      method: 'POST',
      body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success && data.data && data.data.url) {
        callback(data.data.url);
      } else {
        console.error('Imgbb upload failed:', data);
        callback(null, 'upload_failed');
      }
    })
    .catch(function(err) {
      console.error('Imgbb upload error:', err);
      callback(null, 'network_error');
    });
  }

  /**
   * 处理文件选择（支持多文件）
   * @param {FileList} files
   * @param {Function} onProgress - function(current, total)
   * @param {Function} onComplete - function(urls[])
   */
  function handleFileSelect(files, onProgress, onComplete) {
    var validFiles = [];
    for (var i = 0; i < files.length && i < 5; i++) {
      if (files[i].type.startsWith('image/')) {
        validFiles.push(files[i]);
      }
    }
    if (validFiles.length === 0) {
      onComplete([]);
      return;
    }

    var urls = [];
    var processed = 0;

    validFiles.forEach(function(file, idx) {
      compressImage(file, function(blob) {
        if (!blob) {
          processed++;
          onProgress(processed, validFiles.length);
          if (processed === validFiles.length) onComplete(urls);
          return;
        }
        uploadToImgbb(blob, function(url) {
          if (url) urls.push(url);
          processed++;
          onProgress(processed, validFiles.length);
          if (processed === validFiles.length) onComplete(urls);
        });
      });
    });
  }

  /**
   * 创建拖拽上传区域
   * @param {HTMLElement} container - 容器元素
   * @param {Function} onComplete - function(urls[])
   * @param {number} maxFiles - 最大文件数
   */
  function createDropZone(container, onComplete, maxFiles) {
    maxFiles = maxFiles || 3;

    container.innerHTML =
      '<div class="img-drop-zone">' +
        '<i class="fas fa-cloud-upload-alt"></i>' +
        '<p>拖拽图片到此处，或 <span class="img-drop-browse">点击选择</span></p>' +
        '<p class="img-drop-hint">支持 JPG/PNG/WebP，最大 5MB，最多 ' + maxFiles + ' 张</p>' +
        '<input type="file" accept="image/*" multiple style="display:none" class="img-file-input">' +
      '</div>' +
      '<div class="img-preview-grid"></div>' +
      '<div class="img-upload-progress" style="display:none;">' +
        '<div class="img-upload-progress-bar"></div>' +
        '<span class="img-upload-progress-text">上传中...</span>' +
      '</div>';

    var dropZone = container.querySelector('.img-drop-zone');
    var fileInput = container.querySelector('.img-file-input');
    var previewGrid = container.querySelector('.img-preview-grid');
    var progressWrap = container.querySelector('.img-upload-progress');
    var progressBar = container.querySelector('.img-upload-progress-bar');
    var progressText = container.querySelector('.img-upload-progress-text');

    // 点击选择
    dropZone.querySelector('.img-drop-browse').addEventListener('click', function(e) {
      e.stopPropagation();
      fileInput.click();
    });
    dropZone.addEventListener('click', function() { fileInput.click(); });

    fileInput.addEventListener('change', function() {
      if (this.files.length) processFiles(this.files);
    });

    // 拖拽
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    });

    function processFiles(files) {
      var limited = [];
      for (var i = 0; i < files.length && limited.length < maxFiles; i++) {
        if (files[i].type.startsWith('image/')) limited.push(files[i]);
      }
      if (limited.length === 0) return;

      // 预览
      previewGrid.innerHTML = '';
      limited.forEach(function(f) {
        var r = new FileReader();
        r.onload = function(e) {
          var div = document.createElement('div');
          div.className = 'img-preview-item';
          div.innerHTML = '<img src="' + e.target.result + '" alt="preview">' +
            '<div class="img-preview-overlay"><i class="fas fa-spinner fa-spin"></i></div>';
          previewGrid.appendChild(div);
        };
        r.readAsDataURL(f);
      });

      // 上传
      progressWrap.style.display = 'flex';
      progressBar.style.width = '0%';
      progressText.textContent = '上传中...';

      handleFileSelect(limited, function(current, total) {
        var pct = Math.round((current / total) * 100);
        progressBar.style.width = pct + '%';
        progressText.textContent = '上传中 ' + current + '/' + total;
      }, function(urls) {
        progressText.textContent = urls.length > 0 ? '上传完成！' : '上传失败';
        setTimeout(function() { progressWrap.style.display = 'none'; }, 1500);
        onComplete(urls);
      });
    }
  }

  return {
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    compressImage: compressImage,
    uploadToImgbb: uploadToImgbb,
    handleFileSelect: handleFileSelect,
    createDropZone: createDropZone
  };
})();
