/* ============================================================
   منصة وعي الشباب BBA - Security Audit Log Module
   Tracks login, logout, content changes, certificate creation,
   role changes, data deletion, and other sensitive actions.
   Version: 1.0.0
   
   Stores logs in Supabase (audit_logs table) via SECURITY DEFINER
   function, with localStorage fallback for offline mode.
   ============================================================ */

(function initAudit() {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  var CONFIG = {
    /* localStorage fallback key */
    localKey: 'bba_security_log',
    /* Max entries to keep in localStorage */
    maxLocalEntries: 500,
    /* Sync interval (ms) - flush local logs to Supabase */
    syncInterval: 60000,
    /* Max entries to send in one sync batch */
    batchSize: 50
  };

  /* ============================================================
   * STATE
   * ============================================================ */
  var unsyncedLogs = [];
  var syncTimer = null;

  /* ============================================================
   * HELPERS
   * ============================================================ */
  function getActorInfo() {
    var info = {
      id: '',
      email: '',
      role: ''
    };

    /* Try Supabase Auth first */
    if (window.BBA && window.BBA.Auth) {
      var user = window.BBA.Auth.getUser();
      if (user) {
        info.id = user.id || '';
        info.email = user.email || '';
        info.role = window.BBA.Auth.getRole() || '';
        return info;
      }
    }

    /* Legacy auth fallback */
    try {
      var legacyUser = JSON.parse(sessionStorage.getItem('bba_auth_user') || 'null');
      if (legacyUser) {
        info.id = legacyUser.id || '';
        info.email = legacyUser.email || '';
      }
      info.role = sessionStorage.getItem('bba_auth_role') || '';
    } catch(e) {}

    /* If still empty, try legacy admin session */
    if (!info.email) {
      if (sessionStorage.getItem('bba_admin_auth') === 'true') {
        info.email = window.BBA && window.BBA.Config ? window.BBA.Config.devAdminEmail : 'admin@bba.dz';
        info.role = 'admin';
      }
      if (sessionStorage.getItem('bba_psych_auth') === 'true') {
        info.email = window.BBA && window.BBA.Config ? window.BBA.Config.devPsychologistEmail : 'psychologist@bba.dz';
        info.role = 'psychologist';
      }
    }

    return info;
  }

  function getClientInfo() {
    return {
      ip: '',
      ua: typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    };
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /* ============================================================
   * CORE LOGGING
   * ============================================================ */
  function log(eventType, targetType, targetId, targetSummary, details) {
    var actor = getActorInfo();
    var client = getClientInfo();

    var entry = {
      id: generateId(),
      event_type: eventType,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      target_type: targetType || '',
      target_id: targetId || '',
      target_summary: targetSummary || '',
      details: details || {},
      ip_address: client.ip,
      user_agent: client.ua,
      created_at: new Date().toISOString(),
      _synced: false
    };

    /* Try to send to Supabase immediately */
    sendToSupabase(entry);

    /* Always store locally as fallback */
    storeLocally(entry);

    /* Also trigger the legacy security log */
    if (window.BBA && window.BBA.Security) {
      window.BBA.Security.logEvent(eventType, {
        targetType: targetType,
        targetId: targetId,
        targetSummary: targetSummary,
        details: details
      });
    }

    /* Dispatch event for UI updates */
    var evt = new CustomEvent('auditLog', { detail: entry });
    document.dispatchEvent(evt);

    return entry;
  }

  /* ============================================================
   * SUPABASE PERSISTENCE
   * ============================================================ */
  function sendToSupabase(entry) {
    /* Check if Supabase client is available */
    var db = window.BBA && window.BBA.DB;
    if (!db || !db.isOnline()) {
      queueForSync(entry);
      return;
    }

    /* Verify the insert_audit_log function exists by checking connection */
    var supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      queueForSync(entry);
      return;
    }

    /* Call the SECURITY DEFINER function - bypasses RLS */
    supabaseClient.rpc('insert_audit_log', {
      p_event_type: entry.event_type,
      p_actor_id: entry.actor_id,
      p_actor_email: entry.actor_email,
      p_actor_role: entry.actor_role,
      p_target_type: entry.target_type,
      p_target_id: entry.target_id,
      p_target_summary: entry.target_summary,
      p_details: entry.details,
      p_ip_address: entry.ip_address,
      p_user_agent: entry.user_agent
    }).then(function(result) {
      if (result.error) {
        console.warn('[BBA Audit] Supabase insert failed:', result.error.message);
        queueForSync(entry);
      } else {
        entry._synced = true;
        markLocalAsSynced(entry.id);
      }
    }).catch(function(err) {
      console.warn('[BBA Audit] Supabase RPC error:', err.message);
      queueForSync(entry);
    });
  }

  function getSupabaseClient() {
    try {
      /* If database.js has initialized and exposed the client */
      if (window.__bba_supabase_client) {
        return window.__bba_supabase_client;
      }
      /* Fallback: try to get it from the supabase global */
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        var url = 'https://ouyqcyrbppkxvcknxtbn.supabase.co';
        var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXFjeXJicHBreHZja254dGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjY1NzUsImV4cCI6MjA5NzA0MjU3NX0.w4j5sQP0kHjXeY7l7o6lJm11VN0RkFfFfh3HTL1w5Rk';
        if (window.BBA && window.BBA.Config) {
          url = window.BBA.Config.supabaseUrl || url;
          key = window.BBA.Config.supabaseAnonKey || key;
        }
        return window.supabase.createClient(url, key);
      }
    } catch(e) {
      return null;
    }
    return null;
  }

  /* ============================================================
   * LOCAL FALLBACK + SYNC QUEUE
   * ============================================================ */
  function storeLocally(entry) {
    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
      logs.unshift(entry);
      /* Trim to max entries */
      if (logs.length > CONFIG.maxLocalEntries) {
        logs = logs.slice(0, CONFIG.maxLocalEntries);
      }
      localStorage.setItem(CONFIG.localKey, JSON.stringify(logs));
    } catch(e) {
      /* localStorage might be full or disabled */
    }
  }

  function queueForSync(entry) {
    unsyncedLogs.push(entry);
    scheduleSync();
  }

  function markLocalAsSynced(entryId) {
    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].id === entryId) {
          logs[i]._synced = true;
          break;
        }
      }
      localStorage.setItem(CONFIG.localKey, JSON.stringify(logs));
    } catch(e) {}
  }

  function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(flushUnsynced, CONFIG.syncInterval);
  }

  async function flushUnsynced() {
    if (unsyncedLogs.length === 0) return;

    var db = window.BBA && window.BBA.DB;
    if (!db || !db.isOnline()) {
      scheduleSync();
      return;
    }

    var supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      scheduleSync();
      return;
    }

    var batch = unsyncedLogs.splice(0, CONFIG.batchSize);
    var results = [];

    for (var i = 0; i < batch.length; i++) {
      var entry = batch[i];
      try {
        var result = await supabaseClient.rpc('insert_audit_log', {
          p_event_type: entry.event_type,
          p_actor_id: entry.actor_id,
          p_actor_email: entry.actor_email,
          p_actor_role: entry.actor_role,
          p_target_type: entry.target_type,
          p_target_id: entry.target_id,
          p_target_summary: entry.target_summary,
          p_details: entry.details || {},
          p_ip_address: entry.ip_address || '',
          p_user_agent: entry.user_agent || ''
        });
        if (!result.error) {
          entry._synced = true;
          markLocalAsSynced(entry.id);
        } else {
          unsyncedLogs.push(entry);
        }
      } catch(e) {
        unsyncedLogs.push(entry);
      }
    }

    /* If there are still unsynced entries, try again later */
    if (unsyncedLogs.length > 0) {
      scheduleSync();
    }
  }

  /* ============================================================
   * RETRIEVAL
   * ============================================================ */
  function getLogs(filters) {
    filters = filters || {};

    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
    } catch(e) {
      return [];
    }

    /* Apply filters */
    if (filters.eventType) {
      logs = logs.filter(function(l) { return l.event_type === filters.eventType; });
    }
    if (filters.actorEmail) {
      logs = logs.filter(function(l) {
        return l.actor_email && l.actor_email.indexOf(filters.actorEmail) !== -1;
      });
    }
    if (filters.targetType) {
      logs = logs.filter(function(l) { return l.target_type === filters.targetType; });
    }
    if (filters.search) {
      var s = filters.search.toLowerCase();
      logs = logs.filter(function(l) {
        return (l.target_summary && l.target_summary.toLowerCase().indexOf(s) !== -1) ||
               (l.actor_email && l.actor_email.toLowerCase().indexOf(s) !== -1) ||
               (l.target_id && l.target_id.toLowerCase().indexOf(s) !== -1);
      });
    }
    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  function getLogsCount() {
    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
      return logs.length;
    } catch(e) {
      return 0;
    }
  }

  function getUnsyncedCount() {
    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
      var count = 0;
      for (var i = 0; i < logs.length; i++) {
        if (!logs[i]._synced) count++;
      }
      return count;
    } catch(e) {
      return 0;
    }
  }

  /* ============================================================
   * CLEAR LOCAL LOGS (already synced)
   * ============================================================ */
  function clearSynced() {
    try {
      var logs = JSON.parse(localStorage.getItem(CONFIG.localKey) || '[]');
      logs = logs.filter(function(l) { return !l._synced; });
      localStorage.setItem(CONFIG.localKey, JSON.stringify(logs));
    } catch(e) {}
  }

  /* ============================================================
   * AUDIT LOG VIEWER (Admin dashboard section)
   * ============================================================ */
  var EVENT_LABELS = {
    login_success: { icon: '🔓', label: 'تسجيل دخول ناجح', color: 'var(--success)' },
    login_failure: { icon: '🔒', label: 'محاولة دخول فاشلة', color: 'var(--danger)' },
    logout: { icon: '🚪', label: 'تسجيل خروج', color: 'var(--muted)' },
    content_create: { icon: '➕', label: 'إنشاء محتوى', color: 'var(--success)' },
    content_update: { icon: '✏️', label: 'تحديث محتوى', color: 'var(--gold)' },
    content_delete: { icon: '🗑️', label: 'حذف محتوى', color: 'var(--danger)' },
    certificate_create: { icon: '📜', label: 'إصدار شهادة', color: 'var(--gold)' },
    certificate_reissue: { icon: '🔄', label: 'إعادة إصدار شهادة', color: '#8b5cf6' },
    certificate_delete: { icon: '🗑️', label: 'حذف شهادة', color: 'var(--danger)' },
    volunteer_approve: { icon: '✅', label: 'قبول متطوع', color: 'var(--success)' },
    volunteer_reject: { icon: '❌', label: 'رفض متطوع', color: 'var(--danger)' },
    volunteer_suspend: { icon: '⏸️', label: 'تعليق متطوع', color: 'var(--muted)' },
    volunteer_unsuspend: { icon: '▶️', label: 'إلغاء تعليق متطوع', color: 'var(--success)' },
    volunteer_delete: { icon: '🗑️', label: 'حذف متطوع', color: 'var(--danger)' },
    volunteer_edit: { icon: '✏️', label: 'تعديل متطوع', color: 'var(--gold)' },
    role_change: { icon: '🔐', label: 'تغيير صلاحية', color: '#8b5cf6' },
    data_delete: { icon: '💥', label: 'حذف بيانات', color: 'var(--danger)' },
    settings_change: { icon: '⚙️', label: 'تغيير إعدادات', color: 'var(--gold)' },
    report_generate: { icon: '📊', label: 'توليد تقرير', color: 'var(--gold)' },
    seed_data: { icon: '🌱', label: 'بيانات اختبار', color: '#8b5cf6' },
    system: { icon: '⚡', label: 'نظام', color: 'var(--muted)' }
  };

  function renderAuditViewer(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var logs = getLogs({ limit: 200 });

    var html = '';

    /* Filter bar */
    html += '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">';
    html += '<input type="text" id="auditSearchInput" placeholder="🔍 بحث في السجل..." style="flex:1;min-width:160px;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.8rem">';
    html += '<select id="auditTypeFilter" style="padding:0.5rem 0.75rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);font-size:0.8rem">';
    html += '<option value="">جميع الأنواع</option>';
    for (var key in EVENT_LABELS) {
      if (EVENT_LABELS.hasOwnProperty(key)) {
        html += '<option value="' + key + '">' + EVENT_LABELS[key].icon + ' ' + EVENT_LABELS[key].label + '</option>';
      }
    }
    html += '</select>';
    html += '<span style="font-size:0.75rem;color:var(--muted);align-self:center">' + logs.length + ' حدث</span>';
    html += '</div>';

    /* Log list */
    if (logs.length === 0) {
      html += '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem">لا توجد أحداث مسجلة في سجل التدقيق</div>';
    } else {
      html += '<div id="auditLogList" style="max-height:500px;overflow-y:auto">';
      for (var i = 0; i < logs.length; i++) {
        html += renderLogEntry(logs[i]);
      }
      html += '</div>';
    }

    /* Sync status */
    var unsynced = getUnsyncedCount();
    if (unsynced > 0) {
      html += '<div style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:var(--radius-sm);font-size:0.75rem;color:var(--gold)">';
      html += '⏳ ' + unsynced + ' حدث في انتظار المزامنة مع Supabase';
      html += '</div>';
    }

    /* Synced count */
    var syncedCount = 0;
    for (var i = 0; i < logs.length; i++) {
      if (logs[i]._synced) syncedCount++;
    }
    if (syncedCount > 0) {
      html += '<div style="margin-top:0.5rem;font-size:0.7rem;color:var(--muted)">✅ ' + syncedCount + ' حدث متزامن مع الخادم</div>';
    }

    container.innerHTML = html;

    /* Wire filter events */
    setTimeout(function() {
      var searchInput = document.getElementById('auditSearchInput');
      var typeFilter = document.getElementById('auditTypeFilter');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          applyAuditFilters(containerId);
        });
      }
      if (typeFilter) {
        typeFilter.addEventListener('change', function() {
          applyAuditFilters(containerId);
        });
      }
    }, 50);
  }

  function applyAuditFilters(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var searchEl = document.getElementById('auditSearchInput');
    var typeEl = document.getElementById('auditTypeFilter');

    var filters = { limit: 200 };
    if (typeEl && typeEl.value) filters.eventType = typeEl.value;
    if (searchEl && searchEl.value.trim()) filters.search = searchEl.value.trim();

    var logs = getLogs(filters);
    var listEl = document.getElementById('auditLogList');
    if (!listEl) return;

    if (logs.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:0.85rem">لا توجد نتائج تطابق البحث</div>';
    } else {
      var html = '';
      for (var i = 0; i < logs.length; i++) {
        html += renderLogEntry(logs[i]);
      }
      listEl.innerHTML = html;
    }
  }

  function renderLogEntry(entry) {
    var eventInfo = EVENT_LABELS[entry.event_type] || { icon: '❓', label: entry.event_type, color: 'var(--muted)' };
    var date = new Date(entry.created_at);
    var timeStr = date.toLocaleDateString('ar-DZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    var detailsStr = '';
    if (entry.target_summary) {
      detailsStr += '<div style="font-size:0.75rem;color:var(--text-secondary)">🎯 ' + escapeHtml(entry.target_summary) + '</div>';
    }
    if (entry.target_id) {
      detailsStr += '<div style="font-size:0.7rem;color:var(--muted);font-family:monospace">ID: ' + escapeHtml(entry.target_id) + '</div>';
    }

    return '<div style="padding:0.5rem 0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);margin-bottom:0.35rem;background:rgba(255,255,255,0.02)">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:0.35rem">' +
      '<span style="font-size:0.85rem">' + eventInfo.icon + '</span>' +
      '<span style="font-weight:600;font-size:0.78rem;color:' + eventInfo.color + '">' + eventInfo.label + '</span>' +
      (entry.actor_email ? '<span style="font-size:0.7rem;color:var(--muted)">بواسطة ' + escapeHtml(entry.actor_email) + '</span>' : '') +
      (entry._synced ? '<span style="font-size:0.55rem;color:var(--success);background:rgba(16,185,129,0.1);padding:0.1rem 0.3rem;border-radius:3px">✓</span>' : '') +
      '</div>' +
      detailsStr +
      '</div>' +
      '<span style="font-size:0.65rem;color:var(--muted);white-space:nowrap;flex-shrink:0">' + timeStr + '</span>' +
      '</div></div>';
  }

  function escapeHtml(t) {
    if (!t) return '';
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  /* ============================================================
   * PUBLIC API
   * ============================================================ */
  var Audit = {
    /* Core logging */
    log: log,

    /* Convenience methods for common audit events */
    logLogin: function(email, success) {
      return log(success ? 'login_success' : 'login_failure', 'auth', email, email, {});
    },

    logLogout: function(email) {
      return log('logout', 'auth', email, email, {});
    },

    logCertificateCreate: function(certNumber, volunteerName) {
      return log('certificate_create', 'certificate', certNumber, 'شهادة: ' + certNumber + ' - ' + volunteerName, {
        certificateNumber: certNumber,
        volunteerName: volunteerName
      });
    },

    logCertificateReissue: function(certNumber, volunteerName) {
      return log('certificate_reissue', 'certificate', certNumber, 'إعادة إصدار: ' + certNumber + ' - ' + volunteerName, {
        certificateNumber: certNumber,
        volunteerName: volunteerName
      });
    },

    logCertificateDelete: function(certNumber, volunteerName) {
      return log('certificate_delete', 'certificate', certNumber, 'حذف شهادة: ' + certNumber + ' - ' + volunteerName, {
        certificateNumber: certNumber,
        volunteerName: volunteerName
      });
    },

    logVolunteerAction: function(action, volunteerId, volunteerName, details) {
      var eventType = 'volunteer_' + action;
      return log(eventType, 'volunteer', volunteerId, volunteerName, details || {});
    },

    logContentChange: function(action, contentType, contentId, summary) {
      return log('content_' + action, contentType, contentId, summary, {});
    },

    logDataDelete: function(targetType, targetId, summary) {
      return log('data_delete', targetType, targetId, summary, {});
    },

    logRoleChange: function(userEmail, oldRole, newRole) {
      return log('role_change', 'user_role', userEmail, 'تغيير صلاحية: ' + userEmail + ' من ' + oldRole + ' إلى ' + newRole, {
        email: userEmail,
        oldRole: oldRole,
        newRole: newRole
      });
    },

    /* Retrieval */
    getLogs: getLogs,
    getCount: getLogsCount,
    getUnsyncedCount: getUnsyncedCount,

    /* Viewer */
    renderAuditViewer: renderAuditViewer,

    /* Maintenance */
    clearSynced: clearSynced,

    /* Force flush unsynced */
    flushNow: function() {
      flushUnsynced();
    }
  };

  /* ============================================================
   * EXPOSE
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.Audit = Audit;

  /* ============================================================
   * AUTO-INIT: Flush unsynced logs periodically
   * ============================================================ */
  function initAuditModule() {
    /* Wait for database module */
    var checkDb = setInterval(function() {
      if (window.BBA && window.BBA.DB) {
        clearInterval(checkDb);
        /* Try to flush any unsynced logs from previous session */
        setTimeout(function() {
          flushUnsynced();
        }, 5000);
        /* Set up periodic sync */
        setInterval(function() {
          flushUnsynced();
        }, CONFIG.syncInterval);
        console.log('✅ [BBA Audit] Audit module initialized');
      }
    }, 500);

    /* Timeout after 15 seconds */
    setTimeout(function() {
      clearInterval(checkDb);
    }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuditModule);
  } else {
    initAuditModule();
  }

})();
