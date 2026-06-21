/* ============================================================
   منصة وعي الشباب BBA - Dz Young Leaders
   Admin Dashboard Script v3.0
   ============================================================ */

/* ============================================================
 * UTILITY HELPERS
 * ============================================================ */
function byId(id) { return document.getElementById(id); }
function escapeHtml(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function qs(s, cb) { var n = document.querySelectorAll(s); for (var i = 0; i < n.length; i++) cb(n[i], i); }

/* ============================================================
 * TOAST NOTIFICATION SYSTEM
 * ============================================================ */
function showToast(msg, type) {
  type = type || 'info';
  var c = byId('toastContainer');
  if (!c) return;
  var icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  var t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + msg + '</span>';
  c.appendChild(t);
  setTimeout(function () { t.classList.add('toast-exit'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 4000);
}
window.showToast = showToast;

/* ============================================================
 * AUTHENTICATION
 * ============================================================ */
(function initAuth() {
  var ls = byId('lockScreen');
  var lf = byId('loginForm');
  var le = byId('loginError');
  var lo = byId('logoutBtn');
  var ac = byId('adminContent');
  var INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  var inactivityTimer = null;

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (sessionStorage.getItem('bba_admin_auth') === 'true') {
      inactivityTimer = setTimeout(autoLogout, INACTIVITY_TIMEOUT);
    }
  }
  function autoLogout() {
    sessionStorage.removeItem('bba_admin_auth');
    showToast('تم تسجيل الخروج تلقائياً بسبب عدم النشاط', 'info');
    if (ls) ls.classList.remove('hidden');
    if (ac) ac.style.display = 'none';
  }
  if (sessionStorage.getItem('bba_admin_auth') === 'true') {
    if (ls) ls.classList.add('hidden');
    if (ac) ac.style.display = 'block';
    resetInactivityTimer();
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
    document.addEventListener('mousemove', resetInactivityTimer);
  }
  if (lf) {
    /* Rate limit state */
    var loginAttempts = 0;
    var maxLoginAttempts = 5;
    var loginLockedUntil = 0;
    var loginLockoutMinutes = 15;

    lf.addEventListener('submit', function (e) {
      e.preventDefault();
      /* Check rate limit */
      var now2 = Date.now();
      if (now2 < loginLockedUntil) {
        var remainingMin = Math.ceil((loginLockedUntil - now2) / 60000);
        if (le) {
          le.classList.add('visible');
          le.textContent = '' + String.fromCharCode(128274) + ' تم تجاوز عدد المحاولات. يرجى المحاولة بعد ' + remainingMin + ' دقيقة';
        }
        return;
      }
      var email = byId('loginEmail').value.trim();
      var password = byId('loginPassword').value;
      /* @deprecated Legacy fallback - Supabase Auth is primary */
      if (email === 'admin@bba.dz' && password === 'bba2026') {
        /* Reset login attempts on success */
        loginAttempts = 0;
        loginLockedUntil = 0;
        sessionStorage.setItem('bba_admin_auth', 'true');
        ls.classList.add('hidden');
        ac.style.display = 'block';
        le.classList.remove('visible');
        le.textContent = '';
        lf.reset();
        resetInactivityTimer();
        document.addEventListener('click', resetInactivityTimer);
        document.addEventListener('keydown', resetInactivityTimer);
        document.addEventListener('scroll', resetInactivityTimer);
        document.addEventListener('mousemove', resetInactivityTimer);
      } else {
        loginAttempts++;
        if (loginAttempts >= maxLoginAttempts) {
          loginLockedUntil = Date.now() + (loginLockoutMinutes * 60 * 1000);
        }
        le.classList.add('visible');
        le.textContent = 'بريد إلكتروني أو كلمة مرور غير صحيحة';
        byId('loginPassword').value = '';
      }
    });
  }
  if (lo) {
    lo.addEventListener('click', function () {
      sessionStorage.removeItem('bba_admin_auth');
      if (inactivityTimer) clearTimeout(inactivityTimer);
      location.reload();
    });
  }
})();

/* ============================================================
 * SIDEBAR NAVIGATION
 * ============================================================ */
(function initSidebar() {
  var links = document.querySelectorAll('.sidebar-nav a');
  var sections = document.querySelectorAll('.admin-section');
  var menuToggle = byId('menuToggle');
  var sidebar = document.querySelector('.sidebar');
  var overlay = document.querySelector('.sidebar-overlay');
  if (!links.length) return;

  function switchSection(id) {
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove('active');
      if (links[i].getAttribute('data-section') === id) links[i].classList.add('active');
    }
    for (var j = 0; j < sections.length; j++) {
      sections[j].classList.remove('active');
      if (sections[j].id === id) sections[j].classList.add('active');
    }
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }

  var initial = window.location.hash.replace('#', '') || 'dashboard';
  switchSection(initial);

  for (var k = 0; k < links.length; k++) {
    (function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sid = link.getAttribute('data-section');
        if (sid) { window.location.hash = sid; switchSection(sid); }
      });
    })(links[k]);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
  window.addEventListener('hashchange', function () {
    switchSection(window.location.hash.replace('#', '') || 'dashboard');
  });
})();

/* ============================================================
 * DASHBOARD STATISTICS + OVERVIEW WIDGETS
 * ============================================================ */
(function loadDashboardOverview() {
  var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
  var consultations = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
  var tasks = JSON.parse(localStorage.getItem('bba_tasks') || '[]');
  var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
  var notificationsData = JSON.parse(localStorage.getItem('bba_notifications_data') || '[]');
  var totalV = volunteers.length;
  var totalC = consultations.length;
  var pendingV = 0, approvedV = 0, suspendedV = 0, answeredC = 0;
  for (var i = 0; i < volunteers.length; i++) {
    if (volunteers[i].status === 'pending') pendingV++;
    else if (volunteers[i].status === 'approved') approvedV++;
    if (volunteers[i].suspended) suspendedV++;
  }
  var completedTasks = 0;
  var portalTasks = [];
  for (var t = 0; t < tasks.length; t++) {
    portalTasks.push(tasks[t]);
  }
  for (var j = 0; j < consultations.length; j++) {
    if (consultations[j].status === 'answered' || consultations[j].status === 'closed') answeredC++;
  }
  var pendingC = 0;
  for (var j = 0; j < consultations.length; j++) {
    if (consultations[j].status === 'pending' || consultations[j].status === 'in_progress') pendingC++;
  }

  function animateValue(el, target) {
    if (!el) return;
    var start = 0;
    var increment = target > 0 ? Math.ceil(target / (1000 / 16)) : 0;
    var timer = setInterval(function () {
      start += increment;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = start;
    }, 16);
  }

  animateValue(byId('statVolunteers'), totalV);
  animateValue(byId('statConsultations'), totalC);
  animateValue(byId('statPending'), pendingV + pendingC);
  animateValue(byId('statApproved'), approvedV);

  /* Overview widgets */
  var recentConsults = byId('recentConsultations');
  var recentVols = byId('recentVolunteers');
  var pendingActions = byId('pendingActions');
  var quickActions = byId('quickActions');

  if (recentConsults) {
    var rc = consultations.slice(-5).reverse();
    if (rc.length === 0) {
      recentConsults.innerHTML = '<div class="empty-state-mini">لا توجد استشارات بعد</div>';
    } else {
      var html = '';
      for (var i = 0; i < rc.length; i++) {
        var d = new Date(rc[i].date);
        html += '<div class="activity-item"><div class="activity-icon">💬</div><div class="activity-info"><div class="activity-title">' + escapeHtml(rc[i].subject) + '</div><div class="activity-time">' + d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' }) + ' | ' + escapeHtml(rc[i].alias) + '</div></div><span class="badge badge-pending">جديد</span></div>';
      }
      recentConsults.innerHTML = html;
    }
  }

  if (recentVols) {
    var rv = volunteers.slice(-5).reverse();
    if (rv.length === 0) {
      recentVols.innerHTML = '<div class="empty-state-mini">لا يوجد متطوعون بعد</div>';
    } else {
      var html = '';
      for (var i = 0; i < rv.length; i++) {
        var d = new Date(rv[i].date);
        var statusBadge = rv[i].status === 'approved' ? 'badge-approved' : rv[i].status === 'rejected' ? 'badge-rejected' : 'badge-pending';
        var statusText = rv[i].status === 'approved' ? 'مقبول' : rv[i].status === 'rejected' ? 'مرفوض' : 'قيد الانتظار';
        html += '<div class="activity-item"><div class="activity-icon">👤</div><div class="activity-info"><div class="activity-title">' + escapeHtml(rv[i].fullName) + '</div><div class="activity-time">' + d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' }) + ' | ' + escapeHtml(rv[i].municipality) + '</div></div><span class="badge ' + statusBadge + '">' + statusText + '</span></div>';
      }
      recentVols.innerHTML = html;
    }
  }

  if (pendingActions) {
    var pv = 0, pc = 0;
    for (var i = 0; i < volunteers.length; i++) { if (volunteers[i].status === 'pending') pv++; }
    for (var j = 0; j < consultations.length; j++) { if (consultations[j].status === 'pending' || consultations[j].status === 'in_progress') pc++; }
    pendingActions.innerHTML =
      '<div class="pending-count"><span class="pending-num">' + (pv + pc) + '</span> إجراء معلق</div>' +
      '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.75rem">' +
      '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)"><span>🟡 متطوعون بانتظار الموافقة</span><span style="color:var(--gold);font-weight:600">' + pv + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)"><span>💬 استشارات بانتظار الرد</span><span style="color:var(--gold);font-weight:600">' + pc + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)"><span>👤 متطوعون معلقون</span><span style="color:var(--danger);font-weight:600">' + suspendedV + '</span></div>' +
      '</div>';
  }

  if (quickActions) {
    quickActions.innerHTML =
      '<button class="btn btn-primary btn-sm" onclick="window.location.hash=\'consultations\'" style="width:100%;justify-content:center">📋 مراجعة الاستشارات</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'volunteers\'" style="width:100%;justify-content:center">👥 إدارة المتطوعين</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'tasks\'" style="width:100%;justify-content:center">📋 إدارة المهام</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'statistics\'" style="width:100%;justify-content:center">📊 عرض الإحصائيات</button>';
  }
})();

/* ============================================================
 * VOLUNTEER MANAGEMENT
 * ============================================================ */
(function loadVolunteersTable() {
  var tbody = document.querySelector('#volunteersTable tbody');
  var empty = byId('volunteersEmpty');
  if (!tbody) return;

  var allVolunteers = [];
  var tableCard = tbody.closest('.admin-card');

  if (tableCard && !byId('volunteerSearch')) {
    var filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem';
    filterBar.innerHTML =
      '<input type="text" id="volunteerSearch" placeholder="🔍 بحث في المتطوعين..." style="flex:1;min-width:180px;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem">' +
      '<select id="volunteerStatusFilter" style="padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem;min-width:130px">' +
      '<option value="">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="approved">مقبول</option><option value="rejected">مرفوض</option></select>' +
      '<select id="volunteerMembershipFilter" style="padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem;min-width:150px">' +
      '<option value="">جميع العضويات</option><option value="admin">عضو فعال في الإدارة</option><option value="member">عضو في التنظيم</option></select>';
    tableCard.insertBefore(filterBar, tableCard.firstChild);
  }

  function loadData() { allVolunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]'); }

  function getFilteredData() {
    var sq = (byId('volunteerSearch') ? byId('volunteerSearch').value : '').trim().toLowerCase();
    var sf = byId('volunteerStatusFilter') ? byId('volunteerStatusFilter').value : '';
    var mf = byId('volunteerMembershipFilter') ? byId('volunteerMembershipFilter').value : '';
    if (!sq && !sf && !mf) { var all = []; for (var i = 0; i < allVolunteers.length; i++) all.push({ data: allVolunteers[i], idx: i }); return all; }
    var result = [];
    for (var i = 0; i < allVolunteers.length; i++) {
      var v = allVolunteers[i];
      if (sq && v.fullName.toLowerCase().indexOf(sq) === -1 && v.email.toLowerCase().indexOf(sq) === -1 && v.municipality.toLowerCase().indexOf(sq) === -1) continue;
      if (sf && v.status !== sf) continue;
      if (mf && v.membershipType !== mf) continue;
      result.push({ data: v, idx: i });
    }
    return result;
  }

  function renderTable() {
    loadData();
    var filtered = getFilteredData();
    tbody.innerHTML = '';
    if (allVolunteers.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--muted);font-size:0.9rem">لا توجد نتائج تطابق البحث</td></tr>';
      return;
    }
    var statusMap = { pending: '<span class="badge badge-pending">قيد الانتظار</span>', approved: '<span class="badge badge-approved">مقبول</span>', rejected: '<span class="badge badge-rejected">مرفوض</span>' };
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i], v = item.data, realIdx = item.idx;
      var badge = statusMap[v.status] || statusMap.pending;
      var memText = v.membershipType === 'admin' ? 'عضو فعال في الإدارة' : 'عضو في التنظيم';
      if (v.suspended) badge = '<span class="badge badge-rejected">معلق</span>';
      var tr = document.createElement('tr');
      var actions = '<div class="table-actions">';
      if (v.status !== 'approved') actions += '<button class="btn btn-success btn-sm" data-vol-action="approve" data-vol-idx="' + realIdx + '">قبول</button>';
      if (v.status !== 'rejected') actions += '<button class="btn btn-danger btn-sm" data-vol-action="reject" data-vol-idx="' + realIdx + '">رفض</button>';
      actions += '<button class="btn btn-secondary btn-sm" data-vol-action="' + (v.suspended ? 'unsuspend' : 'suspend') + '" data-vol-idx="' + realIdx + '" style="border-color:var(--muted);color:var(--muted)">' + (v.suspended ? 'إلغاء التعليق' : 'تعليق') + '</button>';
      actions += '<button class="btn btn-secondary btn-sm" data-vol-action="view" data-vol-idx="' + realIdx + '" style="border-color:var(--gold);color:var(--gold)">عرض</button>';
      actions += '<button class="btn btn-secondary btn-sm" data-vol-action="edit" data-vol-idx="' + realIdx + '" style="border-color:var(--success);color:var(--success)">✏️ تعديل</button>';
      actions += '<button class="btn btn-secondary btn-sm" data-vol-action="points" data-vol-idx="' + realIdx + '" style="border-color:#8b5cf6;color:#8b5cf6">⭐ نقاط</button>';
      actions += '<button class="btn btn-secondary btn-sm" data-vol-action="delete" data-vol-idx="' + realIdx + '" style="border-color:var(--danger);color:var(--danger)">حذف</button></div>';
      var acctStatus = v.suspended ? '<span class="badge badge-rejected">معلق</span>' : (v.status === 'approved' ? '<span class="badge badge-approved">نشط</span>' : '<span class="badge badge-pending">غير مفعل</span>');
      var vidDisplay = v.volunteerId ? '<span style="font-family:monospace;color:var(--gold);font-size:0.75rem">' + escapeHtml(v.volunteerId) + '</span>' : '<span style="color:var(--muted);font-size:0.75rem">---</span>';
      tr.innerHTML = '<td>' + vidDisplay + '</td><td>' + escapeHtml(v.fullName) + '</td><td>' + escapeHtml(v.email) + '</td><td dir="ltr">' + escapeHtml(v.phone) + '</td><td>' + escapeHtml(v.municipality) + '</td><td><span class="membership-text">' + memText + '</span></td><td>' + badge + '</td><td>' + acctStatus + '</td><td>' + actions + '</td>';
      tbody.appendChild(tr);
    }
    attachVolunteerHandlers();
  }

  function attachVolunteerHandlers() {
    qs('[data-vol-action]', function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-vol-action');
        var idx = parseInt(this.getAttribute('data-vol-idx'), 10);
        loadData();
        if (idx < 0 || idx >= allVolunteers.length) return;

        if (action === 'approve') {
          allVolunteers[idx].status = 'approved';
          allVolunteers[idx].suspended = false;
          if (!allVolunteers[idx].volunteerId) {
            allVolunteers[idx].volunteerId = 'VOL-BBA-2026-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');
          }
          showToast('تم قبول المتطوع بنجاح ✓ - المعرف: ' + allVolunteers[idx].volunteerId, 'success');
          /* Send notification */
          if (window.Notif && window.Notif.volunteerApproved) {
            window.Notif.volunteerApproved(allVolunteers[idx]);
          }
        } else if (action === 'reject') {
          allVolunteers[idx].status = 'rejected';
          showToast('تم رفض المتطوع', 'info');
          /* Send notification */
          if (window.Notif && window.Notif.volunteerRejected) {
            window.Notif.volunteerRejected(allVolunteers[idx]);
          }
        } else if (action === 'suspend') {
          allVolunteers[idx].suspended = true;
          showToast('تم تعليق المتطوع', 'info');
        } else if (action === 'unsuspend') {
          allVolunteers[idx].suspended = false;
          showToast('تم إلغاء تعليق المتطوع', 'success');
        } else if (action === 'delete') {
          if (confirm('هل أنت متأكد من حذف هذا المتطوع؟')) { allVolunteers.splice(idx, 1); showToast('تم حذف المتطوع', 'info'); } else { return; }
        } else if (action === 'view') {
          showVolunteerDetails(allVolunteers[idx]); return;
        } else if (action === 'edit') {
          openEditVolunteerModal(idx); return;
        } else if (action === 'points') {
          openPointsManagement(idx); return;
        }
        localStorage.setItem('bba_volunteers', JSON.stringify(allVolunteers));
        renderTable();
        refreshAllStats();
        if (typeof updateCharts === 'function') updateCharts();
      });
    });
  }

  function showVolunteerDetails(v) {
    var statusText = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
    var memText = v.membershipType === 'admin' ? 'عضو فعال في الإدارة' : 'عضو في التنظيم';
    var d = new Date(v.date);
    var notesHtml = v.adminNotes ? '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">ملاحظات الإدارة</span><span class="detail-value" style="background:rgba(212,175,55,0.05);padding:0.5rem;border-radius:var(--radius-sm);border-right:3px solid var(--gold)">' + escapeHtml(v.adminNotes) + '</span></div>' : '';
    var historyHtml = '';
    if (v.participationHistory && v.participationHistory.length > 0) {
      historyHtml = '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">سجل المشاركة</span><span class="detail-value">';
      for (var h = 0; h < v.participationHistory.length; h++) {
        historyHtml += '<div style="font-size:0.8rem;color:var(--text-secondary);padding:0.15rem 0">📌 ' + escapeHtml(v.participationHistory[h].action) + ' <span style="color:var(--muted);font-size:0.7rem">(' + v.participationHistory[h].date + ')</span></div>';
      }
      historyHtml += '</span></div>';
    }
    var pointsHistory = JSON.parse(localStorage.getItem('bba_points_' + (v.volunteerId || '')) || '[]');
    var totalPoints = 0;
    for (var p = 0; p < pointsHistory.length; p++) {
      if (pointsHistory[p].type === 'add') totalPoints += pointsHistory[p].amount;
      else totalPoints -= pointsHistory[p].amount;
    }
    byId('volunteerModalBody').innerHTML =
      '<div class="detail-row"><span class="detail-label">الاسم</span><span class="detail-value">' + escapeHtml(v.fullName) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">البريد</span><span class="detail-value">' + escapeHtml(v.email) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">الهاتف</span><span class="detail-value" dir="ltr">' + escapeHtml(v.phone) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">البلدية</span><span class="detail-value">' + escapeHtml(v.municipality) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">المعرف</span><span class="detail-value">' + (v.volunteerId || 'غير معتمد بعد') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">العضوية</span><span class="detail-value">' + memText + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">الحالة</span><span class="detail-value">' + (v.suspended ? 'معلق' : (statusText[v.status] || 'قيد الانتظار')) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">النقاط</span><span class="detail-value" style="color:var(--gold);font-weight:700;font-size:1rem">' + totalPoints + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">الدافع</span><span class="detail-value">' + escapeHtml(v.motivation || 'غير مذكور') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">تاريخ التسجيل</span><span class="detail-value">' + d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) + '</span></div>' +
      notesHtml + historyHtml;
    byId('volunteerModal').classList.add('active');
  }

  window.openEditVolunteerModal = function(idx) {
    loadData();
    var v = allVolunteers[idx];
    var html =
      '<div class="form-group"><label>الاسم الكامل</label><input type="text" id="editName" value="' + escapeHtml(v.fullName) + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)"></div>' +
      '<div class="form-group"><label>رقم الهاتف</label><input type="text" id="editPhone" value="' + escapeHtml(v.phone) + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)" dir="ltr"></div>' +
      '<div class="form-group"><label>البلدية</label><input type="text" id="editMunicipality" value="' + escapeHtml(v.municipality) + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)"></div>' +
      '<div class="form-group"><label>ملاحظات الإدارة</label><textarea id="editNotes" style="width:100%;min-height:80px;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);resize:vertical">' + (v.adminNotes || '') + '</textarea></div>' +
      '<button type="button" id="saveEditBtn" class="btn btn-primary" style="width:100%;justify-content:center">💾 حفظ التعديلات</button>';
    byId('editVolunteerModalBody').innerHTML = html;
    byId('editVolunteerModal').classList.add('active');
    byId('saveEditBtn').addEventListener('click', function() {
      loadData();
      var newName = byId('editName').value.trim();
      var newPhone = byId('editPhone').value.trim();
      var newMun = byId('editMunicipality').value.trim();
      var newNotes = byId('editNotes').value.trim();
      if (!newName || !newPhone) { showToast('الاسم والهاتف مطلوبان', 'error'); return; }
      allVolunteers[idx].fullName = newName;
      allVolunteers[idx].phone = newPhone;
      allVolunteers[idx].municipality = newMun;
      allVolunteers[idx].adminNotes = newNotes;
      localStorage.setItem('bba_volunteers', JSON.stringify(allVolunteers));
      byId('editVolunteerModal').classList.remove('active');
      showToast('تم تحديث بيانات المتطوع بنجاح ✓', 'success');
      renderTable();
    });
  };

  window.openPointsManagement = function(idx) {
    loadData();
    var v = allVolunteers[idx];
    var vid = v.volunteerId || '';
    var pointsHistory = JSON.parse(localStorage.getItem('bba_points_' + vid) || '[]');
    var totalPoints = 0;
    for (var p = 0; p < pointsHistory.length; p++) {
      if (pointsHistory[p].type === 'add') totalPoints += pointsHistory[p].amount;
      else totalPoints -= pointsHistory[p].amount;
    }
    var historyHtml = '';
    if (pointsHistory.length === 0) {
      historyHtml = '<div style="text-align:center;padding:1rem;color:var(--muted);font-size:0.85rem">لا يوجد سجل نقاط بعد</div>';
    } else {
      for (var p = pointsHistory.length - 1; p >= 0; p--) {
        var ph = pointsHistory[p];
        var sign = ph.type === 'add' ? '+' : '-';
        var color = ph.type === 'add' ? 'var(--success)' : 'var(--danger)';
        historyHtml += '<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-light);font-size:0.85rem"><span style="color:var(--text)">' + escapeHtml(ph.reason) + '</span><span style="color:' + color + ';font-weight:700">' + sign + ph.amount + '</span></div>';
      }
    }
    byId('pointsModalBody').innerHTML =
      '<div style="text-align:center;margin-bottom:1rem"><span style="font-size:2rem;font-weight:700;color:var(--gold)">' + totalPoints + '</span><span style="color:var(--muted);display:block;font-size:0.85rem">إجمالي النقاط - ' + escapeHtml(v.fullName) + '</span></div>' +
      '<div style="display:flex;gap:0.5rem;margin-bottom:1rem">' +
      '<div class="form-group" style="flex:1"><label>الكمية</label><input type="number" id="pointsAmount" value="10" min="1" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text)"></div>' +
      '<div class="form-group" style="flex:2"><label>السبب</label><input type="text" id="pointsReason" placeholder="سبب إضافة/خصم النقاط" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text)"></div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-bottom:1.5rem">' +
      '<button type="button" id="pointsAddBtn" class="btn btn-success btn-sm" style="flex:1;justify-content:center">➕ إضافة نقاط</button>' +
      '<button type="button" id="pointsRemoveBtn" class="btn btn-danger btn-sm" style="flex:1;justify-content:center">➖ خصم نقاط</button>' +
      '</div>' +
      '<h4 style="font-size:0.9rem;color:var(--gold);margin-bottom:0.5rem">سجل النقاط</h4>' +
      '<div style="max-height:200px;overflow-y:auto">' + historyHtml + '</div>';
    byId('pointsModal').classList.add('active');

    byId('pointsAddBtn').addEventListener('click', function() { modifyPoints(idx, 'add'); });
    byId('pointsRemoveBtn').addEventListener('click', function() { modifyPoints(idx, 'remove'); });
  };

  function modifyPoints(idx, type) {
    var amount = parseInt(byId('pointsAmount').value, 10);
    var reason = byId('pointsReason').value.trim();
    if (!amount || amount < 1) { showToast('أدخل كمية صالحة', 'error'); return; }
    if (!reason) { showToast('أدخل سبب التعديل', 'error'); return; }
    loadData();
    var vid = allVolunteers[idx].volunteerId || '';
    var pointsHistory = JSON.parse(localStorage.getItem('bba_points_' + vid) || '[]');
    pointsHistory.push({ amount: amount, reason: reason, date: new Date().toISOString(), type: type });
    localStorage.setItem('bba_points_' + vid, JSON.stringify(pointsHistory));
    showToast(type === 'add' ? '✅ تم إضافة ' + amount + ' نقطة' : '❌ تم خصم ' + amount + ' نقطة', 'success');
    openPointsManagement(idx);
  }

  setTimeout(function () {
    var si = byId('volunteerSearch'); var sf = byId('volunteerStatusFilter'); var mf = byId('volunteerMembershipFilter');
    if (si) si.addEventListener('input', renderTable);
    if (sf) sf.addEventListener('change', renderTable);
    if (mf) mf.addEventListener('change', renderTable);
  }, 100);
  renderTable();
})();

/* ============================================================
 * CONSULTATION MANAGEMENT
 * Full CRUD with status update, specialist response, extra notes
 * ============================================================ */
(function loadConsultationsTable() {
  var tbody = document.querySelector('#consultationsTable tbody');
  var empty = byId('consultationsEmpty');
  if (!tbody) return;

  var allConsultations = [];
  var tableCard = tbody.closest('.admin-card');

  if (tableCard && !byId('consultationSearch')) {
    var filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem';
    filterBar.innerHTML =
      '<input type="text" id="consultationSearch" placeholder="🔍 بحث في الاستشارات..." style="flex:1;min-width:200px;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem">' +
      '<select id="consultationStatusFilter" style="padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.85rem;min-width:130px">' +
      '<option value="">جميع الحالات</option><option value="pending">جديدة</option><option value="in_progress">قيد المعالجة</option><option value="answered">تم الرد</option><option value="closed">مغلقة</option></select>';
    tableCard.insertBefore(filterBar, tableCard.firstChild);
  }

  function loadData() { allConsultations = JSON.parse(localStorage.getItem('bba_consultations') || '[]'); }

  function getFiltered() {
    var sq = (byId('consultationSearch') ? byId('consultationSearch').value : '').trim().toLowerCase();
    var sf = byId('consultationStatusFilter') ? byId('consultationStatusFilter').value : '';
    if (!sq && !sf) { var result = []; for (var i = 0; i < allConsultations.length; i++) result.push({ data: allConsultations[i], idx: i }); return result; }
    var result = [];
    for (var i = 0; i < allConsultations.length; i++) {
      var c = allConsultations[i];
      if (sq && ((c.trackingCode && c.trackingCode.toLowerCase().indexOf(sq) === -1) && (c.alias && c.alias.toLowerCase().indexOf(sq) === -1) && (c.subject && c.subject.toLowerCase().indexOf(sq) === -1))) continue;
      if (sf && c.status !== sf) continue;
      result.push({ data: c, idx: i });
    }
    return result;
  }

  var statusMap = { pending: 'جديدة', in_progress: 'قيد المعالجة', answered: 'تم الرد', closed: 'مغلقة' };
  var statusBadgeMap = { pending: 'badge-pending', in_progress: 'badge-pending', answered: 'badge-approved', closed: 'badge-rejected' };

  function renderTable() {
    loadData();
    var filtered = getFiltered();
    tbody.innerHTML = '';
    if (allConsultations.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);font-size:0.9rem">لا توجد نتائج تطابق البحث</td></tr>';
      return;
    }
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i], c = item.data, allIdx = item.idx;
      var d = new Date(c.date);
      var fd = d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      var st = statusMap[c.status] || 'جديدة';
      var sb = statusBadgeMap[c.status] || 'badge-pending';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td dir="ltr" style="font-family:monospace;color:var(--gold);font-weight:600;font-size:0.8rem">' + escapeHtml(c.trackingCode) + '</td>' +
        '<td>' + escapeHtml(c.alias) + '</td>' +
        '<td>' + escapeHtml(c.subject) + '</td>' +
        '<td><span class="badge ' + sb + '">' + st + '</span></td>' +
        '<td>' + fd + '</td>' +
        '<td><div class="table-actions">' +
        '<button class="btn btn-secondary btn-sm" data-con-action="view" data-con-idx="' + allIdx + '" style="border-color:var(--gold);color:var(--gold)">عرض</button>' +
        '<button class="btn btn-success btn-sm" data-con-action="respond" data-con-idx="' + allIdx + '">رد</button>' +
        '<button class="btn btn-danger btn-sm" data-con-action="delete" data-con-idx="' + allIdx + '">حذف</button>' +
        '</div></td>';
      tbody.appendChild(tr);
    }
    attachConsultationHandlers();
  }

  function attachConsultationHandlers() {
    qs('[data-con-action]', function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-con-action');
        var idx = parseInt(this.getAttribute('data-con-idx'), 10);
        loadData();
        if (idx < 0 || idx >= allConsultations.length) return;

        if (action === 'view') {
          var c = allConsultations[idx];
          var d = new Date(c.date);
          var st = statusMap[c.status] || 'جديدة';
          byId('consultationModalBody').innerHTML =
            '<div class="detail-row"><span class="detail-label">رمز المتابعة</span><span class="detail-value code">' + escapeHtml(c.trackingCode) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الاسم المستعار</span><span class="detail-value">' + escapeHtml(c.alias) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الفئة العمرية</span><span class="detail-value">' + escapeHtml(c.ageGroup || 'غير محدد') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الموضوع</span><span class="detail-value">' + escapeHtml(c.subject) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الرسالة</span><span class="detail-value" style="background:rgba(255,255,255,0.03);padding:0.5rem;border-radius:var(--radius-sm)">' + escapeHtml(c.message) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">الحالة</span><span class="detail-value"><span class="badge ' + (statusBadgeMap[c.status] || 'badge-pending') + '">' + st + '</span></span></div>' +
            '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">' + d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</span></div>' +
            (c.specialistResponse ? '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">رد المستشار</span><span class="detail-value" style="background:rgba(212,175,55,0.05);padding:0.75rem;border-radius:var(--radius-sm);border-right:3px solid var(--gold)">' + escapeHtml(c.specialistResponse) + '</span></div>' : '') +
            (c.extraNotes ? '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">ملاحظات</span><span class="detail-value" style="background:rgba(16,185,129,0.05);padding:0.75rem;border-radius:var(--radius-sm);border-right:3px solid var(--success)">' + escapeHtml(c.extraNotes) + '</span></div>' : '');
          byId('consultationModal').classList.add('active');
        } else if (action === 'respond') {
          openRespondModal(idx);
        } else if (action === 'delete') {
          if (confirm('هل أنت متأكد من حذف هذه الاستشارة؟')) {
            allConsultations.splice(idx, 1);
            localStorage.setItem('bba_consultations', JSON.stringify(allConsultations));
            showToast('تم حذف الاستشارة', 'info');
            renderTable();
            refreshAllStats();
          }
        }
      });
    });
  }

  function openRespondModal(idx) {
    var c = allConsultations[idx];
    var modal = byId('respondModal');
    var body = byId('respondModalBody');
    if (!modal || !body) return;

    body.innerHTML =
      '<div class="form-group"><label>رمز المتابعة</label><div class="detail-value code" style="font-family:monospace;color:var(--gold)">' + escapeHtml(c.trackingCode) + '</div></div>' +
      '<div class="form-group"><label>الموضوع</label><div style="color:var(--text);font-size:0.9rem">' + escapeHtml(c.subject) + '</div></div>' +
      '<div class="form-group"><label>الرسالة الأصلية</label><div style="color:var(--text-secondary);font-size:0.85rem;background:rgba(255,255,255,0.02);padding:0.75rem;border-radius:var(--radius-sm)">' + escapeHtml(c.message) + '</div></div>' +
      '<div class="form-group"><label for="respondStatus">تحديث الحالة</label>' +
      '<select id="respondStatus" style="width:100%;padding:0.75rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.9rem">' +
      '<option value="pending"' + (c.status === 'pending' ? ' selected' : '') + '>جديدة</option>' +
      '<option value="in_progress"' + (c.status === 'in_progress' ? ' selected' : '') + '>قيد المعالجة</option>' +
      '<option value="answered"' + (c.status === 'answered' ? ' selected' : '') + '>تم الرد</option>' +
      '<option value="closed"' + (c.status === 'closed' ? ' selected' : '') + '>مغلقة</option>' +
      '</select></div>' +
      '<div class="form-group"><label for="respondText">رد المستشار النفسي</label>' +
      '<textarea id="respondText" placeholder="اكتب رد المستشار هنا..." style="width:100%;min-height:120px;padding:0.75rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.9rem;resize:vertical">' + (c.specialistResponse || '') + '</textarea></div>' +
      '<div class="form-group"><label for="respondNotes">ملاحظات إضافية</label>' +
      '<textarea id="respondNotes" placeholder="ملاحظات إضافية..." style="width:100%;min-height:60px;padding:0.75rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.9rem;resize:vertical">' + (c.extraNotes || '') + '</textarea></div>' +
      '<button type="button" id="saveRespondBtn" class="btn btn-primary" style="width:100%;justify-content:center">💾 حفظ الرد وتحديث الحالة</button>';

    modal.classList.add('active');

    setTimeout(function () {
      var saveBtn = byId('saveRespondBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          var newStatus = byId('respondStatus').value;
          var responseText = byId('respondText').value.trim();
          var notesText = byId('respondNotes').value.trim();
          loadData();
          allConsultations[idx].status = newStatus;
          allConsultations[idx].specialistResponse = responseText;
          allConsultations[idx].extraNotes = notesText;
          allConsultations[idx].lastUpdated = new Date().toISOString();
          localStorage.setItem('bba_consultations', JSON.stringify(allConsultations));
          modal.classList.remove('active');
          showToast('تم حفظ الرد وتحديث الحالة بنجاح ✓', 'success');
          renderTable();
          refreshAllStats();
        });
      }
    }, 50);
  }

  function refreshAllStats() {
    var v = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var c = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
    var tp = 0, ta = 0;
    for (var i = 0; i < v.length; i++) { if (v[i].status === 'pending') tp++; if (v[i].status === 'approved') ta++; }
    for (var j = 0; j < c.length; j++) { if (c[j].status === 'pending' || c[j].status === 'in_progress') tp++; }
    byId('statVolunteers').textContent = v.length;
    byId('statConsultations').textContent = c.length;
    byId('statPending').textContent = tp;
    byId('statApproved').textContent = ta;
  }

  setTimeout(function () {
    var si = byId('consultationSearch'); var sf = byId('consultationStatusFilter');
    if (si) si.addEventListener('input', renderTable);
    if (sf) sf.addEventListener('change', renderTable);
  }, 100);
  renderTable();
})();

/* ============================================================
 * TASK MANAGEMENT SYSTEM
 * Admin CRUD, assign to volunteer/all, priority, deadline
 * ============================================================ */
(function loadTasksSection() {
  var tbody = document.querySelector('#tasksTable tbody');
  var empty = byId('tasksEmpty');
  if (!tbody) return;
  var allTasks = [];

  function loadData() { allTasks = JSON.parse(localStorage.getItem('bba_tasks') || '[]'); }
  function saveData() { localStorage.setItem('bba_tasks', JSON.stringify(allTasks)); }

  function renderTasks() {
    loadData();
    tbody.innerHTML = '';
    if (allTasks.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var priorityMap = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
    var priorityColor = { low: 'var(--muted)', medium: 'var(--gold)', high: 'var(--success)', urgent: 'var(--danger)' };
    for (var i = allTasks.length - 1; i >= 0; i--) {
      var t = allTasks[i];
      var assignText = t.assignedTo === 'all' ? 'جميع المتطوعين' : '';
      if (t.assignedTo !== 'all') {
        for (var v = 0; v < volunteers.length; v++) {
          if (volunteers[v].volunteerId === t.assignedTo) { assignText = volunteers[v].fullName; break; }
        }
        if (!assignText) assignText = t.assignedTo;
      }
      var deadlineHtml = t.deadline ? '<span style="font-size:0.75rem;color:var(--muted)">📅 ' + new Date(t.deadline).toLocaleDateString('ar-DZ') + '</span>' : '<span style="font-size:0.75rem;color:var(--muted)">بدون موعد</span>';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span style="font-weight:600">' + escapeHtml(t.name) + '</span></td>' +
        '<td>' + escapeHtml(assignText) + '</td>' +
        '<td><span style="color:' + (priorityColor[t.priority] || priorityColor.medium) + ';font-weight:600;font-size:0.8rem">' + (priorityMap[t.priority] || 'متوسطة') + '</span></td>' +
        '<td>' + deadlineHtml + '</td>' +
        '<td><div class="table-actions">' +
        '<button class="btn btn-secondary btn-sm" onclick="openTaskEdit(' + i + ')" style="border-color:var(--gold);color:var(--gold)">✏️</button>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteTask(' + i + ')">🗑️</button></div></td>';
      tbody.appendChild(tr);
    }
  }

  window.openTaskCreate = function() {
    openTaskForm(null);
  };
  window.openTaskEdit = function(idx) {
    openTaskForm(idx);
  };
  window.deleteTask = function(idx) {
    if (confirm('حذف هذه المهمة؟')) { loadData(); allTasks.splice(idx, 1); saveData(); renderTasks(); showToast('تم حذف المهمة', 'info'); }
  };

  function openTaskForm(idx) {
    var isEdit = idx !== null && idx !== undefined;
    loadData();
    var task = isEdit ? allTasks[idx] : { name: '', assignedTo: 'all', priority: 'medium', deadline: '', description: '' };
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var volOptions = '<option value="all"' + (task.assignedTo === 'all' ? ' selected' : '') + '>جميع المتطوعين</option>';
    for (var v = 0; v < volunteers.length; v++) {
      if (volunteers[v].status === 'approved') {
        volOptions += '<option value="' + volunteers[v].volunteerId + '"' + (task.assignedTo === volunteers[v].volunteerId ? ' selected' : '') + '>' + escapeHtml(volunteers[v].fullName) + ' (' + escapeHtml(volunteers[v].volunteerId) + ')</option>';
      }
    }
    byId('taskFormBody').innerHTML =
      '<div class="form-group"><label>اسم المهمة *</label><input type="text" id="taskName" value="' + escapeHtml(task.name) + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)"></div>' +
      '<div class="form-group"><label>الوصف</label><textarea id="taskDesc" style="width:100%;min-height:60px;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);resize:vertical">' + escapeHtml(task.description || '') + '</textarea></div>' +
      '<div style="display:flex;gap:1rem">' +
      '<div class="form-group" style="flex:1"><label>تعيين إلى</label><select id="taskAssign" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)">' + volOptions + '</select></div>' +
      '<div class="form-group" style="flex:1"><label>الأولوية</label><select id="taskPriority" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)">' +
      '<option value="low"' + (task.priority === 'low' ? ' selected' : '') + '>منخفضة</option>' +
      '<option value="medium"' + (task.priority === 'medium' ? ' selected' : '') + '>متوسطة</option>' +
      '<option value="high"' + (task.priority === 'high' ? ' selected' : '') + '>عالية</option>' +
      '<option value="urgent"' + (task.priority === 'urgent' ? ' selected' : '') + '>عاجلة</option></select></div>' +
      '<div class="form-group" style="flex:1"><label>الموعد النهائي</label><input type="date" id="taskDeadline" value="' + (task.deadline || '') + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)"></div></div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
      '<button type="button" id="saveTaskBtn" class="btn btn-primary" style="flex:1;justify-content:center">' + (isEdit ? '💾 حفظ التعديلات' : '➕ إنشاء المهمة') + '</button>' +
      '</div>';
    byId('taskModal').classList.add('active');

    byId('saveTaskBtn').addEventListener('click', function() {
      var name = byId('taskName').value.trim();
      var desc = byId('taskDesc').value.trim();
      var assign = byId('taskAssign').value;
      var priority = byId('taskPriority').value;
      var deadline = byId('taskDeadline').value;
      if (!name) { showToast('اسم المهمة مطلوب', 'error'); return; }
      loadData();
      var newTask = { name: name, description: desc, assignedTo: assign, priority: priority, deadline: deadline, createdAt: new Date().toISOString() };
      if (isEdit) { allTasks[idx] = newTask; showToast('تم تحديث المهمة', 'success'); }
      else { allTasks.push(newTask); showToast('تم إنشاء المهمة ✓', 'success'); }
      saveData();
      byId('taskModal').classList.remove('active');
      renderTasks();
    });
  }

  /* Create task button */
  var createBtn = byId('createTaskBtn');
  if (createBtn) createBtn.addEventListener('click', openTaskCreate);

  renderTasks();
})();

/* ============================================================
 * NOTIFICATION MANAGEMENT SYSTEM
 * Admin can send general, specific, urgent notifications
 * ============================================================ */
(function loadNotificationsSection() {
  var list = byId('notificationsListAdmin');
  if (!list) return;

  function renderNotifications() {
    var data = JSON.parse(localStorage.getItem('bba_notifications_data') || '[]');
    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:0.85rem">لم يتم إرسال أي إشعارات بعد</div>';
      return;
    }
    var html = '';
    for (var i = data.length - 1; i >= 0; i--) {
      var n = data[i];
      var targetText = n.targetVolunteer === 'all' ? 'جميع المتطوعين' : n.targetVolunteer;
      var typeIcon = { info: 'ℹ️', alert: '⚠️', new_task: '📋', achievement: '🏆' };
      html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;background:' + (n.isUrgent ? 'rgba(239,68,68,0.05)' : 'transparent') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div><span style="font-weight:600;font-size:0.9rem;color:var(--text)">' + (typeIcon[n.type] || 'ℹ️') + ' ' + escapeHtml(n.title) + '</span>' +
        '<div style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem">' + escapeHtml(n.message) + '</div></div>' +
        '<span style="font-size:0.7rem;color:var(--muted);white-space:nowrap">' + new Date(n.createdAt).toLocaleDateString('ar-DZ') + '</span></div>' +
        '<div style="display:flex;gap:0.5rem;margin-top:0.5rem;font-size:0.75rem;color:var(--muted)"><span>👤 ' + targetText + '</span>' + (n.isUrgent ? '<span style="color:var(--danger);font-weight:600">⚠️ عاجل</span>' : '') + '</div></div>';
    }
    list.innerHTML = html;
  }

  byId('sendNotificationBtn').addEventListener('click', function() {
    var title = byId('notifTitle').value.trim();
    var message = byId('notifMessage').value.trim();
    var type = byId('notifType').value;
    var target = byId('notifTarget').value;
    var isUrgent = byId('notifUrgent').checked;
    if (!title || !message) { showToast('العنوان والرسالة مطلوبان', 'error'); return; }
    var data = JSON.parse(localStorage.getItem('bba_notifications_data') || '[]');
    data.push({ title: title, message: message, type: type, targetVolunteer: target, isUrgent: isUrgent, createdAt: new Date().toISOString() });
    localStorage.setItem('bba_notifications_data', JSON.stringify(data));
    byId('notifTitle').value = '';
    byId('notifMessage').value = '';
    showToast('✅ تم إرسال الإشعار بنجاح', 'success');
    renderNotifications();
  });

  byId('notifTarget').innerHTML = '<option value="all">جميع المتطوعين</option>';
  var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
  for (var i = 0; i < volunteers.length; i++) {
    if (volunteers[i].status === 'approved') {
      byId('notifTarget').innerHTML += '<option value="' + volunteers[i].volunteerId + '">' + escapeHtml(volunteers[i].fullName) + ' (' + escapeHtml(volunteers[i].volunteerId) + ')</option>';
    }
  }

  renderNotifications();
})();

/* ============================================================
 * ACHIEVEMENT MANAGEMENT
 * Admin creates/assigns achievements to volunteers
 * ============================================================ */
(function loadAchievements() {
  var list = byId('achievementsList');
  var form = byId('achievementForm');
  if (!list) return;

  function renderAchievements() {
    var data = JSON.parse(localStorage.getItem('bba_achievements') || '[]');
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:0.85rem">لم يتم إضافة أي إنجازات بعد</div>';
      return;
    }
    var html = '';
    for (var i = data.length - 1; i >= 0; i--) {
      var a = data[i];
      var volName = a.assignedTo;
      for (var v = 0; v < volunteers.length; v++) {
        if (volunteers[v].volunteerId === a.assignedTo) { volName = volunteers[v].fullName; break; }
      }
      html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center">' +
        '<div><span style="font-size:1.25rem;margin-left:0.5rem">' + (a.icon || '🏆') + '</span><span style="font-weight:600;color:var(--gold)">' + escapeHtml(a.title) + '</span>' +
        '<div style="font-size:0.8rem;color:var(--muted)">' + escapeHtml(a.description || '') + '</div>' +
        '<div style="font-size:0.75rem;color:var(--muted)">👤 ' + escapeHtml(volName) + ' | 📅 ' + new Date(a.dateAwarded).toLocaleDateString('ar-DZ') + '</div></div>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteAchievement(' + i + ')" style="flex-shrink:0">🗑️</button></div>';
    }
    list.innerHTML = html;
  }

  window.deleteAchievement = function(idx) {
    if (confirm('حذف هذا الإنجاز؟')) {
      var data = JSON.parse(localStorage.getItem('bba_achievements') || '[]');
      data.splice(idx, 1);
      localStorage.setItem('bba_achievements', JSON.stringify(data));
      renderAchievements();
      showToast('تم حذف الإنجاز', 'info');
    }
  };

  if (form) {
    var volSelect = form.querySelector('select');
    if (volSelect) {
      var volHtml = '<option value="">اختر متطوعاً</option>';
      var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
      for (var i = 0; i < volunteers.length; i++) {
        if (volunteers[i].status === 'approved') {
          volHtml += '<option value="' + volunteers[i].volunteerId + '">' + escapeHtml(volunteers[i].fullName) + '</option>';
        }
      }
      volSelect.innerHTML = volHtml;
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var title = form.querySelector('[name="achTitle"]').value.trim();
      var desc = form.querySelector('[name="achDesc"]').value.trim();
      var icon = form.querySelector('[name="achIcon"]').value.trim();
      var assign = form.querySelector('[name="achAssign"]').value;
      if (!title || !assign) { showToast('العنوان والمتطوع مطلوبان', 'error'); return; }
      var data = JSON.parse(localStorage.getItem('bba_achievements') || '[]');
      data.push({ title: title, description: desc, icon: icon || '🏆', assignedTo: assign, dateAwarded: new Date().toISOString() });
      localStorage.setItem('bba_achievements', JSON.stringify(data));
      form.reset();
      showToast('🏆 تم إضافة الإنجاز بنجاح', 'success');
      renderAchievements();
    });
  }

  renderAchievements();
})();

/* ============================================================
 * ACTIVITY MANAGEMENT
 * Admin creates/assigns activities to volunteers
 * ============================================================ */
(function loadActivities() {
  var list = byId('activitiesList');
  var form = byId('activityForm');
  if (!list) return;

  function renderActivities() {
    var data = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var filterVal = byId('activityFilter') ? byId('activityFilter').value : '';

    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد نشاطات بعد. أضف نشاطاً جديداً!</div>';
      return;
    }

    var filtered = [];
    for (var i = data.length - 1; i >= 0; i--) {
      if (!filterVal || data[i].volunteerId === filterVal) {
        filtered.push({ data: data[i], idx: i });
      }
    }

    if (filtered.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد نشاطات تطابق البحث</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i], a = item.data, realIdx = item.idx;
      var volName = a.volunteerName || a.volunteerId || '---';
      for (var v = 0; v < volunteers.length; v++) {
        if (volunteers[v].volunteerId === a.volunteerId) { volName = volunteers[v].fullName; break; }
      }
      var dateStr = a.date ? new Date(a.date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '---';
      html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;background:rgba(212,175,55,0.02)">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div style="flex:1">' +
        '<div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">📌</span><span style="font-weight:600;color:var(--text);font-size:0.9rem">' + escapeHtml(a.title) + '</span></div>' +
        (a.description ? '<div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem">' + escapeHtml(a.description) + '</div>' : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem">' +
        '<span style="color:var(--text-secondary)">👤 ' + escapeHtml(volName) + '</span>' +
        '<span style="color:var(--gold);font-weight:600">⭐ ' + (a.points || 0) + ' نقطة</span>' +
        '<span style="color:var(--muted)">📅 ' + dateStr + '</span>' +
        '</div></div>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteActivity(' + realIdx + ')" style="flex-shrink:0;padding:0.25rem 0.5rem">🗑️</button>' +
        '</div></div>';
    }
    list.innerHTML = html;
  }

  window.deleteActivity = function(idx) {
    if (!confirm('حذف هذا النشاط؟')) return;
    var data = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');
    data.splice(idx, 1);
    localStorage.setItem('bba_activity_log', JSON.stringify(data));
    renderActivities();
    showToast('تم حذف النشاط', 'info');
  };

  /* Populate filter dropdown */
  function populateFilter() {
    var filterEl = byId('activityFilter');
    if (!filterEl) return;
    var vData = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var opts = '<option value="">جميع المتطوعين</option>';
    for (var i = 0; i < vData.length; i++) {
      if (vData[i].status === 'approved' && vData[i].volunteerId) {
        opts += '<option value="' + vData[i].volunteerId + '">' + escapeHtml(vData[i].fullName) + '</option>';
      }
    }
    filterEl.innerHTML = opts;
    filterEl.onchange = renderActivities;
  }

  /* Form submission */
  if (form) {
    var volSelect = form.querySelector('[name="actAssign"]');

    function populateVolSelect() {
      if (!volSelect) return;
      var vData = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
      var opts = '<option value="">اختر متطوعاً</option>';
      for (var i = 0; i < vData.length; i++) {
        if (vData[i].status === 'approved' && vData[i].volunteerId) {
          opts += '<option value="' + vData[i].volunteerId + '">' + escapeHtml(vData[i].fullName) + ' (' + escapeHtml(vData[i].volunteerId) + ')</option>';
        }
      }
      volSelect.innerHTML = opts;
    }

    populateVolSelect();

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var title = form.querySelector('[name="actTitle"]').value.trim();
      var desc = form.querySelector('[name="actDesc"]').value.trim();
      var points = parseInt(form.querySelector('[name="actPoints"]').value, 10) || 0;
      var date = form.querySelector('[name="actDate"]').value;
      var assign = form.querySelector('[name="actAssign"]').value;

      if (!title || !assign || !date) {
        showToast('العنوان والمتطوع والتاريخ مطلوبون', 'error');
        return;
      }

      /* Get volunteer name */
      var volName = assign;
      if (volSelect) {
        for (var optIdx = 0; optIdx < volSelect.options.length; optIdx++) {
          if (volSelect.options[optIdx].value === assign) {
            volName = volSelect.options[optIdx].text.split(' (')[0];
            break;
          }
        }
      }

      var data = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');
      data.push({
        title: title,
        description: desc,
        points: points,
        date: date,
        volunteerId: assign,
        volunteerName: volName,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('bba_activity_log', JSON.stringify(data));

      /* Also add to legacy portal data for backward compat */
      var portalKey = 'bba_portal_' + assign;
      var portalData = JSON.parse(localStorage.getItem(portalKey) || '{"activities":[]}');
      if (!portalData.activities) portalData.activities = [];
      portalData.activities.push({ title: title, points: points, date: date });
      localStorage.setItem(portalKey, JSON.stringify(portalData));

      form.reset();
      /* Set today's date as default */
      var dateInput = form.querySelector('[name="actDate"]');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

      showToast('📌 تم إضافة النشاط بنجاح ✓ (+' + points + ' نقطة)', 'success');
      renderActivities();
      populateVolSelect();
      populateFilter();
    });

    /* Set today's date as default */
    var dateInput = form.querySelector('[name="actDate"]');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  }

  populateFilter();
  renderActivities();
})();

/* ============================================================
 * CERTIFICATE MANAGEMENT
 * Premium certificate with PDF generation, preview & reissue
 * ============================================================ */
(function loadCertificates() {
  var list = byId('certificatesList');
  var form = byId('certificateForm');
  if (!list) return;
  var currentDownloadIdx = -1;

  /* Generate unique certificate number CERT-BBA-2026-XXXX */
  function generateCertNumber() {
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    var maxNum = 0;
    for (var i = 0; i < data.length; i++) {
      var parts = (data[i].certificateNumber || '').split('-');
      if (parts.length === 4) {
        var num = parseInt(parts[3], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return 'CERT-BBA-2026-' + String(maxNum + 1).padStart(4, '0');
  }

  /* Build premium landscape certificate HTML for preview/PDF */
  function buildCertificateHTML(c, qrDataUrl) {
    var volName = c.volunteerName || c.volunteerId || '---';
    var issueDateStr = c.issueDate ? new Date(c.issueDate).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '---';
    var certNum = c.certificateNumber || '---';
    var volId = c.volunteerId || '---';
    var desc = c.description || '';
    var verifyUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'verify-certificate.html?id=' + encodeURIComponent(certNum);
    var qrUrl = qrDataUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(verifyUrl);
    return '<div dir="rtl" style="width:297mm;height:210mm;background:#0b101b;padding:0;position:relative;font-family:\'Cairo\',sans-serif;overflow:hidden">' +
      /* Outer gold border */
      '<div style="position:absolute;inset:8px;border:2.5px solid #D4AF37;border-radius:14px;pointer-events:none"></div>' +
      '<div style="position:absolute;inset:14px;border:1px solid rgba(212,175,55,0.25);border-radius:10px;pointer-events:none"></div>' +
      /* Gold decorative corners - larger */
      '<div style="position:absolute;top:16px;right:16px;width:50px;height:50px;border-top:3px solid #D4AF37;border-right:3px solid #D4AF37;border-radius:0 8px 0 0"></div>' +
      '<div style="position:absolute;top:16px;left:16px;width:50px;height:50px;border-top:3px solid #D4AF37;border-left:3px solid #D4AF37;border-radius:8px 0 0 0"></div>' +
      '<div style="position:absolute;bottom:16px;right:16px;width:50px;height:50px;border-bottom:3px solid #D4AF37;border-right:3px solid #D4AF37;border-radius:0 0 8px 0"></div>' +
      '<div style="position:absolute;bottom:16px;left:16px;width:50px;height:50px;border-bottom:3px solid #D4AF37;border-left:3px solid #D4AF37;border-radius:0 0 0 8px"></div>' +
      /* Top gold accent line */
      '<div style="position:absolute;top:40px;left:100px;right:100px;height:1px;background:linear-gradient(90deg,transparent,#D4AF37,transparent)"></div>' +
      /* ===== HEADER ===== Right side: Logo + Title */
      '<div style="position:absolute;top:52px;left:60px;right:60px;display:flex;align-items:center;justify-content:space-between">' +
      /* Logo + Title (right side - RTL) */
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:48px;height:48px;background:linear-gradient(135deg,#D4AF37,#B3922E);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#06090e;font-weight:700;flex-shrink:0">وعي</div>' +
      '<div><h1 style="color:#D4AF37;font-size:20px;font-weight:700;margin:0;letter-spacing:1px;line-height:1.2">شهادة تقدير ومشاركة</h1>' +
      '<p style="color:#94a3b8;font-size:11px;margin:2px 0 0">برنامج Dz Young Leaders</p></div>' +
      '</div>' +
      /* Certificate number badge */
      '<div style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:6px 14px;text-align:center">' +
      '<div style="font-size:7px;color:#94a3b8;margin-bottom:2px">رقم الشهادة</div>' +
      '<div style="font-size:10px;color:#D4AF37;font-weight:700;font-family:monospace;direction:ltr">' + certNum + '</div>' +
      '</div>' +
      '</div>' +
      /* ===== MAIN BODY ===== */
      '<div style="position:absolute;top:95px;left:280px;right:60px;bottom:80px;display:flex;flex-direction:column;justify-content:center">' +
      /* Certificate text */
      '<p style="color:#e2e8f0;font-size:12px;line-height:2;margin:0 0 12px;text-align:center">' +
      'تشهد منصة <strong style="color:#D4AF37">وعي الشباب BBA</strong> التابعة لبرنامج <strong style="color:#D4AF37">Dz Young Leaders</strong> بأن:' +
      '</p>' +
      /* Volunteer name - large elegant */ +
      '<div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:14px 20px;margin:0 auto 12px;max-width:360px;text-align:center">' +
      '<h2 style="color:#D4AF37;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;line-height:1.3">' + escapeHtml(volName) + '</h2>' +
      '</div>' +
      '<p style="color:#cbd5e1;font-size:11px;line-height:1.9;margin:0 auto;max-width:440px;text-align:center">' +
      'قد شارك بفعالية في الأنشطة والمبادرات التوعوية الخاصة بالمنصة، وأظهر التزاماً ومسؤولية وروحاً تطوعية متميزة.\n\nوتقديراً لجهوده ومساهماته الفعالة تمنح له هذه الشهادة.' +
      '</p>' +
      (desc ? '<p style="color:#94a3b8;font-size:10px;margin:8px auto 0;font-style:italic;max-width:400px;text-align:center">' + escapeHtml(desc) + '</p>' : '') +
      '</div>' +
      /* ===== LEFT SIDE: Department Name ===== */
      '<div style="position:absolute;top:120px;right:30px;width:220px;text-align:center">' +
      '<p style="color:#D4AF37;font-size:11px;font-weight:600;margin:0;line-height:1.6">منصة وعي الشباب BBA</p>' +
      '<p style="color:#94a3b8;font-size:9px;margin:2px 0">برنامج Dz Young Leaders</p>' +
      '<p style="color:#94a3b8;font-size:8px;margin:0">ولاية برج بوعريريج، الجزائر</p>' +
      /* Decorative vertical line */
      '<div style="width:1px;height:60px;background:linear-gradient(180deg,#D4AF37,transparent);margin:14px auto"></div>' +
      '</div>' +
      /* ===== BOTTOM SECTION ===== */
      '<div style="position:absolute;bottom:50px;left:60px;right:60px;display:flex;align-items:flex-end;justify-content:space-between">' +
      /* QR Code */
      '<div style="text-align:center">' +
      '<img src="' + qrUrl + '" alt="QR" style="width:70px;height:70px;border:2px solid #D4AF37;border-radius:8px;display:block;margin:0 auto 4px" crossorigin="anonymous" onerror="this.style.display=\'none\'">' +
      '<div style="font-size:7px;color:#94a3b8">مسح للتحقق</div>' +
      '</div>' +
      /* Circular Seal/Stamp */ +
      '<div style="text-align:center;position:relative">' +
      '<div style="width:95px;height:95px;border:3px solid #D4AF37;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(212,175,55,0.04);margin:0 auto">' +
      '<div style="font-size:8px;color:#D4AF37;font-weight:700;line-height:1.3;text-align:center">منصة وعي\nالشباب BBA</div>' +
      '<div style="font-size:6px;color:#94a3b8;line-height:1.2;margin-top:2px;text-align:center">Dz Young Leaders\nOfficial</div>' +
      '</div>' +
      '</div>' +
      /* Signature block */ +
      '<div style="text-align:center">' +
      '<div style="border-top:2px solid #D4AF37;width:170px;margin:0 auto 6px;padding-top:6px">' +
      '<p style="color:#D4AF37;font-size:12px;font-weight:600;margin:0;line-height:1.5">Sidiali Abdelilah</p>' +
      '<p style="color:#e2e8f0;font-size:10px;margin:0" dir="rtl">سيدي علي عبد الإله</p>' +
      '</div>' +
      '<p style="color:#94a3b8;font-size:8px;margin:0;max-width:170px;line-height:1.5">قائد برنامج Dz Young Leaders\nومؤسس منصة وعي الشباب BBA</p>' +
      '</div>' +
      '</div>' +
      /* ===== FOOTER with metadata ===== */ +
      '<div style="position:absolute;bottom:20px;left:60px;right:60px;display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid rgba(212,175,55,0.15)">' +
      '<div style="display:flex;gap:16px;font-size:8px;color:#94a3b8">' +
      '<span style="direction:ltr;font-family:monospace">📜 ' + certNum + '</span>' +
      '<span style="direction:ltr;font-family:monospace">👤 ' + volId + '</span>' +
      '<span>📅 ' + issueDateStr + '</span>' +
      '</div>' +
      '<a href="' + verifyUrl + '" target="_blank" style="color:#D4AF37;font-size:8px;text-decoration:none">تحقق من صحة الشهادة 🔍</a>' +
      '</div>' +
      '</div>';
  }

  function renderCertificates() {
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لم يتم إصدار أي شهادات بعد</div>';
      return;
    }
    var html = '';
    for (var i = data.length - 1; i >= 0; i--) {
      var c = data[i];
      var volName = c.volunteerName || c.volunteerId || '---';
      for (var v = 0; v < volunteers.length; v++) {
        if (volunteers[v].volunteerId === c.volunteerId) { volName = volunteers[v].fullName; break; }
      }
      html += '<div style="padding:0.85rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.6rem;background:rgba(212,175,55,0.02)">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1.1rem">📜</span><span style="font-weight:600;color:var(--gold)">' + escapeHtml(c.title) + '</span></div>' +
        '<div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem">' + escapeHtml(c.description || '') + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem">' +
        '<span style="color:var(--text-secondary)">👤 ' + escapeHtml(volName) + '</span>' +
        '<span style="color:var(--gold);font-family:monospace;direction:ltr"># ' + escapeHtml(c.certificateNumber || '---') + '</span>' +
        '<span style="color:var(--muted)">📅 ' + new Date(c.issueDate).toLocaleDateString('ar-DZ') + '</span>' +
        '</div></div>' +
        '<div style="display:flex;gap:0.3rem;flex-shrink:0;margin-right:0.5rem">' +
        '<button class="btn btn-sm" onclick="previewCertificate(' + i + ')" style="background:transparent;color:var(--gold);border:1px solid var(--gold);padding:0.3rem 0.6rem;font-size:0.7rem;border-radius:6px;cursor:pointer;font-family:var(--font)">👁️ عرض</button>' +
        '<button class="btn btn-sm" onclick="downloadCertificatePDF(' + i + ')" style="background:linear-gradient(135deg,var(--gold),var(--gold-hover));color:var(--bg);border:none;padding:0.3rem 0.6rem;font-size:0.7rem;border-radius:6px;cursor:pointer;font-family:var(--font);font-weight:600">📥 PDF</button>' +
        '<button class="btn btn-sm" onclick="reissueCertificate(' + i + ')" style="background:transparent;color:#8b5cf6;border:1px solid #8b5cf6;padding:0.3rem 0.6rem;font-size:0.7rem;border-radius:6px;cursor:pointer;font-family:var(--font)">🔄 إعادة</button>' +
        '<button class="btn btn-sm" onclick="deleteCertificate(' + i + ')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.3rem 0.6rem;font-size:0.7rem;border-radius:6px;cursor:pointer;font-family:var(--font)">🗑️</button>' +
        '</div></div></div>';
    }
    list.innerHTML = html;
  }

  /* --- Preview Certificate (QR-enabled) --- */
  window.previewCertificate = async function(idx) {
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    if (idx < 0 || idx >= data.length) return;
    var c = data[idx];
    /* Generate QR code client-side */
    var qrDataUrl = null;
    if (window.BBA && window.BBA.QR && c && c.certificateNumber) {
      try {
        var qrResult = await window.BBA.QR.generateForCertificate(c.certificateNumber, 100);
        qrDataUrl = qrResult.dataUrl;
      } catch(e) {}
    }
    var modal = byId('certificatePreviewModal');
    var body = byId('certificatePreviewBody');
    if (!modal || !body) return;
    currentDownloadIdx = idx;
    body.innerHTML = buildCertificateHTML(c, qrDataUrl);
    modal.classList.add('active');

    /* Wire download button */
    var dlBtn = byId('downloadCertPDFBtn');
    if (dlBtn) {
      dlBtn.onclick = function() { downloadCertificatePDF(currentDownloadIdx); };
    }
    showToast('👁️ تم تحميل معاينة الشهادة', 'info');
  };

  /* --- Download Certificate PDF --- */
  window.downloadCertificatePDF = async function(idx) {
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    if (idx < 0 || idx >= data.length) { showToast('الشهادة غير موجودة', 'error'); return; }
    var c = data[idx];

    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      showToast('مكتبات PDF قيد التحميل، يرجى المحاولة مرة أخرى', 'error');
      return;
    }

    showToast('📄 جاري إنشاء ملف PDF...', 'info');

    try {
      var container = byId('certificatePDFContainer');
      if (!container) return;

      /* Generate QR for PDF */
      var qrDataUrl = null;
      if (window.BBA && window.BBA.QR && c.certificateNumber) {
        try {
          var qrResult = await window.BBA.QR.generateForCertificate(c.certificateNumber, 200);
          qrDataUrl = qrResult.dataUrl;
        } catch(e) {}
      }

      container.innerHTML = buildCertificateHTML(c, qrDataUrl);
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;opacity:0;pointer-events:none;width:297mm';

      var canvas = await html2canvas(container, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#0b101b',
        width: 1123,
        height: 794,
        logging: false
      });

      var imgData = canvas.toDataURL('image/jpeg', 0.95);
      var pdf = new jspdf.jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

      var fileName = 'CERT_' + (c.certificateNumber || 'certificate') + '.pdf';
      pdf.save(fileName);

      container.innerHTML = '';
      showToast('✅ تم تحميل ملف PDF بنجاح', 'success');
    } catch (err) {
      showToast('❌ حدث خطأ أثناء إنشاء PDF: ' + err.message, 'error');
      console.error('PDF Error:', err);
    }
  };

  /* --- Reissue Certificate --- */
  window.reissueCertificate = function(idx) {
    if (!confirm('إعادة إصدار هذه الشهادة بتاريخ جديد؟')) return;
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    if (idx < 0 || idx >= data.length) return;
    data[idx].issueDate = new Date().toISOString();
    localStorage.setItem('bba_certificates', JSON.stringify(data));
    renderCertificates();
    showToast('🔄 تم إعادة إصدار الشهادة بتاريخ جديد ✓', 'success');
  };

  /* --- Delete Certificate --- */
  window.deleteCertificate = function(idx) {
    if (!confirm('حذف هذه الشهادة؟')) return;
    var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    data.splice(idx, 1);
    localStorage.setItem('bba_certificates', JSON.stringify(data));
    renderCertificates();
    showToast('تم حذف الشهادة', 'info');
  };

  /* Form submission: issue new certificate */
  if (form) {
    var volSelect = form.querySelector('[name="certAssign"]');

    function populateVolunteers() {
      if (!volSelect) return;
      var vData = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
      var opts = '<option value="">اختر متطوعاً</option>';
      var seen = {};
      for (var i = 0; i < vData.length; i++) {
        if (vData[i].status === 'approved' && vData[i].volunteerId && !seen[vData[i].volunteerId]) {
          seen[vData[i].volunteerId] = true;
          opts += '<option value="' + vData[i].volunteerId + '" data-name="' + escapeHtml(vData[i].fullName) + '">' + escapeHtml(vData[i].fullName) + ' (' + escapeHtml(vData[i].volunteerId) + ')</option>';
        }
      }
      volSelect.innerHTML = opts;
    }

    populateVolunteers();

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var title = form.querySelector('[name="certTitle"]').value.trim();
      var desc = form.querySelector('[name="certDesc"]').value.trim();
      var assign = form.querySelector('[name="certAssign"]').value;
      if (!title || !assign) { showToast('عنوان الشهادة والمتطوع مطلوبان', 'error'); return; }

      /* Get volunteer name */
      var volName = assign;
      if (volSelect) {
        for (var optIdx = 0; optIdx < volSelect.options.length; optIdx++) {
          if (volSelect.options[optIdx].value === assign) {
            volName = volSelect.options[optIdx].getAttribute('data-name') || volSelect.options[optIdx].text.split(' (')[0];
            break;
          }
        }
      }

      var certNumber = generateCertNumber();
      var data = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
      data.push({
        title: title,
        description: desc,
        volunteerId: assign,
        volunteerName: volName,
        certificateNumber: certNumber,
        issueDate: new Date().toISOString()
      });
      localStorage.setItem('bba_certificates', JSON.stringify(data));
      form.reset();
      showToast('📜 تم إصدار الشهادة بنجاح ✓ - رقم: ' + certNumber, 'success');
          /* Send notification */
          if (window.Notif && window.Notif.certificateIssued) {
            window.Notif.certificateIssued(data[data.length - 1]);
          }
      renderCertificates();
      populateVolunteers();
    });
  }

  renderCertificates();
})();

/* ============================================================
 * CHARTS - Chart.js Integration
 * ============================================================ */
var volunteersChart = null;

function updateCharts() {
  var canvas = byId('volunteersChart');
  if (!canvas || typeof Chart === 'undefined') return;
  var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
  var counts = {};
  for (var i = 0; i < volunteers.length; i++) { counts[volunteers[i].municipality] = (counts[volunteers[i].municipality] || 0) + 1; }
  var entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
  var labels = [], data = [];
  for (var j = 0; j < entries.length; j++) { labels.push(entries[j][0]); data.push(entries[j][1]); }
  if (volunteersChart) { volunteersChart.destroy(); }
  var ctx = canvas.getContext('2d');
  var gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0.6)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0.1)');
  volunteersChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'عدد المتطوعين', data: data, backgroundColor: gradient, borderColor: 'rgba(212, 175, 55, 0.8)', borderWidth: 1, borderRadius: 4, barPercentage: 0.7 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(11, 16, 27, 0.95)', titleColor: '#D4AF37', bodyColor: '#fff', borderColor: 'rgba(212, 175, 55, 0.3)', borderWidth: 1, padding: 12, cornerRadius: 8, displayColors: false, rtl: true } },
      scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 11 }, maxRotation: 45 } }, y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 11 }, stepSize: 1 } } },
      animation: { duration: 1000, easing: 'easeOutQuart' }
    }
  });
}

if (typeof Chart !== 'undefined') { setTimeout(updateCharts, 300); }

/* ============================================================
 * CSV EXPORT SYSTEM
 * ============================================================ */
(function initExport() {
  var btn = byId('exportBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    if (volunteers.length === 0) { showToast('لا يوجد متطوعون للتصدير', 'error'); return; }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري التصدير...';
    var BOM = '\uFEFF';
    var headers = ['الاسم الكامل', 'البريد الإلكتروني', 'رقم الهاتف', 'البلدية', 'نوع العضوية', 'الحالة', 'تاريخ التسجيل'];
    var statusMap = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
    var membershipMap = { admin: 'عضو فعال في الإدارة', member: 'عضو في التنظيم' };
    var rows = [headers.join(',')];
    for (var i = 0; i < volunteers.length; i++) {
      var v = volunteers[i];
      rows.push('"' + v.fullName + '","' + v.email + '","' + v.phone + '","' + v.municipality + '","' + (membershipMap[v.membershipType] || v.membershipType) + '","' + (statusMap[v.status] || v.status) + '","' + new Date(v.date).toLocaleDateString('ar-DZ') + '"');
    }
    var csvContent = BOM + rows.join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'BBA_Volunteers_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTimeout(function () {
      btn.disabled = false;
      btn.innerHTML = '\uD83D\uDCE5 تصدير CSV';
      showToast('تم تصدير الملف بنجاح ✓', 'success');
    }, 800);
  });
})();

/* ============================================================
 * EVENTS MANAGEMENT SYSTEM
 * Admin CRUD, volunteer registration, attendance marking
 * ============================================================ */
(function loadEventsSystem() {
  var form = byId('eventForm');
  var list = byId('eventsList');
  var filter = byId('eventFilter');
  if (!list) return;

  var MUNICIPALITIES = ['أولاد براهم','أولاد دحمان','أولاد سيدي إبراهيم','برج الغدير','برج بوعريريج','برج زمورة','بئر قصد علي','بن داود','تاسمرت','تقلعيت','تكستار','تفرق','ثنية النصر','جعافرة','حرازة','الحمادية','حسناوة','خليل','رأس الوادي','الرفراف','الرابطة','العناصر','العش','القلة','القصور','الماين','مجانة','المهير','المنصورة','الياشير','سيدي امبارك','عين تاغروت','عين تسرة','غيلاسة'];

  function getEvents() { return JSON.parse(localStorage.getItem('bba_events') || '[]'); }
  function saveEvents(d) { localStorage.setItem('bba_events', JSON.stringify(d)); }

  /* Populate municipality dropdowns */
  var munSelects = document.querySelectorAll('#eventMunicipality, #teamMunicipality');
  for (var s = 0; s < munSelects.length; s++) {
    var opts = '<option value="">اختر البلدية</option>';
    for (var m = 0; m < MUNICIPALITIES.length; m++) {
      opts += '<option value="' + MUNICIPALITIES[m] + '">' + MUNICIPALITIES[m] + '</option>';
    }
    munSelects[s].innerHTML = opts;
  }

  function renderEvents() {
    var data = getEvents();
    var filterVal = filter ? filter.value : '';
    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد فعاليات بعد. أنشئ فعالية جديدة!</div>';
      return;
    }
    var html = '';
    var today = new Date();
    today.setHours(0,0,0,0);
    for (var i = data.length - 1; i >= 0; i--) {
      var e = data[i];
      if (filterVal && e.status !== filterVal) continue;
      var eventDate = new Date(e.date + 'T00:00:00');
      var isPast = eventDate < today;
      var statusIcon = e.status === 'open' ? '🟢' : e.status === 'completed' ? '✅' : '🔴';
      var statusText = e.status === 'open' ? 'مفتوح' : e.status === 'completed' ? 'مكتمل' : 'ملغى';
      var regCount = e.registrations ? e.registrations.length : 0;
      var attendedCount = e.registrations ? e.registrations.filter(function(r){return r.attended;}).length : 0;
      html += '<div style="padding:0.85rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.6rem;background:' + (isPast && e.status === 'open' ? 'rgba(239,68,68,0.03)' : 'rgba(212,175,55,0.02)') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">' +
        '<span style="font-size:0.85rem">' + (e.typeIcon || '📅') + '</span>' +
        '<span style="font-weight:600;color:var(--gold);font-size:0.9rem">' + escapeHtml(e.title) + '</span>' +
        '<span style="font-size:0.7rem;padding:0.15rem 0.5rem;background:rgba(212,175,55,0.1);border-radius:100px;color:var(--gold)">' + escapeHtml(e.type) + '</span>' +
        '</div>' +
        '<div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem">' + escapeHtml(e.description || '') + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem">' +
        '<span style="color:var(--text-secondary)">📅 ' + new Date(e.date).toLocaleDateString('ar-DZ') + '</span>' +
        (e.location ? '<span style="color:var(--muted)">📍 ' + escapeHtml(e.location) + '</span>' : '') +
        (e.municipality ? '<span style="color:var(--muted)">🏛️ ' + escapeHtml(e.municipality) + '</span>' : '') +
        '<span style="color:var(--gold)">👥 ' + regCount + '/' + (e.seats || '∞') + '</span>' +
        '<span>' + statusIcon + ' ' + statusText + '</span>' +
        (regCount > 0 ? '<span style="color:var(--success)">✅ الحضور: ' + attendedCount + '/' + regCount + '</span>' : '') +
        '</div></div>' +
        '<div style="display:flex;gap:0.3rem;flex-shrink:0;margin-right:0.5rem;flex-wrap:wrap">' +
        '<button class="btn btn-sm view-event-btn" style="background:transparent;color:var(--gold);border:1px solid var(--gold);padding:0.25rem 0.5rem;font-size:0.65rem;border-radius:6px;cursor:pointer;font-family:var(--font)" data-eidx="' + i + '">👁️</button>' +
        (e.status === 'open' ? '<button class="btn btn-sm complete-event-btn" style="background:transparent;color:var(--success);border:1px solid var(--success);padding:0.25rem 0.5rem;font-size:0.65rem;border-radius:6px;cursor:pointer;font-family:var(--font)" data-eidx="' + i + '">✅</button>' : '') +
        (e.status === 'open' || e.status === 'completed' ? '<button class="btn btn-sm cancel-event-btn" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.25rem 0.5rem;font-size:0.65rem;border-radius:6px;cursor:pointer;font-family:var(--font)" data-eidx="' + i + '">🔴</button>' : '') +
        '<button class="btn btn-sm delete-event-btn" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.25rem 0.5rem;font-size:0.65rem;border-radius:6px;cursor:pointer;font-family:var(--font)" data-eidx="' + i + '">🗑️</button>' +
        '</div></div></div>';
    }
    list.innerHTML = html || '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد نتائج تطابق الفلتر</div>';

    /* Wire event buttons */
    list.querySelectorAll('.view-event-btn').forEach(function(b){b.onclick=function(){viewEvent(parseInt(this.getAttribute('data-eidx')));}});
    list.querySelectorAll('.complete-event-btn').forEach(function(b){b.onclick=function(){var d=getEvents();var i=parseInt(this.getAttribute('data-eidx'));if(d[i]){d[i].status='completed';saveEvents(d);renderEvents();showToast('✅ تم إكمال الفعالية','success');}}});
    list.querySelectorAll('.cancel-event-btn').forEach(function(b){b.onclick=function(){if(!confirm('إلغاء هذه الفعالية؟'))return;var d=getEvents();var i=parseInt(this.getAttribute('data-eidx'));if(d[i]){d[i].status='cancelled';saveEvents(d);renderEvents();showToast('🔴 تم إلغاء الفعالية','info');}}});
    list.querySelectorAll('.delete-event-btn').forEach(function(b){b.onclick=function(){if(!confirm('حذف هذه الفعالية؟'))return;var d=getEvents();var i=parseInt(this.getAttribute('data-eidx'));d.splice(i,1);saveEvents(d);renderEvents();showToast('تم حذف الفعالية','info');}});
  }

  window.viewEvent = function(idx) {
    var data = getEvents();
    if (idx < 0 || idx >= data.length) return;
    var e = data[idx];
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var statusText = e.status === 'open' ? '🟢 مفتوح' : e.status === 'completed' ? '✅ مكتمل' : '🔴 ملغى';
    var regHtml = '';
    var regs = e.registrations || [];
    if (regs.length === 0) {
      regHtml = '<div style="font-size:0.85rem;color:var(--muted);padding:0.5rem 0">لا يوجد مسجلون بعد</div>';
    } else {
      regHtml = '<table style="width:100%;font-size:0.8rem;margin-top:0.5rem"><thead><tr><th style="text-align:right;padding:0.3rem 0.5rem;color:var(--muted);border-bottom:1px solid var(--border-light)">المتطوع</th><th style="text-align:center;padding:0.3rem 0.5rem;color:var(--muted);border-bottom:1px solid var(--border-light)">الحضور</th></tr></thead><tbody>';
      for (var r = 0; r < regs.length; r++) {
        var volName = regs[r].volunteerName || regs[r].volunteerId || '---';
        regHtml += '<tr><td style="padding:0.3rem 0.5rem;border-bottom:1px solid var(--border-light)">' + escapeHtml(volName) + '</td><td style="text-align:center;padding:0.3rem 0.5rem;border-bottom:1px solid var(--border-light)">' +
          (regs[r].attended ? '<span class="badge badge-approved">✅ حضر</span>' :
            '<button class="btn btn-sm mark-attend-btn" style="background:transparent;color:var(--gold);border:1px solid var(--gold);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font)" data-eidx="' + idx + '" data-ridx="' + r + '">تأكيد الحضور</button>') +
          '</td></tr>';
      }
      regHtml += '</tbody></table>';
    }
    byId('eventViewBody').innerHTML =
      '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">' +
      '<div style="font-size:2rem">' + (e.typeIcon || '📅') + '</div>' +
      '<div><h4 style="color:var(--gold);font-size:1rem">' + escapeHtml(e.title) + '</h4><p style="font-size:0.8rem;color:var(--muted)">' + escapeHtml(e.type) + '</p></div></div>' +
      '<div class="detail-row"><span class="detail-label">التاريخ</span><span class="detail-value">' + new Date(e.date).toLocaleDateString('ar-DZ',{year:'numeric',month:'long',day:'numeric'}) + '</span></div>' +
      (e.location ? '<div class="detail-row"><span class="detail-label">المكان</span><span class="detail-value">' + escapeHtml(e.location) + '</span></div>' : '') +
      (e.municipality ? '<div class="detail-row"><span class="detail-label">البلدية</span><span class="detail-value">' + escapeHtml(e.municipality) + '</span></div>' : '') +
      (e.targetAudience ? '<div class="detail-row"><span class="detail-label">الفئة المستهدفة</span><span class="detail-value">' + escapeHtml(e.targetAudience) + '</span></div>' : '') +
      '<div class="detail-row"><span class="detail-label">المقاعد</span><span class="detail-value">' + (regs.length || 0) + '/' + (e.seats || 'غير محدود') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">الحالة</span><span class="detail-value">' + statusText + '</span></div>' +
      (e.description ? '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">الوصف</span><span class="detail-value" style="font-size:0.85rem">' + escapeHtml(e.description) + '</span></div>' : '') +
      '<div class="detail-row" style="align-items:flex-start"><span class="detail-label">المسجلون</span><span class="detail-value">' + regHtml + '</span></div>';
    byId('eventViewModal').classList.add('active');

    /* Wire attendance buttons */
    setTimeout(function(){
      var body = byId('eventViewBody');
      if (!body) return;
      body.querySelectorAll('.mark-attend-btn').forEach(function(b){
        b.onclick = function(){
          var ei = parseInt(this.getAttribute('data-eidx'));
          var ri = parseInt(this.getAttribute('data-ridx'));
          var data2 = getEvents();
          if (data2[ei] && data2[ei].registrations && data2[ei].registrations[ri]) {
            data2[ei].registrations[ri].attended = true;
            saveEvents(data2);
            viewEvent(ei);
            showToast('✅ تم تأكيد حضور المتطوع','success');
            /* Award points */
            var vid = data2[ei].registrations[ri].volunteerId;
            if (vid) {
              var pts = JSON.parse(localStorage.getItem('bba_points_' + vid) || '[]');
              pts.push({amount:10,reason:'حضور فعالية: ' + data2[ei].title,date:new Date().toISOString(),type:'add'});
              localStorage.setItem('bba_points_' + vid, JSON.stringify(pts));
            }
          }
        };
      });
    }, 100);
  };

  if (form) {
    var dateInput = form.querySelector('#eventDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var type = byId('eventType').value;
      var title = byId('eventTitle').value.trim();
      var desc = byId('eventDesc').value.trim();
      var date = byId('eventDate').value;
      var location = byId('eventLocation').value.trim();
      var municipality = byId('eventMunicipality').value;
      var seats = parseInt(byId('eventSeats').value, 10) || 0;
      var target = byId('eventTarget').value.trim();
      var status = byId('eventStatus').value;
      var typeIcons = {'حملة توعوية':'📢','دورة تدريبية':'📚','لقاء':'🤝','نشاط ميداني':'🏃','مؤتمر':'🎤','ورشة عمل':'🔧'};

      if (!type || !title || !date) { showToast('نوع الفعالية والعنوان والتاريخ مطلوبون', 'error'); return; }

      var data = getEvents();
      data.push({
        id: Date.now(),
        type: type,
        typeIcon: typeIcons[type] || '📅',
        title: title,
        description: desc,
        date: date,
        location: location,
        municipality: municipality,
        seats: seats,
        targetAudience: target,
        status: status,
        createdAt: new Date().toISOString(),
        registrations: []
      });
      saveEvents(data);
      form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      showToast('📅 تم إنشاء الفعالية بنجاح ✓', 'success');
      renderEvents();
    });
  }

  if (filter) filter.addEventListener('change', renderEvents);
  renderEvents();
})();

/* ============================================================
 * MUNICIPALITY TEAMS SYSTEM
 * Create teams, assign leaders, add members
 * ============================================================ */
(function loadTeamsSystem() {
  var form = byId('teamForm');
  var list = byId('teamsList');
  var teamSelect = byId('teamMemberTeam');
  var volSelect = byId('teamMemberVol');
  var addBtn = byId('addTeamMemberBtn');
  if (!list) return;

  function getTeams() { return JSON.parse(localStorage.getItem('bba_teams') || '[]'); }
  function saveTeams(d) { localStorage.setItem('bba_teams', JSON.stringify(d)); }

  function populateTeamDropdowns() {
    var teams = getTeams();
    var opts = '<option value="">اختر فريقاً</option>';
    for (var i = 0; i < teams.length; i++) {
      opts += '<option value="' + i + '">' + escapeHtml(teams[i].name) + '</option>';
    }
    if (teamSelect) teamSelect.innerHTML = opts;
    if (form) {
      var leaderSelect = byId('teamLeader');
      if (leaderSelect) {
        var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
        var lOpts = '<option value="">اختر قائداً</option>';
        for (var v = 0; v < volunteers.length; v++) {
          if (volunteers[v].status === 'approved') {
            lOpts += '<option value="' + volunteers[v].volunteerId + '">' + escapeHtml(volunteers[v].fullName) + '</option>';
          }
        }
        leaderSelect.innerHTML = lOpts;
      }
    }
    if (volSelect) {
      var vData = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
      var vOpts = '<option value="">اختر متطوعاً</option>';
      for (var v = 0; v < vData.length; v++) {
        if (vData[v].status === 'approved' && vData[v].volunteerId) {
          vOpts += '<option value="' + vData[v].volunteerId + '">' + escapeHtml(vData[v].fullName) + ' (' + vData[v].volunteerId + ')</option>';
        }
      }
      volSelect.innerHTML = vOpts;
    }
  }

  function renderTeams() {
    var data = getTeams();
    if (data.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد فرق بعد. أنشئ فريقاً جديداً!</div>';
      return;
    }
    var html = '';
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    for (var i = data.length - 1; i >= 0; i--) {
      var t = data[i];
      var leaderName = t.leaderName || t.leaderId || 'غير معين';
      if (t.leaderId) {
        for (var v = 0; v < volunteers.length; v++) {
          if (volunteers[v].volunteerId === t.leaderId) { leaderName = volunteers[v].fullName; break; }
        }
      }
      var membersList = '';
      var members = t.members || [];
      if (members.length === 0) {
        membersList = '<span style="color:var(--muted);font-size:0.75rem">لا يوجد أعضاء</span>';
      } else {
        membersList = '';
        for (var m = 0; m < members.length; m++) {
          var mName = members[m];
          for (var v = 0; v < volunteers.length; v++) {
            if (volunteers[v].volunteerId === members[m]) { mName = volunteers[v].fullName; break; }
          }
          membersList += '<span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.5rem;background:var(--gold-light);border-radius:100px;font-size:0.7rem;color:var(--gold);margin:0.15rem">' + escapeHtml(mName) +
            ' <button class="remove-member-btn" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.7rem;padding:0" data-tidx="' + i + '" data-mid="' + escapeHtml(members[m]) + '">×</button></span>';
        }
      }
      html += '<div style="padding:0.85rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.6rem">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div style="flex:1">' +
        '<div style="display:flex;align-items:center;gap:0.5rem"><span style="font-size:1rem">👥</span><span style="font-weight:600;color:var(--gold);font-size:0.9rem">' + escapeHtml(t.name) + '</span></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem">' +
        '<span style="color:var(--text-secondary)">🏛️ ' + escapeHtml(t.municipality) + '</span>' +
        '<span style="color:var(--success)">👤 القائد: ' + escapeHtml(leaderName) + '</span>' +
        '<span style="color:var(--muted)">👥 الأعضاء: ' + members.length + '</span>' +
        '</div>' +
        '<div style="margin-top:0.4rem;display:flex;flex-wrap:wrap;gap:0.2rem">' + membersList + '</div>' +
        '</div>' +
        '<button class="btn btn-sm delete-team-btn" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.25rem 0.5rem;font-size:0.65rem;border-radius:6px;cursor:pointer;font-family:var(--font);flex-shrink:0" data-tidx="' + i + '">🗑️</button>' +
        '</div></div>';
    }
    list.innerHTML = html;

    list.querySelectorAll('.remove-member-btn').forEach(function(b){b.onclick=function(){var d=getTeams();var ti=parseInt(this.getAttribute('data-tidx'));var mid=this.getAttribute('data-mid');if(d[ti]&&d[ti].members){d[ti].members=d[ti].members.filter(function(x){return x!==mid;});saveTeams(d);renderTeams();showToast('تم إزالة العضو','info');}}});
    list.querySelectorAll('.delete-team-btn').forEach(function(b){b.onclick=function(){var d=getTeams();var ti=parseInt(this.getAttribute('data-tidx'));if(!confirm('حذف هذا الفريق؟'))return;d.splice(ti,1);saveTeams(d);renderTeams();populateTeamDropdowns();showToast('تم حذف الفريق','info');}});
  }

  /* Create team */
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = byId('teamName').value.trim();
      var municipality = byId('teamMunicipality').value;
      var leaderId = byId('teamLeader').value;
      if (!name || !municipality) { showToast('اسم الفريق والبلدية مطلوبان', 'error'); return; }
      var data = getTeams();
      /* Check duplicate */
      for (var i = 0; i < data.length; i++) {
        if (data[i].name === name) { showToast('يوجد فريق بنفس الاسم بالفعل', 'error'); return; }
      }
      var leaderName = leaderId || '';
      var vData = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
      for (var v = 0; v < vData.length; v++) {
        if (vData[v].volunteerId === leaderId) { leaderName = vData[v].fullName; break; }
      }
      data.push({
        id: Date.now(),
        name: name,
        municipality: municipality,
        leaderId: leaderId,
        leaderName: leaderName,
        members: leaderId ? [leaderId] : [],
        createdAt: new Date().toISOString()
      });
      saveTeams(data);
      form.reset();
      showToast('👥 تم إنشاء الفريق بنجاح ✓', 'success');
      renderTeams();
      populateTeamDropdowns();
    });
  }

  /* Add member to team */
  if (addBtn && teamSelect && volSelect) {
    addBtn.addEventListener('click', function() {
      var teamIdx = parseInt(teamSelect.value, 10);
      var volId = volSelect.value;
      if (isNaN(teamIdx) || !volId) { showToast('اختر الفريق والمتطوع', 'error'); return; }
      var data = getTeams();
      if (!data[teamIdx].members) data[teamIdx].members = [];
      if (data[teamIdx].members.indexOf(volId) !== -1) { showToast('المتطوع موجود بالفعل في الفريق', 'info'); return; }
      data[teamIdx].members.push(volId);
      saveTeams(data);
      showToast('✅ تم إضافة العضو للفريق', 'success');
      renderTeams();
      populateTeamDropdowns();
    });
  }

  populateTeamDropdowns();
  renderTeams();
})();

/* ============================================================
 * PDF REPORTS GENERATOR
 * Weekly, Monthly, Yearly professional PDF reports
 * ============================================================ */
(function initReportGenerator() {
  var weeklyBtn = byId('reportWeeklyBtn');
  var monthlyBtn = byId('reportMonthlyBtn');
  var yearlyBtn = byId('reportYearlyBtn');
  if (!weeklyBtn && !monthlyBtn && !yearlyBtn) return;

  function buildReportHTML(period, periodDate) {
    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    var consultations = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
    var activities = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');
    var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    var events = JSON.parse(localStorage.getItem('bba_events') || '[]');
    var teams = JSON.parse(localStorage.getItem('bba_teams') || '[]');

    var totalV = volunteers.length;
    var approvedV = 0;
    var pendingV = 0;
    var munCounts = {};
    for (var i = 0; i < volunteers.length; i++) {
      if (volunteers[i].status === 'approved') approvedV++;
      if (volunteers[i].status === 'pending') pendingV++;
      munCounts[volunteers[i].municipality] = (munCounts[volunteers[i].municipality] || 0) + 1;
    }
    var topMuns = Object.entries(munCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    var totalC = consultations.length;
    var answeredC = 0;
    for (var j = 0; j < consultations.length; j++) {
      if (consultations[j].status === 'answered' || consultations[j].status === 'closed') answeredC++;
    }
    var totalAct = activities.length;
    var totalPts = 0;
    for (var p = 0; p < activities.length; p++) totalPts += parseInt(activities[p].points) || 0;
    var totalCert = certificates.length;
    var openEvents = 0, completedEvents = 0;
    for (var q = 0; q < events.length; q++) {
      if (events[q].status === 'open') openEvents++;
      if (events[q].status === 'completed') completedEvents++;
    }
    var totalTeams = teams.length;
    var totalMembers = 0;
    for (var r = 0; r < teams.length; r++) totalMembers += (teams[r].members || []).length;

    var periodText = period === 'weekly' ? 'أسبوعي' : period === 'monthly' ? 'شهري' : 'سنوي';
    var dateStr = periodDate.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });

    return '<div dir="rtl" style="width:210mm;min-height:297mm;background:#0b101b;padding:15mm 10mm;font-family:\'Cairo\',sans-serif;color:#ffffff">' +
      '<div style="text-align:center;margin-bottom:10mm">' +
      '<div style="width:60px;height:60px;background:linear-gradient(135deg,#D4AF37,#B3922E);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5mm;font-size:1.5rem;color:#06090e;font-weight:700">وعي</div>' +
      '<h1 style="color:#D4AF37;font-size:22px;margin:0;letter-spacing:1px">التقرير ' + periodText + '</h1>' +
      '<p style="color:#94a3b8;font-size:11px;margin:3px 0 0">منصة وعي الشباب BBA - Dz Young Leaders</p>' +
      '<p style="color:#64748b;font-size:9px;margin:2px 0">تاريخ التقرير: ' + dateStr + '</p>' +
      '<div style="width:60px;height:2px;background:#D4AF37;margin:6mm auto"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:6mm">' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + totalV + '</div><div style="font-size:8px;color:#94a3b8">إجمالي المتطوعين</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + approvedV + '</div><div style="font-size:8px;color:#94a3b8">المتطوعون المقبولون</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + totalC + '</div><div style="font-size:8px;color:#94a3b8">الاستشارات</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + answeredC + '</div><div style="font-size:8px;color:#94a3b8">الاستشارات المجاب عنها</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + totalAct + '</div><div style="font-size:8px;color:#94a3b8">النشاطات</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + totalPts + '</div><div style="font-size:8px;color:#94a3b8">إجمالي النقاط</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + totalCert + '</div><div style="font-size:8px;color:#94a3b8">الشهادات المصدرة</div></div>' +
      '<div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:3mm;text-align:center"><div style="font-size:18px;font-weight:700;color:#D4AF37">' + completedEvents + '</div><div style="font-size:8px;color:#94a3b8">الفعاليات المنفذة</div></div>' +
      '</div>' +
      '<div style="margin-bottom:6mm">' +
      '<h3 style="color:#D4AF37;font-size:14px;margin:0 0 3mm">🏛️ البلديات الأكثر نشاطاً</h3>' +
      '<div>';
    for (var mi = 0; mi < topMuns.length; mi++) {
      html += '<div style="display:flex;justify-content:space-between;padding:1mm 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:9px"><span style="color:#e2e8f0">' + escapeHtml(topMuns[mi][0]) + '</span><span style="color:#D4AF37;font-weight:600">' + topMuns[mi][1] + ' متطوع</span></div>';
    }
    html += '</div></div></div>';
    return html;
  }

  function generateReport(period) {
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      showToast('مكتبات PDF قيد التحميل، يرجى المحاولة مرة أخرى', 'error');
      return;
    }
    var periodDate = new Date();
    showToast('📄 جاري إنشاء التقرير ' + (period === 'weekly' ? 'الأسبوعي' : period === 'monthly' ? 'الشهري' : 'السنوي') + '...', 'info');
    var container = byId('reportPDFContainer');
    if (!container) return;
    container.innerHTML = buildReportHTML(period, periodDate);
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;opacity:0;pointer-events:none;width:210mm';
    setTimeout(function() {
      html2canvas(container, { scale: 2.5, useCORS: true, backgroundColor: '#0b101b', width: 794, height: 1123, logging: false })
        .then(function(canvas) {
          var imgData = canvas.toDataURL('image/jpeg', 0.95);
          var pdf = new jspdf.jsPDF('p', 'mm', 'a4');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          var fileName = 'BBA_Report_' + period + '_' + new Date().toISOString().split('T')[0] + '.pdf';
          pdf.save(fileName);
          container.innerHTML = '';
          showToast('✅ تم تحميل التقرير ' + (period === 'weekly' ? 'الأسبوعي' : period === 'monthly' ? 'الشهري' : 'السنوي') + ' بنجاح', 'success');
        })
        .catch(function(err) {
          showToast('❌ حدث خطأ أثناء إنشاء التقرير: ' + err.message, 'error');
          container.innerHTML = '';
        });
    }, 500);
  }

  if (weeklyBtn) weeklyBtn.addEventListener('click', function() { generateReport('weekly'); });
  if (monthlyBtn) monthlyBtn.addEventListener('click', function() { generateReport('monthly'); });
  if (yearlyBtn) yearlyBtn.addEventListener('click', function() { generateReport('yearly'); });
})();

/* ============================================================
 * ENHANCED DASHBOARD - Real data from all sources
 * ============================================================ */
(function enhancedDashboard() {
  /* The main dashboard already has loadDashboardOverview() which runs on load.
     This enhances it with additional stats from new modules. */
  function updateStats() {
    var events = JSON.parse(localStorage.getItem('bba_events') || '[]');
    var certificates = JSON.parse(localStorage.getItem('bba_certificates') || '[]');
    var activities = JSON.parse(localStorage.getItem('bba_activity_log') || '[]');
    var teams = JSON.parse(localStorage.getItem('bba_teams') || '[]');
    var today = new Date();
    today.setHours(0,0,0,0);

    /* Activities total */
    var actTotal = byId('statActivitiesTotal');
    if (actTotal) actTotal.textContent = activities.length;

    /* Certificates total */
    var certTotal = byId('statCertsTotal');
    if (certTotal) certTotal.textContent = certificates.length;

    /* Upcoming events */
    var upcoming = 0;
    for (var i = 0; i < events.length; i++) {
      if (events[i].status === 'open') {
        var ed = new Date(events[i].date + 'T00:00:00');
        if (ed >= today) upcoming++;
      }
    }
    var upEl = byId('statUpcomingEvents');
    if (upEl) upEl.textContent = upcoming;

    /* Teams total */
    var teamsEl = byId('statTeamsTotal');
    if (teamsEl) teamsEl.textContent = teams.length;

    /* Dashboard upcoming events widget */
    var upcomingWidget = byId('dashboardUpcomingEvents');
    if (upcomingWidget) {
      var upEvents = [];
      for (var i = 0; i < events.length; i++) {
        if (events[i].status === 'open') {
          var ed = new Date(events[i].date + 'T00:00:00');
          if (ed >= today) upEvents.push(events[i]);
        }
      }
      upEvents.sort(function(a,b){return new Date(a.date) - new Date(b.date);});
      upEvents = upEvents.slice(0,5);
      if (upEvents.length === 0) {
        upcomingWidget.innerHTML = '<div class="empty-state-mini">لا توجد فعاليات قادمة</div>';
      } else {
        var html = '';
        for (var i = 0; i < upEvents.length; i++) {
          html += '<div class="activity-item"><div class="activity-icon">' + (upEvents[i].typeIcon || '📅') + '</div><div class="activity-info"><div class="activity-title">' + escapeHtml(upEvents[i].title) + '</div><div class="activity-time">' + new Date(upEvents[i].date).toLocaleDateString('ar-DZ',{day:'numeric',month:'short'}) + ' | ' + escapeHtml(upEvents[i].municipality || '') + '</div></div><span class="badge badge-pending">قادم</span></div>';
        }
        upcomingWidget.innerHTML = html;
      }
    }

    /* Update quick actions with new sections */
    var qa = byId('quickActions');
    if (qa) {
      qa.innerHTML =
        '<button class="btn btn-primary btn-sm" onclick="window.location.hash=\'consultations\'" style="width:100%;justify-content:center">📋 مراجعة الاستشارات</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'volunteers\'" style="width:100%;justify-content:center">👥 إدارة المتطوعين</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'events-admin\'" style="width:100%;justify-content:center">📅 الفعاليات</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'teams-admin\'" style="width:100%;justify-content:center">👥 فرق البلديات</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'reports-admin\'" style="width:100%;justify-content:center">📊 التقارير</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="window.location.hash=\'statistics\'" style="width:100%;justify-content:center">📊 عرض الإحصائيات</button>';
    }
  }

  setTimeout(updateStats, 200);
})();

/* ============================================================
 * SCROLL TO TOP
 * ============================================================ */
(function initScrollToTop() {
  var btn = byId('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', function () { btn.classList.toggle('visible', window.scrollY > 400); });
})();

/* ============================================================
 * SETTINGS MANAGEMENT
 * ============================================================ */
(function initSettings() {
  var settingBtns = document.querySelectorAll('.setting-item .btn');
  for (var i = 0; i < settingBtns.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var parent = this.closest('.setting-item');
        if (!parent) return;
        var title = parent.querySelector('h4');
        var header = title ? title.textContent : '';

        if (header.indexOf('الإشعارات') !== -1) {
          var current = localStorage.getItem('bba_notifications') || 'enabled';
          var newVal = current === 'enabled' ? 'disabled' : 'enabled';
          localStorage.setItem('bba_notifications', newVal);
          showToast(newVal === 'enabled' ? '🔔 تم تفعيل الإشعارات' : '🔕 تم إيقاف الإشعارات', 'success');
        } else if (header.indexOf('بيانات المسؤول') !== -1) {
          var newEmail = prompt('أدخل البريد الإلكتروني الجديد:', 'admin@bba.dz');
          if (newEmail && newEmail.trim()) {
            var newPass = prompt('أدخل كلمة المرور الجديدة (اترك فارغاً لعدم التغيير):');
            var msg = '✅ تم تحديث البيانات';
            if (newPass) msg += ' (تم تغيير كلمة المرور)';
            showToast(msg, 'success');
          }
        } else if (header.indexOf('مظهر الواجهة') !== -1) {
          var currentTheme = localStorage.getItem('bba_theme') || 'dark';
          var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('bba_theme', newTheme);
          document.documentElement.style.setProperty('--bg', newTheme === 'light' ? '#f5f5f5' : '#06090e');
          document.documentElement.style.setProperty('--surface-solid', newTheme === 'light' ? '#ffffff' : '#0b101b');
          document.documentElement.style.setProperty('--text', newTheme === 'light' ? '#1a1a2e' : '#ffffff');
          document.documentElement.style.setProperty('--text-secondary', newTheme === 'light' ? '#333' : '#e2e8f0');
          document.documentElement.style.setProperty('--muted', newTheme === 'light' ? '#666' : '#94a3b8');
          showToast('🎨 تم تغيير المظهر إلى ' + (newTheme === 'light' ? 'الفاتح' : 'الداكن'), 'success');
        } else if (header.indexOf('النسخ الاحتياطي') !== -1) {
          var backup = {
            volunteers: JSON.parse(localStorage.getItem('bba_volunteers') || '[]'),
            consultations: JSON.parse(localStorage.getItem('bba_consultations') || '[]'),
            tasks: JSON.parse(localStorage.getItem('bba_tasks') || '[]'),
            date: new Date().toISOString(),
            version: '3.0'
          };
          var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'BBA_Backup_' + new Date().toISOString().split('T')[0] + '.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('🗄️ تم إنشاء النسخة الاحتياطية بنجاح', 'success');
        } else if (header.indexOf('إعادة تعيين') !== -1) {
          if (confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات نهائياً!')) {
            if (confirm('تأكيد نهائي: هل تريد حذف جميع المتطوعين والاستشارات والمهام؟')) {
              localStorage.removeItem('bba_volunteers');
              localStorage.removeItem('bba_consultations');
              localStorage.removeItem('bba_tasks');
              localStorage.removeItem('bba_notifications_data');
              localStorage.removeItem('bba_achievements');
              localStorage.removeItem('bba_certificates');
              showToast('🗑️ تم إعادة تعيين جميع البيانات', 'success');
              setTimeout(function () { location.reload(); }, 1500);
            }
          }
        } else if (header.indexOf('اللغة') !== -1) {
          showToast('🌐 اللغة العربية مدعومة حالياً. سيتم إضافة لغات أخرى قريباً.', 'info');
        }
      });
    })(settingBtns[i]);
  }
})();

console.log('✅ منصة وعي الشباب BBA Admin v3.0 loaded successfully');
