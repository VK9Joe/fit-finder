import { patternsFromCsv } from '@/data/patternsFromCsv';

/**
 * Validation applied before anything reaches the scoring engine (Brief, Priority 2).
 *
 * The submission log contained a 177" neck, a 230" chest and a 2,512" back
 * length, plus a run of entries that were plainly centimetres. None of those can
 * ever match a pattern, so they are stopped at the form with a message that says
 * which field is wrong and why, instead of being scored into an empty result.
 *
 * Bounds are derived from the pattern library itself rather than hardcoded, so
 * they stay correct when patterns are added or retired.
 */

const CM_PER_INCH = 2.54;

/** Back length 0 is the deliberate "skip back length" signal, not a measurement. */
export const SKIP_LENGTH = 0;

function servableRange(): {
  neck: { min: number; max: number };
  chest: { min: number; max: number };
  length: { min: number; max: number };
} {
  const lengths: number[] = [];
  for (const pattern of patternsFromCsv) {
    for (const key of ['twLength', 'rcLength', 'wcLength', 'ccLength'] as const) {
      const value = pattern.measurements[key];
      if (typeof value === 'number' && value > 0) lengths.push(value);
    }
  }

  return {
    neck: {
      min: Math.min(...patternsFromCsv.map((p) => p.measurements.minNeck)),
      max: Math.max(...patternsFromCsv.map((p) => p.measurements.maxNeck)),
    },
    chest: {
      min: Math.min(...patternsFromCsv.map((p) => p.measurements.minChest)),
      max: Math.max(...patternsFromCsv.map((p) => p.measurements.maxChest)),
    },
    length: { min: Math.min(...lengths), max: Math.max(...lengths) },
  };
}

/** Widest neck/chest/length any pattern in the catalog can serve. */
export const SERVABLE = servableRange();

export type MeasurementField = 'neckCircumference' | 'chestCircumference' | 'backLength';

export type ValidationReasonCode =
  | 'MISSING'
  | 'NOT_A_NUMBER'
  | 'NECK_BELOW_MIN'
  | 'NECK_ABOVE_MAX'
  | 'CHEST_BELOW_MIN'
  | 'CHEST_ABOVE_MAX'
  | 'LENGTH_BELOW_MIN'
  | 'LENGTH_ABOVE_MAX'
  | 'NECK_NOT_SMALLER_THAN_CHEST'
  | 'LIKELY_CENTIMETERS';

export interface FieldError {
  code: ValidationReasonCode;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<MeasurementField, FieldError>>;
  /** Flat list for logging, so every validation failure carries a reason code. */
  reasonCodes: ValidationReasonCode[];
}

const FIELD_LABELS: Record<MeasurementField, string> = {
  neckCircumference: 'neck',
  chestCircumference: 'chest',
  backLength: 'back length',
};

function round(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

/**
 * A value is "probably centimetres" when it is too large to be inches but lands
 * inside the servable range once converted. Detection only - the brief is
 * explicit that suspicious values must never be silently converted.
 */
function looksLikeCentimetres(value: number, range: { min: number; max: number }): boolean {
  if (value <= range.max) return false;
  const asInches = value / CM_PER_INCH;
  return asInches >= range.min && asInches <= range.max;
}

function checkField(
  field: MeasurementField,
  value: number | undefined,
  range: { min: number; max: number },
  belowCode: ValidationReasonCode,
  aboveCode: ValidationReasonCode
): FieldError | null {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return { code: 'MISSING', message: `Please enter a ${FIELD_LABELS[field]} measurement.` };
  }
  if (!Number.isFinite(value)) {
    return { code: 'NOT_A_NUMBER', message: `Please enter a number for ${FIELD_LABELS[field]}.` };
  }

  if (looksLikeCentimetres(value, range)) {
    return {
      code: 'LIKELY_CENTIMETERS',
      message:
        `${round(value)} looks like centimetres. That is about ${round(value / CM_PER_INCH)} inches — ` +
        `switch the unit to cm above, or re-enter this in inches.`,
    };
  }

  if (value < range.min) {
    return {
      code: belowCode,
      message: `Our smallest pattern fits a ${FIELD_LABELS[field]} of ${round(range.min)}". Please double-check this measurement.`,
    };
  }
  if (value > range.max) {
    return {
      code: aboveCode,
      message: `Our largest pattern fits a ${FIELD_LABELS[field]} of ${round(range.max)}". Please double-check this measurement.`,
    };
  }

  return null;
}

/**
 * Validate measurements that are already in inches.
 * `backLength` of 0 is allowed and means the customer chose to skip it.
 */
export function validateMeasurements(input: {
  neckCircumference?: number;
  chestCircumference?: number;
  backLength?: number;
}): ValidationResult {
  const errors: Partial<Record<MeasurementField, FieldError>> = {};

  const neck = checkField('neckCircumference', input.neckCircumference, SERVABLE.neck, 'NECK_BELOW_MIN', 'NECK_ABOVE_MAX');
  if (neck) errors.neckCircumference = neck;

  const chest = checkField('chestCircumference', input.chestCircumference, SERVABLE.chest, 'CHEST_BELOW_MIN', 'CHEST_ABOVE_MAX');
  if (chest) errors.chestCircumference = chest;

  // Skipping back length is a supported path, so only range-check a real value.
  if (input.backLength !== SKIP_LENGTH) {
    const length = checkField('backLength', input.backLength, SERVABLE.length, 'LENGTH_BELOW_MIN', 'LENGTH_ABOVE_MAX');
    if (length) errors.backLength = length;
  }

  // Every logged submission with neck >= chest failed to match. It is an
  // anatomical impossibility on a dog and almost always two swapped fields.
  if (
    !errors.neckCircumference &&
    !errors.chestCircumference &&
    typeof input.neckCircumference === 'number' &&
    typeof input.chestCircumference === 'number' &&
    input.neckCircumference >= input.chestCircumference
  ) {
    errors.neckCircumference = {
      code: 'NECK_NOT_SMALLER_THAN_CHEST',
      message:
        'The neck measurement must be smaller than the chest. These two are often entered the ' +
        'other way round — the chest is measured around the widest part, behind the front legs.',
    };
  }

  const reasonCodes = Object.values(errors).map((error) => error.code);
  return { ok: reasonCodes.length === 0, errors, reasonCodes };
}

/** Convert a displayed value to the inches the scoring engine expects. */
export function toInches(value: number, unit: 'in' | 'cm'): number {
  if (unit === 'in') return value;
  return Math.round((value / CM_PER_INCH) * 100) / 100;
}
