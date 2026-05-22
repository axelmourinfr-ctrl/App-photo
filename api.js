// =============================================
// js/api.js
// Toutes les communications réseau :
//  - Cloudinary  (upload photos)
//  - Google Apps Script (lecture / écriture Sheets)
// =============================================

// ── Constantes internes ───────────────────────────────
const API = {

  // ── Upload d'une photo vers Cloudinary ─────────────
  // Retourne l'URL publique de la photo
  async uploadPhoto(blob) {
    const { cloudName, uploadPreset } = APP_CONFIG.cloudinary;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const form = new FormData();
    form.append("file",          blob);
    form.append("upload_preset", uploadPreset);
    form.append("folder",        APP_CONFIG.eventEdition); // dossier par édition

    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary erreur ${res.status}`);
    const data = await res.json();
    return data.secure_url; // URL HTTPS publique
  },

  // ── Enregistrer une photo dans Google Sheets ───────
  async savePhoto({ url, category, pseudo, visitorId }) {
    return this._post("addPhoto", {
      url,
      category,
      pseudo:    pseudo || "Anonyme",
      visitorId,
      edition:   APP_CONFIG.eventEdition,
    });
  },

  // ── Récupérer toutes les photos approuvées ─────────
  // Optionnel : filtrer par catégorie
  async getApprovedPhotos(category = null) {
    const params = new URLSearchParams({
      action:  "getPhotos",
      edition: APP_CONFIG.eventEdition,
      status:  "approved",
    });
    if (category) params.set("category", category);
    return this._get(params);
  },

  // ── Récupérer toutes les photos (admin) ────────────
  async getAllPhotos() {
    const params = new URLSearchParams({
      action:  "getPhotos",
      edition: APP_CONFIG.eventEdition,
      status:  "all",
    });
    return this._get(params);
  },

  // ── Modérer une photo (approved / rejected) ────────
  async moderatePhoto(rowIndex, status) {
    return this._post("moderatePhoto", { rowIndex, status });
  },

  // ── Enregistrer un vote ────────────────────────────
  async castVote(rowIndex, visitorId) {
    return this._post("castVote", { rowIndex, visitorId });
  },

  // ── Vérifier si le vote est ouvert ────────────────
  async getVoteStatus() {
    const params = new URLSearchParams({ action: "getVoteStatus" });
    const data = await this._get(params);
    return data.open === true;
  },

  // ── Ouvrir / fermer les votes (admin) ─────────────
  async setVoteStatus(open) {
    return this._post("setVoteStatus", { open });
  },

  // ── Méthodes internes ──────────────────────────────

  async _get(params) {
    const url = `${APP_CONFIG.scriptUrl}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Script erreur ${res.status}`);
    return res.json();
  },

  async _post(action, payload) {
    const res = await fetch(APP_CONFIG.scriptUrl, {
      method:  "POST",
      // Apps Script n'accepte pas Content-Type JSON en no-cors
      // → on encode en texte et on parse côté script
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error(`Script erreur ${res.status}`);
    return res.json();
  },
};
