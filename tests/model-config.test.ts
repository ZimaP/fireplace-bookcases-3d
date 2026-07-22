import { describe, expect, it } from 'vitest';
import {
  clampConfig,
  CONSTRUCTION,
  DEFAULT_CONFIG,
  deriveLayout,
  formatInches,
  MINIMUM_SHELF_OPENING,
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

  it.each([
    [58.5, 27, 1, false],
    [58.625, 27.0625, 1.25, false],
    [66.5, 31, 1.25, false],
    [66.625, 31.0625, 1.5, false],
    [76.5, 36, 1.5, false],
    [76.625, 36.0625, 1.5, true],
  ] as const)(
    'derives the shelf rule at a %s inch one-filler bookcase width',
    (width, span, thickness, supportRequired) => {
      const layout = deriveLayout({ ...DEFAULT_CONFIG, leftBookcaseWidth: width });

      expect(layout.leftBayWidth).toBe(span);
      expect(layout.leftAdjustableShelfThickness).toBe(thickness);
      expect(layout.leftShelfSupportRequired).toBe(supportRequired);
      expect(
        layout.structuralWarnings.some((warning) => warning.startsWith('Left bookcase clear')),
      ).toBe(supportRequired);
    },
  );

  it('derives left and right stock independently for asymmetric widths', () => {
    const layout = deriveLayout({
      ...DEFAULT_CONFIG,
      leftBookcaseWidth: 58.5,
      rightBookcaseWidth: 76.625,
    });

    expect(layout.leftBayWidth).toBe(27);
    expect(layout.rightBayWidth).toBe(36.0625);
    expect(layout.leftAdjustableShelfThickness).toBe(1);
    expect(layout.rightAdjustableShelfThickness).toBe(1.5);
    expect(layout.leftShelfSupportRequired).toBe(false);
    expect(layout.rightShelfSupportRequired).toBe(true);
    expect(layout.structuralWarnings.some((warning) => warning.startsWith('Left bookcase clear'))).toBe(false);
    expect(layout.structuralWarnings.some((warning) => warning.startsWith('Right bookcase clear'))).toBe(true);
  });

  it('deducts fillers, carcass sides, and center divider from clear span', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const expectedBayWidth = (
      DEFAULT_CONFIG.leftBookcaseWidth -
      DEFAULT_CONFIG.sideFiller -
      2 * CONSTRUCTION.carcassThickness -
      CONSTRUCTION.centerDividerWidth
    ) / 2;

    expect(expectedBayWidth).toBe(33.75);
    expect(layout.leftBayWidth).toBe(expectedBayWidth);
    expect(layout.rightBayWidth).toBe(expectedBayWidth);
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

  it('fits adversarial room inputs without crossing either side wall', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      roomWidth: 150,
      chimneyWidth: 96,
      centerGap: 8,
      leftBookcaseWidth: 108,
      rightBookcaseWidth: 108,
    });
    const layout = deriveLayout(config);

    expect(config.chimneyWidth).toBe(46);
    expect(config.leftBookcaseWidth).toBe(44);
    expect(config.rightBookcaseWidth).toBe(44);
    expect(layout.leftSideClearance).toBe(0);
    expect(layout.rightSideClearance).toBe(0);
    expect(layout.structuralWarnings).not.toContain(
      'The bookcases overlap the side-wall limits. Reduce unit widths or increase room width.',
    );
    expect(clampConfig(config)).toEqual(config);
  });

  it('caps each bookcase independently to its available wall span', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      leftBookcaseWidth: 108,
      rightBookcaseWidth: 60,
    });
    const layout = deriveLayout(config);

    expect(config.leftBookcaseWidth).toBe(80.5);
    expect(config.rightBookcaseWidth).toBe(60);
    expect(layout.leftSideClearance).toBe(0);
    expect(layout.rightSideClearance).toBe(20.5);
  });
});

describe('shelf-density guard', () => {
  it('reduces shelf count when the requested shelves would create unusable openings', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      roomHeight: 84,
      bookcaseHeight: 72,
      baseHeight: 42,
      crownHeight: 8,
      shelfCount: 8,
    });
    const layout = deriveLayout(config);
    const shelfThickness = Math.max(
      layout.leftAdjustableShelfThickness,
      layout.rightAdjustableShelfThickness,
    );
    const occupiedHeight =
      config.shelfCount * shelfThickness +
      (config.shelfCount + 1) * MINIMUM_SHELF_OPENING;
    const usableHeight =
      config.bookcaseHeight -
      (config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness) -
      config.crownHeight -
      CONSTRUCTION.faceFrameWidth;

    expect(config.shelfCount).toBe(2);
    expect(occupiedHeight).toBeLessThanOrEqual(usableHeight);
    expect(
      (config.shelfCount + 1) * shelfThickness +
      (config.shelfCount + 2) * MINIMUM_SHELF_OPENING,
    ).toBeGreaterThan(usableHeight);
  });

  it('retains the requested shelf count when the upper opening is tall enough', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      roomHeight: 168,
      bookcaseHeight: 156,
      baseHeight: 24,
      crownHeight: 1.5,
      shelfCount: 8,
    });

    expect(config.shelfCount).toBe(8);
  });
});

describe('fireplace constraint coordination', () => {
  it('keeps the opening clear of the widest pilaster plinths at minimum width', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      chimneyWidth: 42,
      fireplaceOpeningWidth: 60,
      mantelWidth: 42,
    });
    const outerMargin = Math.max(1.25, config.mantelWidth * 0.035);
    const pilasterWidth = Math.min(7.5, Math.max(5.25, config.mantelWidth * 0.105));
    const plinthInnerEdge =
      config.mantelWidth / 2 - outerMargin - pilasterWidth - 1.55 / 2;

    expect(config.fireplaceOpeningWidth / 2).toBeLessThan(plinthInnerEdge);
    expect(clampConfig(config)).toEqual(config);
  });

  it('fits the opening and mantel below an inset chimney-breast top', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      roomHeight: 84,
      chimneyTopInset: 36,
      fireplaceOpeningHeight: 42,
      mantelHeight: 62,
    });
    const chimneyFaceHeight = config.roomHeight - config.chimneyTopInset;

    expect(config.fireplaceOpeningHeight).toBe(34);
    expect(config.mantelHeight).toBe(48);
    expect(config.mantelHeight).toBeLessThanOrEqual(chimneyFaceHeight);
    expect(config.mantelHeight - config.fireplaceOpeningHeight).toBeGreaterThanOrEqual(14);
    expect(clampConfig(config)).toEqual(config);
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
