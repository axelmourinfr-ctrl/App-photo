// =============================================
// js/app.js
// Point d'entrée — navigation entre les écrans
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  // Injection nom / sous-titre / emoji événement
  document.querySelectorAll("[data-event-name]").forEach(el => el.textContent = APP_CONFIG.eventName);
  document.querySelectorAll("[data-event-subtitle]").forEach(el => el.textContent = APP_CONFIG.eventSubtitle);
  document.querySelectorAll("[data-event-emoji]").forEach(el => el.textContent = APP_CONFIG.eventEmoji);
  document.title = APP_CONFIG.eventName;

  // Adaptation selon le mode
  _applyMode();

  // Badges catégories sur l'accueil
  const badges = document.getElementById("homeCategories");
  if (badges) {
    badges.innerHTML = APP_CONFIG.categories.map(cat =>
      `<span class="cat-badge">${cat.emoji} ${cat.label}</span>`
    ).join("");
  }

  initUpload();
  showScreen("screen-home");
});

// ── Application du mode concours / collecte ───────────
function _applyMode() {
  const isCollecte = APP_CONFIG.mode === "collecte";

  // Bouton voter sur l'accueil
  const btnVote = document.getElementById("btnVoterAccueil");
  if (btnVote) btnVote.style.display = isCollecte ? "none" : "block";

  // Onglets nav vote et résultats
  document.querySelectorAll(".nav-vote, .nav-results").forEach(el => {
    el.style.display = isCollecte ? "none" : "";
  });

  // Titre et sous-titre upload selon le mode
  const uploadTitle = document.getElementById("uploadScreenTitle");
  const uploadSub   = document.getElementById("uploadScreenSub");
  const catLabel    = document.getElementById("categoryLabel");

  if (isCollecte) {
    if (uploadTitle) uploadTitle.textContent = "📷 Partager une photo";
    if (uploadSub)   uploadSub.textContent   = "Prenez ou choisissez une photo à partager";
    if (catLabel)    catLabel.textContent     = "🏷️ Choisissez un tag (optionnel)";
  } else {
    if (uploadTitle) uploadTitle.textContent = "📷 Ma photo";
    if (uploadSub)   uploadSub.textContent   = "Choisissez une photo et une catégorie";
    if (catLabel)    catLabel.textContent     = "🏆 Choisissez une catégorie *";
  }
}

// ── Navigation principale ─────────────────────────────
function navigateTo(screenId) {
  // En mode collecte, rediriger vote/résultats vers accueil
  if (APP_CONFIG.mode === "collecte" &&
      (screenId === "screen-vote" || screenId === "screen-results")) {
    screenId = "screen-home";
  }
  if (screenId !== "screen-vote")    cleanupVote();
  if (screenId === "screen-vote")    initVote();
  if (screenId === "screen-results") initResults();
  showScreen(screenId);
}

// ── Raccourcis depuis l'accueil ───────────────────────
function goToUpload() { navigateTo("screen-upload"); }
function goToVote()   { navigateTo("screen-vote");   }
