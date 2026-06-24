/* ============================================================
 * CLUB DATA EXTENSION
 * ============================================================ */

(function() {
  function escapeHtml(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  var savedCMS = window.CMS;
  if (!savedCMS) return;

  /* --- Club Data UI --- */
  function renderClubForm() {
    var form = byId('cmsClubForm');
    var list = byId('cmsClubActivities');
    if (!form || !list) return;

    var data = JSON.parse(localStorage.getItem('bba_cms_club_data') || 'null');
    if (!data) {
      data = {
        name: 'نادي وعي الشباب BBA',
        description: 'نادي شبابي يهدف إلى نشر الوعي بمخاطر المخدرات والمؤثرات العقلية وتعزيز الصحة النفسية لدى الشباب في ولاية برج بوعريريج.',
        vision: 'نحو جيل واعٍ ومتمكن، خالٍ من المخدرات، قادر على المساهمة الفاعلة في بناء مجتمعه.',
        membersCount: 0,
        registrationOpen: true,
        published: true,
        activities: [],
        schedule: []
      };
      localStorage.setItem('bba_cms_club_data', JSON.stringify(data));
    }

    form.innerHTML =
      '<div class="form-group"><label>اسم النادي</label><input type="text" id="clubName" value="' + escapeHtml(data.name || '') + '" class="cms-input"></div>' +
      '<div class="form-group"><label>الوصف</label><textarea id="clubDesc" class="cms-input" style="min-height:80px">' + escapeHtml(data.description || '') + '</textarea></div>' +
      '<div class="form-group"><label>الرؤية</label><textarea id="clubVision" class="cms-input" style="min-height:80px">' + escapeHtml(data.vision || '') + '</textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>عدد الأعضاء</label><input type="number" id="clubMembers" value="' + (data.membersCount || 0) + '" class="cms-input" min="0"></div>' +
      '<div class="form-group"><label>التسجيل مفتوح</label><select id="clubRegOpen" class="cms-input"><option value="true"' + (data.registrationOpen !== false ? ' selected' : '') + '>نعم</option><option value="false"' + (data.registrationOpen === false ? ' selected' : '') + '>لا</option></select></div>' +
      '</div>' +
      '<button type="button" id="cmsSaveClubBtn" class="btn btn-primary" style="width:100%;justify-content:center">💾 حفظ بيانات النادي</button>';

    byId('cmsSaveClubBtn').addEventListener('click', function() {
      var newData = {
        name: byId('clubName').value.trim(),
        description: byId('clubDesc').value.trim(),
        vision: byId('clubVision').value.trim(),
        membersCount: parseInt(byId('clubMembers').value, 10) || 0,
        registrationOpen: byId('clubRegOpen').value === 'true',
        published: true,
        activities: data.activities || [],
        schedule: data.schedule || []
      };
      localStorage.setItem('bba_cms_club_data', JSON.stringify(newData));
      data = newData;
      showToast('✅ تم حفظ بيانات النادي', 'success');
    });

    /* Activities sub-section */
    var actHtml = '<hr style="border-color:var(--border-light);margin:1.5rem 0"><h4 style="font-size:0.9rem;color:var(--gold);margin-bottom:0.75rem">📋 نشاطات النادي</h4>' +
      '<div style="display:flex;gap:0.5rem;margin-bottom:1rem">' +
      '<input type="text" id="clubActTitle" class="cms-input" placeholder="عنوان النشاط" style="flex:2">' +
      '<input type="date" id="clubActDate" class="cms-input" style="flex:1">' +
      '<button type="button" id="clubAddActBtn" class="btn btn-primary btn-sm" style="flex-shrink:0">➕</button></div>' +
      '<div id="cmsClubActivitiesList"></div>';

    form.innerHTML += actHtml;

    function renderClubActivities() {
      var acts = (data.activities || []).slice().reverse();
      if (acts.length === 0) {
        byId('cmsClubActivitiesList').innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:1rem">لا توجد نشاطات بعد</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < acts.length; i++) {
        var a = acts[i];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.35rem">' +
          '<div><div style="font-size:0.82rem;color:var(--text)">' + escapeHtml(a.title) + '</div><div style="font-size:0.7rem;color:var(--muted)">📅 ' + (a.date || '') + '</div></div>' +
          '<button class="btn btn-sm" onclick="deleteClubActivity(' + i + ')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.15rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer">🗑️</button></div>';
      }
      byId('cmsClubActivitiesList').innerHTML = html;
    }

    byId('clubAddActBtn').addEventListener('click', function() {
      var title = byId('clubActTitle').value.trim();
      var date = byId('clubActDate').value;
      if (!title) { showToast('عنوان النشاط مطلوب', 'error'); return; }
      data.activities = data.activities || [];
      data.activities.push({ title: title, date: date || new Date().toISOString().split('T')[0] });
      localStorage.setItem('bba_cms_club_data', JSON.stringify(data));
      byId('clubActTitle').value = '';
      byId('clubActDate').value = '';
      renderClubActivities();
      showToast('✅ تم إضافة النشاط', 'success');
    });

    window.deleteClubActivity = function(idx) {
      data.activities = data.activities || [];
      var realIdx = data.activities.length - 1 - idx;
      data.activities.splice(realIdx, 1);
      localStorage.setItem('bba_cms_club_data', JSON.stringify(data));
      renderClubActivities();
      showToast('تم حذف النشاط', 'info');
    };

    renderClubActivities();
  }

  /* Mount club form when DOM is ready */
  var checkClub = setInterval(function() {
    if (byId('cmsClubForm')) {
      clearInterval(checkClub);
      renderClubForm();
    }
  }, 200);
  setTimeout(function() { clearInterval(checkClub); }, 5000);

  /* Re-render when section becomes active */
  var clubObserver = new MutationObserver(function() {
    var clubSection = byId('cms-club');
    if (clubSection && clubSection.classList.contains('active') && byId('cmsClubForm')) {
      renderClubForm();
    }
  });
  var allSections = document.querySelectorAll('.admin-section');
  for (var i = 0; i < allSections.length; i++) {
    clubObserver.observe(allSections[i], { attributes: true, attributeFilter: ['class'] });
  }
})();
