/**
 * 모두의 정원 — 구글 시트 저장소 (Google Apps Script)
 * ------------------------------------------------------------------
 * 이 코드를 구글 시트의 [확장 프로그램 → Apps Script]에 통째로 붙여넣고
 * [배포 → 새 배포 → 웹 앱]으로 배포하세요. (자세한 순서: 시트연결_가이드.md)
 *
 *  - doPost : 사이트에서 [심기]를 누르면 한 줄이 시트에 추가됨
 *  - doGet  : 사이트의 [모두의 정원]이 최근 300개를 읽어감
 */

const SHEET_NAME = "garden";
const MAX_RETURN = 300;
const ALLOWED = /[^A-Z0-9?+!."@*&%\n]/g; // 사이트에서 칠 수 있는 글자만 남김

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["time", "id", "name", "text"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const text = String(data.text || "").toUpperCase().replace(ALLOWED, "").replace(/\n{2,}/g, "\n").slice(0, 240);
    if (!text.replace(/\n/g, "")) return json_({ ok: false, error: "empty" });
    const name = String(data.name || "").replace(/[\r\n\t]/g, " ").trim().slice(0, 20);
    const id = Utilities.getUuid();
    // 앞에 ' 를 붙여 "+12" 같은 글자가 숫자/수식으로 바뀌지 않게 글자 그대로 저장
    getSheet_().appendRow([new Date(), id, "'" + name, "'" + text]);
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet(e) {
  const sh = getSheet_();
  const last = sh.getLastRow();
  const n = Math.min(MAX_RETURN, last - 1);
  if (n <= 0) return json_({ ok: true, entries: [] });
  const rows = sh.getRange(last - n + 1, 1, n, 4).getValues();
  const entries = rows
    .filter(function (r) { return r[3]; })
    .map(function (r) {
      return {
        t: r[0] instanceof Date ? r[0].getTime() : r[0],
        id: String(r[1]),
        name: String(r[2] || ""),
        text: String(r[3] || ""),
      };
    });
  return json_({ ok: true, entries: entries });
}
