// =============================================
// js/upload.js — Envoi de photo
// =============================================

let _file     = null;
let _category = null;
let _sending  = false;

function initUpload() {
  if (!CURRENT_EVENT) return;
  const isConcours = CURRENT_EVENT.mode === "concours";

  // Titre et sous-titre selon mode
  const title = document.getElementById("uploadScreenTitle");
  const sub   = document.getElementById("uploadScreenSub");
  const catSection = document.getElementById("catSection");
  if (title) title.textContent = isConcours ? "📷 Ma photo" : "📷 Partager une photo";
  if (sub)   sub.textContent   = isConcours
    ? "Choisissez une photo et une catégorie"
    : "Choisissez une photo depuis votre galerie";

  // Section catégorie visible seulement en mode concours
  if (catSection) catSection.style.display = isConcours ? "block" : "none";

  // Construire la grille de catégories si concours
  if (isConcours) _buildCategoryGrid();

  // Réinitialiser la sélection
  _file = null; _category = null;
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("uploadZone").classList.remove("hidden");

  // Bind bouton envoi
  const btn = document.getElementById("sendPhotoBtn");
  if (btn) btn.onclick = _handleSend;
}

// ── Grille catégories ──────────────────────────────────
function _buildCategoryGrid() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid || !CURRENT_EVENT?.categories) return;
  const cats = CURRENT_EVENT.categories;
  grid.innerHTML = cats.map(cat => `
    <button class="category-btn" data-id="${cat.id}"
            onclick="selectCategory('${cat.id}')">
      <span class="cat-emoji">${cat.emoji}</span>
      <span class="cat-label">${cat.label}</span>
    </button>`).join("");
}

function selectCategory(id) {
  _category = id;
  document.querySelectorAll(".category-btn").forEach(b =>
    b.classList.toggle("selected", b.dataset.id === id)
  );
}

// ── Inputs fichier ─────────────────────────────────────
function handleFileInputChange(inputEl) {
  if (inputEl.files && inputEl.files[0]) _handleFile(inputEl.files[0]);
}

function _handleFile(file) {
  if (file.size > APP_CONFIG.photo.maxSizeMB * 1024 * 1024) {
    showToast(`❌ Photo trop lourde (max ${APP_CONFIG.photo.maxSizeMB} Mo).`, "error");
    return;
  }
  _file = file;
  const reader = new FileReader();
  reader.onload = ({ target }) => {
    document.getElementById("photoPreview").innerHTML = `
      <div class="photo-preview">
        <img src="${target.result}" alt="Votre photo">
        <button class="preview-remove" onclick="removePhoto()">✕</button>
      </div>`;
    document.getElementById("uploadZone").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  _file = null;
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("uploadZone").classList.remove("hidden");
  ["photoInputCamera", "photoInputGallery"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
}

// ── Envoi ──────────────────────────────────────────────
async function _handleSend() {
  if (!_file) { showToast("📷 Choisissez d'abord une photo.", "error"); return; }
  const isConcours = CURRENT_EVENT?.mode === "concours";
  if (isConcours && !_category) {
    showToast("🏷️ Sélectionnez une catégorie.", "error"); return;
  }
  if (_sending) return;

  _sending = true;
  const btn = document.getElementById("sendPhotoBtn");
  btn.disabled = true; btn.textContent = "⏳ Envoi en cours…";

  try {
    const blob     = await compressImage(_file);
    const photoUrl = await API.uploadPhoto(blob, CURRENT_EVENT.id);
    const pseudo   = document.getElementById("pseudoInput")?.value.trim() || "";

    await API.savePhoto({
      url:       photoUrl,
      eventId:   CURRENT_EVENT.id,
      category:  _category || "general",
      pseudo:    pseudo || "Anonyme",
      visitorId: getVisitorId(),
    });

    showScreen("screen-success");
    _resetForm();
  } catch (err) {
    console.error("Erreur envoi :", err);
    showToast("❌ Envoi échoué. Vérifiez votre connexion.", "error");
  } finally {
    _sending = false; btn.disabled = false; btn.textContent = "🚀 Envoyer ma photo";
  }
}

function _resetForm() {
  _file = null; _category = null;
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("uploadZone").classList.remove("hidden");
  ["photoInputCamera","photoInputGallery"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const pseudo = document.getElementById("pseudoInput");
  if (pseudo) pseudo.value = "";
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("selected"));
}
