/* ============================================================
   منصة وعي الشباب BBA - Notification System
   In-app notifications with Supabase storage + realtime
   Unread counter · Mark as read · History · Auto-triggers
   Version: 1.0.0
   ============================================================ */
(function initNotifications() {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  var CONFIG = {
    /* localStorage key for notifications (backed up by DB sync) */
    storageKey: 'bba_notifications_data',
    /* Polling interval when Realtime unavailable (ms) */
    pollInterval: 30000,
    /* Max notifications to keep in memory */
    maxNotifications: 200,
    /* Bell icon update interval (ms) */
    bellUpdateInterval: 10000
  };

  /* ============================================================
   * STATE
   * ============================================================ */
  var notifications = [];
  var unreadCount = 0;
  var realtimeUnsub = null;
  var pollTimer = null;
  var bellUpdateTimer = null;
  var initialized = false;

  /* ============================================================
   * TYPE DEFINITIONS (icon, label, default link)
   * ============================================================ */
  var NOTIF_TYPES = {
    volunteer_approved:     { icon: '✅', label: 'قبول متطوع', defaultLink: 'portal.html' },
    volunteer_rejected:     { icon: '❌', label: 'رفض متطوع', defaultLink: 'portal.html' },
    certificate_issued:     { icon: '📜', label: 'إصدار شهادة', defaultLink: 'portal.html' },
    consultation_updated:   { icon: '💬', label: 'تحديث استشارة', defaultLink: 'portal.html' },
    announcement:           { icon: '📢', label: 'إعلان جديد', defaultLink: 'portal.html' },
    role_changed:           { icon: '🔐', label: 'تغيير صلاحية', defaultLink: 'sidou-da.html' },
    new_task:               { icon: '📋', label: 'مهمة جديدة', defaultLink: 'portal.html' },
    achievement_awarded:    { icon: '🏆', label: 'إنجاز جديد', defaultLink: 'portal.html' },
    account_suspended:      { icon: '⏸️', label: 'تعليق حساب', defaultLink: 'portal.html' },
    account_unsuspended:    { icon: '▶️', label: 'إلغاء تعليق', defaultLink: 'portal.html' },
    event_reminder:         { icon: '📅', label: 'تذكير بفعالية', defaultLink: 'portal.html' },
    points_awarded:         { icon: '⭐', label: 'نقاط تطوع', defaultLink: 'portal.html' }
  };

  /* ============================================================
   * HELPERS
   * ============================================================ */
  function getCurrentUserId() {
    if (window.BBA && window.BBA.Auth) {
      var user = window.BBA.Auth.getUser();
      if (user) return user.id || user.email || '';
    }
    /* Legacy fallback */
    try {
      var u = JSON.parse(sessionStorage.getItem('bba_auth_user') || 'null');
      return u ? (u.id || u.email || '') : '';
    } catch(e) { return ''; }
  }

  function getCurrentRole() {
    if (window.BBA && window.BBA.Auth) return window.BBA.Auth.getRole() || '';
    return sessionStorage.getItem('bba_auth_role') || '';
  }

  function getVolunteerId() {
    /* Try to get volunteerId from auth role data */
    if (window.BBA && window.BBA.Auth) {
      var roleData = window.BBA.Auth.getRoleData();
      if (roleData && roleData.volunteer_id) return roleData.volunteer_id;
    }
    try {
      return sessionStorage.getItem('bba_portal_volunteer_id') || '';
    } catch(e) { return ''; }
  }

  function getUserDisplayName() {
    if (window.BBA && window.BBA.Auth) {
      var user = window.BBA.Auth.getUser();
      if (user) return user.email || user.id || 'النظام';
    }
    try {
      var u = JSON.parse(sessionStorage.getItem('bba_auth_user') || 'null');
      return u ? (u.email || 'النظام') : 'النظام';
    } catch(e) { return 'النظام'; }
  }

  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  function getSupabaseClient() {
    try {
      if (window.__bba_supabase_client) return window.__bba_supabase_client;
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        var url = 'https://ouyqcyrbppkxvcknxtbn.supabase.co';
        var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eXFjeXJicHBreHZja254dGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjY1NzUsImV4cCI6MjA5NzA0MjU3NX0.w4j5sQP0kHjXeY7l7o6lJm11VN0RkFfFfh3HTL1w5Rk';
        if (window.BBA && window.BBA.Config) {
          url = window.BBA.Config.supabaseUrl || url;
          key = window.BBA.Config.supabaseAnonKey || key;
        }
        return window.supabase.createClient(url, key);
      }
    } catch(e) { return null; }
    return null;
  }

  /* ============================================================
   * CORE API
   * ============================================================ */
  var Notifications = {

    /* ---------- INIT ---------- */
    init: function() {
      if (initialized) return;
      initialized = true;

      /* Load existing notifications from localStorage */
      this.loadFromStorage();

      /* Try realtime subscription */
      this.subscribeRealtime();

      /* Fallback polling */
      pollTimer = setInterval(this.poll.bind(this), CONFIG.pollInterval);

      /* Start bell counter updater */
      bellUpdateTimer = setInterval(this.updateAllBells.bind(this), CONFIG.bellUpdateInterval);

      /* Listen for auth changes */
      document.addEventListener('bbaAuthChanged', this.handleAuthChange.bind(this));

      this.updateAllBells();
      console.log('✅ [BBA Notifications] System initialized');
    },

    handleAuthChange: function() {
      this.loadFromStorage();
      this.updateAllBells();
    },

    /* ---------- CREATE NOTIFICATION ---------- */
    create: function(type, data) {
      if (!type) return null;

      data = data || {};
      var typeInfo = NOTIF_TYPES[type] || { icon: 'ℹ️', label: type, defaultLink: '' };

      var notification = {
        id: generateId(),
        type: type,
        title: data.title || typeInfo.label,
        message: data.message || '',
        icon: data.icon || typeInfo.icon,
        link: data.link || typeInfo.defaultLink || '',
        recipientId: data.recipientId || 'all',
        recipientRole: data.recipientRole || null,
        isUrgent: data.isUrgent || false,
        read: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        metadata: data.metadata || {},
        senderId: getUserDisplayName(),
        senderName: data.senderName || 'النظام',
        /* Sync status for DB */
        _synced: false,
        _supabase_id: null
      };

      /* Add to local array */
      notifications.unshift(notification);

      /* Trim */
      if (notifications.length > CONFIG.maxNotifications) {
        notifications = notifications.slice(0, CONFIG.maxNotifications);
      }

      /* Save to localStorage (triggers auto-sync to Supabase via DB module) */
      this.saveToStorage();

      /* Try direct Supabase insert for Realtime */
      this.insertToSupabase(notification);

      /* Update bell counters */
      unreadCount = this.computeUnreadCount();
      this.updateAllBells();

      /* Dispatch event for UI updates */
      document.dispatchEvent(new CustomEvent('notificationCreated', {
        detail: { notification: notification }
      }));

      /* If urgent, show toast */
      if (data.isUrgent) {
        var toastMsg = data.title + (data.message ? ': ' + data.message : '');
        if (window.showPlatformToast) {
          window.showPlatformToast('🔔 ' + toastMsg, 'info');
        } else if (window.showToast) {
          window.showToast('🔔 ' + toastMsg, 'info');
        }
      }

      return notification;
    },

    /* ---------- DIRECT SUPABASE INSERT (for Realtime propagation) ---------- */
    insertToSupabase: function(notification) {
      var supabase = getSupabaseClient();
      if (!supabase) return;

      var row = {
        recipient_id: notification.recipientId,
        recipient_role: notification.recipientRole,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        link: notification.link,
        is_urgent: notification.isUrgent,
        metadata: notification.metadata,
        sender_name: notification.senderName,
        read: false
      };

      supabase
        .from('notifications')
        .insert(row)
        .select('id')
        .then(function(result) {
          if (!result.error && result.data && result.data.length > 0) {
            notification._supabase_id = result.data[0].id;
            notification._synced = true;
            /* Update stored version with Supabase ID */
            for (var i = 0; i < notifications.length; i++) {
              if (notifications[i].id === notification.id) {
                notifications[i]._supabase_id = notification._supabase_id;
                notifications[i]._synced = true;
                break;
              }
            }
            Notifications.saveToStorage();
          }
        })
        .catch(function(err) {
          console.warn('[BBA Notifications] Supabase insert failed:', err.message);
        });
    },

    /* ---------- GET NOTIFICATIONS ---------- */
    getAll: function(filters) {
      filters = filters || {};
      var result = notifications.slice();

      /* Filter by recipient relevance */
      var userId = getCurrentUserId();
      var role = getCurrentRole();
      var volId = getVolunteerId();

      /* If a specific recipient filter is provided, use it */
      if (filters.recipientId) {
        result = result.filter(function(n) {
          return n.recipientId === filters.recipientId ||
                 n.recipientId === 'all' ||
                 (n.recipientRole && n.recipientRole === role);
        });
      }

      if (filters.type) {
        result = result.filter(function(n) { return n.type === filters.type; });
      }

      if (filters.unreadOnly) {
        result = result.filter(function(n) { return !n.read; });
      }

      if (filters.limit) {
        result = result.slice(0, filters.limit);
      }

      return result;
    },

    getForCurrentUser: function(limit) {
      var userId = getCurrentUserId();
      var role = getCurrentRole();
      var volId = getVolunteerId();

      var result = [];
      for (var i = 0; i < notifications.length; i++) {
        var n = notifications[i];
        /* Match: direct recipient, 'all' broadcast, role-targeted, or volunteer ID match */
        var matches = n.recipientId === userId ||
                      n.recipientId === volId ||
                      n.recipientId === 'all' ||
                      (n.recipientRole && n.recipientRole === role);
        if (matches) {
          result.push(n);
        }
      }

      if (limit && result.length > limit) {
        result = result.slice(0, limit);
      }

      return result;
    },

    getUnread: function() {
      var userId = getCurrentUserId();
      var role = getCurrentRole();
      var volId = getVolunteerId();

      var result = [];
      for (var i = 0; i < notifications.length; i++) {
        var n = notifications[i];
        if (n.read) continue;
        var matches = n.recipientId === userId ||
                      n.recipientId === volId ||
                      n.recipientId === 'all' ||
                      (n.recipientRole && n.recipientRole === role);
        if (matches) {
          result.push(n);
        }
      }
      return result;
    },

    getUnreadCount: function() {
      return this.getUnread().length;
    },

    /* ---------- MARK AS READ ---------- */
    markRead: function(notificationId) {
      for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id === notificationId) {
          notifications[i].read = true;
          notifications[i].readAt = new Date().toISOString();
          this.saveToStorage();
          this.updateAllBells();

          /* Sync read status to Supabase */
          if (notifications[i]._supabase_id) {
            var supabase = getSupabaseClient();
            if (supabase) {
              supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notifications[i]._supabase_id)
                .then(function() {})
                .catch(function() {});
            }
          }

          return true;
        }
      }
      return false;
    },

    markAllRead: function() {
      var changed = false;
      for (var i = 0; i < notifications.length; i++) {
        if (!notifications[i].read) {
          notifications[i].read = true;
          notifications[i].readAt = new Date().toISOString();
          changed = true;
        }
      }
      if (changed) {
        this.saveToStorage();
        this.updateAllBells();

        /* Bulk sync to Supabase */
        var supabase = getSupabaseClient();
        if (supabase) {
          supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('read', false)
            .then(function() {})
            .catch(function() {});
        }
      }
      return changed;
    },

    /* ---------- DELETE ---------- */
    delete: function(notificationId) {
      for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id === notificationId) {
          var n = notifications.splice(i, 1)[0];
          this.saveToStorage();
          this.updateAllBells();

          /* Delete from Supabase */
          if (n._supabase_id) {
            var supabase = getSupabaseClient();
            if (supabase) {
              supabase
                .from('notifications')
                .delete()
                .eq('id', n._supabase_id)
                .then(function() {})
                .catch(function() {});
            }
          }
          return true;
        }
      }
      return false;
    },

    clearAll: function() {
      notifications = [];
      this.saveToStorage();
      this.updateAllBells();
    },

    /* ---------- STORAGE ---------- */
    saveToStorage: function() {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(notifications));
      } catch(e) {
        console.warn('[BBA Notifications] Failed to save to localStorage:', e.message);
      }
    },

    loadFromStorage: function() {
      try {
        var raw = localStorage.getItem(CONFIG.storageKey);
        if (raw) {
          notifications = JSON.parse(raw);
          if (!Array.isArray(notifications)) notifications = [];
        } else {
          notifications = [];
        }
        unreadCount = this.computeUnreadCount();
      } catch(e) {
        notifications = [];
      }
    },

    computeUnreadCount: function() {
      return this.getUnread().length;
    },

    /* ---------- REAL-TIME SUBSCRIPTION ---------- */
    subscribeRealtime: function() {
      var supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        /* Subscribe to INSERT events on the notifications table */
        var channel = supabase
          .channel('notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            function(payload) {
              var newRow = payload.new;

              /* Check if we already have this notification (avoid duplicates) */
              for (var i = 0; i < notifications.length; i++) {
                if (notifications[i]._supabase_id === newRow.id) return;
              }

              /* Check if it's relevant to the current user */
              var userId = getCurrentUserId();
              var role = getCurrentRole();
              var volId = getVolunteerId();
              var matches = newRow.recipient_id === userId ||
                            newRow.recipient_id === volId ||
                            newRow.recipient_id === 'all' ||
                            (newRow.recipient_role && newRow.recipient_role === role);

              /* Convert to local format and add */
              var notif = {
                id: generateId(),
                _supabase_id: newRow.id,
                _synced: true,
                type: newRow.type,
                title: newRow.title,
                message: newRow.message || '',
                icon: newRow.icon || (NOTIF_TYPES[newRow.type] ? NOTIF_TYPES[newRow.type].icon : 'ℹ️'),
                link: newRow.link || '',
                recipientId: newRow.recipient_id,
                recipientRole: newRow.recipient_role,
                isUrgent: newRow.is_urgent || false,
                read: newRow.read || false,
                readAt: newRow.read_at,
                createdAt: newRow.created_at,
                metadata: newRow.metadata || {},
                senderName: newRow.sender_name || 'النظام'
              };

              notifications.unshift(notif);
              if (notifications.length > CONFIG.maxNotifications) {
                notifications.pop();
              }
              Notifications.saveToStorage();
              Notifications.updateAllBells();

              /* If relevant and urgent, show toast */
              if (matches && newRow.is_urgent) {
                var toastMsg = newRow.title + (newRow.message ? ': ' + newRow.message : '');
                if (window.showPlatformToast) {
                  window.showPlatformToast('🔔 ' + toastMsg, 'info');
                } else if (window.showToast) {
                  window.showToast('🔔 ' + toastMsg, 'info');
                }
              }

              /* Dispatch event */
              document.dispatchEvent(new CustomEvent('notificationReceived', {
                detail: { notification: notif, relevant: matches }
              }));
            }
          )
          .subscribe();

        realtimeUnsub = function() {
          supabase.removeChannel(channel);
        };

        console.log('✅ [BBA Notifications] Realtime subscription active');
      } catch(err) {
        console.warn('[BBA Notifications] Realtime subscription failed:', err.message);
      }
    },

    /* ---------- POLLING (fallback) ---------- */
    poll: function() {
      var supabase = getSupabaseClient();
      if (!supabase) return;

      var userId = getCurrentUserId();
      var role = getCurrentRole();
      var volId = getVolunteerId();

      if (!userId && !role && !volId) return;

      /* Poll for new notifications since our last one */
      var latestTime = '1970-01-01T00:00:00Z';
      for (var i = 0; i < notifications.length; i++) {
        if (notifications[i]._synced && notifications[i].createdAt > latestTime) {
          latestTime = notifications[i].createdAt;
        }
      }

      var query = supabase
        .from('notifications')
        .select('*')
        .gte('created_at', latestTime)
        .order('created_at', { ascending: false })
        .limit(20);

      /* Add recipient filter */
      if (userId) {
        query = query.or('recipient_id.eq.' + userId + ',recipient_id.eq.all');
      } else if (volId) {
        query = query.or('recipient_id.eq.' + volId + ',recipient_id.eq.all');
      } else {
        query = query.eq('recipient_id', 'all');
      }

      query
        .then(function(result) {
          if (result.error || !result.data || result.data.length === 0) return;

          for (var j = 0; j < result.data.length; j++) {
            var row = result.data[j];
            /* Skip duplicates */
            var isDup = false;
            for (var k = 0; k < notifications.length; k++) {
              if (notifications[k]._supabase_id === row.id) {
                isDup = true;
                break;
              }
            }
            if (isDup) continue;

            var notif = {
              id: generateId(),
              _supabase_id: row.id,
              _synced: true,
              type: row.type,
              title: row.title,
              message: row.message || '',
              icon: row.icon || (NOTIF_TYPES[row.type] ? NOTIF_TYPES[row.type].icon : 'ℹ️'),
              link: row.link || '',
              recipientId: row.recipient_id,
              recipientRole: row.recipient_role,
              isUrgent: row.is_urgent || false,
              read: row.read || false,
              readAt: row.read_at,
              createdAt: row.created_at,
              metadata: row.metadata || {},
              senderName: row.sender_name || 'النظام'
            };

            notifications.unshift(notif);
          }

          if (notifications.length > CONFIG.maxNotifications) {
            notifications = notifications.slice(0, CONFIG.maxNotifications);
          }

          Notifications.saveToStorage();
          Notifications.updateAllBells();
        })
        .catch(function(err) {
          /* Silent - polling is a best-effort fallback */
        });
    },

    /* ============================================================
     * UI COMPONENTS
     * ============================================================ */

    /* ---------- NOTIFICATION BELL ---------- */
    renderBell: function(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      /* Build bell UI */
      container.innerHTML =
        '<div class="notif-bell" id="notifBell_' + containerId + '" role="button" tabindex="0" aria-label="الإشعارات">' +
          '<span class="notif-bell-icon" aria-hidden="true">🔔</span>' +
          '<span class="notif-bell-count" id="notifCount_' + containerId + '" style="display:none">0</span>' +
        '</div>' +
        '<div class="notif-dropdown" id="notifDropdown_' + containerId + '" style="display:none">' +
          '<div class="notif-dropdown-header">' +
            '<span class="notif-dropdown-title">الإشعارات</span>' +
            '<button type="button" class="notif-dropdown-action" id="notifMarkAllBtn_' + containerId + '">قراءة الكل</button>' +
          '</div>' +
          '<div class="notif-dropdown-list" id="notifList_' + containerId + '"></div>' +
          '<div class="notif-dropdown-footer">' +
            '<button type="button" class="notif-show-all-btn" id="notifShowAllBtn_' + containerId + '">عرض كل الإشعارات</button>' +
          '</div>' +
        '</div>';

      /* Wire events */
      var bell = document.getElementById('notifBell_' + containerId);
      var dropdown = document.getElementById('notifDropdown_' + containerId);

      if (bell && dropdown) {
        bell.addEventListener('click', function(e) {
          e.stopPropagation();
          var isOpen = dropdown.style.display !== 'none';
          /* Close all other dropdowns first */
          document.querySelectorAll('.notif-dropdown').forEach(function(d) {
            d.style.display = 'none';
          });
          if (!isOpen) {
            dropdown.style.display = 'block';
            Notifications.renderDropdownList(containerId);
          }
        });

        /* Close on click outside */
        document.addEventListener('click', function(e) {
          if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });

        /* Keyboard: Enter/Space to toggle */
        bell.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            bell.click();
          }
        });
      }

      /* Mark all read button */
      var markAllBtn = document.getElementById('notifMarkAllBtn_' + containerId);
      if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
          Notifications.markAllRead();
          Notifications.renderDropdownList(containerId);
          Notifications.updateBellCounters();
        });
      }

      /* Show all button */
      var showAllBtn = document.getElementById('notifShowAllBtn_' + containerId);
      if (showAllBtn) {
        showAllBtn.addEventListener('click', function() {
          /* If on a page with a notification history section, scroll to it */
          var historyEl = document.getElementById('notificationsHistory');
          if (historyEl) {
            historyEl.scrollIntoView({ behavior: 'smooth' });
            if (typeof Notifications.renderHistory === 'function') {
              Notifications.renderHistory('notificationsHistory');
            }
          }
          dropdown.style.display = 'none';
        });
      }

      /* Initial counter update */
      this.updateBellCounters();
    },

    renderDropdownList: function(containerId) {
      var listEl = document.getElementById('notifList_' + containerId);
      if (!listEl) return;

      var items = this.getForCurrentUser(10);
      var html = '';

      if (items.length === 0) {
        html = '<div class="notif-empty">لا توجد إشعارات</div>';
      } else {
        for (var i = 0; i < items.length; i++) {
          html += this.renderNotificationItem(items[i]);
        }
      }

      listEl.innerHTML = html;

      /* Wire click handlers */
      var notifItems = listEl.querySelectorAll('.notif-item');
      for (var i = 0; i < notifItems.length; i++) {
        (function(idx, notifId) {
          notifItems[idx].addEventListener('click', function(e) {
            /* Don't navigate if clicking mark-read button */
            if (e.target.closest('.notif-item-mark-read')) return;

            Notifications.markRead(notifId);

            /* Navigate to link if present */
            var item = null;
            for (var j = 0; j < notifications.length; j++) {
              if (notifications[j].id === notifId) {
                item = notifications[j];
                break;
              }
            }
            if (item && item.link) {
              window.location.href = item.link;
            }
          });
        })(i, items[i].id);
      }

      /* Wire mark-read buttons */
      var markReadBtns = listEl.querySelectorAll('.notif-item-mark-read');
      for (var i = 0; i < markReadBtns.length; i++) {
        (function(btn, notifId) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            Notifications.markRead(notifId);
            Notifications.renderDropdownList(containerId);
            Notifications.updateBellCounters();
          });
        })(markReadBtns[i], markReadBtns[i].getAttribute('data-id'));
      }
    },

    renderNotificationItem: function(item) {
      var timeAgo = this.getTimeAgo(item.createdAt);
      var unreadClass = item.read ? '' : ' notif-item-unread';

      return '<div class="notif-item' + unreadClass + '" data-notif-id="' + item.id + '">' +
        '<div class="notif-item-icon">' + (item.icon || 'ℹ️') + '</div>' +
        '<div class="notif-item-body">' +
          '<div class="notif-item-title">' + this.escapeHtml(item.title) + '</div>' +
          '<div class="notif-item-message">' + this.escapeHtml(item.message || '') + '</div>' +
          '<div class="notif-item-time">' + timeAgo + '</div>' +
        '</div>' +
        (!item.read ? '<button type="button" class="notif-item-mark-read" data-id="' + item.id + '" title="تحديد كمقروء">✓</button>' : '') +
      '</div>';
    },

    updateBellCounters: function() {
      var count = this.getUnreadCount();
      unreadCount = count;

      document.querySelectorAll('.notif-bell-count').forEach(function(el) {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
      });

      /* Update document title if there are unread notifications */
      if (count > 0) {
        var currentTitle = document.title;
        if (currentTitle.indexOf('(' + count + ')') === -1) {
          /* Only update if not already showing count */
        }
      }
    },

    updateAllBells: function() {
      this.updateBellCounters();
      /* Refresh any open dropdowns */
      document.querySelectorAll('.notif-dropdown:not([style*="display: none"])').forEach(function(dropdown) {
        var container = dropdown.closest('[id^="notifDropdown_"]');
        if (container) {
          var containerId = container.id.replace('notifDropdown_', '');
          /* Find the closest bell container */
          var bellContainer = document.querySelector('[id="notifBell_' + containerId + '"]');
          if (bellContainer) {
            var parent = bellContainer.parentElement;
            if (parent) {
              var parentId = parent.id;
              /* Re-render dropdown */
            }
          }
        }
      });
    },

    /* ---------- NOTIFICATION HISTORY (Full page) ---------- */
    renderHistory: function(containerId, limit) {
      var container = document.getElementById(containerId);
      if (!container) return;

      limit = limit || 50;
      var items = this.getForCurrentUser(limit);
      var html = '';

      /* Group by date */
      var groups = {};
      var now = new Date();
      var today = now.toDateString();
      var yesterday = new Date(now.getTime() - 86400000).toDateString();

      for (var i = 0; i < items.length; i++) {
        var dateKey = new Date(items[i].createdAt).toDateString();
        var label;
        if (dateKey === today) label = 'اليوم';
        else if (dateKey === yesterday) label = 'أمس';
        else label = new Date(items[i].createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });

        if (!groups[label]) groups[label] = [];
        groups[label].push(items[i]);
      }

      /* Render header */
      html += '<div class="notif-history-header">' +
        '<h3>الإشعارات</h3>' +
        '<div class="notif-history-actions">' +
          '<button type="button" class="btn btn-sm btn-secondary" id="notifMarkAllReadBtn">📖 قراءة الكل</button>' +
          '<button type="button" class="btn btn-sm btn-secondary" id="notifClearBtn">🗑️ مسح الكل</button>' +
        '</div>' +
      '</div>';

      if (items.length === 0) {
        html += '<div class="notif-empty-state">' +
          '<div style="font-size:3rem;margin-bottom:0.75rem">🔔</div>' +
          '<p style="color:var(--text-muted)">لا توجد إشعارات بعد</p>' +
          '</div>';
        container.innerHTML = html;
        return;
      }

      /* Render groups */
      var groupKeys = Object.keys(groups);
      for (var g = 0; g < groupKeys.length; g++) {
        html += '<div class="notif-history-group">' +
          '<div class="notif-history-date">' + groupKeys[g] + '</div>';

        var groupItems = groups[groupKeys[g]];
        for (var n = 0; n < groupItems.length; n++) {
          html += this.renderHistoryItem(groupItems[n]);
        }

        html += '</div>';
      }

      /* Unread count summary */
      var unreadTotal = this.getUnreadCount();
      if (unreadTotal > 0) {
        html += '<div class="notif-history-summary">' +
          '📬 لديك ' + unreadTotal + ' إشعار غير مقروء' +
          '</div>';
      }

      container.innerHTML = html;

      /* Wire buttons */
      var markAllBtn = document.getElementById('notifMarkAllReadBtn');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
          Notifications.markAllRead();
          Notifications.renderHistory(containerId, limit);
        });
      }

      var clearBtn = document.getElementById('notifClearBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          if (confirm('مسح جميع الإشعارات؟')) {
            Notifications.clearAll();
            Notifications.renderHistory(containerId, limit);
          }
        });
      }

      /* Wire individual mark-read */
      var markBtns = container.querySelectorAll('.notif-history-mark-read');
      for (var i = 0; i < markBtns.length; i++) {
        (function(btn, notifId) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            Notifications.markRead(notifId);
            Notifications.renderHistory(containerId, limit);
          });
        })(markBtns[i], markBtns[i].getAttribute('data-id'));
      }
    },

    renderHistoryItem: function(item) {
      var timeStr = new Date(item.createdAt).toLocaleTimeString('ar-DZ', {
        hour: '2-digit', minute: '2-digit'
      });
      var unreadClass = item.read ? '' : ' notif-history-item-unread';

      return '<div class="notif-history-item' + unreadClass + '" data-notif-id="' + item.id + '">' +
        '<div class="notif-history-item-icon">' + (item.icon || 'ℹ️') + '</div>' +
        '<div class="notif-history-item-body">' +
          '<div class="notif-history-item-title">' +
            this.escapeHtml(item.title) +
            (item.isUrgent ? '<span class="notif-urgent-badge">عاجل</span>' : '') +
          '</div>' +
          '<div class="notif-history-item-message">' + this.escapeHtml(item.message) + '</div>' +
          '<div class="notif-history-item-meta">' +
            '<span class="notif-history-item-time">' + timeStr + '</span>' +
            (item.link ? '<a href="' + item.link + '" class="notif-history-item-link">عرض التفاصيل →</a>' : '') +
          '</div>' +
        '</div>' +
        '<div class="notif-history-item-actions">' +
          (!item.read ? '<button type="button" class="notif-history-mark-read" data-id="' + item.id + '" title="تحديد كمقروء">✓</button>' : '') +
        '</div>' +
      '</div>';
    },

    /* ============================================================
     * TRIGGER FUNCTIONS — Called from admin.js, etc.
     * ============================================================ */

    /* Volunteer approved */
    triggerVolunteerApproved: function(volunteer) {
      return this.create('volunteer_approved', {
        title: '✅ تم قبول طلب التطوع',
        message: 'مرحباً بك! تمت الموافقة على طلب انضمامك كمتطوع في برنامج Dz Young Leaders. معرفك التطوعي: ' + (volunteer.volunteerId || ''),
        recipientId: volunteer.volunteerId || 'all',
        recipientRole: 'volunteer',
        link: 'portal.html',
        metadata: {
          volunteerId: volunteer.volunteerId || '',
          volunteerName: volunteer.fullName || '',
          email: volunteer.email || ''
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* Volunteer rejected */
    triggerVolunteerRejected: function(volunteer) {
      return this.create('volunteer_rejected', {
        title: '❌ طلب التطوع',
        message: 'نأسف، لم تتم الموافقة على طلب انضمامك كمتطوع في هذا الوقت. يمكنك التقديم مرة أخرى لاحقاً.',
        recipientId: volunteer.volunteerId || 'all',
        recipientRole: 'volunteer',
        link: 'portal.html',
        metadata: {
          volunteerId: volunteer.volunteerId || '',
          volunteerName: volunteer.fullName || ''
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* Certificate issued */
    triggerCertificateIssued: function(certificate) {
      return this.create('certificate_issued', {
        title: '📜 تم إصدار شهادة جديدة',
        message: 'تم إصدار شهادة "' + certificate.title + '" لك. رقم الشهادة: ' + (certificate.certificateNumber || ''),
        recipientId: certificate.volunteerId || 'all',
        recipientRole: 'volunteer',
        link: 'portal.html',
        metadata: {
          certificateNumber: certificate.certificateNumber || '',
          certificateTitle: certificate.title || '',
          volunteerId: certificate.volunteerId || '',
          volunteerName: certificate.volunteerName || ''
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* Consultation updated */
    triggerConsultationUpdated: function(consultation, newStatus) {
      var statusLabels = {
        pending: 'جديدة',
        in_progress: 'قيد المعالجة',
        answered: 'تم الرد',
        closed: 'مغلقة'
      };
      return this.create('consultation_updated', {
        title: '💬 تحديث حالة الاستشارة',
        message: 'تم تحديث حالة استشارتك (' + consultation.subject + ') إلى: ' + (statusLabels[newStatus] || newStatus),
        recipientId: 'all',
        recipientRole: 'volunteer',
        link: 'portal.html',
        metadata: {
          trackingCode: consultation.trackingCode || '',
          status: newStatus,
          subject: consultation.subject || ''
        },
        senderName: 'المستشار النفسي'
      });
    },

    /* Announcement from admin */
    triggerAnnouncement: function(announcement) {
      return this.create('announcement', {
        title: '📢 ' + announcement.title,
        message: announcement.message || '',
        recipientId: announcement.targetVolunteer || 'all',
        recipientRole: announcement.targetRole || null,
        isUrgent: announcement.isUrgent || false,
        link: 'portal.html',
        metadata: {
          type: announcement.type || 'info'
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* Role changed */
    triggerRoleChanged: function(userEmail, oldRole, newRole) {
      return this.create('role_changed', {
        title: '🔐 تم تغيير صلاحياتك',
        message: 'تم تغيير صلاحياتك من "' + oldRole + '" إلى "' + newRole + '".',
        recipientId: userEmail || 'all',
        recipientRole: newRole,
        link: 'sidou-da.html',
        metadata: {
          oldRole: oldRole,
          newRole: newRole,
          email: userEmail
        },
        senderName: 'إدارة المنصة',
        isUrgent: true
      });
    },

    /* New task */
    triggerNewTask: function(task, assignedToName) {
      return this.create('new_task', {
        title: '📋 مهمة جديدة: ' + task.name,
        message: task.description || 'تم تعيين مهمة جديدة لك.',
        recipientId: task.assignedTo || 'all',
        recipientRole: task.assignedTo === 'all' ? 'volunteer' : null,
        link: 'portal.html',
        metadata: {
          taskName: task.name,
          priority: task.priority || 'medium',
          deadline: task.deadline || ''
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* Achievement awarded */
    triggerAchievementAwarded: function(achievement, volunteerId) {
      return this.create('achievement_awarded', {
        title: '🏆 إنجاز جديد: ' + achievement.title,
        message: achievement.description || 'تم منحك إنجازاً جديداً!',
        recipientId: volunteerId || achievement.assignedTo || 'all',
        recipientRole: 'volunteer',
        link: 'portal.html',
        metadata: {
          achievementTitle: achievement.title,
          icon: achievement.icon || '🏆'
        },
        senderName: 'إدارة المنصة'
      });
    },

    /* ============================================================
     * UTILITIES
     * ============================================================ */

    getTimeAgo: function(dateStr) {
      if (!dateStr) return '';
      var now = new Date();
      var date = new Date(dateStr);
      var diffMs = now - date;
      var diffSec = Math.floor(diffMs / 1000);
      var diffMin = Math.floor(diffSec / 60);
      var diffHour = Math.floor(diffMin / 60);
      var diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'الآن';
      if (diffMin < 60) return 'منذ ' + diffMin + ' دقيقة';
      if (diffHour < 24) return 'منذ ' + diffHour + ' ساعة';
      if (diffDay < 7) return 'منذ ' + diffDay + ' يوم';
      return date.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
    },

    escapeHtml: function(t) {
      if (!t) return '';
      var d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }
  };

  /* ============================================================
   * EXPOSE PUBLIC API
   * ============================================================ */
  window.BBA = window.BBA || {};
  window.BBA.Notifications = Notifications;

  /* Convenience global for trigger functions */
  window.Notif = {
    create: function(type, data) { return Notifications.create(type, data); },
    volunteerApproved: function(v) { return Notifications.triggerVolunteerApproved(v); },
    volunteerRejected: function(v) { return Notifications.triggerVolunteerRejected(v); },
    certificateIssued: function(c) { return Notifications.triggerCertificateIssued(c); },
    consultationUpdated: function(c, s) { return Notifications.triggerConsultationUpdated(c, s); },
    announcement: function(a) { return Notifications.triggerAnnouncement(a); },
    roleChanged: function(e, o, n) { return Notifications.triggerRoleChanged(e, o, n); },
    newTask: function(t, n) { return Notifications.triggerNewTask(t, n); },
    achievementAwarded: function(a, v) { return Notifications.triggerAchievementAwarded(a, v); }
  };

  /* ============================================================
   * AUTO-INIT
   * ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      /* Delay init to allow BBA.Auth and DB to be ready */
      setTimeout(function() { Notifications.init(); }, 1500);
    });
  } else {
    setTimeout(function() { Notifications.init(); }, 1500);
  }

  console.log('✅ [BBA Notifications] Module loaded');
})();
