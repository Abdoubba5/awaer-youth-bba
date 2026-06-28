/* ============================================================
   منصة وعي الشباب BBA - Supabase Database Module
   Data access layer with localStorage fallback
   Version: 1.0.0
   ============================================================ */

(function initDatabase() {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  /* Load Supabase credentials from configuration module */
  var supabaseUrl = 'https://ouyqcyrbppkxvcknxtbn.supabase.co';
  var supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXFjeXJicHBreHZja254dGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjY1NzUsImV4cCI6MjA5NzA0MjU3NX0.w4j5sQP0kHjXeY7l7o6lJm11VN0RkFfFfh3HTL1w5Rk';
  if (window.BBA && window.BBA.Config) {
    supabaseUrl = window.BBA.Config.supabaseUrl;
    supabaseAnonKey = window.BBA.Config.supabaseAnonKey;
  }

  var CONFIG = {
    supabaseUrl: supabaseUrl,
    supabaseAnonKey: supabaseAnonKey,
    /* localStorage → Supabase table name mapping */
    tableMap: {
      'bba_volunteers': 'volunteers',
      'bba_consultations': 'consultations',
      'bba_certificates': 'certificates',
      'bba_events': 'events',
      'bba_tasks': 'tasks',
      'bba_teams': 'teams',
      'bba_achievements': 'achievements',
      'bba_activity_log': 'activity_log',
      'bba_notifications_data': 'notifications'
    },
    /* CMS keys stored in cms_content table */
    cmsKeys: [
      'cms_hero', 'cms_notice_bar', 'cms_achievements_page',
      'cms_articles', 'cms_testimonials', 'cms_faq', 'cms_partners',
      'cms_gallery', 'cms_videos', 'cms_library', 'cms_surveys',
      'cms_rehabilitation', 'cms_navigation', 'cms_footer', 'cms_social',
      'cms_stats', 'cms_cta', 'cms_about', 'cms_team_members',
      'cms_activities_cms', 'cms_seo', 'cms_global', 'cms_contact',
      'cms_announcements', 'cms_calendar',
      'hero', 'notice_bar', 'testimonials', 'faq', 'partners',
      'articles', 'gallery', 'videos', 'library', 'surveys', 'rehabilitation',
      'navigation', 'footer', 'social',
      'stats', 'cta', 'about', 'team_members',
      'activities_cms', 'seo', 'global', 'contact',
      'announcements', 'calendar'
    ],
    /* Keys that are single objects (not arrays) */
    singleObjectKeys: [
      'bba_cms_hero', 'bba_cms_notice_bar', 'bba_cms_achievements_page',
      'bba_cms_navigation', 'bba_cms_footer', 'bba_cms_social',
      'bba_cms_cta', 'bba_cms_about', 'bba_cms_activities_cms',
      'bba_cms_seo', 'bba_cms_global', 'bba_cms_contact',
      'cms_hero', 'cms_notice_bar', 'cms_achievements_page',
      'cms_navigation', 'cms_footer', 'cms_social',
      'cms_cta', 'cms_about', 'cms_activities_cms',
      'cms_seo', 'cms_global', 'cms_contact',
      'hero', 'notice_bar', 'navigation', 'footer', 'social',
      'cta', 'about', 'activities_cms', 'seo', 'global', 'contact'
    ]
  };

  /* ============================================================
   * LOCALSTORAGE AUTO-SYNC PATCH
   * Monkey-patch localStorage.setItem so every write to
   * BBA data keys (bba_volunteers, bba_consultations, etc.)
   * automatically triggers a sync to Supabase.
   * This covers all existing code (admin.js, portal.js, app.js)
   * without modifying them individually.
   * ============================================================ */
  var BBA_SYNC_KEYS = {
    'bba_volunteers': true,
    'bba_consultations': true,
    'bba_certificates': true,
    'bba_events': true,
    'bba_tasks': true,
    'bba_teams': true,
    'bba_achievements': true,
    'bba_activity_log': true,
    'bba_notifications_data': true
  };    (function patchLocalStorage() {
    var originalSet;
    try {
      originalSet = localStorage.setItem.bind(localStorage);
    } catch (e) {
      /* 🚨 FALLBACK: Mobile Safari (iOS private browsing) may block localStorage.setItem binding */
      console.error('[BBA DB] 🚨 FALLBACK — Cannot bind localStorage.setItem, sync through monkey-patch is disabled');
      console.error('[BBA DB] 🚨 Exception name:', e.name);
      console.error('[BBA DB] 🚨 Exception message:', e.message);
      console.error('[BBA DB] 🚨 Likely cause: iOS Safari private browsing or restricted Android WebView');
      console.error('[BBA DB] 🚨 Impact: Automatic sync via localStorage.setItem will not work. Online-first insert methods still attempt Supabase directly.');
      return;
    }

    /* Expose the original setItem so online-first insert methods can write
       localStorage cache without triggering the monkey-patch double-sync. */
    window.__bba_original_setItem = originalSet;

    try {
      /* In strict mode, some mobile browsers (iOS Safari, Samsung Internet) may
         throw if localStorage.setItem is non-writable. Try-catch ensures the
         entire app doesn't break when this fails. */
      var patched = function(key, value) {
        try {
          originalSet(key, value);
        } catch (e) {
          /* 🚨 FALLBACK: Mobile private browsing may throw on setItem entirely */
          console.error('[BBA DB] 🚨 FALLBACK — localStorage.setItem threw during write');
          console.error('[BBA DB] 🚨 Exception name:', e.name);
          console.error('[BBA DB] 🚨 Exception message:', e.message);
          console.error('[BBA DB] 🚨 Key:', key);
          return;
        }

        if (!(BBA_SYNC_KEYS[key] || key.indexOf('bba_points_') === 0 || key.indexOf('bba_cms_') === 0)) return;

        /* ⚠️ CRITICAL: During initial pull on mobile (slow network), IS_INITIAL_PULLING
           may be true for several seconds. Previously we dropped the sync silently,
           causing form submissions during this window to NEVER reach Supabase.
           Now we buffer the key and flush after initialPull() completes. */
        if (IS_INITIAL_PULLING) {
          console.log('[SYNC DEBUG] ⏳ initialPull in progress — buffering sync for:', key);
          if (PENDING_PULLING_SYNCS.indexOf(key) === -1) {
            PENDING_PULLING_SYNCS.push(key);
          }
          return;
        }

        console.log('[SYNC DEBUG] 📝 setItem trigger — queueing sync for:', key);
        setTimeout(function() {
          if (window.BBA && window.BBA.DB) {
            if (key.indexOf('bba_points_') === 0) {
              if (typeof pushPoints === 'function') {
                pushPoints();
              }
            } else {
              window.BBA.DB.syncNow(key);
            }
          }
        }, 10);
      };

      localStorage.setItem = patched;
      console.log('[BBA DB] localStorage.setItem patched successfully');
    } catch (e) {
      /* 🚨 FALLBACK: On mobile browsers where localStorage.setItem is non-configurable,
         this throws in strict mode. */
      console.error('[BBA DB] 🚨 FALLBACK — localStorage.setItem patch assignment failed');
      console.error('[BBA DB] 🚨 Exception name:', e.name);
      console.error('[BBA DB] 🚨 Exception message:', e.message);
      console.error('[BBA DB] 🚨 Likely cause: Strict mode prohibits assignment to non-writable built-in on this browser');
      console.error('[BBA DB] 🚨 Impact: Automatic sync via monkey-patch disabled. Online-first insert methods in insertVolunteer/insertConsultation still work.');
    }
  })();

  /* ============================================================
   * STATE
   * ============================================================ */
  var supabaseClient = null;
  var isConnected = false;
  var initPromise = null;
  var syncQueue = [];
  var isSyncing = false;
  var lastSyncTime = {};
  var SYNC_COOLDOWN = 2000; /* 2 seconds between syncs */
  var IS_INITIAL_PULLING = false; /* Prevents re-sync during initial pull */
  var PENDING_PULLING_SYNCS = []; /* Keys queued during initial pull, flushed after */

  /* ============================================================
   * INITIALIZATION
   * ============================================================ */
  function init() {
    if (initPromise) return initPromise;

    /* ═══ CRITICAL RACE CONDITION FIX ═══
       On mobile devices, the Supabase CDN script may not be loaded yet when
       database.js runs (slow 3G/4G). Previously, the one-time check
       `if (typeof window.supabase === 'undefined')` failed immediately and
       permanently set isConnected=false, causing ALL form submissions to
       fall back to localStorage forever — even if the CDN script arrived
       200ms later.
       
       Now we POLL every 100ms for up to 5 seconds, waiting for
       window.supabase.createClient to become available. This gives the
       CDN script enough time to load on mobile networks.
       Only fall to offline mode after 50 failed retries (5 seconds). */

    initPromise = new Promise(function(resolve) {
      var MAX_RETRY_MS = 5000;
      var RETRY_INTERVAL_MS = 100;
      var MAX_RETRIES = Math.floor(MAX_RETRY_MS / RETRY_INTERVAL_MS); /* 50 */
      var startTime = Date.now();
      var retryCount = 0;

      function attemptInit() {
        var elapsed = Date.now() - startTime;

        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
          /* ✅ Success — Supabase JS library is available after waiting */
          console.log('[BBA DB] ✅ Supabase JS library detected after ' + elapsed + 'ms (' + retryCount + ' retries)');

          try {
            supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
              auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
              }
            });
            isConnected = true;
            console.log('✅ [BBA DB] Supabase client initialized at ' + elapsed + 'ms');

            /* Initial sync: pull data from Supabase into localStorage */
            IS_INITIAL_PULLING = true;
            initialPull().then(function() {
              IS_INITIAL_PULLING = false;
              /* ═══ CRITICAL FIX ═══
                 Flush any syncs that were buffered during initialPull().
                 On mobile (slow 3G/4G), initialPull takes 1-3 seconds.
                 Any form submissions during that window were buffered
                 in PENDING_PULLING_SYNCS instead of being silently dropped.
                 Now we flush them so they actually reach Supabase. */
              if (PENDING_PULLING_SYNCS.length > 0) {
                console.log('[SYNC DEBUG] 🔄 Flushing ' + PENDING_PULLING_SYNCS.length + ' buffered syncs from initial pull period:', PENDING_PULLING_SYNCS.join(','));
                for (var pi = 0; pi < PENDING_PULLING_SYNCS.length; pi++) {
                  queueSync(PENDING_PULLING_SYNCS[pi]);
                }
                PENDING_PULLING_SYNCS = [];
              }
              resolve(true);
            }).catch(function(err) {
              IS_INITIAL_PULLING = false;
              console.error('[BBA DB] 🚨 FALLBACK — initialPull failed');
              console.error('[BBA DB] 🚨 Exception name:', err && err.name ? err.name : 'N/A');
              console.error('[BBA DB] 🚨 Exception message:', err && err.message ? err.message : 'unknown error');
              console.error('[BBA DB] 🚨 Exception details:', err && err.details ? err.details : 'N/A');
              /* Still flush pending syncs even if pull failed */
              if (PENDING_PULLING_SYNCS.length > 0) {
                console.log('[SYNC DEBUG] 🔄 Flushing ' + PENDING_PULLING_SYNCS.length + ' buffered syncs despite pull failure');
                for (var pi = 0; pi < PENDING_PULLING_SYNCS.length; pi++) {
                  queueSync(PENDING_PULLING_SYNCS[pi]);
                }
                PENDING_PULLING_SYNCS = [];
              }
              resolve(false);
            });
          } catch (err) {
            console.error('[BBA DB] 🚨 FALLBACK — Supabase client creation threw');
            console.error('[BBA DB] 🚨 Exception name:', err.name);
            console.error('[BBA DB] 🚨 Exception message:', err.message);
            console.error('[BBA DB] 🚨 Exception stack:', err.stack ? err.stack.split('\n').slice(0, 3).join('\n') : 'N/A');
            console.error('[BBA DB] 🚨 typeof window.supabase:', typeof window.supabase);
            console.error('[BBA DB] 🚨 typeof window.supabase.createClient:', typeof (window.supabase && window.supabase.createClient));
            console.error('[BBA DB] 🚨 Impact: isConnected=false. insertVolunteer/insertConsultation will bypass Supabase and fall back to localStorage.');
            isConnected = false;
            resolve(false);
          }
        } else if (elapsed >= MAX_RETRY_MS) {
          /* ⏰ Timeout — all retries exhausted, fall back to offline mode */
          var totalRetries = retryCount;
          console.error('[BBA DB] 🚨 FALLBACK — Supabase JS library not loaded within ' + MAX_RETRY_MS + 'ms (' + totalRetries + ' retries)');
          console.error('[BBA DB] 🚨 Total time waited:', elapsed + 'ms');
          console.error('[BBA DB] 🚨 Total retries:', totalRetries);
          console.error('[BBA DB] 🚨 typeof window.supabase:', typeof window.supabase);
          console.error('[BBA DB] 🚨 typeof window.supabase.createClient:', typeof (window.supabase && window.supabase.createClient));
          console.error('[BBA DB] 🚨 Likely cause: Supabase CDN script failed to load on this device (network issue on mobile)');
          console.error('[BBA DB] 🚨 Impact: supabaseClient is null. All inserts go to localStorage only until page refresh.');
          isConnected = false;
          resolve(false);
        } else {
          /* ⏳ Supabase not available yet — retry after 100ms */
          retryCount++;
          if (retryCount === 1 || retryCount % 10 === 0 || retryCount === MAX_RETRIES) {
            var pct = Math.round((elapsed / MAX_RETRY_MS) * 100);
            console.log('[BBA DB] ⏳ Waiting for Supabase JS library... retry ' + retryCount + '/' + MAX_RETRIES + ' (' + elapsed + 'ms elapsed, ' + pct + '%)');
          }
          setTimeout(attemptInit, RETRY_INTERVAL_MS);
        }
      }

      /* Start the polling loop */
      console.log('[BBA DB] ⏳ Starting Supabase JS polling (retrying every ' + RETRY_INTERVAL_MS + 'ms for up to ' + MAX_RETRY_MS + 'ms)...');
      attemptInit();
    });

    return initPromise;
  }

  /* ============================================================
   * INITIAL PULL: Load all data from Supabase → localStorage
   * ============================================================ */
  async function initialPull() {
    if (!isConnected || !supabaseClient) return;

    var tables = Object.keys(CONFIG.tableMap);
    var promises = [];

    for (var i = 0; i < tables.length; i++) {
      promises.push(pullTable(tables[i]));
    }

    /* Pull CMS content */
    promises.push(pullCmsContent());

    /* Pull points */
    promises.push(pullPoints());

    await Promise.allSettled(promises);
    console.log('✅ [BBA DB] Initial sync complete');
  }

  /* Pull a single table from Supabase */
  async function pullTable(localKey) {
    var tableName = CONFIG.tableMap[localKey];
    if (!tableName) return;

    try {
      var { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        /* Transform Supabase rows back to the format expected by the app */
        var items = data.map(function(row) {
          return transformRowFromDB(tableName, row);
        });
        localStorage.setItem(localKey, JSON.stringify(items));
        console.log('[BBA DB] Synced ' + localKey + ': ' + items.length + ' items');
      }
    } catch (err) {
      console.warn('[BBA DB] Failed to pull ' + localKey + ':', err.message);
    }
  }

  /* Pull CMS content from Supabase */
  async function pullCmsContent() {
    if (!isConnected || !supabaseClient) return;

    try {
      var { data, error } = await supabaseClient
        .from('cms_content')
        .select('*');

      if (error) throw error;

      if (data) {
        for (var i = 0; i < data.length; i++) {
          var entry = data[i];
          var lsKey = 'bba_' + entry.content_key;
          localStorage.setItem(lsKey, JSON.stringify(entry.content_data));
        }
        console.log('[BBA DB] Synced CMS content: ' + data.length + ' entries');
      }
    } catch (err) {
      console.warn('[BBA DB] Failed to pull CMS content:', err.message);
    }
  }

  /* ============================================================
   * FIELD NAME CONVERSION (camelCase ↔ snake_case)
   * ============================================================ */
  function camelToSnake(str) {
    return str.replace(/[A-Z]/g, function(m) { return '_' + m.toLowerCase(); });
  }

  function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, function(_, letter) { return letter.toUpperCase(); });
  }

  /* Fields that should NOT be sent to Supabase */
  var SKIP_FIELDS_TO_DB = {
    _supabase_id: true
  };

  /* Fields that should be skipped when reading from DB */
  var SKIP_FIELDS_FROM_DB = {
    id: true,
    created_at: true,
    updated_at: true
  };

  /* ============================================================
   * TRANSFORM: Convert between Supabase row format and app format
   * ============================================================ */
  function transformRowToDB(tableName, item) {
    var row = {};
    for (var key in item) {
      if (item.hasOwnProperty(key) && !SKIP_FIELDS_TO_DB[key]) {
        /* Convert camelCase → snake_case for Supabase column names */
        var dbKey = camelToSnake(key);
        row[dbKey] = item[key];
      }
    }
    return row;
  }

  function transformRowFromDB(tableName, row) {
    var item = {};
    for (var key in row) {
      if (row.hasOwnProperty(key) && !SKIP_FIELDS_FROM_DB[key]) {
        /* Convert snake_case → camelCase for app property names */
        var appKey = snakeToCamel(key);
        item[appKey] = row[key];
      }
    }
    /* Add the Supabase ID for reference */
    item._supabase_id = row.id;
    /* Ensure date field exists */
    if (!item.date && row.created_at) {
      item.date = row.created_at;
    }
    return item;
  }

  /* ============================================================
   * PUSH TO SUPABASE: Sync only unsynced records to Supabase
   * ============================================================
   * STRATEGY (v2):
   *   Instead of DELETE-all + INSERT-all (which causes RLS failures on DELETE,
   *   data loss on partial INSERT failure, and wasted bandwidth on mobile),
   *   we now:
   *   1. Read all items from localStorage
   *   2. Find items WITHOUT _supabase_id (never synced)
   *   3. INSERT each unsynced item individually with .select('id')
   *   4. Store the returned Supabase ID back to localStorage
   *   5. Log every failed record separately
   *   6. Skip items WITH _supabase_id (already synced, unchanged)
   *
   *   This is idempotent: records that have _supabase_id will never be
   *   re-inserted. Re-running pushTable() has no side effects.
   *   No DELETE is ever sent. No full-table overwrite occurs.
   * ============================================================ */
  async function pushTable(localKey) {
    console.log('[SYNC DEBUG] ===== pushTable START =====');
    console.log('[SYNC DEBUG] localKey:', localKey, '| isConnected:', isConnected, '| hasClient:', !!supabaseClient);

    if (!isConnected || !supabaseClient) {
      console.error('[BBA DB] 🚨 FALLBACK — pushTable: Not connected to Supabase, re-queueing sync for', localKey);
      console.error('[BBA DB] 🚨 isConnected:', isConnected, '| hasClient:', !!supabaseClient);
      queueSync(localKey);
      console.log('[SYNC DEBUG] ===== pushTable END (re-queued) =====');
      return;
    }

    var tableName = CONFIG.tableMap[localKey];
    if (!tableName) {
      console.error('[BBA DB] 🚨 FALLBACK — pushTable: No table mapping for', localKey);
      console.log('[SYNC DEBUG] ===== pushTable END (no mapping) =====');
      return;
    }
    console.log('[SYNC DEBUG] tableName:', tableName);

    try {
      var raw = localStorage.getItem(localKey);
      console.log('[SYNC DEBUG] localStorage read:', localKey, '| length:', raw ? raw.length : 0);
      if (!raw) {
        console.log('[SYNC DEBUG] No data in localStorage for', localKey);
        console.log('[SYNC DEBUG] ===== pushTable END (no data) =====');
        return;
      }

      var items;
      try { items = JSON.parse(raw); }
      catch(e) {
        console.error('[BBA DB] 🚨 FALLBACK — pushTable: JSON parse failed for', localKey);
        console.error('[BBA DB] 🚨 Exception name:', e.name);
        console.error('[BBA DB] 🚨 Exception message:', e.message);
        console.log('[SYNC DEBUG] ===== pushTable END (parse error) =====');
        return;
      }
      console.log('[SYNC DEBUG] Parsed items:', items.length);

      if (!Array.isArray(items) || items.length === 0) {
        console.log('[SYNC DEBUG] Empty array for', localKey);
        console.log('[SYNC DEBUG] ===== pushTable END (empty) =====');
        return;
      }

      /* ─── Step 1: Find records that need syncing ───
         Only sync items that don't have _supabase_id yet.
         Items with _supabase_id are already in Supabase and unchanged. */
      var rowsToSync = [];
      var syncIndices = [];
      for (var i = 0; i < items.length; i++) {
        if (!items[i]._supabase_id) {
          var row = transformRowToDB(tableName, items[i]);
          rowsToSync.push(row);
          syncIndices.push(i);
        }
      }

      if (rowsToSync.length === 0) {
        console.log('[BBA DB] ✅ pushTable: All', items.length, 'records already synced on', tableName, '— nothing to do');
        console.log('[SYNC DEBUG] ===== pushTable END (all synced) =====');
        return;
      }

      console.log('[BBA DB] pushTable: Syncing', rowsToSync.length, 'new record(s) to', tableName, '(', items.length, 'total records,', (items.length - rowsToSync.length), 'already synced)');

      /* ─── Step 2: Sync each unsynced record individually ───
         Each record is INSERTed with .select() so we get the
         Supabase-generated id back. This avoids batch failures:
         if one record fails (invalid data, RLS, etc.), the
         others still succeed. Failed records are logged separately. */
      var hasChanges = false;
      var failedRecords = [];

      for (var s = 0; s < rowsToSync.length; s++) {
        var row = rowsToSync[s];
        var originalIndex = syncIndices[s];

        try {
          console.log('[SYNC DEBUG] Upserting record', originalIndex, 'to', tableName);

          /* ═══ UPSERT WITH PRIMARY KEY ═══
             Use Supabase's native .upsert() with the primary key.
             Since items with _supabase_id are already synced (filtered above),
             this acts as INSERT for new records. Using upsert instead of insert
             ensures that if a previous sync stored the record but localStorage
             lost the _supabase_id (e.g., cache eviction), the upsert will update
             the existing row by id rather than creating a duplicate — but only
             if the id field is present in the row. */

          var { data, error } = await supabaseClient
            .from(tableName)
            .upsert(row, { onConflict: 'id' })
            .select();

          if (error) {
            /* ═══ RECORD-LEVEL FAILURE ═══
               This record failed to upsert. Could be:
               - RLS policy violation (code 42501)
               - Schema mismatch (column does not exist)
               - Constraint violation (duplicate unique value)
               - Network timeout on this specific request
               Log full details and continue to next record. */
            console.error('[BBA DB] 🚨 Failed to sync record', originalIndex, 'on', tableName);
            console.error('[BBA DB] 🚨 Error:', error.message, '| code:', error.code || 'N/A');
            console.error('[BBA DB] 🚨 Details:', error.details || 'N/A');
            console.error('[BBA DB] 🚨 Hint:', error.hint || 'N/A');
            failedRecords.push({
              index: originalIndex,
              error: error
            });
            continue;
          }

          /* Record upserted successfully — store the Supabase ID */
          if (data && data.length > 0) {
            item._supabase_id = data[0].id;
            hasChanges = true;
            console.log('[SYNC DEBUG] ✅ Record', originalIndex, 'synced with id:', data[0].id);
          }
        } catch (err) {
          /* ═══ JAVASCRIPT EXCEPTION ═══
             The upsert threw rather than returning an error object.
             This typically means a network failure ('Failed to fetch')
             or a runtime error (TypeError). */
          console.error('[BBA DB] 🚨 Exception syncing record', originalIndex, 'on', tableName);
          console.error('[BBA DB] 🚨 Name:', err.name, '| Message:', err.message);
          failedRecords.push({
            index: originalIndex,
            error: err
          });
        }
      }

      /* ─── Step 3: Save updated _supabase_id values back to localStorage ───
         We use window.__bba_original_setItem to bypass the monkey-patch,
         preventing an infinite loop (setItem → pushTable → setItem → ...).
         If the monkey-patch failed on this browser, fall back to direct setItem. */
      if (hasChanges) {
        if (window.__bba_original_setItem) {
          window.__bba_original_setItem(localKey, JSON.stringify(items));
        } else {
          localStorage.setItem(localKey, JSON.stringify(items));
        }
        console.log('[SYNC DEBUG] ✅ Updated _supabase_id values in localStorage for', localKey);
      }

      /* ─── Step 4: Report results ───
         Summary shows how many succeeded and how many failed.
         Each failed record is logged individually for diagnosis. */
      var syncedCount = rowsToSync.length - failedRecords.length;
      if (failedRecords.length === 0) {
        console.log('[BBA DB] ✅ pushTable: Synced', syncedCount, 'record(s) to', tableName, '— all succeeded');
      } else {
        console.error('[BBA DB] ⚠️ pushTable completed with', failedRecords.length, 'failed record(s) out of', rowsToSync.length, 'new records on', tableName);
        for (var f = 0; f < failedRecords.length; f++) {
          var fr = failedRecords[f];
          console.error('[BBA DB]   ❌ Record', fr.index, ':', fr.error.message, '(code:', fr.error.code || 'N/A', ')');
        }
      }
    } catch (err) {
      console.error('[BBA DB] 🚨 FALLBACK — pushTable caught top-level exception');
      console.error('[BBA DB] 🚨 Exception name:', err.name || 'Error');
      console.error('[BBA DB] 🚨 Exception message:', err.message || '(no message)');
      console.error('[BBA DB] 🚨 Exception code:', err.code || 'N/A');
      console.error('[BBA DB] 🚨 Exception details:', err.details || 'N/A');
      console.error('[BBA DB] 🚨 Exception hint:', err.hint || 'N/A');
      console.error('[BBA DB] 🚨 Stack:', err.stack ? err.stack.substring(0, 300) : 'N/A');
    }

    console.log('[SYNC DEBUG] ===== pushTable END =====');
  }

  /* Push CMS content to Supabase */
  async function pushCmsContent() {
    if (!isConnected || !supabaseClient) return;

    var cmsKeys = [
      'hero', 'notice_bar', 'achievements_page',
      'articles', 'testimonials', 'faq', 'partners',
      'gallery', 'videos', 'library', 'surveys', 'rehabilitation',
      'navigation', 'footer', 'social',
      'stats', 'cta', 'about', 'team_members',
      'activities_cms', 'seo', 'global', 'contact',
      'announcements', 'calendar'
    ];

    for (var i = 0; i < cmsKeys.length; i++) {
      var key = cmsKeys[i];
      var lsKey = 'bba_cms_' + key;
      var raw = localStorage.getItem(lsKey);
      if (!raw) continue;

      try {
        var data = JSON.parse(raw);

        var { data: existing, error: selErr } = await supabaseClient
          .from('cms_content')
          .select('id')
          .eq('content_key', key);

        if (selErr) throw selErr;

        if (existing && existing.length > 0) {
          /* Update existing */
          await supabaseClient
            .from('cms_content')
            .update({ content_data: data, updated_at: new Date().toISOString() })
            .eq('content_key', key);
        } else {
          /* Insert new */
          await supabaseClient
            .from('cms_content')
            .insert({ content_key: key, content_data: data });
        }
      } catch (err) {
        console.warn('[BBA DB] Failed to push CMS ' + key + ':', err.message);
      }
    }
  }

  /* ============================================================
   * POINTS SYNC: Sync per-volunteer point entries to points table
   * ============================================================ */
  async function pushPoints() {
    if (!isConnected || !supabaseClient) return;

    try {
      /* ─── Collect only NEW point entries since last sync ───
         Track last sync timestamp to avoid re-inserting the same
         point entries on every call, which would create unbounded
         duplicates in the points table. */
      var lastSyncStr = localStorage.getItem('bba_points_last_sync');
      var lastSyncTime = lastSyncStr ? new Date(lastSyncStr).getTime() : 0;
      var allRows = [];

      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('bba_points_') === 0) {
          var volunteerId = key.replace('bba_points_', '');
          var raw = localStorage.getItem(key);
          if (!raw) continue;
          var entries;
          try { entries = JSON.parse(raw); } catch(e) { continue; }
          if (!Array.isArray(entries)) continue;

          for (var j = 0; j < entries.length; j++) {
            var entryDate = entries[j].date ? new Date(entries[j].date).getTime() : Date.now();
            /* Only push entries created after the last sync */
            if (entryDate > lastSyncTime) {
              allRows.push({
                volunteer_id: volunteerId,
                amount: entries[j].amount || 0,
                reason: entries[j].reason || '',
                type: entries[j].type || 'add',
                date: entries[j].date || new Date().toISOString()
              });
            }
          }
        }
      }

      if (allRows.length === 0) {
        console.log('[BBA DB] pushPoints: No new point entries since last sync — nothing to do');
        return;
      }

      /* ─── Insert only new rows (no DELETE) ─── */
      var errors = 0;
      for (var b = 0; b < allRows.length; b += 50) {
        var batch = allRows.slice(b, b + 50);
        var { error } = await supabaseClient.from('points').insert(batch);
        if (error) {
          console.error('[BBA DB] 🚨 pushPoints: batch insert failed:', error.message, '| code:', error.code || 'N/A');
          errors++;
        }
      }

      /* Update last sync timestamp */
      localStorage.setItem('bba_points_last_sync', new Date().toISOString());

      if (errors === 0) {
        console.log('[BBA DB] ✅ pushPoints: Synced', allRows.length, 'new point entr' + 'ies');
      } else {
        console.error('[BBA DB] ⚠️ pushPoints completed with', errors, 'failed batch(es) out of', Math.ceil(allRows.length / 50));
      }
    } catch (err) {
      console.warn('[BBA DB] Failed to push points:', err.message);
    }
  }

  /* Pull points from Supabase back to localStorage */
  async function pullPoints() {
    if (!isConnected || !supabaseClient) return;

    try {
      var { data, error } = await supabaseClient
        .from('points')
        .select('*');

      if (error || !data) return;

      /* Group by volunteer_id */
      var grouped = {};
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!grouped[row.volunteer_id]) {
          grouped[row.volunteer_id] = [];
        }
        grouped[row.volunteer_id].push({
          amount: row.amount,
          reason: row.reason,
          date: row.date || row.created_at,
          type: row.type
        });
      }

      /* Write back to localStorage */
      for (var vid in grouped) {
        if (grouped.hasOwnProperty(vid)) {
          localStorage.setItem('bba_points_' + vid, JSON.stringify(grouped[vid]));
        }
      }

      console.log('[BBA DB] Synced points from server for ' + Object.keys(grouped).length + ' volunteers');
    } catch (err) {
      console.warn('[BBA DB] Failed to pull points:', err.message);
    }
  }

  /* ============================================================
   * SYNC QUEUE: Batch sync requests with debouncing
   * ============================================================ */
  function queueSync(localKey) {
    console.log('[SYNC DEBUG] queueSync called for:', localKey, '| queue length:', syncQueue.length);
    console.log('[SYNC DEBUG] isConnected:', isConnected, '| isSyncing:', isSyncing, '| IS_INITIAL_PULLING:', IS_INITIAL_PULLING);
    if (syncQueue.indexOf(localKey) === -1) {
      syncQueue.push(localKey);
      console.log('[SYNC DEBUG] Added to queue:', localKey, '| queue now:', syncQueue.join(','));
    } else {
      console.log('[SYNC DEBUG] Already in queue, skipping duplicate:', localKey);
    }
    scheduleSync();
  }

  var syncTimer = null;
  function scheduleSync() {
    console.log('[SYNC DEBUG] scheduleSync called | pending timer:', !!syncTimer);
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function() {
      console.log('[SYNC DEBUG] ⏰ Timer fired — calling processSyncQueue');
      processSyncQueue();
    }, 1000);
  }

  async function processSyncQueue() {
    console.log('[SYNC DEBUG] ===== processSyncQueue START =====');
    console.log('[SYNC DEBUG] isSyncing:', isSyncing, '| isConnected:', isConnected, '| queue has:', syncQueue.length, 'items');

    if (isSyncing) {
      console.error('[BBA DB] 🚨 FALLBACK — processSyncQueue: Already syncing, skipping this cycle');
      console.error('[BBA DB] 🚨 Queue preserved for retry:', syncQueue.length, 'items');
      return;
    }
    if (!isConnected) {
      console.error('[BBA DB] 🚨 FALLBACK — processSyncQueue: Not connected to Supabase, deferring sync');
      console.error('[BBA DB] 🚨 isConnected:', isConnected, '| hasClient:', !!supabaseClient);
      console.error('[BBA DB] 🚨 Queue preserved:', syncQueue.length, 'items waiting');
      console.error('[BBA DB] 🚨 Impact: Queued data will only sync when connection returns (online event listener)');
      return;
    }

    isSyncing = true;

    var keys = syncQueue.slice();
    syncQueue = [];
    console.log('[SYNC DEBUG] Processing', keys.length, 'keys:', keys.join(','));

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var now = Date.now();

      /* Respect cooldown per key */
      if (lastSyncTime[key] && (now - lastSyncTime[key] < SYNC_COOLDOWN)) {
        console.log('[SYNC DEBUG] ⏸️ Cooldown active for:', key, '- skipping, re-queueing');
        queueSync(key);
        continue;
      }
      lastSyncTime[key] = now;

      console.log('[SYNC DEBUG] ▶️ Processing key:', key);
      if (key.indexOf('bba_cms_') === 0 || CONFIG.cmsKeys.indexOf(key) !== -1) {
        console.log('[SYNC DEBUG] Routing to pushCmsContent');
        await pushCmsContent();
      } else if (CONFIG.tableMap[key]) {
        console.log('[SYNC DEBUG] Routing to pushTable for:', key, '→ table:', CONFIG.tableMap[key]);
        await pushTable(key);
      } else {
        console.log('[SYNC DEBUG] ⚠️ Unknown key (no table mapping):', key);
      }
    }

    isSyncing = false;
    console.log('[SYNC DEBUG] ===== processSyncQueue END =====');

    /* If more items were queued during sync, process them */
    if (syncQueue.length > 0) {
      console.log('[SYNC DEBUG] More items queued during sync — scheduling next cycle. Queue:', syncQueue.join(','));
      scheduleSync();
    }
  }

  /* ============================================================
   * PUBLIC API
   * ============================================================ */
  var DB = {
    /* Initialize the database module */
    init: init,

    /* Check if Supabase is connected */
    isOnline: function() { return isConnected; },

    /* Get all items for a given local storage key (e.g. 'bba_volunteers') */
    getAll: function(localKey) {
      try {
        return JSON.parse(localStorage.getItem(localKey) || '[]');
      } catch(e) {
        return [];
      }
    },

    /* Save all items for a given local storage key and sync to Supabase */
    saveAll: function(localKey, data) {
      localStorage.setItem(localKey, JSON.stringify(data));
      queueSync(localKey);
    },

    /* Add an item to a collection, save to localStorage, and sync */
    add: function(localKey, item) {
      var data = this.getAll(localKey);
      data.push(item);
      this.saveAll(localKey, data);
      return item;
    },

    /* Update an item in a collection by index */
    updateByIndex: function(localKey, index, updates) {
      var data = this.getAll(localKey);
      if (index < 0 || index >= data.length) return null;
      for (var key in updates) {
        if (updates.hasOwnProperty(key)) {
          data[index][key] = updates[key];
        }
      }
      this.saveAll(localKey, data);
      return data[index];
    },

    /* Remove an item from a collection by index */
    removeByIndex: function(localKey, index) {
      var data = this.getAll(localKey);
      if (index < 0 || index >= data.length) return false;
      data.splice(index, 1);
      this.saveAll(localKey, data);
      return true;
    },

    /* Remove an item by matching a property value */
    removeByProperty: function(localKey, propertyName, value) {
      var data = this.getAll(localKey);
      var newData = [];
      var found = false;
      for (var i = 0; i < data.length; i++) {
        if (data[i][propertyName] === value) {
          found = true;
        } else {
          newData.push(data[i]);
        }
      }
      if (found) {
        this.saveAll(localKey, newData);
      }
      return found;
    },

    /* Find items by a property value */
    findByProperty: function(localKey, propertyName, value) {
      var data = this.getAll(localKey);
      var results = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i][propertyName] === value) {
          results.push(data[i]);
        }
      }
      return results;
    },

    /* Get a single CMS item (hero, notice_bar, etc.) */
    getCms: function(key, defaultVal) {
      try {
        return JSON.parse(localStorage.getItem('bba_cms_' + key) || JSON.stringify(defaultVal));
      } catch(e) {
        return defaultVal;
      }
    },

    /* Save a single CMS item and sync */
    saveCms: function(key, data) {
      localStorage.setItem('bba_cms_' + key, JSON.stringify(data));
      queueSync('cms_' + key);
    },

    /* Force sync a specific table to Supabase */
    syncNow: function(localKey) {
      queueSync(localKey);
    },

    /* Force sync all data to Supabase */
    syncAll: function() {
      var tables = Object.keys(CONFIG.tableMap);
      for (var i = 0; i < tables.length; i++) {
        queueSync(tables[i]);
      }
      queueSync('cms');
      pushPoints();
    },

    /* Pull data from Supabase for a specific key */
    pullFromServer: function(localKey) {
      return pullTable(localKey);
    },

    /* Pull all points from Supabase */
    pullPoints: function() {
      return pullPoints();
    },

    /* Get a single value from localStorage (non-array items) */
    getItem: function(key, defaultVal) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return defaultVal;
        return JSON.parse(raw);
      } catch(e) {
        return localStorage.getItem(key) || defaultVal;
      }
    },

    /* Set a single value in localStorage and sync CMS if applicable */
    setItem: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      if (key.indexOf('bba_cms_') === 0) {
        queueSync(key);
      }
    },

    /* Get points for a volunteer */
    getPoints: function(volunteerId) {
      try {
        return JSON.parse(localStorage.getItem('bba_points_' + volunteerId) || '[]');
      } catch(e) {
        return [];
      }
    },

    /* Add points entry for a volunteer */
    addPoints: function(volunteerId, entry) {
      var points = this.getPoints(volunteerId);
      points.push(entry);
      localStorage.setItem('bba_points_' + volunteerId, JSON.stringify(points));
      return points;
    },

    /* ============================================================
     * ONLINE-FIRST INSERT: Insert a volunteer directly to Supabase.
     * Falls back to localStorage if offline. Returns { success, source, data }.
     * ============================================================ */
    insertVolunteer: async function(formData) {
      var tableName = 'volunteers';
      var localKey = 'bba_volunteers';
      console.log('[BBA DB] insertVolunteer: starting, isConnected=' + isConnected + ', hasClient=' + !!supabaseClient);

      /* ═══ CRITICAL: Always attempt Supabase insert ═══
         Previously, this had `if (isConnected && supabaseClient)` which short-circuited to
         localStorage when isConnected was false. On mobile, isConnected can be false due to:
           - Supabase CDN not loading (mobile network issue)
           - createClient() throwing (rare mobile JS quirk)
         By always attempting the insert, we capture the REAL exception message.
         Only skip if supabaseClient is truly null (library not loaded). */
      if (!supabaseClient) {
        console.error('[BBA DB] 🚨 insertVolunteer: supabaseClient is null, cannot attempt Supabase');
        var isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
        if (isOnline) {
          return { success: false, source: 'supabase_error', error: 'Supabase library not loaded', supabaseError: 'Supabase JS library was not loaded on this device' };
        }
        var fb = this._saveToOfflineQueue(localKey, formData, {
          name: 'NullClientError',
          message: 'supabaseClient is null — Supabase JS library was not loaded on this device'
        });
        return fb;
      }

      try {
        var row = transformRowToDB(tableName, formData);
        console.log('[BBA DB] insertVolunteer: transformed row keys:', Object.keys(row).join(','));

        console.log('[BBA DB] insertVolunteer: sending INSERT to Supabase table:', tableName);
        var { data, error } = await supabaseClient
          .from(tableName)
          .insert(row)
          .select();

        if (error) {
          /* Supabase returned an error object — this is a proper API error (RLS, schema, etc.) */
          console.error('[BBA DB] 🚨 FALLBACK — insertVolunteer: Supabase INSERT returned error object');
          console.error('[BBA DB] 🚨 Exception name:', error.name || 'SupabaseError');
          console.error('[BBA DB] 🚨 Exception message:', error.message);
          console.error('[BBA DB] 🚨 Exception code:', error.code || 'N/A');
          console.error('[BBA DB] 🚨 Exception details:', error.details || 'N/A');
          console.error('[BBA DB] 🚨 Exception hint:', error.hint || 'N/A');
          if (error.stack) console.error('[BBA DB] 🚨 Stack:', error.stack.split('\n').slice(0, 4).join('\n'));
          throw error;
        }

        console.log('[BBA DB] insertVolunteer: ✅ Supabase insert succeeded');

        /* Sync localStorage as cache — use original setItem to avoid double-sync */
        if (data && data.length > 0) {
          var cached = transformRowFromDB(tableName, data[0]);
          var all = [];
          try { all = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
          all.push(cached);
          if (window.__bba_original_setItem) {
            window.__bba_original_setItem(localKey, JSON.stringify(all));
          } else {
            localStorage.setItem(localKey, JSON.stringify(all));
          }
          console.log('[BBA DB] insertVolunteer: localStorage cache updated (source: supabase)');
          return { success: true, source: 'supabase', insertedId: data[0].id };
        }

        return { success: true, source: 'supabase' };
      } catch (err) {          /* ═══ ONLINE-ONLY ERROR — DO NOT SAVE LOCALLY ═══
             ═════════════════════════════════════════════════
             CRITICAL ARCHITECTURE CHANGE:
             
             Previously, this catch block ALWAYS saved to localStorage via
             _saveToLocalAndQueueSync regardless of whether the device was online.
             This caused the localStorage-first anti-pattern where:
               - Supabase errors were hidden from users (replaced with "saved locally")
               - Data was saved to localStorage even when Supabase was reachable
               - Users never saw real Supabase error messages
               - The admin dashboard never saw the data because initialPull()
                 overwrites localStorage with stale Supabase data
             
             NEW BEHAVIOR:
               - If navigator.onLine === true:  Return the real Supabase error.
                                                Do NOT save to localStorage.
                                                The user sees the actual error.
               - If navigator.onLine === false: Save to localStorage via offline
                                                queue. Will be retried when
                                                connection returns.
             ============================================================ */
        var errMsg = err.message || '(no message)';
        var errName = err.name || 'Error';
        var errDetails = err.details || 'N/A';
        var errCode = err.code || 'N/A';
        var errHint = err.hint || 'N/A';
        var isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        console.error('[BBA DB] 🚨 insertVolunteer caught exception');
        console.error('[BBA DB] 🚨 Exception name:', errName);
        console.error('[BBA DB] 🚨 Exception message:', errMsg);
        console.error('[BBA DB] 🚨 Exception code:', errCode);
        console.error('[BBA DB] 🚨 Exception details:', errDetails);
        console.error('[BBA DB] 🚨 Exception hint:', errHint);
        console.error('[BBA DB] 🚨 navigator.onLine:', !!isOnline);
        if (err.stack) console.error('[BBA DB] 🚨 Stack:', err.stack.split('\n').slice(0, 4).join('\n'));

        if (isOnline) {
          /* ═══ ONLINE + SUPABASE ERROR ═══
             The device IS online but Supabase rejected the insert.
             Return the real error to the caller. Do NOT save to localStorage.
             The caller (app.js) will show the error message to the user. */
          console.error('[BBA DB] ❌ insertVolunteer: Online but Supabase failed — returning error to user');
          console.error('[BBA DB] ❌ NOT saving to localStorage — user will see the real error');
          return {
            success: false,
            source: 'supabase_error',
            error: errMsg,
            supabaseError: errMsg,
            supabaseErrorFull: {
              name: errName,
              message: errMsg,
              code: errCode,
              details: errDetails,
              hint: errHint
            }
          };
        } else {
          /* ═══ OFFLINE FALLBACK ═══
             The device is offline. Save to localStorage and queue
             for retry when connection returns. */
          console.error('[BBA DB] 📴 insertVolunteer: Offline — saving to localStorage, will retry when online');
          var fallbackResult = this._saveToOfflineQueue(localKey, formData, err);
          return fallbackResult;
        }
      }
    },

    /* ============================================================
     * ONLINE-FIRST INSERT: Insert a consultation directly to Supabase.
     * Returns { success, source, data }.
     * ============================================================ */
    insertConsultation: async function(formData) {
      var tableName = 'consultations';
      var localKey = 'bba_consultations';
      console.log('[BBA DB] insertConsultation: starting, isConnected=' + isConnected + ', hasClient=' + !!supabaseClient);

      if (!supabaseClient) {
        console.error('[BBA DB] 🚨 insertConsultation: supabaseClient is null');
        var isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        if (isOnline) {
          return { success: false, source: 'supabase_error', error: 'Supabase library not loaded', supabaseError: 'Supabase JS library was not loaded on this device' };
        }
        var fb = this._saveToOfflineQueue(localKey, formData, {
          name: 'NullClientError',
          message: 'supabaseClient is null — Supabase JS library was not loaded on this device',
          details: 'isConnected=' + isConnected + ', typeof window.supabase=' + (typeof window.supabase)
        });
        return fb;
      }

      try {
        var row = transformRowToDB(tableName, formData);
        console.log('[BBA DB] insertConsultation: sending INSERT to Supabase table:', tableName);
        var { data, error } = await supabaseClient
          .from(tableName)
          .insert(row)
          .select();

        if (error) {
          console.error('[BBA DB] 🚨 insertConsultation: Supabase INSERT returned error');
          console.error('[BBA DB] 🚨 Error:', error.message, '| code:', error.code || 'N/A');
          throw error;
        }

        console.log('[BBA DB] insertConsultation: ✅ Supabase insert succeeded');

        if (data && data.length > 0) {
          var cached = transformRowFromDB(tableName, data[0]);
          var all = [];
          try { all = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
          all.push(cached);
          if (window.__bba_original_setItem) {
            window.__bba_original_setItem(localKey, JSON.stringify(all));
          } else {
            localStorage.setItem(localKey, JSON.stringify(all));
          }
          console.log('[BBA DB] insertConsultation: localStorage cache updated (source: supabase)');
          return { success: true, source: 'supabase', insertedId: data[0].id };
        }

        return { success: true, source: 'supabase' };
      } catch (err) {
        var errMsg = err.message || '(no message)';
        var errName = err.name || 'Error';
        var errDetails = err.details || 'N/A';
        var errCode = err.code || 'N/A';
        var errHint = err.hint || 'N/A';
        var isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        console.error('[BBA DB] 🚨 insertConsultation caught exception');
        console.error('[BBA DB] 🚨 Exception name:', errName);
        console.error('[BBA DB] 🚨 Exception message:', errMsg);
        console.error('[BBA DB] 🚨 Exception code:', errCode);
        console.error('[BBA DB] 🚨 navigator.onLine:', !!isOnline);

        if (isOnline) {
          console.error('[BBA DB] ❌ insertConsultation: Online but Supabase failed — returning error to user');
          return {
            success: false,
            source: 'supabase_error',
            error: errMsg,
            supabaseError: errMsg,
            supabaseErrorFull: {
              name: errName,
              message: errMsg,
              code: errCode,
              details: errDetails,
              hint: errHint
            }
          };
        } else {
          console.error('[BBA DB] 📴 insertConsultation: Offline — saving to localStorage, will retry when online');
          var fallbackResult = this._saveToOfflineQueue(localKey, formData, err);
          return fallbackResult;
        }
      }
    },

    /* ============================================================
     * OFFLINE QUEUE: Save to localStorage when device is offline.
     * Records are retried when connection returns.
     * ============================================================ */
    _saveToOfflineQueue: function(localKey, formData, supabaseError) {
      console.log('[BBA DB] _saveToOfflineQueue: saving ' + localKey + ' to localStorage (offline fallback)');

      if (supabaseError) {
        console.log('[BBA DB] _saveToOfflineQueue: 🔌 Offline fallback — Supabase was unreachable');
        console.log('[BBA DB]   Error:', supabaseError.message || '(no message)');
      }

      /* ─── Do NOT save to main localStorage array ───
         The main array (bba_volunteers/bba_consultations) is only updated
         AFTER a successful Supabase insert. Saving here would create
         duplicates when processOfflineQueue retries and insertVolunteer/
         insertConsultation saves the confirmed record.
         
         The offline queue is the single source of truth for pending
         submissions. When processOfflineQueue retries successfully,
         insertVolunteer/insertConsultation's success path handles saving
         to the main array with the correct _supabase_id. */

      /* ─── Add to offline retry queue ───
         processOfflineQueue() reads this queue when the device comes
         back online and retries each submission. */
      var queue = [];
      try { queue = JSON.parse(localStorage.getItem('bba_offline_queue') || '[]'); } catch(e) {}
      var entryType = localKey === 'bba_volunteers' ? 'volunteer' : (localKey === 'bba_consultations' ? 'consultation' : 'other');
      queue.push({
        type: entryType,
        localKey: localKey,
        data: formData,
        timestamp: new Date().toISOString(),
        error: supabaseError ? supabaseError.message : null
      });
      localStorage.setItem('bba_offline_queue', JSON.stringify(queue));
      console.log('[BBA DB] _saveToOfflineQueue: 📋 Added to offline queue (queue length:', queue.length, ')');

      return {
        success: true,
        source: 'localStorage',
        offline: true,
        queued: true,
        supabaseError: supabaseError ? supabaseError.message : null
      };
    },

    /* ============================================================
     * PROCESS OFFLINE QUEUE: Retry queued submissions when online.
     * Called automatically on 'online' event.
     * ============================================================ */
    processOfflineQueue: async function() {
      console.log('[BBA DB] 🔄 processOfflineQueue: Starting offline queue processing');
      var queue = [];
      try { queue = JSON.parse(localStorage.getItem('bba_offline_queue') || '[]'); } catch(e) {}

      if (queue.length === 0) {
        console.log('[BBA DB] processOfflineQueue: Queue is empty — nothing to retry');
        return;
      }

      if (!isConnected || !supabaseClient) {
        console.log('[BBA DB] processOfflineQueue: Still offline, will retry later. Queue:', queue.length, 'items');
        return;
      }

      console.log('[BBA DB] processOfflineQueue: Processing', queue.length, 'queued submission(s)');

      var remaining = [];
      var processed = 0;
      var failed = 0;

      for (var qi = 0; qi < queue.length; qi++) {
        var entry = queue[qi];
        console.log('[BBA DB] processOfflineQueue: Retrying', entry.type, 'submission from', entry.timestamp);

        try {
          var result;
          if (entry.type === 'volunteer') {
            result = await this.insertVolunteer(entry.data);
          } else if (entry.type === 'consultation') {
            result = await this.insertConsultation(entry.data);
          } else {
            result = { success: false, source: 'unknown_type' };
          }

          if (result && result.success && result.source === 'supabase') {
            processed++;
            console.log('[BBA DB] processOfflineQueue: ✅', entry.type, 'retried successfully');
          } else {
            failed++;
            remaining.push(entry);
            console.error('[BBA DB] processOfflineQueue: ❌', entry.type, 'retry failed:', result ? result.error || result.supabaseError : 'unknown error');
          }
        } catch (e) {
          failed++;
          remaining.push(entry);
          console.error('[BBA DB] processOfflineQueue: ❌', entry.type, 'retry threw:', e.message);
        }
      }

      /* Save remaining items back to queue */
      localStorage.setItem('bba_offline_queue', JSON.stringify(remaining));

      console.log('[BBA DB] processOfflineQueue: ✅ Done —', processed, 'synced,', failed, 'failed,', remaining.length, 'remaining in queue');
    },

    /* Check if data exists in both localStorage and Supabase */
    verifySync: async function() {
      if (!isConnected) return { connected: false, message: 'Supabase غير متصل' };

      var results = {};
      var tables = Object.keys(CONFIG.tableMap);

      for (var i = 0; i < tables.length; i++) {
        var localKey = tables[i];
        var localData = this.getAll(localKey);
        var tableName = CONFIG.tableMap[localKey];

        try {
          var { count, error } = await supabaseClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          results[localKey] = {
            local: localData.length,
            remote: error ? -1 : (count || 0),
            synced: !error
          };
        } catch (err) {
          results[localKey] = { local: localData.length, remote: -1, synced: false };
        }
      }

      return { connected: true, tables: results };
    }
  };

  /* ============================================================
   * AUTHENTICATION MODULE with Role-Based Access Control
   * Uses Supabase Auth for login, user_roles table for RBAC.
   * ============================================================ */
  var Auth = {
    /* Current session cache */
    _currentUser: null,
    _currentRole: null,
    _currentRoleData: null,

    /* Login with Supabase Auth */
    login: async function(email, password) {
      if (!isConnected || !supabaseClient) {
        /* Audit failure even when offline */
        logAuditEvent('login_failure', email, '', 'supabase offline');
        return { error: 'Supabase غير متصل' };
      }

      try {
        var { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          /* Audit login failure */
          logAuditEvent('login_failure', email, '', error.message);
          throw error;
        }

        /* Store session */
        this._currentUser = data.user;
        sessionStorage.setItem('bba_auth_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email
        }));

        /* Fetch role from user_roles table */
        await this._loadRole();

        /* Audit login success */
        logAuditEvent('login_success', email, this._currentRole, '');

        return { success: true, user: data.user, role: this._currentRole };
      } catch (err) {
        /* Already audited above if Supabase error; audit remaining cases */
        if (err.message && err.message.indexOf('Invalid login credentials') !== -1) {
          logAuditEvent('login_failure', email, '', 'wrong credentials');
        }
        return { error: err.message };
      }
    },

    /* Logout */
    logout: async function() {
      var email = '';
      var user = this.getUser();
      if (user) email = user.email || '';

      if (isConnected && supabaseClient) {
        try { await supabaseClient.auth.signOut(); } catch(e) {}
      }

      /* Audit logout before clearing session */
      logAuditEvent('logout', email, this._currentRole || '', '');

      this._currentUser = null;
      this._currentRole = null;
      this._currentRoleData = null;
      sessionStorage.removeItem('bba_auth_user');
      sessionStorage.removeItem('bba_admin_auth');
      sessionStorage.removeItem('bba_psych_auth');
      sessionStorage.removeItem('bba_portal_session');
      sessionStorage.removeItem('bba_auth_role');
      sessionStorage.removeItem('bba_auth_role_data');
    },

    /* Get current user from cache */
    getUser: function() {
      if (this._currentUser) return this._currentUser;
      try {
        var s = JSON.parse(sessionStorage.getItem('bba_auth_user') || 'null');
        return s || null;
      } catch(e) { return null; }
    },

    /* Check if logged in */
    isLoggedIn: function() {
      return this.getUser() !== null;
    },

    /* Get current user's role */
    getRole: function() {
      return this._currentRole || sessionStorage.getItem('bba_auth_role') || null;
    },

    /* Get full role data (includes volunteer_id, display_name) */
    getRoleData: function() {
      if (this._currentRoleData) return this._currentRoleData;
      try {
        return JSON.parse(sessionStorage.getItem('bba_auth_role_data') || 'null');
      } catch(e) { return null; }
    },

    /* Check if user has any of the specified roles */
    hasRole: function(roles) {
      var userRole = this.getRole();
      if (!userRole || !roles) return false;
      if (typeof roles === 'string') return userRole === roles;
      if (Array.isArray(roles)) return roles.indexOf(userRole) !== -1;
      return userRole === roles;
    },

    /* Load role from Supabase user_roles table */
    _loadRole: async function() {
      var user = this._currentUser || this.getUser();
      if (!user || !isConnected || !supabaseClient) return;

      try {
        var { data, error } = await supabaseClient
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          this._currentRole = data.role;
          this._currentRoleData = data;
          sessionStorage.setItem('bba_auth_role', data.role);
          sessionStorage.setItem('bba_auth_role_data', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('[BBA Auth] Failed to load role:', err.message);
      }
    },

    /* Check if Supabase is connected */
    isOnline: function() { return isConnected; },

    /* Initialize: restore session from Supabase on page load */
    initSession: async function() {
      if (!isConnected || !supabaseClient) return null;

      try {
        /* Try to restore session from Supabase (auto-refresh token) */
        var { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (session && session.user) {
          this._currentUser = session.user;
          sessionStorage.setItem('bba_auth_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email
          }));
          await this._loadRole();
          return session.user;
        }

        /* Check legacy session storage */
        var legacyUser = this.getUser();
        if (legacyUser) {
          await this._loadRole();
        }

        return legacyUser || null;
      } catch (err) {
        console.warn('[BBA Auth] Session restore failed:', err.message);
        return null;
      }
    }
  };

  /* ============================================================
   * AUDIT LOG HELPER
   * Safe wrapper around BBA.Audit.log that handles module not loaded yet
   * ============================================================ */
  function logAuditEvent(eventType, email, role, extra) {
    try {
      if (window.BBA && window.BBA.Audit && typeof window.BBA.Audit.log === 'function') {
        window.BBA.Audit.log(eventType, 'auth', email, email, { role: role, extra: extra });
      }
    } catch(e) {
      /* Silently fail - audit should never block normal operation */
    }
  }

  /* ============================================================
   * EXPOSE API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.DB = DB;
  window.BBA.Auth = Auth;

  /* Expose Supabase client for other modules (e.g. audit) */
  if (supabaseClient) {
    window.__bba_supabase_client = supabaseClient;
  }

  /* ============================================================
   * AUTO-SYNC ON RECONNECT
   * When the browser detects that the network is back, flush
   * all queued localStorage writes to Supabase.
   * This handles the case where forms were submitted offline.
   * ============================================================ */
  window.addEventListener('online', function() {
    console.log('[BBA DB] 🌐 Network connection restored — processing offline queue and syncing');
    if (isConnected && supabaseClient) {
      /* ─── Step 1: Process offline registration queue ───
         Retry any volunteer registrations or consultation
         submissions that were saved while offline. */
      if (DB && typeof DB.processOfflineQueue === 'function') {
        DB.processOfflineQueue();
      }

      /* ─── Step 2: Sync CMS content ─── */
      for (var i = 0; i < localStorage.length; i++) {
        var lsKey = localStorage.key(i);
        if (lsKey && lsKey.indexOf('bba_cms_') === 0) {
          queueSync(lsKey);
        }
      }

      /* ─── Step 3: Push pending points ─── */
      pushPoints();

      /* ─── Step 4: Queue sync for non-registration data keys ───
         Skip bba_volunteers and bba_consultations — those are
         handled by processOfflineQueue and direct Supabase writes.
         Sync other administrative data (tasks, events, etc.) */
      var ADMIN_SYNC_KEYS = {
        'bba_certificates': true,
        'bba_events': true,
        'bba_tasks': true,
        'bba_teams': true,
        'bba_achievements': true,
        'bba_activity_log': true,
        'bba_notifications_data': true
      };
      for (var key in ADMIN_SYNC_KEYS) {
        if (ADMIN_SYNC_KEYS.hasOwnProperty(key)) {
          try {
            var raw = localStorage.getItem(key);
            if (raw && raw.length > 2) {
              queueSync(key);
              console.log('[BBA DB] Auto-sync queued:', key);
            }
          } catch(e) {}
        }
      }
    }
  });

  /* Auto-initialize on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init().catch(function(err) {
        console.warn('[BBA DB] Init error:', err);
      });
    });
  } else {
    init().catch(function(err) {
      console.warn('[BBA DB] Init error:', err);
    });
  }

  console.log('✅ [BBA DB] Database module loaded');
})();
