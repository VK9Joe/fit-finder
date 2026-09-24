import { NextResponse } from 'next/server';

/**
 * Forwards Fit Finder events to the Google Sheet via Apps Script.
 *
 * The client now sends richer events (session/attempt/event ids, validation and
 * no-result reason codes, link clicks). The Apps Script has to be updated to
 * place those in the right columns before it receives them — otherwise new
 * event types would land as near-empty rows among real submissions and skew the
 * success-rate numbers the sheet exists to measure.
 *
 * So until EXTENDED_LOGGING=true is set, this route forwards exactly what it
 * always has: one row per submission, with the original fields.
 */

const LEGACY_FIELDS = [
  'timestamp',
  'breed',
  'neckCircumference',
  'chestCircumference',
  'backLength',
  'tailType',
  'chondrodystrophic',
  'topResults',
  'userAgent',
] as const;

// Best-effort idempotency per server instance: a retried event id is accepted
// but not forwarded twice. The Apps Script de-duplicates as the real guarantee,
// because serverless instances do not share memory.
const recentEventIds = new Set<string>();
const MAX_REMEMBERED = 5000;

function alreadySeen(eventId: unknown): boolean {
  if (typeof eventId !== 'string' || !eventId) return false;
  if (recentEventIds.has(eventId)) return true;
  recentEventIds.add(eventId);
  if (recentEventIds.size > MAX_REMEMBERED) {
    const oldest = recentEventIds.values().next().value;
    if (oldest) recentEventIds.delete(oldest);
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ ok: false, error: 'GOOGLE_APPS_SCRIPT_URL not set' }, { status: 500 });
    }

    if (alreadySeen(body.eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const extended = process.env.EXTENDED_LOGGING === 'true';
    const eventType = body.eventType ?? 'submission';

    let payload: Record<string, unknown>;
    if (extended) {
      payload = { ...body, ip };
    } else {
      // Only submissions have somewhere to go in the current sheet.
      if (eventType !== 'submission') {
        return NextResponse.json({ ok: true, forwarded: false });
      }
      // Same fields, same order as before, with ip last as it always was.
      payload = {};
      for (const field of LEGACY_FIELDS) {
        if (field in body) payload[field] = body[field];
      }
      payload.ip = ip;
    }

    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error logging submission to Google Sheets:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
