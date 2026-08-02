# 🌱 HCF Activity Management System (HCF ERP)

A complete, production-ready **NGO ERP platform** for the **Hope Commoners Foundation**
— built for volunteers, chapter heads, administrators and management.

> Domain: **hopecommonersfoundation.com**
> Stack: HTML5 · CSS3 · Modern JS (ES6) · Bootstrap 5 · GSAP · AOS · Font Awesome ·
> Google Fonts (Poppins) · Google Apps Script · Google Sheets · Google Drive · Gmail.

---

## ✨ What's inside

| Module | Description |
|---|---|
| **Activity Upload Portal** | 5-step animated form: volunteer info, activity details, expense table (dynamic rows + auto-total), bill & photo uploads (drag-drop, preview, client-side compression, max 30 photos), requirements, and a premium submit flow with progress + success screen. |
| **Admin Dashboard** | Login gate, KPI cards (count-up), bar + pie charts, searchable/filterable activity table, approve/reject, detail modal, Excel (CSV) + PDF export, and a chapter-wise report. |
| **Apps Script Backend** | Serverless API: Google Sheets storage, structured Drive folders (Chapter → Date → Bills/Photos), Gmail admin notifications, stats & status endpoints. |

---

## 📁 Folder structure

```
hcf-erp/
├── activity-upload/
│   ├── index.html      # Volunteer activity submission portal
│   ├── style.css       # Premium glassmorphism UI
│   ├── script.js       # Stepper, validation, uploads, compression, submit
│   ├── success.html    # Animated success / confirmation screen
│   └── config.js       # 🔗 Shared API_URL + settings (edit this)
│
├── admin/
│   ├── dashboard.html  # Admin console shell
│   ├── dashboard.css   # Dashboard styling
│   └── dashboard.js    # Auth, data, charts, table, exports, approvals
│
├── apps-script/
│   ├── Code.gs         # Google Apps Script backend (Sheets/Drive/Gmail)
│   └── README.md       # Full deployment guide
│
└── README.md           # (this file)
```

---

## 🚀 Quick start

### 1. Deploy the backend
Follow **[`apps-script/README.md`](./apps-script/README.md)** to:
1. Paste `Code.gs` into a new Apps Script project.
2. Run `setup` (grants Sheets/Drive/Gmail access, auto-creates the sheet).
3. Deploy as a **Web App** → copy the `/exec` URL.

### 2. Connect the front-end
Edit **`activity-upload/config.js`** and paste your Web App URL:

```js
window.HCF_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycb..../exec",
  ...
};
```

`config.js` is shared by both the portal and the dashboard.

### 3. Serve the site
It's fully static — host it anywhere:

```bash
# Local preview
cd hcf-erp
python3 -m http.server 8080
# open http://localhost:8080/activity-upload/index.html
```

Production options: **GitHub Pages**, **Netlify**, **Vercel**, **Firebase Hosting**,
or any static host on `hopecommonersfoundation.com`.

> **Demo mode:** if `API_URL` is left blank, the app runs entirely in the browser
> with realistic seed data (submissions are stored in `localStorage`) so you can
> explore every screen before deploying the backend.

---

## 🎨 Design system

| Token | Value |
|---|---|
| Primary | `#0B3D2E` |
| Secondary (Gold) | `#D4AF37` |
| Background | `#F7F8F9` |
| Cards | Glassmorphism · 20px radius · blur · soft shadow |
| Type | Poppins |
| Motion | GSAP + AOS — fade, slide, scale, count-up, hover glow, progress bars |

Fully responsive (desktop / tablet / mobile) with `prefers-reduced-motion` support.

---

## 🔐 Admin access (default — change before launch)

- **Dashboard login:** `admin` / `hcf@2026` → edit in `admin/dashboard.js`.
- **API write token:** `ADMIN_TOKEN` in `Code.gs` **must equal** `ADMIN.token` in `dashboard.js`.

---

## 🔮 Firebase-ready

The UI depends only on a single JSON `API_URL`. To move off Apps Script later,
expose the same request/response contract from a Firebase Cloud Function and
update `API_URL` — no changes to the interface are required.

---

Built with care for the volunteers of **Hope Commoners Foundation**. Keep serving with hope. 💚
