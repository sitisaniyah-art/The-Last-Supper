/**
 * image-upload.js — 图片压缩、WebP转换、Imgbb上传
 * 依赖: 无（纯浏览器 API）
 *
 * Imgbb API v1: https://api.imgbb.com/1/upload
 * 参数: key (必填), image (必填: base64/blob/url), name (可选), expiration (可选: 60-15552000秒)
 * 响应: { data: { url, display_url, thumb.url, medium.url, delete_url }, success, status }
 */
var ImageUpload = (function() {
  var IMGBB_KEY = 'tls_imgbb_key';
  var DEFAULT_API_KEY = '53df6222d9e88f389cb9b5a637653ec0';
  var IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';
  var MAX_WIDTH = 1200;
  var QUALITY = 0.8;
  var MAX_SIZE = 5 * 1024 * 1024; // 5MB

  function getApiKey() {
    return localStorage.getItem(IMGBB_KEY) || DEFAULT_API_KEY;
  }

  function setApiKey(key) {
    localStorage.setItem(IMGBB_KEY, key);
  }

  /**
   * 压缩图片为 WebP/JPEG
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
   * 将 Blob 转为 Base64 字符串（去掉 data: 前缀）
   * @param {Blob} blob
   * @param {Function} callback - function(base64String)
   */
  function blobToBase64(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var result = reader.result;
      // 去掉 "data:image/xxx;base64," 前缀
      var base64 = result.split(',')[1] || result;
      callback(base64);
    };
    reader.readAsDataURL(blob);
  }

  /**
   * 上传到 Imgbb API v1
   *
   * 请求: POST https://api.imgbb.com/1/upload
   * 参数: key, image (base64), name (可选), expiration (可选, 秒)
   * 成功响应: { success: true, status: 200, data: { url, display_url, thumb, medium, delete_url } }
   * 失败响应: { success: false, status: xxx, error: { message, code } }
   *
   * @param {Blob|string} source - 图片 Blob 或 Base64 字符串或 URL
   * @param {Function} callback - function(result) 或 function(null, error)
   *   result = { url, display_url, thumb_url, medium_url, delete_url, id }
   * @param {Object} [options] - 可选参数
   * @param {string} [options.name] - 自定义文件名
   * @param {number} [options.expiration] - 过期秒数 (60-15552000)，0=永不过期
   */
  function uploadToImgbb(source, callback, options) {
    var apiKey = getApiKey();
    if (!apiKey) {
      alert('请先在管理员后台配置 Imgbb API Key');
      callback(null, 'no_api_key');
      return;
    }

    options = options || {};

    function doUpload(base64Data) {
      var params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('image', base64Data);
      if (options.name) params.append('name', options.name);
      if (options.expiration && options.expiration >= 60 && options.expiration <= 15552000) {
        params.append('expiration', options.expiration);
      }

      fetch(IMGBB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.data) {
          callback({
            url: data.data.url,
            display_url: data.data.display_url,
            thumb_url: data.data.thumb ? data.data.thumb.url : null,
            medium_url: data.data.medium ? data.data.medium.url : null,
            delete_url: data.data.delete_url || null,
            id: data.data.id
          });
        } else {
          var errMsg = (data.error && data.error.message) ? data.error.message : '上传失败';
          console.error('Imgbb upload failed:', data);
          alert('Imgbb 上传失败: ' + errMsg);
          callback(null, errMsg);
        }
      })
      .catch(function(err) {
        console.error('Imgbb upload error:', err);
        alert('网络错误，请检查网络连接后重试');
        callback(null, 'network_error');
      });
    }

    // source 可以是 Blob、File、base64 字符串或 URL
    if (source instanceof Blob) {
      blobToBase64(source, doUpload);
    } else if (typeof source === 'string') {
      // 直接传入 base64 或 URL
      if (source.startsWith('data:')) {
        doUpload(source.split(',')[1] || source);
      } else {
        doUpload(source);
      }
    } else {
      callback(null, 'invalid_source');
    }
  }

  /**
   * 处理文件选择（支持多文件）
   * @param {FileList} files
   * @param {Function} onProgress - function(current, total)
   * @param {Function} onComplete - function(results[]) — 每项为 uploadToImgbb 的 result 对象
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

    var results = [];
    var processed = 0;

    validFiles.forEach(function(file) {
      compressImage(file, function(blob) {
        if (!blob) {
          processed++;
          onProgress(processed, validFiles.length);
          if (processed === validFiles.length) onComplete(results);
          return;
        }
        uploadToImgbb(blob, function(result) {
          if (result) results.push(result);
          processed++;
          onProgress(processed, validFiles.length);
          if (processed === validFiles.length) onComplete(results);
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
      }, function(results) {
        var urls = results.map(function(r) { return r.url; });
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
    blobToBase64: blobToBase64,
    uploadToImgbb: uploadToImgbb,
    handleFileSelect: handleFileSelect,
    createDropZone: createDropZone
  };
})();
