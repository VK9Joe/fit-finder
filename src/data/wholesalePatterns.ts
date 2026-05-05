import { patternsFromCsv } from './patternsFromCsv';

const WHOLESALE_CODES = new Set([
  'CH-S',
  'MP-S', 'MP-M',
  'MPD-S',
  'MD-S',
  'RT-S',
  'IG-S', 'IG-M', 'IG-L', 'IG-XL',
  'BT-S',
  'DA-S', 'DA-L',
  'FB-S', 'FB-XL',
  'BG-M', 'BG-XL',
  'WP-L', 'WP-XL',
  'VS-M',
  'EB-S', 'EB-L', 'EB-XL',
  'BX-S', 'BX-M', 'BX-XL',
  'RR-S', 'RR-M', 'RR-L',
  'DP-XL',
  'GR-L', 'GR-XL',
  'GD-M', 'GD-XL',
]);

export const wholesalePatterns = patternsFromCsv.filter(
  (p) => WHOLESALE_CODES.has(p.patternCode)
);
