/* ============================================================
   Phase 4 Seed Data — Run this in browser console on the admin page
   Paste into Chrome DevTools Console while on http://localhost:3457/sidou-da.html
   Or load via: <script src="js/seed-phase4.js"></script>
   ============================================================ */
(function seedPhase4() {
  'use strict';

  function log(msg) { console.log('🌱 [Seed] ' + msg); }

  /* ============================
   * 1. ACADEMY COURSES
   * ============================ */
  log('Seeding academy courses...');
  var courses = [
    {
      id: Date.now() + 1, title: 'دورة الإسعافات الأولية', description: 'دورة تدريبية شاملة في الإسعافات الأولية والإنعاش القلبي الرئوي والتصرف في حالات الطوارئ. تشمل تمارين عملية وتطبيقات ميدانية.', instructor: 'د. عبد الرحمان بن عيسى', duration: 24, startDate: '2026-07-01', endDate: '2026-07-15', status: 'open', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2, title: 'مهارات التواصل الفعال', description: 'دورة تطوير الذات في مجال مهارات التواصل والإقناع والتحدث أمام الجمهور. موجهة للشباب الراغبين في تطوير قدراتهم القيادية.', instructor: 'أ. سارة بن محمد', duration: 16, startDate: '2026-06-20', endDate: '2026-06-30', status: 'in_progress', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 3, title: 'القيادة الشبابية والعمل التطوعي', description: 'برنامج تدريبي لتمكين الشباب من مهارات القيادة وإدارة الفرق التطوعية والتخطيط للأنشطة المجتمعية.', instructor: 'د. أحمد خليفة', duration: 30, startDate: '2026-05-01', endDate: '2026-05-20', status: 'completed', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 4, title: 'الصحة النفسية للشباب', description: 'دورة توعوية حول الصحة النفسية وإدارة الضغوط والقلق والاكتئاب لدى الشباب. استراتيجيات التعامل مع التحديات النفسية.', instructor: 'د. مريم بلقاسم', duration: 20, startDate: '2026-08-01', endDate: '2026-08-12', status: 'open', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 5, title: 'الوقاية من المخدرات الرقمية', description: 'دورة متخصصة في التعرف على المخدرات الرقمية وآثارها وطرق الوقاية منها. موجهة للأسر والمربين.', instructor: 'أ. خالد بوعبد الله', duration: 10, startDate: '2026-04-10', endDate: '2026-04-14', status: 'completed', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 6, title: 'ريادة الأعمال الاجتماعية', description: 'برنامج تدريبي لتأهيل الشباب في مجال ريادة الأعمال الاجتماعية وكيفية إطلاق مشاريع ذات أثر مجتمعي.', instructor: 'أ. نور الدين حمدي', duration: 40, startDate: '2026-09-01', endDate: '2026-09-20', status: 'open', createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem('bba_academy_courses', JSON.stringify(courses));
  log('✅ ' + courses.length + ' courses seeded');

  /* ============================
   * 2. MEDIA COVERAGE
   * ============================ */
  log('Seeding media coverage...');
  var media = [
    {
      id: Date.now() + 10, title: 'انطلاق حملة توعوية بمخاطر المخدرات في برج بوعريريج', description: 'جريدة النصر تتابع انطلاق الحملة التوعوية التي تنظمها منصة وعي الشباب BBA بالتعاون مع مديرية الشباب والرياضة.', source: 'جريدة', sourceName: 'جريدة النصر', url: '#', date: '2026-03-15', type: 'article', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 11, title: 'لقاء مع مؤسسي منصة وعي الشباب حول برنامج Dz Young Leaders', description: 'اللقاء الصحفي تناول أهداف البرنامج ومراحله وخططه المستقبلية في مجال التوعية بمخاطر المؤثرات العقلية.', source: 'تلفزيون', sourceName: 'القناة الإذاعية الأولى', url: '#', date: '2026-04-02', type: 'interview', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 12, title: 'تغطية اليوم التوعوي في ثانوية الشهيد برج بوعريريج', description: 'تقرير مصور عن اليوم التوعوي الذي نظمته المنصة في ثانوية الشهيد بحضور أكثر من 300 تلميذ.', source: 'موقع إلكتروني', sourceName: 'الجزائر اليوم', url: '#', date: '2026-04-20', type: 'report', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 13, title: 'حملة نظفوا المدينة بمشاركة 150 متطوعاً', description: 'مبادرة بيئية نظمها نادي وعي الشباب بمشاركة 150 متطوعاً في بلدية برج بوعريريج.', source: 'وسائل التواصل', sourceName: 'فيسبوك المنصة', url: '#', date: '2026-05-10', type: 'social', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 14, title: 'ورشة عمل حول الصحة النفسية للشباب', description: 'تقرير عن ورشة العمل التي نظمتها المنصة بمناسبة اليوم العالمي للصحة النفسية.', source: 'وكالة أنباء', sourceName: 'وكالة الأنباء الجزائرية', url: '#', date: '2026-05-25', type: 'report', createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 15, title: 'اختتام برنامج التطوع الصيفي', description: 'تغطية خاصة لحفل اختتام البرنامج التطوعي الصيفي الذي استمر ثلاثة أشهر بمشاركة 200 متطوع.', source: 'جريدة', sourceName: 'جريدة الشروق', url: '#', date: '2026-06-01', type: 'article', createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem('bba_media_coverage', JSON.stringify(media));
  log('✅ ' + media.length + ' media entries seeded');

  /* ============================
   * 3. CLUB DATA
   * ============================ */
  log('Seeding club data...');
  var clubData = {
    name: 'نادي وعي الشباب BBA',
    description: 'نادي شبابي يهدف إلى نشر الوعي بمخاطر المخدرات والمؤثرات العقلية وتعزيز الصحة النفسية لدى الشباب في ولاية برج بوعريريج. ينظم النادي أنشطة متنوعة تشمل الحملات التوعوية والورشات التدريبية واللقاءات الثقافية.',
    vision: 'نحو جيل واعٍ ومتمكن، خالٍ من المخدرات، قادر على المساهمة الفاعلة في بناء مجتمعه وقيادة التغيير الإيجابي.',
    membersCount: 187,
    registrationOpen: true,
    published: true,
    activities: [
      { title: 'حملة نظافة وتوعية في حديقة المدينة', date: '2026-01-15' },
      { title: 'ورشة رسم للأطفال حول مخاطر المخدرات', date: '2026-02-10' },
      { title: 'دورة تكوينية في الإسعافات الأولية', date: '2026-03-05' },
      { title: 'زيارة ميدانية لدار المسنين', date: '2026-03-20' },
      { title: 'حملة تشجير في بلدية المنصورة', date: '2026-04-12' },
      { title: 'ورشة فن الخط العربي', date: '2026-04-28' },
      { title: 'محاضرة عن الصحة النفسية للشباب', date: '2026-05-15' },
      { title: 'مشاركة في المهرجان الثقافي المحلي', date: '2026-06-01' },
      { title: 'حملة توعوية في الأسواق الأسبوعية', date: '2026-06-15' },
      { title: 'تنظيم يوم رياضي للشباب', date: '2026-06-25' }
    ],
    schedule: []
  };
  localStorage.setItem('bba_cms_club_data', JSON.stringify(clubData));
  log('✅ Club data seeded with ' + clubData.activities.length + ' activities');

  /* ============================
   * 4. GALLERY (CMS)
   * ============================ */
  log('Seeding gallery...');
  var gallery = [
    {
      id: Date.now() + 20, name: 'فعاليات رمضان 2026', published: true,
      images: [
        'https://images.unsplash.com/photo-1571902943202-507e261c4ca5?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=400&fit=crop'
      ]
    },
    {
      id: Date.now() + 21, name: 'الحملة التوعوية في المدارس', published: true,
      images: [
        'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop'
      ]
    },
    {
      id: Date.now() + 22, name: 'اليوم الرياضي للشباب', published: true,
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&h=400&fit=crop'
      ]
    }
  ];
  localStorage.setItem('bba_cms_gallery', JSON.stringify(gallery));
  log('✅ ' + gallery.length + ' gallery albums seeded');

  /* ============================
   * 5. VIDEOS (CMS)
   * ============================ */
  log('Seeding videos...');
  var videos = [
    { id: Date.now() + 30, title: 'تعريف بمنصة وعي الشباب BBA', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'توعوية', featured: true, published: true },
    { id: Date.now() + 31, title: 'كيف تقول لا للمخدرات؟', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'توعوية', featured: true, published: true },
    { id: Date.now() + 32, title: 'مهارات الإسعافات الأولية', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'تدريبية', featured: false, published: true },
    { id: Date.now() + 33, title: 'تقرير الحملة التوعوية', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'فعاليات', featured: false, published: true },
    { id: Date.now() + 34, title: 'لقاء مع أحد المستفيدين', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', category: 'أخرى', featured: false, published: true }
  ];
  localStorage.setItem('bba_cms_videos', JSON.stringify(videos));
  log('✅ ' + videos.length + ' videos seeded');

  /* ============================
   * 6. LIBRARY (CMS)
   * ============================ */
  log('Seeding library...');
  var library = [
    { id: Date.now() + 40, title: 'دليل الوقاية من المخدرات', url: '#', type: 'PDF', category: 'كتيبات', downloads: 0, published: true },
    { id: Date.now() + 41, title: 'الخطة السنوية للبرامج التوعوية', url: '#', type: 'PDF', category: 'تقارير', downloads: 0, published: true },
    { id: Date.now() + 42, title: 'عرض تقديمي: الصحة النفسية للشباب', url: '#', type: 'PPTX', category: 'بحوث', downloads: 0, published: true },
    { id: Date.now() + 43, title: 'نموذج طلب التطوع', url: '#', type: 'DOCX', category: 'نماذج', downloads: 0, published: true },
    { id: Date.now() + 44, title: 'تقرير إنجازات 2025-2026', url: '#', type: 'PDF', category: 'تقارير', downloads: 0, published: true },
    { id: Date.now() + 45, title: 'كتيب: كيف تكون قائداً شاباً', url: '#', type: 'PDF', category: 'كتيبات', downloads: 0, published: true },
    { id: Date.now() + 46, title: 'دليل الأنشطة التطوعية', url: '#', type: 'DOCX', category: 'نماذج', downloads: 0, published: true }
  ];
  localStorage.setItem('bba_cms_library', JSON.stringify(library));
  log('✅ ' + library.length + ' library items seeded');

  /* ============================
   * 7. FAQ (CMS) - additional FAQ entries
   * ============================ */
  log('Seeding FAQ...');
  var existingFaq = JSON.parse(localStorage.getItem('bba_cms_faq') || '[]');
  var newFaq = [
    { id: Date.now() + 50, question: 'هل يمكنني التسجيل في أكثر من دورة في نفس الوقت؟', answer: 'نعم، يمكنك التسجيل في أي دورات متاحة ومفتوحة للتسجيل. سيتم إعلامك بمواعيد كل دورة.', published: true },
    { id: Date.now() + 51, question: 'كيف يمكنني التواصل مع إدارة الأكاديمية؟', answer: 'يمكنك التواصل عبر البريد الإلكتروني academy@bba.dz أو من خلال نموذج الاتصال في صفحة تواصل معنا.', published: true },
    { id: Date.now() + 52, question: 'هل الشهادات معتمدة؟', answer: 'نعم، الشهادات الممنوحة من الأكاديمية معتمدة من مديرية الشباب والرياضة لولاية برج بوعريريج.', published: true }
  ];
  for (var fi = 0; fi < newFaq.length; fi++) {
    existingFaq.push(newFaq[fi]);
  }
  localStorage.setItem('bba_cms_faq', JSON.stringify(existingFaq));
  log('✅ ' + newFaq.length + ' FAQ items added');

  /* ============================
   * 8. EVENTS (bba_events) - sample events
   * ============================ */
  log('Seeding events...');
  var existingEvents = JSON.parse(localStorage.getItem('bba_events') || '[]');
  var newEvents = [
    { id: Date.now() + 60, type: 'حملة توعوية', typeIcon: '📢', title: 'حملة التوعية بمخاطر المخدرات في الأسواق', description: 'حملة ميدانية في أسواق برج بوعريريج لتوزيع مطويات توعوية والحديث مع المواطنين حول مخاطر المخدرات.', date: '2026-07-10', location: 'سوق برج بوعريريج', municipality: 'برج بوعريريج', seats: 50, target_audience: 'المواطنون', status: 'open', registrations: 12 },
    { id: Date.now() + 61, type: 'دورة تدريبية', typeIcon: '📚', title: 'دورة تدريب المدربين (TOT)', description: 'دورة متقدمة لتأهيل متطوعي المنصة في مجال التدريب والتأطير.', date: '2026-07-20', location: 'قاعة المحاضرات، دار الشباب', municipality: 'برج بوعريريج', seats: 25, target_audience: 'المتطوعون', status: 'open', registrations: 18 },
    { id: Date.now() + 62, type: 'ورشة عمل', typeIcon: '🔧', title: 'ورشة صناعة المحتوى الرقمي التوعوي', description: 'ورشة عملية لتعليم المشاركين كيفية إنتاج محتوى رقمي هادف للتوعية بمخاطر المخدرات.', date: '2026-08-05', location: 'مكتبة بلدية برج بوعريريج', municipality: 'برج بوعريريج', seats: 30, target_audience: 'الشباب من 18-35 سنة', status: 'open', registrations: 22 }
  ];
  for (var ei = 0; ei < newEvents.length; ei++) {
    existingEvents.push(newEvents[ei]);
  }
  localStorage.setItem('bba_events', JSON.stringify(existingEvents));
  log('✅ ' + newEvents.length + ' events added');

  /* ============================
   * 9. REHABILITATION (CMS)
   * ============================ */
  log('Seeding rehabilitation reports...');
  var rehab = [
    { id: Date.now() + 70, title: 'تقرير الأسبوع الأول من البرنامج التأهيلي', content: 'انطلق البرنامج التأهيلي في المؤسسة العقابية ببرج بوعريريج بمشاركة 20 نزيلاً. تم تقديم محاضرات توعوية حول مخاطر المخدرات وسبل الوقاية.', docUrl: '#', type: 'تقرير', stage: 'المرحلة الأولى', published: true, createdAt: '2026-03-01T10:00:00Z' },
    { id: Date.now() + 71, title: 'تحديث: إتمام المرحلة الأولى بنجاح', content: 'تم الانتهاء من المرحلة الأولى من البرنامج والتي استمرت 4 أسابيع. نسبة الحضور بلغت 95% وتم تسجيل تفاعل إيجابي من المستفيدين.', docUrl: '#', type: 'تحديث', stage: 'المرحلة الأولى', published: true, createdAt: '2026-03-28T10:00:00Z' },
    { id: Date.now() + 72, title: 'انطلاق المرحلة الثانية - التأهيل النفسي', content: 'انطلقت المرحلة الثانية من البرنامج والتي تركز على التأهيل النفسي للمستفيدين عبر جلسات فردية وجماعية.', docUrl: '#', type: 'إنجاز', stage: 'المرحلة الثانية', published: true, createdAt: '2026-04-15T10:00:00Z' },
    { id: Date.now() + 73, title: 'تقرير: تدريب مهني في مجال الإعلام الآلي', content: 'تم تنظيم دورة تدريبية في مجال الإعلام الآلي ضمن المرحلة الثالثة من البرنامج. استفاد منها 15 نزيلاً.', docUrl: '#', type: 'تقرير', stage: 'المرحلة الثالثة', published: true, createdAt: '2026-05-10T10:00:00Z' }
  ];
  localStorage.setItem('bba_cms_rehabilitation', JSON.stringify(rehab));
  log('✅ ' + rehab.length + ' rehabilitation reports seeded');

  /* ============================
   * Summary
   * ============================ */
  log('========================================');
  log('🌱 Phase 4 Seed Data Complete!');
  log('========================================');
  log('');
  log('📚 Academy Courses: ' + courses.length);
  log('📰 Media Coverage: ' + media.length);
  log('⭐ Club Activities: ' + clubData.activities.length);
  log('🖼️ Gallery Albums: ' + gallery.length);
  log('🎬 Videos: ' + videos.length);
  log('📄 Library Items: ' + library.length);
  log('❓ FAQ Added: ' + newFaq.length);
  log('📅 Events Added: ' + newEvents.length);
  log('🛡️ Rehab Reports: ' + rehab.length);
  log('');
  log('Open any public page to see the data:');
  log('- academy.html → courses');
  log('- media-center.html → coverage, videos, gallery');
  log('- club.html → club data + activities');
  log('- activities.html → events + activity log');
  log('- partners.html → partners (existing)');
  log('- team.html → teams + volunteers');
  log('- dz-young-leaders.html → rehab reports');
})();
