import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import {
  applyRoomLayoutPreset,
  clampConfig,
  DEFAULT_CONFIG,
  deriveLayout,
  fitBookcasesToSelectedOpening,
  configToUrl,
  getDefaultConfigForLayout,
  getLayoutDimensionKeys,
  getPlacementOptions,
  getRoomLayoutOption,
  ROOM_LAYOUT_OPTIONS,
  readConfigFromUrl,
  type ModelConfig,
  type PlacementTarget,
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
  'door-wall': 2,
  'offset-window-wall': 2,
  'double-window-wall': 1,
  'media-wall': 2,
  'side-nook': 1,
};

const EXPECTED_TARGETS: Record<
  RoomLayoutId,
  readonly { value: PlacementTarget; placementCount: number }[]
> = {
  'fireplace-wall': [{ value: 'fireplace-pair', placementCount: 2 }],
  'straight-wall': [
    { value: 'wall-left', placementCount: 1 },
    { value: 'wall-center', placementCount: 1 },
    { value: 'wall-right', placementCount: 1 },
  ],
  'window-wall': [
    { value: 'window-left', placementCount: 1 },
    { value: 'window-right', placementCount: 1 },
    { value: 'window-both', placementCount: 2 },
  ],
  'center-niche': [{ value: 'niche-center', placementCount: 1 }],
  'offset-alcove': [{ value: 'alcove-center', placementCount: 1 }],
  'door-wall': [
    { value: 'door-left', placementCount: 1 },
    { value: 'door-right', placementCount: 1 },
    { value: 'door-both', placementCount: 2 },
  ],
  'offset-window-wall': [
    { value: 'offset-window-left', placementCount: 1 },
    { value: 'offset-window-right', placementCount: 1 },
    { value: 'offset-window-both', placementCount: 2 },
  ],
  'double-window-wall': [
    { value: 'double-window-center', placementCount: 1 },
    { value: 'double-window-outer', placementCount: 2 },
  ],
  'media-wall': [
    { value: 'media-left', placementCount: 1 },
    { value: 'media-right', placementCount: 1 },
    { value: 'media-both', placementCount: 2 },
  ],
  'side-nook': [
    { value: 'side-nook-left', placementCount: 1 },
    { value: 'side-nook-right', placementCount: 1 },
  ],
};

const ALL_TARGET_CASES = ROOM_LAYOUT_OPTIONS.flatMap((layoutOption) =>
  EXPECTED_TARGETS[layoutOption.value].map((target) => ({
    roomLayout: layoutOption.value,
    ...target,
  })),
);

describe('ten-layout room catalog', () => {
  it('exposes the five owner references followed by five catalog studies', () => {
    expect(ROOM_LAYOUT_OPTIONS.map((option) => option.value)).toEqual([
      'fireplace-wall',
      'straight-wall',
      'window-wall',
      'center-niche',
      'offset-alcove',
      'door-wall',
      'offset-window-wall',
      'double-window-wall',
      'media-wall',
      'side-nook',
    ]);
    expect(ROOM_LAYOUT_OPTIONS.find((option) => option.value === 'offset-alcove')).toMatchObject({
      referenceFile: 'reference/layout-deep-alcove-left.jpg',
      secondaryReferenceFile: 'reference/layout-deep-alcove-right.jpg',
    });
  });

  it('labels source provenance, recognition prompts, and categories without invented references', () => {
    const ownerReferences = ROOM_LAYOUT_OPTIONS.filter(
      (option) => option.sourceKind === 'owner-reference',
    );
    const catalogStudies = ROOM_LAYOUT_OPTIONS.filter(
      (option) => option.sourceKind === 'catalog-study',
    );

    expect(ownerReferences.map((option) => option.value)).toEqual([
      'fireplace-wall',
      'straight-wall',
      'window-wall',
      'center-niche',
      'offset-alcove',
    ]);
    expect(catalogStudies.map((option) => option.value)).toEqual([
      'door-wall',
      'offset-window-wall',
      'double-window-wall',
      'media-wall',
      'side-nook',
    ]);
    expect(ownerReferences.every((option) => option.referenceFile?.startsWith('reference/'))).toBe(true);
    expect(catalogStudies.every((option) => option.referenceFile === undefined)).toBe(true);
    expect(ROOM_LAYOUT_OPTIONS.every((option) => option.recognitionPrompt.trim().length > 20)).toBe(true);
    expect(ROOM_LAYOUT_OPTIONS.map((option) => [option.value, option.category])).toEqual([
      ['fireplace-wall', 'feature-walls'],
      ['straight-wall', 'simple-walls'],
      ['window-wall', 'window-walls'],
      ['center-niche', 'recesses'],
      ['offset-alcove', 'recesses'],
      ['door-wall', 'simple-walls'],
      ['offset-window-wall', 'window-walls'],
      ['double-window-wall', 'window-walls'],
      ['media-wall', 'feature-walls'],
      ['side-nook', 'recesses'],
    ]);
    for (const option of ROOM_LAYOUT_OPTIONS) {
      expect(getRoomLayoutOption(option.value)).toBe(option);
    }
  });

  it('ships every owner-reference asset at the path used by the production UI', () => {
    for (const option of ROOM_LAYOUT_OPTIONS.filter(
      (layoutOption) => layoutOption.sourceKind === 'owner-reference',
    )) {
      for (const referenceFile of [option.referenceFile, option.secondaryReferenceFile]) {
        if (!referenceFile) continue;
        expect(existsSync(new URL(`../public/${referenceFile}`, import.meta.url))).toBe(true);
      }
    }
  });

  it.each(ROOM_LAYOUT_OPTIONS.map((option) => option.value))(
    'exposes the exact placement choices for %s',
    (roomLayout) => {
      expect(getPlacementOptions(roomLayout).map((option) => option.value)).toEqual(
        EXPECTED_TARGETS[roomLayout].map((target) => target.value),
      );
    },
  );

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

  it('round-trips the customer measurement confidence in a shared URL', () => {
    vi.stubGlobal('window', {
      location: {
        search: '',
        href: 'https://example.test/fireplace-bookcases-3d/',
      },
    });
    const url = new URL(configToUrl({
      ...DEFAULT_CONFIG,
      measurementConfidence: 'measured',
    }));

    expect(url.searchParams.get('measurementConfidence')).toBe('measured');

    vi.stubGlobal('window', {
      location: {
        search: url.search,
        href: url.toString(),
      },
    });
    expect(readConfigFromUrl().measurementConfidence).toBe('measured');
  });

  it.each(ALL_TARGET_CASES)(
    'derives $placementCount contained placement(s) for $roomLayout / $value',
    ({ roomLayout, value, placementCount }) => {
      const config = clampConfig({
        ...getDefaultConfigForLayout(roomLayout),
        placementTarget: value,
      });
      const derived = deriveLayout(config);

      expect(config.placementTarget).toBe(value);
      expect(derived.bookcasePlacements).toHaveLength(placementCount);
      expect(derived.selectedOpeningLabel).toBe(
        getPlacementOptions(roomLayout).find((option) => option.value === value)?.label,
      );
      for (const placement of derived.bookcasePlacements) {
        expect(placement.openingWidth).toBeGreaterThanOrEqual(44);
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

  it.each(ROOM_LAYOUT_OPTIONS.map((option) => option.value))(
    'omits dormant layout dimensions from %s share URLs',
    (roomLayout) => {
      vi.stubGlobal('window', {
        location: {
          search: '',
          href: 'https://example.test/fireplace-bookcases-3d/',
        },
      });
      const noisyConfig = clampConfig({
        ...getDefaultConfigForLayout(roomLayout),
        chimneyWidth: 80,
        wallOpeningWidth: 91,
        windowWidth: 57,
        nicheWidth: 81,
        alcoveOpeningWidth: 92,
        doorWidth: 41,
        doubleWindowGap: 83,
        mediaZoneWidth: 79,
        sideNookWidth: 87,
      });
      const params = new URL(configToUrl(noisyConfig)).searchParams;
      const activeKeys = new Set(getLayoutDimensionKeys(roomLayout).map(String));
      const allLayoutKeys = new Set(
        ROOM_LAYOUT_OPTIONS.flatMap((option) => getLayoutDimensionKeys(option.value).map(String)),
      );

      for (const key of allLayoutKeys) {
        if (!activeKeys.has(key)) expect(params.has(key)).toBe(false);
      }
    },
  );
});

describe('fit-to-opening behavior', () => {
  it.each(ROOM_LAYOUT_OPTIONS.map((option) => option.value).filter(
    (roomLayout) => roomLayout !== 'fireplace-wall',
  ))('loads and fits the active unit or units for %s', (roomLayout) => {
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

  it('fits unequal doorway flanks from the cased opening and its offset', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('door-wall'),
      placementTarget: 'door-both',
      doorCenterX: 12,
      leftBookcaseWidth: 44,
      rightBookcaseWidth: 44,
    });
    const fitted = fitBookcasesToSelectedOpening(config);
    const [left, right] = deriveLayout(fitted).bookcasePlacements;

    expect([left.openingWidth, right.openingWidth]).toEqual([79.5, 55.5]);
    expect([fitted.leftBookcaseWidth, fitted.rightBookcaseWidth]).toEqual([79.5, 55.5]);
    expect(fitBookcasesToSelectedOpening(fitted)).toEqual(fitted);
  });

  it('fits unequal flanks around an offset window without crossing its casing', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('offset-window-wall'),
      placementTarget: 'offset-window-both',
      windowCenterX: -10,
      leftBookcaseWidth: 44,
      rightBookcaseWidth: 44,
    });
    const fitted = fitBookcasesToSelectedOpening(config);
    const [left, right] = deriveLayout(fitted).bookcasePlacements;

    expect([left.openingWidth, right.openingWidth]).toEqual([57.5, 77.5]);
    expect([fitted.leftBookcaseWidth, fitted.rightBookcaseWidth]).toEqual([57.5, 77.5]);
    expect(left.openingEndX).toBe(-38.5);
    expect(right.openingStartX).toBe(18.5);
  });

  it('uses the clear wall between two windows or both outer wall zones', () => {
    const centerConfig = clampConfig({
      ...getDefaultConfigForLayout('double-window-wall'),
      placementTarget: 'double-window-center',
    });
    const centerFitted = fitBookcasesToSelectedOpening(centerConfig);
    expect(deriveLayout(centerFitted).bookcasePlacements.map((placement) => placement.openingWidth)).toEqual([69]);
    expect(centerFitted.leftBookcaseWidth).toBe(69);

    const outerConfig = clampConfig({
      ...getDefaultConfigForLayout('double-window-wall'),
      placementTarget: 'double-window-outer',
    });
    const outerFitted = fitBookcasesToSelectedOpening(outerConfig);
    expect(deriveLayout(outerFitted).bookcasePlacements.map((placement) => placement.openingWidth)).toEqual([
      52.5,
      52.5,
    ]);
    expect([outerFitted.leftBookcaseWidth, outerFitted.rightBookcaseWidth]).toEqual([52.5, 52.5]);
  });

  it('fits the media flanks and either one-sided nook from their editable study spans', () => {
    const media = applyRoomLayoutPreset(DEFAULT_CONFIG, 'media-wall');
    expect(deriveLayout(media).bookcasePlacements.map((placement) => placement.openingWidth)).toEqual([
      73.5,
      73.5,
    ]);

    for (const placementTarget of ['side-nook-left', 'side-nook-right'] as const) {
      const nook = fitBookcasesToSelectedOpening(clampConfig({
        ...getDefaultConfigForLayout('side-nook'),
        placementTarget,
      }));
      const [placement] = deriveLayout(nook).bookcasePlacements;
      expect(placement.openingWidth).toBe(72);
      expect(placement.width).toBe(72);
      expect(placement.sourceSide).toBe(placementTarget.endsWith('left') ? 'left' : 'right');
    }
  });
});

describe('layout-specific constraints', () => {
  it.each([
    ['fireplace-wall', 'fireplace-pair', 120],
    ['window-wall', 'window-both', 120],
    ['door-wall', 'door-both', 120],
    ['offset-window-wall', 'offset-window-both', 120],
    ['double-window-wall', 'double-window-outer', 180],
    ['media-wall', 'media-both', 120],
  ] as const)(
    'preserves the entered wall width for a constrained %s opening',
    (roomLayout, placementTarget, roomWidth) => {
      const config = clampConfig({
        ...getDefaultConfigForLayout(roomLayout),
        placementTarget,
        roomWidth,
      });
      const derived = deriveLayout(config);

      expect(config.roomWidth).toBe(roomWidth);
      expect(derived.bookcasePlacements.some(
        (placement) => placement.openingWidth < 44,
      )).toBe(true);
      expect(derived.structuralWarnings.some(
        (warning) => warning.includes('below the 44″ minimum'),
      )).toBe(true);
    },
  );

  it('preserves a measured double-window gap instead of enlarging it to force a fit', () => {
    const config = clampConfig({
      ...getDefaultConfigForLayout('double-window-wall'),
      placementTarget: 'double-window-center',
      roomWidth: 180,
      doubleWindowGap: 44,
      centerGap: 8,
    });
    const derived = deriveLayout(config);

    expect(config.roomWidth).toBe(180);
    expect(config.doubleWindowGap).toBe(44);
    expect(derived.bookcasePlacements[0].openingWidth).toBe(28);
    expect(derived.structuralWarnings.some(
      (warning) => warning.includes('Wall between windows is 28″ wide'),
    )).toBe(true);
  });

  it('preserves valid customer room widths without reserving inactive placement zones', () => {
    const doorway = clampConfig({
      ...getDefaultConfigForLayout('door-wall'),
      placementTarget: 'door-left',
      roomWidth: 150,
      doorCenterX: 48,
    });
    expect(doorway.roomWidth).toBe(150);
    expect(deriveLayout(doorway).bookcasePlacements[0].openingWidth).toBe(100.5);

    const offsetWindow = clampConfig({
      ...getDefaultConfigForLayout('offset-window-wall'),
      placementTarget: 'offset-window-left',
      roomWidth: 160,
      windowCenterX: 40,
    });
    expect(offsetWindow.roomWidth).toBe(160);
    expect(deriveLayout(offsetWindow).bookcasePlacements[0].openingWidth).toBe(91.5);

    const betweenWindows = clampConfig({
      ...getDefaultConfigForLayout('double-window-wall'),
      placementTarget: 'double-window-center',
      roomWidth: 180,
    });
    expect(betweenWindows.roomWidth).toBe(180);
    expect(deriveLayout(betweenWindows).bookcasePlacements[0].openingWidth).toBe(69);
  });

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

  it.each(ALL_TARGET_CASES)(
    'stays finite, explicit, and idempotent for adversarial $roomLayout / $value',
    ({ roomLayout, value, placementCount }) => {
      const config = clampConfig({
        ...getDefaultConfigForLayout(roomLayout),
        placementTarget: value,
        roomWidth: 72,
        roomDepth: 72,
        roomHeight: 84,
        wallOpeningWidth: 180,
        windowWidth: 96,
        windowHeight: 72,
        windowSillHeight: 60,
        nicheWidth: 144,
        nicheDepth: 48,
        alcoveOpeningWidth: 108,
        alcoveDepth: 240,
        doorWidth: 72,
        doorHeight: 96,
        doorCenterX: 48,
        windowCenterX: -48,
        doubleWindowGap: 120,
        mediaZoneWidth: 120,
        mediaZoneHeight: 72,
        sideNookWidth: 144,
        sideNookDepth: 48,
        leftBookcaseWidth: 180,
        rightBookcaseWidth: 180,
        bookcaseHeight: 156,
        shelfCount: 8,
      });
      const derived = deriveLayout(config);

      expect(clampConfig(config)).toEqual(config);
      expect(config.bookcaseHeight).toBeLessThan(config.roomHeight);
      expect(derived.bookcasePlacements).toHaveLength(placementCount);
      for (const placement of derived.bookcasePlacements) {
        expect([
          placement.x,
          placement.width,
          placement.openingStartX,
          placement.openingEndX,
          placement.openingWidth,
        ].every(Number.isFinite)).toBe(true);
        expect(placement.width).toBeGreaterThanOrEqual(44);
        expect(placement.openingWidth).toBeGreaterThanOrEqual(0);
        if (placement.openingWidth >= 44) {
          expect(placement.x - placement.width / 2).toBeGreaterThanOrEqual(
            placement.openingStartX - 1e-7,
          );
          expect(placement.x + placement.width / 2).toBeLessThanOrEqual(
            placement.openingEndX + 1e-7,
          );
        } else {
          expect(placement.width).toBe(44);
          expect(derived.structuralWarnings.some(
            (warning) =>
              warning.startsWith(`${placement.label} is`) &&
              warning.includes('below the 44″ minimum'),
          )).toBe(true);
        }
      }

      const fitted = fitBookcasesToSelectedOpening(config);
      expect(fitBookcasesToSelectedOpening(fitted)).toEqual(fitted);
      for (const placement of deriveLayout(fitted).bookcasePlacements) {
        if (placement.openingWidth >= 44) {
          expect(placement.width).toBeLessThanOrEqual(placement.openingWidth + 1e-7);
        } else {
          expect(placement.width).toBe(44);
        }
        expect(placement.width * 8).toBe(Math.round(placement.width * 8));
      }
    },
  );
});
