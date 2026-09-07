/* =====================================================================
   HCF Admin Dashboard — logic
   Auth • data load • charts • table • filters • approve/reject • exports
   ===================================================================== */
(function () {
  'use strict';

  const CFG = window.HCF_CONFIG || {};
  // Admin login (client-side gate). For real security keep the ADMIN_TOKEN
  // secret in Code.gs — that token authorises the approve/reject writes.
  const ADMIN = {
    user: 'admin',
    pass: 'hcf@2026',
    token: 'HCF-CHANGE-ME-2026' // must match CONFIG.ADMIN_TOKEN in Code.gs
  };
  const SESSION_KEY = 'hcf_admin_session';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const CHAPTERS = CFG.CHAPTERS || ['Agra', 'Ghaziabad', 'Future', 'Chandigarh', 'Noida', 'Delhi'];
  const inr = n => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  let ALL = [];       // all activities
  let VIEW = [];      // filtered
  const charts = {};

  /* ---------------- Toast ---------------- */
  function toast(title, msg, type = 'info', t = 4000) {
    const host = $('#toastHost'); if (!host) return;
    const ic = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `hcf-toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${ic[type]} t-ic"></i><div class="t-body">
      <div class="t-title">${esc(title)}</div>${msg ? `<div class="t-msg">${esc(msg)}</div>` : ''}</div>
      <button class="t-close"><i class="fa-solid fa-xmark"></i></button>`;
    host.appendChild(el);
    const rm = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); };
    el.querySelector('.t-close').onclick = rm;
    if (t) setTimeout(rm, t);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ---------------- Init ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS) AOS.init({ duration: 600, once: true, offset: 40 });
    initLogin();
    if (sessionStorage.getItem(SESSION_KEY) === '1') enterApp();
  });

  /* ---------------- Login ---------------- */
  function initLogin() {
    $('#togglePass').onclick = () => {
      const p = $('#loginPass');
      p.type = p.type === 'password' ? 'text' : 'password';
      $('#togglePass').innerHTML = `<i class="fa-solid ${p.type === 'password' ? 'fa-eye' : 'fa-eye-slash'}"></i>`;
    };
    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const u = $('#loginUser').value.trim(), p = $('#loginPass').value;
      if (u === ADMIN.user && p === ADMIN.pass) {
        sessionStorage.setItem(SESSION_KEY, '1');
        enterApp();
      } else {
        $('#loginError').classList.add('show');
        setTimeout(() => $('#loginError').classList.remove('show'), 2500);
      }
    });
  }

  function enterApp() {
    $('#loginScreen').classList.add('d-none');
    $('#appShell').classList.remove('d-none');
    initNav();
    initToolbar();
    initModal();
    initExports();
    initVolunteers();
    initEditRequests();
    loadData();
    loadVolunteers();     // populate pending badge
    loadEditRequests();   // populate edit-request badge
  }

  /* ---------------- Navigation ---------------- */
  const TITLES = {
    overview: ['Overview', 'Live snapshot of foundation activity'],
    activities: ['Activities', 'Review, approve and manage submissions'],
    volunteers: ['Volunteers', 'Approve sign-ups and assign Chapter Heads'],
    editrequests: ['Edit Requests', 'Unlock entries for volunteers to correct'],
    analytics: ['Analytics', 'Charts and chapter-wise insights'],
    reports: ['Reports', 'Export data and generate reports']
  };
  function initNav() {
    $$('.side-link[data-view]').forEach(l => l.onclick = () => switchView(l.dataset.view));
    $$('[data-jump]').forEach(b => b.onclick = () => switchView(b.dataset.jump));
    $('#hamburger').onclick = () => $('#sidebar').classList.toggle('open');
    $('#logoutBtn').onclick = () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); };
    $('#refreshBtn').onclick = () => { loadData(); toast('Refreshing', 'Fetching latest activity data.', 'info', 1800); };
  }
  function switchView(v) {
    $$('.side-link[data-view]').forEach(l => l.classList.toggle('active', l.dataset.view === v));
    $$('.view').forEach(s => s.classList.toggle('is-active', s.dataset.view === v));
    const t = TITLES[v] || ['', ''];
    $('#viewTitle').textContent = t[0];
    $('#viewSub').textContent = t[1];
    $('#sidebar').classList.remove('open');
    if (v === 'analytics') renderAnalytics();
    if (v === 'volunteers') loadVolunteers();
    if (v === 'editrequests') loadEditRequests();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Data ---------------- */
  async function loadData() {
    renderSkeleton();
    try {
      if (CFG.DEMO_MODE) {
        ALL = demoData();
      } else {
        const res = await fetch(CFG.API_URL + '?action=list&_=' + Date.now());
        const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Load failed');
        ALL = data.activities || [];
      }
      applyFilters();
      renderKPIs();
      renderCharts();
      renderRecent();
      renderChapterReport();
    } catch (err) {
      toast('Could not load data', err.message, 'error', 6000);
      ALL = []; applyFilters(); renderKPIs();
    }
  }

  /* ---------------- KPIs ---------------- */
  function computeStats(list) {
    const tz = new Date();
    const today = tz.toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const s = { todayMeals: 0, monthMeals: 0, meals: 0, expenses: 0, volunteers: 0,
                pending: 0, approved: 0, rejected: 0 };
    list.forEach(r => {
      s.meals += r.meals; s.expenses += r.actualExpense; s.volunteers += r.volunteers;
      if ((r.activityDate || '') === today) s.todayMeals += r.meals;
      if (String(r.activityDate || '').slice(0, 7) === month) s.monthMeals += r.meals;
      if (r.status === 'Pending') s.pending++;
      else if (r.status === 'Approved') s.approved++;
      else if (r.status === 'Rejected') s.rejected++;
    });
    return s;
  }
  function renderKPIs() {
    const s = computeStats(ALL);
    $$('[data-kpi]').forEach(el => {
      const key = el.dataset.kpi;
      const money = el.dataset.money === '1';
      countUp(el, s[key] || 0, money);
    });
  }
  function countUp(el, target, money) {
    const dur = 900, start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = money ? inr(v) : v.toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------------- Charts ---------------- */
  function chapterAgg(list) {
    const meals = {}, exp = {}, count = {}, vols = {};
    CHAPTERS.forEach(c => { meals[c] = 0; exp[c] = 0; count[c] = 0; vols[c] = 0; });
    list.forEach(r => {
      const c = CHAPTERS.indexOf(r.chapter) > -1 ? r.chapter : (r.chapter || 'Other');
      if (meals[c] == null) { meals[c] = 0; exp[c] = 0; count[c] = 0; vols[c] = 0; }
      meals[c] += r.meals; exp[c] += r.actualExpense; count[c] += 1; vols[c] += r.volunteers;
    });
    return { meals, exp, count, vols, labels: Object.keys(meals) };
  }
  const PALETTE = ['#0B3D2E', '#D4AF37', '#2f7a5f', '#e0951f', '#1f9d63', '#8a6d1f', '#58b88f'];

  function renderCharts() {
    if (!window.Chart) return;
    const agg = chapterAgg(ALL);
    const s = computeStats(ALL);
    Chart.defaults.font.family = 'Poppins, sans-serif';
    Chart.defaults.color = '#5b6b63';

    drawBar('barChart', agg.labels, agg.labels.map(l => agg.meals[l]));
    drawPie('pieChart', ['Pending', 'Approved', 'Rejected'],
      [s.pending, s.approved, s.rejected], ['#e0951f', '#1f9d63', '#d7433b']);
  }
  function renderAnalytics() {
    if (!window.Chart) return;
    const agg = chapterAgg(ALL);
    drawBar('barChart2', agg.labels, agg.labels.map(l => agg.meals[l]));
    drawPie('pieChart2', agg.labels, agg.labels.map(l => agg.exp[l]), PALETTE);
  }
  function drawBar(id, labels, data) {
    const el = document.getElementById(id); if (!el) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Meals', data, backgroundColor: '#0B3D2E',
        borderRadius: 8, maxBarThickness: 46 }] },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#eef2f0' } }, x: { grid: { display: false } } },
        animation: { duration: 900, easing: 'easeOutQuart' } }
    });
  }
  function drawPie(id, labels, data, colors) {
    const el = document.getElementById(id); if (!el) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true } } },
        animation: { animateRotate: true, duration: 900 } }
    });
  }

  /* ---------------- Recent ---------------- */
  function renderRecent() {
    const host = $('#recentList');
    const rows = ALL.slice(0, 6);
    if (!rows.length) { host.innerHTML = '<p class="text-muted" style="padding:14px">No activity yet.</p>'; return; }
    host.innerHTML = rows.map(r => `
      <div class="recent-item">
        <div class="recent-av">${esc((r.volunteer || '?').charAt(0).toUpperCase())}</div>
        <div class="ri-main">
          <strong>${esc(r.volunteer)} · ${esc(r.activity)}</strong>
          <small><span class="chip-chapter">${esc(r.chapter)}</span> &nbsp;${esc(r.activityDate)}</small>
        </div>
        <div class="ri-meta">
          <div><i class="fa-solid fa-bowl-food"></i> ${r.meals}</div>
          <span class="badge-status ${esc(r.status)}">${esc(r.status)}</span>
        </div>
      </div>`).join('');
  }

  /* ---------------- Chapter report ---------------- */
  function renderChapterReport() {
    const agg = chapterAgg(ALL);
    $('#chapterReport').innerHTML = agg.labels.map(c => `
      <tr><td><span class="chip-chapter">${esc(c)}</span></td>
        <td class="text-end">${agg.count[c]}</td>
        <td class="text-end">${agg.meals[c].toLocaleString('en-IN')}</td>
        <td class="text-end">${agg.vols[c]}</td>
        <td class="text-end">${inr(agg.exp[c])}</td></tr>`).join('');
  }

  /* ---------------- Toolbar + Table ---------------- */
  function initToolbar() {
    let deb;
    $('#searchInput').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(applyFilters, 200); });
    $('#filterChapter').addEventListener('change', applyFilters);
    $('#filterStatus').addEventListener('change', applyFilters);
    $('#exportCsv').onclick = exportCSV;
    $('#exportPdf').onclick = exportPDF;
  }
  function applyFilters() {
    const q = ($('#searchInput') && $('#searchInput').value || '').toLowerCase().trim();
    const ch = ($('#filterChapter') && $('#filterChapter').value) || '';
    const st = ($('#filterStatus') && $('#filterStatus').value) || '';
    VIEW = ALL.filter(r => {
      if (ch && r.chapter !== ch) return false;
      if (st && r.status !== st) return false;
      if (q && !(`${r.volunteer} ${r.activity} ${r.chapter} ${r.activityId} ${r.phone}`.toLowerCase().includes(q))) return false;
      return true;
    });
    renderTable();
  }
  function renderTable() {
    const body = $('#tableBody');
    $('#emptyState').classList.toggle('d-none', VIEW.length > 0);
    body.innerHTML = VIEW.map((r, i) => `
      <tr data-i="${i}">
        <td><small>${esc(r.activityDate)}</small><br><small style="color:var(--muted)">${esc(r.activityTime || '')}</small></td>
        <td class="vol-cell"><strong>${esc(r.volunteer)}</strong><small>${esc(r.phone)}</small></td>
        <td><span class="chip-chapter">${esc(r.chapter)}</span></td>
        <td>${esc(r.activity)}</td>
        <td class="text-end">${r.meals}</td>
        <td class="text-end">${inr(r.actualExpense)}</td>
        <td><span class="badge-status ${esc(r.status)}">${esc(r.status)}</span></td>
        <td class="text-center"><span class="file-links">
          <a class="${r.billsLink ? '' : 'dim'}" href="${esc(r.billsLink || '#')}" target="_blank" title="Bills"><i class="fa-solid fa-file-invoice"></i></a>
          <a class="${r.photosLink ? '' : 'dim'}" href="${esc(r.photosLink || '#')}" target="_blank" title="Photos"><i class="fa-solid fa-images"></i></a>
        </span></td>
        <td class="text-center"><span class="row-actions">
          <button class="act-btn view" data-act="view" title="View"><i class="fa-solid fa-eye"></i></button>
          <button class="act-btn ok" data-act="approve" title="Approve"><i class="fa-solid fa-check"></i></button>
          <button class="act-btn no" data-act="reject" title="Reject"><i class="fa-solid fa-xmark"></i></button>
        </span></td>
      </tr>`).join('');
    $$('#tableBody tr').forEach(tr => {
      const rec = VIEW[+tr.dataset.i];
      tr.querySelectorAll('[data-act]').forEach(b => b.onclick = e => {
        e.stopPropagation();
        const act = b.dataset.act;
        if (act === 'view') openDetail(rec);
        else updateStatus(rec, act === 'approve' ? 'Approved' : 'Rejected');
      });
    });
  }
  function renderSkeleton() {
    const body = $('#tableBody');
    body.innerHTML = Array.from({ length: 5 }).map(() => `
      <tr>${Array.from({ length: 9 }).map(() =>
        '<td><div class="skeleton" style="height:16px"></div></td>').join('')}</tr>`).join('');
  }

  /* ---------------- Status update ---------------- */
  async function updateStatus(rec, status) {
    const prev = rec.status;
    rec.status = status; // optimistic
    applyFilters(); renderKPIs(); renderCharts(); renderRecent();
    try {
      if (CFG.DEMO_MODE) {
        persistDemoStatus(rec.activityId, status);
      } else {
        const url = `${CFG.API_URL}?action=setStatus&rowIndex=${encodeURIComponent(rec.rowIndex)}` +
          `&status=${encodeURIComponent(status)}&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Update failed');
      }
      toast(status, `${rec.volunteer}'s report marked ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
    } catch (err) {
      rec.status = prev; applyFilters(); renderKPIs();
      toast('Update failed', err.message, 'error', 6000);
    }
  }

  /* ---------------- Detail modal ---------------- */
  function initModal() {
    $('#modalClose').onclick = closeModal;
    $('#detailModal').onclick = e => { if (e.target === $('#detailModal')) closeModal(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }
  function openDetail(r) {
    const needs = [];
    if (r.needFunds === 'Yes') needs.push('Funds');
    if (r.needVolunteers === 'Yes') needs.push('Volunteers');
    if (r.needFood === 'Yes') needs.push('Food Material');
    if (r.needTransport === 'Yes') needs.push('Transportation');
    if (r.needSponsors === 'Yes') needs.push('Sponsors');

    $('#detailBody').innerHTML = `
      <div class="detail-head">
        <span class="brand-logo"><i class="fa-solid fa-hands-holding-heart"></i></span>
        <div><h3>${esc(r.activity)}</h3><small>${esc(r.activityId)} · ${esc(r.chapter)}</small></div>
        <span class="badge-status ${esc(r.status)}" style="margin-left:auto">${esc(r.status)}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-cell"><small>Volunteer</small><strong>${esc(r.volunteer)}</strong></div>
        <div class="detail-cell"><small>Phone / Email</small><strong>${esc(r.phone)}<br>${esc(r.email)}</strong></div>
        <div class="detail-cell"><small>Date &amp; Time</small><strong>${esc(r.activityDate)} ${esc(r.activityTime || '')}</strong></div>
        <div class="detail-cell"><small>Meals / Volunteers</small><strong>${r.meals} meals · ${r.volunteers} volunteers</strong></div>
        <div class="detail-cell"><small>Amount Requested</small><strong>${inr(r.amountRequested)}</strong></div>
        <div class="detail-cell"><small>Actual Expense</small><strong>${inr(r.actualExpense)}</strong></div>
        ${r.expenseBreakdown ? `<div class="detail-cell detail-full"><small>Expense Breakdown</small><strong>${esc(r.expenseBreakdown)}</strong></div>` : ''}
        ${r.location ? `<div class="detail-cell detail-full"><small>Location</small><strong><a href="${esc(r.location)}" target="_blank">${esc(r.location)}</a></strong></div>` : ''}
        ${r.description ? `<div class="detail-cell detail-full"><small>Description</small><strong style="font-weight:500">${esc(r.description)}</strong></div>` : ''}
        ${r.remarks ? `<div class="detail-cell detail-full"><small>Remarks</small><strong style="font-weight:500">${esc(r.remarks)}</strong></div>` : ''}
        <div class="detail-cell detail-full"><small>Requirements</small>
          <div class="need-tags">${needs.length ? needs.map(n => `<span class="need-tag">${esc(n)}</span>`).join('') : '<span style="color:var(--muted)">None</span>'}</div>
        </div>
      </div>
      <div class="detail-actions">
        <a class="btn btn-open ${r.billsLink ? '' : 'disabled'}" href="${esc(r.billsLink || '#')}" target="_blank"><i class="fa-solid fa-file-invoice me-2"></i>Bills (${r.billsCount || 0})</a>
        <a class="btn btn-open ${r.photosLink ? '' : 'disabled'}" href="${esc(r.photosLink || '#')}" target="_blank"><i class="fa-solid fa-images me-2"></i>Photos (${r.photosCount || 0})</a>
      </div>
      <div class="detail-actions">
        <button class="btn btn-approve" data-m="approve"><i class="fa-solid fa-check me-2"></i>Approve</button>
        <button class="btn btn-reject" data-m="reject"><i class="fa-solid fa-xmark me-2"></i>Reject</button>
      </div>`;
    $('#detailBody').querySelector('[data-m="approve"]').onclick = () => { updateStatus(r, 'Approved'); closeModal(); };
    $('#detailBody').querySelector('[data-m="reject"]').onclick = () => { updateStatus(r, 'Rejected'); closeModal(); };
    const modal = $('#detailModal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    if (window.gsap) gsap.fromTo('.detail-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out' });
  }
  function closeModal() {
    const m = $('#detailModal');
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  }

  /* ---------------- Exports ---------------- */
  function initExports() {
    $('#repCsv').onclick = exportCSV;
    $('#repPdf').onclick = exportPDF;
    $('#repChapterPdf').onclick = exportChapterPDF;
  }
  function exportCSV() {
    const src = (VIEW.length ? VIEW : ALL);
    if (!src.length) return toast('Nothing to export', 'No activities available.', 'error');
    const cols = ['activityId','timestamp','volunteer','phone','email','chapter','activityDate','activityTime',
      'activity','meals','volunteers','amountRequested','actualExpense','expenseBreakdown','location',
      'needFunds','needVolunteers','needFood','needTransport','needSponsors','remarks','status'];
    const head = cols.join(',');
    const body = src.map(r => cols.map(c => csvCell(r[c])).join(',')).join('\n');
    download('HCF-activities-' + stamp() + '.csv', '﻿' + head + '\n' + body, 'text/csv');
    toast('Exported', `${src.length} rows saved as CSV.`, 'success');
  }
  function csvCell(v) { const s = String(v == null ? '' : v).replace(/"/g, '""'); return `"${s}"`; }

  function exportPDF() {
    const src = (VIEW.length ? VIEW : ALL);
    if (!src.length) return toast('Nothing to export', 'No activities available.', 'error');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    pdfHeader(doc, 'Activity Report');
    const s = computeStats(src);
    doc.setFontSize(10); doc.setTextColor(90);
    doc.text(`Total Meals: ${s.meals}   |   Total Expense: ${inr(s.expenses)}   |   Activities: ${src.length}   |   Pending: ${s.pending}   Approved: ${s.approved}`, 14, 34);
    doc.autoTable({
      startY: 40,
      head: [['Date', 'Volunteer', 'Chapter', 'Activity', 'Meals', 'Expense', 'Status']],
      body: src.map(r => [r.activityDate, r.volunteer, r.chapter, r.activity, r.meals, inr(r.actualExpense), r.status]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [11, 61, 46], textColor: 255 },
      alternateRowStyles: { fillColor: [247, 248, 249] }
    });
    doc.save('HCF-activity-report-' + stamp() + '.pdf');
    toast('PDF generated', `${src.length} activities included.`, 'success');
  }
  function exportChapterPDF() {
    if (!ALL.length) return toast('Nothing to export', 'No activities available.', 'error');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    pdfHeader(doc, 'Chapter-wise Report');
    const agg = chapterAgg(ALL);
    doc.autoTable({
      startY: 40,
      head: [['Chapter', 'Activities', 'Meals', 'Volunteers', 'Expense']],
      body: agg.labels.map(c => [c, agg.count[c], agg.meals[c], agg.vols[c], inr(agg.exp[c])]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [11, 61, 46], textColor: 255 },
      foot: [['Total',
        agg.labels.reduce((a, c) => a + agg.count[c], 0),
        agg.labels.reduce((a, c) => a + agg.meals[c], 0),
        agg.labels.reduce((a, c) => a + agg.vols[c], 0),
        inr(agg.labels.reduce((a, c) => a + agg.exp[c], 0))]],
      footStyles: { fillColor: [212, 175, 55], textColor: [28, 20, 3], fontStyle: 'bold' }
    });
    doc.save('HCF-chapter-report-' + stamp() + '.pdf');
    toast('PDF generated', 'Chapter report ready.', 'success');
  }
  function pdfHeader(doc, title) {
    doc.setFillColor(11, 61, 46); doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, 'F');
    doc.setTextColor(255); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('Hope Commoners Foundation', 14, 12);
    doc.setFontSize(10); doc.setTextColor(212, 175, 55);
    doc.text(title + '  •  ' + new Date().toLocaleDateString('en-IN'), 14, 19);
    doc.setTextColor(0);
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }

  /* ---------------- Volunteers (signup approval) ---------------- */
  let VOLS = [];
  function initVolunteers() {
    let deb;
    $('#volSearch').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(renderVolunteers, 200); });
    $('#volFilterStatus').addEventListener('change', renderVolunteers);
    $('#volFilterChapter').addEventListener('change', renderVolunteers);
    $('#volRefresh').onclick = () => { loadVolunteers(); toast('Refreshing', 'Fetching volunteers.', 'info', 1500); };
  }
  async function loadVolunteers() {
    try {
      if (CFG.DEMO_MODE) {
        VOLS = demoVolunteers();
      } else {
        const res = await fetch(`${CFG.API_URL}?action=listVolunteers&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`);
        const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Load failed');
        VOLS = data.volunteers || [];
      }
      renderVolunteers();
      updateVolBadge();
    } catch (err) { toast('Could not load volunteers', err.message, 'error', 5000); }
  }
  function updateVolBadge() {
    const pending = VOLS.filter(v => v.status === 'Pending').length;
    const b = $('#volPendingBadge'); if (b) b.textContent = pending ? String(pending) : '';
  }
  function renderVolunteers() {
    const q = ($('#volSearch') && $('#volSearch').value || '').toLowerCase().trim();
    const st = ($('#volFilterStatus') && $('#volFilterStatus').value) || '';
    const ch = ($('#volFilterChapter') && $('#volFilterChapter').value) || '';
    const rows = VOLS.filter(v => {
      if (st && v.status !== st) return false;
      if (ch && v.chapter !== ch) return false;
      if (q && !(`${v.name} ${v.email} ${v.phone} ${v.chapter}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const body = $('#volBody');
    $('#volEmpty').classList.toggle('d-none', rows.length > 0);
    body.innerHTML = rows.map((v, i) => `
      <tr data-i="${i}">
        <td><small>${esc(v.timestamp || '')}</small></td>
        <td class="vol-cell"><strong>${esc(v.name)}</strong><small>${esc(v.role || 'Volunteer')}</small></td>
        <td>${esc(v.email)}</td>
        <td>${esc(v.phone)}</td>
        <td><span class="chip-chapter">${esc(v.chapter)}</span></td>
        <td><span class="badge-status ${esc(v.status)}">${esc(v.status)}</span></td>
        <td class="text-center"><span class="row-actions">
          <button class="act-btn view" data-act="role" title="${v.role === 'Chapter Head' ? 'Make Volunteer' : 'Make Chapter Head'}"><i class="fa-solid fa-user-tie"></i></button>
          <button class="act-btn ok" data-act="approve" title="Approve"><i class="fa-solid fa-check"></i></button>
          <button class="act-btn no" data-act="reject" title="Reject"><i class="fa-solid fa-xmark"></i></button>
        </span></td>
      </tr>`).join('');
    $$('#volBody tr').forEach(tr => {
      const rec = rows[+tr.dataset.i];
      tr.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
        if (b.dataset.act === 'role') setVolRoleAction(rec, rec.role === 'Chapter Head' ? 'Volunteer' : 'Chapter Head');
        else setVolStatus(rec, b.dataset.act === 'approve' ? 'Approved' : 'Rejected');
      });
    });
  }
  async function setVolRoleAction(rec, role) {
    const prev = rec.role; rec.role = role; renderVolunteers();
    try {
      if (CFG.DEMO_MODE) {
        const list = JSON.parse(localStorage.getItem('hcf_demo_volunteers') || '[]');
        const it = list.find(x => x.email.toLowerCase() === String(rec.email).toLowerCase());
        if (it) { it.role = role; localStorage.setItem('hcf_demo_volunteers', JSON.stringify(list)); }
      } else {
        const url = `${CFG.API_URL}?action=setVolRole&rowIndex=${encodeURIComponent(rec.rowIndex)}` +
          `&role=${encodeURIComponent(role)}&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`;
        const res = await fetch(url); const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Update failed');
      }
      toast('Role updated', `${rec.name} is now ${role}.`, 'success');
    } catch (err) { rec.role = prev; renderVolunteers(); toast('Update failed', err.message, 'error', 5000); }
  }
  async function setVolStatus(rec, status) {
    const prev = rec.status;
    rec.status = status; renderVolunteers(); updateVolBadge();
    try {
      if (CFG.DEMO_MODE) persistDemoVol(rec.email, status);
      else {
        const url = `${CFG.API_URL}?action=setVolStatus&rowIndex=${encodeURIComponent(rec.rowIndex)}` +
          `&status=${encodeURIComponent(status)}&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`;
        const res = await fetch(url); const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Update failed');
      }
      toast(status, `${rec.name} marked ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
    } catch (err) { rec.status = prev; renderVolunteers(); updateVolBadge(); toast('Update failed', err.message, 'error', 5000); }
  }
  function demoVolunteers() {
    try {
      return (JSON.parse(localStorage.getItem('hcf_demo_volunteers') || '[]')).map((v, i) => ({
        rowIndex: i + 2, timestamp: v.timestamp || '', name: v.name, email: v.email, phone: v.phone,
        chapter: v.chapter, status: v.status || 'Pending', role: v.role || 'Volunteer'
      }));
    } catch (e) { return []; }
  }
  function persistDemoVol(email, status) {
    try {
      const list = JSON.parse(localStorage.getItem('hcf_demo_volunteers') || '[]');
      const item = list.find(x => x.email.toLowerCase() === String(email).toLowerCase());
      if (item) { item.status = status; localStorage.setItem('hcf_demo_volunteers', JSON.stringify(list)); }
    } catch (e) {}
  }

  /* ---------------- Edit requests ---------------- */
  let EDITS = [];
  function initEditRequests() {
    let deb;
    $('#edSearch').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(renderEdits, 200); });
    $('#edFilterStatus').addEventListener('change', renderEdits);
    $('#edRefresh').onclick = () => { loadEditRequests(); toast('Refreshing', 'Fetching edit requests.', 'info', 1500); };
  }
  async function loadEditRequests() {
    try {
      if (CFG.DEMO_MODE) { EDITS = []; }
      else {
        const res = await fetch(`${CFG.API_URL}?action=listEditRequests&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`);
        const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'Load failed');
        EDITS = data.requests || [];
      }
      renderEdits(); updateEditBadge();
    } catch (err) { toast('Could not load edit requests', err.message, 'error', 5000); }
  }
  function updateEditBadge() {
    const pending = EDITS.filter(e => e.status === 'Pending').length;
    const b = $('#editPendingBadge'); if (b) b.textContent = pending ? String(pending) : '';
  }
  function renderEdits() {
    const q = ($('#edSearch') && $('#edSearch').value || '').toLowerCase().trim();
    const st = ($('#edFilterStatus') && $('#edFilterStatus').value) || '';
    const rows = EDITS.filter(e => {
      if (st && e.status !== st) return false;
      if (q && !(`${e.activityId} ${e.requestedBy} ${e.chapter} ${e.reason}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const body = $('#edBody');
    $('#edEmpty').classList.toggle('d-none', rows.length > 0);
    body.innerHTML = rows.map((e, i) => {
      const canAct = e.status === 'Pending';
      return `<tr data-i="${i}">
        <td><small>${esc(e.timestamp || '')}</small></td>
        <td><small>${esc(e.activityId)}</small></td>
        <td>${esc(e.requestedBy)}</td>
        <td><span class="chip-chapter">${esc(e.chapter)}</span></td>
        <td><small>${esc(e.reason)}</small></td>
        <td><span class="badge-status ${e.status === 'Completed' ? 'Approved' : esc(e.status)}">${esc(e.status)}</span></td>
        <td class="text-center"><span class="row-actions">
          ${canAct ? `<button class="act-btn ok" data-act="approve" title="Approve (unlock)"><i class="fa-solid fa-lock-open"></i></button>
          <button class="act-btn no" data-act="reject" title="Reject"><i class="fa-solid fa-xmark"></i></button>` : '<small style="color:var(--muted)">—</small>'}
        </span></td>
      </tr>`;
    }).join('');
    $$('#edBody tr').forEach(tr => {
      const rec = rows[+tr.dataset.i];
      tr.querySelectorAll('[data-act]').forEach(b => b.onclick = () =>
        setEditDecision(rec, b.dataset.act === 'approve' ? 'Approved' : 'Rejected'));
    });
  }
  async function setEditDecision(rec, status) {
    const prev = rec.status; rec.status = status; renderEdits(); updateEditBadge();
    try {
      const url = `${CFG.API_URL}?action=setEditStatus&rowIndex=${encodeURIComponent(rec.rowIndex)}` +
        `&status=${encodeURIComponent(status)}&token=${encodeURIComponent(ADMIN.token)}&_=${Date.now()}`;
      const res = await fetch(url); const data = await res.json();
      if (!data || data.status !== 'success') throw new Error(data && data.message || 'Update failed');
      toast(status === 'Approved' ? 'Unlocked' : 'Rejected',
        status === 'Approved' ? `${rec.requestedBy} can now edit ${rec.activityId}.` : `Request for ${rec.activityId} rejected.`,
        status === 'Approved' ? 'success' : 'info');
    } catch (err) { rec.status = prev; renderEdits(); updateEditBadge(); toast('Update failed', err.message, 'error', 5000); }
  }

  /* ---------------- Demo data ---------------- */
  function demoData() {
    // Merge any locally-submitted demo activities from the upload portal
    let submitted = [];
    try {
      submitted = (JSON.parse(localStorage.getItem('hcf_demo_activities') || '[]')).map((r, i) => ({
        rowIndex: 1000 + i, activityId: r.id, timestamp: (r.submittedAt || '').slice(0, 16).replace('T', ' '),
        volunteer: r.fullName, phone: r.phone, email: r.email, chapter: r.chapter,
        activityDate: r.activityDate, activityTime: r.activityTime, activity: r.activityName,
        location: r.location, meals: r.meals || 0, volunteers: r.volunteers || 0,
        amountRequested: r.amountRequested || 0, actualExpense: r.actualExpense || 0,
        expenseBreakdown: (r.expenses || []).map(x => `${x.item}: ₹${x.amount}`).join(' | '),
        description: r.description, needFunds: r.needFunds, needVolunteers: r.needVolunteers,
        needFood: r.needFood, needTransport: r.needTransport, needSponsors: r.needSponsors,
        remarks: r.remarks, billsLink: '', photosLink: '',
        billsCount: r.bills || 0, photosCount: r.photos || 0, status: r.status || 'Pending'
      }));
    } catch (e) {}

    const seed = [];
    const names = ['Aarav Sharma', 'Priya Verma', 'Rohit Gupta', 'Sneha Patel', 'Vikram Singh', 'Neha Joshi', 'Amit Kumar', 'Kavya Rao'];
    const acts = ['Poha', 'Rajma Chawal', 'Veg Biryani', 'Kachori Sabji', 'Khichdi', 'Food Distribution'];
    const statuses = ['Pending', 'Approved', 'Approved', 'Rejected'];
    for (let i = 0; i < 16; i++) {
      const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 40));
      const meals = 60 + Math.floor(Math.random() * 240);
      const exp = 800 + Math.floor(Math.random() * 4000);
      seed.push({
        rowIndex: i + 2, activityId: 'HCF-DEMO-' + (1000 + i),
        timestamp: d.toISOString().slice(0, 16).replace('T', ' '),
        volunteer: names[i % names.length], phone: '98' + (10000000 + Math.floor(Math.random() * 8999999)),
        email: 'volunteer' + i + '@example.com', chapter: CHAPTERS[i % CHAPTERS.length],
        activityDate: d.toISOString().slice(0, 10), activityTime: '10:30',
        activity: acts[i % acts.length], location: 'https://www.google.com/maps?q=27.18,78.02',
        meals, volunteers: 4 + Math.floor(Math.random() * 12),
        amountRequested: exp + 200, actualExpense: exp,
        expenseBreakdown: 'Groceries: ₹' + Math.round(exp * .6) + ' | Gas: ₹' + Math.round(exp * .4),
        description: 'Community food distribution drive.', needFunds: i % 2 ? 'Yes' : 'No',
        needVolunteers: i % 3 ? 'No' : 'Yes', needFood: 'No', needTransport: i % 4 ? 'No' : 'Yes', needSponsors: 'No',
        remarks: '', billsLink: '', photosLink: '', billsCount: 2, photosCount: 5,
        status: statuses[i % statuses.length]
      });
    }
    return submitted.concat(seed);
  }
  function persistDemoStatus(id, status) {
    try {
      const list = JSON.parse(localStorage.getItem('hcf_demo_activities') || '[]');
      const item = list.find(x => x.id === id);
      if (item) { item.status = status; localStorage.setItem('hcf_demo_activities', JSON.stringify(list)); }
    } catch (e) {}
  }

})();
