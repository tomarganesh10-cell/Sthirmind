/* =====================================================================
   HCF ERP — Volunteer / Chapter-Head personal dashboard
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const inr = n => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let scope = 'me';

  function toast(title, msg, type = 'info', t = 4000) {
    const host = $('#toastHost'); if (!host) return;
    const ic = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = 'hcf-toast ' + type;
    el.innerHTML = `<i class="fa-solid ${ic[type]} t-ic"></i><div class="t-body"><div class="t-title">${esc(title)}</div>${msg ? `<div class="t-msg">${esc(msg)}</div>` : ''}</div><button class="t-close"><i class="fa-solid fa-xmark"></i></button>`;
    host.appendChild(el);
    const rm = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); };
    el.querySelector('.t-close').onclick = rm; if (t) setTimeout(rm, t);
  }

  const u = window.HCFAuth ? HCFAuth.requireLogin() : null;
  if (!u) { /* redirecting */ }

  document.addEventListener('DOMContentLoaded', function () {
    if (!u) return;
    $('#logoutBtn').onclick = () => HCFAuth.logout();
    $('#refreshBtn').onclick = load;
    $('#hello').textContent = 'Hi ' + (u.name || 'there').split(' ')[0] + ' 👋';
    $$('#scopeToggle button').forEach(b => b.onclick = () => {
      scope = b.dataset.scope;
      $$('#scopeToggle button').forEach(x => x.classList.toggle('active', x === b));
      load();
    });
    load();
  });

  async function load() {
    $('#rows').innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--muted)">Loading…</td></tr>';
    try {
      const r = await HCFAuth.myActivities(scope);
      if (!r || r.status !== 'success') throw new Error(r && r.message || 'Load failed');
      // role badge + chapter-head toggle
      $('#roleTxt').textContent = r.role || 'Volunteer';
      if ((r.role || '') === 'Chapter Head') {
        $('#roleBadge').innerHTML = '<i class="fa-solid fa-user-tie"></i> Chapter Head' + (r.chapter ? ' · ' + esc(r.chapter) : '');
        $('#scopeToggle').hidden = false;
      }
      renderKPIs(r.totals || {});
      renderRows(r.activities || []);
    } catch (err) {
      toast('Could not load', err.message, 'error', 6000);
      $('#rows').innerHTML = '';
      $('#empty').hidden = false;
    }
  }

  function renderKPIs(t) {
    $$('[data-k]').forEach(el => {
      const key = el.dataset.k, money = el.dataset.money === '1';
      const val = t[key] || 0;
      el.textContent = money ? inr(val) : Number(val).toLocaleString('en-IN');
    });
  }

  function renderRows(rows) {
    const body = $('#rows');
    $('#empty').hidden = rows.length > 0;
    if (!rows.length) { body.innerHTML = ''; return; }
    body.innerHTML = rows.map(a => {
      let action;
      if (a.editState === 'Approved') {
        action = `<a class="mini-btn edit" href="index.html?edit=${encodeURIComponent(a.activityId)}"><i class="fa-solid fa-pen"></i> Edit now</a>`;
      } else if (a.editState === 'Pending') {
        action = `<span class="mini-btn wait"><i class="fa-solid fa-hourglass-half"></i> Requested</span>`;
      } else {
        action = `<button class="mini-btn req" data-id="${esc(a.activityId)}"><i class="fa-solid fa-pen-to-square"></i> Request edit</button>`;
      }
      const files = `${a.billsCount || 0}📄 ${a.photosCount || 0}📷`;
      return `<tr>
        <td><small>${esc(a.activityDate || '')}</small></td>
        <td>${esc(a.activity || '')}<br><small style="color:var(--muted)">${esc(a.activityId || '')}</small></td>
        <td class="text-end">${a.meals || 0}</td>
        <td class="text-end">${inr(a.actualExpense)}</td>
        <td class="text-center"><small>${files}</small></td>
        <td><span class="badge-status ${esc(a.status)}">${esc(a.status)}</span></td>
        <td class="text-center">${action}</td>
      </tr>`;
    }).join('');
    $$('#rows .mini-btn.req').forEach(b => b.onclick = () => requestEdit(b.dataset.id));
  }

  async function requestEdit(activityId) {
    const reason = prompt('Kya galat hai? / What needs correcting?\n\nAdmin will review this and unlock the entry for you to fix.');
    if (reason == null || !reason.trim()) return;
    try {
      const r = await HCFAuth.requestEdit(activityId, reason.trim());
      if (r && r.status === 'success') { toast('Request sent', r.message, 'success'); load(); }
      else toast('Could not send', (r && r.message) || 'Try again', 'error');
    } catch (e) { toast('Network error', 'Please try again.', 'error'); }
  }
})();
