// =============================================
// js/admin.js — Panel administrateur
// =============================================

let _voteOpen     = false;
let _adminRefresh = null;
let _adminEvent   = null;   // Événement sélectionné dans l'admin
let _downloadCat  = "all";

// ── Connexion ──────────────────────────────────────────
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
    input.value = ""; input.focus();
  }
}

async function _loadAdminPanel() {
  await _loadAdminEvents();
}

// ── Gestion des événements ─────────────────────────────
async function _loadAdminEvents() {
  showLoader("adminEventsList", "Chargement…");
  try {
    const events = await API.getEvents();
    _renderAdminEvents(events || []);
  } catch (err) {
    document.getElementById("adminEventsList").innerHTML =
      `<p style="color:var(--texte-doux);text-align:center;padding:1rem">Erreur de chargement</p>`;
  }
}

function _renderAdminEvents(events) {
  const el = document.getElementById("adminEventsList");
  if (!el) return;

  const html = events.length ? events.map(ev => `
    <div class="admin-event-item ${_adminEvent?.id === ev.id ? "selected" : ""}"
         onclick="selectAdminEvent(${JSON.stringify(ev).replace(/"/g,'&quot;')})">
      <span style="font-size:1.4rem">${ev.emoji||"📅"}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:.9rem">${ev.name}</div>
        <div style="font-size:.75rem;color:var(--texte-doux)">${ev.date||""} · ${ev.mode==="concours"?"🏆 Concours":"📷 Collecte"}</div>
      </div>
      <button class="admin-btn admin-btn-trash" onclick="event.stopPropagation();deleteEvent('${ev.id}')" title="Supprimer l'événement">🗑️</button>
    </div>`).join("")
    : `<p style="text-align:center;color:var(--texte-doux);padding:1.5rem;font-weight:600">Aucun événement créé</p>`;

  el.innerHTML = html;
}

function selectAdminEvent(ev) {
  _adminEvent = ev;
  clearTimeout(_adminRefresh);

  // Afficher le panel de gestion
  document.getElementById("adminEventPanel").classList.remove("hidden");
  document.getElementById("adminEventPanelTitle").textContent = ev.emoji + " " + ev.name;

  // Afficher/masquer le bouton vote selon le mode
  const voteSection = document.getElementById("adminVoteSection");
  if (voteSection) voteSection.style.display = ev.mode === "concours" ? "block" : "none";

  // Boutons téléchargement catégories
  _buildDownloadCatBtns();

  // Recharger les stats
  _refreshAdminPhotos();

  // Statut votes si concours
  if (ev.mode === "concours") {
    API.getVoteStatus(ev.id).then(d => { _voteOpen = d.open; _updateVoteBtn(); }).catch(()=>{});
  }

  // Scroll vers le panel
  document.getElementById("adminEventPanel").scrollIntoView({ behavior:"smooth" });
}

// ── Créer un événement ─────────────────────────────────
function showCreateEventForm() {
  document.getElementById("createEventForm").classList.toggle("hidden");
}

async function submitNewEvent() {
  const name = document.getElementById("newEventName").value.trim();
  const mode = document.getElementById("newEventMode").value;
  const emoji= document.getElementById("newEventEmoji").value.trim() || "📅";
  const date = document.getElementById("newEventDate").value.trim();

  if (!name) { showToast("❌ Donnez un nom à l'événement.", "error"); return; }

  // Catégories par défaut selon le mode
  const defaultCats = mode === "concours" ? [
    { id:"statue", emoji:"🗿", label:"Statue" },
    { id:"rouge",  emoji:"🔴", label:"Touche de rouge" },
    { id:"coeur",  emoji:"❤️", label:"Cœur" },
    { id:"drole",  emoji:"😂", label:"Drôle" },
    { id:"pose",   emoji:"🤳", label:"Tous la même pose" },
  ] : [];

  try {
    await API.submitNewEvent({
      name, mode, emoji, date,
      categories: defaultCats,
      id: "ev_" + Date.now(),
    });
    showToast("✅ Événement créé !", "success");
    document.getElementById("createEventForm").classList.add("hidden");
    document.getElementById("newEventName").value  = "";
    document.getElementById("newEventDate").value  = "";
    await _loadAdminEvents();
  } catch (err) {
    showToast("❌ Création impossible.", "error");
  }
}

async function deleteEvent(eventId) {
  if (!confirm("Supprimer cet événement et toutes ses photos ?")) return;
  try {
    await API.deleteEvent(eventId);
    if (_adminEvent?.id === eventId) {
      _adminEvent = null;
      document.getElementById("adminEventPanel").classList.add("hidden");
    }
    showToast("🗑️ Événement supprimé.", "success");
    await _loadAdminEvents();
  } catch (err) { showToast("❌ Suppression impossible.", "error"); }
}

// ── Photos ─────────────────────────────────────────────
async function _refreshAdminPhotos() {
  if (!_adminEvent) return;
  clearTimeout(_adminRefresh);
  showLoader("adminPhotoList", "Chargement des photos…");
  try {
    const photos = await API.getAllPhotos(_adminEvent.id);
    _renderAdminStats(photos);
    _renderAdminList(photos);
  } catch (err) {
    document.getElementById("adminPhotoList").innerHTML =
      `<p style="text-align:center;color:var(--texte-doux);padding:1.5rem">Erreur de chargement</p>`;
  }
  _adminRefresh = setTimeout(_refreshAdminPhotos, 20000);
}

function _renderAdminStats(photos) {
  const el = document.getElementById("adminStats");
  if (!el) return;
  const total=photos.length, pending=photos.filter(p=>p.status==="pending").length,
        approved=photos.filter(p=>p.status==="approved").length, rejected=photos.filter(p=>p.status==="rejected").length;
  el.innerHTML = `
    <div class="admin-stat"><div class="admin-stat-num">${total}</div><div class="admin-stat-label">📷 Total</div></div>
    <div class="admin-stat"><div class="admin-stat-num" style="color:var(--orange)">${pending}</div><div class="admin-stat-label">⏳ En attente</div></div>
    <div class="admin-stat"><div class="admin-stat-num" style="color:var(--vert)">${approved}</div><div class="admin-stat-label">✅ Approuvées</div></div>
    <div class="admin-stat"><div class="admin-stat-num" style="color:var(--rouge)">${rejected}</div><div class="admin-stat-label">❌ Refusées</div></div>`;
}

function _renderAdminList(photos) {
  const el = document.getElementById("adminPhotoList");
  if (!el) return;
  if (!photos.length) { el.innerHTML=`<p style="text-align:center;color:var(--texte-doux);padding:2rem;font-weight:600">Aucune photo reçue.</p>`; return; }
  const sMap = { pending:{label:"En attente",css:"status-pending"}, approved:{label:"Approuvée",css:"status-approved"}, rejected:{label:"Refusée",css:"status-rejected"} };
  el.innerHTML = photos.map(photo => {
    const cat = _adminEvent?.categories?.find(c=>c.id===photo.category);
    const s   = sMap[photo.status] || sMap.pending;
    return `
      <div class="admin-photo-item">
        <img src="${photo.url}" alt="${photo.pseudo}" loading="lazy">
        <div class="admin-photo-info">
          <div class="admin-photo-name">${photo.pseudo}</div>
          ${cat ? `<div class="admin-photo-cat">${cat.emoji} ${cat.label}</div>` : ""}
          <span class="status-badge ${s.css}">${s.label}</span>
          <div class="vote-count" style="margin-top:.2rem">${photo.votes||0} vote${photo.votes!=1?"s":""}</div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn admin-btn-ok"  onclick="moderatePhoto(${photo.rowIndex},'approved')" title="Approuver">✅</button>
          <button class="admin-btn admin-btn-del"  onclick="moderatePhoto(${photo.rowIndex},'rejected')" title="Refuser">🚫</button>
          <button class="admin-btn admin-btn-trash" onclick="deletePhoto(${photo.rowIndex},'${photo.url}')" title="Supprimer">🗑️</button>
        </div>
      </div>`;
  }).join("");
}

async function moderatePhoto(rowIndex, status) {
  try {
    await API.moderatePhoto(rowIndex, status);
    showToast(status==="approved"?"✅ Photo approuvée !":"🚫 Photo refusée.", "success");
    await _refreshAdminPhotos();
  } catch { showToast("❌ Action impossible.", "error"); }
}

async function deletePhoto(rowIndex) {
  if (!confirm("⚠️ Supprimer définitivement cette photo ?\nCette action est irréversible.")) return;
  try {
    await API.deletePhoto(rowIndex);
    showToast("🗑️ Photo supprimée.", "success");
    await _refreshAdminPhotos();
  } catch { showToast("❌ Suppression impossible.", "error"); }
}

// ── Votes ──────────────────────────────────────────────
async function toggleVotes() {
  _voteOpen = !_voteOpen; _updateVoteBtn();
  try {
    await API.setVoteStatus(_adminEvent.id, _voteOpen);
    showToast(_voteOpen ? "🟢 Votes ouverts !" : "🔒 Votes fermés.", _voteOpen?"success":"default");
  } catch { _voteOpen = !_voteOpen; _updateVoteBtn(); showToast("❌ Erreur.", "error"); }
}

function _updateVoteBtn() {
  const btn = document.getElementById("voteToggleBtn");
  if (!btn) return;
  btn.textContent = _voteOpen ? "🔴 Fermer les votes" : "🟢 Ouvrir les votes";
  btn.className   = _voteOpen ? "btn btn-secondary" : "btn btn-success";
}

// ── Téléchargement ─────────────────────────────────────
function _buildDownloadCatBtns() {
  const container = document.getElementById("downloadCatBtns");
  if (!container) return;
  const cats = _adminEvent?.categories || [];
  container.innerHTML =
    `<button class="tab-btn active" data-dlcat="all" onclick="selectDownloadCat('all',this)">🗂️ Toutes</button>` +
    cats.map(cat => `<button class="tab-btn" data-dlcat="${cat.id}" onclick="selectDownloadCat('${cat.id}',this)">${cat.emoji} ${cat.label}</button>`).join("");
}

function selectDownloadCat(catId, btnEl) {
  _downloadCat = catId;
  document.querySelectorAll("#downloadCatBtns .tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.dlcat === catId)
  );
}

async function downloadPhotos() {
  const btn = document.getElementById("downloadBtn");
  btn.disabled = true;
  showToast("⏳ Récupération des photos…");
  try {
    let photos = await API.getAllPhotos(_adminEvent.id);
    photos = photos.filter(p => p.status === "approved");
    if (_downloadCat !== "all") photos = photos.filter(p => p.category === _downloadCat);
    if (!photos.length) { showToast("⚠️ Aucune photo approuvée.", "error"); btn.disabled=false; return; }

    const wrap  = document.getElementById("downloadProgress");
    const bar   = document.getElementById("downloadProgressBar");
    const label = document.getElementById("downloadProgressLabel");
    const count = document.getElementById("downloadProgressCount");
    wrap.classList.remove("hidden");

    for (let i = 0; i < photos.length; i++) {
      bar.style.width   = Math.round(i/photos.length*100) + "%";
      label.textContent = "Téléchargement…";
      count.textContent = `${i+1} / ${photos.length}`;
      try {
        const res  = await fetch(photos[i].url);
        const blob = await res.blob();
        const idx  = String(i+1).padStart(3,"0");
        const name = (photos[i].pseudo||"Anonyme").replace(/[^a-zA-ZÀ-ÿ0-9 ]/g,"").trim().replace(/\s+/g,"_").slice(0,30);
        const cat  = photos[i].category || "photo";
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `${idx}_${cat}_${name}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url), 1000);
      } catch(e) { console.warn(`Photo ${i+1} échouée`, e); }
      await sleep(300);
    }

    bar.style.width = "100%"; label.textContent = "✅ Terminé !"; count.textContent = `${photos.length} / ${photos.length}`;
    showToast(`✅ ${photos.length} photo${photos.length>1?"s":""} téléchargée${photos.length>1?"s":""}!`, "success", 4000);
    setTimeout(()=>{ wrap.classList.add("hidden"); bar.style.width="0%"; }, 3000);
  } catch(err) { showToast("❌ Erreur lors du téléchargement.", "error"); }
  finally { btn.disabled = false; }
}

// ── Déconnexion ────────────────────────────────────────
function logoutAdmin() {
  clearTimeout(_adminRefresh);
  _adminEvent = null;
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("adminLoginBox").classList.remove("hidden");
  document.getElementById("adminEventPanel").classList.add("hidden");
  showToast("👋 Déconnecté.");
}
