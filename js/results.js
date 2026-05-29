// =============================================
// js/results.js — Podium par catégorie
// =============================================

function initResults() {
  if (!CURRENT_EVENT) return;
  _buildResultsTabs();
  const cats = CURRENT_EVENT.categories || [];
  if (cats.length) loadResultsCategory(cats[0].id);
}

function _buildResultsTabs() {
  const tabs = document.getElementById("resultsTabs");
  if (!tabs || !CURRENT_EVENT?.categories) return;
  tabs.innerHTML = CURRENT_EVENT.categories.map((cat, i) => `
    <button class="tab-btn ${i === 0 ? "active" : ""}" data-id="${cat.id}"
            onclick="loadResultsCategory('${cat.id}')">
      ${cat.emoji} ${cat.label}
    </button>`).join("");
}

async function loadResultsCategory(catId) {
  document.querySelectorAll("#resultsTabs .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.id === catId)
  );
  showLoader("podiumContainer", "Calcul des résultats…");
  try {
    const photos = await API.getPhotos(CURRENT_EVENT.id, "approved", catId);
    const top3   = (photos || []).sort((a,b) => b.votes - a.votes).slice(0, 3);
    _renderPodium(top3, catId);
  } catch (err) {
    document.getElementById("podiumContainer").innerHTML = `
      <div class="empty-block"><div class="empty-icon">⚠️</div>
      <p class="empty-title">Résultats indisponibles</p></div>`;
  }
}

function _renderPodium(top3, catId) {
  const container = document.getElementById("podiumContainer");
  const cat = CURRENT_EVENT.categories?.find(c => c.id === catId) || { emoji:"🏆", label: catId };
  if (!top3.length) {
    container.innerHTML = `<div class="empty-block"><div class="empty-icon">🏆</div>
      <p class="empty-title">Pas encore de résultats</p></div>`;
    return;
  }
  const order = [
    { css:"second", medal:"🥈", doc: top3[1] },
    { css:"first",  medal:"🥇", doc: top3[0] },
    { css:"third",  medal:"🥉", doc: top3[2] },
  ];
  container.innerHTML = `
    <div class="card text-center" style="margin-bottom:1rem">
      <div style="font-size:2rem">${cat.emoji}</div>
      <div style="font-family:var(--font-titre);font-size:1.1rem;font-weight:700">${cat.label}</div>
    </div>
    <div class="podium">
      ${order.filter(p=>p.doc).map(p=>`
        <div class="podium-place ${p.css}">
          <div class="podium-medal">${p.medal}</div>
          <div class="podium-img-wrap"><img src="${p.doc.url}" alt="${p.doc.pseudo}" loading="lazy"></div>
          <div class="podium-name">${p.doc.pseudo}</div>
          <div class="podium-votes">${p.doc.votes} vote${p.doc.votes!=1?"s":""}</div>
          <div class="podium-bar"></div>
        </div>`).join("")}
    </div>`;
}
