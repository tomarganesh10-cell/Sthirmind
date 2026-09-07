/*********************************************************************
 * HCF Activity Management System — Google Apps Script Backend
 * -------------------------------------------------------------------
 * Responsibilities:
 *   • Receive activity submissions (doPost) from the upload portal
 *   • Store rows in a Google Sheet ("Activities")
 *   • Create structured Google Drive folders (Chapter → Date → Bills/Photos)
 *   • Save uploaded bills & photos to Drive
 *   • Email the admin on every new submission
 *   • Serve stats + activity list to the Admin Dashboard (doGet)
 *   • Approve / Reject actions from the dashboard
 *
 * Deploy as: Web App → Execute as "Me" → Access "Anyone"
 * See README.md for full setup instructions.
 *********************************************************************/

/* ============================ CONFIG ============================ */
const CONFIG = {
  // Leave blank to auto-create a spreadsheet on first run (id is cached in Script Properties)
  SHEET_ID: '',
  SHEET_NAME: 'Activities',
  STATS_SHEET: 'Meta',

  // Root Drive folder name that will hold "Activity Uploads"
  DRIVE_ROOT_NAME: 'HCF Activity Uploads',

  // Admin notification recipient(s), comma separated
  ADMIN_EMAIL: 'hopecommonersfoundation@gmail.com',

  // Simple shared secret for dashboard admin actions (change this!)
  ADMIN_TOKEN: 'HCF-CHANGE-ME-2026',

  ORG_NAME: 'Hope Commoners Foundation',
  ORG_DOMAIN: 'hopecommonersfoundation.com',
  BRAND_PRIMARY: '#0B3D2E',
  BRAND_GOLD: '#D4AF37'
};

const HEADERS = [
  'Timestamp', 'Activity ID', 'Volunteer', 'Phone', 'Email', 'Chapter',
  'Activity Date', 'Activity Time', 'Activity', 'Location', 'Meals', 'Volunteers Present',
  'Amount Requested', 'Actual Expense', 'Expense Breakdown', 'Description',
  'Need Funds', 'Need Volunteers', 'Need Food', 'Need Transport', 'Need Sponsors',
  'Remarks', 'Bills Link', 'Photos Link', 'Bills Count', 'Photos Count', 'Status'
];

// Volunteer accounts sheet (signup + admin approval)
const VOL_SHEET = 'Volunteers';
const VOL_HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Chapter', 'PasswordHash', 'Status', 'Role'];

// Edit-request workflow sheet
const EDIT_SHEET = 'EditRequests';
const EDIT_HEADERS = ['Timestamp', 'Activity ID', 'Requested By', 'Chapter', 'Reason', 'Status']; // Status: Pending | Approved | Rejected | Completed

function sanitize(s) { return String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 2000); }

/* ============================ ROUTER ============================ */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    switch (action) {
      case 'stats':            return json({ status: 'success', stats: getStats() });
      case 'list':             return json({ status: 'success', activities: listActivities(e.parameter) });
      case 'setStatus':        return json(setStatus(e.parameter));
      case 'listVolunteers':   return json({ status: 'success', volunteers: listVolunteers(e.parameter) });
      case 'setVolStatus':     return json(setVolStatus(e.parameter));
      case 'setVolRole':       return json(setVolRole(e.parameter));
      case 'listEditRequests': return json({ status: 'success', requests: listEditRequests(e.parameter) });
      case 'setEditStatus':    return json(setEditStatus(e.parameter));
      case 'ping':             return json({ status: 'success', message: 'HCF API online', time: new Date().toISOString() });
      default:                 return json({ status: 'error', message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return json({ status: 'error', message: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || 'submitActivity';
    if (action === 'submitActivity') return json(submitActivity(body.payload || {}));
    if (action === 'setStatus')      return json(setStatus(body));
    if (action === 'signup')         return json(signupVolunteer(body.payload || {}));
    if (action === 'login')          return json(loginVolunteer(body.payload || {}));
    if (action === 'setVolStatus')   return json(setVolStatus(body));
    if (action === 'setVolRole')     return json(setVolRole(body));
    if (action === 'myActivities')   return json(myActivities(body.payload || {}));
    if (action === 'requestEdit')    return json(requestEdit(body.payload || {}));
    if (action === 'updateActivity') return json(updateActivity(body.payload || {}));
    if (action === 'setEditStatus')  return json(setEditStatus(body));
    return json({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return json({ status: 'error', message: String(err && err.message || err) });
  }
}

/* ====================== SUBMIT ACTIVITY ======================== */
function submitActivity(p) {
  // --- Validation & sanitisation ---
  const required = ['fullName', 'phone', 'email', 'chapter', 'activityDate', 'activityName'];
  for (const f of required) {
    if (!p[f] || String(p[f]).trim() === '') {
      return { status: 'error', message: 'Missing required field: ' + f };
    }
  }
  if (!/^\d{10}$/.test(String(p.phone))) return { status: 'error', message: 'Invalid phone number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email))) return { status: 'error', message: 'Invalid email.' };

  const clean = s => String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 2000);
  const num = n => { const v = parseFloat(n); return isFinite(v) ? v : 0; };

  const activityId = 'HCF-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') +
                     '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

  // --- Drive: Chapter → Date → Bills / Photos ---
  const root = getOrCreateFolder(getDriveRoot(), CONFIG.DRIVE_ROOT_NAME);
  const chapterFolder = getOrCreateFolder(root, clean(p.chapter) || 'Unknown');
  const dateFolder = getOrCreateFolder(chapterFolder, (clean(p.activityDate) || 'undated') + ' • ' + activityId);
  const billsFolder = getOrCreateFolder(dateFolder, 'Bills');
  const photosFolder = getOrCreateFolder(dateFolder, 'Photos');

  let billsCount = 0, photosCount = 0;
  (p.bills || []).forEach((f, i) => { if (saveDataUrl(billsFolder, f, activityId + '-bill-' + (i + 1))) billsCount++; });
  (p.photos || []).forEach((f, i) => { if (saveDataUrl(photosFolder, f, activityId + '-photo-' + (i + 1))) photosCount++; });

  const billsLink = billsCount ? billsFolder.getUrl() : '';
  const photosLink = photosCount ? photosFolder.getUrl() : '';

  // --- Expense breakdown as text ---
  const expenseText = (p.expenses || [])
    .map(x => `${clean(x.item)}: ₹${num(x.amount).toFixed(2)}`).join(' | ');

  // --- Sheet row ---
  const sheet = getSheet();
  const row = [
    new Date(), activityId, clean(p.fullName), clean(p.phone), clean(p.email), clean(p.chapter),
    clean(p.activityDate), clean(p.activityTime), clean(p.activityName), clean(p.location),
    num(p.meals), num(p.volunteers), num(p.amountRequested), num(p.actualExpense), expenseText,
    clean(p.description),
    p.needFunds === 'Yes' ? 'Yes' : 'No', p.needVolunteers === 'Yes' ? 'Yes' : 'No',
    p.needFood === 'Yes' ? 'Yes' : 'No', p.needTransport === 'Yes' ? 'Yes' : 'No',
    p.needSponsors === 'Yes' ? 'Yes' : 'No',
    clean(p.remarks), billsLink, photosLink, billsCount, photosCount, 'Pending'
  ];
  sheet.appendRow(row);

  // --- Email admin ---
  try { notifyAdmin(p, activityId, sheet, num(p.actualExpense), photosLink, billsLink); } catch (mailErr) { /* non-fatal */ }

  return {
    status: 'success',
    message: 'Activity recorded',
    activityId: activityId,
    sheetUrl: getSpreadsheet().getUrl(),
    billsLink: billsLink,
    photosLink: photosLink
  };
}

/* Save a { name, type, dataUrl } object to Drive; returns the file or null */
function saveDataUrl(folder, f, fallbackName) {
  try {
    if (!f || !f.dataUrl) return null;
    const m = String(f.dataUrl).match(/^data:([^;]+);base64,(.*)$/);
    if (!m) return null;
    const contentType = f.type || m[1] || 'application/octet-stream';
    const bytes = Utilities.base64Decode(m[2]);
    let name = (f.name || fallbackName).replace(/[\\/:*?"<>|]+/g, '_');
    if (!/\.[a-z0-9]{2,5}$/i.test(name)) {
      name += contentType.indexOf('pdf') > -1 ? '.pdf' : '.jpg';
    }
    const blob = Utilities.newBlob(bytes, contentType, name);
    return folder.createFile(blob);
  } catch (err) { return null; }
}

/* ========================= EMAIL ============================== */
function notifyAdmin(p, activityId, sheet, expense, photosLink, billsLink) {
  const subject = `🌱 New Activity: ${p.activityName} — ${p.chapter} (${p.meals || 0} meals)`;
  const sheetUrl = getSpreadsheet().getUrl();
  const gold = CONFIG.BRAND_GOLD, green = CONFIG.BRAND_PRIMARY;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#F7F8F9;padding:24px;border-radius:16px">
    <div style="background:${green};color:#fff;padding:22px;border-radius:14px 14px 0 0">
      <h2 style="margin:0;font-size:20px">${CONFIG.ORG_NAME}</h2>
      <p style="margin:4px 0 0;color:${gold};font-weight:600;letter-spacing:.08em">NEW ACTIVITY UPLOADED</p>
    </div>
    <div style="background:#fff;padding:22px;border:1px solid #e4e8e6;border-top:none">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#16241d">
        ${emailRow('Reference', activityId)}
        ${emailRow('Volunteer', esc(p.fullName) + ' (' + esc(p.phone) + ')')}
        ${emailRow('Chapter', esc(p.chapter))}
        ${emailRow('Activity', esc(p.activityName))}
        ${emailRow('Date / Time', esc(p.activityDate) + ' ' + esc(p.activityTime || ''))}
        ${emailRow('Meals Served', '<b>' + (p.meals || 0) + '</b>')}
        ${emailRow('Volunteers', p.volunteers || 0)}
        ${emailRow('Actual Expense', '₹ ' + Number(expense).toFixed(2))}
        ${p.location ? emailRow('Location', '<a href="' + esc(p.location) + '">Open Map</a>') : ''}
        ${billsLink ? emailRow('Bills', '<a href="' + billsLink + '">View Bills</a>') : ''}
        ${photosLink ? emailRow('Photos', '<a href="' + photosLink + '">View Photos</a>') : ''}
      </table>
      ${p.description ? '<p style="margin-top:16px;color:#5b6b63;font-size:13px"><b>Notes:</b> ' + esc(p.description) + '</p>' : ''}
      <div style="margin-top:22px">
        <a href="${sheetUrl}" style="background:${gold};color:#1c1403;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Open Google Sheet</a>
      </div>
    </div>
    <p style="text-align:center;color:#9aa5a0;font-size:12px;margin-top:14px">${CONFIG.ORG_DOMAIN}</p>
  </div>`;

  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: subject,
    htmlBody: html,
    name: CONFIG.ORG_NAME + ' Activity Portal'
  });
}
function emailRow(k, v) {
  return `<tr><td style="padding:7px 0;color:#5b6b63;width:140px">${k}</td><td style="padding:7px 0">${v}</td></tr>`;
}
function esc(s) { return String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ========================= STATS ============================= */
function getStats() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  const tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const month = Utilities.formatDate(new Date(), tz, 'yyyy-MM');

  const stats = { meals: 0, todayMeals: 0, monthMeals: 0, volunteers: 0, activities: 0,
                  expenses: 0, pending: 0, approved: 0, rejected: 0, chapters: 6 };
  if (last < 2) return stats;

  const data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const chapters = {};
  data.forEach(r => {
    const ts = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : '';
    const meals = Number(r[10]) || 0;
    const vols = Number(r[11]) || 0;
    const exp = Number(r[13]) || 0;
    const status = String(r[26] || 'Pending');
    stats.meals += meals; stats.volunteers += vols; stats.expenses += exp; stats.activities++;
    if (ts === today) stats.todayMeals += meals;
    if (ts.slice(0, 7) === month) stats.monthMeals += meals;
    if (status === 'Pending') stats.pending++;
    else if (status === 'Approved') stats.approved++;
    else if (status === 'Rejected') stats.rejected++;
    chapters[r[5]] = true;
  });
  stats.chapters = Math.max(Object.keys(chapters).length, 6);
  return stats;
}

/* ===================== LIST ACTIVITIES ======================= */
function listActivities(params) {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const tz = Session.getScriptTimeZone();

  let rows = data.map((r, i) => ({
    rowIndex: i + 2,
    timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : String(r[0]),
    activityId: r[1], volunteer: r[2], phone: r[3], email: r[4], chapter: r[5],
    activityDate: r[6], activityTime: r[7], activity: r[8], location: r[9],
    meals: Number(r[10]) || 0, volunteers: Number(r[11]) || 0,
    amountRequested: Number(r[12]) || 0, actualExpense: Number(r[13]) || 0,
    expenseBreakdown: r[14], description: r[15],
    needFunds: r[16], needVolunteers: r[17], needFood: r[18], needTransport: r[19], needSponsors: r[20],
    remarks: r[21], billsLink: r[22], photosLink: r[23],
    billsCount: Number(r[24]) || 0, photosCount: Number(r[25]) || 0,
    status: r[26] || 'Pending'
  }));

  // Filters
  if (params) {
    if (params.chapter) rows = rows.filter(r => r.chapter === params.chapter);
    if (params.status)  rows = rows.filter(r => r.status === params.status);
    if (params.q) {
      const q = String(params.q).toLowerCase();
      rows = rows.filter(r => (r.volunteer + r.activity + r.chapter + r.activityId + r.phone).toLowerCase().indexOf(q) > -1);
    }
  }
  return rows.reverse(); // newest first
}

/* ===================== SET STATUS ============================ */
function setStatus(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return { status: 'error', message: 'Unauthorized' };
  const rowIndex = parseInt(params.rowIndex, 10);
  const newStatus = params.status;
  if (!rowIndex || ['Approved', 'Rejected', 'Pending'].indexOf(newStatus) === -1) {
    return { status: 'error', message: 'Invalid status request' };
  }
  const sheet = getSheet();
  const statusCol = HEADERS.indexOf('Status') + 1;
  sheet.getRange(rowIndex, statusCol).setValue(newStatus);
  return { status: 'success', message: 'Status updated to ' + newStatus, rowIndex: rowIndex };
}

/* ==================== VOLUNTEER AUTH ========================= */
function getVolSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(VOL_SHEET);
  if (!sheet) sheet = ss.insertSheet(VOL_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, VOL_HEADERS.length).setValues([VOL_HEADERS])
      .setFontWeight('bold').setBackground(CONFIG.BRAND_PRIMARY).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function hashPw(email, password) {
  const raw = String(email).toLowerCase() + '|' + String(password) + '|' + CONFIG.ADMIN_TOKEN;
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw));
}
function makeToken(email) {
  const raw = String(email).toLowerCase() + '|' + CONFIG.ADMIN_TOKEN;
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw));
}

function findVolByEmail(email) {
  const sheet = getVolSheet();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const data = sheet.getRange(2, 1, last - 1, VOL_HEADERS.length).getValues();
  const target = String(email).toLowerCase().trim();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase().trim() === target) {
      return { rowIndex: i + 2, row: data[i] };
    }
  }
  return null;
}

function signupVolunteer(p) {
  const clean = s => String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 200);
  const name = clean(p.name), email = clean(p.email).toLowerCase(), phone = clean(p.phone), chapter = clean(p.chapter);
  const password = String(p.password || '');
  if (!name || !email || !phone || !chapter || !password) return { status: 'error', message: 'All fields are required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 'error', message: 'Invalid email.' };
  if (!/^\d{10}$/.test(phone)) return { status: 'error', message: 'Phone must be 10 digits.' };
  if (password.length < 6) return { status: 'error', message: 'Password must be at least 6 characters.' };
  if (findVolByEmail(email)) return { status: 'error', message: 'An account with this email already exists.' };

  const sheet = getVolSheet();
  sheet.appendRow([new Date(), name, email, phone, chapter, hashPw(email, password), 'Pending', 'Volunteer']);

  // Notify admin of new signup
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: '🙋 New volunteer signup — approval needed: ' + name,
      htmlBody: '<div style="font-family:Arial,sans-serif">' +
        '<h3 style="color:' + CONFIG.BRAND_PRIMARY + '">New Volunteer Signup</h3>' +
        '<p><b>Name:</b> ' + esc(name) + '<br><b>Email:</b> ' + esc(email) +
        '<br><b>Phone:</b> ' + esc(phone) + '<br><b>Chapter:</b> ' + esc(chapter) + '</p>' +
        '<p>Open the Admin Dashboard → Volunteers to approve or reject.</p>' +
        '<a href="' + getSpreadsheet().getUrl() + '" style="background:' + CONFIG.BRAND_GOLD +
        ';color:#1c1403;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open Sheet</a></div>',
      name: CONFIG.ORG_NAME + ' Portal'
    });
  } catch (mailErr) { /* non-fatal */ }

  return { status: 'success', message: 'Signup received. Your account is pending admin approval.' };
}

function loginVolunteer(p) {
  const email = String(p.email || '').toLowerCase().trim();
  const password = String(p.password || '');
  if (!email || !password) return { status: 'error', message: 'Email and password required.' };
  const found = findVolByEmail(email);
  if (!found) return { status: 'error', message: 'No account found. Please sign up first.' };
  const [, name, , phone, chapter, hash, vstatus] = found.row;
  if (hash !== hashPw(email, password)) return { status: 'error', message: 'Incorrect password.' };
  if (vstatus === 'Pending') return { status: 'pending', message: 'Your account is awaiting admin approval.' };
  if (vstatus === 'Rejected') return { status: 'rejected', message: 'Your account request was not approved. Please contact the admin.' };
  return {
    status: 'success', message: 'Welcome back!',
    token: makeToken(email),
    volunteer: { name: name, email: email, phone: phone, chapter: chapter, role: found.row[7] || 'Volunteer' }
  };
}

function listVolunteers(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return [];
  const sheet = getVolSheet();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const tz = Session.getScriptTimeZone();
  const data = sheet.getRange(2, 1, last - 1, VOL_HEADERS.length).getValues();
  return data.map((r, i) => ({
    rowIndex: i + 2,
    timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : String(r[0]),
    name: r[1], email: r[2], phone: r[3], chapter: r[4], status: r[6] || 'Pending', role: r[7] || 'Volunteer'
  })).reverse();
}

function setVolStatus(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return { status: 'error', message: 'Unauthorized' };
  const rowIndex = parseInt(params.rowIndex, 10);
  const newStatus = params.status;
  if (!rowIndex || ['Approved', 'Rejected', 'Pending'].indexOf(newStatus) === -1) {
    return { status: 'error', message: 'Invalid status request' };
  }
  const sheet = getVolSheet();
  const statusCol = VOL_HEADERS.indexOf('Status') + 1;
  sheet.getRange(rowIndex, statusCol).setValue(newStatus);

  // Notify the volunteer of the decision
  try {
    const email = sheet.getRange(rowIndex, VOL_HEADERS.indexOf('Email') + 1).getValue();
    const name = sheet.getRange(rowIndex, VOL_HEADERS.indexOf('Name') + 1).getValue();
    if (email && (newStatus === 'Approved' || newStatus === 'Rejected')) {
      const approved = newStatus === 'Approved';
      MailApp.sendEmail({
        to: email,
        subject: approved ? '✅ Your HCF volunteer account is approved' : 'HCF volunteer account update',
        htmlBody: '<div style="font-family:Arial,sans-serif"><h3 style="color:' + CONFIG.BRAND_PRIMARY + '">Hi ' + esc(name) + ',</h3>' +
          (approved
            ? '<p>Your Hope Commoners Foundation volunteer account has been <b>approved</b>. You can now log in and start uploading activities.</p>'
            : '<p>Your volunteer account request was not approved at this time. Please contact the team for details.</p>') +
          '</div>',
        name: CONFIG.ORG_NAME + ' Portal'
      });
    }
  } catch (mailErr) { /* non-fatal */ }

  return { status: 'success', message: 'Volunteer marked ' + newStatus, rowIndex: rowIndex };
}

/* ============ ROLES / MY-DASHBOARD / EDIT REQUESTS ========== */
function verifyUser(email, token) {
  return !!email && !!token && makeToken(String(email).toLowerCase().trim()) === token;
}
function volInfo(email) {
  const found = findVolByEmail(email);
  if (!found) return { role: 'Volunteer', chapter: '', name: '' };
  return { role: found.row[7] || 'Volunteer', chapter: found.row[4] || '', name: found.row[1] || '' };
}

/** Admin: change a volunteer's role (e.g. promote to "Chapter Head"). */
function setVolRole(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return { status: 'error', message: 'Unauthorized' };
  const rowIndex = parseInt(params.rowIndex, 10);
  const role = params.role;
  if (!rowIndex || ['Volunteer', 'Chapter Head'].indexOf(role) === -1) return { status: 'error', message: 'Invalid role' };
  getVolSheet().getRange(rowIndex, VOL_HEADERS.indexOf('Role') + 1).setValue(role);
  return { status: 'success', message: 'Role set to ' + role };
}

function getEditSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(EDIT_SHEET);
  if (!sheet) sheet = ss.insertSheet(EDIT_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, EDIT_HEADERS.length).setValues([EDIT_HEADERS])
      .setFontWeight('bold').setBackground(CONFIG.BRAND_PRIMARY).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
/** Latest edit-request per Activity ID (row scan). */
function latestEditReq(activityId) {
  const sheet = getEditSheet();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const data = sheet.getRange(2, 1, last - 1, EDIT_HEADERS.length).getValues();
  let hit = null;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1]) === String(activityId)) hit = { rowIndex: i + 2, requestedBy: data[i][2], status: data[i][5] };
  }
  return hit;
}
function findActivityById(activityId) {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1]) === String(activityId)) return { rowIndex: i + 2, row: data[i] };
  }
  return null;
}

/** Volunteer / Chapter-Head personal dashboard data. */
function myActivities(p) {
  const email = String(p.email || '').toLowerCase().trim();
  if (!verifyUser(email, p.token)) return { status: 'error', message: 'Unauthorized' };
  const info = volInfo(email);
  const all = listActivities({});
  let rows;
  if (p.scope === 'chapter' && info.role === 'Chapter Head') {
    rows = all.filter(a => a.chapter === info.chapter);
  } else {
    rows = all.filter(a => String(a.email).toLowerCase() === email);
  }
  // attach edit state
  const es = getEditSheet(); const lastE = es.getLastRow();
  const emap = {};
  if (lastE > 1) es.getRange(2, 1, lastE - 1, EDIT_HEADERS.length).getValues()
    .forEach(r => { emap[String(r[1])] = r[5]; });
  rows.forEach(a => { a.editState = emap[a.activityId] || ''; });

  const totals = {
    activities: rows.length,
    meals: rows.reduce((s, a) => s + (a.meals || 0), 0),
    volunteers: rows.reduce((s, a) => s + (a.volunteers || 0), 0),
    billsValue: rows.reduce((s, a) => s + (a.actualExpense || 0), 0),
    billsCount: rows.reduce((s, a) => s + (a.billsCount || 0), 0),
    approved: rows.filter(a => a.status === 'Approved').length,
    pending: rows.filter(a => a.status === 'Pending').length
  };
  return { status: 'success', role: info.role, chapter: info.chapter, name: info.name, totals: totals, activities: rows };
}

/** A volunteer requests permission to edit one of their entries. */
function requestEdit(p) {
  const email = String(p.email || '').toLowerCase().trim();
  if (!verifyUser(email, p.token)) return { status: 'error', message: 'Unauthorized' };
  if (!p.activityId || !p.reason) return { status: 'error', message: 'Activity and reason are required.' };
  const act = findActivityById(p.activityId);
  if (!act) return { status: 'error', message: 'Activity not found.' };
  const info = volInfo(email);
  const owns = String(act.row[4]).toLowerCase() === email || (info.role === 'Chapter Head' && act.row[5] === info.chapter);
  if (!owns) return { status: 'error', message: 'This is not your entry.' };
  const existing = latestEditReq(p.activityId);
  if (existing && (existing.status === 'Pending' || existing.status === 'Approved'))
    return { status: 'error', message: 'An edit request is already ' + existing.status.toLowerCase() + ' for this entry.' };
  getEditSheet().appendRow([new Date(), p.activityId, email, act.row[5], sanitize(p.reason), 'Pending']);
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: '✏️ Edit request: ' + p.activityId + ' (' + act.row[5] + ')',
      htmlBody: '<div style="font-family:Arial,sans-serif"><h3 style="color:' + CONFIG.BRAND_PRIMARY + '">Edit Request</h3>' +
        '<p><b>Activity:</b> ' + esc(p.activityId) + '<br><b>By:</b> ' + esc(email) +
        '<br><b>Chapter:</b> ' + esc(act.row[5]) + '<br><b>Reason:</b> ' + esc(sanitize(p.reason)) + '</p>' +
        '<p>Open Admin Dashboard → Edit Requests to approve or reject.</p></div>',
      name: CONFIG.ORG_NAME + ' Portal'
    });
  } catch (e) { /* non-fatal */ }
  return { status: 'success', message: 'Edit request sent for admin approval.' };
}

/** Admin: list edit requests. */
function listEditRequests(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return [];
  const sheet = getEditSheet(); const last = sheet.getLastRow();
  if (last < 2) return [];
  const tz = Session.getScriptTimeZone();
  return sheet.getRange(2, 1, last - 1, EDIT_HEADERS.length).getValues().map((r, i) => ({
    rowIndex: i + 2,
    timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : String(r[0]),
    activityId: r[1], requestedBy: r[2], chapter: r[3], reason: r[4], status: r[5] || 'Pending'
  })).reverse();
}

/** Admin: approve/reject an edit request. Approved = entry unlocked for its owner. */
function setEditStatus(params) {
  if (!params || params.token !== CONFIG.ADMIN_TOKEN) return { status: 'error', message: 'Unauthorized' };
  const rowIndex = parseInt(params.rowIndex, 10);
  const status = params.status;
  if (!rowIndex || ['Approved', 'Rejected'].indexOf(status) === -1) return { status: 'error', message: 'Invalid request' };
  const sheet = getEditSheet();
  sheet.getRange(rowIndex, EDIT_HEADERS.indexOf('Status') + 1).setValue(status);
  try {
    const email = sheet.getRange(rowIndex, EDIT_HEADERS.indexOf('Requested By') + 1).getValue();
    const actId = sheet.getRange(rowIndex, EDIT_HEADERS.indexOf('Activity ID') + 1).getValue();
    if (email) MailApp.sendEmail({
      to: email,
      subject: (status === 'Approved' ? '✅ Edit approved: ' : 'Edit request update: ') + actId,
      htmlBody: '<div style="font-family:Arial,sans-serif">' +
        (status === 'Approved'
          ? '<p>Your edit request for <b>' + esc(actId) + '</b> is <b>approved</b>. Open your dashboard → the entry now has an <b>Edit</b> button to repunch corrections.</p>'
          : '<p>Your edit request for <b>' + esc(actId) + '</b> was not approved.</p>') + '</div>',
      name: CONFIG.ORG_NAME + ' Portal'
    });
  } catch (e) { /* non-fatal */ }
  return { status: 'success', message: 'Edit request ' + status };
}

/** Volunteer: repunch a previously-unlocked entry (text fields; files unchanged). */
function updateActivity(p) {
  const email = String(p.email || '').toLowerCase().trim();
  if (!verifyUser(email, p.token)) return { status: 'error', message: 'Unauthorized' };
  const act = findActivityById(p.activityId);
  if (!act) return { status: 'error', message: 'Activity not found.' };
  const req = latestEditReq(p.activityId);
  if (!req || req.status !== 'Approved' || String(req.requestedBy).toLowerCase() !== email)
    return { status: 'error', message: 'This entry is not unlocked for editing.' };

  const num = n => { const v = parseFloat(n); return isFinite(v) ? v : 0; };
  const expenseText = (p.expenses || []).map(x => sanitize(x.item) + ': ₹' + num(x.amount).toFixed(2)).join(' | ');
  const sheet = getSheet(); const ri = act.rowIndex;
  const set = (col1, val) => sheet.getRange(ri, col1).setValue(val); // col is 1-based
  set(7, sanitize(p.activityDate)); set(8, sanitize(p.activityTime)); set(9, sanitize(p.activityName));
  set(10, sanitize(p.location)); set(11, num(p.meals)); set(12, num(p.volunteers));
  set(13, num(p.amountRequested)); set(14, num(p.actualExpense)); set(15, expenseText);
  set(16, sanitize(p.description));
  set(17, p.needFunds === 'Yes' ? 'Yes' : 'No'); set(18, p.needVolunteers === 'Yes' ? 'Yes' : 'No');
  set(19, p.needFood === 'Yes' ? 'Yes' : 'No'); set(20, p.needTransport === 'Yes' ? 'Yes' : 'No');
  set(21, p.needSponsors === 'Yes' ? 'Yes' : 'No'); set(22, sanitize(p.remarks));
  set(HEADERS.indexOf('Status') + 1, 'Pending'); // re-review after edit
  setEditStatusRow(req.rowIndex, 'Completed'); // re-lock
  return { status: 'success', message: 'Entry updated and re-submitted for review.', activityId: p.activityId };
}
function setEditStatusRow(rowIndex, status) {
  getEditSheet().getRange(rowIndex, EDIT_HEADERS.indexOf('Status') + 1).setValue(status);
}

/* ==================== SHEET / DRIVE HELPERS ================== */
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let id = CONFIG.SHEET_ID || props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* recreate below */ }
  }
  const ss = SpreadsheetApp.create(CONFIG.ORG_NAME + ' — Activities');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function getSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground(CONFIG.BRAND_PRIMARY).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function getDriveRoot() { return DriveApp.getRootFolder(); }

function getOrCreateFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/* ======================= RESPONSE =========================== */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================== ONE-TIME SETUP HELPERS ================== */
/**
 * Run this once from the editor to initialise the spreadsheet + headers
 * and grant the needed OAuth scopes (Drive, Gmail, Sheets).
 */
function setup() {
  const sheet = getSheet();
  getOrCreateFolder(getDriveRoot(), CONFIG.DRIVE_ROOT_NAME);
  Logger.log('✅ Setup complete.');
  Logger.log('Spreadsheet URL: ' + getSpreadsheet().getUrl());
  Logger.log('Drive root: ' + CONFIG.DRIVE_ROOT_NAME);
  return getSpreadsheet().getUrl();
}

/** Quick self-test that inserts a sample row (safe to delete afterwards). */
function testSubmit() {
  const res = submitActivity({
    fullName: 'Test Volunteer', phone: '9876543210', email: 'test@example.com',
    chapter: 'Agra', activityDate: '2026-08-02', activityTime: '10:00',
    activityName: 'Poha', location: '', meals: 120, volunteers: 8,
    amountRequested: 1500, actualExpense: 1420,
    expenses: [{ item: 'Poha', amount: 800 }, { item: 'Gas', amount: 620 }],
    description: 'Morning distribution near railway station.',
    needFunds: 'Yes', needVolunteers: 'No', needFood: 'No', needTransport: 'No', needSponsors: 'Yes',
    remarks: 'Great turnout.', bills: [], photos: []
  });
  Logger.log(JSON.stringify(res, null, 2));
}
