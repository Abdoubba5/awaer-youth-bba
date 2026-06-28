/* ============================================================
   منصة وعي الشباب BBA — Unified Navigation Manager
   Shared desktop nav, mobile nav & footer for ALL public pages.
   Reads from CMS (bba_cms_navigation) or falls back to defaults.
   Handles active page detection, theme switcher, scroll effects.
   Version: 1.0.0
   ============================================================ */

(function navManager() {
  'use strict';

  /* ============================================================
   * HELPERS
   * ============================================================ */
  function byId(id) { return document.getElementById(id); }
  function esc(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  /* Get the current page name from URL path */
  function getPageName() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    if (!path || path === '/') path = 'index.html';
    /* Handle hash-only pages (index.html sections) */
    if (path === 'index.html' && window.location.hash) {
      return path + window.location.hash;
    }
    return path;
  }

  /* ============================================================
   * DEFAULT NAVIGATION ITEMS
   * ============================================================ */
  var DEFAULT_NAV = {
    desktop: [
      { label: 'الرئيسية',        href: 'index.html',                activeFor: ['index.html'] },
      { label: 'عن المشروع',      href: 'about.html',                activeFor: ['about.html'] },
      { label: 'الفئة المستهدفة', href: 'target-audience.html',       activeFor: ['target-audience.html'] },
      { label: 'نادي الشباب',     href: 'club.html',                 activeFor: ['club.html'] },
      { label: 'النشاطات',        href: 'activities.html',           activeFor: ['activities.html'] },
      { label: 'الأكاديمية',      href: 'academy.html',              activeFor: ['academy.html'] },
      { label: 'المركز الإعلامي', href: 'media-center.html',         activeFor: ['media-center.html'] },
      { label: 'الشركاء',         href: 'partners.html',             activeFor: ['partners.html'] },
      { label: 'DZ Leaders',      href: 'dz-young-leaders.html',     activeFor: ['dz-young-leaders.html'] },
      { label: 'فريق العمل',      href: 'team.html',                 activeFor: ['team.html'] },
      { label: 'الإنجازات',       href: 'achievements.html',         activeFor: ['achievements.html'] },
      { label: 'التوعية',         href: 'index.html#awareness',      activeFor: ['index.html#awareness'] },
      { label: 'الاستشارات',      href: 'index.html#consultation',   activeFor: ['index.html#consultation'] },
      { label: 'تواصل',           href: 'index.html#contact',        activeFor: ['index.html#contact'] }
    ],
    mobile: [
      { label: 'الرئيسية',   href: 'index.html',                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', activeFor: ['index.html'] },
      { label: 'عن المشروع', href: 'about.html',                 icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>', activeFor: ['about.html'] },
      { label: 'النشاطات',   href: 'activities.html',            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', activeFor: ['activities.html'] },
      { label: 'الأكاديمية', href: 'academy.html',               icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6v7"/><path d="M9 9h6"/></svg>', activeFor: ['academy.html'] },
      { label: 'الإعلام',    href: 'media-center.html',           icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>', activeFor: ['media-center.html'] },
      { label: 'تواصل',      href: 'index.html#contact',          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', activeFor: ['index.html#contact'] }
    ],
    logoText: 'منصة وعي الشباب BBA',
    cta: { text: '📞', href: 'index.html#contact' }
  };

  var DEFAULT_FOOTER = {
    copyright: '© 2026 <span class="footer-gold">منصة وعي الشباب BBA</span>',
    sponsor: 'تحت إشراف <span class="footer-gold">برنامج Dz Young Leaders</span>',
    links: [
      { label: '📖 عن المشروع', href: 'about.html' },
      { label: '👥 فريق العمل', href: 'team.html' },
      { label: '🤝 الشركاء', href: 'partners.html' },
      { label: '📺 المركز الإعلامي', href: 'media-center.html' },
      { label: '🎓 الأكاديمية', href: 'academy.html' },
      { label: '👤 بوابة المتطوعين', href: 'portal.html' },
      { label: '✅ التحقق من الشهادات', href: 'verify-certificate.html' }
    ]
  };

  /* ============================================================
   * LOAD CMS CONFIG (or use defaults)
   * ============================================================ */
  function loadNavConfig() {
    try {
      var raw = localStorage.getItem('bba_cms_navigation');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.items) return parsed;
      }
      /* Try old format */
      var cfg = localStorage.getItem('bba_cms_nav_config');
      if (cfg) {
        var parsed = JSON.parse(cfg);
        if (parsed && parsed.items) return parsed;
      }
    } catch(e) {}
    return { items: DEFAULT_NAV.desktop, mobileItems: DEFAULT_NAV.mobile, logoText: DEFAULT_NAV.logoText, cta: DEFAULT_NAV.cta };
  }

  function loadFooterConfig() {
    try {
      var raw = localStorage.getItem('bba_cms_footer');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.links) return parsed;
      }
    } catch(e) {}
    return DEFAULT_FOOTER;
  }

  /* ============================================================
   * RENDER NAVBAR HTML
   * ============================================================ */
  function renderNavHTML(config, currentPage) {
    var desktopItems = (config.items || DEFAULT_NAV.desktop).filter(function(item) { return item.visible !== false; });
    var mobileItems = (config.mobileItems || DEFAULT_NAV.mobile).filter(function(item) { return item.visible !== false; });
    var logoText = config.logoText || DEFAULT_NAV.logoText;
    var cta = config.cta || DEFAULT_NAV.cta;

    /* Desktop nav links */
    var desktopLinks = '';
    for (var i = 0; i < desktopItems.length; i++) {
      var item = desktopItems[i];
      var isActive = false;
      var af = item.activeFor || [item.href];
      for (var a = 0; a < af.length; a++) {
        if (af[a] === currentPage) { isActive = true; break; }
      }
      desktopLinks += '<a href="' + esc(item.href) + '"' + (isActive ? ' class="active"' : '') + '>' + esc(item.label) + '</a>';
    }

    /* Mobile nav links */
    var mobileLinks = '';
    var mobileDefs = (mobileItems.length > 0) ? mobileItems : DEFAULT_NAV.mobile;
    for (var i = 0; i < mobileDefs.length; i++) {
      var item = mobileDefs[i];
      var isActive = false;
      var af = item.activeFor || [item.href];
      for (var a = 0; a < af.length; a++) {
        if (af[a] === currentPage) { isActive = true; break; }
      }
      var icon = item.icon || '';
      mobileLinks += '<a href="' + esc(item.href) + '"' + (isActive ? ' class="active"' : '') + '>' +
        icon + '<span>' + esc(item.label) + '</span></a>';
    }

    var navHTML =
      '<nav class="nav" role="navigation" aria-label="القائمة الرئيسية">' +
        '<div class="nav-inner">' +
          '<a href="index.html" class="nav-logo">' +
            '<span class="nav-logo-icon" aria-hidden="true">وعي</span>' +
            '<span>' + esc(logoText) + '</span>' +
          '</a>' +
          '<div class="nav-links">' + desktopLinks + '</div>' +
          '<div style="display:flex;align-items:center;gap:0.5rem">' +
            '<div id="sharedThemeSwitcher"></div>' +
          '</div>' +
        '</div>' +
      '</nav>' +
      '<nav class="nav-mobile" role="navigation" aria-label="القائمة السفلية">' +
        '<div class="nav-mobile-inner">' + mobileLinks + '</div>' +
      '</nav>';

    return navHTML;
  }

  /* ============================================================
   * RENDER FOOTER HTML
   * ============================================================ */
  function renderFooterHTML(config) {
    var cfg = config || DEFAULT_FOOTER;
    var links = (cfg.links || DEFAULT_FOOTER.links).filter(function(l) { return l.visible !== false; });
    var linkHTML = '';
    for (var i = 0; i < links.length; i++) {
      linkHTML += '<a href="' + esc(links[i].href) + '">' + esc(links[i].label) + '</a>';
    }

    var copyright = cfg.copyright || DEFAULT_FOOTER.copyright;
    var sponsor = cfg.sponsor !== undefined ? cfg.sponsor : DEFAULT_FOOTER.sponsor;

    var html =
      '<footer class="footer">' +
        '<div class="container">' +
          '<p>' + copyright + (sponsor ? ' | ' + sponsor : '') + ' | جميع الحقوق محفوظة</p>' +
          (linkHTML ? '<div class="footer-links">' + linkHTML + '</div>' : '') +
        '</div>' +
      '</footer>';

    return html;
  }

  /* ============================================================
   * INIT — Main entry point
   * ============================================================ */
  function init(containerId, footerContainerId) {
    containerId = containerId || 'navbar';
    footerContainerId = footerContainerId || 'footer';

    var currentPage = getPageName();
    var navConfig = loadNavConfig();
    var footerConfig = loadFooterConfig();

    /* Look for placeholder divs */
    var navPlaceholder = byId(containerId);
    var footerPlaceholder = byId(footerContainerId);

    /* Render nav into placeholder (if it exists) */
    if (navPlaceholder) {
      navPlaceholder.innerHTML = renderNavHTML(navConfig, currentPage);
    }

    /* Render footer into placeholder (if it exists) */
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = renderFooterHTML(footerConfig);
    }

    /* Initialize theme switcher on the shared element */
    if (byId('sharedThemeSwitcher') && window.BBA && window.BBA.Theme) {
      window.BBA.Theme.createSwitcher(byId('sharedThemeSwitcher'));
    }

    /* Also try existing page-specific theme switchers (backward compat) */
    if (window.BBA && window.BBA.Theme) {
      var existingSwitchers = document.querySelectorAll('[id$="ThemeSwitcher"]');
      for (var i = 0; i < existingSwitchers.length; i++) {
        if (existingSwitchers[i].id !== 'sharedThemeSwitcher' && existingSwitchers[i].children.length === 0) {
          window.BBA.Theme.createSwitcher(existingSwitchers[i]);
        }
      }
    }

    /* Nav scroll effect */
    initNavScroll();
  }

  /* ============================================================
   * NAV SCROLL EFFECT — Toggle 'scrolled' class
   * ============================================================ */
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    function update() {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ============================================================
   * EXPOSE PUBLIC API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.Navigation = {
    init: init,
    renderNav: renderNavHTML,
    renderFooter: renderFooterHTML,
    getNavConfig: loadNavConfig,
    getFooterConfig: loadFooterConfig,
    refresh: function() {
      init();
    }
  };

  /* ============================================================
   * AUTO-INIT ON DOM READY (only if navbar placeholder exists)
   * ============================================================ */
  function autoInit() {
    if (byId('navbar') || byId('footer')) {
      init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  console.log('✅ [BBA Navigation] Module loaded');
})();
