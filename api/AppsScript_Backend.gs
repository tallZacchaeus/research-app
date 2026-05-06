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
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Server busy, please retry' });
  }

  try {
    const payload = JSON.parse(e.postData.contents);
    const { formType, submittedAt, data, submissionId } = payload;

    if (!formType || !data) {
      return jsonResponse({ ok: false, error: 'Missing formType or data' });
    }

    const sid = submissionId || (data && data.submissionId) || '';

    let sheetName, headers, writer;
    if (formType === 'clergy') {
      sheetName = 'Clergy_Interviews'; headers = getClergyHeaders(); writer = writeClergyRow;
    } else if (formType === 'checklist') {
      sheetName = 'Field_Checklists'; headers = getChecklistHeaders(); writer = writeChecklistRow;
    } else if (formType === 'questionnaire') {
      sheetName = 'Questionnaire_Responses'; headers = getQuestionnaireHeaders(); writer = writeQuestionnaireRow;
    } else {
      return jsonResponse({ ok: false, error: `Unknown formType: ${formType}` });
    }

    // Idempotency check: if this submissionId already exists, return success without re-appending.
    if (sid && hasSubmissionId(sheetName, sid)) {
      return jsonResponse({ ok: true, message: 'Already received', duplicate: true });
    }

    writer(submittedAt, data, sid);
    return jsonResponse({ ok: true, message: 'Saved successfully' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function hasSubmissionId(sheetName, sid) {
  if (!sid) return false;
  const sheet = getOrCreateSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIdx = headerRow.indexOf('submission_id');
  if (colIdx === -1) return false;
  const ids = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === sid) return true;
  }
  return false;
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
function buildRow(headers, submittedAt, data, submissionId) {
  return headers.map(h => {
    if (h === 'submitted_at') return submittedAt;
    if (h === 'submission_id') return submissionId || '';
    const value = data[h];
    if (Array.isArray(value)) return value.join(', ');
    return value !== undefined && value !== null ? String(value) : '';
  });
}

function writeClergyRow(submittedAt, data, submissionId) {
  const sheet = getOrCreateSheet('Clergy_Interviews');
  const headers = getClergyHeaders();
  ensureHeaders(sheet, headers);
  sheet.appendRow(buildRow(headers, submittedAt, data, submissionId));
}

function writeChecklistRow(submittedAt, data, submissionId) {
  const sheet = getOrCreateSheet('Field_Checklists');
  const headers = getChecklistHeaders();
  ensureHeaders(sheet, headers);
  sheet.appendRow(buildRow(headers, submittedAt, data, submissionId));
}

function writeQuestionnaireRow(submittedAt, data, submissionId) {
  const sheet = getOrCreateSheet('Questionnaire_Responses');
  const headers = getQuestionnaireHeaders();
  ensureHeaders(sheet, headers);
  sheet.appendRow(buildRow(headers, submittedAt, data, submissionId));
}

// ============ HEADER DEFINITIONS ============
function getClergyHeaders() {
  const headers = [
    'submitted_at',
    'submission_id',
    'church_name',
    'respondent_name',
    'respondent_role',
    'interview_date',
    'church_location'
  ];

  // Schedule A — selection + linked rank + Top 3 explanations
  headers.push('a_top10');
  for (let i = 1; i <= 10; i++) headers.push(`a_rank_rank${i}`);
  for (let i = 1; i <= 3; i++) headers.push(`a_top3_${i}_explain`);
  headers.push('a_closing_probe');

  // Schedule B — hindrance + Top 5 selection + linked rank + explanations
  for (let i = 1; i <= 40; i++) headers.push(`b_hindrance_${i}`);
  headers.push('b_top5');
  for (let i = 1; i <= 5; i++) {
    headers.push(`b_rank_rank${i}`);
    headers.push(`b_rank_rank${i}_explain`);
  }
  headers.push('b_closing_probe');

  // Schedule C — presence + reasons + feasibility selection + ranked feasibility
  for (let i = 1; i <= 22; i++) headers.push(`c_presence_${i}`);
  for (let i = 1; i <= 22; i++) headers.push(`c_reason_${i}`);
  headers.push('c_feasible_pick');
  for (let i = 1; i <= 10; i++) {
    headers.push(`c_feasibility_rank${i}`);
    headers.push(`c_feasibility_rank${i}_explain`);
    headers.push(`c_feasibility_rank${i}_cost`);
  }
  headers.push('c_closing_probe');

  // Schedule D — compliance + reasons + challenge selection + ranked challenges
  for (let i = 1; i <= 28; i++) headers.push(`d_compliance_${i}`);
  for (let i = 1; i <= 28; i++) headers.push(`d_reason_${i}`);
  headers.push('d_challenge_pick');
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
    'submission_id',
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

function getQuestionnaireHeaders() {
  const headers = [
    'submitted_at',
    'submission_id',
    'consent',
    // Section A: Demographics (12)
    'state_capital',
    'church_name',
    'denomination',
    'role',
    'role_other',
    'gender',
    'age_group',
    'years_at_church',
    'attendance',
    'lives_within_5km',
    'education',
    'employment',
    'children_attending'
  ];

  // Section B: 18 challenges (frequency 1-5)
  for (let i = 1; i <= 18; i++) headers.push(`b_freq_${i}`);
  headers.push('b19_other_challenge', 'b20_safety_impact');

  // Section C: 18 barriers (hindrance 1-5)
  for (let i = 1; i <= 18; i++) headers.push(`c_barriers_${i}`);
  headers.push('c19_other_barrier', 'c20_most_significant', 'c21_barrier_impact', 'c22_helpful_change');

  // Section D: 18 measures (adoption 0/1/2)
  for (let i = 1; i <= 18; i++) headers.push(`d_adoption_${i}`);

  // Section E: 34 satisfaction items (1-5)
  for (let i = 1; i <= 34; i++) headers.push(`e_satisfaction_${i}`);
  headers.push('e35_likes', 'e36_improvement');

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

  const questionnaireSheet = getOrCreateSheet('Questionnaire_Responses');
  ensureHeaders(questionnaireSheet, getQuestionnaireHeaders());

  Logger.log('✓ Sheets set up successfully');
  Logger.log('Clergy headers: ' + getClergyHeaders().length + ' columns');
  Logger.log('Checklist headers: ' + getChecklistHeaders().length + ' columns');
  Logger.log('Questionnaire headers: ' + getQuestionnaireHeaders().length + ' columns');
}

// ============ TEST FUNCTION (run after deploy to verify) ============
function testWrite() {
  const now = new Date().toISOString();
  const testId = 'TEST-' + Date.now();

  // 1. Checklist
  const checklistSid = testId + '-checklist';
  writeChecklistRow(now, {
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
  }, checklistSid);
  Logger.log('✓ Checklist row written, submission_id=' + checklistSid);

  // 2. Clergy
  const clergySid = testId + '-clergy';
  writeClergyRow(now, {
    church_name: 'Test Church',
    respondent_name: 'Test Respondent',
    respondent_role: 'Clergy',
    interview_date: '2026-05-05',
    church_location: 'Lagos',
    a_top10: ['A1', 'A2', 'A3'],
    a_rank_rank1: 'A1',
    a_top3_1_explain: 'Sample explanation',
    final_comments: 'Test run via testWrite()'
  }, clergySid);
  Logger.log('✓ Clergy row written, submission_id=' + clergySid);

  // 3. Questionnaire
  const questionnaireSid = testId + '-questionnaire';
  writeQuestionnaireRow(now, {
    consent: 'Yes',
    state_capital: 'Lagos (Ikeja/Lagos Island)',
    church_name: 'Test Church',
    denomination: 'Roman Catholic',
    role: 'Regular worshipper',
    gender: 'Female',
    age_group: '25–34 years',
    years_at_church: '1–5 years',
    attendance: '500–1,000',
    lives_within_5km: 'Yes',
    education: 'Tertiary',
    employment: 'Employed full-time',
    children_attending: 'No',
    b_freq_1: '3',
    e35_likes: 'Test run'
  }, questionnaireSid);
  Logger.log('✓ Questionnaire row written, submission_id=' + questionnaireSid);

  // 4. Idempotency check — re-using the same submission_id should NOT append a duplicate
  if (hasSubmissionId('Field_Checklists', checklistSid)) {
    Logger.log('✓ Idempotency check passes: ' + checklistSid + ' is detected as already present');
  } else {
    Logger.log('✗ Idempotency check FAILED: submission_id was not found after write');
  }
}
