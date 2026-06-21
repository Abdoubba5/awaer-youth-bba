/* ============================================================
   منصة وعي الشباب BBA - Content Management System
   Version: 1.0.0
   All CMS content is stored dynamically in localStorage
   ============================================================ */

(function() {
  /* ============================================================
   * UTILITY HELPERS
   * ============================================================ */
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function qs(s, cb) { var n = document.querySelectorAll(s); for (var i = 0; i < n.length; i++) cb(n[i], i); }

  /* ============================================================
   * CMS DATA ACCESS LAYER
   * All content stored in localStorage with bba_cms_ prefix
   * ============================================================ */
  var CMS = {
    get: function(key, def) {
      try { return JSON.parse(localStorage.getItem('bba_cms_' + key) || JSON.stringify(def)); }
      catch(e) { return def; }
    },
    set: function(key, data) {
      localStorage.setItem('bba_cms_' + key, JSON.stringify(data));
      /* Auto-sync is handled by database.js localStorage patch (bba_cms_ prefix) */
    },
    getAll: function(key) {
      return this.get(key, []);
    },
    add: function(key, item) {
      var data = this.getAll(key);
      item.id = Date.now() + Math.floor(Math.random() * 1000);
      item.createdAt = new Date().toISOString();
      data.push(item);
      this.set(key, data);
      return item;
    },
    update: function(key, id, updates) {
      var data = this.getAll(key);
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) {
          for (var prop in updates) { data[i][prop] = updates[prop]; }
          data[i].updatedAt = new Date().toISOString();
          break;
        }
      }
      this.set(key, data);
      return data;
    },
    remove: function(key, id) {
      var data = this.getAll(key);
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) { data.splice(i, 1); break; }
      }
      this.set(key, data);
      return data;
    },
    togglePublish: function(key, id) {
      var data = this.getAll(key);
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) { data[i].published = !data[i].published; data[i].updatedAt = new Date().toISOString(); break; }
      }
      this.set(key, data);
      return data;
    },
    reorder: function(key, fromIdx, toIdx) {
      var data = this.getAll(key);
      if (fromIdx < 0 || fromIdx >= data.length || toIdx < 0 || toIdx >= data.length) return data;
      var item = data.splice(fromIdx, 1)[0];
      data.splice(toIdx, 0, item);
      this.set(key, data);
      return data;
    }
  };

  /* ============================================================
   * DEFAULTS - Seed initial data if empty
   * ============================================================ */
  function seedDefaults() {
    /* Hero settings */
    if (!localStorage.getItem('bba_cms_hero')) {
      CMS.set('hero', {
        badge: 'Dz Young Leaders - برج بوعريريج',
        title: 'منصة وعي الشباب BBA',
        subtitle: 'منصة رقمية للتوعية بمخاطر المخدرات والمؤثرات العقلية وتعزيز الصحة النفسية لدى الشباب في ولاية برج بوعريريج.',
        primaryBtnText: 'طلب استشارة سرية',
        primaryBtnLink: '#consultation',
        secondaryBtnText: 'الانضمام كمتطوع',
        secondaryBtnLink: '#volunteer',
        bgImage: ''
      });
    }

    /* Default articles (Arabic awareness content) */
    if (!localStorage.getItem('bba_cms_articles')) {
      CMS.set('articles', [
        { id: 1, title: 'المخدرات الرقمية: حقائق وأخطار', category: 'توعية رقمية', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop', readingTime: 5, summary: 'تعرف على حقيقة ما يسمى بالمخدرات الرقمية وتأثيرها على الدماغ.', content: '<h4>ما هي المخدرات الرقمية؟</h4><p>المخدرات الرقمية (أو ما يُعرف بـ \"I-Doser\") هي ملفات صوتية تستخدم تقنية النبضات بكلتا الأذنين.</p><h4>الحقيقة العلمية</h4><p>الدراسات العلمية لم تثبت بشكل قاطع أن هذه المؤثرات الصوتية تسبب إدماناً كيميائياً.</p>', published: true, pinned: false, date: '2026-01-15' },
        { id: 2, title: 'الصحة النفسية للشباب: دليل العناية الذاتية', category: 'صحة نفسية', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop', readingTime: 7, summary: 'استراتيجيات عملية للحفاظ على صحتك النفسية في عالم مليء بالتحديات.', content: '<h4>أهمية الصحة النفسية للشباب</h4><p>تمثل الصحة النفسية جزءاً أساسياً من الصحة العامة.</p><h4>استراتيجيات العناية الذاتية</h4><ul><li>الروتين اليومي</li><li>النشاط البدني</li><li>التواصل الاجتماعي</li></ul>', published: true, pinned: false, date: '2026-02-01' },
        { id: 3, title: 'كيف تقول لا للمخدرات بثقة', category: 'مهارات حياتية', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop', readingTime: 4, summary: 'تدرب على مهارات الرفض الفعال وكيفية مقاومة ضغط الأقران.', content: '<h4>لماذا يصعب قول لا؟</h4><p>الخوف من الرفض الاجتماعي يدفع الكثير لقبول أشياء ضارة.</p>', published: true, pinned: false, date: '2026-02-20' },
        { id: 4, title: 'الرياضة: سلاحك ضد الإدمان', category: 'نمط حياة صحي', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop', readingTime: 6, summary: 'اكتشف كيف يمكن للنشاط البدني المنتظم أن يكون درعاً واقياً.', content: '<h4>العلاقة بين الرياضة والوقاية من الإدمان</h4><p>النشاط البدني يحفز إفراز هرمونات السعادة.</p>', published: true, pinned: false, date: '2026-03-10' },
        { id: 5, title: 'علامات التحذير: متى تطلب المساعدة؟', category: 'وقاية', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop', readingTime: 5, summary: 'دليل للتعرف على العلامات المبكرة لتعاطي المخدرات.', content: '<h4>لماذا التعرف المبكر مهم؟</h4><p>التعرف المبكر يمكن أن ينقذ حياة.</p>', published: true, pinned: false, date: '2026-03-25' },
        { id: 6, title: 'الإدمان الرقمي وعلاقته بالمخدرات', category: 'توعية', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=250&fit=crop', readingTime: 6, summary: 'دراسة العلاقة بين إدمان الأجهزة الرقمية والميول لتعاطي المخدرات.', content: '<h4>ما هو الإدمان الرقمي؟</h4><p>الإدمان الرقمي هو الاستخدام القهري المفرط للأجهزة.</p>', published: true, pinned: false, date: '2026-04-08' }
      ]);
    }

    /* Default testimonials */
    if (!localStorage.getItem('bba_cms_testimonials')) {
      CMS.set('testimonials', [
        { id: 1, text: 'التطوع في المنصة غير حياتي، تعلمت كيف أساعد غيري وأكون جزءاً من تغيير إيجابي في مجتمعي.', author: 'متطوع متميز', role: 'عضو في التنظيم - برج بوعريريج', avatar: '⭐', published: true },
        { id: 2, text: 'الاستشارات النفسية ساعدتني كثيراً في تخطي فترة صعبة. أشكر الفريق على الاحترافية والسرية التامة.', author: 'مستفيد من الخدمات', role: 'مستشار - رأس الوادي', avatar: '💚', published: true },
        { id: 3, text: 'فخور بأن أكون جزءاً من هذا البرنامج الرائد. الورشات التدريبية والحملات التوعوية التي ننظمها تحدث فرقاً حقيقياً.', author: 'قائد فريق', role: 'عضو فعال في الإدارة - المنصورة', avatar: '🏆', published: true }
      ]);
    }

    /* Default partners */
    if (!localStorage.getItem('bba_cms_partners')) {
      CMS.set('partners', [
        { name: 'Dz Young Leaders', logo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23D4AF37%22/%3E%3Ctext y=%2268%22 x=%2250%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22%2306090e%22 font-weight=%22700%22 font-family=%22Cairo%22%3EDZ%3C/text%3E%3C/svg%3E', website: '#', category: 'شريك رسمي', published: true },
        { name: 'جامعة برج بوعريريج', logo: '', website: '#', category: 'شريك أكاديمي', published: true }
      ]);
    }

    /* Default FAQ */
    if (!localStorage.getItem('bba_cms_faq')) {
      CMS.set('faq', [
        { question: 'كيف يمكنني الانضمام كمتطوع؟', answer: 'يمكنك التسجيل من خلال نموذج التطوع في الصفحة الرئيسية. بعد تقديم الطلب، ستقوم الإدارة بمراجعته والرد عليك.', published: true },
        { question: 'كيف يمكنني متابعة حالة استشارتي؟', answer: 'استخدم رمز المتابعة الذي حصلت عليه عند تقديم الاستشارة في قسم تتبع الاستشارات بالصفحة الرئيسية.', published: true },
        { question: 'هل الاستشارات مجانية وسرية؟', answer: 'نعم، جميع الاستشارات مجانية وسرية تماماً. يمكنك استخدام اسم مستعار لضمان الخصوصية.', published: true },
        { question: 'كيف أحصل على شهادة تطوع؟', answer: 'بعد المشاركة في الأنشطة والفعاليات، تقوم الإدارة بإصدار شهادات تقدير للمتطوعين المتميزين.', published: true }
      ]);
    }

    /* Default notice bar */
    if (!localStorage.getItem('bba_cms_notice_bar')) {
      CMS.set('notice_bar', { message: 'مرحباً بكم في منصة وعي الشباب BBA | برنامج Dz Young Leaders', visible: true, priority: 'info', expiresAt: '' });
    }

    /* Default calendar events from bba_events */
    if (!localStorage.getItem('bba_cms_calendar')) {
      CMS.set('calendar', []);
    }

    /* Default surveys */
    if (!localStorage.getItem('bba_cms_surveys')) {
      CMS.set('surveys', []);
    }

    /* Default gallery */
    if (!localStorage.getItem('bba_cms_gallery')) {
      CMS.set('gallery', []);
    }

    /* Default videos */
    if (!localStorage.getItem('bba_cms_videos')) {
      CMS.set('videos', []);
    }

    /* Default library */
    if (!localStorage.getItem('bba_cms_library')) {
      CMS.set('library', []);
    }

    /* Default achievements page data */
    if (!localStorage.getItem('bba_cms_achievements')) {
      CMS.set('achievements', {
        year: new Date().getFullYear(),
        description: 'إنجازات برنامج Dz Young Leaders لعام ' + new Date().getFullYear(),
        published: true
      });
    }
  }

  seedDefaults();

  /* ============================================================
   * PUBLIC API - Expose CMS functions globally
   * ============================================================ */
  window.CMS = {
    getHero: function() { return CMS.get('hero', {}); },
    saveHero: function(data) { CMS.set('hero', data); },

    getArticles: function() { return CMS.getAll('articles'); },
    addArticle: function(item) { return CMS.add('articles', item); },
    updateArticle: function(id, updates) { return CMS.update('articles', id, updates); },
    removeArticle: function(id) { return CMS.remove('articles', id); },
    toggleArticlePublish: function(id) { return CMS.togglePublish('articles', id); },

    getTestimonials: function() { return CMS.getAll('testimonials'); },
    addTestimonial: function(item) { return CMS.add('testimonials', item); },
    updateTestimonial: function(id, updates) { return CMS.update('testimonials', id, updates); },
    removeTestimonial: function(id) { return CMS.remove('testimonials', id); },

    getNoticeBar: function() { return CMS.get('notice_bar', { message: '', visible: false }); },
    saveNoticeBar: function(data) { CMS.set('notice_bar', data); },

    getPartners: function() { return CMS.getAll('partners'); },
    addPartner: function(item) { return CMS.add('partners', item); },
    removePartner: function(id) { return CMS.remove('partners', id); },

    getFaq: function() { return CMS.getAll('faq'); },
    addFaq: function(item) { return CMS.add('faq', item); },
    updateFaq: function(id, updates) { return CMS.update('faq', id, updates); },
    removeFaq: function(id) { return CMS.remove('faq', id); },

    getGallery: function() { return CMS.getAll('gallery'); },
    addGalleryAlbum: function(item) { return CMS.add('gallery', item); },
    removeGalleryAlbum: function(id) { return CMS.remove('gallery', id); },

    getVideos: function() { return CMS.getAll('videos'); },
    addVideo: function(item) { return CMS.add('videos', item); },
    removeVideo: function(id) { return CMS.remove('videos', id); },

    getLibrary: function() { return CMS.getAll('library'); },
    addLibraryItem: function(item) { return CMS.add('library', item); },
    removeLibraryItem: function(id) { return CMS.remove('library', id); },

    getSurveys: function() { return CMS.getAll('surveys'); },
    addSurvey: function(item) { return CMS.add('surveys', item); },
    updateSurvey: function(id, updates) { return CMS.update('surveys', id, updates); },
    removeSurvey: function(id) { return CMS.remove('surveys', id); },

    getAchievementsPage: function() { return CMS.get('achievements_page', {}); },
    saveAchievementsPage: function(data) { CMS.set('achievements_page', data); },

    getRehabilitation: function() { return CMS.getAll('rehabilitation'); },
    addRehabilitation: function(item) { return CMS.add('rehabilitation', item); },
    removeRehabilitation: function(id) {
      var data = CMS.getAll('rehabilitation');
      for (var i = 0; i < data.length; i++) {
        if (data[i].id === id) { data.splice(i, 1); break; }
      }
      CMS.set('rehabilitation', data);
      return data;
    }
  };

  /* ============================================================
   * ADMIN CMS RENDERERS - Called from sidou-da.html
   * ============================================================ */
  if (!byId('cmsHeroForm')) return; // Not on admin page

  /* --- HERO FORM --- */
  function renderHeroForm() {
    var hero = window.CMS.getHero();
    var container = byId('cmsHeroForm');
    if (!container) return;
    container.innerHTML =
      '<div class="form-group"><label>الشعار (Badge)</label><input type="text" id="cmsHeroBadge" value="' + escapeHtml(hero.badge || '') + '" class="cms-input"></div>' +
      '<div class="form-group"><label>العنوان الرئيسي</label><input type="text" id="cmsHeroTitle" value="' + escapeHtml(hero.title || '') + '" class="cms-input"></div>' +
      '<div class="form-group"><label>النص الفرعي</label><textarea id="cmsHeroSubtitle" class="cms-input" style="min-height:60px">' + escapeHtml(hero.subtitle || '') + '</textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">' +
      '<div class="form-group"><label>نص الزر الأساسي</label><input type="text" id="cmsHeroPrimaryBtn" value="' + escapeHtml(hero.primaryBtnText || '') + '" class="cms-input"></div>' +
      '<div class="form-group"><label>رابط الزر الأساسي</label><input type="text" id="cmsHeroPrimaryLink" value="' + escapeHtml(hero.primaryBtnLink || '') + '" class="cms-input"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">' +
      '<div class="form-group"><label>نص الزر الثانوي</label><input type="text" id="cmsHeroSecondaryBtn" value="' + escapeHtml(hero.secondaryBtnText || '') + '" class="cms-input"></div>' +
      '<div class="form-group"><label>رابط الزر الثانوي</label><input type="text" id="cmsHeroSecondaryLink" value="' + escapeHtml(hero.secondaryBtnLink || '') + '" class="cms-input"></div>' +
      '</div>' +
      '<button type="button" id="cmsSaveHeroBtn" class="btn btn-primary" style="width:100%;justify-content:center">💾 حفظ إعدادات الصفحة الرئيسية</button>';

    byId('cmsSaveHeroBtn').addEventListener('click', function() {
      var data = {
        badge: byId('cmsHeroBadge').value.trim(),
        title: byId('cmsHeroTitle').value.trim(),
        subtitle: byId('cmsHeroSubtitle').value.trim(),
        primaryBtnText: byId('cmsHeroPrimaryBtn').value.trim(),
        primaryBtnLink: byId('cmsHeroPrimaryLink').value.trim(),
        secondaryBtnText: byId('cmsHeroSecondaryBtn').value.trim(),
        secondaryBtnLink: byId('cmsHeroSecondaryLink').value.trim()
      };
      window.CMS.saveHero(data);
      showToast('✅ تم حفظ إعدادات الصفحة الرئيسية', 'success');
    });
  }

  /* --- NOTICE BAR FORM --- */
  function renderNoticeBarForm() {
    var notice = window.CMS.getNoticeBar();
    var container = byId('cmsNoticeBarForm');
    if (!container) return;
    container.innerHTML =
      '<div class="form-group"><label>نص الإعلان</label><input type="text" id="cmsNoticeMsg" value="' + escapeHtml(notice.message || '') + '" class="cms-input" placeholder="مثال: مرحباً بكم في المنصة"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem">' +
      '<div class="form-group"><label>الأولوية</label><select id="cmsNoticePriority" class="cms-input"><option value="info"' + (notice.priority === 'info' ? ' selected' : '') + '>معلومات</option><option value="alert"' + (notice.priority === 'alert' ? ' selected' : '') + '>تنبيه</option><option value="urgent"' + (notice.priority === 'urgent' ? ' selected' : '') + '>عاجل</option></select></div>' +
      '<div class="form-group"><label>الإظهار</label><select id="cmsNoticeVisible" class="cms-input"><option value="true"' + (notice.visible ? ' selected' : '') + '>ظاهر</option><option value="false"' + (!notice.visible ? ' selected' : '') + '>مخفي</option></select></div>' +
      '<div class="form-group"><label>تاريخ الانتهاء</label><input type="date" id="cmsNoticeExpires" value="' + (notice.expiresAt ? notice.expiresAt.split('T')[0] : '') + '" class="cms-input"></div>' +
      '</div>' +
      '<button type="button" id="cmsSaveNoticeBtn" class="btn btn-primary" style="width:100%;justify-content:center">💾 حفظ الإعلان</button>';

    byId('cmsSaveNoticeBtn').addEventListener('click', function() {
      window.CMS.saveNoticeBar({
        message: byId('cmsNoticeMsg').value.trim(),
        priority: byId('cmsNoticePriority').value,
        visible: byId('cmsNoticeVisible').value === 'true',
        expiresAt: byId('cmsNoticeExpires').value
      });
      showToast('✅ تم حفظ شريط الإعلان', 'success');
    });
  }

  /* --- TESTIMONIAL FORM --- */
  function renderTestimonialForm() {
    var container = byId('cmsTestimonialForm');
    if (!container) return;
    container.innerHTML =
      '<div id="cmsTestimonialList" style="margin-bottom:1rem"></div>' +
      '<div style="border-top:1px solid var(--border-light);padding-top:1rem">' +
      '<h4 style="font-size:0.9rem;color:var(--gold);margin-bottom:0.75rem">➕ إضافة شهادة جديدة</h4>' +
      '<div class="form-group"><label>النص</label><textarea id="cmsTestimonialText" class="cms-input" style="min-height:60px" placeholder="نص الشهادة..."></textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>الاسم</label><input type="text" id="cmsTestimonialAuthor" class="cms-input" placeholder="اسم الشخص"></div>' +
      '<div class="form-group"><label>الدور</label><input type="text" id="cmsTestimonialRole" class="cms-input" placeholder="مثال: متطوع - برج بوعريريج"></div>' +
      '</div>' +
      '<button type="button" id="cmsAddTestimonialBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إضافة الشهادة</button></div>';

    function renderTestimonialList() {
      var list = byId('cmsTestimonialList');
      if (!list) return;
      var data = window.CMS.getTestimonials();
      if (data.length === 0) { list.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:1rem">لا توجد شهادات بعد</div>'; return; }
      var html = '<h4 style="font-size:0.9rem;color:var(--gold);margin-bottom:0.5rem">📋 الشهادات (' + data.length + ')</h4>';
      for (var i = data.length - 1; i >= 0; i--) {
        var t = data[i];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.4rem;background:rgba(212,175,55,0.02)">' +
          '<div style="flex:1;min-width:0"><div style="font-size:0.8rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(t.text) + '</div><div style="font-size:0.7rem;color:var(--muted)">— ' + escapeHtml(t.author) + '</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeTestimonial(' + t.id + ');renderTestimonialList();showToast(\'تم حذف الشهادة\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font);flex-shrink:0">🗑️</button></div>';
      }
      list.innerHTML = html;
    }

    byId('cmsAddTestimonialBtn').addEventListener('click', function() {
      var text = byId('cmsTestimonialText').value.trim();
      var author = byId('cmsTestimonialAuthor').value.trim();
      var role = byId('cmsTestimonialRole').value.trim();
      if (!text || !author) { showToast('النص والاسم مطلوبان', 'error'); return; }
      window.CMS.addTestimonial({ text: text, author: author, role: role, avatar: '⭐', published: true });
      byId('cmsTestimonialText').value = '';
      byId('cmsTestimonialAuthor').value = '';
      byId('cmsTestimonialRole').value = '';
      renderTestimonialList();
      showToast('✅ تم إضافة الشهادة', 'success');
    });

    renderTestimonialList();
  }

  /* --- ARTICLES FORM --- */
  function renderArticleForm() {
    var container = byId('cmsArticleForm');
    var listContainer = byId('cmsArticlesList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>عنوان المقال *</label><input type="text" id="cmsArticleTitle" class="cms-input" placeholder="عنوان المقال"></div>' +
      '<div class="form-group"><label>التصنيف</label><select id="cmsArticleCategory" class="cms-input"><option value="توعية رقمية">توعية رقمية</option><option value="صحة نفسية">صحة نفسية</option><option value="مهارات حياتية">مهارات حياتية</option><option value="نمط حياة صحي">نمط حياة صحي</option><option value="وقاية">وقاية</option><option value="توعية">توعية</option></select></div>' +
      '<div class="form-group"><label>رابط الصورة</label><input type="url" id="cmsArticleImage" class="cms-input" placeholder="https://example.com/image.jpg"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>وقت القراءة (دقائق)</label><input type="number" id="cmsArticleReadingTime" class="cms-input" value="5" min="1"></div>' +
      '<div class="form-group"><label>تاريخ النشر</label><input type="date" id="cmsArticleDate" class="cms-input"></div>' +
      '</div>' +
      '<div class="form-group"><label>الملخص</label><textarea id="cmsArticleSummary" class="cms-input" style="min-height:60px" placeholder="ملخص المقال..."></textarea></div>' +
      '<div class="form-group"><label>المحتوى الكامل (HTML)</label><textarea id="cmsArticleContent" class="cms-input" style="min-height:200px;font-family:monospace;font-size:0.8rem" placeholder="محتوى المقال بتنسيق HTML..."></textarea></div>' +
      '<button type="button" id="cmsAddArticleBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ نشر المقال</button>';

    /* Set default date */
    var dateInput = byId('cmsArticleDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    function renderArticlesList() {
      var data = window.CMS.getArticles();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد مقالات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var a = data[i];
        var status = a.published !== false ? '<span class="badge badge-approved">منشور</span>' : '<span class="badge badge-pending">مسودة</span>';
        var pinned = a.pinned ? '📌 ' : '';
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;background:rgba(212,175,55,0.02)">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.85rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + pinned + escapeHtml(a.title) + '</div><div style="font-size:0.72rem;color:var(--muted);margin-top:0.2rem">' + escapeHtml(a.category) + ' | 📅 ' + (a.date || '') + '</div></div>' +
          '<div style="display:flex;gap:0.3rem;flex-shrink:0;margin-right:0.5rem">' +
          '<button class="btn btn-sm" onclick="window.CMS.toggleArticlePublish(' + a.id + ');renderArticlesList();showToast(\'تم تغيير حالة النشر\',\'info\')" style="background:transparent;color:var(--gold);border:1px solid var(--gold);padding:0.2rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer;font-family:var(--font)">' + (a.published !== false ? '🔒' : '🔓') + '</button>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeArticle(' + a.id + ');renderArticlesList();showToast(\'تم حذف المقال\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button>' +
          '</div></div>' + status +
          '</div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddArticleBtn').addEventListener('click', function() {
      var title = byId('cmsArticleTitle').value.trim();
      var category = byId('cmsArticleCategory').value;
      var image = byId('cmsArticleImage').value.trim();
      var readingTime = parseInt(byId('cmsArticleReadingTime').value, 10) || 5;
      var date = byId('cmsArticleDate').value;
      var summary = byId('cmsArticleSummary').value.trim();
      var content = byId('cmsArticleContent').value.trim();
      if (!title) { showToast('عنوان المقال مطلوب', 'error'); return; }
      window.CMS.addArticle({ title: title, category: category, image: image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop', readingTime: readingTime, summary: summary, content: content || '<p>' + summary + '</p>', published: true, pinned: false, date: date || new Date().toISOString().split('T')[0] });
      byId('cmsArticleTitle').value = '';
      byId('cmsArticleImage').value = '';
      byId('cmsArticleSummary').value = '';
      byId('cmsArticleContent').value = '';
      renderArticlesList();
      showToast('✅ تم نشر المقال بنجاح', 'success');
    });

    renderArticlesList();
  }

  /* --- ANNOUNCEMENTS FORM --- */
  function renderAnnouncementForm() {
    var container = byId('cmsAnnouncementForm');
    var listContainer = byId('cmsAnnouncementsList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>العنوان</label><input type="text" id="cmsAnnTitle" class="cms-input" placeholder="عنوان الإعلان"></div>' +
      '<div class="form-group"><label>المحتوى</label><textarea id="cmsAnnMessage" class="cms-input" style="min-height:80px" placeholder="نص الإعلان..."></textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>النوع</label><select id="cmsAnnType" class="cms-input"><option value="info">معلومات</option><option value="alert">تنبيه</option><option value="achievement">إنجاز</option></select></div>' +
      '<div class="form-group"><label>مثبت</label><select id="cmsAnnPinned" class="cms-input"><option value="false">لا</option><option value="true">نعم</option></select></div>' +
      '</div>' +
      '<button type="button" id="cmsAddAnnBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ نشر الإعلان</button>';

    function renderAnnouncementsList() {
      var data = JSON.parse(localStorage.getItem('bba_notifications_data') || '[]');
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد إعلانات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var a = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.85rem;color:var(--text)">' + escapeHtml(a.title) + '</div><div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.2rem">' + escapeHtml(a.message) + '</div></div>' +
          '<span style="font-size:0.7rem;color:var(--muted);white-space:nowrap">' + new Date(a.createdAt).toLocaleDateString('ar-DZ') + '</span></div></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddAnnBtn').addEventListener('click', function() {
      var title = byId('cmsAnnTitle').value.trim();
      var message = byId('cmsAnnMessage').value.trim();
      var type = byId('cmsAnnType').value;
      if (!title || !message) { showToast('العنوان والمحتوى مطلوبان', 'error'); return; }
      var data = JSON.parse(localStorage.getItem('bba_notifications_data') || '[]');
      data.push({ title: title, message: message, type: type, targetVolunteer: 'all', isUrgent: false, createdAt: new Date().toISOString() });
      localStorage.setItem('bba_notifications_data', JSON.stringify(data));
      byId('cmsAnnTitle').value = '';
      byId('cmsAnnMessage').value = '';
      renderAnnouncementsList();
      showToast('✅ تم نشر الإعلان', 'success');
    });

    renderAnnouncementsList();
  }

  /* --- GALLERY FORM --- */
  function renderGalleryForm() {
    var container = byId('cmsGalleryForm');
    var listContainer = byId('cmsGalleryList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>اسم الألبوم</label><input type="text" id="cmsGalleryName" class="cms-input" placeholder="مثال: فعاليات رمضان 2026"></div>' +
      '<div class="form-group"><label>رابط الصور (فواصل سطر جديدة)</label><textarea id="cmsGalleryImages" class="cms-input" style="min-height:80px;font-family:monospace;font-size:0.75rem" placeholder="https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"></textarea></div>' +
      '<button type="button" id="cmsAddGalleryBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إنشاء الألبوم</button>';

    function renderGalleryList() {
      var data = window.CMS.getGallery();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد ألبومات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var g = data[i];
        var images = g.images || [];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:600;font-size:0.85rem;color:var(--text)">🖼️ ' + escapeHtml(g.name) + '</div><div style="font-size:0.75rem;color:var(--muted)">' + images.length + ' صورة</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeGalleryAlbum(' + g.id + ');renderGalleryList();showToast(\'تم حذف الألبوم\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button>' +
          '</div></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddGalleryBtn').addEventListener('click', function() {
      var name = byId('cmsGalleryName').value.trim();
      var imagesText = byId('cmsGalleryImages').value.trim();
      if (!name) { showToast('اسم الألبوم مطلوب', 'error'); return; }
      var images = imagesText ? imagesText.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
      window.CMS.addGalleryAlbum({ name: name, images: images, published: true });
      byId('cmsGalleryName').value = '';
      byId('cmsGalleryImages').value = '';
      renderGalleryList();
      showToast('✅ تم إنشاء الألبوم', 'success');
    });

    renderGalleryList();
  }

  /* --- VIDEOS FORM --- */
  function renderVideoForm() {
    var container = byId('cmsVideoForm');
    var listContainer = byId('cmsVideosList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>عنوان الفيديو</label><input type="text" id="cmsVideoTitle" class="cms-input" placeholder="عنوان الفيديو"></div>' +
      '<div class="form-group"><label>رابط YouTube</label><input type="url" id="cmsVideoUrl" class="cms-input" placeholder="https://www.youtube.com/watch?v=..."></div>' +
      '<div class="form-group"><label>التصنيف</label><select id="cmsVideoCategory" class="cms-input"><option value="توعوية">توعوية</option><option value="تدريبية">تدريبية</option><option value="فعاليات">فعاليات</option><option value="أخرى">أخرى</option></select></div>' +
      '<div class="form-group"><label>مميز</label><select id="cmsVideoFeatured" class="cms-input"><option value="false">لا</option><option value="true">نعم</option></select></div>' +
      '<button type="button" id="cmsAddVideoBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إضافة الفيديو</button>';

    function renderVideosList() {
      var data = window.CMS.getVideos();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد فيديوهات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var v = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:600;font-size:0.85rem;color:var(--text)">🎬 ' + escapeHtml(v.title) + '</div><div style="font-size:0.72rem;color:var(--muted)">' + escapeHtml(v.category || '') + (v.featured ? ' | ⭐ مميز' : '') + '</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeVideo(' + v.id + ');renderVideosList();showToast(\'تم حذف الفيديو\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddVideoBtn').addEventListener('click', function() {
      var title = byId('cmsVideoTitle').value.trim();
      var url = byId('cmsVideoUrl').value.trim();
      var category = byId('cmsVideoCategory').value;
      var featured = byId('cmsVideoFeatured').value === 'true';
      if (!title || !url) { showToast('العنوان والرابط مطلوبان', 'error'); return; }
      window.CMS.addVideo({ title: title, url: url, category: category, featured: featured, published: true });
      byId('cmsVideoTitle').value = '';
      byId('cmsVideoUrl').value = '';
      renderVideosList();
      showToast('✅ تم إضافة الفيديو', 'success');
    });

    renderVideosList();
  }

  /* --- PARTNERS FORM --- */
  function renderPartnerForm() {
    var container = byId('cmsPartnerForm');
    var listContainer = byId('cmsPartnersList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>اسم الشريك</label><input type="text" id="cmsPartnerName" class="cms-input" placeholder="اسم المؤسسة"></div>' +
      '<div class="form-group"><label>رابط الشعار (URL)</label><input type="url" id="cmsPartnerLogo" class="cms-input" placeholder="https://example.com/logo.png"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>الموقع الإلكتروني</label><input type="url" id="cmsPartnerWebsite" class="cms-input" placeholder="https://example.com"></div>' +
      '<div class="form-group"><label>معلومات الاتصال</label><textarea id="cmsPartnerContact" class="cms-input" style="min-height:50px;font-size:0.8rem" placeholder="مثال: 05XX-XX-XX-XX\ncontact@example.com"></textarea></div>' +
      '<div class="form-group"><label>التصنيف</label><select id="cmsPartnerCategory" class="cms-input"><option value="شريك رسمي">شريك رسمي</option><option value="شريك أكاديمي">شريك أكاديمي</option><option value="شريك إعلامي">شريك إعلامي</option><option value="راعي">راعي</option><option value="المؤسسات التربوية">المؤسسات التربوية</option><option value="دور الشباب">دور الشباب</option><option value="الجمعيات المحلية">الجمعيات المحلية</option><option value="مختصو علم النفس">مختصو علم النفس</option><option value="وسائل الإعلام المحلية">وسائل الإعلام المحلية</option></select></div>' +
      '</div>' +
      '<button type="button" id="cmsAddPartnerBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إضافة شريك</button>';

    function renderPartnersList() {
      var data = window.CMS.getPartners();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا يوجد شركاء بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var p = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:600;font-size:0.85rem;color:var(--text)">🤝 ' + escapeHtml(p.name) + '</div><div style="font-size:0.72rem;color:var(--muted)">' + escapeHtml(p.category || '') + '</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removePartner(' + p.id + ');renderPartnersList();showToast(\'تم حذف الشريك\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddPartnerBtn').addEventListener('click', function() {
      var name = byId('cmsPartnerName').value.trim();
      var logo = byId('cmsPartnerLogo').value.trim();
      var website = byId('cmsPartnerWebsite').value.trim();
      var category = byId('cmsPartnerCategory').value;
      if (!name) { showToast('اسم الشريك مطلوب', 'error'); return; }
      var contactInfo = byId('cmsPartnerContact').value.trim();
      window.CMS.addPartner({ name: name, logo: logo, website: website, category: category, contactInfo: contactInfo, published: true });
      byId('cmsPartnerName').value = '';
      byId('cmsPartnerLogo').value = '';
      byId('cmsPartnerWebsite').value = '';
      renderPartnersList();
      showToast('✅ تم إضافة الشريك', 'success');
    });

    renderPartnersList();
  }

  /* --- FAQ FORM --- */
  function renderFaqForm() {
    var container = byId('cmsFaqForm');
    var listContainer = byId('cmsFaqList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>السؤال</label><input type="text" id="cmsFaqQuestion" class="cms-input" placeholder="السؤال الشائع"></div>' +
      '<div class="form-group"><label>الإجابة</label><textarea id="cmsFaqAnswer" class="cms-input" style="min-height:80px" placeholder="الإجابة..."></textarea></div>' +
      '<button type="button" id="cmsAddFaqBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إضافة سؤال</button>';

    function renderFaqList() {
      var data = window.CMS.getFaq();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد أسئلة بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var f = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.85rem;color:var(--gold)">❓ ' + escapeHtml(f.question) + '</div><div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.3rem">' + escapeHtml(f.answer) + '</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeFaq(' + f.id + ');renderFaqList();showToast(\'تم حذف السؤال\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font);flex-shrink:0">🗑️</button>' +
          '</div></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddFaqBtn').addEventListener('click', function() {
      var question = byId('cmsFaqQuestion').value.trim();
      var answer = byId('cmsFaqAnswer').value.trim();
      if (!question || !answer) { showToast('السؤال والإجابة مطلوبان', 'error'); return; }
      window.CMS.addFaq({ question: question, answer: answer, published: true });
      byId('cmsFaqQuestion').value = '';
      byId('cmsFaqAnswer').value = '';
      renderFaqList();
      showToast('✅ تم إضافة السؤال', 'success');
    });

    renderFaqList();
  }

  /* --- LIBRARY FORM --- */
  function renderLibraryForm() {
    var container = byId('cmsLibraryForm');
    var listContainer = byId('cmsLibraryList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>عنوان المستند</label><input type="text" id="cmsLibTitle" class="cms-input" placeholder="عنوان المستند"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>الرابط</label><input type="url" id="cmsLibUrl" class="cms-input" placeholder="https://example.com/document.pdf"></div>' +
      '<div class="form-group"><label>النوع</label><select id="cmsLibType" class="cms-input"><option value="PDF">PDF</option><option value="DOCX">DOCX</option><option value="PPTX">PPTX</option><option value="أخرى">أخرى</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label>التصنيف</label><input type="text" id="cmsLibCategory" class="cms-input" placeholder="مثال: تقارير, كتيبات, بحوث"></div>' +
      '<button type="button" id="cmsAddLibBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إضافة مستند</button>';

    function renderLibraryList() {
      var data = window.CMS.getLibrary();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد مستندات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var l = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:600;font-size:0.85rem;color:var(--text)">📄 ' + escapeHtml(l.title) + ' <span style="font-size:0.7rem;color:var(--gold)">[' + (l.type || 'PDF') + ']</span></div><div style="font-size:0.72rem;color:var(--muted)">' + escapeHtml(l.category || '') + '</div></div>' +
          '<button class="btn btn-sm" onclick="window.CMS.removeLibraryItem(' + l.id + ');renderLibraryList();showToast(\'تم حذف المستند\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.5rem;font-size:0.65rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddLibBtn').addEventListener('click', function() {
      var title = byId('cmsLibTitle').value.trim();
      var url = byId('cmsLibUrl').value.trim();
      var type = byId('cmsLibType').value;
      var category = byId('cmsLibCategory').value.trim();
      if (!title || !url) { showToast('العنوان والرابط مطلوبان', 'error'); return; }
      window.CMS.addLibraryItem({ title: title, url: url, type: type, category: category, downloads: 0, published: true });
      byId('cmsLibTitle').value = '';
      byId('cmsLibUrl').value = '';
      byId('cmsLibCategory').value = '';
      renderLibraryList();
      showToast('✅ تم إضافة المستند', 'success');
    });

    renderLibraryList();
  }

  /* --- SURVEYS FORM --- */
  function renderSurveyForm() {
    var container = byId('cmsSurveyForm');
    var listContainer = byId('cmsSurveysList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>عنوان الاستبيان</label><input type="text" id="cmsSurveyTitle" class="cms-input" placeholder="عنوان الاستبيان"></div>' +
      '<div class="form-group"><label>الوصف</label><textarea id="cmsSurveyDesc" class="cms-input" style="min-height:60px" placeholder="وصف الاستبيان..."></textarea></div>' +
      '<div class="form-group"><label>الأسئلة (سؤال واحد في كل سطر)</label><textarea id="cmsSurveyQuestions" class="cms-input" style="min-height:80px;font-family:monospace;font-size:0.75rem" placeholder="السؤال الأول؟\nالسؤال الثاني؟\nالسؤال الثالث؟"></textarea></div>' +
      '<button type="button" id="cmsAddSurveyBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ إنشاء الاستبيان</button>';

    function renderSurveysList() {
      var data = window.CMS.getSurveys();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد استبيانات بعد</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var s = data[i];
        var responses = s.responses || [];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div><div style="font-weight:600;font-size:0.85rem;color:var(--text)">📊 ' + escapeHtml(s.title) + '</div><div style="font-size:0.72rem;color:var(--muted)">' + (s.questions ? s.questions.length : 0) + ' سؤال | ' + responses.length + ' مشاركة</div></div>' +
          '<div style="display:flex;gap:0.3rem">' +
          (responses.length > 0 ? '<button class="btn btn-sm" onclick="alert(JSON.stringify(' + JSON.stringify(responses) + ',null,2))" style="background:transparent;color:var(--gold);border:1px solid var(--gold);padding:0.2rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer;font-family:var(--font)">📊</button>' : '') +
          '<button class="btn btn-sm" onclick="window.CMS.removeSurvey(' + s.id + ');renderSurveysList();showToast(\'تم حذف الاستبيان\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button>' +
          '</div></div></div>';
      }
      listContainer.innerHTML = html;
    }

    byId('cmsAddSurveyBtn').addEventListener('click', function() {
      var title = byId('cmsSurveyTitle').value.trim();
      var desc = byId('cmsSurveyDesc').value.trim();
      var questionsText = byId('cmsSurveyQuestions').value.trim();
      if (!title) { showToast('عنوان الاستبيان مطلوب', 'error'); return; }
      var questions = questionsText ? questionsText.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
      if (questions.length === 0) { showToast('أضف سؤالاً واحداً على الأقل', 'error'); return; }
      window.CMS.addSurvey({ title: title, description: desc, questions: questions, responses: [], published: true });
      byId('cmsSurveyTitle').value = '';
      byId('cmsSurveyDesc').value = '';
      byId('cmsSurveyQuestions').value = '';
      renderSurveysList();
      showToast('✅ تم إنشاء الاستبيان', 'success');
    });

    renderSurveysList();
  }

  /* --- REHABILITATION PROGRAM FORM --- */
  function renderRehabilitationForm() {
    var container = byId('cmsRehabForm');
    var listContainer = byId('cmsRehabList');
    if (!container || !listContainer) return;

    container.innerHTML =
      '<div class="form-group"><label>عنوان التقرير أو التحديث *</label><input type="text" id="cmsRehabTitle" class="cms-input" placeholder="مثال: تقرير الأسبوع الأول من البرنامج"></div>' +
      '<div class="form-group"><label>المحتوى</label><textarea id="cmsRehabContent" class="cms-input" style="min-height:100px" placeholder="محتوى التقرير..."></textarea></div>' +
      '<div class="form-group"><label>رابط المستند (PDF, DOCX)</label><input type="url" id="cmsRehabDocUrl" class="cms-input" placeholder="https://example.com/report.pdf"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
      '<div class="form-group"><label>النوع</label><select id="cmsRehabType" class="cms-input"><option value="تقرير">📋 تقرير</option><option value="تحديث">🔄 تحديث</option><option value="وثيقة">📄 وثيقة</option><option value="إنجاز">🏆 إنجاز</option></select></div>' +
      '<div class="form-group"><label>المرحلة</label><select id="cmsRehabStage" class="cms-input"><option value="المرحلة الأولى - التوعية داخل المؤسسة العقابية">المرحلة الأولى - التوعية</option><option value="المرحلة الثانية - التأهيل النفسي">المرحلة الثانية - التأهيل النفسي</option><option value="المرحلة الثالثة - التدريب المهني">المرحلة الثالثة - التدريب المهني</option><option value="المرحلة الرابعة - متابعة ما بعد الإفراج">المرحلة الرابعة - متابعة ما بعد الإفراج</option></select></div>' +
      '</div>' +
      '<button type="button" id="cmsAddRehabBtn" class="btn btn-primary" style="width:100%;justify-content:center">➕ نشر التقرير</button>';

    window.renderRehabList = function() {
      var data = window.CMS.getRehabilitation();
      if (data.length === 0) { listContainer.innerHTML = '<div style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">لا توجد تقارير بعد. أضف أول تقرير!</div>'; return; }
      var html = '';
      for (var i = data.length - 1; i >= 0; i--) {
        var r = data[i];
        html += '<div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.5rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600;font-size:0.85rem;color:var(--text)">' + (r.typeIcon || '📋') + ' ' + escapeHtml(r.title) + '</div>' +
          '<div style="font-size:0.72rem;color:var(--gold);margin-top:0.15rem">' + escapeHtml(r.stage || '') + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.3rem">' + (r.content ? escapeHtml(r.content).substring(0, 100) + (r.content.length > 100 ? '...' : '') : '') + '</div>' +
          '<div style="font-size:0.7rem;color:var(--muted);margin-top:0.2rem">' + new Date(r.createdAt).toLocaleDateString('ar-DZ',{year:'numeric',month:'long',day:'numeric'}) + '</div></div>' +
          '<div style="display:flex;gap:0.3rem;flex-shrink:0">' +
          '<button class="btn btn-sm" onclick="window.CMS.removeRehabilitation(' + r.id + ');window.renderRehabList();showToast(\'تم حذف التقرير\',\'info\')" style="background:transparent;color:var(--danger);border:1px solid var(--danger);padding:0.2rem 0.4rem;font-size:0.6rem;border-radius:4px;cursor:pointer;font-family:var(--font)">🗑️</button>' +
          '</div></div></div>';
      }
      listContainer.innerHTML = html;
    };

    byId('cmsAddRehabBtn').addEventListener('click', function() {
      var title = byId('cmsRehabTitle').value.trim();
      var content = byId('cmsRehabContent').value.trim();
      var docUrl = byId('cmsRehabDocUrl').value.trim();
      var type = byId('cmsRehabType').value;
      var stage = byId('cmsRehabStage').value;
      if (!title) { showToast('عنوان التقرير مطلوب', 'error'); return; }
      window.CMS.addRehabilitation({ title: title, content: content, docUrl: docUrl, type: type, stage: stage, published: true });
      byId('cmsRehabTitle').value = '';
      byId('cmsRehabContent').value = '';
      byId('cmsRehabDocUrl').value = '';
      window.renderRehabList();
      showToast('✅ تم نشر التقرير', 'success');
    });

    renderRehabList();
  }

  /* --- CALENDAR VIEW --- */
  function renderCalendarView() {
    var container = byId('cmsCalendarView');
    if (!container) return;
    var events = JSON.parse(localStorage.getItem('bba_events') || '[]');
    var today = new Date();
    var monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var currentMonth = today.getMonth();
    var currentYear = today.getFullYear();

    var html = '<div style="text-align:center;margin-bottom:1rem"><span style="font-size:1.25rem;font-weight:700;color:var(--gold)">' + monthNames[currentMonth] + ' ' + currentYear + '</span></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:1rem">';
    var dayNames = ['ح','ن','ث','ر','خ','ج','س'];
    for (var d = 0; d < 7; d++) { html += '<div style="text-align:center;padding:0.3rem;font-size:0.7rem;color:var(--muted);font-weight:600">' + dayNames[d] + '</div>'; }

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (var pad = 0; pad < firstDay; pad++) { html += '<div></div>'; }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var dayEvents = [];
      for (var e = 0; e < events.length; e++) {
        if (events[e].date === dateStr && events[e].status === 'open') dayEvents.push(events[e]);
      }
      var isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      html += '<div style="text-align:center;padding:0.4rem 0.2rem;border-radius:var(--radius-sm);background:' + (isToday ? 'var(--gold-light)' : 'transparent') + ';border:' + (isToday ? '1px solid var(--gold)' : '1px solid transparent') + ';position:relative;min-height:40px">' +
        '<div style="font-size:0.78rem;color:' + (isToday ? 'var(--gold)' : 'var(--text)') + ';font-weight:' + (isToday ? '700' : '400') + '">' + d + '</div>' +
        (dayEvents.length > 0 ? '<div style="display:flex;justify-content:center;gap:2px;margin-top:2px">' + dayEvents.slice(0, 2).map(function() { return '<div style="width:6px;height:6px;border-radius:50%;background:var(--gold)"></div>'; }).join('') + '</div>' : '') +
        '</div>';
    }
    html += '</div>';

    /* List view of upcoming events */
    var upcoming = [];
    for (var e = 0; e < events.length; e++) {
      if (events[e].status === 'open') {
        var ed = new Date(events[e].date + 'T00:00:00');
        if (ed >= today) upcoming.push(events[e]);
      }
    }
    upcoming.sort(function(a,b) { return new Date(a.date) - new Date(b.date); });
    if (upcoming.length > 0) {
      html += '<div style="border-top:1px solid var(--border-light);padding-top:1rem;margin-top:0.5rem">';
      html += '<h4 style="font-size:0.85rem;color:var(--gold);margin-bottom:0.5rem">📅 الفعاليات القادمة</h4>';
      for (var e = 0; e < upcoming.length; e++) {
        html += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;font-size:0.8rem;color:var(--text)">' +
          '<span style="color:var(--gold)">' + (upcoming[e].typeIcon || '📅') + '</span>' +
          '<span>' + escapeHtml(upcoming[e].title) + '</span>' +
          '<span style="color:var(--muted);font-size:0.75rem">' + new Date(upcoming[e].date).toLocaleDateString('ar-DZ', {day:'numeric',month:'short'}) + '</span></div>';
      }
      html += '</div>';
    }

    container.innerHTML = '<div class="admin-card">' + html + '</div>';
  }

  /* ============================================================
   * INIT ALL CMS FORMS
   * ============================================================ */
  function initCMS() {
    renderHeroForm();
    renderNoticeBarForm();
    renderTestimonialForm();
    renderArticleForm();
    renderAnnouncementForm();
    renderGalleryForm();
    renderVideoForm();
    renderPartnerForm();
    renderFaqForm();
    renderLibraryForm();
    renderSurveyForm();
    renderRehabilitationForm();
    renderCalendarView();
  }

  /* Wait for DOM and admin auth */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCMS);
  } else {
    initCMS();
  }

  /* Also re-render when section becomes active (for calendar) */
  var observer = new MutationObserver(function() {
    var calSection = byId('cms-calendar');
    if (calSection && calSection.classList.contains('active')) {
      renderCalendarView();
    }
  });
  var sections = document.querySelectorAll('.admin-section');
  for (var i = 0; i < sections.length; i++) {
    observer.observe(sections[i], { attributes: true, attributeFilter: ['class'] });
  }

})();
