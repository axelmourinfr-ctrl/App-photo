// =============================================
// js/vote.js — Système de vote (mode concours)
// =============================================

let _currentVoteCat  = null;
let _voteRefreshTimer = null;

function initVote() {
  if (!CURRENT_EVENT) return;
  _buildVoteTabs();
  const cats = CURRENT_EVENT.categories || [];
  if (cats.length) loadVoteCategory(cats[0].id);
}

function _buildVoteTabs() {
  const tabs = document.getElementById("voteTabs");
  if (!tabs || !CURRENT_EVENT?.categories) return;
  tabs.innerHTML = CURRENT_EVENT.categories.map((cat, i) => `
    <button class="tab-btn ${i === 0 ? "active" : ""}" data-id="${cat.id}"
            onclick="loadVoteCategory('${cat.id}')">
      ${cat.emoji} ${cat.label}
    </button>`).join("");
}

async function loadVoteCategory(catId) {
  _currentVoteCat = catId;
  clearTimeout(_voteRefreshTimer);
  document.querySelectorAll("#voteTabs .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.id === catId)
  );
  showLoader("photosGrid", "Chargement des photos…");

  try {
    const statusData = await API.getVoteStatus(CURRENT_EVENT.id);
    if (!statusData.open) {
      document.getElementById("photosGrid").innerHTML = `
        <div class="empty-block" style="grid-column:1/-1">
          <div class="empty-icon">🔒</div>
          <p class="empty-title">Votes pas encore ouverts</p>
          <p class="empty-sub">L'organisateur les ouvrira bientôt !</p>
        </div>`;
      return;
    }
    const photos = await API.getPhotos(CURRENT_EVENT.id, "approved", catId);
    _renderVoteGrid(photos);
    _voteRefreshTimer = setTimeout(() => loadVoteCategory(catId), 30000);
  } catch (err) {
    console.error("Erreur vote :", err);
    document.getElementById("photosGrid").innerHTML = `
      <div class="empty-block" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <p class="empty-title">Impossible de charger les photos</p>
      </div>`;
  }
}

function _renderVoteGrid(photos) {
  const grid = document.getElementById("photosGrid");
  if (!grid) return;
  if (!photos?.length) {
    grid.innerHTML = `
      <div class="empty-block" style="grid-column:1/-1">
        <div class="empty-icon">📷</div>
        <p class="empty-title">Pas encore de photos dans cette catégorie</p>
      </div>`;
    return;
  }
  const myVotedId = localStorage.getItem(voteKey(CURRENT_EVENT.id, _currentVoteCat));
  grid.innerHTML = photos.map(photo => {
    const isVoted = myVotedId === String(photo.rowIndex);
    return `
      <div class="photo-card ${isVoted ? "voted" : ""}"
           onclick="castVote(${photo.rowIndex}, this)" role="button" tabindex="0">
        <img src="${photo.url}" alt="${photo.pseudo}" loading="lazy">
        <div class="photo-card-footer">
          <span class="photo-name">${photo.pseudo}</span>
          <span class="vote-heart">${isVoted ? "❤️" : "🤍"}</span>
        </div>
        <div class="vote-count">${photo.votes} vote${photo.votes != 1 ? "s" : ""}</div>
      </div>`;
  }).join("");
}

async function castVote(rowIndex, cardEl) {
  const key       = voteKey(CURRENT_EVENT.id, _currentVoteCat);
  const alreadyId = localStorage.getItem(key);
  if (alreadyId) {
    showToast(alreadyId === String(rowIndex)
      ? "❤️ Vous avez déjà voté pour cette photo !"
      : "☝️ Un seul vote par catégorie !");
    return;
  }
  if (cardEl) { cardEl.classList.add("voted"); const h = cardEl.querySelector(".vote-heart"); if (h) h.textContent = "❤️"; }
  try {
    await API.castVote(rowIndex, getVisitorId());
    localStorage.setItem(key, String(rowIndex));
    showToast("❤️ Vote enregistré !", "success");
    setTimeout(() => loadVoteCategory(_currentVoteCat), 1500);
  } catch (err) {
    if (cardEl) { cardEl.classList.remove("voted"); const h = cardEl.querySelector(".vote-heart"); if (h) h.textContent = "🤍"; }
    showToast("❌ Vote échoué.", "error");
  }
}

function cleanupVote() { clearTimeout(_voteRefreshTimer); }
