// =============================================
// js/api.js
// Communications réseau : Cloudinary + Apps Script
// =============================================

const API = {

  // ── Upload photo vers Cloudinary ───────────────────────
  async uploadPhoto(blob, folder) {
    const { cloudName, uploadPreset } = APP_CONFIG.cloudinary;
    const url  = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const form = new FormData();
    form.append("file",          blob);
    form.append("upload_preset", uploadPreset);
    form.append("folder",        folder || "general");

    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
    const data = await res.json();
    return data.secure_url;
  },

  // ── Événements ─────────────────────────────────────────
  async getEvents() {
    return this._get({ action: "getEvents" });
  },

  async submitNewEvent(event) {
    return this._post("createEvent", event);
  },

  async updateEvent(eventId, fields) {
    return this._post("updateEvent", { eventId, ...fields });
  },

  async deleteEvent(eventId) {
    return this._post("deleteEvent", { eventId });
  },

  // ── Photos ─────────────────────────────────────────────
  async savePhoto({ url, eventId, category, pseudo, visitorId }) {
    return this._post("addPhoto", { url, eventId, category, pseudo, visitorId });
  },

  async getPhotos(eventId, status = "approved", category = null) {
    const p = { action: "getPhotos", eventId, status };
    if (category) p.category = category;
    return this._get(p);
  },

  async getAllPhotos(eventId) {
    return this._get({ action: "getPhotos", eventId, status: "all" });
  },

  async moderatePhoto(rowIndex, status) {
    return this._post("moderatePhoto", { rowIndex, status });
  },

  async deletePhoto(rowIndex) {
    return this._post("deletePhoto", { rowIndex });
  },

  async castVote(rowIndex, visitorId) {
    return this._post("castVote", { rowIndex, visitorId });
  },

  // ── Statut votes ───────────────────────────────────────
  async getVoteStatus(eventId) {
    return this._get({ action: "getVoteStatus", eventId });
  },

  async setVoteStatus(eventId, open) {
    return this._post("setVoteStatus", { eventId, open });
  },

  // ── Internes ───────────────────────────────────────────
  async _get(params) {
    const qs  = new URLSearchParams(params).toString();
    const res = await fetch(`${APP_CONFIG.scriptUrl}?${qs}`);
    if (!res.ok) throw new Error(`Script ${res.status}`);
    return res.json();
  },

  async _post(action, payload) {
    const res = await fetch(APP_CONFIG.scriptUrl, {
      method: "POST",
      body:   JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error(`Script ${res.status}`);
    return res.json();
  },
};
