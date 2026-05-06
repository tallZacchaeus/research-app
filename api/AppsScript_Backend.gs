/**
 * ============================================================
 * RESEARCH FORM BACKEND (Apps Script)
 * ============================================================
 * Deploy this as a Web App to receive form submissions and
 * write them to Google Sheets.
 *
 * SETUP:
 *   1. Create a new Google Sheet → Extensions → Apps Script
 *   2. Paste this entire file
 *   3. Run setupSheets() ONCE to create headers
 *   4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Copy the Web App URL
 *   6. Paste into form-engine.js as APPS_SCRIPT_URL
 *
 * NOTE: Re-run setupSheets() if you change the data instrument.
 * ============================================================
 */

// ============ ENTRY POINT (handles POST from frontend) ============
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { formType, submittedAt, data } = payload;

    if (!formType || !data) {
      return jsonResponse({ ok: false, error: 'Missing formType or data' });
    }

    if (formType === 'clergy') {
      writeClergyRow(submittedAt, data);
    } else if (formType === 'checklist') {
      writeChecklistRow(submittedAt, data);
    } else {
      return jsonResponse({ ok: false, error: `Unknown formType: ${formType}` });
    }

    return jsonResponse({ ok: true, message: 'Saved successfully' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// Optional GET handler for sanity check
function doGet(e) {
  return jsonResponse({ ok: true, message: 'Research backend is live. Use POST to submit.' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ SHEET WRITERS ============
function writeClergyRow(submittedAt, data) {
  const sheet = getOrCreateSheet('Clergy_Interviews');
  const headers = getClergyHeaders();
  ensureHeaders(sheet, headers);

  const row = headers.map(h => {
    if (h === 'submitted_at') return submittedAt;
    const value = data[h];
    if (Array.isArray(value)) return value.join(', ');
    return value !== undefined && value !== null ? String(value) : '';
  });

  sheet.appendRow(row);
}

function writeChecklistRow(submittedAt, data) {
  const sheet = getOrCreateSheet('Field_Checklists');
  const headers = getChecklistHeaders();
  ensureHeaders(sheet, headers);

  const row = headers.map(h => {
    if (h === 'submitted_at') return submittedAt;
    const value = data[h];
    if (Array.isArray(value)) return value.join(', ');
    return value !== undefined && value !== null ? String(value) : '';
  });

  sheet.appendRow(row);
}

// ============ HEADER DEFINITIONS ============
function getClergyHeaders() {
  const headers = [
    'submitted_at',
    'church_name',
    'respondent_name',
    'respondent_role',
    'interview_date',
    'church_location'
  ];

  // Schedule A
  headers.push('a_top10');
  for (let i = 1; i <= 10; i++) headers.push(`a_rank_rank${i}`);
  headers.push('a_top1_explain', 'a_top2_explain', 'a_top3_explain', 'a_closing_probe');

  // Schedule B — hindrance scores
  for (let i = 1; i <= 40; i++) headers.push(`b_hindrance_${i}`);
  headers.push('b_top5');
  // Top 5 ranks + explanations
  for (let i = 1; i <= 5; i++) {
    headers.push(`b_rank_rank${i}`);
    headers.push(`b_rank_rank${i}_explain`);
  }
  headers.push('b_closing_probe');

  // Schedule C — presence + reasons + feasibility
  for (let i = 1; i <= 22; i++) headers.push(`c_presence_${i}`);
  for (let i = 1; i <= 22; i++) headers.push(`c_reason_${i}`);
  for (let i = 1; i <= 10; i++) {
    headers.push(`c_feasibility_rank${i}`);
    headers.push(`c_feasibility_rank${i}_explain`);
    headers.push(`c_feasibility_rank${i}_cost`);
  }
  headers.push('c_closing_probe');

  // Schedule D — compliance + reasons + challenges
  for (let i = 1; i <= 28; i++) headers.push(`d_compliance_${i}`);
  for (let i = 1; i <= 28; i++) headers.push(`d_reason_${i}`);
  for (let i = 1; i <= 5; i++) {
    headers.push(`d_challenge_rank${i}`);
    headers.push(`d_challenge_rank${i}_explain`);
  }
  headers.push('d_closing_probe');

  headers.push('final_comments');
  return headers;
}

function getChecklistHeaders() {
  const headers = [
    'submitted_at',
    'church_code',
    'visit_date',
    'location',
    'capacity',
    'researcher',
    'gps_lat',
    'gps_lng'
  ];

  // 18 adoption items: score + notes + photo
  for (let i = 1; i <= 18; i++) {
    headers.push(`adopt_${i}`);
    headers.push(`adopt_${i}_notes`);
    headers.push(`adopt_${i}_photo`);
  }

  // 9 regulatory items: score + notes + photo
  for (let i = 1; i <= 9; i++) {
    headers.push(`reg_${i}`);
    headers.push(`reg_${i}_notes`);
    headers.push(`reg_${i}_photo`);
  }

  headers.push(
    'general_observations',
    'photo_count',
    'photo_list',
    'posture',
    'posture_justification',
    'adoption_index',
    'compliance_index'
  );

  return headers;
}

// ============ HELPERS ============
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#f5f2eb')
      .setBorder(false, false, true, false, false, false);
    sheet.setFrozenRows(1);
  }
}

// ============ SETUP (run once manually) ============
function setupSheets() {
  const clergySheet = getOrCreateSheet('Clergy_Interviews');
  ensureHeaders(clergySheet, getClergyHeaders());

  const checklistSheet = getOrCreateSheet('Field_Checklists');
  ensureHeaders(checklistSheet, getChecklistHeaders());

  Logger.log('✓ Sheets set up successfully');
  Logger.log('Clergy headers: ' + getClergyHeaders().length + ' columns');
  Logger.log('Checklist headers: ' + getChecklistHeaders().length + ' columns');
}

// ============ TEST FUNCTION (run after deploy to verify) ============
function testWrite() {
  writeChecklistRow(new Date().toISOString(), {
    church_code: 'TEST_001',
    visit_date: '2026-05-05',
    location: 'Lagos',
    capacity: '1500',
    researcher: 'Test Run',
    gps_lat: '6.5244',
    gps_lng: '3.3792',
    adopt_1: '2',
    adopt_1_notes: 'Test notes',
    adoption_index: '85',
    compliance_index: '70'
  });
  Logger.log('Test row written');
}
