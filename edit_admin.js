import re

with open('js/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change colspan="9" to colspan="10" (first occurrence only)
content = content.replace('colspan="9"', 'colspan="10"', 1)

# 2. Bulk operations code to insert before 'function renderTable()'
bulk_code = """  /* Bulk operations state */
  var selectedIndices = {};
  var bulkToolbar = null;

  function ensureBulkHeader() {
    var headerRow = document.querySelector('#volunteersTable thead tr');
    if (!headerRow) return;
    if (headerRow.querySelector('.bulk-checkbox-header')) return;
    var cbTh = document.createElement('th');
    cbTh.style.width = '40px';
    cbTh.className = 'bulk-checkbox-header';
    cbTh.innerHTML = '<input type="checkbox" id="selectAllVolunteers" title="تحديد الكل">';
    headerRow.insertBefore(cbTh, headerRow.firstChild);
    setTimeout(function() {
      var selAll = byId('selectAllVolunteers');
      if (selAll) {
        selAll.addEventListener('change', function() {
          var checked = this.checked;
          var cbs = tbody.querySelectorAll('.vol-bulk-cb');
          for (var ci = 0; ci < cbs.length; ci++) {
            cbs[ci].checked = checked;
            var idx = parseInt(cbs[ci].getAttribute('data-idx'), 10);
            if (checked) selectedIndices[idx] = true;
            else delete selectedIndices[idx];
          }
          updateBulkToolbar();
        });
      }
    }, 50);
  }

  function ensureBulkToolbar() {
    if (bulkToolbar) return;
    var tableCard = tbody.closest('.admin-card');
    if (!tableCard) return;
    bulkToolbar = document.createElement('div');
    bulkToolbar.id = 'bulkToolbar';
    bulkToolbar.style.cssText = 'display:none;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;margin-bottom:0.75rem;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:var(--radius-sm);flex-wrap:wrap';
    bulkToolbar.innerHTML =
      '<span id="bulkSelectedCount" style="font-size:0.82rem;color:var(--gold);font-weight:600;margin-left:0.5rem">0</span>' +
      '<button class="btn btn-success btn-sm" data-bulk-action="approve" style="font-size:0.75rem;padding:0.35rem 0.65rem">✅ قبول الكل</button>' +
      '<button class="btn btn-danger btn-sm" data-bulk-action="reject" style="font-size:0.75rem;padding:0.35rem 0.65rem">❌ رفض الكل</button>' +
      '<button class="btn btn-secondary btn-sm" data-bulk-action="suspend" style="font-size:0.75rem;padding:0.35rem 0.65rem;border-color:var(--muted);color:var(--muted)">⏸️ تعليق الكل</button>' +
      '<button class="btn btn-secondary btn-sm" data-bulk-action="unsuspend" style="font-size:0.75rem;padding:0.35rem 0.65rem;border-color:var(--success);color:var(--success)">▶️ إلغاء تعليق الكل</button>' +
      '<button class="btn btn-danger btn-sm" data-bulk-action="delete" style="font-size:0.75rem;padding:0.35rem 0.65rem">🗑️ حذف الكل</button>' +
      '<button class="btn btn-sm" data-bulk-action="clear" style="font-size:0.7rem;padding:0.25rem 0.5rem;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font)">✕ إلغاء التحديد</button>';
    tableCard.insertBefore(bulkToolbar, tableCard.querySelector('.table-wrapper') || tableCard.firstChild);
    setTimeout(function() {
      var btns = bulkToolbar.querySelectorAll('[data-bulk-action]');
      for (var bi = 0; bi < btns.length; bi++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var action = this.getAttribute('data-bulk-action');
            if (action === 'clear') { clearBulkSelection(); return; }
            var selected = getSelectedIndices();
            if (selected.length === 0) { showToast('لم يتم تحديد أي متطوع', 'info'); return; }
            if (action === 'delete' && !confirm('هل أنت متأكد من حذف ' + selected.length + ' متطوع؟')) return;
            loadData();
            var affected = 0;
            selected.sort(function(a,b){return b-a});
            for (var si = 0; si < selected.length; si++) {
              var idx = selected[si];
              if (idx < 0 || idx >= allVolunteers.length) continue;
              var v = allVolunteers[idx];
              if (action === 'approve') {
                if (v.status !== 'approved') { v.status = 'approved'; v.suspended = false; if (!v.volunteerId) v.volunteerId = 'VOL-BBA-2026-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'); affected++; }
              } else if (action === 'reject') { if (v.status !== 'rejected') { v.status = 'rejected'; affected++; }
              } else if (action === 'suspend') { if (!v.suspended) { v.suspended = true; affected++; }
              } else if (action === 'unsuspend') { if (v.suspended) { v.suspended = false; affected++; }
              } else if (action === 'delete') { allVolunteers.splice(idx, 1); affected++; }
            }
            localStorage.setItem('bba_volunteers', JSON.stringify(allVolunteers));
            clearBulkSelection();
            renderTable();
            refreshAllStats();
            if (typeof updateCharts === 'function') updateCharts();
            var actionMsgs = {approve:'قبول',reject:'رفض',suspend:'تعليق',unsuspend:'إلغاء تعليق',delete:'حذف'};
            showToast('✅ تم ' + (actionMsgs[action] || action) + ' ' + affected + ' متطوع', 'success');
          });
        })(btns[bi]);
      }
    }, 50);
  }

  function getSelectedIndices() {
    var result = [];
    for (var key in selectedIndices) {
      if (selectedIndices.hasOwnProperty(key) && selectedIndices[key]) {
        result.push(parseInt(key, 10));
      }
    }
    return result;
  }

  function clearBulkSelection() {
    selectedIndices = {};
    var selAll = byId('selectAllVolunteers');
    if (selAll) selAll.checked = false;
    var cbs = tbody.querySelectorAll('.vol-bulk-cb');
    for (var ci = 0; ci < cbs.length; ci++) cbs[ci].checked = false;
    updateBulkToolbar();
  }

  function updateBulkToolbar() {
    var count = getSelectedIndices().length;
    var countEl = byId('bulkSelectedCount');
    if (countEl) countEl.textContent = count + ' مختار';
    if (bulkToolbar) bulkToolbar.style.display = count > 0 ? 'flex' : 'none';
  }

"""

content = content.replace('  function renderTable() {', bulk_code + '  function renderTable() {', 1)

# 3. Add ensureBulkHeader/ensureBulkToolbar at start of renderTable
old_start = """  function renderTable() {
    loadData();
    var filtered = getFilteredData();"""
new_start = """  function renderTable() {
    ensureBulkHeader();
    ensureBulkToolbar();
    loadData();
    var filtered = getFilteredData();"""
content = content.replace(old_start, new_start, 1)

# 4. Add checkbox HTML before tr.innerHTML assignment
old_tr = "      tr.innerHTML = '<td>' + vidDisplay + '</td><td>'"
new_tr = "      var checked = selectedIndices[realIdx] ? ' checked' : '';\n      var cbHtml = '<td style=\"text-align:center\"><input type=\"checkbox\" class=\"vol-bulk-cb\" data-idx=\"' + realIdx + '\"' + checked + '></td>';\n      tr.innerHTML = cbHtml + '<td>' + vidDisplay + '</td><td>'"
content = content.replace(old_tr, new_tr, 1)

# 5. Add checkbox event wiring after attachVolunteerHandlers()
old_attach_end = """    attachVolunteerHandlers();
  }"""
new_attach_end = """    attachVolunteerHandlers();

    /* Wire row-level checkboxes */
    var cbs = tbody.querySelectorAll('.vol-bulk-cb');
    for (var ci = 0; ci < cbs.length; ci++) {
      (function(cb) {
        cb.addEventListener('change', function() {
          var idx = parseInt(this.getAttribute('data-idx'), 10);
          if (this.checked) selectedIndices[idx] = true;
          else delete selectedIndices[idx];
          updateBulkToolbar();
          var selAll = byId('selectAllVolunteers');
          if (selAll && !this.checked) selAll.checked = false;
        });
      })(cbs[ci]);
    }
  }"""
content = content.replace(old_attach_end, new_attach_end, 1)

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('All changes applied successfully!')
print(f'File size: {len(content)} chars')
