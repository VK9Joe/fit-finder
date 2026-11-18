import type { UserInput } from '@/types';

/**
 * The tail-type question, shown as four illustrated cards so customers can see
 * where the coat is designed to end before they choose.
 *
 * Each card keeps its existing Fit-Finder tail-type value, so scoring, URL
 * parameters, the no-result panel and Google Sheets logging are unchanged.
 *
 * Artwork: the client's designer drew one side-view illustration per option
 * (public/tail-types/), all on the same 1000 x 700 canvas with the dog facing
 * right and standing on the same ground line, so the coat endpoints line up
 * when the cards sit side by side.
 */
export interface TailTypeOption {
  value: UserInput['tailType'];
  label: string;
  /** The one short line about coat length shown under the label. */
  caption: string;
  /** What the designer's illustration shows. Kept here for reference; not shown on screen. */
  illustrationNote: string;
  /** Path under /public to the designer's illustration. */
  artwork: string;
}

export const TAIL_TYPE_QUESTION = 'Which tail position and coat length best suit your dog?';

export const TAIL_TYPE_HELPER =
  'Look at how your dog usually carries their tail. If two options look close, choose the one that shows where you’d like the coat to end while leaving the tail free to move.';

export const TAIL_TYPE_OPTIONS: TailTypeOption[] = [
  {
    value: 'down/tucked',
    label: 'Down / tucked',
    caption: 'Coat extends past the haunches.',
    illustrationNote: 'Whippet or Greyhound with the tail tucked between the hind legs.',
    artwork: '/tail-types/down-tucked.png',
  },
  {
    value: 'straight',
    label: 'Straight',
    caption: 'Coat ends at the base of the tail.',
    illustrationNote: 'Labrador with the tail hanging loose or extending back from the spine.',
    artwork: '/tail-types/straight.png',
  },
  {
    value: 'bobbed/docked',
    label: 'Docked / bobbed',
    caption: 'Coat ends just before the base of the tail.',
    illustrationNote: 'Doberman with a short, stubby tail.',
    artwork: '/tail-types/docked-bobbed.png',
  },
  {
    value: 'up or curly',
    label: 'Up / curly',
    caption: 'Coat ends before the tail so it can curl freely.',
    illustrationNote: 'Pug with the tail held upright or curling forward over the back.',
    artwork: '/tail-types/up-curly.png',
  },
];

/** The card label for a stored tail-type value, e.g. "Docked / bobbed" for "bobbed/docked". */
export function tailTypeLabel(value: string): string {
  return TAIL_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
