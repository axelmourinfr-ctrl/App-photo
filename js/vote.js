// =============================================
// js/vote.js
// Système de vote — 1 vote par catégorie par appareil
// =============================================

let _currentVoteCat  = null;
let _voteRefreshTimer = null;

// ── Init ──────────────────────────────────────────────
function initVote() {
  _buildVoteTabs();
  const firstCat = APP_CONFIG.categories[0];
  if (firstCat) loadVoteCategory(firstCat.id);
}

// ── Onglets de catégories ─────────────────────────────
function _buildVoteTabs() {
  const tabs = document.getElementById("voteTabs");
  if (!tabs) return;
  tabs.innerHTML = APP_CONFIG.categories.map((cat, i) => `
    <button class="tab-btn ${i === 0 ? "active" : ""}"
            data-id="${cat.id}"
            onclick="loadVoteCategory('${cat.id}')">
      ${cat.emoji} ${cat.label.split(" ").slice(0,3).join(" ")}
    </button>`).join("");
}

// ── Chargement des photos d'une catégorie ────────────
async function loadVoteCategory(catId) {
  _currentVoteCat = catId;
  clearTimeout(_voteRefreshTimer);

  // Onglet actif
  document.querySelectorAll("#voteTabs .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.id === catId)
  );

  showLoader("photosGrid", "Chargement des photos…");

  try {
    // Vérifier si votes ouverts
    const open = await API.getVoteStatus();
    if (!open) {
      document.getElementById("photosGrid").innerHTML = `
        <div class="empty-block" style="grid-column:1/-1">
          <div class="empty-icon">🔒</div>
          <p class="empty-title">Votes pas encore ouverts</p>
          <p class="empty-sub">L'organisateur les ouvrira bientôt !</p>
        </div>`;
      return;
    }

    const photos = await API.getApprovedPhotos(catId);
    _renderVoteGrid(photos);

    // Rafraîchissement auto toutes les 30s
    _voteRefreshTimer = setTimeout(() => loadVoteCategory(catId), 30000);

  } catch (err) {
    console.error("Erreur vote :", err);
    document.getElementById("photosGrid").innerHTML = `
      <div class="empty-block" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <p class="empty-title">Impossible de charger les photos</p>
        <p class="empty-sub">Vérifiez votre connexion</p>
      </div>`;
  }
}

// ── Affichage de la grille ────────────────────────────
function _renderVoteGrid(photos) {
  const grid = document.getElementById("photosGrid");
  if (!grid) return;

  if (!photos || photos.length === 0) {
    grid.innerHTML = `
      <div class="empty-block" style="grid-column:1/-1">
        <div class="empty-icon">📷</div>
        <p class="empty-title">Pas encore de photos<br>dans cette catégorie</p>
      </div>`;
    return;
  }

  const myVotedId = localStorage.getItem(voteKey(_currentVoteCat));

  grid.innerHTML = photos.map(photo => {
    const isVoted = myVotedId === String(photo.rowIndex);
    return `
      <div class="photo-card ${isVoted ? "voted" : ""}"
           onclick="castVote(${photo.rowIndex}, this)"
           role="button" tabindex="0"
           aria-label="Voter pour ${photo.pseudo}">
        <img src="${photo.url}" alt="${photo.pseudo}" loading="lazy">
        <div class="photo-card-footer">
          <span class="photo-name">${photo.pseudo}</span>
          <span class="vote-heart">${isVoted ? "❤️" : "🤍"}</span>
        </div>
        <div class="vote-count">${photo.votes} vote${photo.votes != 1 ? "s" : ""}</div>
      </div>`;
  }).join("");
}

// ── Enregistrer un vote ───────────────────────────────
async function castVote(rowIndex, cardEl) {
  const key       = voteKey(_currentVoteCat);
  const alreadyId = localStorage.getItem(key);

  if (alreadyId) {
    const msg = alreadyId === String(rowIndex)
      ? "❤️ Vous avez déjà voté pour cette photo !"
      : "☝️ Un seul vote par catégorie — choisissez bien !";
    showToast(msg); return;
  }

  // Feedback visuel immédiat
  if (cardEl) {
    cardEl.classList.add("voted");
    const h = cardEl.querySelector(".vote-heart");
    if (h) h.textContent = "❤️";
  }

  try {
    await API.castVote(rowIndex, getVisitorId());
    localStorage.setItem(key, String(rowIndex));
    showToast("❤️ Votre vote est enregistré !", "success");
    // Rechargement discret pour mettre à jour les compteurs
    setTimeout(() => loadVoteCategory(_currentVoteCat), 1500);
  } catch (err) {
    console.error("Erreur vote :", err);
    // Rollback visuel
    if (cardEl) {
      cardEl.classList.remove("voted");
      const h = cardEl.querySelector(".vote-heart");
      if (h) h.textContent = "🤍";
    }
    showToast("❌ Vote échoué. Réessayez.", "error");
  }
}

// ── Nettoyage ─────────────────────────────────────────
function cleanupVote() {
  clearTimeout(_voteRefreshTimer);
}
