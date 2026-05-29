// =============================================
// js/utils.js
// Fonctions utilitaires partagées dans toute l'app
// =============================================

// ── Identifiant visiteur (sans compte) ───────────────
// Stocké en localStorage — permet d'éviter les votes multiples
function getVisitorId() {
  const KEY = "fdf_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(KEY, id);
  }
  return id;
}

// ── Toast (message temporaire en bas d'écran) ────────
let _toastTimer = null;

function showToast(message, type = "default", durationMs = 3200) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className   = "toast show" + (type !== "default" ? " " + type : "");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), durationMs);
}

// ── Compression image (canvas) ───────────────────────
// Retourne un Blob JPEG compressé
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
          "image/jpeg",
          quality
        );
      };
      img.src = target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Navigation entre écrans ───────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) { target.classList.add("active"); window.scrollTo({ top: 0 }); }

  document.querySelectorAll(".nav-item").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.screen === id)
  );
}

// ── Spinner de chargement ─────────────────────────────
function showLoader(containerId, msg = "Chargement…") {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <p class="loader-text">${msg}</p>
    </div>`;
}

// ── Helpers catégories ────────────────────────────────
function getCat(id) {
  return APP_CONFIG.categories.find(c => c.id === id) || { emoji: "📷", label: id };
}

// ── Clé localStorage pour un vote dans une catégorie ─
function voteKey(categoryId) {
  return `fdf_voted_${APP_CONFIG.eventEdition}_${categoryId}`;
}
