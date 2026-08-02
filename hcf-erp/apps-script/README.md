# HCF ERP — Google Apps Script Backend

This is the serverless backend for the **HCF Activity Management System**.
It stores submissions in **Google Sheets**, files bills & photos in
**Google Drive**, and emails the admin via **Gmail** — all with zero hosting cost.

---

## What it does

| Endpoint | Method | Purpose |
|---|---|---|
| `?action=ping` | GET | Health check |
| `?action=stats` | GET | Aggregate stats for the upload portal hero |
| `?action=list` | GET | Full activity list for the admin dashboard (supports `chapter`, `status`, `q` filters) |
| `?action=setStatus&rowIndex=..&status=Approved&token=..` | GET | Approve / Reject a report |
| `submitActivity` | POST | Receive a new activity (JSON body) |

On every submission it:
1. Validates & sanitises the payload (phone, email, required fields).
2. Creates `HCF Activity Uploads / <Chapter> / <Date • ID> / {Bills, Photos}` in Drive.
3. Saves each bill (image/PDF) and photo (compressed JPEG) as a Drive file.
4. Appends a fully-structured row to the **Activities** sheet.
5. Emails a branded summary to the admin with links to the Sheet, Bills & Photos.

---

## One-time setup (10 minutes)

### 1. Create the Apps Script project
1. Go to **https://script.google.com** → **New project**.
2. Delete the default `Code.gs` content and paste the entire contents of
   [`Code.gs`](./Code.gs).
3. Rename the project to `HCF Activity Backend`.

### 2. Configure
At the top of `Code.gs`, edit the `CONFIG` object:

```js
const CONFIG = {
  SHEET_ID: '',                 // leave blank — a sheet is auto-created on first run
  ADMIN_EMAIL: 'hopecommonersfoundation@gmail.com',
  ADMIN_TOKEN: 'HCF-CHANGE-ME-2026',   // ⚠️ change this to a long random secret
  ...
};
```

> **Important:** The `ADMIN_TOKEN` must exactly match `ADMIN.token` in
> `admin/dashboard.js`. It authorises Approve/Reject writes.

### 3. Grant permissions
1. In the editor, select the function **`setup`** from the dropdown and click **Run**.
2. Approve the OAuth consent screen (Sheets, Drive, Gmail scopes).
3. Check the **Execution log** — it prints your new Spreadsheet URL.

### 4. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Select type **Web app**.
3. Set:
   - **Description:** `HCF API v1`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy** and **copy the Web app URL** (ends in `/exec`).

### 5. Wire up the front-end
Open [`../activity-upload/config.js`](../activity-upload/config.js) and paste the URL:

```js
window.HCF_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycb..../exec",
  ...
};
```

The same `config.js` is shared by the upload portal **and** the admin dashboard.

### 6. Test
- Run `testSubmit` in the editor → a sample row appears in the sheet and you get an email.
- Open `activity-upload/index.html` in a browser and submit a real report.

---

## Redeploying after code changes
Apps Script keeps versioned deployments. After editing `Code.gs`:
**Deploy → Manage deployments → (edit) → Version: New version → Deploy.**
The `/exec` URL stays the same, so no front-end change is needed.

---

## Data model — `Activities` sheet columns
`Timestamp · Activity ID · Volunteer · Phone · Email · Chapter · Activity Date ·
Activity Time · Activity · Location · Meals · Volunteers Present · Amount Requested ·
Actual Expense · Expense Breakdown · Description · Need Funds · Need Volunteers ·
Need Food · Need Transport · Need Sponsors · Remarks · Bills Link · Photos Link ·
Bills Count · Photos Count · Status`

---

## Notes & limits
- **CORS:** the front-end posts as `text/plain` to avoid a CORS preflight that
  Apps Script cannot answer. The body is still JSON — `doPost` parses it.
- **Payload size:** Apps Script POST bodies are capped (~50 MB). Images are
  compressed client-side (longest edge 1600px, JPEG q0.82) so typical
  submissions with 30 photos stay well under the limit.
- **Quotas (consumer Gmail):** ~100 emails/day, generous Drive/Sheet quotas —
  ample for chapter reporting. See Google's Apps Script quota page.
- **Firebase-ready:** the front-end talks to a single `API_URL`. To migrate to
  Firebase later, expose the same JSON contract from a Cloud Function and swap
  the URL — no UI changes required.

---

## Security checklist
- [ ] Changed `ADMIN_TOKEN` to a long random value (and matched it in `dashboard.js`).
- [ ] Changed the dashboard login `user`/`pass` in `dashboard.js`.
- [ ] Verified "Execute as: Me" so volunteers never need Google accounts.
- [ ] Confirmed the honeypot + validation reject spam (see `submitActivity`).
