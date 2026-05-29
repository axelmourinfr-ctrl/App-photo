// =============================================
// js/config.js
// ⚙️  Réglages globaux de l'application
// =============================================

const APP_CONFIG = {

  // ── Nom de l'institution ──────────────────────────────
  appName:    "Foyer Les Tilleuls",
  appEmoji:   "🏠",

  // ── Mot de passe administrateur ──────────────────────
  // ⚠️  Changez ce mot de passe !
  adminPassword: "admin2025",

  // ── Cloudinary ────────────────────────────────────────
  cloudinary: {
    cloudName:    "VOTRE_CLOUD_NAME",
    uploadPreset: "VOTRE_UPLOAD_PRESET",
  },

  // ── Google Apps Script ────────────────────────────────
  scriptUrl: "VOTRE_URL_APPS_SCRIPT",

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
