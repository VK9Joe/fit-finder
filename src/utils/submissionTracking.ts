'use client';

import { UserInput } from '@/types';

/**
 * Identity, idempotency and context for submission logging
 * (Brief, Priorities 1 and 4).
 *
 * The log held 375 exact duplicates, 353 of them sharing an IP and a submission
 * minute — double taps and repeated form events rather than real attempts. IP is
 * also the only customer identifier today, which is unreliable: one IP can be
 * several customers, one customer several IPs.
 *
 * So every deliberate submission carries three ids: a session id (this browser
 * session), an attempt id (this dog, reset on Start Over) and an event id (this
 * one submission, the idempotency key). A retry reuses its event id, so the same
 * submission can never be recorded twice.
 *
 * Storage access is wrapped throughout: this app runs in a cross-origin iframe
 * where session and local storage can be partitioned or throw outright, and the
 * ids must keep working regardless.
 */

/** Bump when scoring rules change, so rows can be compared against the right engine. */
export const SCORING_VERSION = '2026-09-17.1';

const SESSION_ID_KEY = 'k9-fitfinder:session-id';

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the manual generator below.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Used when sessionStorage is unavailable, so ids stay stable within the page.
let inMemorySessionId: string | null = null;

/** Anonymous id for this browser session. Contains nothing personal. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const created = randomId();
    window.sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    if (!inMemorySessionId) inMemorySessionId = randomId();
    return inMemorySessionId;
  }
}

// One dog / one run at the form. Module-level so click events logged from deep
// inside the results can be tied back to the attempt that produced them.
let currentAttemptId: string | null = null;

/** Id for the current dog / run at the form, created on first use. */
export function getAttemptId(): string {
  if (!currentAttemptId) currentAttemptId = randomId();
  return currentAttemptId;
}

/** Start a new attempt — called when the customer starts over with a new dog. */
export function resetAttemptId(): void {
  currentAttemptId = randomId();
}

/** Idempotency key for a single deliberate submission. */
export function createEventId(): string {
  return randomId();
}

/**
 * Stable fingerprint of a set of measurements. Two submissions with the same
 * fingerprint are the same attempt, so the second is a duplicate rather than a
 * deliberate retry.
 */
export function fingerprintMeasurements(measurements: UserInput): string {
  return [
    measurements.breed.trim().toLowerCase(),
    measurements.neckCircumference,
    measurements.chestCircumference,
    measurements.backLength,
    measurements.tailType,
    // The URL omits chondro when false, so treat missing and false as the same.
    Boolean(measurements.chondrodystrophic),
  ].join('|');
}

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface ViewportContext {
  deviceCategory: DeviceCategory;
  viewport: string;
  embedded: boolean;
}

/** Device and viewport category, plus whether we are inside the storefront iframe. */
export function getViewportContext(): ViewportContext {
  if (typeof window === 'undefined') {
    return { deviceCategory: 'unknown', viewport: 'unknown', embedded: false };
  }

  const width = window.innerWidth;
  const deviceCategory: DeviceCategory =
    width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  return {
    deviceCategory,
    viewport: `${width}x${window.innerHeight}`,
    embedded: window.parent !== window,
  };
}

/**
 * Whether this submission came from internal testing, so QA runs can be excluded
 * from the success-rate numbers. Set with ?qa=1 ; it sticks for the session.
 */
export function isQaSession(): boolean {
  if (typeof window === 'undefined') return false;

  const QA_KEY = 'k9-fitfinder:qa';
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qa') === '1') {
      window.sessionStorage.setItem(QA_KEY, '1');
      return true;
    }
    return window.sessionStorage.getItem(QA_KEY) === '1';
  } catch {
    try {
      return new URLSearchParams(window.location.search).get('qa') === '1';
    } catch {
      return false;
    }
  }
}

/**
 * Which fields changed between two attempts, so the team can tell a customer
 * correcting a measurement from one generating duplicate events.
 */
export function changedFields(
  previous: UserInput | null,
  next: UserInput
): string[] {
  if (!previous) return [];

  const keys: (keyof UserInput)[] = [
    'breed',
    'neckCircumference',
    'chestCircumference',
    'backLength',
    'tailType',
    'chondrodystrophic',
  ];
  return keys.filter((key) => previous[key] !== next[key]);
}

/**
 * Timestamp in the format the sheet already uses ("18 Sept 2026 14:05"), so new
 * event types sort and read alongside the existing submission rows.
 */
export function formatLogTimestamp(date: Date = new Date()): string {
  return (
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

export type LogEventType =
  | 'submission'
  | 'validation_failure'
  | 'product_link_click'
  | 'customer_service_click';

/**
 * Send one event to the submission log with the shared identity and context
 * fields attached.
 *
 * `beacon` is for clicks on links that navigate the whole page away: a normal
 * fetch is cancelled by the navigation, sendBeacon is not.
 */
export function logEvent(
  eventType: LogEventType,
  fields: Record<string, unknown>,
  options: { beacon?: boolean; eventId?: string } = {}
): void {
  if (typeof window === 'undefined') return;

  const viewport = getViewportContext();
  const body = JSON.stringify({
    timestamp: formatLogTimestamp(),
    eventType,
    sessionId: getSessionId(),
    attemptId: getAttemptId(),
    eventId: options.eventId ?? createEventId(),
    scoringVersion: SCORING_VERSION,
    deviceCategory: viewport.deviceCategory,
    viewport: viewport.viewport,
    embedded: viewport.embedded,
    isQa: isQaSession(),
    userAgent: navigator.userAgent,
    ...fields,
  });

  if (options.beacon && typeof navigator.sendBeacon === 'function') {
    try {
      const sent = navigator.sendBeacon(
        '/api/log-submission',
        new Blob([body], { type: 'application/json' })
      );
      if (sent) return;
    } catch {
      // Fall through to fetch.
    }
  }

  fetch('/api/log-submission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch((err) => console.error(`Failed to log ${eventType}:`, err));
}
