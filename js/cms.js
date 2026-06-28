/* ============================================================
   منصة وعي الشباب BBA — Central CMS Module
   Manages ALL public page content: hero, stats, testimonials,
   FAQ, partners, gallery, videos, library, surveys, rehab,
   navigation, footer, social, club, articles, announcements,
   calendar, about, team members, activities CMS, SEO, global.
   All data in localStorage under 'bba_cms_*' keys.
   Exposes window.CMS for all public pages.
   ============================================================ */

(function centralCMS() {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function esc(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function cmsGet(key, defaultVal) {
    try { return JSON.parse(localStorage.getItem('bba_cms_' + key) || JSON.stringify(defaultVal)); }
    catch(e) { return defaultVal; }
  }
  function cmsSet(key, data) { localStorage.setItem('bba_cms_' + key, JSON.stringify(data)); }

  /* ============================================================
   * CMS API
   * ============================================================ */
  var CMS = {};

  /* ----- Hero ----- */
  CMS.getHero = function() { return cmsGet('hero', { badge: '', title: '', subtitle: '', buttons: [] }); };
  CMS.saveHero = function(d) { cmsSet('hero', d); };

  /* ----- Notice Bar ----- */
  CMS.getNoticeBar = function() { return cmsGet('notice_bar', { text: '', visible: false, priority: 'info' }); };
  CMS.saveNoticeBar = function(d) { cmsSet('notice_bar', d); };

  /* ----- Testimonials ----- */
  CMS.getTestimonials = function() { return cmsGet('testimonials', []); };
  CMS.saveTestimonials = function(d) { cmsSet('testimonials', d); };

  /* ----- Homepage Statistics ----- */
  CMS.getStats = function() { return cmsGet('stats', [
    { label: 'المتطوعون', value: '500+', icon: '👥' },
    { label: 'المستفيدون', value: '10,000+', icon: '🎯' },
    { label: 'الأنشطة', value: '120+', icon: '📋' },
    { label: 'الشركاء', value: '30+', icon: '🤝' }
  ]); };
  CMS.saveStats = function(d) { cmsSet('stats', d); };

  /* ----- Homepage CTA ----- */
  CMS.getCta = function() { return cmsGet('cta', {
    title: 'انضم إلينا اليوم', subtitle: 'كن جزءًا من التغيير', btnText: 'سجل الآن', btnLink: 'index.html#contact'
  }); };
  CMS.saveCta = function(d) { cmsSet('cta', d); };

  /* ----- FAQ ----- */
  CMS.getFaq = function() { return cmsGet('faq', []); };
  CMS.saveFaq = function(d) { cmsSet('faq', d); };

  /* ----- Partners ----- */
  CMS.getPartners = function() { return cmsGet('partners', []); };
  CMS.savePartners = function(d) { cmsSet('partners', d); };

  /* ----- Gallery ----- */
  CMS.getGallery = function() { return cmsGet('gallery', []); };
  CMS.saveGallery = function(d) { cmsSet('gallery', d); };

  /* ----- Videos ----- */
  CMS.getVideos = function() { return cmsGet('videos', []); };
  CMS.saveVideos = function(d) { cmsSet('videos', d); };

  /* ----- Library ----- */
  CMS.getLibrary = function() { return cmsGet('library', []); };
  CMS.saveLibrary = function(d) { cmsSet('library', d); };

  /* ----- Surveys ----- */
  CMS.getSurveys = function() { return cmsGet('surveys', []); };
  CMS.saveSurveys = function(d) { cmsSet('surveys', d); };

  /* ----- Rehabilitation ----- */
  CMS.getRehabilitation = function() { return cmsGet('rehabilitation', []); };
  CMS.saveRehabilitation = function(d) { cmsSet('rehabilitation', d); };

  /* ----- Achievements Page ----- */
  CMS.getAchievementsPage = function() { return cmsGet('achievements_page', { title: '', items: [] }); };
  CMS.saveAchievementsPage = function(d) { cmsSet('achievements_page', d); };

  /* ----- Articles ----- */
  CMS.getArticles = function() { return cmsGet('articles', []); };
  CMS.saveArticles = function(d) { cmsSet('articles', d); };

  /* ----- Announcements ----- */
  CMS.getAnnouncements = function() { return cmsGet('announcements', []); };
  CMS.saveAnnouncements = function(d) { cmsSet('announcements', d); };

  /* ----- Calendar Events ----- */
  CMS.getCalendarEvents = function() { return cmsGet('calendar', []); };
  CMS.saveCalendarEvents = function(d) { cmsSet('calendar', d); };

  /* ----- Navigation ----- */
  CMS.getNavigation = function() {
    return cmsGet('navigation', {
      logoText: 'منصة وعي الشباب BBA',
      items: [
        { label: 'الرئيسية', href: 'index.html', visible: true },
        { label: 'عن المشروع', href: 'about.html', visible: true },
        { label: 'الفئة المستهدفة', href: 'target-audience.html', visible: true },
        { label: 'نادي الشباب', href: 'club.html', visible: true },
        { label: 'النشاطات', href: 'activities.html', visible: true },
        { label: 'الأكاديمية', href: 'academy.html', visible: true },
        { label: 'المركز الإعلامي', href: 'media-center.html', visible: true },
        { label: 'الشركاء', href: 'partners.html', visible: true },
        { label: 'DZ Leaders', href: 'dz-young-leaders.html', visible: true },
        { label: 'فريق العمل', href: 'team.html', visible: true },
        { label: 'الإنجازات', href: 'achievements.html', visible: true },
        { label: 'تواصل', href: 'index.html#contact', visible: true }
      ],
      mobileItems: [
        { label: 'الرئيسية', href: 'index.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', visible: true }
      ]
    });
  };
  CMS.saveNavigation = function(d) { cmsSet('navigation', d); };

  /* ----- Footer ----- */
  CMS.getFooter = function() {
    return cmsGet('footer', {
      copyright: '© 2026 منصة وعي الشباب BBA',
      sponsor: 'تحت إشراف برنامج Dz Young Leaders',
      links: [
        { label: '📖 عن المشروع', href: 'about.html', visible: true },
        { label: '👥 فريق العمل', href: 'team.html', visible: true },
        { label: '🤝 الشركاء', href: 'partners.html', visible: true },
        { label: '📺 المركز الإعلامي', href: 'media-center.html', visible: true },
        { label: '🎓 الأكاديمية', href: 'academy.html', visible: true },
        { label: '👤 بوابة المتطوعين', href: 'portal.html', visible: true },
        { label: '✅ التحقق من الشهادات', href: 'verify-certificate.html', visible: true }
      ]
    });
  };
  CMS.saveFooter = function(d) { cmsSet('footer', d); };

  /* ----- Social Media ----- */
  CMS.getSocial = function() {
    return cmsGet('social', {
      email: 'contact@bba.dz', phone: '+213 XXX XX XX XX',
      facebook: 'https://facebook.com/bba.wa3y', instagram: 'https://instagram.com/bba.wa3y',
      twitter: 'https://twitter.com/bba_wa3y', youtube: 'https://youtube.com/@bba.wa3y',
      address: 'برج بوعريريج، الجزائر'
    });
  };
  CMS.saveSocial = function(d) { cmsSet('social', d); };

  /* ----- Club Data ----- */ /* Administered via cms_club.js */
  CMS.getClubData = function() {
    try { return JSON.parse(localStorage.getItem('bba_cms_club_data') || 'null') || {}; }
    catch(e) { return {}; }
  };
  CMS.saveClubData = function(d) { localStorage.setItem('bba_cms_club_data', JSON.stringify(d)); };

  /* ----- About Section ----- */
  CMS.getAbout = function() {
    return cmsGet('about', {
      title: 'عن المشروع', subtitle: 'منصة وعي الشباب BBA',
      content: 'منصة شبابية تهدف إلى نشر الوعي بمخاطر المخدرات والمؤثرات العقلية...',
      vision: 'نحو جيل واعٍ خالٍ من المخدرات', mission: 'تمكين الشباب بالمعرفة والمهارات',
      image: ''
    });
  };
  CMS.saveAbout = function(d) { cmsSet('about', d); };

  /* ----- Team Members ----- */
  CMS.getTeamMembers = function() {    return cmsGet('team_members', [
    { name: 'أحمد بن علي', role: 'مدير المنصة', bio: '', image: '', visible: true },
    { name: 'سارة بن محمد', role: 'منسقة البرامج', bio: '', image: '', visible: true }
  ]); };
  CMS.saveTeamMembers = function(d) { cmsSet('team_members', d); };

  /* ----- Contact Info (separate from social) ----- */
  CMS.getContactInfo = function() {
    return cmsGet('contact', {
      address: 'برج بوعريريج، الجزائر', phone: '+213 XXX XX XX XX',
      email: 'info@bba.dz', workingHours: '9:00 - 17:00',
      mapLat: 36.0749, mapLng: 4.7616
    });
  };
  CMS.saveContactInfo = function(d) { cmsSet('contact', d); };

  /* ----- Activities CMS Content ----- */
  CMS.getActivitiesCms = function() {
    return cmsGet('activities_cms', {
      title: 'النشاطات والفعاليات', subtitle: 'تعرف على أنشطتنا المتنوعة',
      categories: ['حملات توعوية', 'ورش تدريبية', 'فعاليات ثقافية', 'أنشطة تطوعية']
    });
  };
  CMS.saveActivitiesCms = function(d) { cmsSet('activities_cms', d); };

  /* ----- SEO Settings ----- */
  CMS.getSeo = function() {
    return cmsGet('seo', {
      title: 'منصة وعي الشباب BBA - برج بوعريريج',
      description: 'منصة شبابية للتوعية بمخاطر المخدرات وتعزيز الصحة النفسية في برج بوعريريج',
      keywords: 'وعي, شباب, مخدرات, توعية, برج بوعريريج, Dz Young Leaders',
      ogImage: '', ogTitle: '', ogDescription: '',
      googleAnalyticsId: '', googleTagId: ''
    });
  };
  CMS.saveSeo = function(d) { cmsSet('seo', d); };

  /* ----- Global Settings ----- */
  CMS.getGlobalSettings = function() {
    return cmsGet('global', {
      siteName: 'منصة وعي الشباب BBA',
      siteUrl: 'https://bba-wa3y.dz',
      primaryColor: '#C9A84C', secondaryColor: '#2DD4BF',
      language: 'ar', direction: 'rtl',
      maintenanceMode: false,
      theme: 'dark', allowThemeSwitch: true
    });
  };
  CMS.saveGlobalSettings = function(d) { cmsSet('global', d); };

  /* ----- Generic ----- */
  CMS.get = function(key, def) { return cmsGet(key, def); };
  CMS.save = function(key, d) { cmsSet(key, d); };

  CMS.refreshNavigation = function() {
    if (window.BBA && window.BBA.Navigation) window.BBA.Navigation.refresh();
  };

  window.CMS = CMS;

  /* ============================================================
   * ADMIN FORM RENDERERS
   * ============================================================ */

  function renderListEditor(containerId, getFn, saveFn, fields, itemLabel) {
    var container = byId(containerId);
    if (!container) return;
    var data = getFn();
    function render() {
      var html = '<div style="display:grid;gap:0.5rem;margin-bottom:0.75rem" class="cms-list-items">';
      for (var i = 0; i < data.length; i++) {
        html += '<div class="cms-list-item" style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem;background:var(--surface-card);border-radius:var(--radius-sm)">';
        html += '<span style="flex:0 0 20px;font-size:0.75rem;color:var(--muted)">' + (i+1) + '</span>';
        for (var f = 0; f < fields.length; f++) {
          var field = fields[f];
          var val = data[i][field.key] || '';
          if (field.type === 'textarea') {
            html += '<textarea class="cms-field-' + field.key + '" placeholder="' + esc(field.label) + '" style="flex:' + (field.flex||1) + ';padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem;min-height:50px">' + esc(val) + '</textarea>';
          } else if (field.type === 'checkbox') {
            html += '<label style="font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:0.25rem;white-space:nowrap"><input type="checkbox" class="cms-field-' + field.key + '" ' + (val ? 'checked' : '') + '> ' + esc(field.label) + '</label>';
          } else {
            html += '<input type="' + (field.type||'text') + '" class="cms-field-' + field.key + '" value="' + esc(val) + '" placeholder="' + esc(field.label) + '" style="flex:' + (field.flex||1) + ';padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem">';
          }
        }
        if (data[i].visible !== undefined) {
          html += '<label style="font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:0.25rem;white-space:nowrap"><input type="checkbox" class="cms-field-visible" ' + (data[i].visible !== false ? 'checked' : '') + '> ظاهر</label>';
        }
        if (data[i].published !== undefined) {
          html += '<label style="font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:0.25rem;white-space:nowrap"><input type="checkbox" class="cms-field-published" ' + (data[i].published !== false ? 'checked' : '') + '> منشور</label>';
        }
        html += '<button class="cms-item-remove" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:4px;cursor:pointer">✕</button>';
        html += '</div>';
      }
      html += '</div>';
      html += '<div style="display:flex;gap:0.5rem"><button class="cms-add-item btn btn-secondary btn-sm" style="font-size:0.78rem">➕ إضافة ' + (itemLabel||'') + '</button>';
      html += '<button class="cms-save-list btn btn-primary btn-sm" style="font-size:0.78rem">💾 حفظ</button></div>';
      container.innerHTML = html;

      container.querySelector('.cms-save-list').onclick = function() {
        var items = container.querySelectorAll('.cms-list-item');
        var newData = [];
        items.forEach(function(item) {
          var entry = {};
          var allEmpty = true;
          fields.forEach(function(f) {
            var inp = item.querySelector('.cms-field-' + f.key);
            if (f.type === 'checkbox') { entry[f.key] = inp.checked; if (inp.checked) allEmpty = false; }
            else if (f.type === 'textarea') { entry[f.key] = inp.value.trim(); if (inp.value.trim()) allEmpty = false; }
            else { entry[f.key] = inp.value.trim(); if (inp.value.trim()) allEmpty = false; }
          });
          var visCb = item.querySelector('.cms-field-visible');
          if (visCb) entry.visible = visCb.checked;
          var pubCb = item.querySelector('.cms-field-published');
          if (pubCb) entry.published = pubCb.checked;
          if (!allEmpty) newData.push(entry);
        });
        saveFn(newData);
        showCMSToast('✅ تم الحفظ');
      };

      container.querySelector('.cms-add-item').onclick = function() {
        data.push({ visible: true, published: true });
        render();
      };

      container.querySelectorAll('.cms-item-remove').forEach(function(btn) {
        btn.onclick = function() { btn.closest('.cms-list-item').remove(); };
      });
    }
    render();
  }

  function renderSimpleForm(containerId, getFn, saveFn, fields) {
    var container = byId(containerId);
    if (!container) return;
    var data = getFn();
    var html = '';
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var val = data[f.key] !== undefined ? data[f.key] : '';
      if (f.type === 'textarea') {
        html += '<div class="form-group"><label>' + esc(f.label) + '</label><textarea id="sf-' + f.key + '" class="cms-input" placeholder="' + esc(f.placeholder||'') + '" style="width:100%;min-height:' + (f.rows||80) + 'px;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);resize:vertical">' + esc(val) + '</textarea></div>';
      } else if (f.type === 'checkbox') {
        html += '<div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer"><input type="checkbox" id="sf-' + f.key + '" ' + (val ? 'checked' : '') + ' style="width:18px;height:18px"> ' + esc(f.label) + '</label></div>';
      } else if (f.type === 'color') {
        html += '<div class="form-group"><label>' + esc(f.label) + '</label><input type="color" id="sf-' + f.key + '" value="' + esc(val) + '" style="width:60px;height:40px;border:1px solid var(--border);border-radius:4px;background:transparent;cursor:pointer"></div>';
      } else if (f.type === 'select') {
        html += '<div class="form-group"><label>' + esc(f.label) + '</label><select id="sf-' + f.key + '" style="width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)">';
        for (var o = 0; o < (f.options||[]).length; o++) {
          html += '<option value="' + esc(f.options[o].value) + '" ' + (val === f.options[o].value ? 'selected' : '') + '>' + esc(f.options[o].label) + '</option>';
        }
        html += '</select></div>';
      } else {
        html += '<div class="form-group"><label>' + esc(f.label) + '</label><input type="' + (f.type||'text') + '" id="sf-' + f.key + '" value="' + esc(val) + '" class="cms-input" placeholder="' + esc(f.placeholder||'') + '"></div>';
      }
    }
    html += '<button class="cms-simple-save btn btn-primary" style="margin-top:0.5rem;font-size:0.82rem">💾 حفظ</button>';
    container.innerHTML = html;
    container.querySelector('.cms-simple-save').onclick = function() {
      var newData = {};
      for (var i = 0; i < fields.length; i++) {
        var inp = byId('sf-' + fields[i].key);
        if (fields[i].type === 'checkbox') newData[fields[i].key] = inp.checked;
        else if (fields[i].type === 'number') newData[fields[i].key] = parseFloat(inp.value) || 0;
        else newData[fields[i].key] = inp.value;
      }
      saveFn(newData);
      showCMSToast('✅ تم حفظ ' + (containerId.replace('cms','').replace('Form','') || 'الإعدادات'));
    };
  }

  /* ----- Hero Form ----- */
  CMS.renderHeroForm = function() {
    var container = byId('cmsHeroForm');
    if (!container) return;
    var hero = CMS.getHero();
    var html =
      '<div class="form-group"><label>شارة (Badge)</label><input type="text" id="heroBadge" value="' + esc(hero.badge) + '" class="cms-input" placeholder="مثال: 🏆 منصة شبابية رائدة"></div>' +
      '<div class="form-group"><label>العنوان الرئيسي</label><input type="text" id="heroTitle" value="' + esc(hero.title) + '" class="cms-input" placeholder="مثال: وعي الشباب"></div>' +
      '<div class="form-group"><label>العنوان الفرعي</label><textarea id="heroSubtitle" class="cms-input" style="min-height:60px;width:100%;padding:0.6rem 1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)">' + esc(hero.subtitle) + '</textarea></div>' +
      '<h4 style="color:var(--gold);margin:0.75rem 0 0.5rem;font-size:0.85rem">🔘 الأزرار</h4>' +
      '<div id="heroButtons" style="display:grid;gap:0.4rem;margin-bottom:0.5rem">';
    var btns = hero.buttons || [];
    for (var i = 0; i < Math.max(btns.length, 2); i++) {
      var b = btns[i] || {};
      html += '<div style="display:flex;gap:0.4rem"><input type="text" class="hero-btn-text" value="' + esc(b.text||'') + '" placeholder="نص الزر" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"><input type="text" class="hero-btn-link" value="' + esc(b.link||'') + '" placeholder="الرابط" style="flex:2;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"></div>';
    }
    html += '</div><button id="heroSaveBtn" class="btn btn-primary" style="font-size:0.82rem">💾 حفظ القسم البطل</button>';
    container.innerHTML = html;
    byId('heroSaveBtn').onclick = function() {
      var btns = [];
      container.querySelectorAll('.hero-btn-text').forEach(function(inp, idx) {
        var link = container.querySelectorAll('.hero-btn-link')[idx];
        if (inp.value.trim() || (link && link.value.trim())) {
          btns.push({ text: inp.value.trim() || '', link: link ? link.value.trim() : '' });
        }
      });
      CMS.saveHero({
        badge: byId('heroBadge').value,
        title: byId('heroTitle').value,
        subtitle: byId('heroSubtitle').value,
        buttons: btns
      });
      showCMSToast('✅ تم حفظ قسم البطل');
    };
  };

  /* ----- Notice Bar Form ----- */
  CMS.renderNoticeBarForm = function() {
    var container = byId('cmsNoticeBarForm');
    if (!container) return;
    var nb = CMS.getNoticeBar();
    var html =
      '<div class="form-group"><label>نص الإعلان</label><input type="text" id="nbText" value="' + esc(nb.text) + '" class="cms-input" placeholder="مثال: 🎉 حملة التوعية الجديدة"></div>' +
      '<div style="display:flex;gap:1rem;align-items:center"><label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer"><input type="checkbox" id="nbVisible" ' + (nb.visible ? 'checked' : '') + ' style="width:18px;height:18px"> ظاهر</label>' +
      '<div class="form-group" style="flex:1;margin:0"><label>الأولوية</label><select id="nbPriority" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font)">' +
      '<option value="info" ' + (nb.priority==='info'?'selected':'') + '>🔵 معلومات</option>' +
      '<option value="warning" ' + (nb.priority==='warning'?'selected':'') + '>🟡 تنبيه</option>' +
      '<option value="urgent" ' + (nb.priority==='urgent'?'selected':'') + '>🔴 عاجل</option>' +
      '</select></div></div>' +
      '<button id="nbSaveBtn" class="btn btn-primary" style="margin-top:0.5rem;font-size:0.82rem">💾 حفظ الإعلان</button>';
    container.innerHTML = html;
    byId('nbSaveBtn').onclick = function() {
      CMS.saveNoticeBar({ text: byId('nbText').value, visible: byId('nbVisible').checked, priority: byId('nbPriority').value });
      showCMSToast('✅ تم حفظ شريط الإعلان');
    };
  };

  /* ----- Testimonials Form ----- */
  CMS.renderTestimonialForm = function() {
    var container = byId('cmsTestimonialForm');
    if (!container) return;
    renderListEditor('cmsTestimonialForm', CMS.getTestimonials, CMS.saveTestimonials, [
      { key: 'name', label: 'الاسم', flex: 1 },
      { key: 'role', label: 'الدور', flex: 1 },
      { key: 'text', label: 'النص', type: 'textarea', flex: 2 }
    ], 'شهادة');
  };

  /* ----- FAQ Form ----- */
  CMS.renderFaqForm = function() {
    renderListEditor('cmsFaqForm', CMS.getFaq, CMS.saveFaq, [
      { key: 'question', label: 'السؤال', flex: 1 },
      { key: 'answer', label: 'الإجابة', type: 'textarea', flex: 2 }
    ], 'سؤال');
  };

  /* ----- Partners Form ----- */
  CMS.renderPartnersForm = function() {
    renderListEditor('cmsPartnerForm', CMS.getPartners, CMS.savePartners, [
      { key: 'name', label: 'اسم الشريك', flex: 1 },
      { key: 'logo', label: 'رابط الشعار', flex: 1 },
      { key: 'url', label: 'الموقع', flex: 1 }
    ], 'شريك');
  };

  /* ----- Gallery Form ----- */
  CMS.renderGalleryForm = function() {
    renderListEditor('cmsGalleryForm', CMS.getGallery, CMS.saveGallery, [
      { key: 'name', label: 'اسم الألبوم', flex: 1 },
      { key: 'description', label: 'الوصف', flex: 1 }
    ], 'ألبوم');
  };

  /* ----- Videos Form ----- */
  CMS.renderVideosForm = function() {
    renderListEditor('cmsVideoForm', CMS.getVideos, CMS.saveVideos, [
      { key: 'title', label: 'العنوان', flex: 1 },
      { key: 'url', label: 'الرابط', flex: 1 },
      { key: 'category', label: 'التصنيف', flex: 0.5 }
    ], 'فيديو');
  };

  /* ----- Library Form ----- */
  CMS.renderLibraryForm = function() {
    renderListEditor('cmsLibraryForm', CMS.getLibrary, CMS.saveLibrary, [
      { key: 'title', label: 'العنوان', flex: 1 },
      { key: 'url', label: 'الرابط', flex: 1 },
      { key: 'type', label: 'النوع (PDF/DOCX)', flex: 0.5 },
      { key: 'category', label: 'التصنيف', flex: 0.5 }
    ], 'مستند');
  };

  /* ----- Surveys Form ----- */
  CMS.renderSurveysForm = function() {
    renderListEditor('cmsSurveyForm', CMS.getSurveys, CMS.saveSurveys, [
      { key: 'title', label: 'عنوان الاستبيان', flex: 1 },
      { key: 'description', label: 'الوصف', flex: 1 }
    ], 'استبيان');
  };

  /* ----- Rehabilitation Form ----- */
  CMS.renderRehabForm = function() {
    renderListEditor('cmsRehabForm', CMS.getRehabilitation, CMS.saveRehabilitation, [
      { key: 'title', label: 'العنوان', flex: 1 },
      { key: 'content', label: 'المحتوى', type: 'textarea', flex: 2 },
      { key: 'stage', label: 'المرحلة', flex: 0.5 }
    ], 'تقرير');
  };

  /* ----- Articles Form (container: cmsArticleForm) ----- */
  CMS.renderArticlesForm = function() {
    renderListEditor('cmsArticleForm', CMS.getArticles, CMS.saveArticles, [
      { key: 'title', label: 'العنوان', flex: 1 },
      { key: 'summary', label: 'الملخص', flex: 1 },
      { key: 'category', label: 'التصنيف', flex: 0.5 }
    ], 'مقال');
  };

  /* ----- Announcements Form (container: cmsAnnouncementForm) ----- */
  CMS.renderAnnouncementsForm = function() {
    renderListEditor('cmsAnnouncementForm', CMS.getAnnouncements, CMS.saveAnnouncements, [
      { key: 'title', label: 'العنوان', flex: 1 },
      { key: 'text', label: 'النص', type: 'textarea', flex: 2 },
      { key: 'date', label: 'التاريخ', flex: 0.5 }
    ], 'إعلان');
  };

  /* ----- Calendar Form (container: cmsCalendarView) ----- */
  CMS.renderCalendarForm = function() {
    renderListEditor('cmsCalendarView', CMS.getCalendarEvents, CMS.saveCalendarEvents, [
      { key: 'title', label: 'الحدث', flex: 1 },
      { key: 'date', label: 'التاريخ', flex: 0.5 },
      { key: 'location', label: 'المكان', flex: 0.5 }
    ], 'حدث');
  };

  /* ----- Navigation Form ----- */
  CMS.renderNavForm = function() {
    var container = byId('cmsNavForm');
    if (!container) return;
    var nav = CMS.getNavigation();
    var html = '<div class="form-group"><label>نص الشعار (Logo)</label><input type="text" id="navLogoText" value="' + esc(nav.logoText) + '" class="cms-input"></div>';
    html += '<h4 style="color:var(--gold);margin:1rem 0 0.5rem;font-size:0.9rem">📌 روابط القائمة الرئيسية</h4><div id="navItemsContainer" style="display:grid;gap:0.5rem;margin-bottom:0.75rem">';
    var items = nav.items || [];
    for (var i = 0; i < items.length; i++) {
      html += '<div class="nav-item-row" style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem;background:var(--surface-card);border-radius:var(--radius-sm)">';
      html += '<span style="flex:0 0 20px;font-size:0.75rem;color:var(--muted)">'+(i+1)+'</span>';
      html += '<input type="text" class="nav-item-label" value="'+esc(items[i].label)+'" placeholder="التسمية" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem">';
      html += '<input type="text" class="nav-item-href" value="'+esc(items[i].href)+'" placeholder="الرابط" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem">';
      html += '<label style="font-size:0.75rem;color:var(--muted);white-space:nowrap"><input type="checkbox" class="nav-item-visible" '+(items[i].visible!==false?'checked':'')+'> ظاهر</label>';
      html += '<button class="btn-nav-remove" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:4px;cursor:pointer">✕</button></div>';
    }
    html += '</div><div style="display:flex;gap:0.5rem;margin-bottom:1rem">';
    html += '<button id="navAddItem" class="btn btn-secondary btn-sm" style="font-size:0.78rem">➕ إضافة رابط</button>';
    html += '<button id="navSaveBtn" class="btn btn-primary btn-sm" style="font-size:0.78rem">💾 حفظ القائمة</button></div>';
    container.innerHTML = html;

    byId('navSaveBtn').onclick = function() {
      var items = [];
      container.querySelectorAll('.nav-item-row').forEach(function(row) {
        var label = row.querySelector('.nav-item-label').value.trim();
        var href = row.querySelector('.nav-item-href').value.trim();
        var visible = row.querySelector('.nav-item-visible').checked;
        if (label || href) items.push({ label: label||'رابط', href: href||'#', visible: visible });
      });
      /* SVG icon map for mobile nav items */
      var navIconMap = {
        'الرئيسية': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        'عن المشروع': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        'الفئة المستهدفة': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'نادي الشباب': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'النشاطات': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        'الأكاديمية': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6v7"/><path d="M9 9h6"/></svg>',
        'المركز الإعلامي': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        'الشركاء': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'DZ Leaders': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>',
        'فريق العمل': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'الإنجازات': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 22V2h4v20"/></svg>',
        'تواصل': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
      };
      CMS.saveNavigation({ logoText: (byId('navLogoText').value.trim()||'منصة وعي الشباب BBA'), items: items, mobileItems: items.slice(0,6).map(function(m) { return { label:m.label, href:m.href, icon:navIconMap[m.label]||'🔗', visible:m.visible }; }) });
      CMS.refreshNavigation();
      showCMSToast('✅ تم حفظ قائمة التنقل');
    };
    byId('navAddItem').onclick = function() {
      var cont = byId('navItemsContainer');
      var div = document.createElement('div');
      div.className = 'nav-item-row';
      div.style.cssText = 'display:flex;align-items:center;gap:0.4rem;padding:0.4rem;background:var(--surface-card);border-radius:var(--radius-sm)';
      div.innerHTML = '<span style="flex:0 0 20px;font-size:0.75rem;color:var(--muted)">'+(cont.children.length+1)+'</span><input type="text" class="nav-item-label" placeholder="التسمية" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"><input type="text" class="nav-item-href" placeholder="الرابط" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"><label style="font-size:0.75rem;color:var(--muted);white-space:nowrap"><input type="checkbox" class="nav-item-visible" checked> ظاهر</label><button class="btn-nav-remove" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:4px;cursor:pointer">✕</button>';
      div.querySelector('.btn-nav-remove').onclick = function() { div.remove(); };
      cont.appendChild(div);
    };
    container.querySelectorAll('.btn-nav-remove').forEach(function(btn) {
      btn.onclick = function() { btn.closest('.nav-item-row').remove(); };
    });
  };

  /* ----- Footer Form ----- */
  CMS.renderFooterForm = function() {
    var container = byId('cmsFooterForm');
    if (!container) return;
    var footer = CMS.getFooter();
    var html = '<div class="form-group"><label>نص حقوق النشر</label><input type="text" id="footerCopyright" value="'+esc(footer.copyright)+'" class="cms-input"></div>';
    html += '<div class="form-group"><label>نص الراعي</label><input type="text" id="footerSponsor" value="'+esc(footer.sponsor||'')+'" class="cms-input"></div>';
    html += '<h4 style="color:var(--gold);margin:1rem 0 0.5rem;font-size:0.9rem">🔗 روابط التذييل</h4><div id="footerLinksContainer" style="display:grid;gap:0.4rem;margin-bottom:0.75rem">';
    var links = footer.links || [];
    for (var i = 0; i < links.length; i++) {
      html += '<div class="footer-link-row" style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem;background:var(--surface-card);border-radius:var(--radius-sm)">';
      html += '<input type="text" class="fl-label" value="'+esc(links[i].label)+'" placeholder="التسمية" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem">';
      html += '<input type="text" class="fl-href" value="'+esc(links[i].href)+'" placeholder="الرابط" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem">';
      html += '<label style="font-size:0.75rem;color:var(--muted);white-space:nowrap"><input type="checkbox" class="fl-visible" '+(links[i].visible!==false?'checked':'')+'> ظاهر</label>';
      html += '<button class="btn-fl-remove" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:4px;cursor:pointer">✕</button></div>';
    }
    html += '</div><div style="display:flex;gap:0.5rem"><button id="footerAddLink" class="btn btn-secondary btn-sm" style="font-size:0.78rem">➕ إضافة رابط</button>';
    html += '<button id="footerSaveBtn" class="btn btn-primary btn-sm" style="font-size:0.78rem">💾 حفظ التذييل</button></div>';
    container.innerHTML = html;
    byId('footerSaveBtn').onclick = function() {
      var links = [];
      container.querySelectorAll('.footer-link-row').forEach(function(row) {
        var label = row.querySelector('.fl-label').value.trim();
        var href = row.querySelector('.fl-href').value.trim();
        if (label||href) links.push({ label:label||'رابط', href:href||'#', visible:row.querySelector('.fl-visible').checked });
      });
      CMS.saveFooter({ copyright:byId('footerCopyright').value, sponsor:byId('footerSponsor').value, links:links });
      CMS.refreshNavigation();
      showCMSToast('✅ تم حفظ التذييل');
    };
    byId('footerAddLink').onclick = function() {
      var cont = byId('footerLinksContainer');
      var div = document.createElement('div');
      div.className = 'footer-link-row'; div.style.cssText = 'display:flex;align-items:center;gap:0.4rem;padding:0.35rem;background:var(--surface-card);border-radius:var(--radius-sm)';
      div.innerHTML = '<input type="text" class="fl-label" placeholder="التسمية" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"><input type="text" class="fl-href" placeholder="الرابط" style="flex:1;padding:0.35rem 0.5rem;border:1px solid var(--border);border-radius:4px;background:rgba(255,255,255,0.03);color:var(--text);font-size:0.8rem"><label style="font-size:0.75rem;color:var(--muted);white-space:nowrap"><input type="checkbox" class="fl-visible" checked> ظاهر</label><button class="btn-fl-remove" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:4px;cursor:pointer">✕</button>';
      div.querySelector('.btn-fl-remove').onclick = function() { div.remove(); };
      cont.appendChild(div);
    };
    container.querySelectorAll('.btn-fl-remove').forEach(function(btn) { btn.onclick = function() { btn.closest('.footer-link-row').remove(); }; });
  };

  /* ----- Social Media Form ----- */
  CMS.renderSocialForm = function() {
    renderSimpleForm('cmsSocialForm', CMS.getSocial, CMS.saveSocial, [
      { key:'email', label:'📧 البريد الإلكتروني', placeholder:'contact@bba.dz' },
      { key:'phone', label:'📞 الهاتف', placeholder:'+213 XXX XX XX XX' },
      { key:'address', label:'📍 العنوان', placeholder:'برج بوعريريج' },
      { key:'facebook', label:'📘 فيسبوك', placeholder:'https://facebook.com/...' },
      { key:'instagram', label:'📸 إنستغرام', placeholder:'https://instagram.com/...' },
      { key:'twitter', label:'🐦 تويتر', placeholder:'https://twitter.com/...' },
      { key:'youtube', label:'🎬 يوتيوب', placeholder:'https://youtube.com/...' }
    ]);
  };

  /* ----- Stats Form ----- */
  CMS.renderStatsForm = function() {
    renderListEditor('cmsStatsForm', CMS.getStats, CMS.saveStats, [
      { key:'icon', label:'الأيقونة', flex:0.5 },
      { key:'value', label:'القيمة', flex:0.5 },
      { key:'label', label:'التسمية', flex:1 }
    ], 'إحصائية');
  };

  /* ----- CTA Form ----- */
  CMS.renderCtaForm = function() {
    renderSimpleForm('cmsCtaForm', CMS.getCta, CMS.saveCta, [
      { key:'title', label:'العنوان', placeholder:'انضم إلينا اليوم' },
      { key:'subtitle', label:'النص الفرعي', placeholder:'كن جزءًا من التغيير' },
      { key:'btnText', label:'نص الزر', placeholder:'سجل الآن' },
      { key:'btnLink', label:'رابط الزر', placeholder:'index.html#contact' }
    ]);
  };

  /* ----- About Form ----- */
  CMS.renderAboutForm = function() {
    renderSimpleForm('cmsAboutForm', CMS.getAbout, CMS.saveAbout, [
      { key:'title', label:'العنوان', placeholder:'عن المشروع' },
      { key:'subtitle', label:'العنوان الفرعي', placeholder:'منصة وعي الشباب BBA' },
      { key:'content', label:'المحتوى', type:'textarea', rows:120, placeholder:'وصف المنصة...' },
      { key:'vision', label:'الرؤية', type:'textarea', rows:60, placeholder:'الرؤية...' },
      { key:'mission', label:'الرسالة', type:'textarea', rows:60, placeholder:'الرسالة...' },
      { key:'image', label:'رابط الصورة', placeholder:'https://example.com/image.jpg' }
    ]);
  };

  /* ----- Team Members Form ----- */
  CMS.renderTeamMembersForm = function() {
    renderListEditor('cmsTeamMembersForm', CMS.getTeamMembers, CMS.saveTeamMembers, [
      { key:'name', label:'الاسم', flex:1 },
      { key:'role', label:'الدور', flex:1 },
      { key:'bio', label:'السيرة', flex:1 },
      { key:'image', label:'الصورة', flex:0.5 }
    ], 'عضو');
  };

  /* ----- Activities CMS Form ----- */
  CMS.renderActivitiesCmsForm = function() {
    renderSimpleForm('cmsActivitiesCmsForm', CMS.getActivitiesCms, CMS.saveActivitiesCms, [
      { key:'title', label:'عنوان الصفحة', placeholder:'النشاطات والفعاليات' },
      { key:'subtitle', label:'النص الفرعي', placeholder:'تعرف على أنشطتنا' }
    ]);
  };

  /* ----- SEO Form ----- */
  CMS.renderSeoForm = function() {
    renderSimpleForm('cmsSeoForm', CMS.getSeo, CMS.saveSeo, [
      { key:'title', label:'عنوان الموقع (Title)', placeholder:'منصة وعي الشباب BBA' },
      { key:'description', label:'الوصف (Meta Description)', type:'textarea', rows:80, placeholder:'وصف الموقع لمحركات البحث...' },
      { key:'keywords', label:'الكلمات المفتاحية', placeholder:'وعي, شباب, مخدرات, توعية' },
      { key:'ogTitle', label:'OG Title (مشاركات)', placeholder:'عنوان المشاركة' },
      { key:'ogDescription', label:'OG Description', type:'textarea', rows:60, placeholder:'وصف المشاركة' },
      { key:'ogImage', label:'OG Image URL', placeholder:'https://.../og-image.jpg' },
      { key:'googleAnalyticsId', label:'Google Analytics ID', placeholder:'G-XXXXXXXXXX' },
      { key:'googleTagId', label:'Google Tag Manager ID', placeholder:'GTM-XXXXXXX' }
    ]);
  };

  /* ----- Contact Info Form ----- */
  CMS.renderContactInfoForm = function() {
    renderSimpleForm('cmsContactForm', CMS.getContactInfo, CMS.saveContactInfo, [
      { key:'address', label:'📍 العنوان', placeholder:'برج بوعريريج، الجزائر' },
      { key:'phone', label:'📞 الهاتف', placeholder:'+213 XXX XX XX XX' },
      { key:'email', label:'📧 البريد الإلكتروني', placeholder:'info@bba.dz' },
      { key:'workingHours', label:'🕐 ساعات العمل', placeholder:'9:00 - 17:00' },
      { key:'mapLat', label:'🌍 خط العرض (Latitude)', placeholder:'36.0749', type:'number' },
      { key:'mapLng', label:'🌍 خط الطول (Longitude)', placeholder:'4.7616', type:'number' }
    ]);
  };

  /* ----- Global Settings Form ----- */
  CMS.renderGlobalSettingsForm = function() {
    renderSimpleForm('cmsGlobalForm', CMS.getGlobalSettings, CMS.saveGlobalSettings, [
      { key:'siteName', label:'اسم الموقع', placeholder:'منصة وعي الشباب BBA' },
      { key:'siteUrl', label:'رابط الموقع', placeholder:'https://bba-wa3y.dz' },
      { key:'primaryColor', label:'اللون الرئيسي', type:'color' },
      { key:'secondaryColor', label:'اللون الثانوي', type:'color' },
      { key:'language', label:'اللغة', type:'select', options:[{value:'ar',label:'العربية'},{value:'fr',label:'Français'},{value:'en',label:'English'}] },
      { key:'direction', label:'الاتجاه', type:'select', options:[{value:'rtl',label:'RTL'},{value:'ltr',label:'LTR'}] },
      { key:'maintenanceMode', label:'وضع الصيانة (تعطيل الموقع)', type:'checkbox' },
      { key:'allowThemeSwitch', label:'السماح بتبديل السمة (داكن/فاتح)', type:'checkbox' }
    ]);
  };

  /* ============================================================
   * ADMIN INIT — Wire sidebar click listeners for ALL CMS sections
   * ============================================================ */
  function initAdminCMS() {
    var allSections = [
      'cms-navigation','cms-footer','cms-social',
      'cms-home','cms-stats','cms-cta',
      'cms-about','cms-team-members','cms-activities-cms',
      'cms-faq','cms-partners','cms-gallery','cms-videos',
      'cms-library','cms-surveys','cms-rehabilitation',
      'cms-articles','cms-announcements','cms-calendar',
      'cms-seo','cms-global','cms-contact'
    ];
    var renderMap = {
      'cms-navigation': CMS.renderNavForm,
      'cms-footer': CMS.renderFooterForm,
      'cms-social': CMS.renderSocialForm,
      'cms-home': function() { CMS.renderHeroForm(); CMS.renderNoticeBarForm(); CMS.renderTestimonialForm(); },
      'cms-stats': CMS.renderStatsForm,
      'cms-cta': CMS.renderCtaForm,
      'cms-about': CMS.renderAboutForm,
      'cms-team-members': CMS.renderTeamMembersForm,
      'cms-activities-cms': CMS.renderActivitiesCmsForm,
      'cms-faq': CMS.renderFaqForm,
      'cms-partners': CMS.renderPartnersForm,
      'cms-gallery': CMS.renderGalleryForm,
      'cms-videos': CMS.renderVideosForm,
      'cms-library': CMS.renderLibraryForm,
      'cms-surveys': CMS.renderSurveysForm,
      'cms-rehabilitation': CMS.renderRehabForm,
      'cms-articles': CMS.renderArticlesForm,
      'cms-announcements': CMS.renderAnnouncementsForm,
      'cms-calendar': CMS.renderCalendarForm,
      'cms-seo': CMS.renderSeoForm,
      'cms-global': CMS.renderGlobalSettingsForm,
      'cms-contact': CMS.renderContactInfoForm
    };

    document.addEventListener('click', function(e) {
      var link = e.target.closest('[data-section]');
      if (!link) return;
      var sectionId = link.getAttribute('data-section');
      if (allSections.indexOf(sectionId) === -1) return;
      setTimeout(function() {
        if (renderMap[sectionId]) renderMap[sectionId]();
      }, 80);
    });

    setTimeout(function() {
      allSections.forEach(function(id) {
        var el = byId(id);
        if (el && el.style.display !== 'none' && renderMap[id]) renderMap[id]();
      });
    }, 200);
    console.log('✅ [CMS Admin] All CMS editors initialized');
  }

  function tryInitAdmin() {
    if (document.querySelector('.sidebar') || window.location.pathname.indexOf('sidou-da') > -1) {
      setTimeout(initAdminCMS, 150);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInitAdmin);
  else tryInitAdmin();

  function showCMSToast(msg) {
    try { if (window.showToast) window.showToast(msg, 'success'); else console.log('[CMS] ' + msg); }
    catch(e) { console.log('[CMS] ' + msg); }
  }
  console.log('✅ [BBA CMS] Central CMS module loaded (22 API methods, 22 form renderers)');
})();
