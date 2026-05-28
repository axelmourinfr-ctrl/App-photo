// =============================================
// Code.gs — Google Apps Script
// Backend de l'app Fête des Familles
// Copiez ce code entier dans votre Apps Script
// =============================================

// ── Nom de la feuille de paramètres ──────────
const SETTINGS_SHEET = "_settings";

// ══════════════════════════════════════════════
// POINT D'ENTRÉE — Requêtes GET (lecture)
// ══════════════════════════════════════════════
function doGet(e) {
  const params = e.parameter;
  let result;

  try {
    switch (params.action) {

      case "getPhotos":
        result = getPhotos(params.edition, params.status, params.category || null);
        break;

      case "getVoteStatus":
        result = getVoteStatus();
        break;

      default:
        result = { error: "Action inconnue : " + params.action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return jsonResponse(result);
}

// ══════════════════════════════════════════════
// POINT D'ENTRÉE — Requêtes POST (écriture)
// ══════════════════════════════════════════════
function doPost(e) {
  let body, result;

  try {
    body = JSON.parse(e.postData.contents);

    switch (body.action) {

      case "addPhoto":
        result = addPhoto(body);
        break;

      case "moderatePhoto":
        result = moderatePhoto(body.rowIndex, body.status);
        break;

      case "castVote":
        result = castVote(body.rowIndex, body.visitorId);
        break;

      case "setVoteStatus":
        result = setVoteStatus(body.open);
        break;

      case "deletePhoto":
        result = deletePhoto(body.rowIndex);
        break;

      default:
        result = { error: "Action inconnue : " + body.action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return jsonResponse(result);
}

// ══════════════════════════════════════════════
// FONCTIONS MÉTIER
// ══════════════════════════════════════════════

// ── Ajouter une photo ──────────────────────────
function addPhoto({ url, category, pseudo, visitorId, edition }) {
  const sheet = getOrCreateSheet(edition);

  // En-têtes si feuille vide
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["URL", "Catégorie", "Pseudo", "Statut", "Votes", "VisitorID", "Date"]);
    // Style en-tête
    const header = sheet.getRange(1, 1, 1, 7);
    header.setFontWeight("bold");
    header.setBackground("#F2813A");
    header.setFontColor("#FFFFFF");
  }

  sheet.appendRow([
    url,
    category,
    pseudo || "Anonyme",
    "pending",       // statut initial
    0,               // votes
    visitorId,
    new Date().toISOString(),
  ]);

  return { ok: true, row: sheet.getLastRow() };
}

// ── Récupérer des photos ───────────────────────
function getPhotos(edition, statusFilter, categoryFilter) {
  const sheet = getOrCreateSheet(edition);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return []; // Vide ou juste en-têtes

  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  const photos = data
    .map((row, i) => ({
      rowIndex:  i + 2,           // numéro de ligne réel dans le sheet
      url:       row[0],
      category:  row[1],
      pseudo:    row[2],
      status:    row[3],
      votes:     Number(row[4]) || 0,
      visitorId: row[5],
      date:      row[6],
    }))
    .filter(p => p.url) // Ignorer les lignes vides
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !categoryFilter || p.category === categoryFilter);

  // Tri par votes décroissant
  photos.sort((a, b) => b.votes - a.votes);

  return photos;
}

// ── Modérer une photo (approved / rejected) ───
function moderatePhoto(rowIndex, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // On doit trouver la bonne feuille — on cherche dans toutes les feuilles
  const sheets = ss.getSheets().filter(s => s.getName() !== SETTINGS_SHEET);

  for (const sheet of sheets) {
    if (rowIndex <= sheet.getLastRow()) {
      sheet.getRange(rowIndex, 4).setValue(status); // Colonne D = Statut
      return { ok: true };
    }
  }
  return { error: "Ligne introuvable" };
}

// ── Enregistrer un vote ───────────────────────
function castVote(rowIndex, visitorId) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(s => s.getName() !== SETTINGS_SHEET);

  for (const sheet of sheets) {
    if (rowIndex <= sheet.getLastRow()) {
      const range     = sheet.getRange(rowIndex, 5); // Colonne E = Votes
      const current   = Number(range.getValue()) || 0;
      range.setValue(current + 1);
      return { ok: true, votes: current + 1 };
    }
  }
  return { error: "Photo introuvable" };
}

// ── Statut des votes (ouvert / fermé) ─────────
function getVoteStatus() {
  const sheet = getOrCreateSettingsSheet();
  const val   = sheet.getRange("A1").getValue();
  return { open: val === true || val === "true" };
}

function setVoteStatus(open) {
  const sheet = getOrCreateSettingsSheet();
  sheet.getRange("A1").setValue(open === true);
  sheet.getRange("B1").setValue(open ? "Votes OUVERTS" : "Votes FERMÉS");
  return { ok: true, open };
}

// ══════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════

// ── Obtenir ou créer une feuille par édition ──
function getOrCreateSheet(edition) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(edition);
  if (!sheet) {
    sheet = ss.insertSheet(edition);
  }
  return sheet;
}

// ── Feuille de paramètres globaux ─────────────
function getOrCreateSettingsSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET);
    sheet.getRange("A1").setValue(false);
    sheet.getRange("B1").setValue("Votes FERMÉS");
    sheet.hideSheet(); // Cachée de l'interface par défaut
  }
  return sheet;
}

// ── Réponse JSON avec CORS ────────────────────
function jsonResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
