// =============================================
// js/app.js — Navigation et état global
// =============================================

// ── État global ────────────────────────────────────────
let CURRENT_EVENT = null;  // Événement sélectionné par l'utilisateur

// ── Démarrage ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  document.title = APP_CONFIG.appName;
  document.querySelectorAll("[data-app-name]").forEach(el =>
    el.textContent = APP_CONFIG.appName
  );
  document.querySelectorAll("[data-app-emoji]").forEach(el =>
    el.textContent = APP_CONFIG.appEmoji
  );

  showScreen("screen-home");
  await loadEventsList();
});

// ── Chargement de la liste des événements ─────────────
async function loadEventsList() {
  showLoader("eventsList", "Chargement des événements…");
  try {
    const events = await API.getEvents();
    renderEventsList(events || []);
  } catch (err) {
    console.error("Erreur événements :", err);
    document.getElementById("eventsList").innerHTML = `
      <div class="empty-block">
        <div class="empty-icon">⚠️</div>
        <p class="empty-title">Impossible de charger les événements</p>
        <p class="empty-sub">Vérifiez votre connexion</p>
      </div>`;
  }
}

// ── Affichage de la liste des événements ──────────────
function renderEventsList(events) {
  const container = document.getElementById("eventsList");
  if (!events.length) {
    container.innerHTML = `
      <div class="empty-block">
        <div class="empty-icon">📅</div>
        <p class="empty-title">Aucun événement en cours</p>
        <p class="empty-sub">L'organisateur ajoutera bientôt un événement !</p>
      </div>`;
    return;
  }

  container.innerHTML = events.map(ev => `
    <div class="event-card" onclick="selectEvent(${JSON.stringify(ev).replace(/"/g, '&quot;')})">
      <div class="event-card-emoji">${ev.emoji || "📅"}</div>
      <div class="event-card-info">
        <div class="event-card-name">${ev.name}</div>
        <div class="event-card-date">${ev.date || ""}</div>
        <span class="event-card-mode ${ev.mode === 'concours' ? 'mode-concours' : 'mode-collecte'}">
          ${ev.mode === "concours" ? "🏆 Concours photo" : "📷 Collecte de photos"}
        </span>
      </div>
      <div class="event-card-arrow">›</div>
    </div>`).join("");
}

// ── Sélection d'un événement ──────────────────────────
function selectEvent(ev) {
  CURRENT_EVENT = ev;

  // Mettre à jour les titres avec le nom de l'événement
  document.querySelectorAll("[data-event-name]").forEach(el =>
    el.textContent = ev.name
  );
  document.querySelectorAll("[data-event-emoji]").forEach(el =>
    el.textContent = ev.emoji || "📅"
  );

  // Adapter la nav selon le mode
  const isConcours = ev.mode === "concours";
  document.querySelectorAll(".nav-vote, .nav-results").forEach(el => {
    el.style.display = isConcours ? "" : "none";
  });

  // Aller directement à l'upload
  navigateTo("screen-upload");
  initUpload();
}

// ── Navigation ─────────────────────────────────────────
function navigateTo(screenId) {
  // Pas d'événement sélectionné → retour accueil avec message
  if (!CURRENT_EVENT &&
      screenId !== "screen-home" &&
      screenId !== "screen-admin") {
    showScreen("screen-home");
    showToast("👆 Choisissez d'abord un événement !", "default");
    return;
  }
  // Vote/Résultats uniquement en mode concours
  if (CURRENT_EVENT?.mode !== "concours" &&
      (screenId === "screen-vote" || screenId === "screen-results")) {
    showToast("ℹ️ Pas de vote pour cet événement.", "default");
    return;
  }
  if (screenId !== "screen-vote")    cleanupVote?.();
  if (screenId === "screen-vote")    initVote();
  if (screenId === "screen-results") initResults();
  showScreen(screenId);
}

function goToUpload()  { navigateTo("screen-upload"); }
function goToVote()    { navigateTo("screen-vote");   }
function goToHome()    { CURRENT_EVENT = null; showScreen("screen-home"); loadEventsList(); }
