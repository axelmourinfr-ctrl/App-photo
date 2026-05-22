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

  // Badges catégories sur l'accueil
  const badges = document.getElementById("homeCategories");
  if (badges) {
    badges.innerHTML = APP_CONFIG.categories.map(cat =>
      `<span class="cat-badge">${cat.emoji} ${cat.label}</span>`
    ).join("");
  }

  // Initialisation de l'écran d'upload (grille catégories, events)
  initUpload();

  // Écran d'accueil par défaut
  showScreen("screen-home");
});

// ── Navigation principale ─────────────────────────────
function navigateTo(screenId) {
  if (screenId !== "screen-vote")    cleanupVote();
  if (screenId === "screen-vote")    initVote();
  if (screenId === "screen-results") initResults();
  showScreen(screenId);
}

// ── Raccourcis depuis l'accueil ───────────────────────
function goToUpload() { navigateTo("screen-upload"); }
function goToVote()   { navigateTo("screen-vote");   }
