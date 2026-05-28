// =============================================
// js/upload.js
// Gestion de l'envoi de photo par les visiteurs
// =============================================

let _file      = null;   // Fichier sélectionné
let _category  = null;   // Catégorie choisie
let _sending   = false;  // Verrou anti-double envoi

// ── Init (appelé au démarrage) ────────────────────────
function initUpload() {
  _buildCategoryGrid();
  _bindEvents();
}

// ── Grille des catégories ─────────────────────────────
function _buildCategoryGrid() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = APP_CONFIG.categories.map(cat => `
    <button class="category-btn" data-id="${cat.id}"
            onclick="selectCategory('${cat.id}')"
            aria-label="Catégorie : ${cat.label}">
      <span class="cat-emoji">${cat.emoji}</span>
      <span class="cat-label">${cat.label}</span>
    </button>`).join("");
}

// ── Sélection d'une catégorie ─────────────────────────
function selectCategory(id) {
  _category = id;
  document.querySelectorAll(".category-btn").forEach(b =>
    b.classList.toggle("selected", b.dataset.id === id)
  );
}

// ── Liaison des événements ────────────────────────────
function _bindEvents() {
  const sendBtn = document.getElementById("sendPhotoBtn");
  if (sendBtn) sendBtn.addEventListener("click", _handleSend);
  // Les inputs caméra et galerie sont gérés via handleFileInputChange()
  // appelé directement depuis le HTML (onchange)
}

// ── Appelé depuis les deux inputs (HTML onchange) ─────
function handleFileInputChange(inputEl) {
  if (inputEl.files && inputEl.files[0]) {
    _handleFile(inputEl.files[0]);
  }
}

// ── Traitement du fichier choisi ──────────────────────
function _handleFile(file) {
  // Vérification taille
  if (file.size > APP_CONFIG.photo.maxSizeMB * 1024 * 1024) {
    showToast(`❌ Photo trop lourde (max ${APP_CONFIG.photo.maxSizeMB} Mo).`, "error");
    return;
  }
  _file = file;

  // Prévisualisation
  const reader = new FileReader();
  reader.onload = ({ target }) => {
    document.getElementById("photoPreview").innerHTML = `
      <div class="photo-preview">
        <img src="${target.result}" alt="Votre photo">
        <button class="preview-remove" onclick="removePhoto()" aria-label="Supprimer">✕</button>
      </div>`;
    document.getElementById("uploadZone").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

// ── Suppression de la sélection ───────────────────────
function removePhoto() {
  _file = null;
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("uploadZone").classList.remove("hidden");
  // Réinitialiser les deux inputs
  const cam = document.getElementById("photoInputCamera");
  const gal = document.getElementById("photoInputGallery");
  if (cam) cam.value = "";
  if (gal) gal.value = "";
}

// ── Envoi ─────────────────────────────────────────────
async function _handleSend() {
  if (!_file)     { showToast("📷 Choisissez d'abord une photo.", "error"); return; }
  if (!_category) { showToast("🏷️ Sélectionnez une catégorie.",  "error"); return; }
  if (_sending)   return;

  _sending = true;
  const btn = document.getElementById("sendPhotoBtn");
  btn.disabled    = true;
  btn.textContent = "⏳ Envoi en cours…";

  try {
    // 1. Compression
    const blob = await compressImage(_file);

    // 2. Upload Cloudinary → URL publique
    const photoUrl = await API.uploadPhoto(blob);

    // 3. Enregistrement dans Google Sheets
    const pseudo = document.getElementById("pseudoInput")?.value.trim() || "";
    await API.savePhoto({
      url:       photoUrl,
      category:  _category,
      pseudo:    pseudo || "Anonyme",
      visitorId: getVisitorId(),
    });

    // 4. Succès
    showScreen("screen-success");
    _resetForm();

  } catch (err) {
    console.error("Erreur envoi :", err);
    showToast("❌ Envoi échoué. Vérifiez votre connexion et réessayez.", "error");
  } finally {
    _sending        = false;
    btn.disabled    = false;
    btn.textContent = "🚀 Envoyer ma photo";
  }
}

// ── Remise à zéro du formulaire ───────────────────────
function _resetForm() {
  _file     = null;
  _category = null;
  document.getElementById("photoPreview").innerHTML = "";
  document.getElementById("uploadZone").classList.remove("hidden");
  const cam = document.getElementById("photoInputCamera");
  const gal = document.getElementById("photoInputGallery");
  if (cam) cam.value = "";
  if (gal) gal.value = "";
  const pseudo = document.getElementById("pseudoInput");
  if (pseudo) pseudo.value = "";
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("selected"));
}
