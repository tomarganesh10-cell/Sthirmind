/* =====================================================================
   HCF ERP — Front-end Configuration
   ---------------------------------------------------------------------
   Set API_URL to the /exec URL of your deployed Google Apps Script
   Web App (see hcf-erp/apps-script/README.md for deployment steps).

   Example:
   window.HCF_CONFIG = {
     API_URL: "https://script.google.com/macros/s/AKfycb.../exec",
     ...
   };
   ===================================================================== */
window.HCF_CONFIG = {
  // 🔗 Paste your deployed Apps Script Web App URL here:
  API_URL: "",

  // Organisation
  ORG_NAME: "Hope Commoners Foundation",
  ORG_DOMAIN: "hopecommonersfoundation.com",

  // Upload limits (kept in sync with Apps Script)
  MAX_PHOTOS: 30,
  MAX_FILE_MB: 10,
  IMAGE_MAX_DIMENSION: 1600,   // px — longest edge after compression
  IMAGE_QUALITY: 0.82,         // JPEG quality for compressed images

  // Chapters (single source of truth)
  CHAPTERS: ["Agra", "Ghaziabad", "Future", "Chandigarh", "Noida", "Delhi"],

  // If API_URL is empty the app runs in DEMO mode (no network calls)
  get DEMO_MODE() { return !this.API_URL; }
};
