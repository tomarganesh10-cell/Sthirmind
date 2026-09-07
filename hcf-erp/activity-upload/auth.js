/* =====================================================================
   HCF ERP — Volunteer Auth (signup / login / session / portal guard)
   Works with the Apps Script backend when API_URL is set, and falls
   back to a local demo (localStorage) when it isn't.
   ===================================================================== */
(function (global) {
  'use strict';
  const CFG = global.HCF_CONFIG || {};
  const SKEY = 'hcf_volunteer';
  const demo = () => !CFG.API_URL;

  async function post(action, payload) {
    if (demo()) return demoHandle(action, payload);
    const res = await fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload })
    });
    return res.json();
  }

  /* -------- demo storage (no backend) -------- */
  function dvols() { try { return JSON.parse(localStorage.getItem('hcf_demo_volunteers') || '[]'); } catch (e) { return []; } }
  function saveDvols(v) { localStorage.setItem('hcf_demo_volunteers', JSON.stringify(v)); }
  function demoHandle(action, p) {
    const vols = dvols();
    if (action === 'signup') {
      if (!p.name || !p.email || !p.phone || !p.chapter || !p.password) return { status: 'error', message: 'All fields are required.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return { status: 'error', message: 'Invalid email.' };
      if (!/^\d{10}$/.test(p.phone)) return { status: 'error', message: 'Phone must be 10 digits.' };
      if (String(p.password).length < 6) return { status: 'error', message: 'Password must be at least 6 characters.' };
      if (vols.find(v => v.email.toLowerCase() === p.email.toLowerCase())) return { status: 'error', message: 'An account with this email already exists.' };
      vols.unshift({ name: p.name, email: p.email.toLowerCase(), phone: p.phone, chapter: p.chapter, password: p.password,
        status: 'Pending', role: 'Volunteer', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') });
      saveDvols(vols);
      return { status: 'success', message: 'Signup received (demo). Pending admin approval.' };
    }
    if (action === 'login') {
      const v = vols.find(x => x.email.toLowerCase() === String(p.email).toLowerCase());
      if (!v) return { status: 'error', message: 'No account found. Please sign up first.' };
      if (v.password !== p.password) return { status: 'error', message: 'Incorrect password.' };
      if (v.status === 'Pending') return { status: 'pending', message: 'Your account is awaiting admin approval.' };
      if (v.status === 'Rejected') return { status: 'rejected', message: 'Your account was not approved.' };
      return { status: 'success', token: 'demo', volunteer: { name: v.name, email: v.email, phone: v.phone, chapter: v.chapter, role: v.role || 'Volunteer' } };
    }
    if (action === 'myActivities') {
      let list = []; try { list = JSON.parse(localStorage.getItem('hcf_demo_activities') || '[]'); } catch (e) {}
      const email = String(p.email || '').toLowerCase();
      const rows = list.filter(a => String(a.email || '').toLowerCase() === email).map(a => ({
        activityId: a.id, activityDate: a.activityDate, activityTime: a.activityTime, activity: a.activityName,
        location: a.location, meals: a.meals || 0, volunteers: a.volunteers || 0,
        amountRequested: a.amountRequested || 0, actualExpense: a.actualExpense || 0,
        expenseBreakdown: (a.expenses || []).map(x => x.item + ': ₹' + x.amount).join(' | '),
        description: a.description, remarks: a.remarks,
        needFunds: a.needFunds, needVolunteers: a.needVolunteers, needFood: a.needFood, needTransport: a.needTransport, needSponsors: a.needSponsors,
        billsCount: a.bills || 0, photosCount: a.photos || 0, status: a.status || 'Pending', editState: a.editState || ''
      }));
      const tot = { activities: rows.length, meals: 0, volunteers: 0, billsValue: 0, billsCount: 0, approved: 0, pending: 0 };
      rows.forEach(a => { tot.meals += a.meals; tot.volunteers += a.volunteers; tot.billsValue += a.actualExpense; tot.billsCount += a.billsCount; if (a.status === 'Approved') tot.approved++; if (a.status === 'Pending') tot.pending++; });
      return { status: 'success', role: 'Volunteer', chapter: '', totals: tot, activities: rows };
    }
    if (action === 'requestEdit' || action === 'updateActivity') {
      try {
        const list = JSON.parse(localStorage.getItem('hcf_demo_activities') || '[]');
        const it = list.find(a => a.id === p.activityId);
        if (it) {
          if (action === 'requestEdit') it.editState = 'Approved'; // demo auto-approves so you can test
          else { Object.assign(it, p); it.editState = 'Completed'; it.status = 'Pending'; }
          localStorage.setItem('hcf_demo_activities', JSON.stringify(list));
        }
      } catch (e) {}
      return { status: 'success', message: action === 'requestEdit' ? 'Edit request sent (demo auto-approved).' : 'Entry updated (demo).' };
    }
    return { status: 'error', message: 'demo: unknown action' };
  }

  function authPayload(extra) {
    const u = HCFAuth.current() || {};
    const v = u.volunteer || {};
    return Object.assign({ email: v.email, token: u.token }, extra || {});
  }

  const HCFAuth = {
    demo: demo,
    current() { try { return JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } },
    setCurrent(o) { sessionStorage.setItem(SKEY, JSON.stringify(o)); },
    logout() { sessionStorage.removeItem(SKEY); location.href = 'login.html'; },
    async signup(p) { return post('signup', p); },
    async login(email, password) {
      const r = await post('login', { email: email, password: password });
      if (r && r.status === 'success') HCFAuth.setCurrent({ token: r.token, volunteer: r.volunteer });
      return r;
    },
    /** Guard a page — redirect to login if no approved volunteer session. */
    requireLogin() {
      const u = HCFAuth.current();
      if (!u || !u.volunteer) { location.replace('login.html'); return null; }
      return u.volunteer;
    },
    async myActivities(scope) { return post('myActivities', authPayload({ scope: scope || 'me' })); },
    async requestEdit(activityId, reason) { return post('requestEdit', authPayload({ activityId: activityId, reason: reason })); },
    async updateActivity(fields) { return post('updateActivity', authPayload(fields)); }
  };
  global.HCFAuth = HCFAuth;
})(window);
