/* ============================================================
   منصة وعي الشباب BBA - Rate Limit Indicator UI Component
   Displays remaining attempts, cooldown timer, and block status
   for each rate-limited action type.
   Version: 1.0.0
   ============================================================ */

(function initRateLimitIndicator() {
  'use strict';

  /* ============================================================
   * I18N Labels (Arabic)
   * ============================================================ */
  var I18N = {
    remaining: '\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u062A\u0628\u0642\u064A\u0629',
    attempt: '\u0645\u062D\u0627\u0648\u0644\u0629',
    attempts: '\u0645\u062D\u0627\u0648\u0644\u0627\u062A',
    wait: '\u0627\u0646\u062A\u0638\u0631',
    seconds: '\u062B\u0627\u0646\u064A\u0629',
    second: '\u062B\u0627\u0646\u064A\u0629',
    minute: '\u062F\u0642\u064A\u0642\u0629',
    minutes: '\u062F\u0642\u0627\u0626\u0642',
    blocked: '\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647',
    retryAfter: '\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F',
    unlimited: '\u063A\u064A\u0631 \u0645\u062D\u062F\u0648\u062F',
    dailyLimit: '\u0627\u0644\u062D\u062F \u0627\u0644\u064A\u0648\u0645\u064A'
  };

  /* ============================================================
   * STYLES (injected once)
   * ============================================================ */
  var STYLE_ID = 'bba-rli-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var css = [
      '.bba-rlim-indicator {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 0.6rem;',
      '  padding: 0.5rem 0.75rem;',
      '  margin-top: 0.75rem;',
      '  border-radius: 8px;',
      '  font-size: 0.75rem;',
      '  font-weight: 500;',
      '  direction: rtl;',
      '  transition: all 0.3s ease;',
      '  min-height: 28px;',
      '  position: relative;',
      '  overflow: hidden;',
      '}',
      '.bba-rlim-indicator.idle {',
      '  background: rgba(255, 255, 255, 0.03);',
      '  border: 1px solid rgba(255, 255, 255, 0.06);',
      '  color: var(--muted, #94a3b8);',
      '}',
      '.bba-rlim-indicator.ok {',
      '  background: rgba(16, 185, 129, 0.06);',
      '  border: 1px solid rgba(16, 185, 129, 0.15);',
      '  color: #10b981;',
      '}',
      '.bba-rlim-indicator.warn {',
      '  background: rgba(245, 158, 11, 0.08);',
      '  border: 1px solid rgba(245, 158, 11, 0.2);',
      '  color: #f59e0b;',
      '}',
      '.bba-rlim-indicator.danger {',
      '  background: rgba(239, 68, 68, 0.08);',
      '  border: 1px solid rgba(239, 68, 68, 0.2);',
      '  color: #ef4444;',
      '}',
      '.bba-rlim-indicator.blocked {',
      '  background: rgba(239, 68, 68, 0.12);',
      '  border: 1px solid rgba(239, 68, 68, 0.3);',
      '  color: #ef4444;',
      '}',
      '.bba-rlim-indicator.loading {',
      '  opacity: 0.5;',
      '  pointer-events: none;',
      '}',
      '.bba-rlim-icon {',
      '  flex-shrink: 0;',
      '  font-size: 0.85rem;',
      '  width: 20px;',
      '  text-align: center;',
      '}',
      '.bba-rlim-bar-wrap {',
      '  flex: 1;',
      '  min-width: 0;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 0.2rem;',
      '}',
      '.bba-rlim-bar-row {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 0.5rem;',
      '}',
      '.bba-rlim-label {',
      '  font-size: 0.7rem;',
      '  white-space: nowrap;',
      '}',
      '.bba-rlim-count {',
      '  font-size: 0.7rem;',
      '  font-weight: 700;',
      '  font-family: monospace;',
      '  white-space: nowrap;',
      '  direction: ltr;',
      '}',
      '.bba-rlim-track {',
      '  width: 100%;',
      '  height: 3px;',
      '  background: rgba(255, 255, 255, 0.08);',
      '  border-radius: 2px;',
      '  overflow: hidden;',
      '}',
      '.bba-rlim-fill {',
      '  height: 100%;',
      '  border-radius: 2px;',
      '  transition: width 0.4s ease, background 0.4s ease;',
      '}',
      '.bba-rlim-fill.ok { background: #10b981; }',
      '.bba-rlim-fill.warn { background: #f59e0b; }',
      '.bba-rlim-fill.danger { background: #ef4444; }',
      '.bba-rlim-timer {',
      '  font-size: 0.7rem;',
      '  font-weight: 600;',
      '  direction: ltr;',
      '  font-family: monospace;',
      '  white-space: nowrap;',
      '}',
      '.bba-rlim-blocked-msg {',
      '  font-size: 0.7rem;',
      '  line-height: 1.5;',
      '}',
      /* Light theme overrides */
      '[data-theme="light"] .bba-rlim-indicator.idle {',
      '  background: rgba(0, 0, 0, 0.02);',
      '  border-color: rgba(0, 0, 0, 0.08);',
      '}',
      '[data-theme="light"] .bba-rlim-indicator.ok {',
      '  background: rgba(16, 185, 129, 0.08);',
      '}',
      '[data-theme="light"] .bba-rlim-indicator.warn {',
      '  background: rgba(245, 158, 11, 0.1);',
      '}',
      '[data-theme="light"] .bba-rlim-indicator.danger,',
      '[data-theme="light"] .bba-rlim-indicator.blocked {',
      '  background: rgba(239, 68, 68, 0.1);',
      '}',
      '[data-theme="light"] .bba-rlim-track {',
      '  background: rgba(0, 0, 0, 0.1);',
      '}'
    ].join('\n');

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
   * CORE COMPONENT
   * ============================================================ */

  /**
   * Mount a rate limit status indicator into a container element.
   *
   * @param {HTMLElement|string} container  The container element or its ID.
   * @param {string}             actionType One of: login, volunteer_registration,
   *                                        consultation, certificate_verify, portal_login.
   * @param {Object}             [opts]     Optional config.
   * @param {boolean}            [opts.compact]  Show compact layout (icon + count only).
   * @param {boolean}            [opts.noAutoRefresh]  Disable auto-refresh timer.
   * @param {number}             [opts.refreshInterval]  Refresh interval in ms (default 2000).
   * @returns {Object}  { refresh, destroy } control object.
   */
  function mount(container, actionType, opts) {
    opts = opts || {};
    var refreshInterval = opts.refreshInterval || 2000;
    var compact = !!opts.compact;

    /* Resolve container */
    var el;
    if (typeof container === 'string') {
      el = document.getElementById(container);
    } else if (container && container.nodeType === 1) {
      el = container;
    }
    if (!el) {
      console.warn('[BBA RateLimitIndicator] Container not found:', container);
      return { refresh: function() {}, destroy: function() {} };
    }

    injectStyles();

    /* Prevent duplicate mounts — clear existing indicator in this container */
    var existingIndicator = el.querySelector('.bba-rlim-indicator[data-action="' + actionType + '"]');
    if (existingIndicator) {
      /* Already mounted — just return a control object for the existing one */
      return {
        refresh: function() { /* Re-mount won't re-initialize, but destroy is a no-op */ },
        destroy: function() {
          if (existingIndicator.parentNode) {
            existingIndicator.parentNode.removeChild(existingIndicator);
          }
        }
      };
    }

    /* Create indicator DOM */
    var indicator = document.createElement('div');
    indicator.className = 'bba-rlim-indicator idle';
    indicator.setAttribute('data-action', actionType);

    /* Build inner HTML */
    var html = '<span class="bba-rlim-icon" id="bba-rlim-icon-' + actionType + '">\u{1F512}</span>';
    html += '<div class="bba-rlim-bar-wrap" id="bba-rlim-wrap-' + actionType + '">';
    html += '  <div class="bba-rlim-bar-row">';
    html += '    <span class="bba-rlim-label" id="bba-rlim-label-' + actionType + '">' + I18N.remaining + '</span>';
    html += '    <span class="bba-rlim-count" id="bba-rlim-count-' + actionType + '">--</span>';
    html += '  </div>';
    html += '  <div class="bba-rlim-track">';
    html += '    <div class="bba-rlim-fill" id="bba-rlim-fill-' + actionType + '" style="width:0%"></div>';
    html += '  </div>';
    html += '</div>';
    html += '<span class="bba-rlim-timer" id="bba-rlim-timer-' + actionType + '" style="display:none"></span>';
    indicator.innerHTML = html;

    el.appendChild(indicator);

    var iconEl = document.getElementById('bba-rlim-icon-' + actionType);
    var labelEl = document.getElementById('bba-rlim-label-' + actionType);
    var countEl = document.getElementById('bba-rlim-count-' + actionType);
    var fillEl = document.getElementById('bba-rlim-fill-' + actionType);
    var timerEl = document.getElementById('bba-rlim-timer-' + actionType);
    var wrapEl = document.getElementById('bba-rlim-wrap-' + actionType);
    var timerId = null;
    var destroyed = false;

    /* Refresh the display */
    function refresh() {
      if (destroyed) return;
      if (!window.BBA || !window.BBA.RateLimiter) {
        indicator.className = 'bba-rlim-indicator idle';
        if (countEl) countEl.textContent = '--';
        return;
      }

      var info = window.BBA.RateLimiter.getLimitInfo(actionType);
      if (!info) {
        indicator.className = 'bba-rlim-indicator idle';
        if (countEl) countEl.textContent = '--';
        return;
      }

      var status = info.blockStatus;
      var remaining = info.remaining;
      var maxAtt = info.maxAttempts;

      /* Determine state */
      if (status && status.blocked) {
        /* Blocked state */
        indicator.className = 'bba-rlim-indicator blocked';
        if (iconEl) iconEl.textContent = '\u{1F6AB}';
        if (labelEl) labelEl.textContent = I18N.blocked;
        if (countEl) countEl.textContent = status.display || '0 ' + I18N.seconds;
        if (fillEl) {
          fillEl.className = 'bba-rlim-fill danger';
          fillEl.style.width = '100%';
        }
        if (timerEl) {
          timerEl.style.display = '';
          timerEl.textContent = formatCountdown(status.remainingSeconds);
          startTimer();
        }
        return;
      }

      /* Not blocked — show remaining */
      var ratio = maxAtt > 0 ? remaining / maxAtt : 1;
      var level = 'ok';
      var icon = '\u{1F512}';

      if (ratio <= 0.2) {
        level = 'danger';
        icon = '\u{26A0}\uFE0F';
      } else if (ratio <= 0.5) {
        level = 'warn';
        icon = '\u{1F7E1}';
      }

      indicator.className = 'bba-rlim-indicator ' + level;
      if (iconEl) iconEl.textContent = icon;
      if (labelEl) labelEl.textContent = I18N.remaining;
      if (countEl) countEl.textContent = remaining + '/' + maxAtt + ' ' + I18N.attempts;
      if (fillEl) {
        fillEl.className = 'bba-rlim-fill ' + level;
        fillEl.style.width = Math.round(ratio * 100) + '%';
      }
      if (timerEl) timerEl.style.display = 'none';

      stopTimer();
    }

    /* Live countdown timer */
    function startTimer() {
      stopTimer();
      timerId = setInterval(function() {
        if (destroyed) { stopTimer(); return; }
        refresh();
      }, 1000);
    }

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function formatCountdown(seconds) {
      if (!seconds || seconds <= 0) return '0\u0633';
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      if (m > 0) {
        return m + '\u062F ' + s + '\u062B';
      }
      return s + '\u062B';
    }

    /* Auto-refresh interval */
    var autoTimer = null;
    if (!opts.noAutoRefresh) {
      autoTimer = setInterval(function() {
        if (destroyed) { clearInterval(autoTimer); return; }
        refresh();
      }, refreshInterval);
    }

    /* Call refresh immediately */
    refresh();

    /* Destroy handler */
    function destroy() {
      destroyed = true;
      stopTimer();
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }

    return {
      refresh: refresh,
      destroy: destroy
    };
  }

  /* ============================================================
   * AUTO-MOUNT HELPER
   * Adds a small indicator next to any element
   * ============================================================ */

  /**
   * Create and return an indicator on the fly, inserting it after
   * a given reference element.
   *
   * @param {HTMLElement|string} refEl   Element or ID to insert after.
   * @param {string}             actionType
   * @param {Object}             [opts]
   * @returns {Object} { refresh, destroy }
   */
  function insertAfter(refEl, actionType, opts) {
    var el;
    if (typeof refEl === 'string') {
      el = document.getElementById(refEl);
    } else {
      el = refEl;
    }
    if (!el) return { refresh: function() {}, destroy: function() {} };

    var container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:100%';
    if (el.parentNode) {
      el.parentNode.insertBefore(container, el.nextSibling);
    }
    return mount(container, actionType, opts);
  }

  /* ============================================================
   * EXPOSE API
   * ============================================================ */
  var RateLimitIndicator = {
    mount: mount,
    insertAfter: insertAfter
  };

  window.BBA = window.BBA || {};
  window.BBA.RateLimitIndicator = RateLimitIndicator;

  console.log('\u2705 [BBA] Rate Limit Indicator loaded');

})();
