// =============================================
// Code.gs — Google Apps Script
// Backend : gestion événements + photos + votes
// =============================================

const SETTINGS_SHEET = "_settings";
const EVENTS_SHEET   = "_events";

// ══ GET ════════════════════════════════════════
function doGet(e) {
  const p = e.parameter;
  let result;
  try {
    switch(p.action) {
      case "getEvents":     result = getEvents(); break;
      case "getPhotos":     result = getPhotos(p.eventId, p.status, p.category||null); break;
      case "getVoteStatus": result = getVoteStatus(p.eventId); break;
      default: result = { error: "Action inconnue : " + p.action };
    }
  } catch(err) { result = { error: err.message }; }
  return jsonResponse(result);
}

// ══ POST ═══════════════════════════════════════
function doPost(e) {
  let body, result;
  try {
    body = JSON.parse(e.postData.contents);
    switch(body.action) {
      case "createEvent":    result = createEvent(body); break;
      case "updateEvent":    result = updateEvent(body.eventId, body); break;
      case "deleteEvent":    result = deleteEvent(body.eventId); break;
      case "addPhoto":       result = addPhoto(body); break;
      case "moderatePhoto":  result = moderatePhoto(body.rowIndex, body.status); break;
      case "deletePhoto":    result = deletePhoto(body.rowIndex); break;
      case "castVote":       result = castVote(body.rowIndex, body.visitorId); break;
      case "setVoteStatus":  result = setVoteStatus(body.eventId, body.open); break;
      default: result = { error: "Action inconnue : " + body.action };
    }
  } catch(err) { result = { error: err.message }; }
  return jsonResponse(result);
}

// ══ ÉVÉNEMENTS ═════════════════════════════════

function getEvents() {
  const sheet = getOrCreateEventsSheet();
  const last  = sheet.getLastRow();
  if (last <= 1) return [];
  const data = sheet.getRange(2, 1, last-1, 7).getValues();
  return data
    .filter(r => r[0])
    .map(r => ({
      id:         r[0],
      name:       r[1],
      mode:       r[2],
      emoji:      r[3],
      date:       r[4],
      categories: r[5] ? JSON.parse(r[5]) : [],
      active:     r[6],
    }))
    .filter(ev => ev.active !== false);
}

function createEvent({ id, name, mode, emoji, date, categories }) {
  const sheet = getOrCreateEventsSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID","Nom","Mode","Emoji","Date","Categories","Active"]);
    const h = sheet.getRange(1,1,1,7);
    h.setFontWeight("bold"); h.setBackground("#E8452C"); h.setFontColor("#FFFFFF");
  }
  sheet.appendRow([id, name, mode, emoji||"📅", date||"", JSON.stringify(categories||[]), true]);

  // Créer l'onglet photos pour cet événement
  getOrCreatePhotoSheet(id);
  return { ok: true, id };
}

function updateEvent(eventId, fields) {
  const sheet = getOrCreateEventsSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === eventId) {
      if (fields.name)       sheet.getRange(i+1,2).setValue(fields.name);
      if (fields.mode)       sheet.getRange(i+1,3).setValue(fields.mode);
      if (fields.emoji)      sheet.getRange(i+1,4).setValue(fields.emoji);
      if (fields.date)       sheet.getRange(i+1,5).setValue(fields.date);
      if (fields.categories) sheet.getRange(i+1,6).setValue(JSON.stringify(fields.categories));
      return { ok: true };
    }
  }
  return { error: "Événement introuvable" };
}

function deleteEvent(eventId) {
  const sheet = getOrCreateEventsSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === eventId) {
      sheet.getRange(i+1, 7).setValue(false); // Marquer inactif
      return { ok: true };
    }
  }
  return { error: "Événement introuvable" };
}

// ══ PHOTOS ═════════════════════════════════════

function addPhoto({ url, eventId, category, pseudo, visitorId }) {
  const sheet = getOrCreatePhotoSheet(eventId);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["URL","Catégorie","Pseudo","Statut","Votes","VisitorID","Date"]);
    const h = sheet.getRange(1,1,1,7);
    h.setFontWeight("bold"); h.setBackground("#F2813A"); h.setFontColor("#FFFFFF");
  }
  sheet.appendRow([url, category, pseudo||"Anonyme", "pending", 0, visitorId, new Date().toISOString()]);
  return { ok: true, row: sheet.getLastRow() };
}

function getPhotos(eventId, statusFilter, categoryFilter) {
  const sheet   = getOrCreatePhotoSheet(eventId);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2,1,lastRow-1,7).getValues();
  return data
    .map((r,i) => ({ rowIndex:i+2, url:r[0], category:r[1], pseudo:r[2], status:r[3], votes:Number(r[4])||0, visitorId:r[5], date:r[6] }))
    .filter(p => p.url)
    .filter(p => statusFilter==="all" || p.status===statusFilter)
    .filter(p => !categoryFilter || p.category===categoryFilter)
    .sort((a,b) => b.votes - a.votes);
}

function moderatePhoto(rowIndex, status) {
  const sheet = _findSheetByRow(rowIndex);
  if (!sheet) return { error: "Introuvable" };
  sheet.getRange(rowIndex, 4).setValue(status);
  return { ok: true };
}

function deletePhoto(rowIndex) {
  const sheet = _findSheetByRow(rowIndex);
  if (!sheet) return { error: "Introuvable" };
  sheet.deleteRow(rowIndex);
  return { ok: true };
}

function castVote(rowIndex, visitorId) {
  const sheet = _findSheetByRow(rowIndex);
  if (!sheet) return { error: "Introuvable" };
  const range   = sheet.getRange(rowIndex, 5);
  const current = Number(range.getValue())||0;
  range.setValue(current+1);
  return { ok: true, votes: current+1 };
}

// ══ VOTES ══════════════════════════════════════

function getVoteStatus(eventId) {
  const sheet = getOrCreateSettingsSheet();
  const data  = sheet.getDataRange().getValues();
  for (const row of data) {
    if (row[0] === eventId) return { open: row[1]===true||row[1]==="true" };
  }
  return { open: false };
}

function setVoteStatus(eventId, open) {
  const sheet = getOrCreateSettingsSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === eventId) {
      sheet.getRange(i+1, 2).setValue(open===true);
      sheet.getRange(i+1, 3).setValue(open ? "OUVERT" : "FERMÉ");
      return { ok: true };
    }
  }
  // Nouvelle ligne
  sheet.appendRow([eventId, open===true, open?"OUVERT":"FERMÉ"]);
  return { ok: true };
}

// ══ UTILITAIRES ════════════════════════════════

function getOrCreateEventsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(EVENTS_SHEET) || ss.insertSheet(EVENTS_SHEET);
}

function getOrCreatePhotoSheet(eventId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = "photos_" + eventId;
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function getOrCreateSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) { sheet = ss.insertSheet(SETTINGS_SHEET); sheet.hideSheet(); }
  return sheet;
}

function _findSheetByRow(rowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(s =>
    s.getName() !== SETTINGS_SHEET && s.getName() !== EVENTS_SHEET
  );
  for (const sheet of sheets) {
    if (rowIndex >= 2 && rowIndex <= sheet.getLastRow()) return sheet;
  }
  return null;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
