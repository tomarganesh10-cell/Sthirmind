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

/* ============================ ROUTER ============================ */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    switch (action) {
      case 'stats':       return json({ status: 'success', stats: getStats() });
      case 'list':        return json({ status: 'success', activities: listActivities(e.parameter) });
      case 'setStatus':   return json(setStatus(e.parameter));
      case 'ping':        return json({ status: 'success', message: 'HCF API online', time: new Date().toISOString() });
      default:            return json({ status: 'error', message: 'Unknown action: ' + action });
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
