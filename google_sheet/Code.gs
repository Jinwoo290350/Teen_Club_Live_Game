// ============================================================
//  Teen Club Live — Google Apps Script (Web App)
//  รับ POST request จาก Next.js แล้วเขียนลง Google Sheets
// ============================================================

var RESPONSES_SHEET = 'responses';
var SATISFACTION_SHEET = 'satisfaction';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'quiz') {
      writeQuizResponse(ss, data);
    } else if (data.type === 'satisfaction') {
      writeSatisfactionResponse(ss, data);
    } else {
      return jsonResponse({ status: 'error', message: 'unknown type' }, 400);
    }

    return jsonResponse({ status: 'ok' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() }, 500);
  }
}

// ── Sheet 1: responses ──────────────────────────────────────
// A: timestamp | B: gender | C: ageGroup | D: education
// E–AD: s2q1 … s16q2  (26 คอลัมน์ เก็บ index ที่ผู้เล่นเลือก)
// AE: score | AF: totalQuestions
function writeQuizResponse(ss, data) {
  var sheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!sheet) sheet = ss.insertSheet(RESPONSES_SHEET);

  // สร้าง header ถ้า sheet ว่าง
  if (sheet.getLastRow() === 0) {
    var headers = ['timestamp', 'gender', 'ageGroup', 'education'];
    var questionIds = [
      's2q1','s2q2',
      's3q1','s3q2',
      's4q1','s4q2','s4q3',
      's5q1','s5q2','s5q3',
      's6q1',
      's7q1',
      's8q1','s8q2',
      's9q1',
      's10q1','s10q2',
      's11q1',
      's12q1','s12q2',
      's13q1','s13q2',
      's14q1',
      's15q1',
      's16q1','s16q2'
    ];
    headers = headers.concat(questionIds).concat(['score', 'totalQuestions']);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var row = [
    new Date(),
    data.gender || '',
    data.ageGroup || '',
    data.education || ''
  ];
  row = row.concat(data.answers || []);
  row.push(data.score || 0);
  row.push(data.totalQuestions || 26);

  sheet.appendRow(row);
}

// ── Sheet 2: satisfaction ───────────────────────────────────
// A: timestamp | B–O: sat1…sat14 (ค่า 1-5) | P: additionalComments
function writeSatisfactionResponse(ss, data) {
  var sheet = ss.getSheetByName(SATISFACTION_SHEET);
  if (!sheet) sheet = ss.insertSheet(SATISFACTION_SHEET);

  // สร้าง header ถ้า sheet ว่าง
  if (sheet.getLastRow() === 0) {
    var headers = ['timestamp'];
    for (var i = 1; i <= 14; i++) headers.push('sat' + i);
    headers.push('additionalComments');
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var row = [new Date()];
  row = row.concat(data.ratings || []);
  row.push(data.comments || '');

  sheet.appendRow(row);
}

// ── ทดสอบผ่าน GET (ไม่ใช้ใน production) ───────────────────
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Teen Club Live API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helper ──────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
