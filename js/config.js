// =============================================
// js/config.js
// ⚙️  Réglages de l'événement — modifiez ici !
// =============================================

const APP_CONFIG = {

  // ── Informations de l'événement ──────────────────────
  eventName:     "Fête des Familles",
  eventSubtitle: "Foyer Les Tilleuls • 2025",
  eventEmoji:    "🎉",

  // ── Identifiant de l'édition ──────────────────────────
  // Utilisé comme nom d'onglet dans Google Sheets
  // → Changez à chaque événement pour garder une archive séparée
  // Exemples : "fete-2025", "noel-2025", "sortie-piscine-juin"
  eventEdition:  "fete-2025",

  // ── MODE DE L'APPLICATION ─────────────────────────────
  //
  //  "concours" → Catégories + vote + podium
  //               (ex: Fête des familles avec concours photo)
  //
  //  "collecte" → Pas de vote, juste centraliser les photos
  //               Les catégories deviennent des "tags" libres
  //               (ex: Repas de Noël, Sortie piscine, etc.)
  //
  mode: "concours",

  // ── Mot de passe administrateur ──────────────────────
  // ⚠️  Changez ce mot de passe avant chaque événement !
  adminPassword: "admin2025",

  // ── Catégories / Tags ─────────────────────────────────
  // En mode "concours" → catégories du concours photo
  // En mode "collecte" → tags pour organiser les photos
  //
  // Pour modifier : changez uniquement "emoji" et "label"
  // Ne changez pas les "id" (identifiants techniques)
  categories: [
    { id: "statue",  emoji: "🗿", label: "Statue"            },
    { id: "rouge",   emoji: "🔴", label: "Touche de rouge"   },
    { id: "coeur",   emoji: "❤️", label: "Cœur"              },
    { id: "drole",   emoji: "😂", label: "Drôle"             },
    { id: "pose",    emoji: "🤳", label: "Tous la même pose" },
  ],

  // ── Cloudinary (stockage des photos) ─────────────────
  cloudinary: {
    cloudName:    "VOTRE_CLOUD_NAME",
    uploadPreset: "VOTRE_UPLOAD_PRESET",
  },

  // ── Google Apps Script (base de données) ─────────────
  scriptUrl: "VOTRE_URL_APPS_SCRIPT",

  // ── Paramètres photo ──────────────────────────────────
  photo: {
    maxWidthPx: 1200,
    quality:    0.82,
    maxSizeMB:  10,
    accepted:   "image/*",
  },

  // ── Diaporama TV ──────────────────────────────────────
  slideshow: {
    intervalMs:   5000,
    transitionMs:  700,
  },
};
