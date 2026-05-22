// =============================================
// js/results.js
// Affichage du podium par catégorie
// =============================================

// ── Init ──────────────────────────────────────────────
function initResults() {
  _buildResultsTabs();
  const firstCat = APP_CONFIG.categories[0];
  if (firstCat) loadResultsCategory(firstCat.id);
}

// ── Onglets ───────────────────────────────────────────
function _buildResultsTabs() {
  const tabs = document.getElementById("resultsTabs");
  if (!tabs) return;
  tabs.innerHTML = APP_CONFIG.categories.map((cat, i) => `
    <button class="tab-btn ${i === 0 ? "active" : ""}"
            data-id="${cat.id}"
            onclick="loadResultsCategory('${cat.id}')">
      ${cat.emoji} ${cat.label.split(" ").slice(0,3).join(" ")}
    </button>`).join("");
}

// ── Chargement résultats d'une catégorie ─────────────
async function loadResultsCategory(catId) {
  document.querySelectorAll("#resultsTabs .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.id === catId)
  );
  showLoader("podiumContainer", "Calcul des résultats…");

  try {
    const photos = await API.getApprovedPhotos(catId);

    // Tri décroissant par votes
    const sorted = (photos || []).sort((a, b) => b.votes - a.votes).slice(0, 3);
    _renderPodium(sorted, catId);

  } catch (err) {
    console.error("Erreur résultats :", err);
    document.getElementById("podiumContainer").innerHTML = `
      <div class="empty-block">
        <div class="empty-icon">⚠️</div>
        <p class="empty-title">Résultats indisponibles</p>
      </div>`;
  }
}

// ── Rendu du podium ───────────────────────────────────
function _renderPodium(top3, catId) {
  const container = document.getElementById("podiumContainer");
  if (!container) return;

  const cat = getCat(catId);

  if (top3.length === 0) {
    container.innerHTML = `
      <div class="empty-block">
        <div class="empty-icon">🏆</div>
        <p class="empty-title">Pas encore de résultats</p>
        <p class="empty-sub">Revenez après les votes !</p>
      </div>`;
    return;
  }

  // Disposition : 2ème | 1er | 3ème
  const order = [
    { rank: 2, medal: "🥈", css: "second", doc: top3[1] },
    { rank: 1, medal: "🥇", css: "first",  doc: top3[0] },
    { rank: 3, medal: "🥉", css: "third",  doc: top3[2] },
  ];

  const podiumHtml = order
    .filter(p => p.doc)
    .map(p => `
      <div class="podium-place ${p.css}">
        <div class="podium-medal">${p.medal}</div>
        <div class="podium-img-wrap">
          <img src="${p.doc.url}" alt="${p.doc.pseudo}" loading="lazy">
        </div>
        <div class="podium-name">${p.doc.pseudo}</div>
        <div class="podium-votes">${p.doc.votes} vote${p.doc.votes != 1 ? "s" : ""}</div>
        <div class="podium-bar"></div>
      </div>`).join("");

  container.innerHTML = `
    <div class="card text-center" style="margin-bottom:1rem">
      <div style="font-size:2rem;margin-bottom:.2rem">${cat.emoji}</div>
      <div style="font-family:var(--font-titre);font-size:1.1rem;font-weight:700">${cat.label}</div>
    </div>
    <div class="podium">${podiumHtml}</div>`;
}
