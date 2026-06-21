/* ============================================================
   منصة وعي الشباب BBA - Platform Core Module
   Theme Engine · Animations · Security · Anti-Spam · PWA
   Version: 1.0.0
   ============================================================ */

(function platformCore() {
  'use strict';

  /* ============================================================
   * 1. THEME ENGINE
   * Dark / Light / Auto modes with smooth transitions
   * ============================================================ */
  var ThemeEngine = {
    current: 'dark',
    key: 'bba_theme_preference',

    init: function() {
      var saved = localStorage.getItem(this.key);
      if (saved === 'light' || saved === 'dark') {
        this.current = saved;
      }
      this.apply();
      this.injectSwitcherStyles();
    },

    apply: function() {
      var mode = this.current;
      if (mode === 'auto') {
        mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      document.documentElement.setAttribute('data-theme', mode);

      /* Update viewport theme-color meta */
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', mode === 'light' ? '#f8f6f1' : '#06090e');
      }

      /* Dispatch event for other scripts */
      document.dispatchEvent(new CustomEvent('themeChanged', { detail: { mode: mode, preference: this.current } }));
    },

    set: function(preference) {
      this.current = preference;
      localStorage.setItem(this.key, preference);
      this.apply();
    },

    toggle: function() {
      var newMode = this.current === 'dark' ? 'light' : 'dark';
      this.set(newMode);
      return newMode;
    },

    isDark: function() {
      return this.current === 'dark';
    },

    isLight: function() {
      return this.current === 'light';
    },

    injectSwitcherStyles: function() {
      /* Theme switcher button styling */
      if (!document.getElementById('theme-switcher-style')) {
        var style = document.createElement('style');
        style.id = 'theme-switcher-style';
        style.textContent =
          '.theme-switcher{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--gold-light);border:1px solid var(--border);cursor:pointer;transition:var(--transition);font-size:1rem;position:relative;overflow:hidden}' +
          '.theme-switcher:hover{transform:scale(1.1);border-color:var(--gold);box-shadow:0 0 16px rgba(212,175,55,0.2)}' +
          '.theme-switcher .ts-icon{transition:transform 0.4s ease;line-height:1}' +
          '.theme-switcher:active .ts-icon{transform:rotate(360deg)}';
        document.head.appendChild(style);
      }
    },

    createSwitcher: function(container) {
      if (!container) return;
      var self = this;
      var btn = document.createElement('button');
      btn.className = 'theme-switcher';
      btn.setAttribute('aria-label', 'تبديل المظهر');
      btn.setAttribute('title', 'تبديل المظهر: داكن / فاتح');
      self._updateButtonIcon(btn);
      btn.addEventListener('click', function() {
        var mode = self.toggle();
        self._updateButtonIcon(btn);
        showPlatformToast('\u{1F3A8} تم التبديل إلى المظهر ' + (mode === 'dark' ? 'الداكن' : 'الفاتح'), 'info');
      });
      container.appendChild(btn);

      /* Listen for external theme changes (e.g. from another tab) */
      document.addEventListener('themeChanged', function() {
        self._updateButtonIcon(btn);
      });
    },

    _updateButtonIcon: function(btn) {
      if (!btn) return;
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      btn.innerHTML = isLight
        ? '<span class="ts-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></span>'
        : '<span class="ts-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>';
      container.appendChild(btn);
    }
  };

  /* ============================================================
   * 2. ANIMATION ENGINE
   * Scroll reveal, fade-in, slide-up, ripple effect, counters
   * ============================================================ */
  var AnimationEngine = {
    init: function() {
      this.initScrollReveal();
      this.initRippleEffect();
      this.initSmoothAnchor();
    },

    /* Scroll Reveal: Elements with .reveal class fade in on scroll */
    initScrollReveal: function() {
      /* Fallback timeout: make sure elements are visible after 3s even if observer fails */
      setTimeout(function() {
        document.querySelectorAll('.reveal, .fade-in-up, .slide-up:not(.reveal-visible)').forEach(function(el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.classList.add('reveal-visible');
        });
      }, 3000);

      if (!window.IntersectionObserver) {
        /* Fallback: show all immediately */
        document.querySelectorAll('.reveal, .fade-in-up, .slide-up').forEach(function(el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.classList.add('reveal-visible');
        });
        return;
      }

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.reveal, .fade-in-up, .slide-up').forEach(function(el) {
        if (!el.classList.contains('reveal-visible')) {
          observer.observe(el);
        }
      });
    },

    /* Ripple effect on buttons */
    initRippleEffect: function() {
      document.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn, .ripple');
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function() { ripple.remove(); });
      });
    },

    /* Smooth anchor scrolling */
    initSmoothAnchor: function() {
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href === '#' || !href) return;
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          /* Update URL hash */
          history.pushState(null, null, href);
        }
      });
    },

    /* Animate number counter */
    animateNumber: function(el, target, duration) {
      if (!el) return;
      duration = duration || 800;
      var start = 0;
      var startTime = null;
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      if (target > 0) {
        requestAnimationFrame(step);
      } else {
        el.textContent = '0';
      }
    },

    /* Refresh animations after content changes */
    refresh: function() {
      this.initScrollReveal();
    }
  };

  /* ============================================================
   * 3. ANTI-SPAM & RATE LIMITING
   * ============================================================ */
  var AntiSpam = {
    key: 'bba_submission_log',
    cooldownMs: 30 * 1000, /* 30 seconds between submissions */
    maxSubmissions: 20,    /* max per hour */
    windowMs: 60 * 60 * 1000,

    /* Check if a form type can be submitted */
    canSubmit: function(formType, maxPerPeriod) {
      maxPerPeriod = maxPerPeriod || 5;
      var now = Date.now();
      var log = this.getLog();

      /* Per-form cooldown */
      var lastSub = log.lastSubmission[formType] || 0;
      if (now - lastSub < this.cooldownMs) {
        var waitSeconds = Math.ceil((this.cooldownMs - (now - lastSub)) / 1000);
        return { allowed: false, message: '\u{23F1}\uFE0F يرجى الانتظار ' + waitSeconds + ' ثانية قبل الإرسال مرة أخرى', wait: waitSeconds };
      }

      /* Rate limit across all forms */
      var recentCount = 0;
      for (var key in log.counts) {
        if (log.counts.hasOwnProperty(key)) {
          recentCount += log.counts[key];
        }
      }
      if (recentCount >= this.maxSubmissions) {
        return { allowed: false, message: '\u{1F6AB} تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' };
      }

      return { allowed: true };
    },

    /* Record a submission */
    recordSubmission: function(formType) {
      var now = Date.now();
      var log = this.getLog();

      /* Clean old entries outside the window */
      for (var key in log.counts) {
        if (log.counts.hasOwnProperty(key)) {
          if (now - parseInt(key, 10) > this.windowMs) {
            delete log.counts[key];
          }
        }
      }

      log.lastSubmission[formType] = now;
      log.counts[now] = (log.counts[now] || 0) + 1;
      localStorage.setItem(this.key, JSON.stringify(log));
    },

    getLog: function() {
      try {
        return JSON.parse(localStorage.getItem(this.key)) || { lastSubmission: {}, counts: {} };
      } catch(e) {
        return { lastSubmission: {}, counts: {} };
      }
    },

    /* Duplicate check: check if same text content submitted recently */
    isDuplicate: function(formType, text) {
      if (!text || text.length < 10) return false;
      var key = 'bba_dedup_' + formType;
      var raw = localStorage.getItem(key);
      if (raw) {
        try {
          var entry = JSON.parse(raw);
          if (entry.text === text.trim().substring(0, 50) && (Date.now() - entry.time < 300000)) {
            return true;
          }
        } catch(e) {}
      }
      localStorage.setItem(key, JSON.stringify({ text: text.trim().substring(0, 50), time: Date.now() }));
      return false;
    }
  };

  /* ============================================================
   * 4. SECURITY HARDENING
   * ============================================================ */
  var Security = {
    /* Sanitize user input - prevent XSS */
    sanitize: function(str) {
      if (!str) return '';
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    /* Validate email */
    isValidEmail: function(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /* Validate Algerian phone */
    isValidPhone: function(phone) {
      var clean = phone.replace(/[\s-]/g, '');
      return /^(05|06|07)\d{8}$/.test(clean);
    },

    /* Secure form input with sanitization + validation */
    secureField: function(input) {
      if (!input) return '';
      /* Strip HTML tags */
      input = input.replace(/<[^>]*>/g, '');
      /* Normalize whitespace */
      input = input.replace(/\s+/g, ' ').trim();
      /* Limit length */
      return input;
    },

    /* Confirm sensitive action with dialog */
    confirmAction: function(message) {
      return confirm(message || '\u{1F6AB} هل أنت متأكد من هذا الإجراء؟');
    },

    /* Log security events */
    logEvent: function(eventType, details) {
      try {
        var log = JSON.parse(localStorage.getItem('bba_security_log') || '[]');
        log.push({ type: eventType, details: details, timestamp: new Date().toISOString() });
        /* Keep last 100 entries */
        if (log.length > 100) log = log.slice(-100);
        localStorage.setItem('bba_security_log', JSON.stringify(log));
      } catch(e) {}
    }
  };

  /* ============================================================
   * 5. PWA REGISTRATION
   * ============================================================ */
  function registerPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then(function(reg) {
        /* Check for updates */
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showPlatformToast('\u{1F504} تم تحديث المنصة! أعد التحميل للحصول على آخر إصدار', 'info');
            }
          });
        });
      }).catch(function(err) {
        console.warn('SW registration failed:', err);
      });
    }
  }

  /* ============================================================
   * 6. LOADING SKELETONS
   * ============================================================ */
  function createSkeleton(container, count, type) {
    if (!container) return;
    type = type || 'card';
    var html = '';
    for (var i = 0; i < (count || 3); i++) {
      if (type === 'card') {
        html += '<div class="skeleton-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1rem">' +
          '<div class="skeleton-line w-60" style="height:16px;width:60%;margin-bottom:0.75rem"></div>' +
          '<div class="skeleton-line w-90" style="height:12px;width:90%;margin-bottom:0.5rem"></div>' +
          '<div class="skeleton-line w-75" style="height:12px;width:75%;margin-bottom:0.5rem"></div>' +
          '<div class="skeleton-line w-40" style="height:30px;width:40%;margin-top:1rem"></div>' +
          '</div>';
      } else if (type === 'stat') {
        html += '<div class="skeleton-stat" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;text-align:center">' +
          '<div class="skeleton-line" style="height:24px;width:40px;margin:0 auto 0.5rem;border-radius:50%"></div>' +
          '<div class="skeleton-line" style="height:28px;width:60px;margin:0 auto 0.5rem"></div>' +
          '<div class="skeleton-line" style="height:12px;width:80px;margin:0 auto"></div>' +
          '</div>';
      }
    }
    container.innerHTML = html;
  }

  /* ============================================================
   * 7. PLATFORM TOAST (Independent, safe to use anywhere)
   * ============================================================ */
  window.showPlatformToast = function(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      c.className = 'toast-container';
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-atomic', 'true');
      document.body.appendChild(c);
    }
    var icons = {
      success: '\u2705',
      error: '\u274C',
      info: '\u2139\uFE0F'
    };
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + msg + '</span>';
    c.appendChild(t);
    setTimeout(function() {
      t.classList.add('toast-exit');
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 4000);
  };

  /* ============================================================
   * EXPOSE PUBLIC API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.Theme = ThemeEngine;
  window.BBA.Animations = AnimationEngine;
  window.BBA.AntiSpam = AntiSpam;
  window.BBA.Security = Security;
  window.BBA.createSkeleton = createSkeleton;
  window.BBA.showToast = window.showPlatformToast;

  /* ============================================================
   * DATABASE INTEGRATION - Auto-sync helper
   * ============================================================ */
  function initDatabaseIntegration() {
    /* Wait for BBA.DB to be available (loaded from database.js) */
    var checkDb = setInterval(function() {
      if (window.BBA && window.BBA.DB) {
        clearInterval(checkDb);
        /* Set up auto-sync every 30 seconds */
        setInterval(function() {
          if (window.BBA.DB.isOnline()) {
            window.BBA.DB.syncAll();
          }
        }, 30000);
        console.log('✅ [BBA] Database auto-sync enabled');
      }
    }, 500);
  }

  /* ============================================================
   * AUTO-INIT ON DOM READY
   * ============================================================ */
  function init() {
    ThemeEngine.init();
    AnimationEngine.init();
    registerPWA();
    initDatabaseIntegration();

    /* Inject ripple effect styles */
    if (!document.getElementById('bba-core-styles')) {
      var style = document.createElement('style');
      style.id = 'bba-core-styles';
      style.textContent =
        /* Ripple effect */
        '.ripple-effect{position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;z-index:1}' +
        '@keyframes rippleAnim{to{transform:scale(4);opacity:0}}' +
        /* Scroll reveal */
        '.reveal,.fade-in-up,.slide-up{opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease}' +
        '.reveal-visible,.fade-in-up.reveal-visible,.slide-up.reveal-visible{opacity:1;transform:translateY(0)}' +
        '.reveal-delay-1{transition-delay:0.1s}.reveal-delay-2{transition-delay:0.2s}.reveal-delay-3{transition-delay:0.3s}.reveal-delay-4{transition-delay:0.4s}' +
        /* Skeleton loading */
        '.skeleton-line{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:skeletonShimmer 1.5s ease-in-out infinite;border-radius:4px;margin-bottom:0.5rem}' +
        '@keyframes skeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +

        /* Smooth page transitions */
        '.page-transition{animation:fadeIn 0.4s ease}' +
        '@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
        /* Optimize animations for reduced motion */
        '@media(prefers-reduced-motion:reduce){.ripple-effect{display:none}.reveal,.fade-in-up,.slide-up{opacity:1;transform:none;transition:none}.skeleton-line{animation:none}}' +
        /* Responsive improvements */
        '@media(max-width:320px){.hero-stat{min-width:100px;padding:0.5rem 0.75rem}.hero-stat-value{font-size:1rem}}' +
        '@media(min-width:1920px){:root{--container:1400px}.hero-content{max-width:900px}}' +
        /* Touch-friendly improvements */
        '@media(hover:none){.btn:hover{transform:none}.stat-card:hover{transform:none}.article-card:hover{transform:none}}' +
        /* Focus styles for accessibility */
        'a:focus-visible,.btn:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:var(--radius-sm)}';
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
