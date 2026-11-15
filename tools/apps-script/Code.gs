/**
 * Furniture Match log.
 * Bound to the spreadsheet "Furniture Match Log".
 * Setup steps: docs/furniture-log.md
 *
 * Script property LOG_WEBHOOK_SECRET must match the Worker secret of the same name.
 * The Worker sends it as the query parameter k. Apps Script web apps do not receive custom headers.
 */
var SHEET_ID = "1gxZHgUSTWWOcO8orEFqtCMGA-P0BDoi0Df1qyNOFdGY";
var PHOTOS_FOLDER_ID = "1WEDzGwcGJz7o37-K6LpirdPO8cmkRWeZ";
var SHEET_NAME = "Log";
var ACCURATE = { "Found it": true, Close: true, Wrong: true };

function doGet() {
  return json_({ ok: true });
}

function doPost(e) {
  try {
    if (!authorized_(e)) return json_({ ok: false });
    var body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (body.mode === "demo") return json_({ ok: true, skipped: true });
    if (body.action === "accuracy") return recordAccuracy_(body);
    return recordSearch_(body);
  } catch (error) {
    return json_({ ok: false, error: String(error).slice(0, 180) });
  }
}

function authorized_(e) {
  var expected = PropertiesService.getScriptProperties().getProperty("LOG_WEBHOOK_SECRET") || "";
  var got = e && e.parameter ? String(e.parameter.k || "") : "";
  if (!expected || expected.length !== got.length) return false;
  var mismatch = 0;
  for (var i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  return mismatch === 0;
}

function recordSearch_(body) {
  var entryId = clean_(body.entryId, 80);
  if (!entryId) return json_({ ok: false, error: "missing entry" });
  var photoUrl = savePhoto_(entryId, body.photo, body.mime);
  var results = Array.isArray(body.results) ? body.results : [];
  var top = results[0] || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = sheet_();
    sheet.appendRow([
      entryId,
      Utilities.formatDate(new Date(), "America/Los_Angeles", "yyyy-MM-dd HH:mm:ss"),
      "",
      clean_(body.description, 300),
      clean_(body.query, 200),
      "live",
      Number(body.resultCount) || results.length || 0,
      clean_(top.name, 200),
      clean_(top.store, 120),
      clean_(top.priceLabel, 40),
      clean_(top.url, 500),
      summarize_(results),
      clean_(body.priceRange, 80),
      "",
      "",
      "",
    ]);
    var row = sheet.getLastRow();
    if (photoUrl) {
      sheet.getRange(row, 3).setFormula(photoFormula_(photoUrl.fileId));
      sheet.setRowHeight(row, 96);
    }
    return json_({ ok: true, entryId: entryId });
  } finally {
    lock.releaseLock();
  }
}

function recordAccuracy_(body) {
  var entryId = clean_(body.entryId, 80);
  var accurate = ACCURATE[body.accurate] ? String(body.accurate) : "";
  var which = clean_(body.which, 200);
  if (!entryId) return json_({ ok: false, error: "missing entry" });
  for (var attempt = 0; attempt < 10; attempt++) {
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var sheet = sheet_();
      var found = sheet.getRange("A:A").createTextFinder(entryId).matchEntireCell(true).findNext();
      if (found) {
        var row = found.getRow();
        if (accurate) sheet.getRange(row, 14).setValue(accurate);
        if (which) sheet.getRange(row, 15).setValue(which);
        return json_({ ok: true, entryId: entryId });
      }
    } finally {
      lock.releaseLock();
    }
    Utilities.sleep(500);
  }
  return json_({ ok: false, error: "unknown entry" });
}

function savePhoto_(entryId, photo, mime) {
  if (typeof photo !== "string" || photo.length < 16) return null;
  var type = mime === "image/png" || mime === "image/webp" ? mime : "image/jpeg";
  var ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  var bytes = Utilities.base64Decode(photo);
  var blob = Utilities.newBlob(bytes, type, entryId + "." + ext);
  var file = DriveApp.getFolderById(PHOTOS_FOLDER_ID).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { fileId: file.getId(), url: file.getUrl() };
}

function photoFormula_(fileId) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) return "";
  var thumb = "https://lh3.googleusercontent.com/d/" + fileId + "=w320";
  var open = "https://drive.google.com/file/d/" + fileId + "/view";
  return '=IFERROR(IMAGE("' + thumb + '"),HYPERLINK("' + open + '","open photo"))';
}

function summarize_(results) {
  var lines = [];
  for (var i = 0; i < results.length && i < 5; i++) {
    var item = results[i] || {};
    lines.push(
      i +
        1 +
        ". " +
        clean_(item.name, 120) +
        " — " +
        clean_(item.store, 80) +
        " — " +
        clean_(item.priceLabel, 40) +
        " — " +
        clean_(item.url, 300),
    );
  }
  return lines.join("\n");
}

function sheet_() {
  var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Missing Log tab");
  return sheet;
}

function clean_(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
