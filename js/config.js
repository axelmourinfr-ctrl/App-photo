// =============================================
// js/config.js
// ⚙️  Réglages de l'événement — modifiez ici !
// =============================================

const APP_CONFIG = {

  // ── Informations de l'événement ──────────────────────
  eventName:     "Fête des Familles",
  eventSubtitle: "Foyer Le Closeau • 2026",
  eventEmoji:    "🎉",

  // ── Identifiant de l'édition (utilisé comme nom d'onglet dans Sheets)
  // Changez à chaque événement pour garder une archive séparée
  eventEdition:  "fete-2026",

  // ── Mot de passe administrateur ──────────────────────
  // ⚠️  Changez ce mot de passe avant le déploiement !
  adminPassword: "admin2026",

  // ── Catégories du concours ────────────────────────────
  categories: [
    { id: "famille",     emoji: "👨‍👩‍👧‍👦", label: "Plus belle photo de famille" },
    { id: "drole",       emoji: "😂",      label: "Photo la plus drôle"          },
    { id: "deguisement", emoji: "🎭",      label: "Meilleur déguisement"         },
    { id: "moment",      emoji: "✨",      label: "Plus beau moment"             },
    { id: "duo",         emoji: "🤝",      label: "Duo le plus complice"         },
  ],

  // ── Cloudinary (stockage des photos) ─────────────────
  // 1. Créez un compte sur cloudinary.com (gratuit)
  // 2. Tableau de bord → cherchez "Cloud name"
  // 3. Créez un "Upload Preset" non signé (voir README)
  cloudinary: {
    cloudName:    "dclk8ygjj",
    uploadPreset: "closeau", 
  },

  // ── Google Apps Script (base de données) ─────────────
  // URL du script déployé (voir README étape 3)
  scriptUrl: "https://script.google.com/macros/s/AKfycbys-xRjmU9g3L6FweR3dxYDfAMWF1WqZh_CzZbh29gEILS2ih8yqOOGM-uJogo-eFu6GQ/exec",

  // ── Paramètres photo ──────────────────────────────────
  photo: {
    maxWidthPx: 1200,    // Largeur max après compression
    quality:    0.82,    // Qualité JPEG (0.0 → 1.0)
    maxSizeMB:  10,      // Taille max acceptée (Mo)
    accepted:   "image/*",
  },

  // ── Diaporama TV ──────────────────────────────────────
  slideshow: {
    intervalMs:   5000,  // Durée par photo en ms
    transitionMs:  700,  // Durée de la transition en ms
  },
};
