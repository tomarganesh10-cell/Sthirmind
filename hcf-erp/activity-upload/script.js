/* =====================================================================
   HCF Activity Management System — Activity Upload Portal
   Front-end logic: stepper, validation, expenses, uploads, compression,
   submission to Google Apps Script.
   ===================================================================== */
(function () {
  'use strict';

  const CFG = window.HCF_CONFIG || {};
  const MAX_PHOTOS = CFG.MAX_PHOTOS || 30;
  const MAX_FILE_BYTES = (CFG.MAX_FILE_MB || 10) * 1024 * 1024;
  const IMG_DIM = CFG.IMAGE_MAX_DIMENSION || 1600;
  const IMG_Q = CFG.IMAGE_QUALITY || 0.82;

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  const state = {
    step: 1,
    editId: null, // set when repunching an unlocked entry
    bills: [],   // { id, file, name, type, isImage, dataUrl }
    photos: []   // { id, file, name, dataUrl }
  };
  let uid = 0;
  const nextId = () => `f${Date.now()}_${uid++}`;

  /* ------------------------------------------------------------------ */
  /* Toast notifications                                                 */
  /* ------------------------------------------------------------------ */
  function toast(title, msg, type = 'info', timeout = 4200) {
    const host = $('#toastHost');
    if (!host) return;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `hcf-toast ${type}`;
    el.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} t-ic"></i>
      <div class="t-body">
        <div class="t-title">${escapeHtml(title)}</div>
        ${msg ? `<div class="t-msg">${escapeHtml(msg)}</div>` : ''}
      </div>
      <button class="t-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>`;
    host.appendChild(el);
    const remove = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); };
    el.querySelector('.t-close').addEventListener('click', remove);
    if (timeout) setTimeout(remove, timeout);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS) AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    $('#year').textContent = new Date().getFullYear();

    // Default date = today
    const dateEl = $('#activityDate');
    if (dateEl) { dateEl.value = new Date().toISOString().slice(0, 10); dateEl.max = new Date().toISOString().slice(0, 10); }

    initStepper();
    initFields();
    initExpenses();
    initDropzone('billsDrop', 'billsInput', 'bills');
    initDropzone('photosDrop', 'photosInput', 'photos');
    initNeedsAnimation();
    initSubmit();
    loadLiveStats();
    initEditMode();

    if (CFG.DEMO_MODE) {
      toast('Demo mode', 'API URL not set — submissions are simulated locally. See apps-script/README.md.', 'info', 6000);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Edit / repunch mode  (index.html?edit=<activityId>)                 */
  /* ------------------------------------------------------------------ */
  async function initEditMode() {
    const editId = new URLSearchParams(location.search).get('edit');
    if (!editId || !window.HCFAuth) return;
    let data;
    try {
      const r = await HCFAuth.myActivities('me');
      const chapterR = (r && r.role === 'Chapter Head') ? await HCFAuth.myActivities('chapter') : null;
      const pool = (chapterR && chapterR.activities) ? chapterR.activities : (r && r.activities) || [];
      data = pool.find(a => String(a.activityId) === String(editId));
    } catch (e) { /* ignore */ }
    if (!data) { toast('Not found', 'That entry could not be loaded.', 'error'); return; }
    if (data.editState !== 'Approved') {
      toast('Locked', 'This entry is not unlocked for editing. Request an edit first.', 'error', 6000);
      return;
    }
    state.editId = editId;
    prefillFromActivity(data);
    // Turn the form into "update" mode
    const btn = $('#submitBtn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i>Update Entry';
    const head = document.querySelector('.hero .hero-title');
    toast('Edit mode', 'Correct the details and click “Update Entry”. Files stay as they are.', 'info', 7000);
    // jump to the form
    gotoStep(1);
  }

  function prefillFromActivity(a) {
    const set = (id, v) => { const el = $('#' + id); if (el != null && v != null) el.value = v; };
    set('activityDate', a.activityDate); set('activityTime', a.activityTime);
    set('location', a.location); set('meals', a.meals); set('volunteers', a.volunteers);
    set('amountRequested', a.amountRequested); set('description', a.description); set('remarks', a.remarks);
    // activity name → dropdown or "Other"
    const known = ['Poha', 'Rajma Chawal', 'Veg Biryani', 'Kachori Sabji', 'Khichdi', 'Food Distribution'];
    const sel = $('#activityName');
    if (known.indexOf(a.activity) > -1) { sel.value = a.activity; }
    else { sel.value = 'Other'; $('.activity-other').classList.remove('d-none'); $('#activityOther').value = a.activity || ''; $('#activityOther').required = true; }
    // needs
    const chk = (name, v) => { const el = document.querySelector('[name="' + name + '"]'); if (el) el.checked = (v === 'Yes'); };
    chk('needFunds', a.needFunds); chk('needVolunteers', a.needVolunteers); chk('needFood', a.needFood);
    chk('needTransport', a.needTransport); chk('needSponsors', a.needSponsors);
    // expenses from "item: ₹amount | item2: ₹amount"
    if (a.expenseBreakdown) {
      $('#expenseBody').innerHTML = '';
      String(a.expenseBreakdown).split('|').forEach(part => {
        const m = part.split(':');
        const item = (m[0] || '').trim();
        const amt = (m[1] || '').replace(/[^\d.]/g, '');
        if (item || amt) addExpenseRow(item, amt);
      });
      if (!$('#expenseBody').children.length) addExpenseRow();
      recalcExpenses();
    }
    if ($('#description')) $('#descCount').textContent = ($('#description').value || '').length;
  }

  /* ------------------------------------------------------------------ */
  /* Stepper navigation                                                  */
  /* ------------------------------------------------------------------ */
  function initStepper() {
    $$('.next-step').forEach(b => b.addEventListener('click', () => {
      const target = parseInt(b.dataset.goto, 10);
      if (validateStep(state.step)) gotoStep(target);
      else toast('Missing details', 'Please complete the highlighted fields before continuing.', 'error');
    }));
    $$('.prev-step').forEach(b => b.addEventListener('click', () => gotoStep(parseInt(b.dataset.goto, 10))));
    $$('.step').forEach(s => s.addEventListener('click', () => {
      const target = parseInt(s.dataset.step, 10);
      if (target <= state.step || validateStep(state.step)) gotoStep(target);
    }));
  }

  function gotoStep(n) {
    n = Math.min(5, Math.max(1, n));
    state.step = n;
    $$('.form-step').forEach(p => p.classList.toggle('is-active', p.dataset.panel == n));
    $$('.step').forEach(s => {
      const sn = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    $('#stepperFill').style.width = (n / 5 * 100) + '%';

    const active = $(`.form-step[data-panel="${n}"] .card-block`);
    if (active && window.gsap) {
      gsap.fromTo(active, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
    }
    const shell = $('.form-shell');
    if (shell) window.scrollTo({ top: shell.offsetTop - 80, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ */
  /* Field validation                                                    */
  /* ------------------------------------------------------------------ */
  function initFields() {
    // Live validation on blur/input
    $$('.float-field .form-control, .float-field .form-select').forEach(inp => {
      inp.addEventListener('blur', () => validateField(inp));
      inp.addEventListener('input', () => {
        if (inp.closest('.float-field').classList.contains('invalid')) validateField(inp);
      });
    });

    // Phone: digits only
    const phone = $('#phone');
    phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });

    // Activity "Other" toggle
    const actName = $('#activityName');
    const otherWrap = $('.activity-other');
    actName.addEventListener('change', () => {
      const isOther = actName.value === 'Other';
      otherWrap.classList.toggle('d-none', !isOther);
      $('#activityOther').required = isOther;
    });

    // Description char counter
    const desc = $('#description');
    desc.addEventListener('input', () => { $('#descCount').textContent = desc.value.length; });

    // Geolocation → Google Maps link
    $('#geoBtn').addEventListener('click', () => {
      if (!navigator.geolocation) return toast('Not supported', 'Geolocation is unavailable on this device.', 'error');
      toast('Locating…', 'Fetching your current position.', 'info', 2500);
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          $('#location').value = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          validateField($('#location'));
          toast('Location added', 'Google Maps link generated.', 'success');
        },
        () => toast('Permission denied', 'Could not access your location.', 'error')
      );
    });
  }

  function validateField(inp) {
    const wrap = inp.closest('.float-field');
    if (!wrap) return true;
    let ok = inp.checkValidity();
    // URL field optional but if filled must be valid
    if (inp.id === 'location' && inp.value.trim() === '') ok = true;
    wrap.classList.toggle('invalid', !ok);
    wrap.classList.toggle('valid', ok && inp.value.trim() !== '');
    return ok;
  }

  function validateStep(step) {
    const panel = $(`.form-step[data-panel="${step}"]`);
    if (!panel) return true;
    let ok = true;
    $$('input, select, textarea', panel).forEach(inp => {
      if (inp.type === 'checkbox' || inp.disabled) return;
      if (inp.offsetParent === null && inp.required === false) return; // skip hidden optional
      if (!validateField(inp)) ok = false;
    });
    return ok;
  }

  /* ------------------------------------------------------------------ */
  /* Expense table                                                       */
  /* ------------------------------------------------------------------ */
  function initExpenses() {
    $('#addRow').addEventListener('click', () => addExpenseRow());
    addExpenseRow(); // start with one row
  }

  function addExpenseRow(item = '', amount = '') {
    const body = $('#expenseBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="exp-index"></td>
      <td><input type="text" class="exp-item" placeholder="e.g. Vegetables, Gas, Rice" maxlength="80" value="${escapeHtml(item)}"></td>
      <td><input type="number" class="exp-amount" placeholder="0.00" min="0" step="0.01" value="${escapeHtml(amount)}"></td>
      <td><button type="button" class="exp-del" aria-label="Delete row"><i class="fa-solid fa-trash-can"></i></button></td>`;
    body.appendChild(tr);
    tr.querySelector('.exp-amount').addEventListener('input', recalcExpenses);
    tr.querySelector('.exp-del').addEventListener('click', () => {
      tr.remove(); reindexExpenses(); recalcExpenses();
      if (!$('#expenseBody').children.length) addExpenseRow();
    });
    reindexExpenses();
    if (window.gsap) gsap.fromTo(tr, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .3 });
  }

  function reindexExpenses() {
    $$('#expenseBody tr').forEach((tr, i) => { tr.querySelector('.exp-index').textContent = i + 1; });
  }

  function recalcExpenses() {
    let total = 0;
    $$('#expenseBody .exp-amount').forEach(inp => { total += parseFloat(inp.value) || 0; });
    animateNumber($('#expenseTotal'), total, v => v.toFixed(2));
    $('#actualExpense').value = total.toFixed(2);
  }

  function getExpenseItems() {
    return $$('#expenseBody tr').map(tr => ({
      item: tr.querySelector('.exp-item').value.trim(),
      amount: parseFloat(tr.querySelector('.exp-amount').value) || 0
    })).filter(r => r.item || r.amount);
  }

  /* ------------------------------------------------------------------ */
  /* Dropzones + file handling                                           */
  /* ------------------------------------------------------------------ */
  function initDropzone(dropId, inputId, kind) {
    const drop = document.getElementById(dropId);
    const input = document.getElementById(inputId);
    if (!drop || !input) return;

    const open = () => input.click();
    drop.addEventListener('click', open);
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    input.addEventListener('change', () => { handleFiles(input.files, kind); input.value = ''; });

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); if (ev === 'dragleave' && drop.contains(e.relatedTarget)) return;
      drop.classList.remove('dragover');
    }));
    drop.addEventListener('drop', e => { if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files, kind); });
  }

  async function handleFiles(fileList, kind) {
    const files = Array.from(fileList);
    for (const file of files) {
      if (kind === 'photos') {
        if (!file.type.startsWith('image/')) { toast('Skipped', `${file.name} is not an image.`, 'error'); continue; }
        if (state.photos.length >= MAX_PHOTOS) { toast('Limit reached', `Maximum ${MAX_PHOTOS} photos.`, 'error'); break; }
        const dataUrl = await compressImage(file);
        state.photos.push({ id: nextId(), file, name: file.name, dataUrl });
      } else { // bills
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        if (!isImage && !isPdf) { toast('Skipped', `${file.name}: only images and PDFs allowed.`, 'error'); continue; }
        if (file.size > MAX_FILE_BYTES && isPdf) { toast('Too large', `${file.name} exceeds ${CFG.MAX_FILE_MB} MB.`, 'error'); continue; }
        const dataUrl = isImage ? await compressImage(file) : await readAsDataURL(file);
        state.bills.push({ id: nextId(), file, name: file.name, type: file.type, isImage, dataUrl });
      }
    }
    renderPreviews(kind);
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // Client-side image compression via canvas → JPEG data URL
  function compressImage(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, IMG_DIM / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        try {
          resolve(canvas.toDataURL('image/jpeg', IMG_Q));
        } catch (e) {
          readAsDataURL(file).then(resolve);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); readAsDataURL(file).then(resolve); };
      img.src = url;
    });
  }

  function renderPreviews(kind) {
    if (kind === 'photos') {
      const grid = $('#photosPreview');
      grid.innerHTML = '';
      state.photos.forEach(p => grid.appendChild(previewCard(p, 'photos', true)));
      $('#photoCount').textContent = state.photos.length;
    } else {
      const grid = $('#billsPreview');
      grid.innerHTML = '';
      state.bills.forEach(b => grid.appendChild(previewCard(b, 'bills', b.isImage)));
    }
  }

  function previewCard(f, kind, isImage) {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = isImage
      ? `<img src="${f.dataUrl}" alt="${escapeHtml(f.name)}">`
      : `<div class="file-icon"><i class="fa-solid fa-file-pdf"></i></div><span class="file-name">${escapeHtml(f.name)}</span>`;
    const rm = document.createElement('button');
    rm.className = 'rm'; rm.type = 'button'; rm.setAttribute('aria-label', 'Remove');
    rm.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    rm.addEventListener('click', () => {
      if (kind === 'photos') state.photos = state.photos.filter(x => x.id !== f.id);
      else state.bills = state.bills.filter(x => x.id !== f.id);
      renderPreviews(kind);
    });
    div.appendChild(rm);
    return div;
  }

  /* ------------------------------------------------------------------ */
  /* Needs micro-interaction                                             */
  /* ------------------------------------------------------------------ */
  function initNeedsAnimation() {
    $$('.need-card input').forEach(cb => cb.addEventListener('change', () => {
      const card = cb.closest('.need-card');
      if (cb.checked && window.gsap) gsap.fromTo(card, { scale: .96 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Submit                                                              */
  /* ------------------------------------------------------------------ */
  function initSubmit() {
    $('#activity-form').addEventListener('submit', async e => {
      e.preventDefault();

      // Honeypot: if filled, silently drop (bot)
      if ($('#website').value.trim() !== '') { toast('Submitted', 'Thank you.', 'success'); return; }

      // Validate all steps
      for (let s = 1; s <= 5; s++) {
        if (!validateStep(s)) { gotoStep(s); toast('Incomplete', `Please review Step ${s}.`, 'error'); return; }
      }
      if (!$('#consent').checked) { toast('Confirmation needed', 'Please confirm the declaration.', 'error'); return; }

      const payload = buildPayload();

      // ----- EDIT / REPUNCH MODE -----
      if (state.editId) {
        showOverlay(true); setProgress(20, 'Updating your entry…');
        try {
          payload.activityId = state.editId;
          const r = await HCFAuth.updateActivity(payload);
          if (!r || r.status !== 'success') throw new Error(r && r.message || 'Update failed');
          setProgress(100, 'Updated!');
          toast('Entry updated', 'Your corrections were saved and sent for review.', 'success');
          setTimeout(() => { location.href = 'my-dashboard.html'; }, 800);
        } catch (err) {
          showOverlay(false);
          toast('Update failed', err.message || 'Please try again.', 'error', 7000);
        }
        return;
      }

      showOverlay(true);
      setProgress(8, 'Preparing your report…');

      try {
        if (CFG.DEMO_MODE) {
          await simulateProgress();
          persistDemo(payload);
          onSuccess({ demo: true, sheetUrl: '#', activityId: 'DEMO-' + Date.now() });
          return;
        }

        setProgress(30, 'Uploading files & saving…');
        const res = await fetch(CFG.API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'submitActivity', payload }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' } // avoids CORS preflight on Apps Script
        });
        setProgress(80, 'Finalising…');
        const data = await res.json();
        if (!data || data.status !== 'success') throw new Error(data && data.message ? data.message : 'Submission failed');
        setProgress(100, 'Done!');
        onSuccess(data);
      } catch (err) {
        showOverlay(false);
        toast('Submission failed', err.message || 'Please try again.', 'error', 7000);
      }
    });
  }

  function buildPayload() {
    const val = id => (($('#' + id) || {}).value || '').trim();
    const checked = name => ($(`[name="${name}"]`) && $(`[name="${name}"]`).checked) ? 'Yes' : 'No';
    let activity = val('activityName');
    if (activity === 'Other') activity = val('activityOther') || 'Other';

    return {
      submittedAt: new Date().toISOString(),
      fullName: val('fullName'),
      phone: val('phone'),
      email: val('email'),
      chapter: val('chapter'),
      activityDate: val('activityDate'),
      activityTime: val('activityTime'),
      activityName: activity,
      location: val('location'),
      meals: parseInt(val('meals'), 10) || 0,
      volunteers: parseInt(val('volunteers'), 10) || 0,
      description: val('description'),
      amountRequested: parseFloat(val('amountRequested')) || 0,
      actualExpense: parseFloat(val('actualExpense')) || 0,
      expenses: getExpenseItems(),
      needFunds: checked('needFunds'),
      needVolunteers: checked('needVolunteers'),
      needFood: checked('needFood'),
      needTransport: checked('needTransport'),
      needSponsors: checked('needSponsors'),
      remarks: val('remarks'),
      bills: state.bills.map(b => ({ name: b.name, type: b.type, dataUrl: b.dataUrl })),
      photos: state.photos.map(p => ({ name: p.name, type: 'image/jpeg', dataUrl: p.dataUrl }))
    };
  }

  function onSuccess(data) {
    setProgress(100, 'Report submitted!');
    // Persist a small summary for the success page
    try {
      sessionStorage.setItem('hcf_last_submit', JSON.stringify({
        activityId: data.activityId || '',
        sheetUrl: data.sheetUrl || '',
        meals: (buildPayloadSafe() || {}).meals || '',
        name: (buildPayloadSafe() || {}).fullName || ''
      }));
    } catch (e) { /* ignore */ }
    setTimeout(() => { window.location.href = 'success.html'; }, 700);
  }
  function buildPayloadSafe() { try { return buildPayload(); } catch (e) { return null; } }

  /* ------------------------------------------------------------------ */
  /* Overlay + progress                                                  */
  /* ------------------------------------------------------------------ */
  function showOverlay(show) {
    const ov = $('#submitOverlay');
    ov.classList.toggle('show', show);
    ov.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (!show) setProgress(0, '');
  }
  function setProgress(pct, msg) {
    $('#uploadFill').style.width = pct + '%';
    $('#uploadPct').textContent = Math.round(pct);
    if (msg) $('#overlayMsg').textContent = msg;
  }
  function simulateProgress() {
    return new Promise(res => {
      let p = 10; const t = setInterval(() => { p += 18; setProgress(Math.min(p, 95), 'Saving (demo)…');
        if (p >= 95) { clearInterval(t); res(); } }, 220);
    });
  }
  function persistDemo(payload) {
    try {
      const list = JSON.parse(localStorage.getItem('hcf_demo_activities') || '[]');
      list.unshift(Object.assign({ id: 'DEMO-' + Date.now(), status: 'Pending' }, payload,
        { bills: payload.bills.length, photos: payload.photos.length }));
      localStorage.setItem('hcf_demo_activities', JSON.stringify(list.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Live stats + count up                                               */
  /* ------------------------------------------------------------------ */
  async function loadLiveStats() {
    let stats = { meals: 12840, volunteers: 260, activities: 415, chapters: 6 };
    if (!CFG.DEMO_MODE) {
      try {
        const res = await fetch(CFG.API_URL + '?action=stats&_=' + Date.now());
        const data = await res.json();
        if (data && data.status === 'success' && data.stats) stats = data.stats;
      } catch (e) { /* fall back to defaults */ }
    }
    const map = [stats.meals, stats.volunteers, stats.activities, stats.chapters];
    $$('.stat-num').forEach((el, i) => {
      el.dataset.target = map[i] || 0;
      countUp(el, map[i] || 0);
    });
  }

  function countUp(el, target) {
    const dur = 1400, start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function animateNumber(el, target, fmt) {
    const from = parseFloat((el.textContent || '0').replace(/[^\d.]/g, '')) || 0;
    const dur = 300, start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const v = from + (target - from) * p;
      el.textContent = fmt ? fmt(v) : Math.round(v);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

})();
