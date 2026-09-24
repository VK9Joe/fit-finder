/**
 * Fit Finder submission log — the Apps Script bound to the log spreadsheet.
 *
 * This file is the source of truth for what is deployed. To update it: paste it
 * into Extensions > Apps Script, save, then Deploy > Manage deployments > edit
 * the existing deployment > Version: New version > Deploy. Editing the existing
 * deployment keeps the /exec URL the app posts to; "New deployment" does not.
 *
 * Layout
 *   Sheet1     One row per retail submission. Columns A-R are unchanged from the
 *              original script, so existing analysis keeps working. The newer
 *              fields (ids, reason codes, device, unit...) follow from column S.
 *   Events     Everything that is not a submission: validation failures, product
 *              link clicks and Customer Service clicks. Kept off Sheet1 so that
 *              sheet stays one row per submission and success rates stay honest.
 *   Wholesale  Unchanged, apart from showing the pattern code instead of
 *              "undefined" in the result columns.
 *
 * Rows from the old app (no eventType, no ids) still land correctly, with the
 * new columns left blank, so this can be deployed before the app is switched over.
 */

const SUBMISSIONS_SHEET = 'Sheet1';
const EVENTS_SHEET = 'Events';

// Columns A-R: Timestamp .. Chondro (9), then Result/Links/Notes for 3 results.
const RESULT_SLOTS = 3;
const LEGACY_WIDTH = 9 + RESULT_SLOTS * 3;

// Retries of the same event arrive within seconds; six hours is Cache's maximum.
const DEDUPE_SECONDS = 6 * 60 * 60;

const SUBMISSION_COLUMNS = [
  ['Event ID', (d) => d.eventId],
  ['Session ID', (d) => d.sessionId],
  ['Attempt ID', (d) => d.attemptId],
  ['Scoring Version', (d) => d.scoringVersion],
  ['Result Confidence', (d) => d.resultConfidence],
  ['Result Count', (d) => d.resultCount],
  ['No-Result Reason', (d) => d.noResultReason],
  ['Changed Fields', (d) => d.changedFields],
  ['Unit', (d) => d.unit],
  ['Device', (d) => d.deviceCategory],
  ['Viewport', (d) => d.viewport],
  ['Embedded', (d) => yesNo(d.embedded)],
  ['QA', (d) => yesNo(d.isQa)],
];

const EVENT_COLUMNS = [
  ['Timestamp', (d) => d.timestamp],
  ['Event Type', (d) => d.eventType],
  ['Event ID', (d) => d.eventId],
  ['Session ID', (d) => d.sessionId],
  ['Attempt ID', (d) => d.attemptId],
  ['Scoring Version', (d) => d.scoringVersion],
  ['Validation Reason Codes', (d) => d.validationReasonCodes],
  ['No-Result Reason', (d) => d.noResultReason],
  ['Link Type', (d) => d.linkType],
  ['Channel', (d) => d.channel],
  ['Pattern', (d) => d.patternName],
  ['Breed', (d) => d.breed],
  ['Size', (d) => d.sizeCode],
  ['URL', (d) => d.url],
  ['Unit', (d) => d.unit],
  ['Device', (d) => d.deviceCategory],
  ['Viewport', (d) => d.viewport],
  ['Embedded', (d) => yesNo(d.embedded)],
  ['QA', (d) => yesNo(d.isQa)],
  ['IP', (d) => d.ip],
  ['User Agent', (d) => d.userAgent],
];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // Serialise writes so the duplicate check and the append cannot interleave.
  // If the lock is busy for 10s, still record the row: losing data is worse
  // than the small chance of a duplicate.
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(10000);

  try {
    if (isDuplicate(data.eventId)) {
      return ContentService.createTextOutput('duplicate');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const eventType = data.eventType || 'submission';

    if (data.sheetName || data.storeCode) {
      appendWholesale(ss, data);
    } else if (eventType === 'submission') {
      appendSubmission(ss, data);
    } else {
      appendEvent(ss, data);
    }

    rememberEvent(data.eventId);
    return ContentService.createTextOutput('ok');
  } finally {
    if (locked) lock.releaseLock();
  }
}

/** Retail submission: the original A-R layout, then the new fields from S. */
function appendSubmission(ss, data) {
  const sheet = ss.getSheetByName(SUBMISSIONS_SHEET) || ss.getActiveSheet();
  ensureHeaders(sheet, LEGACY_WIDTH + 1, SUBMISSION_COLUMNS);

  const row = legacyCells(data);

  // Rows used to stop after the last result, so a dog with one result had a
  // shorter row. Pad to all three result slots so the new fields always start
  // in column S.
  while (row.length < LEGACY_WIDTH) row.push('');

  SUBMISSION_COLUMNS.forEach(([, value]) => row.push(clean(value(data))));
  sheet.appendRow(row);
}

/** Non-submission events go to their own tab, created on first use. */
function appendEvent(ss, data) {
  let sheet = ss.getSheetByName(EVENTS_SHEET);
  if (!sheet) sheet = ss.insertSheet(EVENTS_SHEET);
  ensureHeaders(sheet, 1, EVENT_COLUMNS);

  sheet.appendRow(EVENT_COLUMNS.map(([, value]) => clean(value(data))));
}

/** Wholesale: exactly the original behaviour, store code first. */
function appendWholesale(ss, data) {
  const sheet = ss.getSheetByName(data.sheetName || SUBMISSIONS_SHEET) || ss.getActiveSheet();
  const row = [];
  if (data.storeCode) row.push(data.storeCode);
  sheet.appendRow(row.concat(legacyCells(data)));
}

/** The original script's cells, unchanged apart from the result-name fallback. */
function legacyCells(data) {
  const row = [
    data.timestamp,
    data.ip || 'unknown',
    data.userAgent || '',
    data.breed,
    data.neckCircumference,
    data.chestCircumference,
    data.backLength,
    data.tailType,
    data.chondrodystrophic ? 'Yes' : 'No',
  ];

  (data.topResults || []).slice(0, RESULT_SLOTS).forEach((r) => {
    // Wholesale results carry a pattern code rather than a name; without this
    // fallback those rows read "undefined (Best Fit)".
    row.push(`${r.name || r.patternCode || ''} (${r.fitLabel})`);
    row.push(r.productLinks || '');
    row.push(r.fitNotes || '');
  });

  return row;
}

/**
 * Write any missing headers, starting at `startColumn`. Existing header cells
 * are never overwritten. Checked once per six hours, not on every request.
 */
function ensureHeaders(sheet, startColumn, columns) {
  const cache = CacheService.getScriptCache();
  const key = `headers:${sheet.getName()}:${startColumn}:${columns.length}`;
  if (cache.get(key)) return;

  const range = sheet.getRange(1, startColumn, 1, columns.length);
  const current = range.getValues()[0];
  const wanted = columns.map(([header], i) => current[i] || header);
  if (wanted.some((header, i) => header !== current[i])) {
    range.setValues([wanted]);
  }
  cache.put(key, '1', DEDUPE_SECONDS);
}

/** Same event id seen recently: a network retry, not a new event. */
function isDuplicate(eventId) {
  if (!eventId) return false;
  return CacheService.getScriptCache().get(`event:${eventId}`) !== null;
}

function rememberEvent(eventId) {
  if (!eventId) return;
  CacheService.getScriptCache().put(`event:${eventId}`, '1', DEDUPE_SECONDS);
}

function yesNo(value) {
  if (value === undefined || value === null || value === '') return '';
  return value === true || value === 'true' ? 'Yes' : 'No';
}

function clean(value) {
  return value === undefined || value === null ? '' : value;
}
