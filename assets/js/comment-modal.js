/**
 * comment-modal.js — 评论弹窗 UI
 * 依赖: comments.js (Comments 模块)
 */
var CommentModal = (function() {
  var _currentPlaceId = null;
  var _currentPage = 1;
  var _isLoading = false;

  function open(placeId, placeName) {
    _currentPlaceId = placeId;
    _currentPage = 1;
    _renderModal(placeId, placeName);
  }

  function close() {
    var overlay = document.getElementById('comment-modal-overlay');
    if (overlay) overlay.remove();
    _currentPlaceId = null;
  }

  function _renderModal(placeId, placeName) {
    // 先移除已有弹窗
    close();

    var count = Comments.getCommentCount(placeId);
    var html =
      '<div id="comment-modal-overlay" class="comment-modal-overlay">' +
        '<div class="comment-modal-card">' +
          '<button class="comment-modal-close"><i class="fas fa-times"></i></button>' +
          '<div class="comment-modal-header">' +
            '<h3><i class="fas fa-comments"></i> ' + placeName + '</h3>' +
            '<span class="comment-count-badge" id="comment-count-badge">' + count + ' 条评论</span>' +
          '</div>' +
          '<div class="comment-modal-body">' +
            '<div class="comment-form">' +
              '<div class="comment-form-row">' +
                '<input class="comment-nickname" placeholder="昵称 (2-15字符)" maxlength="15">' +
              '</div>' +
              '<textarea class="comment-content" placeholder="写下你的评论... (5-500字符)" maxlength="500"></textarea>' +
              '<div class="comment-form-footer">' +
                '<span class="comment-char-count">0/500</span>' +
                '<button class="btn btn-primary comment-submit-btn">发表评论</button>' +
              '</div>' +
            '</div>' +
            '<div class="comment-list" id="comment-list"></div>' +
            '<div class="comment-loading" id="comment-loading" style="display:none;"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>' +
            '<div class="comment-empty" id="comment-empty" style="display:none;">' +
              '<i class="far fa-comment-dots"></i>' +
              '<p>还没有评论，来抢沙发吧！</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    _bindModalEvents();
    _loadComments();
  }

  function _bindModalEvents() {
    var overlay = document.getElementById('comment-modal-overlay');
    if (!overlay) return;

    // 关闭
    overlay.querySelector('.comment-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    // 字数统计
    var textarea = overlay.querySelector('.comment-content');
    var charCount = overlay.querySelector('.comment-char-count');
    textarea.addEventListener('input', function() {
      charCount.textContent = this.value.length + '/500';
    });

    // 发表评论
    overlay.querySelector('.comment-submit-btn').addEventListener('click', function() {
      var nickname = overlay.querySelector('.comment-nickname').value;
      var content = textarea.value;
      var result = Comments.addComment(_currentPlaceId, nickname, content);
      if (result.ok) {
        textarea.value = '';
        charCount.textContent = '0/500';
        _currentPage = 1;
        _loadComments(true);
        // 更新计数
        var badge = document.getElementById('comment-count-badge');
        if (badge) badge.textContent = Comments.getCommentCount(_currentPlaceId) + ' 条评论';
      } else {
        alert(result.msg);
      }
    });

    // 无限滚动
    var body = overlay.querySelector('.comment-modal-body');
    body.addEventListener('scroll', function() {
      if (_isLoading) return;
      if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
        var data = Comments.getComments(_currentPlaceId, _currentPage);
        if (data.hasMore) {
          _currentPage++;
          _loadComments();
        }
      }
    });
  }

  function _loadComments(replace) {
    _isLoading = true;
    var loading = document.getElementById('comment-loading');
    if (loading) loading.style.display = 'block';

    var data = Comments.getComments(_currentPlaceId, _currentPage);
    var list = document.getElementById('comment-list');
    var empty = document.getElementById('comment-empty');

    if (!list) { _isLoading = false; return; }

    if (replace) list.innerHTML = '';

    if (data.total === 0 && _currentPage === 1) {
      if (empty) empty.style.display = 'block';
      if (loading) loading.style.display = 'none';
      _isLoading = false;
      return;
    }

    if (empty) empty.style.display = 'none';

    data.items.forEach(function(c) {
      list.insertAdjacentHTML('beforeend', _renderCommentItem(c));
    });

    _bindCommentEvents(list);
    if (loading) loading.style.display = 'none';
    _isLoading = false;
  }

  function _renderCommentItem(c) {
    var timeStr = _formatTime(c.time);
    var voteType = Comments.getVoteType(c.id);

    return '<div class="comment-item" data-id="' + c.id + '">' +
      '<div class="comment-header">' +
        '<span class="comment-nick"><i class="fas fa-user-circle"></i> ' + c.nickname + '</span>' +
        '<span class="comment-time">' + timeStr + '</span>' +
      '</div>' +
      '<div class="comment-body">' + c.content + '</div>' +
      '<div class="comment-actions">' +
        '<button class="comment-vote-btn like-btn' + (voteType === 'like' ? ' voted' : '') + '" data-id="' + c.id + '" data-type="like">' +
          '<i class="fas fa-heart"></i> <span>' + c.likes + '</span>' +
        '</button>' +
        '<button class="comment-vote-btn dislike-btn' + (voteType === 'dislike' ? ' voted dislike' : '') + '" data-id="' + c.id + '" data-type="dislike">' +
          '<i class="fas fa-arrow-down"></i> <span>' + c.dislikes + '</span>' +
        '</button>' +
        '<button class="comment-report-btn" data-id="' + c.id + '" title="举报"><i class="fas fa-flag"></i></button>' +
      '</div>' +
    '</div>';
  }

  function _bindCommentEvents(container) {
    // 投票按钮
    container.querySelectorAll('.comment-vote-btn').forEach(function(btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function() {
        var commentId = this.dataset.id;
        var type = this.dataset.type;
        var result = Comments.vote(commentId, _currentPlaceId, type);
        if (!result) return;

        // 动画
        if (type === 'like' && (result === 'voted' || result === 'switched')) {
          this.classList.add('like-animate');
          var self = this;
          setTimeout(function() { self.classList.remove('like-animate'); }, 600);
        }
        if (type === 'dislike' && (result === 'voted' || result === 'switched')) {
          this.classList.add('dislike-animate');
          var self2 = this;
          setTimeout(function() { self2.classList.remove('dislike-animate'); }, 400);
        }

        // 更新 UI
        var commentData = Comments.getComments(_currentPlaceId, 1);
        var updated = null;
        for (var i = 0; i < commentData.items.length; i++) {
          if (commentData.items[i].id === commentId) { updated = commentData.items[i]; break; }
        }
        if (updated) {
          var item = container.querySelector('.comment-item[data-id="' + commentId + '"]');
          if (item) {
            var likeBtn = item.querySelector('.like-btn');
            var dislikeBtn = item.querySelector('.dislike-btn');
            var newVote = Comments.getVoteType(commentId);

            likeBtn.querySelector('span').textContent = updated.likes;
            dislikeBtn.querySelector('span').textContent = updated.dislikes;
            likeBtn.classList.toggle('voted', newVote === 'like');
            dislikeBtn.classList.toggle('voted', newVote === 'dislike');
            dislikeBtn.classList.toggle('dislike', newVote === 'dislike');
          }
        }
      });
    });

    // 举报按钮
    container.querySelectorAll('.comment-report-btn').forEach(function(btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function() {
        var commentId = this.dataset.id;
        // 找到评论内容
        var commentData = Comments.getComments(_currentPlaceId, 1);
        var comment = null;
        for (var i = 0; i < commentData.items.length; i++) {
          if (commentData.items[i].id === commentId) { comment = commentData.items[i]; break; }
        }
        _showReportModal(commentId, comment);
      });
    });
  }

  function _showReportModal(commentId, comment) {
    // 移除已有的举报弹窗
    var existing = document.getElementById('report-modal-overlay');
    if (existing) existing.remove();

    var html =
      '<div id="report-modal-overlay" class="report-modal-overlay">' +
        '<div class="report-modal-card">' +
          '<button class="report-modal-close"><i class="fas fa-times"></i></button>' +
          '<h3 style="margin-bottom:1rem;"><i class="fas fa-flag" style="color:var(--warning-color);"></i> 举报评论</h3>' +
          '<p class="report-preview">"' + (comment ? comment.content.substring(0, 60) : '') + '..."</p>' +
          '<label class="report-label">举报理由</label>' +
          '<select class="report-reason-select" id="report-reason">' +
            '<option value="垃圾广告">垃圾广告</option>' +
            '<option value="人身攻击">人身攻击</option>' +
            '<option value="色情低俗">色情低俗</option>' +
            '<option value="虚假信息">虚假信息</option>' +
            '<option value="其他">其他</option>' +
          '</select>' +
          '<label class="report-label">详细说明 <span style="color:var(--text-lighter);font-weight:400;">(可选)</span></label>' +
          '<textarea class="report-detail-textarea" id="report-detail" maxlength="200" placeholder="补充说明..."></textarea>' +
          '<div class="report-actions">' +
            '<button class="btn btn-outline report-cancel-btn">取消</button>' +
            '<button class="btn btn-primary report-submit-btn">提交举报</button>' +
          '</div>' +
          '<div class="report-success" id="report-success" style="display:none;">' +
            '<i class="fas fa-check-circle" style="color:var(--success-color);font-size:1.5rem;"></i>' +
            '<p>感谢您的举报，我们会尽快处理</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    var overlay = document.getElementById('report-modal-overlay');

    overlay.querySelector('.report-modal-close').addEventListener('click', function() {
      overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector('.report-cancel-btn').addEventListener('click', function() {
      overlay.remove();
    });

    overlay.querySelector('.report-submit-btn').addEventListener('click', function() {
      var reason = document.getElementById('report-reason').value;
      var detail = document.getElementById('report-detail').value;
      Comments.report(
        commentId,
        _currentPlaceId,
        reason,
        detail,
        comment ? comment.nickname : '',
        comment ? comment.content : ''
      );
      // 显示成功
      overlay.querySelector('.report-modal-card > *:not(#report-success)').style.display = 'none';
      var success = document.getElementById('report-success');
      if (success) {
        success.style.display = 'block';
        success.style.textAlign = 'center';
        success.style.padding = '2rem';
      }
      setTimeout(function() { overlay.remove(); }, 2000);
    });
  }

  function _formatTime(isoStr) {
    try {
      var d = new Date(isoStr);
      var now = new Date();
      var diff = now - d;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } catch(e) { return ''; }
  }

  return { open: open, close: close };
})();
