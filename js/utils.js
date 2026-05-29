// =============================================
// js/utils.js — Fonctions partagées
// =============================================

// ── ID visiteur unique (sans compte) ──────────────────
function getVisitorId() {
  const KEY = "fdf_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(KEY, id);
  }
  return id;
}

// ── Toast ──────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = "default", ms = 3200) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className   = "toast show" + (type !== "default" ? " " + type : "");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

// ── Compression image ──────────────────────────────────
function compressImage(file) {
  const { maxWidthPx, quality } = APP_CONFIG.photo;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload  = ({ target }) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload  = () => {
        let w = img.width, h = img.height;
        if (w > maxWidthPx) { h = Math.round(h * maxWidthPx / w); w = maxWidthPx; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error("Compression échouée")),
          "image/jpeg", quality
        );
      };
      img.src = target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Navigation ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const t = document.getElementById(id);
  if (t) { t.classList.add("active"); window.scrollTo({ top: 0 }); }
  document.querySelectorAll(".nav-item").forEach(b =>
    b.classList.toggle("active", b.dataset.screen === id)
  );
}

// ── Loader ─────────────────────────────────────────────
function showLoader(id, msg = "Chargement…") {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `
    <div class="loader"><div class="spinner"></div>
    <p class="loader-text">${msg}</p></div>`;
}

// ── Clé vote localStorage ─────────────────────────────
function voteKey(eventId, categoryId) {
  return `fdf_voted_${eventId}_${categoryId}`;
}

// ── Pause ──────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
