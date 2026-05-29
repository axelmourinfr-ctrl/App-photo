// =============================================
// js/admin.js
// Espace administrateur
// =============================================

let _voteOpen        = false;
let _adminRefresh    = null;

// ── Connexion ─────────────────────────────────────────
function handleAdminLogin() {
  const input = document.getElementById("adminPasswordInput");
  if (!input) return;

  if (input.value === APP_CONFIG.adminPassword) {
    document.getElementById("adminLoginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    input.value = "";
    _loadAdminPanel();
  } else {
    showToast("❌ Mot de passe incorrect.", "error");
    input.value = "";
    input.focus();
  }
}

// ── Chargement du panel ───────────────────────────────
async function _loadAdminPanel() {
  _buildDownloadCatBtns(); // Injection des boutons de catégorie

  try {
    _voteOpen = await API.getVoteStatus();
    _updateVoteBtn();
  } catch { _voteOpen = false; }

  await _refreshAdminPhotos();
}

// ── Rafraîchissement de la liste photos ──────────────
async function _refreshAdminPhotos() {
  clearTimeout(_adminRefresh);
  showLoader("adminPhotoList", "Chargement des photos…");

  try {
    const photos = await API.getAllPhotos();
    _renderAdminStats(photos);
    _renderAdminList(photos);
  } catch (err) {
    console.error("Erreur admin :", err);
    document.getElementById("adminPhotoList").innerHTML =
      `<p style="text-align:center;color:var(--texte-doux);padding:1.5rem">
        Impossible de charger les photos.
      </p>`;
  }

  // Auto-refresh toutes les 20s
  _adminRefresh = setTimeout(_refreshAdminPhotos, 20000);
}

// ── Statistiques ──────────────────────────────────────
function _renderAdminStats(photos) {
  const el = document.getElementById("adminStats");
  if (!el) return;
  const total    = photos.length;
  const pending  = photos.filter(p => p.status === "pending").length;
  const approved = photos.filter(p => p.status === "approved").length;
  const rejected = photos.filter(p => p.status === "rejected").length;

  el.innerHTML = `
    <div class="admin-stat">
      <div class="admin-stat-num">${total}</div>
      <div class="admin-stat-label">📷 Total</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat-num" style="color:var(--orange)">${pending}</div>
      <div class="admin-stat-label">⏳ En attente</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat-num" style="color:var(--vert)">${approved}</div>
      <div class="admin-stat-label">✅ Approuvées</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat-num" style="color:var(--rouge)">${rejected}</div>
      <div class="admin-stat-label">❌ Refusées</div>
    </div>`;
}

// ── Liste de modération ───────────────────────────────
function _renderAdminList(photos) {
  const el = document.getElementById("adminPhotoList");
  if (!el) return;

  if (photos.length === 0) {
    el.innerHTML = `
      <p style="text-align:center;color:var(--texte-doux);padding:2rem;font-weight:600">
        Aucune photo reçue pour l'instant.
      </p>`;
    return;
  }

  const statusMap = {
    pending:  { label: "En attente", css: "status-pending"  },
    approved: { label: "Approuvée",  css: "status-approved" },
    rejected: { label: "Refusée",    css: "status-rejected" },
  };

  el.innerHTML = photos.map(photo => {
    const cat = getCat(photo.category);
    const s   = statusMap[photo.status] || statusMap.pending;
    return `
      <div class="admin-photo-item">
        <img src="${photo.url}" alt="${photo.pseudo}" loading="lazy">
        <div class="admin-photo-info">
          <div class="admin-photo-name">${photo.pseudo}</div>
          <div class="admin-photo-cat">${cat.emoji} ${cat.label}</div>
          <span class="status-badge ${s.css}">${s.label}</span>
          <div class="vote-count" style="margin-top:.2rem">${photo.votes} vote${photo.votes != 1 ? "s" : ""}</div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-ok"
                  onclick="moderatePhoto(${photo.rowIndex}, 'approved')"
                  title="Approuver">✅</button>
          <button class="admin-btn admin-btn-del"
                  onclick="moderatePhoto(${photo.rowIndex}, 'rejected')"
                  title="Refuser">🚫</button>
          <button class="admin-btn admin-btn-trash"
                  onclick="deletePhoto(${photo.rowIndex}, '${photo.url}')"
                  title="Supprimer définitivement">🗑️</button>
        </div>
      </div>`;
  }).join("");
}

// ── Modérer une photo ─────────────────────────────────
async function moderatePhoto(rowIndex, status) {
  try {
    await API.moderatePhoto(rowIndex, status);
    showToast(status === "approved" ? "✅ Photo approuvée !" : "🗑️ Photo refusée.", "success");
    await _refreshAdminPhotos();
  } catch (err) {
    console.error("Erreur modération :", err);
    showToast("❌ Action impossible.", "error");
  }
}

// ── Supprimer définitivement une photo ───────────────
async function deletePhoto(rowIndex, photoUrl) {
  // Confirmation avant suppression
  const ok = window.confirm(
    "⚠️ Supprimer définitivement cette photo ?\n\nElle sera retirée de l'app et de Google Sheets.\nCette action est irréversible."
  );
  if (!ok) return;

  try {
    await API.deletePhoto(rowIndex);
    showToast("🗑️ Photo supprimée définitivement.", "success");
    await _refreshAdminPhotos();
  } catch (err) {
    console.error("Erreur suppression :", err);
    showToast("❌ Suppression impossible.", "error");
  }
}

// ── Toggle votes ──────────────────────────────────────
async function toggleVotes() {
  _voteOpen = !_voteOpen;
  _updateVoteBtn();
  try {
    await API.setVoteStatus(_voteOpen);
    showToast(_voteOpen ? "🟢 Votes ouverts !" : "🔒 Votes fermés.", _voteOpen ? "success" : "default");
  } catch (err) {
    console.error("Erreur toggle votes :", err);
    _voteOpen = !_voteOpen; // rollback
    _updateVoteBtn();
    showToast("❌ Impossible de changer le statut.", "error");
  }
}

function _updateVoteBtn() {
  const btn = document.getElementById("voteToggleBtn");
  if (!btn) return;
  if (_voteOpen) {
    btn.textContent = "🔴 Fermer les votes";
    btn.className   = "btn btn-secondary";
  } else {
    btn.textContent = "🟢 Ouvrir les votes";
    btn.className   = "btn btn-success";
  }
}

// ── Déconnexion ───────────────────────────────────────
function logoutAdmin() {
  clearTimeout(_adminRefresh);
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("adminLoginBox").classList.remove("hidden");
  showToast("👋 Déconnecté.");
}

// ══════════════════════════════════════════════════════
// TÉLÉCHARGEMENT DES PHOTOS
// ══════════════════════════════════════════════════════

let _downloadCat = "all"; // Catégorie sélectionnée pour le téléchargement

// ── Construction des boutons de catégorie ─────────────
function _buildDownloadCatBtns() {
  const container = document.getElementById("downloadCatBtns");
  if (!container) return;

  // On garde le bouton "Toutes" déjà en HTML, on ajoute les catégories
  const catBtns = APP_CONFIG.categories.map(cat => `
    <button class="tab-btn" data-dlcat="${cat.id}"
            onclick="selectDownloadCat('${cat.id}', this)">
      ${cat.emoji} ${cat.label.split(" ").slice(0,2).join(" ")}
    </button>`).join("");

  // Ajouter après le bouton "Toutes"
  container.innerHTML =
    `<button class="tab-btn active" data-dlcat="all" onclick="selectDownloadCat('all', this)">
       🗂️ Toutes
     </button>` + catBtns;
}

// ── Sélection catégorie de téléchargement ────────────
function selectDownloadCat(catId, btnEl) {
  _downloadCat = catId;
  document.querySelectorAll("#downloadCatBtns .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.dlcat === catId)
  );
}

// ── Lancement du téléchargement ───────────────────────
async function downloadPhotos() {
  const btn = document.getElementById("downloadBtn");
  btn.disabled = true;

  showToast("⏳ Récupération des photos…");

  try {
    // 1. Récupération depuis Google Sheets
    let photos = await API.getAllPhotos();
    photos = photos.filter(p => p.status === "approved");

    // Filtrage par catégorie si besoin
    if (_downloadCat !== "all") {
      photos = photos.filter(p => p.category === _downloadCat);
    }

    if (photos.length === 0) {
      showToast("⚠️ Aucune photo approuvée à télécharger.", "error");
      btn.disabled = false;
      return;
    }

    // 2. Affichage barre de progression
    const progressWrap  = document.getElementById("downloadProgress");
    const progressBar   = document.getElementById("downloadProgressBar");
    const progressLabel = document.getElementById("downloadProgressLabel");
    const progressCount = document.getElementById("downloadProgressCount");
    progressWrap.classList.remove("hidden");

    // 3. Téléchargement photo par photo
    // On utilise un délai entre chaque pour ne pas saturer le navigateur
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const cat   = getCat(photo.category);

      // Mise à jour UI
      const pct = Math.round(((i) / photos.length) * 100);
      progressBar.style.width   = pct + "%";
      progressLabel.textContent = `Téléchargement…`;
      progressCount.textContent = `${i + 1} / ${photos.length}`;

      try {
        await _downloadSinglePhoto(photo, i + 1, cat);
      } catch (e) {
        console.warn(`Photo ${i + 1} échouée :`, e);
        // On continue malgré l'erreur sur une photo
      }

      // Petite pause pour ne pas bloquer l'interface
      await _sleep(300);
    }

    // 4. Terminé
    progressBar.style.width   = "100%";
    progressLabel.textContent = "✅ Terminé !";
    progressCount.textContent = `${photos.length} / ${photos.length}`;

    showToast(`✅ ${photos.length} photo${photos.length > 1 ? "s" : ""} téléchargée${photos.length > 1 ? "s" : ""} !`, "success", 4000);

    // Masquer la barre après 3s
    setTimeout(() => {
      progressWrap.classList.add("hidden");
      progressBar.style.width = "0%";
    }, 3000);

  } catch (err) {
    console.error("Erreur téléchargement :", err);
    showToast("❌ Erreur lors du téléchargement.", "error");
  } finally {
    btn.disabled = false;
  }
}

// ── Téléchargement d'une photo individuelle ───────────
// Nom de fichier : 001_famille_FamilleMartin.jpg
async function _downloadSinglePhoto(photo, index, cat) {
  // Fetch de l'image via proxy (nécessaire pour CORS Cloudinary)
  const response = await fetch(photo.url);
  if (!response.ok) throw new Error("Fetch échoué");
  const blob = await response.blob();

  // Construction du nom de fichier lisible
  const paddedIndex = String(index).padStart(3, "0");
  const cleanPseudo = (photo.pseudo || "Anonyme")
    .replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, "")  // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 30);
  const catId    = cat.id || "autre";
  const fileName = `${paddedIndex}_${catId}_${cleanPseudo}.jpg`;

  // Création d'un lien temporaire pour déclencher le téléchargement
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libération mémoire
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Pause utilitaire ──────────────────────────────────
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
