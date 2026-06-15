/* ============================================================
   منصة وعي الشباب BBA - Auth Guard Module
   Protects dashboards with Supabase Auth + role-based access.
   Usage: BBA.AuthGuard.protectDashboard({ role: 'admin', redirect: 'index.html' })
   ============================================================ */

(function authGuard() {
  'use strict';

  var AUTH_GUARD = {
    /* ============================================================
     * PROTECT DASHBOARD
     * Checks auth session, verifies role, redirects if unauthorized.
     *
     * @param {Object} options
     * @param {string|string[]} options.role - Required role(s)
     * @param {string} [options.redirect='index.html'] - Fallback redirect
     * @param {string} [options.loginSelector] - CSS selector for login form
     * @param {string} [options.contentSelector] - CSS selector for protected content
     * @param {string} [options.errorSelector] - CSS selector for error message
     * @param {Function} [options.onSuccess] - Called after successful auth
     * ============================================================ */
    protectDashboard: async function(options) {
      if (!options) options = {};

      var requiredRoles = options.role || [];
      if (typeof requiredRoles === 'string') requiredRoles = [requiredRoles];
      var redirectUrl = options.redirect || 'index.html';

      var loginEl = document.querySelector(options.loginSelector || '#loginForm');
      var contentEl = document.querySelector(options.contentSelector || '#dashboardContent');
      var errorEl = document.querySelector(options.errorSelector || '#loginError');
      var loginScreen = document.querySelector(options.loginScreen || '#lockScreen');

      /* Wait for BBA.Auth to be ready */
      var auth = await waitForAuth();

      /* Try to restore existing session */
      var user = await auth.initSession();

      if (user && auth.isLoggedIn()) {
        var role = auth.getRole();

        /* Check role requirement */
        if (requiredRoles.length > 0 && requiredRoles.indexOf(role) === -1) {
          /* Wrong role - show error and redirect */
          showGuardError('ليس لديك صلاحية الوصول إلى هذه الصفحة');
          setTimeout(function() {
            window.location.href = redirectUrl;
          }, 2000);
          return false;
        }

        /* Auth passed! Show content */
        if (loginScreen) loginScreen.classList.add('hidden');
        if (contentEl) contentEl.style.display = 'block';

        if (typeof options.onSuccess === 'function') {
          options.onSuccess(user, role);
        }

        return { user: user, role: role };
      }

      /* No session - show login form and wait for submission */
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (contentEl) contentEl.style.display = 'none';

      if (loginEl) {
        var self = this;
        loginEl.addEventListener('submit', async function(e) {
          e.preventDefault();
          var emailInput = loginEl.querySelector('input[type="email"], input[name="email"]');
          var passInput = loginEl.querySelector('input[type="password"], input[name="password"]');

          if (!emailInput || !passInput) return;

          var email = emailInput.value.trim();
          var password = passInput.value;
          var submitBtn = loginEl.querySelector('button[type="submit"]');

          /* Show loading */
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> جاري تسجيل الدخول...';
          }

          var result = await auth.login(email, password);

          if (result.success) {
            var role = auth.getRole();

            /* Check role */
            if (requiredRoles.length > 0 && requiredRoles.indexOf(role) === -1) {
              showGuardError('ليس لديك صلاحية الوصول إلى هذه الصفحة. سيتم تحويلك...');
              await auth.logout();
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'تسجيل الدخول';
              }
              setTimeout(function() {
                window.location.href = redirectUrl;
              }, 2000);
              return;
            }

            /* Success! */
            if (errorEl) errorEl.classList.remove('visible');
            if (loginScreen) loginScreen.classList.add('hidden');
            if (contentEl) contentEl.style.display = 'block';

            if (typeof options.onSuccess === 'function') {
              options.onSuccess(user, role);
            }
          } else {
            /* Login failed */
            if (errorEl) {
              errorEl.classList.add('visible');
              var errorText = errorEl.querySelector('.error-text') || errorEl;
              if (errorText.tagName === 'DIV' || errorText.tagName === 'SPAN') {
                errorText.innerHTML = getErrorMessage(result.error);
              }
            }
            if (passInput) passInput.value = '';
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = options.loginBtnText || 'تسجيل الدخول';
            }
          }
        });
      }

      return false;
    },

    /* Logout and redirect */
    logout: async function(redirectUrl) {
      if (window.BBA && window.BBA.Auth) {
        await window.BBA.Auth.logout();
      }
      window.location.href = redirectUrl || 'index.html';
    }
  };

  /* ============================================================
   * HELPERS
   * ============================================================ */
  function waitForAuth() {
    return new Promise(function(resolve) {
      if (window.BBA && window.BBA.Auth) {
        resolve(window.BBA.Auth);
      } else {
        var check = setInterval(function() {
          if (window.BBA && window.BBA.Auth) {
            clearInterval(check);
            resolve(window.BBA.Auth);
          }
        }, 100);
        /* Timeout after 10 seconds */
        setTimeout(function() {
          clearInterval(check);
          resolve(window.BBA && window.BBA.Auth ? window.BBA.Auth : null);
        }, 10000);
      }
    });
  }

  function showGuardError(msg) {
    /* Use existing toast or show inline */
    if (window.BBA && window.BBA.showToast) {
      window.BBA.showToast(msg, 'error');
    } else if (window.showPlatformToast) {
      window.showPlatformToast(msg, 'error');
    } else if (typeof showToast === 'function') {
      showToast(msg, 'error');
    }
  }

  function getErrorMessage(error) {
    if (!error) return 'حدث خطأ غير متوقع';
    if (error.indexOf('Invalid login credentials') !== -1) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    if (error.indexOf('Email not confirmed') !== -1) return 'البريد الإلكتروني غير مؤكد. يرجى التحقق من بريدك';
    if (error.indexOf('Rate limit') !== -1) return 'تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً';
    if (error.indexOf('network') !== -1) return 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت';
    return error;
  }

  /* ============================================================
   * EXPOSE
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.AuthGuard = AUTH_GUARD;

})();
