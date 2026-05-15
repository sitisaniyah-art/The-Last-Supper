/**
 * comments.js — 评论数据模块（CRUD/投票/举报）
 * 存储: localStorage (tls_comments, tls_comment_votes, tls_comment_reports)
 */
var Comments = (function() {
  var COMMENTS_KEY = 'tls_comments';
  var VOTES_KEY = 'tls_comment_votes';
  var REPORTS_KEY = 'tls_comment_reports';
  var PAGE_SIZE = 20;
  var VOTE_EXPIRY = 24 * 60 * 60 * 1000; // 24h

  function _parse(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  }
  function _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  function _sanitize(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _getAll() { return _parse(COMMENTS_KEY) || {}; }
  function _saveAll(data) { _save(COMMENTS_KEY, data); }

  function _getPlaceComments(placeId) {
    var all = _getAll();
    var key = String(placeId);
    return (all[key] || []).slice().sort(function(a, b) {
      return new Date(b.time) - new Date(a.time);
    });
  }

  function getComments(placeId, page) {
    page = page || 1;
    var comments = _getPlaceComments(placeId);
    var total = comments.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    var start = (page - 1) * PAGE_SIZE;
    return {
      items: comments.slice(start, start + PAGE_SIZE),
      page: page,
      totalPages: totalPages,
      total: total,
      hasMore: page < totalPages
    };
  }

  function getCommentCount(placeId) {
    var all = _getAll();
    return (all[String(placeId)] || []).length;
  }

  function addComment(placeId, nickname, content) {
    nickname = (nickname || '').trim();
    content = (content || '').trim();

    if (nickname.length < 2 || nickname.length > 15) {
      return { ok: false, msg: '昵称需要 2-15 个字符' };
    }
    if (content.length < 5 || content.length > 500) {
      return { ok: false, msg: '评论需要 5-500 个字符' };
    }

    var comment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      nickname: _sanitize(nickname),
      content: _sanitize(content),
      time: new Date().toISOString(),
      likes: 0,
      dislikes: 0
    };

    var all = _getAll();
    var key = String(placeId);
    if (!all[key]) all[key] = [];
    all[key].push(comment);
    _saveAll(all);

    return { ok: true, comment: comment };
  }

  function _getVotes() { return _parse(VOTES_KEY) || {}; }
  function _saveVotes(d) { _save(VOTES_KEY, d); }

  function canVote(commentId) {
    var votes = _getVotes();
    var entry = votes[commentId];
    if (!entry) return true;
    return (Date.now() - entry.time) > VOTE_EXPIRY;
  }

  function getVoteType(commentId) {
    var votes = _getVotes();
    var entry = votes[commentId];
    if (!entry) return null;
    if ((Date.now() - entry.time) > VOTE_EXPIRY) return null;
    return entry.type;
  }

  function vote(commentId, placeId, type) {
    if (type !== 'like' && type !== 'dislike') return false;

    var votes = _getVotes();
    var entry = votes[commentId];

    // 找到评论
    var all = _getAll();
    var key = String(placeId);
    var comments = all[key] || [];
    var comment = null;
    for (var i = 0; i < comments.length; i++) {
      if (comments[i].id === commentId) { comment = comments[i]; break; }
    }
    if (!comment) return false;

    // 检查是否已投票
    if (entry && (Date.now() - entry.time) < VOTE_EXPIRY) {
      if (entry.type === type) {
        // 取消投票
        if (type === 'like') comment.likes = Math.max(0, comment.likes - 1);
        else comment.dislikes = Math.max(0, comment.dislikes - 1);
        delete votes[commentId];
        _saveVotes(votes);
        _saveAll(all);
        return 'unvoted';
      } else {
        // 切换投票
        if (entry.type === 'like') comment.likes = Math.max(0, comment.likes - 1);
        else comment.dislikes = Math.max(0, comment.dislikes - 1);
        if (type === 'like') comment.likes++;
        else comment.dislikes++;
        votes[commentId] = { type: type, time: Date.now() };
        _saveVotes(votes);
        _saveAll(all);
        return 'switched';
      }
    }

    // 新投票
    if (type === 'like') comment.likes++;
    else comment.dislikes++;
    votes[commentId] = { type: type, time: Date.now() };
    _saveVotes(votes);
    _saveAll(all);
    return 'voted';
  }

  function report(commentId, placeId, reason, detail, nickname, content) {
    var reports = _parse(REPORTS_KEY) || [];
    reports.push({
      commentId: commentId,
      placeId: String(placeId),
      nickname: nickname,
      content: content,
      reason: reason,
      detail: (detail || '').trim(),
      time: new Date().toISOString()
    });
    _save(REPORTS_KEY, reports);
  }

  function getReports() { return _parse(REPORTS_KEY) || []; }

  function deleteReport(index) {
    var reports = getReports();
    if (index >= 0 && index < reports.length) {
      reports.splice(index, 1);
      _save(REPORTS_KEY, reports);
    }
  }

  return {
    getComments: getComments,
    addComment: addComment,
    getCommentCount: getCommentCount,
    canVote: canVote,
    getVoteType: getVoteType,
    vote: vote,
    report: report,
    getReports: getReports,
    deleteReport: deleteReport
  };
})();
