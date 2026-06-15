/* ============================================================
   منصة وعي الشباب BBA - Test Data Seed Script
   Run from browser console to populate test data and
   verify Supabase sync works correctly.

   USAGE:
     seedAll()        — Clear all data and seed fresh
     seedFlowDemo()   — Step-by-step demo of register→approve→activity→certificate→verify
   ============================================================ */

(function seedTestData() {
  'use strict';

  if (!window.BBA || !window.BBA.DB) {
    console.error('❌ BBA.DB not found. Ensure database.js is loaded first.');
    return;
  }

  console.log('🧪 Starting test data seed...');

  var DB = window.BBA.DB;

  /* ============================================================
   * CLEAR ALL EXISTING DATA
   * ============================================================ */
  function clearAll() {
    /* Dynamically find and remove all BBA data keys */
    var removeKeys = [];
    for (var j = 0; j < localStorage.length; j++) {
      var key = localStorage.key(j);
      if (key && (
        key.indexOf('bba_') === 0 ||
        key.indexOf('bba_points_') === 0 ||
        key.indexOf('bba_portal_') === 0 ||
        key.indexOf('bba_cms_') === 0 ||
        key.indexOf('bba_notifs_') === 0 ||
        key.indexOf('bba_task_done_') === 0 ||
        key.indexOf('bba_dedup_') === 0 ||
        key.indexOf('bba_submission_') === 0 ||
        key.indexOf('bba_security_') === 0
      )) {
        removeKeys.push(key);
      }
    }
    for (var i = 0; i < removeKeys.length; i++) {
      localStorage.removeItem(removeKeys[i]);
    }
    /* Clear all session storage auth keys */
    var sessionKeys = [
      'bba_portal_session', 'bba_admin_auth', 'bba_psych_auth',
      'bba_auth_user', 'bba_auth_role', 'bba_auth_role_data',
      'bba_auth_login_attempts'
    ];
    for (var s = 0; s < sessionKeys.length; s++) {
      sessionStorage.removeItem(sessionKeys[s]);
    }
    console.log('🗑️ All existing data cleared (' + removeKeys.length + ' keys removed)');
  }

  /* ============================================================
   * SEED: FULL DATA SET
   * ============================================================ */
  window.seedAll = function() {
    clearAll();

    /* --- 1. VOLUNTEERS --- */
    var volunteers = [
      { fullName: 'أحمد بن علي', email: 'ahmed@test.dz', phone: '0555123456', municipality: 'برج بوعريريج', membershipType: 'admin', status: 'approved', suspended: false, volunteerId: 'VOL-BBA-2026-0001', date: new Date(Date.now() - 1209600000).toISOString() },
      { fullName: 'فاطمة زهراء', email: 'fatima@test.dz', phone: '0666123456', municipality: 'المنصورة', membershipType: 'member', status: 'approved', suspended: false, volunteerId: 'VOL-BBA-2026-0002', date: new Date(Date.now() - 864000000).toISOString() },
      { fullName: 'محمد صالح', email: 'mohamed@test.dz', phone: '0777123456', municipality: 'رأس الوادي', membershipType: 'member', status: 'pending', suspended: false, volunteerId: '', date: new Date(Date.now() - 432000000).toISOString(), motivation: 'أرغب في المساهمة في التوعية بمخاطر المخدرات' },
      { fullName: 'سارة أحمد', email: 'sara@test.dz', phone: '0555987654', municipality: 'برج زمورة', membershipType: 'admin', status: 'approved', suspended: false, volunteerId: 'VOL-BBA-2026-0003', date: new Date(Date.now() - 604800000).toISOString() },
      { fullName: 'خالد محمود', email: 'khaled@test.dz', phone: '0666987654', municipality: 'الحمادية', membershipType: 'member', status: 'approved', suspended: false, volunteerId: 'VOL-BBA-2026-0004', date: new Date(Date.now() - 345600000).toISOString() },
      /* New volunteer for the register→approve flow demo */
      { fullName: 'نور الهدى', email: 'nour@test.dz', phone: '0555112233', municipality: 'تقلعيت', membershipType: 'member', status: 'pending', suspended: false, volunteerId: '', date: new Date().toISOString(), motivation: 'أريد المشاركة في الأنشطة التطوعية للمنصة' }
    ];
    localStorage.setItem('bba_volunteers', JSON.stringify(volunteers));
    console.log('✅ Volunteers seeded: ' + volunteers.length);

    /* --- 2. CONSULTATIONS --- */
    var consultations = [
      { alias: 'مستفيد1', ageGroup: '18-25', subject: 'القلق من المستقبل', message: 'أشعر بقلق شديد تجاه مستقبلي المهني ولا أعرف كيف أتخذ القرارات الصحيحة.', status: 'pending', trackingCode: 'BBA-ABCD-1234', date: new Date(Date.now() - 86400000).toISOString(), specialistResponse: '', extraNotes: '', lastUpdated: '' },
      { alias: 'مستفيد2', ageGroup: '26-35', subject: 'ضغوط العمل', message: 'أعاني من ضغوط شديدة في العمل تؤثر على صحتي النفسية.', status: 'answered', trackingCode: 'BBA-EFGH-5678', date: new Date(Date.now() - 172800000).toISOString(), specialistResponse: 'نشكرك على ثقتك. ننصحك بممارسة تمارين الاسترخاء وتنظيم وقتك.', extraNotes: 'تم تحويل الحالة إلى أخصائي', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
      { alias: 'مستفيد3', ageGroup: '13-17', subject: 'مشاكل دراسية', message: 'أجد صعوبة في التركيز في الدراسة وأشعر بالإحباط.', status: 'in_progress', trackingCode: 'BBA-IJKL-9012', date: new Date().toISOString(), specialistResponse: '', extraNotes: '', lastUpdated: new Date().toISOString() }
    ];
    localStorage.setItem('bba_consultations', JSON.stringify(consultations));
    console.log('✅ Consultations seeded: ' + consultations.length);

    /* --- 3. CERTIFICATES --- */
    var certificates = [
      { certificateNumber: 'CERT-BBA-2026-0001', volunteerId: 'VOL-BBA-2026-0001', volunteerName: 'أحمد بن علي', title: 'شهادة مشاركة في الحملة التوعوية', description: 'مشاركة فعالة في الحملة التوعوية لمكافحة المخدرات', issueDate: new Date(Date.now() - 604800000).toISOString() },
      { certificateNumber: 'CERT-BBA-2026-0002', volunteerId: 'VOL-BBA-2026-0002', volunteerName: 'فاطمة زهراء', title: 'شهادة تقدير', description: 'تقديراً للجهود المتميزة في تنظيم الفعاليات', issueDate: new Date(Date.now() - 259200000).toISOString() },
      { certificateNumber: 'CERT-BBA-2026-0003', volunteerId: 'VOL-BBA-2026-0003', volunteerName: 'سارة أحمد', title: 'شهادة مشاركة', description: 'مشاركة متميزة في ورشة الصحة النفسية', issueDate: new Date(Date.now() - 432000000).toISOString() }
    ];
    localStorage.setItem('bba_certificates', JSON.stringify(certificates));
    console.log('✅ Certificates seeded: ' + certificates.length);

    /* --- 4. EVENTS --- */
    var events = [
      { title: 'ورشة التوعية بمخاطر المخدرات', type: 'ورشة عمل', typeIcon: '🔧', description: 'ورشة توعوية للشباب حول مخاطر المخدرات الرقمية', date: '2026-07-15', location: 'برج بوعريريج', municipality: 'برج بوعريريج', seats: 50, targetAudience: 'الشباب من 18-25 سنة', status: 'open', registrations: [{ volunteerId: 'VOL-BBA-2026-0001', volunteerName: 'أحمد بن علي', attended: false, registeredAt: new Date().toISOString() }] },
      { title: 'حملة نظافة وتوعية', type: 'نشاط ميداني', typeIcon: '🏃', description: 'حملة نظافة وتوعية في الأحياء', date: '2026-08-01', location: 'المنصورة', municipality: 'المنصورة', seats: 30, targetAudience: 'جميع الفئات', status: 'open', registrations: [] },
      { title: 'محاضرة الصحة النفسية', type: 'حملة توعوية', typeIcon: '📢', description: 'محاضرة حول الصحة النفسية للشباب', date: '2026-06-01', location: 'جامعة برج بوعريريج', municipality: 'برج بوعريريج', seats: 100, targetAudience: 'طلاب الجامعة', status: 'completed', registrations: [{ volunteerId: 'VOL-BBA-2026-0001', volunteerName: 'أحمد بن علي', attended: true, registeredAt: new Date(Date.now() - 1209600000).toISOString() }, { volunteerId: 'VOL-BBA-2026-0002', volunteerName: 'فاطمة زهراء', attended: true, registeredAt: new Date(Date.now() - 1209600000).toISOString() }] }
    ];
    localStorage.setItem('bba_events', JSON.stringify(events));
    console.log('✅ Events seeded: ' + events.length);

    /* --- 5. TEAMS --- */
    var teams = [
      { name: 'فريق برج بوعريريج', municipality: 'برج بوعريريج', leaderId: 'VOL-BBA-2026-0001', members: ['VOL-BBA-2026-0001', 'VOL-BBA-2026-0003'] },
      { name: 'فريق المنصورة', municipality: 'المنصورة', leaderId: 'VOL-BBA-2026-0002', members: ['VOL-BBA-2026-0002', 'VOL-BBA-2026-0004'] }
    ];
    localStorage.setItem('bba_teams', JSON.stringify(teams));
    console.log('✅ Teams seeded: ' + teams.length);

    /* --- 6. TASKS --- */
    var tasks = [
      { name: 'توزيع منشورات توعوية', description: 'توزيع المنشورات في الأحياء المستهدفة', priority: 'high', deadline: new Date(Date.now() + 604800000).toISOString(), assignedTo: 'VOL-BBA-2026-0002', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { name: 'تنظيم ورشة عمل', description: 'التحضير لورشة العمل الأسبوعية', priority: 'urgent', deadline: new Date(Date.now() + 259200000).toISOString(), assignedTo: 'VOL-BBA-2026-0001', createdAt: new Date().toISOString() },
      { name: 'تقرير شهري', description: 'إعداد تقرير الأنشطة الشهرية', priority: 'medium', deadline: new Date(Date.now() + 1209600000).toISOString(), assignedTo: 'all', createdAt: new Date(Date.now() - 172800000).toISOString() }
    ];
    localStorage.setItem('bba_tasks', JSON.stringify(tasks));
    console.log('✅ Tasks seeded: ' + tasks.length);

    /* --- 7. ACTIVITY LOG --- */
    var activityLog = [
      { title: 'المشاركة في الحملة التوعوية', description: 'حملة توعوية في برج بوعريريج', volunteerId: 'VOL-BBA-2026-0001', volunteerName: 'أحمد بن علي', points: 50, date: new Date(Date.now() - 604800000).toISOString().split('T')[0] },
      { title: 'تنظيم ورشة العمل', description: 'ورشة عمل حول الصحة النفسية', volunteerId: 'VOL-BBA-2026-0002', volunteerName: 'فاطمة زهراء', points: 30, date: new Date(Date.now() - 259200000).toISOString().split('T')[0] },
      { title: 'تجهيز مواد توعوية', description: 'إعداد مطبوعات ومنشورات للحملة', volunteerId: 'VOL-BBA-2026-0001', volunteerName: 'أحمد بن علي', points: 20, date: new Date(Date.now() - 432000000).toISOString().split('T')[0] }
    ];
    localStorage.setItem('bba_activity_log', JSON.stringify(activityLog));
    console.log('✅ Activity log seeded: ' + activityLog.length);

    /* --- 8. POINTS --- */
    localStorage.setItem('bba_points_VOL-BBA-2026-0001', JSON.stringify([
      { amount: 50, reason: 'المشاركة في الحملة التوعوية', date: new Date(Date.now() - 604800000).toISOString(), type: 'add' },
      { amount: 25, reason: 'تنظيم ورشة العمل', date: new Date(Date.now() - 259200000).toISOString(), type: 'add' },
      { amount: 20, reason: 'تجهيز مواد توعوية', date: new Date(Date.now() - 432000000).toISOString(), type: 'add' }
    ]));
    localStorage.setItem('bba_points_VOL-BBA-2026-0002', JSON.stringify([
      { amount: 30, reason: 'المشاركة في الحملة التوعوية', date: new Date(Date.now() - 604800000).toISOString(), type: 'add' }
    ]));
    console.log('✅ Points seeded');

    /* --- 9. NOTIFICATIONS --- */
    var notifications = [
      { title: 'فعالية جديدة', message: 'تم إضافة فعالية جديدة: ورشة التوعية بمخاطر المخدرات', type: 'info', targetVolunteer: 'all', isUrgent: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { title: 'مهمة جديدة', message: 'تم تعيين مهمة جديدة: توزيع منشورات توعوية', type: 'new_task', targetVolunteer: 'VOL-BBA-2026-0002', isUrgent: false, createdAt: new Date().toISOString() }
    ];
    localStorage.setItem('bba_notifications_data', JSON.stringify(notifications));
    console.log('✅ Notifications seeded: ' + notifications.length);

    /* --- 10. ACHIEVEMENTS --- */
    var achievements = [
      { title: 'متطوع الشهر', description: 'أفضل متطوع لشهر يناير', icon: '🏆', assignedTo: 'VOL-BBA-2026-0001', dateAwarded: new Date(Date.now() - 1209600000).toISOString() },
      { title: 'أفضل منظم', description: 'تقديراً للتنظيم المتميز', icon: '⭐', assignedTo: 'VOL-BBA-2026-0002', dateAwarded: new Date(Date.now() - 604800000).toISOString() }
    ];
    localStorage.setItem('bba_achievements', JSON.stringify(achievements));
    console.log('✅ Achievements seeded: ' + achievements.length);

    /* --- VERIFICATION --- */
    console.log('');
    console.log('📊 All data seeded successfully!');
    console.log('');
    logSyncStatus();
    return '✅ seedAll() complete - ' + volunteers.length + ' volunteers, ' + certificates.length + ' certificates';
  };

  /* ============================================================
   * DEMO: END-TO-END FLOW
   * Simulates the full workflow step by step:
   *   1. Register volunteer (form submission simulation)
   *   2. Admin approves volunteer
   *   3. Create activity for volunteer
   *   4. Issue certificate to volunteer
   *   5. Build verification URL with QR
   * ============================================================ */
  window.seedFlowDemo = function() {
    console.log('🎬 === END-TO-END FLOW DEMO ===');
    console.log('');

    /* Clear first */
    clearAll();

    /* ---- STEP 1: Register Volunteer ---- */
    console.log('📝 STEP 1: Registering new volunteer...');
    var newVolunteer = {
      fullName: 'عبد الرحمان بن خالد',
      email: 'abderrahmane@test.dz',
      phone: '0555334455',
      municipality: 'برج الغدير',
      membershipType: 'member',
      motivation: 'أرغب في المساهمة في التوعية بمخاطر المخدرات والمشاركة في الأنشطة التطوعية',
      status: 'pending',
      suspended: false,
      volunteerId: '',
      date: new Date().toISOString()
    };

    var volunteers = JSON.parse(localStorage.getItem('bba_volunteers') || '[]');
    volunteers.push(newVolunteer);
    localStorage.setItem('bba_volunteers', JSON.stringify(volunteers));
    var regIdx = volunteers.length - 1;
    console.log('   ✅ Volunteer registered: عبد الرحمان بن خالد (pending)');
    console.log('   📧 Email: abderrahmane@test.dz');
    console.log('   📱 Phone: 0555334455');

    /* ---- STEP 2: Admin Approves Volunteer ---- */
    console.log('');
    console.log('✅ STEP 2: Admin approving volunteer...');
    volunteers[regIdx].status = 'approved';
    volunteers[regIdx].volunteerId = 'VOL-BBA-2026-0005';
    localStorage.setItem('bba_volunteers', JSON.stringify(volunteers));
    console.log('   ✅ Volunteer approved!');
    console.log('   🆔 Volunteer ID: VOL-BBA-2026-0005');

    /* ---- STEP 3: Create Activity ---- */
    console.log('');
    console.log('📌 STEP 3: Creating activity for volunteer...');
    var activityLog = [];
    activityLog.push({
      title: 'حملة توعوية في الأحياء',
      description: 'مشاركة في الحملة التوعوية لمكافحة المخدرات في أحياء برج الغدير',
      volunteerId: 'VOL-BBA-2026-0005',
      volunteerName: 'عبد الرحمان بن خالد',
      points: 40,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('bba_activity_log', JSON.stringify(activityLog));
    console.log('   ✅ Activity created: حملة توعوية في الأحياء (+40 points)');

    /* Add points */
    localStorage.setItem('bba_points_VOL-BBA-2026-0005', JSON.stringify([
      { amount: 40, reason: 'حملة توعوية في الأحياء', date: new Date().toISOString(), type: 'add' }
    ]));
    console.log('   ⭐ Points added: 40');

    /* ---- STEP 4: Issue Certificate ---- */
    console.log('');
    console.log('📜 STEP 4: Issuing certificate...');
    var certificates = [];
    certificates.push({
      certificateNumber: 'CERT-BBA-2026-0004',
      volunteerId: 'VOL-BBA-2026-0005',
      volunteerName: 'عبد الرحمان بن خالد',
      title: 'شهادة مشاركة في الحملة التوعوية',
      description: 'تقديراً للمشاركة الفعالة في الحملة التوعوية لمكافحة المخدرات',
      issueDate: new Date().toISOString()
    });
    localStorage.setItem('bba_certificates', JSON.stringify(certificates));
    console.log('   ✅ Certificate issued!');
    console.log('   🆔 Cert Number: CERT-BBA-2026-0004');

    /* ---- STEP 5: QR Verification URL ---- */
    console.log('');
    console.log('🔍 STEP 5: QR Verification URL:');
    var verifyUrl = window.location.protocol + '//' + window.location.host +
      window.location.pathname.replace(/[^/]*$/, '') +
      'verify-certificate.html?id=CERT-BBA-2026-0004';
    console.log('   🔗 ' + verifyUrl);
    console.log('');
    console.log('   📊 QR code will be generated client-side with qrcodejs library');
    console.log('   🎯 Open verify-certificate.html?id=CERT-BBA-2026-0004 to verify');
    console.log('');
    console.log('   💡 If testing via file:// protocol, use:');
    console.log('      verify-certificate.html?id=CERT-BBA-2026-0004');
    console.log('');

    /* ---- DEMO COMPLETE ---- */
    console.log('🎬 === E2E FLOW DEMO COMPLETE ===');
    console.log('');
    console.log('🧪 To test in browser:');
    console.log('   1. Open admin.html and login: admin@bba.dz / bba2026');
    console.log('   2. Go to المتطوعين section → approve the pending volunteer');
    console.log('   3. Go to النشاطات section → create an activity');
    console.log('   4. Go to الشهادات section → issue a certificate');
    console.log('   5. Open verify-certificate.html?id=CERT-BBA-2026-0004');
    console.log('');
    logSyncStatus();
    return '✅ seedFlowDemo() complete - Full E2E flow ready';
  };

  /* ============================================================
   * LOG SYNC STATUS
   * ============================================================ */
  function logSyncStatus() {
    if (DB.isOnline()) {
      console.log('🔄 Supabase connected. Data will sync automatically.');
      console.log('   (localStorage patch handles auto-sync)');
    } else {
      console.log('⚠️ Supabase not connected. Data saved to localStorage only.');
      console.log('   Run the SQL schema first, then refresh to sync.');
    }
  }

  /* ============================================================
   * RUN FLOW DEMO ON LOAD
   * ============================================================ */
  /* Auto-run the seed if URL has ?seed or ?flow */
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('seed') === 'all') {
    seedAll();
  } else if (urlParams.get('flow') === 'demo') {
    seedFlowDemo();
  }

  console.log('🧪 test-data.js loaded! Run seedAll() or seedFlowDemo() in console.');
  console.log('   Or append ?seed=all or ?flow=demo to the URL to auto-run.');

})();
