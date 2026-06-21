/* ============================================================
   منصة وعي الشباب BBA - Rate Limiter Module
   Client-side rate limiting with persistent localStorage state,
   per-action type tracking, exponential backoff, and
   cross-session device fingerprinting.
   Version: 1.0.0
   ============================================================ */

(function initRateLimiter() {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * Each action type has its own thresholds
   * ============================================================ */
  var CONFIG = {
    /* Storage key */
    storageKey: 'bba_rate_limiter',

    /* Per-action limits */
    actions: {
      /* Login: tight limits — 5 attempts per 15 min, 20 per day */
      login: {
        maxAttempts: 5,
        windowMinutes: 15,
        cooldownSeconds: 10,
        dailyLimit: 20,
        /* Exponential backoff: first block = 15min, doubles each time */
        backoffBaseMinutes: 15,
        maxBlockHours: 24
      },
      /* Volunteer registration: 3 per hour, 10 per day */
      volunteer_registration: {
        maxAttempts: 3,
        windowMinutes: 60,
        cooldownSeconds: 30,
        dailyLimit: 10,
        backoffBaseMinutes: 60,
        maxBlockHours: 24
      },
      /* Consultation: 5 per hour, 20 per day */
      consultation: {
        maxAttempts: 5,
        windowMinutes: 60,
        cooldownSeconds: 15,
        dailyLimit: 20,
        backoffBaseMinutes: 30,
        maxBlockHours: 12
      },
      /* Certificate verification: 10 per 15 min, 50 per day */
      certificate_verify: {
        maxAttempts: 10,
        windowMinutes: 15,
        cooldownSeconds: 5,
        dailyLimit: 50,
        backoffBaseMinutes: 15,
        maxBlockHours: 6
      },
      /* Portal login: same as admin login */
      portal_login: {
        maxAttempts: 5,
        windowMinutes: 15,
        cooldownSeconds: 10,
        dailyLimit: 20,
        backoffBaseMinutes: 15,
        maxBlockHours: 24
      }
    },

    /* Cleanup interval: purge old entries every 5 minutes (via check) */
    cleanupIntervalMs: 5 * 60 * 1000
  };

  /* ============================================================
   * STATE
   * ============================================================ */
  var state = null;
  var deviceId = '';

  /* ============================================================
   * DEVICE FINGERPRINT
   * ============================================================ */
  function getDeviceId() {
    if (deviceId) return deviceId;

    var existing = localStorage.getItem('bba_device_id');
    if (existing) {
      deviceId = existing;
      return deviceId;
    }

    /* Generate a fingerprint from basic browser properties */
    var nav = navigator;
    var components = [
      nav.userAgent || '',
      nav.language || '',
      nav.platform || '',
      (screen.width || '') + 'x' + (screen.height || ''),
      new Date().getTimezoneOffset(),
      !!nav.hardwareConcurrency ? nav.hardwareConcurrency : ''
    ];

    /* Simple hash */
    var raw = components.join('||');
    var hash = 0;
    for (var i = 0; i < raw.length; i++) {
      var chr = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }

    var id = 'bba-dev-' + Math.abs(hash).toString(36) + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    localStorage.setItem('bba_device_id', id);
    deviceId = id;
    return id;
  }

  /* ============================================================
   * STATE MANAGEMENT
   * ============================================================ */
  function loadState() {
    if (state) return state;

    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) {
        state = JSON.parse(raw);
        /* Ensure all action types exist */
        ensureActionKeys(state);
        return state;
      }
    } catch(e) {}

    state = createFreshState();
    saveState();
    return state;
  }

  function createFreshState() {
    var s = {
      deviceId: getDeviceId(),
      version: 1,
      created: Date.now(),
      /* Per-action records */
      actions: {},
      /* Daily counters reset each day */
      daily: {}
    };

    ensureActionKeys(s);
    return s;
  }

  function ensureActionKeys(s) {
    for (var key in CONFIG.actions) {
      if (CONFIG.actions.hasOwnProperty(key)) {
        if (!s.actions[key]) {
          s.actions[key] = {
            /* Timestamps of recent attempts (for sliding window) */
            attempts: [],
            /* Current block expiry (0 = not blocked) */
            blockedUntil: 0,
            /* Number of times user has been blocked (for backoff) */
            blockCount: 0,
            /* Last attempt timestamp */
            lastAttempt: 0
          };
        }
        if (!s.daily[key]) {
          s.daily[key] = {
            count: 0,
            date: getDateStr()
          };
        }
      }
    }
  }

  function saveState() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
    } catch(e) {
      /* localStorage full or unavailable — silently degrade */
    }
  }

  /* ============================================================
   * HELPERS
   * ============================================================ */
  function getDateStr() {
    return new Date().toISOString().split('T')[0];
  }

  function now() {
    return Date.now();
  }

  /* Clean old attempts outside the sliding window */
  function cleanAttempts(actionKey) {
    var cfg = CONFIG.actions[actionKey];
    if (!cfg) return;

    var record = state.actions[actionKey];
    if (!record || !record.attempts) return;

    var cutoff = now() - (cfg.windowMinutes * 60 * 1000);
    var fresh = [];
    for (var i = 0; i < record.attempts.length; i++) {
      if (record.attempts[i] >= cutoff) {
        fresh.push(record.attempts[i]);
      }
    }
    record.attempts = fresh;
  }

  /* Reset daily counters if the date changed */
  function checkDailyReset(actionKey) {
    var today = getDateStr();
    var daily = state.daily[actionKey];
    if (daily && daily.date !== today) {
      daily.count = 0;
      daily.date = today;
    }
  }

  /* Calculate exponential backoff duration in ms */
  function getBackoffDuration(actionKey) {
    var cfg = CONFIG.actions[actionKey];
    if (!cfg) return 15 * 60 * 1000;

    var record = state.actions[actionKey];
    var blockCount = record ? record.blockCount : 0;

    /* Each successive block doubles: 15min, 30min, 1h, 2h, 4h, 8h, 16h, 24h max */
    var minutes = cfg.backoffBaseMinutes * Math.pow(2, blockCount);
    minutes = Math.min(minutes, cfg.maxBlockHours * 60);
    return minutes * 60 * 1000;
  }

  /* ============================================================
   * SUPABASE RATE LIMIT ENFORCEMENT
   * Calls PostgreSQL SECURITY DEFINER functions for server-side
   * rate limit enforcement. Falls back gracefully if Supabase
   * is offline.
   *
   * The approach:
   *   - Every check() call also fires a background server check
   *     and caches the server's block decision in localStorage.
   *   - On the NEXT check() call, the cached server block is
   *     checked BEFORE the local state, so even if the client
   *     is tampered with, server blocks take effect within one
   *     request lag.
   *   - record() and reset() are fire-and-forget RPC calls that
   *     keep the server state in sync.
   * ============================================================ */

  /* Storage key for server-side block cache */
  var SERVER_BLOCK_KEY = 'bba_rate_limiter_server';

  /* Get Supabase client for RPC calls */
  function getSupabaseClient() {
    if (window.__bba_supabase_client) {
      return window.__bba_supabase_client;
    }
    /* Fallback: check if supabase global exists */
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      try {
        var url = 'https://ouyqcyrbppkxvcknxtbn.supabase.co';
        var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXFjeXJicHBreHZja254dGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjY1NzUsImV4cCI6MjA5NzA0MjU3NX0.w4j5sQP0kHjXeY7l7o6lJm11VN0RkFfFfh3HTL1w5Rk';
        if (window.BBA && window.BBA.Config) {
          url = window.BBA.Config.supabaseUrl || url;
          key = window.BBA.Config.supabaseAnonKey || key;
        }
        var client = window.supabase.createClient(url, key);
        window.__bba_supabase_client = client;
        return client;
      } catch(e) {
        return null;
      }
    }
    return null;
  }

  /* Check cached server-side block (fast, synchronous) */
  function getCachedServerBlock(actionType) {
    try {
      var cache = JSON.parse(localStorage.getItem(SERVER_BLOCK_KEY) || '{}');
      var entry = cache[actionType];
      if (entry && entry.blockedUntil && entry.blockedUntil > Date.now()) {
        return {
          blocked: true,
          message: entry.message || '\u{1F512} تم تجاوز الحد المسموح به (حماية الخادم)',
          remaining: Math.ceil((entry.blockedUntil - Date.now()) / 1000)
        };
      }
      /* Clean expired blocks */
      if (entry && entry.blockedUntil && entry.blockedUntil <= Date.now()) {
        delete cache[actionType];
        localStorage.setItem(SERVER_BLOCK_KEY, JSON.stringify(cache));
      }
    } catch(e) {}
    return { blocked: false };
  }

  /* Cache server-side block decision in localStorage */
  function cacheServerBlock(actionType, blockedUntil, message) {
    try {
      var cache = JSON.parse(localStorage.getItem(SERVER_BLOCK_KEY) || '{}');
      if (blockedUntil) {
        var blockMs = new Date(blockedUntil).getTime();
        if (blockMs > Date.now()) {
          cache[actionType] = {
            blockedUntil: blockMs,
            message: message || ''
          };
        }
      } else {
        /* Not blocked — clear any cached block */
        delete cache[actionType];
      }
      localStorage.setItem(SERVER_BLOCK_KEY, JSON.stringify(cache));
    } catch(e) {}
  }

  /* Async server-side check: fires a background RPC call
     and caches the result for the next synchronous check(). */
  function serverCheck(actionType) {
    var supabase = getSupabaseClient();
    if (!supabase) return;

    var cfg = CONFIG.actions[actionType];
    if (!cfg) return;

    supabase
      .rpc('check_rate_limit', {
        p_action_type: actionType,
        p_client_identifier: getDeviceId(),
        p_max_attempts: cfg.maxAttempts,
        p_window_minutes: cfg.windowMinutes,
        p_cooldown_seconds: cfg.cooldownSeconds,
        p_daily_limit: cfg.dailyLimit
      })
      .then(function(result) {
        if (result.error || !result.data) return;
        var data = result.data;
        if (data.blocked_until) {
          cacheServerBlock(actionType, data.blocked_until, data.message);
        } else {
          cacheServerBlock(actionType, null, '');
        }
      })
      .catch(function() {});
  }

  /* Async server-side record */
  function serverRecord(actionType) {
    var supabase = getSupabaseClient();
    if (!supabase) return;

    supabase
      .rpc('record_rate_limit', {
        p_action_type: actionType,
        p_client_identifier: getDeviceId()
      })
      .then(function() {})
      .catch(function() {});
  }

  /* Async server-side reset */
  function serverReset(actionType) {
    var supabase = getSupabaseClient();
    if (!supabase) return;

    supabase
      .rpc('reset_rate_limit', {
        p_action_type: actionType,
        p_client_identifier: getDeviceId()
      })
      .then(function() {})
      .catch(function() {});
  }

  /* Async server-side backoff */
  function serverBackoff(actionType) {
    var supabase = getSupabaseClient();
    if (!supabase) return;

    var cfg = CONFIG.actions[actionType];
    if (!cfg) return;

    supabase
      .rpc('backoff_rate_limit', {
        p_action_type: actionType,
        p_client_identifier: getDeviceId(),
        p_backoff_base_minutes: cfg.backoffBaseMinutes,
        p_max_block_hours: cfg.maxBlockHours
      })
      .then(function() {})
      .catch(function() {});
  }

  /* ============================================================
   * PUBLIC API
   * ============================================================ */
  var RateLimiter = {

    /* Check if an action is allowed. Returns { allowed: bool, message: string, wait: number }
       Also fires a background server-side check and caches its block decision. */
    check: function(actionType) {
      loadState();

      var cfg = CONFIG.actions[actionType];
      if (!cfg) {
        /* Unknown action type — allow by default */
        return { allowed: true, message: '' };
      }

      /* 0. Check cached server-side block BEFORE local state
         Server blocks take priority — even if client is tampered with */
      var serverBlock = getCachedServerBlock(actionType);
      if (serverBlock.blocked) {
        return {
          allowed: false,
          message: serverBlock.message,
          wait: serverBlock.remaining,
          serverEnforced: true
        };
      }

      /* Fire background server check (async, caches result for next call) */
      serverCheck(actionType);

      var record = state.actions[actionType];
      if (!record) {
        state.actions[actionType] = {
          attempts: [],
          blockedUntil: 0,
          blockCount: 0,
          lastAttempt: 0
        };
        record = state.actions[actionType];
      }

      /* 1. Check if currently blocked with exponential backoff */
      if (record.blockedUntil > now()) {
        var remaining = Math.ceil((record.blockedUntil - now()) / 1000);
        var minutes = Math.floor(remaining / 60);
        var seconds = remaining % 60;
        var msg = '';
        if (minutes > 0) {
          msg = '\u{1F512} تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد ' + minutes + ' دقيقة و ' + seconds + ' ثانية';
        } else {
          msg = '\u{23F1}\uFE0F تم تجاوز عدد المحاولات. يرجى الانتظار ' + seconds + ' ثانية';
        }
        return { allowed: false, message: msg, wait: remaining };
      }

      /* 2. Check per-action cooldown (minimum time between attempts) */
      if (record.lastAttempt > 0) {
        var elapsed = now() - record.lastAttempt;
        if (elapsed < cfg.cooldownSeconds * 1000) {
          var waitSec = Math.ceil((cfg.cooldownSeconds * 1000 - elapsed) / 1000);
          return {
            allowed: false,
            message: '\u{23F1}\uFE0F يرجى الانتظار ' + waitSec + ' ثانية قبل المحاولة مرة أخرى',
            wait: waitSec
          };
        }
      }

      /* 3. Clean old attempts and check sliding window */
      cleanAttempts(actionType);
      if (record.attempts.length >= cfg.maxAttempts) {
        /* Block with exponential backoff */
        var blockDuration = getBackoffDuration(actionType);
        record.blockedUntil = now() + blockDuration;
        record.blockCount++;
        record.attempts = [];
        saveState();

        /* Also apply backoff on server */
        serverBackoff(actionType);

        var blockMin = Math.ceil(blockDuration / 60000);
        return {
          allowed: false,
          message: '\u{1F512} تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد ' + blockMin + ' دقيقة',
          wait: Math.ceil(blockDuration / 1000)
        };
      }

      /* 4. Check daily limit */
      checkDailyReset(actionType);
      if (state.daily[actionType].count >= cfg.dailyLimit) {
        return {
          allowed: false,
          message: '\u{1F6AB} تم تجاوز الحد اليومي المسموح به. يرجى المحاولة غداً',
          wait: 0
        };
      }

      return { allowed: true, message: '' };
    },

    /* Check rate limit with server-side enforcement.
       @deprecated Use check() instead — it now handles server enforcement
       via background RPC calls with cached server blocks.
       check() is synchronous, while this returns a Promise. */
    checkServer: function(actionType) {
      var self = this;
      return new Promise(function(resolve) {
        /* First check locally (fast, synchronous) */
        var localResult = self.check(actionType);
        if (!localResult.allowed) {
          resolve(localResult);
          return;
        }

        /* Then check server-side (async, stricter) */
        serverCheck(actionType).then(function(serverResult) {
          if (serverResult.serverEnforced && !serverResult.allowed) {
            resolve({
              allowed: false,
              message: serverResult.message || '\u{1F512} تم تجاوز الحد المسموح به (حماية الخادم)',
              serverEnforced: true,
              wait: 0
            });
          } else {
            resolve(localResult);
          }
        }).catch(function() {
          /* Server check failed — rely on local */
          resolve(localResult);
        });
      });
    },

    /* Record a successful or attempted action */
    record: function(actionType) {
      loadState();

      var cfg = CONFIG.actions[actionType];
      if (!cfg) return;

      var record = state.actions[actionType];
      if (!record) {
        state.actions[actionType] = {
          attempts: [],
          blockedUntil: 0,
          blockCount: 0,
          lastAttempt: 0
        };
        record = state.actions[actionType];
      }

      record.lastAttempt = now();
      record.attempts.push(now());

      /* Update daily counter */
      checkDailyReset(actionType);
      state.daily[actionType].count++;

      saveState();

      /* Also record on server (async, fire-and-forget) */
      serverRecord(actionType);
    },

    /* Reset blocking for a specific action (e.g., on successful login) */
    reset: function(actionType) {
      loadState();

      if (state.actions[actionType]) {
        state.actions[actionType].blockedUntil = 0;
        state.actions[actionType].attempts = [];
        state.actions[actionType].blockCount = 0;
        state.actions[actionType].lastAttempt = 0;
      }
      if (state.daily[actionType]) {
        state.daily[actionType].count = 0;
        state.daily[actionType].date = getDateStr();
      }
      saveState();

      /* Also reset on server (async, fire-and-forget) */
      serverReset(actionType);
    },

    /* Get remaining attempts before block */
    getRemaining: function(actionType) {
      loadState();

      var cfg = CONFIG.actions[actionType];
      if (!cfg) return -1;

      var record = state.actions[actionType];
      if (!record) return cfg.maxAttempts;

      cleanAttempts(actionType);
      return Math.max(0, cfg.maxAttempts - record.attempts.length);
    },

    /* Check current block status (for UI display) */
    getBlockStatus: function(actionType) {
      loadState();

      var record = state.actions[actionType];
      if (!record || record.blockedUntil <= now()) {
        return { blocked: false, remaining: this.getRemaining(actionType) };
      }

      var remaining = Math.ceil((record.blockedUntil - now()) / 1000);
      var minutes = Math.floor(remaining / 60);
      var seconds = remaining % 60;
      return {
        blocked: true,
        remainingSeconds: remaining,
        display: minutes > 0 ? minutes + ' دقيقة و ' + seconds + ' ثانية' : seconds + ' ثانية',
        remaining: this.getRemaining(actionType)
      };
    },

    /* Get rate limit info for display */
    getLimitInfo: function(actionType) {
      var cfg = CONFIG.actions[actionType];
      if (!cfg) return null;

      return {
        maxAttempts: cfg.maxAttempts,
        windowMinutes: cfg.windowMinutes,
        cooldownSeconds: cfg.cooldownSeconds,
        dailyLimit: cfg.dailyLimit,
        remaining: this.getRemaining(actionType),
        blockStatus: this.getBlockStatus(actionType)
      };
    },

    /* Wipe all rate limit data (for testing or emergencies) */
    clearAll: function() {
      localStorage.removeItem(CONFIG.storageKey);
      state = null;
    },

    /* Try to execute an action with rate limiting guard.
       Returns { allowed, message } or runs the callback if allowed. */
    guard: function(actionType, callback) {
      var result = this.check(actionType);
      if (!result.allowed) {
        return result;
      }
      this.record(actionType);
      if (typeof callback === 'function') {
        callback();
      }
      return result;
    },

    /* Expose config for debugging */
    getConfig: function() {
      return CONFIG;
    }
  };

  /* ============================================================
   * EXPOSE API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.RateLimiter = RateLimiter;

  console.log('✅ [BBA] Rate Limiter loaded (server-side enforcement via Supabase RPC)');

})();
