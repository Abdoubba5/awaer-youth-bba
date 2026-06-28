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

    initPromise = new Promise(function(resolve) {
      /* Try to load Supabase client from CDN */
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
          supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
            auth: {
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: true
            }
          });
          isConnected = true;
          console.log('✅ [BBA DB] Supabase client initialized');

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
      } else {
        console.error('[BBA DB] 🚨 FALLBACK — Supabase JS library not loaded');
        console.error('[BBA DB] 🚨 typeof window.supabase:', typeof window.supabase);
        console.error('[BBA DB] 🚨 typeof window.supabase.createClient:', typeof (window.supabase && window.supabase.createClient));
        console.error('[BBA DB] 🚨 Likely cause: Supabase CDN script failed to load on this device (network issue on mobile / cached on desktop)');
        console.error('[BBA DB] 🚨 Impact: supabaseClient is null. All inserts go to localStorage only. insertVolunteer/insertConsultation will skip Supabase.');
        isConnected = false;
        resolve(false);
      }
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
   * PUSH TO SUPABASE: Save localStorage data to Supabase
   * ============================================================ */
  async function pushTable(localKey) {
    console.log('[SYNC DEBUG] ===== pushTable START =====');
    console.log('[SYNC DEBUG] localKey:', localKey, '| isConnected:', isConnected, '| hasClient:', !!supabaseClient);

    if (!isConnected || !supabaseClient) {
      console.error('[BBA DB] 🚨 FALLBACK — pushTable: Not connected to Supabase, re-queueing sync for', localKey);
      console.error('[BBA DB] 🚨 isConnected:', isConnected, '| hasClient:', !!supabaseClient);
      console.error('[BBA DB] 🚨 Impact: Data in localStorage for', localKey, 'will not reach Supabase until connection is restored');
      queueSync(localKey);
      console.log('[SYNC DEBUG] ===== pushTable END (re-queued) =====');
      return;
    }

    var tableName = CONFIG.tableMap[localKey];
    if (!tableName) {
      console.error('[BBA DB] 🚨 FALLBACK — pushTable: No table mapping for', localKey);
      console.error('[BBA DB] 🚨 Cause: CONFIG.tableMap does not contain', localKey);
      console.error('[BBA DB] 🚨 Impact: Data in localStorage for', localKey, 'cannot be pushed to Supabase — unknown table');
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
        console.error('[BBA DB] 🚨 raw.substring(0,100):', raw.substring(0, 100));
        console.error('[BBA DB] 🚨 Impact: Corrupt data in localStorage cannot be parsed, sync aborted');
        console.log('[SYNC DEBUG] ===== pushTable END (parse error) =====');
        return;
      }
      console.log('[SYNC DEBUG] Parsed items:', items.length);

      if (!Array.isArray(items) || items.length === 0) {
        console.log('[SYNC DEBUG] Empty array for', localKey);
        console.log('[SYNC DEBUG] ===== pushTable END (empty) =====');
        return;
      }

      /* Check if we already have data in Supabase */
      console.log('[SYNC DEBUG] Checking existing data in Supabase:', tableName);
      var { data: existingData, error: selectError } = await supabaseClient
        .from(tableName)
        .select('id');

      if (selectError) {
        console.error('[BBA DB] 🚨 FALLBACK — pushTable: SELECT error on', tableName);
        console.error('[BBA DB] 🚨 Exception name:', selectError.name || 'SupabaseError');
        console.error('[BBA DB] 🚨 Exception message:', selectError.message);
        console.error('[BBA DB] 🚨 Exception code:', selectError.code || 'N/A');
        console.error('[BBA DB] 🚨 Exception details:', selectError.details || 'N/A');
        console.error('[BBA DB] 🚨 Exception hint:', selectError.hint || 'N/A');
        console.error('[BBA DB] 🚨 Impact: Cannot read existing data from', tableName, '— sync may duplicate rows');
        throw selectError;
      }
      console.log('[SYNC DEBUG] Existing rows in Supabase:', existingData ? existingData.length : 0);

      if (existingData && existingData.length > 0) {
        /* Data exists — delete all and re-insert */
        console.log('[SYNC DEBUG] Deleting existing rows...');
        var { error: deleteError } = await supabaseClient
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.error('[BBA DB] 🚨 FALLBACK — pushTable: DELETE failed on', tableName, '- falling back to upsert');
          console.error('[BBA DB] 🚨 Exception name:', deleteError.name || 'SupabaseError');
          console.error('[BBA DB] 🚨 Exception message:', deleteError.message);
          console.error('[BBA DB] 🚨 Exception code:', deleteError.code || 'N/A');
          console.error('[BBA DB] 🚨 Exception details:', deleteError.details || 'N/A');
          console.error('[BBA DB] 🚨 Likely cause: RLS policy blocks DELETE for anonymous users on', tableName);
          await upsertItems(tableName, items);
          console.log('[SYNC DEBUG] ===== pushTable END (upsert fallback) =====');
          return;
        }
        console.log('[SYNC DEBUG] Delete successful');
      }

      /* Insert all items */
      var rows = items.map(function(item) {
        var row = transformRowToDB(tableName, item);
        delete row._supabase_id;
        return row;
      });
      console.log('[SYNC DEBUG] Transformed', rows.length, 'rows for insert');
      console.log('[SYNC DEBUG] First row keys:', rows.length > 0 ? Object.keys(rows[0]).join(',') : 'N/A');

      var allInserted = true;
      /* Insert in batches of 50 */
      for (var i = 0; i < rows.length; i += 50) {
        var batch = rows.slice(i, i + 50);
        console.log('[SYNC DEBUG] Inserting batch', (i/50)+1, ':', batch.length, 'rows');
        var { error: insertError } = await supabaseClient
          .from(tableName)
          .insert(batch);

        if (insertError) {
          console.error('[BBA DB] 🚨 FALLBACK — pushTable: INSERT failed for batch', (i/50)+1, 'on', tableName);
          console.error('[BBA DB] 🚨 Exception name:', insertError.name || 'SupabaseError');
          console.error('[BBA DB] 🚨 Exception message:', insertError.message);
          console.error('[BBA DB] 🚨 Exception code:', insertError.code || 'N/A');
          console.error('[BBA DB] 🚨 Exception details:', insertError.details || 'N/A');
          console.error('[BBA DB] 🚨 Exception hint:', insertError.hint || 'N/A');
          console.error('[BBA DB] 🚨 First row in batch:', JSON.stringify(batch[0]).substring(0, 200));
          console.error('[BBA DB] 🚨 Impact: ' + items.length + ' rows partially synced — data may be incomplete on mobile');
          allInserted = false;
        } else {
          console.log('[SYNC DEBUG] ✅ Batch', (i/50)+1, 'inserted successfully');
        }
      }

      if (allInserted) {
        console.log('[SYNC DEBUG] ✅ ALL batches inserted successfully');
        console.log('[BBA DB] Synced ' + localKey + ' to Supabase: ' + items.length + ' items');
      } else {
        console.error('[BBA DB] ⚠️ Some batches failed during pushTable — data may be incomplete in Supabase');
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

  /* Upsert items individually (fallback when delete not allowed) */
  async function upsertItems(tableName, items) {
    var upsertFailures = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var row = transformRowToDB(tableName, item);
      delete row._supabase_id;

      if (item._supabase_id) {
        /* Update existing */
        try {
          var { error: updateError } = await supabaseClient
            .from(tableName)
            .update(row)
            .eq('id', item._supabase_id);
          if (updateError) {
            console.error('[BBA DB] 🚨 FALLBACK — upsertItems UPDATE failed for row', i, 'on', tableName);
            console.error('[BBA DB] 🚨 Exception message:', updateError.message, '| code:', updateError.code || 'N/A');
            upsertFailures++;
          }
        } catch (e) {
          console.error('[BBA DB] 🚨 FALLBACK — upsertItems UPDATE threw for row', i, 'on', tableName);
          console.error('[BBA DB] 🚨 Exception name:', e.name, '| message:', e.message);
          upsertFailures++;
        }
      } else {
        /* Insert new */
        try {
          var { data, error } = await supabaseClient
            .from(tableName)
            .insert(row)
            .select('id');

          if (error) {
            console.error('[BBA DB] 🚨 FALLBACK — upsertItems INSERT failed for row', i, 'on', tableName);
            console.error('[BBA DB] 🚨 Exception message:', error.message);
            console.error('[BBA DB] 🚨 Exception code:', error.code || 'N/A');
            console.error('[BBA DB] 🚨 Exception details:', error.details || 'N/A');
            upsertFailures++;
          } else if (data && data.length > 0) {
            /* Store the Supabase ID back to localStorage */
            item._supabase_id = data[0].id;
          }
        } catch (e) {
          console.error('[BBA DB] 🚨 FALLBACK — upsertItems INSERT threw for row', i, 'on', tableName);
          console.error('[BBA DB] 🚨 Exception name:', e.name, '| message:', e.message);
          upsertFailures++;
        }
      }
    }

    if (upsertFailures > 0) {
      console.error('[BBA DB] 🚨 upsertItems completed with', upsertFailures, 'failure(s) out of', items.length, 'rows on', tableName);
      console.error('[BBA DB] 🚨 Impact: Mobile data may be partially synced —', upsertFailures, 'rows did not reach Supabase');
    } else {
      console.log('[BBA DB] upsertItems: all', items.length, 'rows upserted successfully on', tableName);
    }

    /* Save updated items (with _supabase_id) back to localStorage */
    try {
      localStorage.setItem('bba_' + tableName, JSON.stringify(items));
    } catch (e) {
      console.error('[BBA DB] 🚨 FALLBACK — upsertItems localStorage write failed');
      console.error('[BBA DB] 🚨 Exception:', e.name, '-', e.message);
    }
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
      /* Collect all points from all bba_points_* keys */
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

      if (allRows.length === 0) return;

      /* Delete existing points and re-insert */
      var { error: delErr } = await supabaseClient
        .from('points')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (!delErr) {
        /* Insert in batches */
        for (var b = 0; b < allRows.length; b += 50) {
          var batch = allRows.slice(b, b + 50);
          await supabaseClient.from('points').insert(batch);
        }
      }

      console.log('[BBA DB] Synced points: ' + allRows.length + ' entries');
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
        console.error('[BBA DB] 🚨 FALLBACK — insertVolunteer: supabaseClient is null, cannot attempt Supabase');
        console.error('[BBA DB] 🚨 Exception: supabaseClient is null');
        console.error('[BBA DB] 🚨 Likely cause: Supabase JS library not loaded on this page/device');
        var fb = this._saveToLocalAndQueueSync(localKey, formData, {
          name: 'NullClientError',
          message: 'supabaseClient is null — Supabase JS library was not loaded on this device',
          details: 'isConnected=' + isConnected + ', typeof window.supabase=' + (typeof window.supabase),
          hint: 'Ensure Supabase CDN script is loading correctly on mobile browsers'
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
      } catch (err) {
        /* ═══ EXACT EXCEPTION CAPTURED ═══
           This catch block runs when:
           - Supabase returned an API error (RLS: error.name='SupabaseError', error.message='violates row-level security')
           - Network failure (TypeError: 'Failed to fetch')
           - timeout
           - Any other runtime exception during the insert
           The full error is logged and then passed to the localStorage fallback. */
        var errMsg = err.message || '(no message)';
        var errName = err.name || 'Error';
        var errDetails = err.details || 'N/A';
        var errCode = err.code || 'N/A';
        var errHint = err.hint || 'N/A';

        /* Categorize the exception */
        var category = 'unknown';
        if (errMsg.indexOf('Failed to fetch') !== -1 || errMsg.indexOf('NetworkError') !== -1 || errMsg.indexOf('network') !== -1 || errMsg.indexOf('Network') !== -1) {
          category = 'network';
        } else if (errMsg.indexOf('row-level security') !== -1 || errMsg.indexOf('violates') !== -1 || errCode === '42501') {
          category = 'rls_policy';
        } else if (errMsg.indexOf('does not exist') !== -1) {
          category = 'schema';
        } else if (errMsg.indexOf('timeout') !== -1 || errMsg.indexOf('Timeout') !== -1) {
          category = 'timeout';
        } else if (errName === 'TypeError') {
          category = 'runtime_typeerror';
        } else if (errName === 'SyntaxError' || errMsg.indexOf('JSON') !== -1) {
          category = 'json_parse';
        }

        console.error('[BBA DB] 🚨 FALLBACK — insertVolunteer caught exception');
        console.error('[BBA DB] 🚨 Exception name:', errName);
        console.error('[BBA DB] 🚨 Exception message:', errMsg);
        console.error('[BBA DB] 🚨 Exception code:', errCode);
        console.error('[BBA DB] 🚨 Exception details:', errDetails);
        console.error('[BBA DB] 🚨 Exception hint:', errHint);
        console.error('[BBA DB] 🚨 Exception category:', category);
        if (err.stack) console.error('[BBA DB] 🚨 Stack (first 3 lines):', err.stack.split('\n').slice(0, 4).join('\n'));

        /* Fall back to localStorage — pass the full error object so _saveToLocalAndQueueSync can log it */
        var fallbackResult = this._saveToLocalAndQueueSync(localKey, formData, err);
        return fallbackResult;
      }
    },

    /* ============================================================
     * ONLINE-FIRST INSERT: Insert a consultation directly to Supabase.
     * Falls back to localStorage if offline. Returns { success, source, data }.
     * ============================================================ */
    insertConsultation: async function(formData) {
      var tableName = 'consultations';
      var localKey = 'bba_consultations';
      console.log('[BBA DB] insertConsultation: starting, isConnected=' + isConnected + ', hasClient=' + !!supabaseClient);

      /* ═══ CRITICAL: Always attempt Supabase insert ═══
         Same pattern as insertVolunteer — never short-circuit to localStorage
         without first trying Supabase and capturing the real exception. */
      if (!supabaseClient) {
        console.error('[BBA DB] 🚨 FALLBACK — insertConsultation: supabaseClient is null, cannot attempt Supabase');
        console.error('[BBA DB] 🚨 Exception: supabaseClient is null');
        console.error('[BBA DB] 🚨 Likely cause: Supabase JS library not loaded on this page/device');
        var fb = this._saveToLocalAndQueueSync(localKey, formData, {
          name: 'NullClientError',
          message: 'supabaseClient is null — Supabase JS library was not loaded on this device',
          details: 'isConnected=' + isConnected + ', typeof window.supabase=' + (typeof window.supabase),
          hint: 'Ensure Supabase CDN script is loading correctly on mobile browsers'
        });
        return fb;
      }

      try {
        var row = transformRowToDB(tableName, formData);
        console.log('[BBA DB] insertConsultation: transformed row keys:', Object.keys(row).join(','));

        console.log('[BBA DB] insertConsultation: sending INSERT to Supabase table:', tableName);
        var { data, error } = await supabaseClient
          .from(tableName)
          .insert(row)
          .select();

        if (error) {
          /* Supabase returned an error object */
          console.error('[BBA DB] 🚨 FALLBACK — insertConsultation: Supabase INSERT returned error object');
          console.error('[BBA DB] 🚨 Exception name:', error.name || 'SupabaseError');
          console.error('[BBA DB] 🚨 Exception message:', error.message);
          console.error('[BBA DB] 🚨 Exception code:', error.code || 'N/A');
          console.error('[BBA DB] 🚨 Exception details:', error.details || 'N/A');
          console.error('[BBA DB] 🚨 Exception hint:', error.hint || 'N/A');
          if (error.stack) console.error('[BBA DB] 🚨 Stack:', error.stack.split('\n').slice(0, 4).join('\n'));
          throw error;
        }

        console.log('[BBA DB] insertConsultation: ✅ Supabase insert succeeded');

        /* Sync localStorage as cache */
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
        /* ═══ EXACT EXCEPTION CAPTURED ═══ */
        var errMsg = err.message || '(no message)';
        var errName = err.name || 'Error';
        var errDetails = err.details || 'N/A';
        var errCode = err.code || 'N/A';
        var errHint = err.hint || 'N/A';

        var category = 'unknown';
        if (errMsg.indexOf('Failed to fetch') !== -1 || errMsg.indexOf('NetworkError') !== -1 || errMsg.indexOf('network') !== -1 || errMsg.indexOf('Network') !== -1) {
          category = 'network';
        } else if (errMsg.indexOf('row-level security') !== -1 || errMsg.indexOf('violates') !== -1 || errCode === '42501') {
          category = 'rls_policy';
        } else if (errMsg.indexOf('does not exist') !== -1) {
          category = 'schema';
        } else if (errMsg.indexOf('timeout') !== -1 || errMsg.indexOf('Timeout') !== -1) {
          category = 'timeout';
        } else if (errName === 'TypeError') {
          category = 'runtime_typeerror';
        } else if (errName === 'SyntaxError' || errMsg.indexOf('JSON') !== -1) {
          category = 'json_parse';
        }

        console.error('[BBA DB] 🚨 FALLBACK — insertConsultation caught exception');
        console.error('[BBA DB] 🚨 Exception name:', errName);
        console.error('[BBA DB] 🚨 Exception message:', errMsg);
        console.error('[BBA DB] 🚨 Exception code:', errCode);
        console.error('[BBA DB] 🚨 Exception details:', errDetails);
        console.error('[BBA DB] 🚨 Exception hint:', errHint);
        console.error('[BBA DB] 🚨 Exception category:', category);
        if (err.stack) console.error('[BBA DB] 🚨 Stack (first 3 lines):', err.stack.split('\n').slice(0, 4).join('\n'));

        var fallbackResult = this._saveToLocalAndQueueSync(localKey, formData, err);
        return fallbackResult;
      }
    },

    /* ============================================================
     * OFFLINE FALLBACK: Save to localStorage and queue sync for later.
     * Used when Supabase is unavailable or the insert fails.
     * ============================================================ */
    _saveToLocalAndQueueSync: function(localKey, formData, supabaseError) {
      console.log('[BBA DB] _saveToLocalAndQueueSync: saving ' + localKey + ' to localStorage');

      /* ═══ LOG THE EXACT SUPABASE EXCEPTION ═══
         supabaseError is now passed as the full error object (not just .message string).
         Log every property available for debugging on mobile. */
      if (supabaseError) {
        console.log('[BBA DB] _saveToLocalAndQueueSync: 🚨 FALLBACK triggered by Supabase error:');
        console.log('[BBA DB]   Error name:', supabaseError.name || 'N/A');
        console.log('[BBA DB]   Error message:', supabaseError.message || 'N/A');
        console.log('[BBA DB]   Error code:', supabaseError.code || 'N/A');
        console.log('[BBA DB]   Error details:', supabaseError.details || 'N/A');
        console.log('[BBA DB]   Error hint:', supabaseError.hint || 'N/A');
        /* Categorize the error for easier diagnosis */
        var errMsg = (supabaseError.message || '').toLowerCase();
        if (errMsg.indexOf('failed to fetch') !== -1 || errMsg.indexOf('network') !== -1) {
          console.log('[BBA DB]   ▶ Category: NETWORK ERROR — mobile device may have lost connectivity during the request');
        } else if (errMsg.indexOf('row-level security') !== -1 || errMsg.indexOf('violates') !== -1 || supabaseError.code === '42501') {
          console.log('[BBA DB]   ▶ Category: RLS POLICY — the anonymous insert is blocked by row-level security');
        } else if (errMsg.indexOf('does not exist') !== -1 || errMsg.indexOf('column') !== -1) {
          console.log('[BBA DB]   ▶ Category: SCHEMA MISMATCH — a column in the insert does not exist in the Supabase table');
        } else if (errMsg.indexOf('timeout') !== -1) {
          console.log('[BBA DB]   ▶ Category: TIMEOUT — the request took too long on slow mobile network');
        } else if (supabaseError.name === 'TypeError') {
          console.log('[BBA DB]   ▶ Category: JAVASCRIPT RUNTIME ERROR — a TypeError occurred, check browser console');
        }
      } else {
        console.log('[BBA DB] _saveToLocalAndQueueSync: No Supabase error provided (Supabase was never attempted — supabaseClient was null)');
      }

      var all = [];
      try {
        all = JSON.parse(localStorage.getItem(localKey) || '[]');
      } catch(e) {
        console.error('[BBA DB] _saveToLocalAndQueueSync: JSON parse of existing data failed:', e.message);
      }
      all.push(formData);

      try {
        localStorage.setItem(localKey, JSON.stringify(all));
        console.log('[BBA DB] _saveToLocalAndQueueSync: ✅ saved to localStorage');
      } catch (e) {
        console.error('[BBA DB] 🚨 FALLBACK — localStorage.setItem failed in _saveToLocalAndQueueSync');
        console.error('[BBA DB] 🚨 Exception name:', e.name);
        console.error('[BBA DB] 🚨 Exception message:', e.message);
        console.error('[BBA DB] 🚨 Key:', localKey);
        console.error('[BBA DB] 🚨 Likely cause: Mobile private browsing or storage quota exceeded');
        return {
          success: false,
          source: 'localStorage_error',
          error: e.message,
          supabaseError: supabaseError ? supabaseError.message : null,
          supabaseErrorFull: supabaseError ? {
            name: supabaseError.name,
            message: supabaseError.message,
            code: supabaseError.code,
            details: supabaseError.details,
            hint: supabaseError.hint
          } : null
        };
      }

      /* Queue sync for later — the monkey-patch on localStorage.setItem handles this
         automatically, but we also call syncNow explicitly in case the monkey-patch
         failed (mobile strict mode). */
      if (window.BBA && window.BBA.DB && window.BBA.DB.syncNow) {
        setTimeout(function() {
          window.BBA.DB.syncNow(localKey);
        }, 100);
      }

      return {
        success: true,
        source: 'localStorage',
        offline: true,
        supabaseError: supabaseError ? supabaseError.message : null,
        supabaseErrorFull: supabaseError ? {
          name: supabaseError.name,
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint
        } : null
      };
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
    console.log('[BBA DB] 🌐 Network connection restored — flushing queued syncs');
    if (isConnected && supabaseClient) {
      /* Queue sync for all BBA data keys that have data in localStorage */
      for (var key in BBA_SYNC_KEYS) {
        if (BBA_SYNC_KEYS.hasOwnProperty(key)) {
          try {
            var raw = localStorage.getItem(key);
            if (raw && raw.length > 2) {
              queueSync(key);
              console.log('[BBA DB] Auto-sync queued:', key);
            }
          } catch(e) {}
        }
      }
      /* Also sync CMS content */
      for (var i = 0; i < localStorage.length; i++) {
        var lsKey = localStorage.key(i);
        if (lsKey && lsKey.indexOf('bba_cms_') === 0) {
          queueSync(lsKey);
        }
      }
      /* Also push pending points */
      pushPoints();
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
