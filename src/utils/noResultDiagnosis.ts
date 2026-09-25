import { UserInput, CoatPattern, CategorizedFitResults } from '@/types';
import { findPatterns } from '@/utils/patternFinder';
import { findPatternsNoLength } from '@/utils/noLengthMatcher';
import { validateMeasurements, SERVABLE, SKIP_LENGTH } from '@/utils/measurementValidation';

/**
 * Works out why a submission produced nothing (Brief, Priority 3).
 *
 * Only 25% of sessions that started with a no-result ever went on to get a
 * recommendation, because the customer was told to try again without being told
 * what was wrong. This returns a reason code plus customer-facing copy naming
 * the one measurement or rule that blocked the match.
 *
 * The diagnosis runs the real scoring engine rather than re-deriving its rules,
 * so it cannot drift away from what actually happened.
 */

export type NoResultReasonCode =
  | 'INVALID_MEASUREMENT'
  | 'NECK_OUT_OF_RANGE'
  | 'CHEST_OUT_OF_RANGE'
  | 'LENGTH_OUT_OF_RANGE'
  | 'TAIL_RULE'
  | 'NO_PATTERN_COVERAGE';

export type FocusField = 'neckCircumference' | 'chestCircumference' | 'backLength' | 'tailType';

export interface NoResultDiagnosis {
  code: NoResultReasonCode;
  /** The single field the customer should correct, if there is one. */
  focusField?: FocusField;
  /** Short customer-facing statement of what blocked the match. */
  headline: string;
  /** What to do about it. */
  detail: string;
  /** Set when the same measurements would match under a different tail type. */
  suggestedTailType?: UserInput['tailType'];
  /** The tail type the customer entered, so the panel can offer the others. */
  currentTailType?: UserInput['tailType'];
  /** Set when skipping back length would produce matches. */
  skipLengthWouldMatch?: boolean;
}

function hasMatches(results: CategorizedFitResults): boolean {
  return (
    results.bestFit.length > 0 || results.goodFit.length > 0 || results.mightFit.length > 0
  );
}

const TAIL_TYPES: UserInput['tailType'][] = [
  'down/tucked',
  'bobbed/docked',
  'straight',
  'up or curly',
];

function format(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

/**
 * "a" or "an" for a number as it is read aloud: "an 8", "an 11", "an 18",
 * "an 80", but "a 12" and "a 47".
 */
function articleForNumber(value: number): 'a' | 'an' {
  const whole = Math.floor(Math.abs(value));
  return /^8/.test(String(whole)) || whole === 11 || whole === 18 ? 'an' : 'a';
}

/** "A straight tail" but "An up or curly tail". */
function articleForWord(word: string): 'A' | 'An' {
  return /^[aeiou]/i.test(word) ? 'An' : 'A';
}

export function diagnoseNoResult(
  input: UserInput,
  allPatterns: CoatPattern[]
): NoResultDiagnosis {
  // 1. Measurements that should never have been scored in the first place.
  const validation = validateMeasurements(input);
  if (!validation.ok) {
    const firstError = Object.values(validation.errors)[0];
    const firstField = Object.keys(validation.errors)[0] as FocusField | undefined;
    return {
      code: 'INVALID_MEASUREMENT',
      focusField: firstField,
      headline: 'One of the measurements needs a second look.',
      detail: firstError?.message ?? 'Please check the measurements and try again.',
    };
  }

  // 2. Neck is the engine's first filter, so check it first.
  const neckPassing = allPatterns.filter(
    (p) =>
      input.neckCircumference >= p.measurements.minNeck &&
      input.neckCircumference <= p.measurements.maxNeck
  );
  if (neckPassing.length === 0) {
    return {
      code: 'NECK_OUT_OF_RANGE',
      focusField: 'neckCircumference',
      headline: `We do not have a pattern for ${articleForNumber(input.neckCircumference)} ${format(input.neckCircumference)}" neck.`,
      detail:
        `Our patterns fit necks from ${format(SERVABLE.neck.min)}" to ${format(SERVABLE.neck.max)}". ` +
        'Measure around the base of the neck where the collar sits, keeping the tape snug but not tight.',
    };
  }

  // 3. Chest, among the patterns the neck already allows.
  const chestPassing = neckPassing.filter(
    (p) =>
      input.chestCircumference >= p.measurements.minChest &&
      input.chestCircumference <= p.measurements.maxChest
  );
  if (chestPassing.length === 0) {
    return {
      code: 'CHEST_OUT_OF_RANGE',
      focusField: 'chestCircumference',
      headline: `No pattern pairs ${articleForNumber(input.neckCircumference)} ${format(input.neckCircumference)}" neck with ${articleForNumber(input.chestCircumference)} ${format(input.chestCircumference)}" chest.`,
      detail:
        'Measure the chest around the widest part of the ribcage, just behind the front legs. ' +
        'If both measurements are right, our Customer Service team can help find a fit.',
    };
  }

  // 4. Neck and chest both work, so the block is length or the tail rule.
  //    Tail type decides which pattern length is compared, which is why
  //    bobbed/docked dogs fail far more often than straight-tailed ones.
  if (input.backLength !== SKIP_LENGTH) {
    for (const tailType of TAIL_TYPES) {
      if (tailType === input.tailType) continue;
      if (hasMatches(findPatterns({ ...input, tailType }, allPatterns))) {
        return {
          code: 'TAIL_RULE',
          focusField: 'tailType',
          headline: 'The tail type is what is blocking the match.',
          detail:
            `${articleForWord(input.tailType)} ${input.tailType} tail is measured against a different pattern length. These same ` +
            `measurements do match if the tail type is "${tailType}" — worth checking which one ` +
            'describes your dog.',
          suggestedTailType: tailType,
          currentTailType: input.tailType,
        };
      }
    }

    // 5. Length itself is the blocker: everything matches without it.
    if (hasMatches(findPatternsNoLength({ ...input, backLength: SKIP_LENGTH }, allPatterns))) {
      return {
        code: 'LENGTH_OUT_OF_RANGE',
        focusField: 'backLength',
        headline: `The ${format(input.backLength)}" back length is what rules every pattern out.`,
        detail:
          'Measure from the base of the neck to the base of the tail, with your dog standing. ' +
          'If that is correct, you can enter 00 for back length and we will match on neck and chest alone.',
        skipLengthWouldMatch: true,
      };
    }
  }

  // 6. Valid, in-range measurements that simply are not covered.
  return {
    code: 'NO_PATTERN_COVERAGE',
    headline: 'These measurements fall between our patterns.',
    detail:
      'Each measurement is within range on its own, but no single pattern covers this combination. ' +
      'Our Customer Service team can help find the right option.',
  };
}

/**
 * Tail types grouped by the pattern length they are scored against. Bobbed/docked
 * and up-or-curly share one rule in calculateLengthScore, so offering both would
 * just repeat the same result.
 */
const TAIL_LENGTH_GROUPS: Array<{ value: UserInput['tailType']; members: UserInput['tailType'][]; label: string }> = [
  { value: 'down/tucked', members: ['down/tucked'], label: 'down/tucked' },
  { value: 'straight', members: ['straight'], label: 'straight' },
  { value: 'bobbed/docked', members: ['bobbed/docked', 'up or curly'], label: 'bobbed/docked or up or curly' },
];

/** The two length groups other than the customer's own, e.g. for the tail-type buttons. */
export function otherTailOptions(
  current: UserInput['tailType'] | undefined
): Array<{ value: UserInput['tailType']; label: string }> {
  return TAIL_LENGTH_GROUPS.filter((group) => !current || !group.members.includes(current)).map(
    ({ value, label }) => ({ value, label })
  );
}
