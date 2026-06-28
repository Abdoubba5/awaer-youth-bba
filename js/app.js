/* ============================================================
   منصة وعي الشباب BBA - Dz Young Leaders
   Frontend Application Script
   Version: 2.0.0
   ============================================================ */

/**
 * ============================================================
 * Cross-browser compatible helper utilities
 * ============================================================ */
function qsAll(selector, callback) {
  var nodes = document.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    callback(nodes[i], i);
  }
}
function byId(id) {
  return document.getElementById(id);
}
function escapeHtml(t) {
  if (!t) return '';
  var d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

/**
 * ============================================================
 * NAVIGATION SYSTEM
 * ============================================================ */
(function initNavigation() {
  var links = document.querySelectorAll('.nav-links a, .nav-mobile a');
  qsAll('.nav-links a, .nav-mobile a', function(link) {
    var href = link.getAttribute('href');
    if (href === '#hero' || href === '#' || href === '') {
      link.classList.add('active');
    }
    if (href && href.charAt(0) === '#') {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        qsAll('.nav-links a, .nav-mobile a', function(navLink) {
          navLink.classList.remove('active');
        });
        this.classList.add('active');
        var target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
})();

/**
 * ============================================================
 * ARTICLES DATA - 6 Complete Awareness Articles
 * Each article has full educational content, date, reading time
 * ============================================================ */
var ARTICLES = [
  {
    id: 1,
    title: 'المخدرات الرقمية: حقائق وأخطار',
    category: 'توعية رقمية',
    date: '2026-01-15',
    readingTime: '5 دقائق',
    summary: 'تعرف على حقيقة ما يسمى بالمخدرات الرقمية وتأثيرها على الدماغ، وكيف يمكن للشباب حماية أنفسهم من هذه الظاهرة الحديثة.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
    content: '<h4>ما هي المخدرات الرقمية؟</h4><p>المخدرات الرقمية (أو ما يُعرف بـ "I-Doser") هي ملفات صوتية تستخدم تقنية النبضات بكلتا الأذنين (Binaural Beats) التي تزعم أنها تحاكي تأثير المواد المخدرة على الدماغ. تنتشر هذه الظاهرة عبر الإنترنت والتطبيقات المختلفة.</p><h4>الحقيقة العلمية</h4><p>الدراسات العلمية لم تثبت بشكل قاطع أن هذه المؤثرات الصوتية تسبب إدماناً كيميائياً كالمخدرات التقليدية. لكنها قد تؤدي إلى:</p><ul><li>تغيير مؤقت في موجات الدماغ</li><li>الشعور بالدوار أو القلق لدى بعض الأشخاص</li><li>تأثير نفسي يعتمد على الإيحاء والإعتقاد المسبق</li></ul><h4>الخطر الحقيقي</h4><p>الخطر الأكبر للمخدرات الرقمية يكمن في أنها قد تكون بوابة لتجربة المخدرات الحقيقية. إدمان الأجهزة الرقمية بحد ذاته مشكلة سلوكية تستحق الاهتمام والعلاج.</p><h4>نصائح للوقاية</h4><ul><li>الوعي بمخاطر المحتوى الرقمي غير الموثوق</li><li>تحديد وقت استخدام الأجهزة الإلكترونية</li><li>ممارسة الأنشطة البديلة مثل الرياضة والفنون</li><li>التحدث مع الأهل أو المختصين عند الشعور بالقلق</li></ul>'
  },
  {
    id: 2,
    title: 'الصحة النفسية للشباب: دليل العناية الذاتية',
    category: 'صحة نفسية',
    date: '2026-02-01',
    readingTime: '7 دقائق',
    summary: 'استراتيجيات عملية للحفاظ على صحتك النفسية في عالم مليء بالتحديات. تعلم كيفية التعرف على علامات الإنذار المبكر.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
    content: '<h4>أهمية الصحة النفسية للشباب</h4><p>تمثل الصحة النفسية جزءاً أساسياً من الصحة العامة، خاصة في مرحلة الشباب حيث تتشكل الشخصية وتواجه تحديات النمو والتغيرات الحياتية. العناية بالصحة النفسية ليست ترفاً بل ضرورة.</p><h4>علامات الإنذار المبكر</h4><ul><li>تغيرات مفاجئة في المزاج أو السلوك</li><li>الانسحاب الاجتماعي والعزلة</li><li>اضطرابات في النوم أو الأكل</li><li>صعوبة في التركيز أو اتخاذ القرارات</li><li>مشاعر مستمرة من الحزن أو القلق</li></ul><h4>استراتيجيات العناية الذاتية</h4><ul><li><strong>الروتين اليومي:</strong> تنظيم وقت النوم والاستيقاظ والوجبات</li><li><strong>النشاط البدني:</strong> ممارسة الرياضة 30 دقيقة يومياً</li><li><strong>التواصل الاجتماعي:</strong> الحفاظ على علاقات صحية مع الأهل والأصدقاء</li><li><strong>التعبير عن المشاعر:</strong> الكتابة أو الرسم أو التحدث مع شخص موثوق</li><li><strong>طلب المساعدة:</strong> التوجه للمختص النفسي عند الحاجة دون تردد</li></ul><h4>متى تطلب المساعدة المهنية؟</h4><p>إذا استمرت الأعراض لأكثر من أسبوعين، أو أثرت على أدائك الدراسي أو المهني، أو شعرت بعدم القدرة على التعامل مع المشاعر، فلا تتردد في طلب المساعدة من أخصائي نفسي. طلب المساعدة دليل قوة وليس ضعف.</p>'
  },
  {
    id: 3,
    title: 'كيف تقول لا للمخدرات بثقة',
    category: 'مهارات حياتية',
    date: '2026-02-20',
    readingTime: '4 دقائق',
    summary: 'تدرب على مهارات الرفض الفعال وكيفية مقاومة ضغط الأقران. قوة الشخصية تبدأ بكلمة "لا" واثقة.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop',
    content: '<h4>لماذا يصعب قول "لا"؟</h4><p>الخوف من الرفض الاجتماعي أو الرغبة في الانتماء للمجموعة يدفع الكثير من الشباب لقبول أشياء يعرفون أنها ضارة. تذكر أن أصدقاءك الحقيقيين هم من يحترمون قراراتك.</p><h4>استراتيجيات الرفض الفعال</h4><ul><li><strong>الرفض المباشر:</strong> "لا شكراً، هذا ليس مناسباً لي"</li><li><strong>الرفض مع تقديم بديل:</strong> "لا، لكن يمكننا الذهاب للعب كرة القدم بدلاً من ذلك"</li><li><strong>الانسحاب الذكي:</strong> "عذراً، يجب أن أذهب الآن" ثم المغادرة</li><li><strong>استخدام الفكاهة:</strong> "لا، جسمي يحتاج كل خلاياه السليمة!"</li><li><strong>تكرار الرفض:</strong> الاستمرار في قول "لا" دون تبرير مفرط</li></ul><h4>كيف تبني ثقتك بنفسك؟</h4><ul><li>تعرف على قيمك ومبادئك والتزم بها</li><li>اختر أصدقاء يشاركونك نفس القيم</li><li>طور مهاراتك واهتماماتك الشخصية</li><li>تعلم قول "لا" في مواقف بسيطة يومياً</li><li>كافئ نفسك كلما تمكنت من مقاومة الضغط</li></ul><p>تذكر أن قراراتك اليوم تشكل مستقبلك. كل مرة تقول فيها "لا" للمخدرات، أنت تقول "نعم" لحياتك وصحتك وأهدافك المستقبلية.</p>'
  },
  {
    id: 4,
    title: 'الرياضة: سلاحك ضد الإدمان',
    category: 'نمط حياة صحي',
    date: '2026-03-10',
    readingTime: '6 دقائق',
    summary: 'اكتشف كيف يمكن للنشاط البدني المنتظم أن يكون درعاً واقياً ضد الوقوع في فخ الإدمان.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
    content: '<h4>العلاقة بين الرياضة والوقاية من الإدمان</h4><p>النشاط البدني المنتظم يحفز إفراز هرمونات السعادة (الإندورفين) والدوبامين بطريقة طبيعية وصحية، مما يقلل الحاجة للبحث عن مصادر خارجية للمتعة والتخفيف من التوتر.</p><h4>الفوائد الوقائية للرياضة</h4><ul><li><strong>تحسين المزاج:</strong> ممارسة الرياضة تطلق الإندورفين الذي يحسن المزاج ويقلل القلق</li><li><strong>بناء الثقة:</strong> الإنجازات الرياضية تعزز الثقة بالنفس وتقدير الذات</li><li><strong>تنظيم الوقت:</strong> الالتزام برياضة منتظمة يملأ وقت الفراغ بنشاط مفيد</li><li><strong>التواصل الاجتماعي:</strong> الانضمام لأندية رياضية يوفر بيئة اجتماعية صحية</li><li><strong>تعلم الانضباط:</strong> الرياضة تعلم الالتزام والصبر وتحقيق الأهداف</li></ul><h4>أفضل الرياضات للشباب</h4><p>يمكنك اختيار الرياضة التي تناسب اهتماماتك: كرة القدم، السباحة، الجري، رفع الأثقال، الفنون القتالية، أو حتى المشي السريع 30 دقيقة يومياً. المهم هو الاستمرارية وليس الشدة.</p><h4>نصيحة للبدء</h4><p>ابدأ تدريجياً، حدد أهدافاً واقعية، ابحث عن صديق لممارسة الرياضة معاً، وسجل تقدمك. تذكر أن الرياضة ليست مجرد نشاط بدني، بل هي أسلوب حياة صحي يحميك من الكثير من المشاكل الصحية والنفسية.</p>'
  },
  {
    id: 5,
    title: 'علامات التحذير: متى تطلب المساعدة؟',
    category: 'وقاية',
    date: '2026-03-25',
    readingTime: '5 دقائق',
    summary: 'دليل شامل للتعرف على العلامات المبكرة لتعاطي المخدرات لدى الأصدقاء وأفراد الأسرة.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
    content: '<h4>لماذا التعرف المبكر مهم؟</h4><p>التعرف على العلامات المبكرة لتعاطي المخدرات يمكن أن ينقذ حياة شخص عزيز. التدخل المبكر يزيد فرص العلاج بنسبة تتجاوز 70% مقارنة بالحالات المتأخرة.</p><h4>العلامات الجسدية</h4><ul><li>احمرار العينين أو اتساع أو ضيق حدقة العين</li><li>تغيرات مفاجئة في الوزن (زيادة أو نقصان)</li><li>إهمال المظهر الشخصي والنظافة</li><li>رائحة غير معتادة في الملابس أو النفس</li><li>اضطرابات في النوم (أرق أو نوم مفرط)</li></ul><h4>العلامات السلوكية</h4><ul><li>السرية المفرطة بشأن الأنشطة والأصدقاء</li><li>طلب المزيد من المال دون سبب واضح</li><li>الغياب المتكرر عن المدرسة أو العمل</li><li>تغير مجموعة الأصدقاء بشكل مفاجئ</li><li>فقدان الاهتمام بالهوايات والأنشطة السابقة</li></ul><h4>العلامات النفسية</h4><ul><li>تقلبات مزاجية حادة ومفاجئة</li><li>التهيج والعصبية الزائدة</li><li>الاكتئاب أو القلق غير المبرر</li><li>صعوبة في التركيز وضعف الذاكرة</li><li>الشعور بالاضطهاد أو الشك الزائد</li></ul><h4>كيف تتصرف إذا لاحظت هذه العلامات؟</h4><p>تحدث بهدوء ودون اتهام، استمع أكثر مما تتكلم، قدم الدعم والمساندة، وشجع الشخص على طلب المساعدة المهنية. يمكنك الاتصال بخطوط المساعدة المتخصصة للحصول على إرشادات إضافية.</p>'
  },
  {
    id: 6,
    title: 'الإدمان الرقمي وعلاقته بالمخدرات',
    category: 'توعية',
    date: '2026-04-08',
    readingTime: '6 دقائق',
    summary: 'دراسة العلاقة بين إدمان الأجهزة الرقمية والميول لتعاطي المخدرات، وكيفية تحقيق التوازن الرقمي.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=250&fit=crop',
    content: '<h4>ما هو الإدمان الرقمي؟</h4><p>الإدمان الرقمي هو الاستخدام القهري المفرط للأجهزة الإلكترونية (الهواتف الذكية، الحواسيب، ألعاب الفيديو) بشكل يؤثر سلباً على الحياة اليومية والعلاقات الاجتماعية والصحة النفسية.</p><h4>العلاقة بين الإدمان الرقمي وتعاطي المخدرات</h4><p>الأبحاث العلمية تشير إلى وجود صلة بين الإدمان الرقمي وتعاطي المخدرات من خلال:</p><ul><li><strong>آلية الدماغ نفسها:</strong> كلا النوعين من الإدمان يحفزان نفس مراكز المكافأة في الدماغ</li><li><strong>الهروب من الواقع:</strong> الإدمان الرقمي قد يكون وسيلة للهروب من المشاكل، وهي نفس الآلية في تعاطي المخدرات</li><li><strong>تأثير العزلة:</strong> قضاء ساعات طويلة أمام الشاشات يؤدي للعزلة الاجتماعية التي تزيد خطر تعاطي المخدرات</li></ul><h4>كيف تحقق التوازن الرقمي؟</h4><ul><li>حدد أوقاتاً محددة لاستخدام الأجهزة الإلكترونية</li><li>أوقف الإشعارات غير الضرورية</li><li>خصص وقتاً خالياً من الشاشات قبل النوم بساعة</li><li>ابحث عن أنشطة بديلة: القراءة، الرياضة، المشي في الطبيعة</li><li>استخدم تطبيقات مراقبة وقت الشاشة</li></ul><h4>متى يصبح الاستخدام إدماناً؟</h4><p>عندما تفقد السيطرة على وقت الاستخدام، وتشعر بالقلق عند عدم توفر الجهاز، وتهمل واجباتك وعلاقاتك، وتفشل في محاولات التقليل من الاستخدام، عندها قد تكون مصاباً بالإدمان الرقمي وتحتاج لطلب المساعدة.</p>'
  }
];

/**
 * ============================================================
 * ARTICLES RENDERER + FULL ARTICLE MODAL
 * Renders article cards and shows full article on click
 * ============================================================ */
(function renderArticles() {
  var grid = byId('awarenessGrid');
  if (!grid) return;

  var html = '';
  for (var i = 0; i < ARTICLES.length; i++) {
    var a = ARTICLES[i];
    html += '<article class="article-card fade-in-up" style="animation-delay:' + (a.id * 0.1) + 's">' +
      '<img class="article-img" src="' + a.image + '" alt="' + a.title + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22 fill=%22%230b101b%22/%3E\'">' +
      '<div class="article-body">' +
      '<span class="article-category">' + a.category + '</span>' +
      '<h3>' + a.title + '</h3>' +
      '<div style="display:flex;gap:0.75rem;font-size:0.75rem;color:var(--muted);margin-bottom:0.5rem">' +
      '<span>📅 ' + a.date + '</span>' +
      '<span>⏱ ' + a.readingTime + '</span>' +
      '</div>' +
      '<p>' + a.summary + '</p>' +
      '<button type="button" class="btn btn-secondary btn-sm read-more-btn" data-id="' + a.id + '">قراءة المزيد</button>' +
      '</div>' +
      '</article>';
  }
  grid.innerHTML = html;

  qsAll('.read-more-btn', function(btn) {
    btn.addEventListener('click', function() {
      var id = parseInt(this.getAttribute('data-id'), 10);
      for (var j = 0; j < ARTICLES.length; j++) {
        if (ARTICLES[j].id === id) {
          openArticleModal(ARTICLES[j]);
          break;
        }
      }
    });
  });
})();

/**
 * Open full article modal with complete content
 */
function openArticleModal(article) {
  var modal = byId('articleModal');
  var body = byId('articleModalBody');
  if (!modal || !body) return;

  var statusClass = 'status-' + (article.category === 'وقاية' ? 'rejected' : article.category === 'صحة نفسية' ? 'approved' : 'pending');
  body.innerHTML =
    '<div style="margin-bottom:1rem">' +
    '<img src="' + article.image + '" alt="' + article.title + '" style="width:100%;height:240px;object-fit:cover;border-radius:var(--radius-md);background:var(--surface-solid)">' +
    '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">' +
    '<span class="badge badge-pending" style="font-size:0.75rem">' + article.category + '</span>' +
    '<span style="font-size:0.8rem;color:var(--muted)">📅 ' + article.date + '</span>' +
    '<span style="font-size:0.8rem;color:var(--muted)">⏱ ' + article.readingTime + '</span>' +
    '</div>' +
    '<h3 style="margin-bottom:1rem;color:var(--gold);font-size:1.25rem">' + article.title + '</h3>' +
    '<div class="article-content">' + article.content + '</div>';

  modal.classList.add('active');
}

/**
 * ============================================================
 * TOAST NOTIFICATION SYSTEM
 * ============================================================ */
var TOAST_DURATION = 4000;

function showToast(message, type) {
  type = type || 'info';
  var container = byId('toastContainer');
  if (!container) return;

  var icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
    '<span class="toast-message">' + message + '</span>';

  container.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('toast-exit');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, TOAST_DURATION);
}
window.showToast = showToast;

/**
 * ============================================================
 * TRACKING CODE GENERATOR
 * ============================================================ */
function generateTrackingCode() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var randomValues;
  try {
    randomValues = new Uint8Array(8);
    window.crypto.getRandomValues(randomValues);
    console.log('[FORM DEBUG] Tracking code: crypto.getRandomValues succeeded');
  } catch (e) {
    /* Fallback for mobile browsers without crypto.getRandomValues */
    console.warn('[FORM DEBUG] crypto.getRandomValues failed on mobile, using Math.random fallback:', e.message);
    randomValues = new Uint8Array(8);
    for (var fi = 0; fi < 8; fi++) {
      randomValues[fi] = Math.floor(Math.random() * 256);
    }
  }
  var part1 = '';
  var part2 = '';
  for (var i = 0; i < 4; i++) {
    part1 += chars[randomValues[i] % chars.length];
    part2 += chars[randomValues[i + 4] % chars.length];
  }
  return 'BBA-' + part1 + '-' + part2;
}

/**
 * ============================================================
 * CONSULTATION FORM
 * ============================================================ */
(function initConsultationForm() {
  console.log('[FORM DEBUG] initConsultationForm: starting');
  var form = byId('consultationForm');
  if (!form) {
    console.warn('[FORM DEBUG] initConsultationForm: form element #consultationForm not found');
    return;
  }
  console.log('[FORM DEBUG] initConsultationForm: form found, mounting rate limiter');

  /* Mount rate limit indicator once */
  if (window.BBA && window.BBA.RateLimitIndicator) {
    window.BBA.RateLimitIndicator.mount('consultRateLimitIndicator', 'consultation');
    console.log('[FORM DEBUG] Rate limit indicator mounted for consultation');
  } else {
    console.warn('[FORM DEBUG] RateLimitIndicator not available');
  }

  form.addEventListener('submit', async function(e) {
    console.log('[FORM DEBUG] 🟢 CONSULTATION FORM SUBMIT TRIGGERED');
    console.log('[FORM DEBUG] Event type:', e.type);
    console.log('[FORM DEBUG] Event target:', e.target.id);

    /* Must be called first — critical for mobile */
    e.preventDefault();
    console.log('[FORM DEBUG] e.preventDefault() called');

    /* Rate limit check */
    if (window.BBA && window.BBA.RateLimiter) {
      var rl = window.BBA.RateLimiter.check('consultation');
      console.log('[FORM DEBUG] Rate limit check result:', rl);
      if (!rl.allowed) {
        console.warn('[FORM DEBUG] Rate limit BLOCKED:', rl.message);
        showToast(rl.message, 'error');
        return;
      }
    } else {
      console.warn('[FORM DEBUG] RateLimiter not available — skipping rate check');
    }

    /* Collect form field values */
    var aliasEl = byId('consultAlias');
    var ageEl = byId('consultAge');
    var subjectEl = byId('consultSubject');
    var messageEl = byId('consultMessage');

    if (!aliasEl) { console.error('[FORM DEBUG] consultAlias element not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!ageEl) { console.error('[FORM DEBUG] consultAge element not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!subjectEl) { console.error('[FORM DEBUG] consultSubject element not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!messageEl) { console.error('[FORM DEBUG] consultMessage element not found'); showToast('خطأ في النموذج', 'error'); return; }

    var formData = {
      alias: aliasEl.value.trim(),
      ageGroup: ageEl.value,
      subject: subjectEl.value.trim(),
      message: messageEl.value.trim(),
      date: new Date().toISOString(),
      status: 'pending',
      specialistResponse: '',
      extraNotes: '',
      lastUpdated: ''
    };
    console.log('[FORM DEBUG] Collected form data:', { alias: formData.alias ? '✓' : '✗', ageGroup: formData.ageGroup ? '✓' : '✗', subject: formData.subject ? '✓' : '✗', message: formData.message ? '✓' : '✗' });

    /* Validate required fields */
    if (!formData.alias || !formData.ageGroup || !formData.subject || !formData.message) {
      console.warn('[FORM DEBUG] Validation FAILED — missing required fields');
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    if (formData.subject.length < 3) {
      console.warn('[FORM DEBUG] Validation FAILED — subject too short:', formData.subject.length);
      showToast('عنوان الاستشارة قصير جداً (3 أحرف على الأقل)', 'error');
      return;
    }
    if (formData.message.length < 10) {
      console.warn('[FORM DEBUG] Validation FAILED — message too short:', formData.message.length);
      showToast('الرسالة قصيرة جداً (10 أحرف على الأقل)', 'error');
      return;
    }
    console.log('[FORM DEBUG] Validation PASSED');

    /* Generate tracking code */
    formData.trackingCode = generateTrackingCode();
    console.log('[FORM DEBUG] Tracking code generated:', formData.trackingCode);

    /* ONLINE-FIRST INSERT: Try Supabase first, fall back to localStorage */
    console.log('[FORM DEBUG] Calling DB.insertConsultation()');
    var insertResult;

    if (window.BBA && window.BBA.DB && window.BBA.DB.insertConsultation) {
      try {
        insertResult = await window.BBA.DB.insertConsultation(formData);
        console.log('[FORM DEBUG] insertConsultation result:', insertResult);
      } catch (e) {
        console.error('[FORM DEBUG] insertConsultation THREW:', e.message);
        /* Emergency fallback — direct localStorage write */
        try {
          var emergency = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
          emergency.push(formData);
          localStorage.setItem('bba_consultations', JSON.stringify(emergency));
          insertResult = { success: true, source: 'localStorage_emergency' };
          console.log('[FORM DEBUG] Emergency localStorage save succeeded');
        } catch (e2) {
          console.error('[FORM DEBUG] ❌ Emergency localStorage save FAILED:', e2.message);
          showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
          return;
        }
      }
    } else {
      /* DB module not loaded — direct localStorage fallback */
      console.warn('[FORM DEBUG] BBA.DB.insertConsultation not available, using direct localStorage');
      try {
        var fallback = JSON.parse(localStorage.getItem('bba_consultations') || '[]');
        fallback.push(formData);
        localStorage.setItem('bba_consultations', JSON.stringify(fallback));
        insertResult = { success: true, source: 'localStorage_direct' };
      } catch (e) {
        console.error('[FORM DEBUG] ❌ Direct localStorage save FAILED:', e.message);
        showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
        return;
      }
    }

    if (insertResult && insertResult.source === 'supabase') {
      console.log('[FORM DEBUG] ✅ Saved DIRECTLY to Supabase (volunteers table)');
    } else if (insertResult && insertResult.source === 'localStorage') {
      console.log('[FORM DEBUG] ⏳ Saved to localStorage (offline queue). Will sync when online.');
    }

    if (!insertResult || !insertResult.success) {
      console.error('[FORM DEBUG] ❌ All save methods failed');
      showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
      return;
    }

    /* Record this attempt in rate limiter */
    if (window.BBA && window.BBA.RateLimiter) {
      window.BBA.RateLimiter.record('consultation');
      console.log('[FORM DEBUG] Rate limit recorded');
    }

    /* Update UI */
    var tcEl = byId('trackingCode');
    if (tcEl) {
      tcEl.textContent = formData.trackingCode;
      console.log('[FORM DEBUG] Tracking code displayed');
    } else {
      console.warn('[FORM DEBUG] trackingCode element not found');
    }
    var tCont = byId('trackingContainer');
    if (tCont) {
      tCont.classList.add('visible');
      console.log('[FORM DEBUG] Tracking container shown');
    }

    try {
      form.reset();
      console.log('[FORM DEBUG] Form reset');
    } catch (e) {
      console.warn('[FORM DEBUG] form.reset() error:', e);
    }

    showToast('تم إرسال استشارتك بنجاح! رمز المتابعة الخاص بك:', 'success');
    console.log('[FORM DEBUG] 🟢 CONSULTATION FORM SUBMIT COMPLETE — SUCCESS');
  });

  console.log('[FORM DEBUG] Consultation form submit listener attached');

  var copyBtn = byId('copyCodeBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      var code = byId('trackingCode').textContent;
      if (!code || code === 'BBA-XXXX-XXXX') return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function() {
          showToast('تم نسخ رمز المتابعة بنجاح ✓', 'success');
        }).catch(function() {
          fallbackCopy(code);
        });
      } else {
        fallbackCopy(code);
      }
    });
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('تم نسخ رمز المتابعة بنجاح ✓', 'success');
    } catch (err) {
      showToast('تعذر النسخ، يرجى نسخ الرمز يدوياً', 'error');
    }
    document.body.removeChild(textarea);
  }

  console.log('[FORM DEBUG] initConsultationForm: complete');
})();



/**
 * ============================================================
 * VOLUNTEER REGISTRATION FORM
 * ============================================================ */
(function initVolunteerForm() {
  console.log('[FORM DEBUG] initVolunteerForm: starting');
  var form = byId('volunteerForm');
  if (!form) {
    console.warn('[FORM DEBUG] initVolunteerForm: form element #volunteerForm not found');
    return;
  }
  console.log('[FORM DEBUG] initVolunteerForm: form found');

  var MUNICIPALITIES = [
    'أولاد براهم', 'أولاد دحمان', 'أولاد سيدي إبراهيم', 'برج الغدير',
    'برج بوعريريج', 'برج زمورة', 'بئر قصد علي', 'بن داود',
    'تاسمرت', 'تقلعيت', 'تكستار', 'تفرق',
    'ثنية النصر', 'جعافرة', 'حرازة', 'الحمادية',
    'حسناوة', 'خليل', 'رأس الوادي', 'الرفراف',
    'الرابطة', 'العناصر', 'العش', 'القلة',
    'القصور', 'الماين', 'مجانة', 'المهير',
    'المنصورة', 'الياشير', 'سيدي امبارك', 'عين تاغروت',
    'عين تسرة', 'غيلاسة'
  ];

  var munSelect = byId('volunteerMunicipality');
  if (munSelect) {
    for (var i = 0; i < MUNICIPALITIES.length; i++) {
      var option = document.createElement('option');
      option.value = MUNICIPALITIES[i];
      option.textContent = MUNICIPALITIES[i];
      munSelect.appendChild(option);
    }
    console.log('[FORM DEBUG] Populated ' + MUNICIPALITIES.length + ' municipalities');
  } else {
    console.warn('[FORM DEBUG] volunteerMunicipality select not found');
  }

  var membershipOptions = document.querySelectorAll('.membership-option');
  var selectedMembership = null;
  console.log('[FORM DEBUG] Membership options found: ' + membershipOptions.length);

  for (var j = 0; j < membershipOptions.length; j++) {
    membershipOptions[j].addEventListener('click', function() {
      for (var k = 0; k < membershipOptions.length; k++) {
        membershipOptions[k].classList.remove('selected');
      }
      this.classList.add('selected');
      selectedMembership = this.getAttribute('data-value');
      console.log('[FORM DEBUG] Membership selected:', selectedMembership);
    });
  }

  /* Mount rate limit indicator once */
  if (window.BBA && window.BBA.RateLimitIndicator) {
    window.BBA.RateLimitIndicator.mount('volunteerRateLimitIndicator', 'volunteer_registration');
    console.log('[FORM DEBUG] Rate limit indicator mounted for volunteer_registration');
  } else {
    console.warn('[FORM DEBUG] RateLimitIndicator not available');
  }

  form.addEventListener('submit', async function(e) {
    console.log('[FORM DEBUG] 🟢 VOLUNTEER FORM SUBMIT TRIGGERED');
    console.log('[FORM DEBUG] Event type:', e.type);
    console.log('[FORM DEBUG] Event target:', e.target.id);

    /* Must be called first — critical for mobile */
    e.preventDefault();
    console.log('[FORM DEBUG] e.preventDefault() called');

    /* Rate limit check */
    if (window.BBA && window.BBA.RateLimiter) {
      var rl = window.BBA.RateLimiter.check('volunteer_registration');
      console.log('[FORM DEBUG] Rate limit check result:', rl);
      if (!rl.allowed) {
        console.warn('[FORM DEBUG] Rate limit BLOCKED:', rl.message);
        showToast(rl.message, 'error');
        return;
      }
    } else {
      console.warn('[FORM DEBUG] RateLimiter not available — skipping rate check');
    }

    /* Collect form field values with defensive element checks */
    var nameEl = byId('volunteerName');
    var emailEl = byId('volunteerEmail');
    var phoneEl = byId('volunteerPhone');
    var munEl = byId('volunteerMunicipality');
    var motEl = byId('volunteerMotivation');

    if (!nameEl) { console.error('[FORM DEBUG] volunteerName not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!emailEl) { console.error('[FORM DEBUG] volunteerEmail not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!phoneEl) { console.error('[FORM DEBUG] volunteerPhone not found'); showToast('خطأ في النموذج', 'error'); return; }
    if (!munEl) { console.error('[FORM DEBUG] volunteerMunicipality not found'); showToast('خطأ في النموذج', 'error'); return; }

    var volunteer = {
      fullName: nameEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      municipality: munEl.value,
      membershipType: selectedMembership || '',
      motivation: motEl ? motEl.value.trim() : '',
      status: 'pending',
      suspended: false,
      volunteerId: '',
      date: new Date().toISOString()
    };
    console.log('[FORM DEBUG] Collected form data:', {
      fullName: volunteer.fullName ? '✓' : '✗',
      email: volunteer.email ? '✓' : '✗',
      phone: volunteer.phone ? '✓' : '✗',
      municipality: volunteer.municipality ? '✓' : '✗',
      membershipType: volunteer.membershipType ? '✓' : '✗'
    });

    /* Validate required fields */
    if (!volunteer.fullName || !volunteer.email || !volunteer.phone ||
        !volunteer.municipality || !volunteer.membershipType) {
      console.warn('[FORM DEBUG] Validation FAILED — missing required fields');
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    if (volunteer.fullName.length < 3) {
      console.warn('[FORM DEBUG] Validation FAILED — name too short:', volunteer.fullName.length);
      showToast('الاسم الكامل يجب أن يكون 3 أحرف على الأقل', 'error');
      return;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(volunteer.email)) {
      console.warn('[FORM DEBUG] Validation FAILED — invalid email:', volunteer.email);
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }
    var phoneClean = volunteer.phone.replace(/\s/g, '').replace(/-/g, '');
    var phoneRegex = /^(05|06|07)\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      console.warn('[FORM DEBUG] Validation FAILED — invalid phone:', phoneClean);
      showToast('يرجى إدخال رقم هاتف جزائري صحيح (05XX-XX-XX-XX)', 'error');
      return;
    }
    console.log('[FORM DEBUG] Validation PASSED');

    /* ONLINE-FIRST INSERT: Try Supabase first, fall back to localStorage */
    console.log('[FORM DEBUG] Calling DB.insertVolunteer()');
    var insertResult;

    if (window.BBA && window.BBA.DB && window.BBA.DB.insertVolunteer) {
      try {
        insertResult = await window.BBA.DB.insertVolunteer(volunteer);
        console.log('[FORM DEBUG] insertVolunteer result:', insertResult);
      } catch (e) {
        console.error('[FORM DEBUG] insertVolunteer THREW:', e.message);
        /* Emergency fallback — direct localStorage write */
        try {
          var emergency = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
          emergency.push(volunteer);
          localStorage.setItem('bba_volunteers', JSON.stringify(emergency));
          insertResult = { success: true, source: 'localStorage_emergency' };
          console.log('[FORM DEBUG] Emergency localStorage save succeeded');
        } catch (e2) {
          console.error('[FORM DEBUG] ❌ Emergency localStorage save FAILED:', e2.message);
          showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
          return;
        }
      }
    } else {
      /* DB module not loaded — direct localStorage fallback */
      console.warn('[FORM DEBUG] BBA.DB.insertVolunteer not available, using direct localStorage');
      try {
        var fallback = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
        fallback.push(volunteer);
        localStorage.setItem('bba_volunteers', JSON.stringify(fallback));
        insertResult = { success: true, source: 'localStorage_direct' };
      } catch (e) {
        console.error('[FORM DEBUG] ❌ Direct localStorage save FAILED:', e.message);
        showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
        return;
      }
    }

    if (insertResult && insertResult.source === 'supabase') {
      console.log('[FORM DEBUG] ✅ Saved DIRECTLY to Supabase (volunteers table)');
    } else if (insertResult && insertResult.source === 'localStorage') {
      console.log('[FORM DEBUG] ⏳ Saved to localStorage (offline queue). Will sync when online.');
    }

    if (!insertResult || !insertResult.success) {
      console.error('[FORM DEBUG] ❌ All save methods failed');
      showToast('فشل في حفظ البيانات. يرجى المحاولة مرة أخرى.', 'error');
      return;
    }

    /* Record this attempt */
    if (window.BBA && window.BBA.RateLimiter) {
      window.BBA.RateLimiter.record('volunteer_registration');
      console.log('[FORM DEBUG] Rate limit recorded');
    }

    /* Reset form */
    try {
      form.reset();
      console.log('[FORM DEBUG] Form reset');
    } catch (e) {
      console.warn('[FORM DEBUG] form.reset() error:', e);
    }
    for (var m = 0; m < membershipOptions.length; m++) {
      membershipOptions[m].classList.remove('selected');
    }
    selectedMembership = null;

    showToast('تم تسجيلك كمتطوع بنجاح! سنتواصل معك قريباً ✓', 'success');
    console.log('[FORM DEBUG] 🟢 VOLUNTEER FORM SUBMIT COMPLETE — SUCCESS');
  });

  console.log('[FORM DEBUG] Volunteer form submit listener attached');
  console.log('[FORM DEBUG] initVolunteerForm: complete');
})();

/**
 * ============================================================
 * CONTACT SECTION - Email, WhatsApp, Call buttons
 * ============================================================ */
(function initContact() {
  var emailBtn = byId('contactEmailBtn');
  var waBtn = byId('contactWhatsAppBtn');
  var callBtns = document.querySelectorAll('.contact-call-btn');

  if (emailBtn) {
    emailBtn.addEventListener('click', function(e) {
      window.location.href = 'mailto:abdelilah.sidiali@univ-bba.dz?subject=' + encodeURIComponent('استفسار - منصة وعي الشباب BBA');
    });
  }

  if (waBtn) {
    waBtn.addEventListener('click', function(e) {
      window.open('https://wa.me/213540735461?text=' + encodeURIComponent('السلام عليكم، لدي استفسار بخصوص منصة وعي الشباب BBA'), '_blank');
    });
  }

  for (var i = 0; i < callBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        var phone = this.getAttribute('data-phone');
        if (phone) {
          window.location.href = 'tel:' + phone;
        }
      });
    })(callBtns[i]);
  }
})();

/**
 * ============================================================
 * SMOOTH SCROLL FOR ALL ANCHOR LINKS
 * ============================================================ */
(function initSmoothScroll() {
  var anchors = document.querySelectorAll('[href^="#"]');
  for (var i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', function(e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
})();

/**
 * ============================================================
 * ACTIVE NAV LINK ON SCROLL
 * ============================================================ */
(function initScrollSpy() {
  if (!window.IntersectionObserver) return;
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = '#' + entry.target.getAttribute('id');
        for (var i = 0; i < navLinks.length; i++) {
          navLinks[i].classList.remove('active');
          if (navLinks[i].getAttribute('href') === id) {
            navLinks[i].classList.add('active');
          }
        }
      }
    });
  }, { threshold: 0.3 });
  for (var i = 0; i < sections.length; i++) {
    observer.observe(sections[i]);
  }
})();

console.log('✅ منصة وعي الشباب BBA v2.0 loaded successfully');
