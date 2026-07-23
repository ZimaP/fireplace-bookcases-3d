import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyRoomLayoutPreset,
  clampConfig,
  DEFAULT_CONFIG,
  deriveLayout,
  fitBookcasesToSelectedOpening,
  configToUrl,
  getDefaultConfigForLayout,
  getPlacementOptions,
  ROOM_LAYOUT_OPTIONS,
  readConfigFromUrl,
  type ModelConfig,
  type RoomLayoutId,
} from '../src/model/config';

afterEach(() => {
  vi.unstubAllGlobals();
});

const EXPECTED_COUNTS: Record<RoomLayoutId, number> = {
  'fireplace-wall': 2,
  'straight-wall': 1,
  'window-wall': 2,
  'center-niche': 1,
  'offset-alcove': 1,
};

describe('supplied room-layout presets', () => {
  it('exposes the existing fireplace room plus four new supplied layouts', () => {
    expect(ROOM_LAYOUT_OPTIONS.map((option) => option.value)).toEqual([
      'fireplace-wall',
      'straight-wall',
      'window-wall',
      'center-niche',
      'offset-alcove',
    ]);
    expect(ROOM_LAYOUT_OPTIONS.find((option) => option.value === 'offset-alcove')).toMatchObject({
      referenceFile: 'reference/layout-deep-alcove-left.jpg',
      secondaryReferenceFile: 'reference/layout-deep-alcove-right.jpg',
    });
  });

  it.each(ROOM_LAYOUT_OPTIONS.map((option) => option.value))(
    'derives finite, positive placements for %s',
    (roomLayout) => {
      const config = getDefaultConfigForLayout(roomLayout);
      const derived = deriveLayout(config);

      expect(derived.bookcasePlacements).toHaveLength(EXPECTED_COUNTS[roomLayout]);
      expect(derived.hasFireplace).toBe(roomLayout === 'fireplace-wall');
      for (const placement of derived.bookcasePlacements) {
        expect([
          placement.x,
          placement.z,
          placement.rotationY,
          placement.width,
          placement.openingStartX,
          placement.openingEndX,
          placement.openingWidth,
        ].every(Number.isFinite)).toBe(true);
        expect(placement.width).toBeGreaterThanOrEqual(44);
        expect(placement.openingWidth).toBeGreaterThan(0);
        expect(placement.x - placement.width / 2).toBeGreaterThanOrEqual(
          placement.openingStartX - 1e-7,
        );
        expect(placement.x + placement.width / 2).toBeLessThanOrEqual(
          placement.openingEndX + 1e-7,
        );
      }
    },
  );

  it('keeps the legacy fireplace default geometry and target unchanged', () => {
    const derived = deriveLayout(DEFAULT_CONFIG);

    expect(DEFAULT_CONFIG.roomLayout).toBe('fireplace-wall');
    expect(DEFAULT_CONFIG.placementTarget).toBe('fireplace-pair');
    expect(derived.bookcasePlacements.map((placement) => placement.x)).toEqual([
      derived.leftBookcaseX,
      derived.rightBookcaseX,
    ]);
    expect(derived.bookcasePlacements.map((placement) => placement.width)).toEqual([72, 72]);
  });

  it('normalizes a placement target that does not belong to the selected layout', () => {
    const input = {
      ...DEFAULT_CONFIG,
      roomLayout: 'center-niche',
      placementTarget: 'window-both',
    } as ModelConfig;
    const config = clampConfig(input);

    expect(config.placementTarget).toBe(getPlacementOptions('center-niche')[0].value);
    expect(deriveLayout(config).bookcasePlacements).toHaveLength(1);
  });

  it('uses each layout default target when a shared URL omits placementTarget', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?roomLayout=straight-wall',
        href: 'https://example.test/fireplace-bookcases-3d/?roomLayout=straight-wall',
      },
    });

    const config = readConfigFromUrl();

    expect(config.roomLayout).toBe('straight-wall');
    expect(config.placementTarget).toBe('wall-center');
    expect(deriveLayout(config).bookcasePlacements[0].x).toBe(0);
  });

  it('serializes the selected layout, target, and active width without dormant-width noise', () => {
    vi.stubGlobal('window', {
      location: {
        search: '',
        href: 'https://example.test/fireplace-bookcases-3d/',
      },
    });
    const config = clampConfig({
      ...getDefaultConfigForLayout('window-wall'),
      placementTarget: 'window-right',
      leftBookcaseWidth: 50,
      rightBookcaseWidth: 55,
    });
    const url = new URL(configToUrl(config));

    expect(url.searchParams.get('roomLayout')).toBe('window-wall');
    expect(url.searchParams.get('placementTarget')).toBe('window-right');
    expect(url.searchParams.get('rightBookcaseWidth')).toBe('55');
    expect(url.searchParams.has('leftBookcaseWidth')).toBe(false);
  });
});

describe('fit-to-opening behavior', () => {
  it.each([
    'straight-wall',
    'window-wall',
    'center-niche',
    'offset-alcove',
  ] as const)('loads and fits the active unit or units for %s', (roomLayout) => {
    const fitted = applyRoomLayoutPreset(DEFAULT_CONFIG, roomLayout);
    const derived = deriveLayout(fitted);

    for (const placement of derived.bookcasePlacements) {
      expect(placement.width).toBe(placement.openingWidth);
      expect(placement.width * 8).toBe(Math.round(placement.width * 8));
    }
    expect(clampConfig(fitted)).toEqual(fitted);
  });

  it('fits only the selected single bookcase width', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('window-wall'),
      placementTarget: 'window-right',
      leftBookcaseWidth: 50,
      rightBookcaseWidth: 48,
    });
    const fitted = fitBookcasesToSelectedOpening(config);
    const placement = deriveLayout(fitted).bookcasePlacements[0];

    expect(fitted.leftBookcaseWidth).toBe(50);
    expect(fitted.rightBookcaseWidth).toBe(placement.openingWidth);
    expect(placement.sourceSide).toBe('right');
  });

  it('rounds down to the nearest eighth without exceeding an opening', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('straight-wall'),
      wallOpeningWidth: 70.19,
      leftBookcaseWidth: 44,
    });
    const fitted = fitBookcasesToSelectedOpening(config);

    expect(fitted.leftBookcaseWidth).toBe(70.125);
    expect(fitted.leftBookcaseWidth).toBeLessThanOrEqual(config.wallOpeningWidth);
  });

  it('retains the automatic over-36-inch support warning in the fitted alcove', () => {
    const fitted = applyRoomLayoutPreset(DEFAULT_CONFIG, 'offset-alcove');
    const derived = deriveLayout(fitted);

    expect(fitted.leftBookcaseWidth).toBe(84);
    expect(derived.leftBayWidth).toBe(39.75);
    expect(derived.leftAdjustableShelfThickness).toBe(1.5);
    expect(derived.leftShelfSupportRequired).toBe(true);
    expect(derived.structuralWarnings.some((warning) => warning.includes('above the 36″'))).toBe(true);
  });
});

describe('layout-specific constraints', () => {
  it('does not let dormant chimney geometry shrink a straight-wall bookcase', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('straight-wall'),
      roomWidth: 150,
      wallOpeningWidth: 108,
      chimneyWidth: 96,
      centerGap: 8,
      leftBookcaseWidth: 108,
    });

    expect(config.leftBookcaseWidth).toBe(108);
    expect(deriveLayout(config).bookcasePlacements[0].openingWidth).toBe(108);
  });

  it('keeps both window installations outside the casing and inside the side walls', () => {
    const config = applyRoomLayoutPreset(DEFAULT_CONFIG, 'window-wall');
    const [left, right] = deriveLayout(config).bookcasePlacements;

    expect(left.openingEndX).toBeLessThan(0);
    expect(right.openingStartX).toBeGreaterThan(0);
    expect(left.x + left.width / 2).toBe(left.openingEndX);
    expect(right.x - right.width / 2).toBe(right.openingStartX);
  });

  it('uses the editable alcove opening as the physical narrow-room envelope', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('offset-alcove'),
      alcoveOpeningWidth: 96,
      alcoveDepth: 200,
    });

    expect(config.roomWidth).toBe(96);
    expect(config.roomDepth).toBe(200);
    expect(deriveLayout(config).bookcasePlacements[0].openingWidth).toBe(96);
  });

  it('normalizes deep-alcove state idempotently even when dormant spans are wider', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('offset-alcove'),
      roomWidth: 180,
      alcoveOpeningWidth: 44,
      wallOpeningWidth: 180,
      nicheWidth: 180,
    });

    expect(config.roomWidth).toBe(44);
    expect(config.wallOpeningWidth).toBe(44);
    expect(config.nicheWidth).toBe(44);
    expect(clampConfig(config)).toEqual(config);
  });

  it.each(ROOM_LAYOUT_OPTIONS.map((option) => option.value))(
    'stays finite and contained under adversarial inputs for %s',
    (roomLayout) => {
      const config = clampConfig({
        ...getDefaultConfigForLayout(roomLayout),
        roomWidth: 72,
        roomDepth: 72,
        roomHeight: 84,
        leftBookcaseWidth: 180,
        rightBookcaseWidth: 180,
        bookcaseHeight: 156,
        shelfCount: 8,
      });
      const derived = deriveLayout(config);

      expect(clampConfig(config)).toEqual(config);
      expect(config.bookcaseHeight).toBeLessThan(config.roomHeight);
      for (const placement of derived.bookcasePlacements) {
        expect(placement.width).toBeGreaterThanOrEqual(44);
        expect(placement.x - placement.width / 2).toBeGreaterThanOrEqual(
          placement.openingStartX - 1e-7,
        );
        expect(placement.x + placement.width / 2).toBeLessThanOrEqual(
          placement.openingEndX + 1e-7,
        );
      }
    },
  );
});
