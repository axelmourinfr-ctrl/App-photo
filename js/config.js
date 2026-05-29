// =============================================
// js/config.js
// ⚙️  Réglages globaux de l'application
// =============================================

const APP_CONFIG = {

  // ── Nom de l'institution ──────────────────────────────
  appName:    "Foyer Le Closeau",
  appEmoji:   "🏠",

  // ── Mot de passe administrateur ──────────────────────
  // ⚠️  Changez ce mot de passe !
  adminPassword: "admin2026",

  // ── Cloudinary ────────────────────────────────────────
  cloudinary: {
    cloudName:    "dclk8ygjj",
    uploadPreset: "fete_familles",
  },

  // ── Google Apps Script ────────────────────────────────
  scriptUrl: "https://script.google.com/macros/s/AKfycbys-xRjmU9g3L6FweR3dxYDfAMWF1WqZh_CzZbh29gEILS2ih8yqOOGM-uJogo-eFu6GQ/exec",

  // ── Paramètres photo ──────────────────────────────────
  photo: {
    maxWidthPx: 1200,
    quality:    0.82,
    maxSizeMB:  10,
  },

  // ── Diaporama ─────────────────────────────────────────
  slideshow: {
    intervalMs:   5000,
    transitionMs:  700,
  },
};
