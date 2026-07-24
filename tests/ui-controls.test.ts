import { describe, expect, it } from 'vitest';
import {
  formatFeetAndInches,
  parseImperialInput,
} from '../src/ui/controls';

describe('homeowner measurement entry', () => {
  it.each([
    ['67.5', 67.5],
    ['67 1/2', 67.5],
    ['67-1/2', 67.5],
    ['1/8', 0.125],
    ['-8 3/4', -8.75],
    ['104″', 104],
    ['104 inches', 104],
  ])('parses %s as %s inches', (raw, expected) => {
    expect(parseImperialInput(raw)).toBe(expected);
  });

  it.each(['', 'one half', '12 / 0', '12 3'])('rejects invalid measurement %s', (raw) => {
    expect(parseImperialInput(raw)).toBeNaN();
  });

  it.each([
    [180, '15 ft'],
    [104, '8 ft 8 in'],
    [67.5, '5 ft 7 1⁄2 in'],
    [-48, '−4 ft'],
    [11.5, ''],
  ] as const)('formats %s inches as %s', (value, expected) => {
    expect(formatFeetAndInches(value)).toBe(expected);
  });
});
