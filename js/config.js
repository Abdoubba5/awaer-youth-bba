/* ============================================================
   منصة وعي الشباب BBA - Production Configuration Module
   Reads environment variables and provides a single CONFIG object.
   
   Supports:
   - Static env vars (set at build time)
   - Dynamic runtime overrides via window.__BBA_CONFIG__
   - Sensible defaults for local development
   ============================================================ */

(function initConfig() {
  'use strict';

  /* ============================================================
   * ENVIRONMENT CONFIGURATION SOURCE
   * Priority: window.__BBA_CONFIG__ > process.env > .env file > defaults
   * ============================================================ */

  function getEnv(name, defaultValue) {
    /* Check runtime override first */
    if (window.__BBA_CONFIG__ && window.__BBA_CONFIG__[name] !== undefined) {
      return window.__BBA_CONFIG__[name];
    }
    return defaultValue;
  }

  /* ============================================================
   * BUILD THE CONFIG OBJECT
   * ============================================================ */

  var CONFIG = {
    /* --- Supabase --- */
    supabaseUrl: getEnv('SUPABASE_URL', 'https://ouyqcyrbppkxvcknxtbn.supabase.co'),
    supabaseAnonKey: getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXFjeXJicHBreHZja254dGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjY1NzUsImV4cCI6MjA5NzA0MjU3NX0.w4j5sQP0kHjXeY7l7o6lJm11VN0RkFfFfh3HTL1w5Rk'),

    /* --- App --- */
    appName: getEnv('PWA_NAME', 'منصة وعي الشباب BBA'),
    appShortName: getEnv('PWA_SHORT_NAME', 'وعي BBA'),
    appBasePath: getEnv('APP_BASE_PATH', ''),
    publicUrl: getEnv('PUBLIC_URL', ''),

    /* --- Contact --- */
    contactEmail: getEnv('CONTACT_EMAIL', 'abdelilah.sidiali@univ-bba.dz'),
    contactPhone: getEnv('CONTACT_PHONE', '+213540735461'),
    contactPhoneAlt: getEnv('CONTACT_PHONE_ALT', '+213665376480'),
    contactWhatsApp: getEnv('CONTACT_WHATSAPP', '+213540735461'),

    /* --- Feature Flags --- */
    enableServiceWorker: getEnv('ENABLE_SERVICE_WORKER', 'true') === 'true',
    enableSupabaseSync: getEnv('ENABLE_SUPABASE_SYNC', 'true') === 'true',
    enableAnalytics: getEnv('ENABLE_ANALYTICS', 'false') === 'true',
    enableOfflineMode: getEnv('ENABLE_OFFLINE_MODE', 'true') === 'true',

    /* --- Derived / Computed --- */

    /* Get the base URL for the app (strip trailing slash & filename) */
    getBaseUrl: function() {
      if (this.publicUrl) {
        return (this.publicUrl + this.appBasePath).replace(/\/+$/, '');
      }
      var path = window.location.pathname;
      /* Remove trailing filename if present */
      path = path.replace(/\/[^/]*\.html$/, '');
      return window.location.protocol + '//' + window.location.host + path;
    },

    /* Get the verify URL for a certificate */
    getVerifyUrl: function(certNumber) {
      return this.getBaseUrl() + '/verify-certificate.html?id=' + encodeURIComponent(certNumber);
    },

    /* Check if we're in development mode */
    isDev: function() {
      return window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.indexOf('192.168.') === 0;
    },

    /* Is Supabase configured with real credentials? */
    hasSupabaseCredentials: function() {
      return this.supabaseUrl.indexOf('your-project') === -1 &&
             this.supabaseUrl.indexOf('supabase.co') !== -1;
    }
  };

  /* ============================================================
   * EXPOSE
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.Config = CONFIG;

  console.log('✅ [BBA Config] Module loaded' +
    (CONFIG.isDev() ? ' (development mode)' : ' (production mode)') +
    (CONFIG.hasSupabaseCredentials() ? '' : ' - ⚠️ Supabase using default credentials'));

})();
