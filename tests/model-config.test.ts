import { describe, expect, it } from 'vitest';
import {
  clampConfig,
  CONSTRUCTION,
  DEFAULT_CONFIG,
  deriveLayout,
  formatInches,
  selectAdjustableShelfRule,
  snapToShelfPinGrid,
  type ModelConfig,
} from '../src/model/config';

describe('drawing-controlled construction', () => {
  it('exports the fixed construction values without mutable config duplicates', () => {
    expect(CONSTRUCTION).toMatchObject({
      carcassThickness: 0.75,
      finishedBackThickness: 0.25,
      faceFrameWidth: 1.5,
      centerDividerWidth: 1.5,
      doorThickness: 0.75,
      fixedTransitionShelfThickness: 1.25,
      shelfPinSpacing: 2,
      minimumSideFiller: 0.75,
    });
    expect(CONSTRUCTION.shelfPinDiameter).toBeCloseTo(5 / 25.4, 10);
    expect(DEFAULT_CONFIG).not.toHaveProperty('caseThickness');
    expect(DEFAULT_CONFIG).not.toHaveProperty('faceFrameWidth');
    expect(DEFAULT_CONFIG).not.toHaveProperty('countertopThickness');
    expect(DEFAULT_CONFIG).not.toHaveProperty('shelfThickness');
  });

  it('clamps the field-fit filler to the drawing minimum', () => {
    const clamped = clampConfig({ ...DEFAULT_CONFIG, sideFiller: 0.1 });
    expect(clamped.sideFiller).toBe(CONSTRUCTION.minimumSideFiller);
  });
});

describe('automatic adjustable shelf stock', () => {
  it.each([
    [0, 1, false],
    [27, 1, false],
    [27.0001, 1.25, false],
    [31, 1.25, false],
    [31.0001, 1.5, false],
    [36, 1.5, false],
    [36.0001, 1.5, true],
  ] as const)('maps a %s inch clear span to %s inch stock', (span, thickness, supportRequired) => {
    expect(selectAdjustableShelfRule(span)).toEqual({ thickness, supportRequired });
  });

  it('derives left and right stock independently for asymmetric widths', () => {
    const layout = deriveLayout({
      ...DEFAULT_CONFIG,
      leftBookcaseWidth: 60,
      rightBookcaseWidth: 79,
    });

    expect(layout.leftBayWidth).toBe(27);
    expect(layout.rightBayWidth).toBe(36.5);
    expect(layout.leftAdjustableShelfThickness).toBe(1);
    expect(layout.rightAdjustableShelfThickness).toBe(1.5);
    expect(layout.leftShelfSupportRequired).toBe(false);
    expect(layout.rightShelfSupportRequired).toBe(true);
    expect(layout.structuralWarnings.some((warning) => warning.startsWith('Left bookcase clear'))).toBe(false);
    expect(layout.structuralWarnings.some((warning) => warning.startsWith('Right bookcase clear'))).toBe(true);
  });

  it('deducts fillers, carcass sides, and center divider from clear span', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    expect(layout.leftBayWidth).toBe(33);
    expect(layout.rightBayWidth).toBe(33);
  });
});

describe('independent parametric layout', () => {
  it('keeps the right unit unchanged when only the left width changes', () => {
    const before = deriveLayout(DEFAULT_CONFIG);
    const changed = deriveLayout({ ...DEFAULT_CONFIG, leftBookcaseWidth: 60 });

    expect(changed.rightBayWidth).toBe(before.rightBayWidth);
    expect(changed.rightBookcaseX).toBe(before.rightBookcaseX);
    expect(changed.leftBayWidth).not.toBe(before.leftBayWidth);
    expect(changed.leftBookcaseX + 60 / 2).toBe(before.leftBookcaseX + 72 / 2);
  });

  it.each([
    {
      roomWidth: 150,
      roomDepth: 96,
      roomHeight: 84,
      leftBookcaseWidth: 44,
      rightBookcaseWidth: 44,
      bookcaseHeight: 72,
      upperDepth: 10,
      baseDepth: 16,
      baseHeight: 24,
    },
    {
      roomWidth: 360,
      roomDepth: 300,
      roomHeight: 168,
      leftBookcaseWidth: 108,
      rightBookcaseWidth: 108,
      bookcaseHeight: 156,
      upperDepth: 22,
      baseDepth: 30,
      baseHeight: 42,
    },
  ])('keeps derived geometry inputs finite and positive at range limits', (overrides) => {
    const config = clampConfig({ ...DEFAULT_CONFIG, ...overrides } as ModelConfig);
    const layout = deriveLayout(config);
    const geometryInputs = [
      layout.leftBookcaseX,
      layout.rightBookcaseX,
      layout.leftBayWidth,
      layout.rightBayWidth,
      layout.upperStartY,
      layout.upperClearHeight,
      layout.leftSideClearance,
      layout.rightSideClearance,
    ];

    expect(geometryInputs.every(Number.isFinite)).toBe(true);
    expect(layout.leftBayWidth).toBeGreaterThan(0);
    expect(layout.rightBayWidth).toBeGreaterThan(0);
    expect(layout.upperClearHeight).toBeGreaterThan(0);
  });
});

describe('grid and imperial formatting helpers', () => {
  it('snaps support heights to the two-inch grid', () => {
    expect(snapToShelfPinGrid(13.1, 5)).toBe(13);
    expect(snapToShelfPinGrid(14.1, 5)).toBe(15);
  });

  it.each([
    [24, '24″'],
    [34.5, '34 1⁄2″'],
    [3.9375, '3 15⁄16″'],
    [23.999, '24″'],
    [0.25000000001, '1⁄4″'],
  ])('formats %s inches as %s', (value, formatted) => {
    expect(formatInches(value)).toBe(formatted);
  });
});
