export type CabinetFinish = 'warm-white' | 'pure-white' | 'soft-gray' | 'deep-green';
export type FloorFinish = 'natural-oak' | 'white-oak' | 'walnut';

export type RoomLayoutId =
  | 'fireplace-wall'
  | 'straight-wall'
  | 'window-wall'
  | 'center-niche'
  | 'offset-alcove'
  | 'door-wall'
  | 'offset-window-wall'
  | 'double-window-wall'
  | 'media-wall'
  | 'side-nook';

export type PlacementTarget =
  | 'fireplace-pair'
  | 'wall-left'
  | 'wall-center'
  | 'wall-right'
  | 'window-left'
  | 'window-right'
  | 'window-both'
  | 'niche-center'
  | 'alcove-center'
  | 'door-left'
  | 'door-right'
  | 'door-both'
  | 'offset-window-left'
  | 'offset-window-right'
  | 'offset-window-both'
  | 'double-window-center'
  | 'double-window-outer'
  | 'media-left'
  | 'media-right'
  | 'media-both'
  | 'side-nook-left'
  | 'side-nook-right';

export type RoomLayoutCategory =
  | 'feature-walls'
  | 'simple-walls'
  | 'window-walls'
  | 'recesses';

export type RoomLayoutSourceKind = 'owner-reference' | 'catalog-study';

export interface RoomLayoutOption {
  value: RoomLayoutId;
  label: string;
  description: string;
  category: RoomLayoutCategory;
  recognitionPrompt: string;
  sourceKind: RoomLayoutSourceKind;
  referenceFile?: string;
  secondaryReferenceFile?: string;
}

export interface PlacementOption {
  value: PlacementTarget;
  label: string;
}

export const ROOM_LAYOUT_OPTIONS: readonly RoomLayoutOption[] = Object.freeze([
  {
    value: 'fireplace-wall',
    label: 'Fireplace wall',
    description: 'Two built-ins flanking the drawing-based fireplace.',
    category: 'feature-walls',
    recognitionPrompt: 'My room has a centered fireplace with wall space on both sides.',
    sourceKind: 'owner-reference',
    referenceFile: 'reference/room-layout.jpg',
  },
  {
    value: 'straight-wall',
    label: 'Straight wall',
    description: 'Uninterrupted back wall with left, center, and right installation positions.',
    category: 'simple-walls',
    recognitionPrompt: 'My room has one clear wall without a door, window, or fireplace.',
    sourceKind: 'owner-reference',
    referenceFile: 'reference/layout-straight-wall.jpg',
  },
  {
    value: 'window-wall',
    label: 'Window wall',
    description: 'Centered divided-light window with bookcase positions on either side.',
    category: 'window-walls',
    recognitionPrompt: 'My room has one window centered on the wall.',
    sourceKind: 'owner-reference',
    referenceFile: 'reference/layout-window-wall.jpg',
  },
  {
    value: 'center-niche',
    label: 'Center niche',
    description: 'Broad forward wall planes framing a centered recessed opening.',
    category: 'recesses',
    recognitionPrompt: 'My room has a centered recessed section between two projecting walls.',
    sourceKind: 'owner-reference',
    referenceFile: 'reference/layout-center-niche.jpg',
  },
  {
    value: 'offset-alcove',
    label: 'Deep alcove',
    description: 'Narrow, deep U-shaped room documented by two opposing views.',
    category: 'recesses',
    recognitionPrompt: 'My opening is the rear wall of a narrow, full-depth alcove.',
    sourceKind: 'owner-reference',
    referenceFile: 'reference/layout-deep-alcove-left.jpg',
    secondaryReferenceFile: 'reference/layout-deep-alcove-right.jpg',
  },
  {
    value: 'door-wall',
    label: 'Doorway wall',
    description: 'A centered cased doorway with independently fitted bookcases on either side.',
    category: 'simple-walls',
    recognitionPrompt: 'My wall has a doorway with usable wall space beside it.',
    sourceKind: 'catalog-study',
  },
  {
    value: 'offset-window-wall',
    label: 'Offset window wall',
    description: 'A single off-center window creating unequal installation zones.',
    category: 'window-walls',
    recognitionPrompt: 'My room has one window that is not centered on the wall.',
    sourceKind: 'catalog-study',
  },
  {
    value: 'double-window-wall',
    label: 'Double-window wall',
    description: 'Two windows with a bookcase zone between them or paired outer zones.',
    category: 'window-walls',
    recognitionPrompt: 'My wall has two separate windows with clear wall between them.',
    sourceKind: 'catalog-study',
  },
  {
    value: 'media-wall',
    label: 'Media wall',
    description: 'A centered television zone with matched bookcases on either side.',
    category: 'feature-walls',
    recognitionPrompt: 'My wall has a centered TV or media zone I want to keep clear.',
    sourceKind: 'catalog-study',
  },
  {
    value: 'side-nook',
    label: 'Side nook',
    description: 'A one-sided recessed opening formed by a projecting wall plane.',
    category: 'recesses',
    recognitionPrompt: 'My room has a recessed nook at one side of the back wall.',
    sourceKind: 'catalog-study',
  },
]);

const PLACEMENT_OPTIONS = {
  'fireplace-wall': [
    { value: 'fireplace-pair', label: 'Pair flanking fireplace' },
  ],
  'straight-wall': [
    { value: 'wall-left', label: 'Left wall position' },
    { value: 'wall-center', label: 'Centered wall position' },
    { value: 'wall-right', label: 'Right wall position' },
  ],
  'window-wall': [
    { value: 'window-left', label: 'Left of window' },
    { value: 'window-right', label: 'Right of window' },
    { value: 'window-both', label: 'Both sides of window' },
  ],
  'center-niche': [
    { value: 'niche-center', label: 'Centered in niche' },
  ],
  'offset-alcove': [
    { value: 'alcove-center', label: 'Centered on rear wall' },
  ],
  'door-wall': [
    { value: 'door-left', label: 'Left of doorway' },
    { value: 'door-right', label: 'Right of doorway' },
    { value: 'door-both', label: 'Both sides of doorway' },
  ],
  'offset-window-wall': [
    { value: 'offset-window-left', label: 'Left of window' },
    { value: 'offset-window-right', label: 'Right of window' },
    { value: 'offset-window-both', label: 'Both sides of window' },
  ],
  'double-window-wall': [
    { value: 'double-window-center', label: 'Between the windows' },
    { value: 'double-window-outer', label: 'Outside both windows' },
  ],
  'media-wall': [
    { value: 'media-left', label: 'Left of media zone' },
    { value: 'media-right', label: 'Right of media zone' },
    { value: 'media-both', label: 'Both sides of media zone' },
  ],
  'side-nook': [
    { value: 'side-nook-left', label: 'Nook at left' },
    { value: 'side-nook-right', label: 'Nook at right' },
  ],
} as const satisfies Readonly<Record<RoomLayoutId, readonly PlacementOption[]>>;

/** Drawing-controlled values. Overall model inputs may never resize these. */
export const CONSTRUCTION = Object.freeze({
  carcassThickness: 0.75,
  finishedBackThickness: 0.25,
  faceFrameWidth: 1.5,
  centerDividerWidth: 1.5,
  doorThickness: 0.75,
  fixedTransitionShelfThickness: 1.25,
  shelfPinDiameter: 5 / 25.4,
  shelfPinSpacing: 2,
  minimumSideFiller: 0.75,
});

/** Non-fabrication presentation values used to model the supplied room images. */
export const ROOM_STUDY = Object.freeze({
  windowCasingWidth: 3,
  windowFrameDepth: 2.25,
  doorCasingWidth: 3,
});

export type AdjustableShelfThickness = 1 | 1.25 | 1.5;

export interface AdjustableShelfRule {
  thickness: AdjustableShelfThickness;
  supportRequired: boolean;
}

export const SHELF_SPAN_LIMITS = Object.freeze([
  { maximumSpan: 27, thickness: 1 },
  { maximumSpan: 31, thickness: 1.25 },
  { maximumSpan: 36, thickness: 1.5 },
] as const);

/** Presentation guardrail; not a drawing-derived fabrication dimension. */
export const MINIMUM_SHELF_OPENING = 4;

export interface ModelConfig {
  roomLayout: RoomLayoutId;
  placementTarget: PlacementTarget;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  wallThickness: number;

  wallOpeningWidth: number;
  windowWidth: number;
  windowHeight: number;
  windowSillHeight: number;
  nicheWidth: number;
  nicheDepth: number;
  alcoveOpeningWidth: number;
  alcoveDepth: number;
  doorWidth: number;
  doorHeight: number;
  doorCenterX: number;
  windowCenterX: number;
  doubleWindowGap: number;
  mediaZoneWidth: number;
  mediaZoneHeight: number;
  sideNookWidth: number;
  sideNookDepth: number;

  chimneyWidth: number;
  chimneyDepth: number;
  chimneyTopInset: number;

  leftBookcaseWidth: number;
  rightBookcaseWidth: number;
  bookcaseHeight: number;
  upperDepth: number;
  baseDepth: number;
  baseHeight: number;
  shelfCount: number;
  toeKickHeight: number;
  toeKickRecess: number;
  centerGap: number;
  sideFiller: number;
  crownHeight: number;
  crownProjection: number;

  fireplaceOpeningWidth: number;
  fireplaceOpeningHeight: number;
  mantelWidth: number;
  mantelHeight: number;
  mantelDepth: number;
  hearthWidth: number;
  hearthDepth: number;

  cabinetFinish: CabinetFinish;
  floorFinish: FloorFinish;
  showRoom: boolean;
  showCeiling: boolean;
  showDimensions: boolean;
  showPinHoles: boolean;
  showHardware: boolean;
  showFire: boolean;
  showReferenceGhost: boolean;
}

export const DEFAULT_CONFIG: ModelConfig = {
  roomLayout: 'fireplace-wall',
  placementTarget: 'fireplace-pair',
  roomWidth: 222,
  roomDepth: 150,
  roomHeight: 108,
  wallThickness: 4.5,

  wallOpeningWidth: 72,
  windowWidth: 48,
  windowHeight: 42,
  windowSillHeight: 40,
  nicheWidth: 72,
  nicheDepth: 24,
  alcoveOpeningWidth: 84,
  alcoveDepth: 150,
  doorWidth: 36,
  doorHeight: 80,
  doorCenterX: 0,
  windowCenterX: 8,
  doubleWindowGap: 72,
  mediaZoneWidth: 72,
  mediaZoneHeight: 50,
  sideNookWidth: 72,
  sideNookDepth: 24,

  chimneyWidth: 58,
  chimneyDepth: 8,
  chimneyTopInset: 0,

  leftBookcaseWidth: 72,
  rightBookcaseWidth: 72,
  bookcaseHeight: 104,
  upperDepth: 15,
  baseDepth: 22,
  baseHeight: 31.5,
  shelfCount: 5,
  toeKickHeight: 4,
  toeKickRecess: 3,
  centerGap: 1.5,
  sideFiller: 1.5,
  crownHeight: 1.5,
  crownProjection: 0.75,

  fireplaceOpeningWidth: 32,
  fireplaceOpeningHeight: 24,
  mantelWidth: 57,
  mantelHeight: 45,
  mantelDepth: 11,
  hearthWidth: 59,
  hearthDepth: 12,

  cabinetFinish: 'warm-white',
  floorFinish: 'natural-oak',
  showRoom: true,
  showCeiling: false,
  showDimensions: false,
  showPinHoles: true,
  showHardware: false,
  showFire: true,
  showReferenceGhost: false,
};

const LAYOUT_ENVIRONMENT_DEFAULTS: Readonly<Record<RoomLayoutId, Partial<ModelConfig>>> = Object.freeze({
  'fireplace-wall': Object.freeze({
    roomWidth: 222,
    roomDepth: 150,
    roomHeight: 108,
    chimneyWidth: 58,
    chimneyDepth: 8,
    chimneyTopInset: 0,
    leftBookcaseWidth: 72,
    rightBookcaseWidth: 72,
    placementTarget: 'fireplace-pair',
  }),
  'straight-wall': Object.freeze({
    roomWidth: 180,
    roomDepth: 132,
    roomHeight: 108,
    wallOpeningWidth: 72,
    leftBookcaseWidth: 72,
    rightBookcaseWidth: 72,
    placementTarget: 'wall-center',
  }),
  'window-wall': Object.freeze({
    roomWidth: 180,
    roomDepth: 132,
    roomHeight: 108,
    windowWidth: 48,
    windowHeight: 42,
    windowSillHeight: 40,
    leftBookcaseWidth: 61.5,
    rightBookcaseWidth: 61.5,
    placementTarget: 'window-both',
  }),
  'center-niche': Object.freeze({
    roomWidth: 180,
    roomDepth: 132,
    roomHeight: 108,
    nicheWidth: 72,
    nicheDepth: 24,
    leftBookcaseWidth: 72,
    rightBookcaseWidth: 72,
    placementTarget: 'niche-center',
  }),
  'offset-alcove': Object.freeze({
    roomWidth: 84,
    roomDepth: 150,
    roomHeight: 108,
    alcoveOpeningWidth: 84,
    alcoveDepth: 150,
    leftBookcaseWidth: 84,
    rightBookcaseWidth: 72,
    placementTarget: 'alcove-center',
  }),
  'door-wall': Object.freeze({
    roomWidth: 180,
    roomDepth: 132,
    roomHeight: 108,
    doorWidth: 36,
    doorHeight: 80,
    doorCenterX: 0,
    leftBookcaseWidth: 67.5,
    rightBookcaseWidth: 67.5,
    placementTarget: 'door-both',
  }),
  'offset-window-wall': Object.freeze({
    roomWidth: 192,
    roomDepth: 132,
    roomHeight: 108,
    windowWidth: 48,
    windowHeight: 42,
    windowSillHeight: 40,
    windowCenterX: 8,
    leftBookcaseWidth: 75.5,
    rightBookcaseWidth: 59.5,
    placementTarget: 'offset-window-both',
  }),
  'double-window-wall': Object.freeze({
    roomWidth: 264,
    roomDepth: 132,
    roomHeight: 108,
    windowWidth: 36,
    windowHeight: 48,
    windowSillHeight: 30,
    doubleWindowGap: 72,
    leftBookcaseWidth: 69,
    rightBookcaseWidth: 52.5,
    placementTarget: 'double-window-center',
  }),
  'media-wall': Object.freeze({
    roomWidth: 222,
    roomDepth: 132,
    roomHeight: 108,
    mediaZoneWidth: 72,
    mediaZoneHeight: 50,
    leftBookcaseWidth: 73.5,
    rightBookcaseWidth: 73.5,
    placementTarget: 'media-both',
  }),
  'side-nook': Object.freeze({
    roomWidth: 180,
    roomDepth: 132,
    roomHeight: 108,
    sideNookWidth: 72,
    sideNookDepth: 24,
    leftBookcaseWidth: 72,
    rightBookcaseWidth: 72,
    placementTarget: 'side-nook-left',
  }),
});

export interface BookcasePlacement {
  id: 'left' | 'center' | 'right';
  sourceSide: 'left' | 'right';
  label: string;
  x: number;
  z: number;
  rotationY: number;
  width: number;
  openingStartX: number;
  openingEndX: number;
  openingWidth: number;
}

export interface DerivedLayout {
  roomLayout: RoomLayoutId;
  layoutLabel: string;
  hasFireplace: boolean;
  bookcasePlacements: BookcasePlacement[];
  selectedOpeningLabel: string;
  selectedOpeningWidth: number;
  installationFrontZ: number;
  leftBookcaseX: number;
  rightBookcaseX: number;
  leftBayWidth: number;
  rightBayWidth: number;
  leftAdjustableShelfThickness: AdjustableShelfThickness;
  rightAdjustableShelfThickness: AdjustableShelfThickness;
  leftShelfSupportRequired: boolean;
  rightShelfSupportRequired: boolean;
  upperStartY: number;
  upperClearHeight: number;
  centerFrontZ: number;
  availableLeftWall: number;
  availableRightWall: number;
  leftSideClearance: number;
  rightSideClearance: number;
  structuralWarnings: string[];
}

const numericKeys: Array<keyof ModelConfig> = [
  'roomWidth',
  'roomDepth',
  'roomHeight',
  'wallThickness',
  'wallOpeningWidth',
  'windowWidth',
  'windowHeight',
  'windowSillHeight',
  'nicheWidth',
  'nicheDepth',
  'alcoveOpeningWidth',
  'alcoveDepth',
  'doorWidth',
  'doorHeight',
  'doorCenterX',
  'windowCenterX',
  'doubleWindowGap',
  'mediaZoneWidth',
  'mediaZoneHeight',
  'sideNookWidth',
  'sideNookDepth',
  'chimneyWidth',
  'chimneyDepth',
  'chimneyTopInset',
  'leftBookcaseWidth',
  'rightBookcaseWidth',
  'bookcaseHeight',
  'upperDepth',
  'baseDepth',
  'baseHeight',
  'shelfCount',
  'toeKickHeight',
  'toeKickRecess',
  'centerGap',
  'sideFiller',
  'crownHeight',
  'crownProjection',
  'fireplaceOpeningWidth',
  'fireplaceOpeningHeight',
  'mantelWidth',
  'mantelHeight',
  'mantelDepth',
  'hearthWidth',
  'hearthDepth',
];

const booleanKeys: Array<keyof ModelConfig> = [
  'showRoom',
  'showCeiling',
  'showDimensions',
  'showPinHoles',
  'showHardware',
  'showFire',
  'showReferenceGhost',
];

const ranges: Partial<Record<keyof ModelConfig, [number, number]>> = {
  roomWidth: [72, 360],
  roomDepth: [72, 300],
  roomHeight: [84, 168],
  wallThickness: [3.5, 8],
  wallOpeningWidth: [44, 180],
  windowWidth: [24, 96],
  windowHeight: [24, 72],
  windowSillHeight: [18, 60],
  nicheWidth: [44, 144],
  nicheDepth: [12, 48],
  alcoveOpeningWidth: [44, 108],
  alcoveDepth: [48, 240],
  doorWidth: [28, 72],
  doorHeight: [72, 96],
  doorCenterX: [-48, 48],
  windowCenterX: [-48, 48],
  doubleWindowGap: [44, 120],
  mediaZoneWidth: [48, 120],
  mediaZoneHeight: [32, 72],
  sideNookWidth: [44, 144],
  sideNookDepth: [12, 48],
  chimneyWidth: [42, 96],
  chimneyDepth: [3, 24],
  chimneyTopInset: [0, 36],
  leftBookcaseWidth: [44, 180],
  rightBookcaseWidth: [44, 180],
  bookcaseHeight: [72, 156],
  upperDepth: [10, 22],
  baseDepth: [16, 30],
  baseHeight: [24, 42],
  shelfCount: [2, 8],
  toeKickHeight: [2.5, 6],
  toeKickRecess: [1, 5],
  centerGap: [0, 8],
  sideFiller: [CONSTRUCTION.minimumSideFiller, 8],
  crownHeight: [1.5, 8],
  crownProjection: [0.5, 4],
  fireplaceOpeningWidth: [24, 60],
  fireplaceOpeningHeight: [18, 42],
  mantelWidth: [42, 84],
  mantelHeight: [34, 62],
  mantelDepth: [6, 18],
  hearthWidth: [42, 96],
  hearthDepth: [10, 30],
};

const LAYOUT_DIMENSION_KEYS = Object.freeze({
  'fireplace-wall': [
    'chimneyWidth',
    'chimneyDepth',
    'chimneyTopInset',
    'fireplaceOpeningWidth',
    'fireplaceOpeningHeight',
    'mantelWidth',
    'mantelHeight',
    'mantelDepth',
    'hearthWidth',
    'hearthDepth',
  ],
  'straight-wall': ['wallOpeningWidth'],
  'window-wall': ['windowWidth', 'windowHeight', 'windowSillHeight'],
  'center-niche': ['nicheWidth', 'nicheDepth'],
  'offset-alcove': ['alcoveOpeningWidth', 'alcoveDepth'],
  'door-wall': ['doorWidth', 'doorHeight', 'doorCenterX'],
  'offset-window-wall': ['windowWidth', 'windowHeight', 'windowSillHeight', 'windowCenterX'],
  'double-window-wall': ['windowWidth', 'windowHeight', 'windowSillHeight', 'doubleWindowGap'],
  'media-wall': ['mediaZoneWidth', 'mediaZoneHeight'],
  'side-nook': ['sideNookWidth', 'sideNookDepth'],
} as const satisfies Readonly<Record<RoomLayoutId, readonly (keyof ModelConfig)[]>>);

const SHARED_NUMERIC_KEYS = new Set<keyof ModelConfig>([
  'roomWidth',
  'roomDepth',
  'roomHeight',
  'wallThickness',
  'leftBookcaseWidth',
  'rightBookcaseWidth',
  'bookcaseHeight',
  'upperDepth',
  'baseDepth',
  'baseHeight',
  'shelfCount',
  'toeKickHeight',
  'toeKickRecess',
  'centerGap',
  'sideFiller',
  'crownHeight',
  'crownProjection',
]);

export function getRoomLayoutOption(layout: RoomLayoutId): RoomLayoutOption {
  return ROOM_LAYOUT_OPTIONS.find((option) => option.value === layout) ?? ROOM_LAYOUT_OPTIONS[0];
}

export function getLayoutDimensionKeys(layout: RoomLayoutId): readonly (keyof ModelConfig)[] {
  return LAYOUT_DIMENSION_KEYS[layout] ?? LAYOUT_DIMENSION_KEYS['fireplace-wall'];
}

export function getPlacementOptions(layout: RoomLayoutId): readonly PlacementOption[] {
  return PLACEMENT_OPTIONS[layout] ?? PLACEMENT_OPTIONS['fireplace-wall'];
}

export function getDefaultConfigForLayout(layout: RoomLayoutId): ModelConfig {
  return clampConfig(makeRawLayoutDefault(layout));
}

export function applyRoomLayoutPreset(config: ModelConfig, layout: RoomLayoutId): ModelConfig {
  const safeLayout = isRoomLayoutId(layout) ? layout : 'fireplace-wall';
  const layoutDefault = makeRawLayoutDefault(safeLayout);
  const preset = clampConfig({
    ...layoutDefault,
    bookcaseHeight: config.bookcaseHeight,
    upperDepth: config.upperDepth,
    baseDepth: config.baseDepth,
    baseHeight: config.baseHeight,
    shelfCount: config.shelfCount,
    toeKickHeight: config.toeKickHeight,
    toeKickRecess: config.toeKickRecess,
    centerGap: config.centerGap,
    sideFiller: config.sideFiller,
    crownHeight: config.crownHeight,
    crownProjection: config.crownProjection,
    cabinetFinish: config.cabinetFinish,
    floorFinish: config.floorFinish,
    showRoom: config.showRoom,
    showCeiling: config.showCeiling,
    showDimensions: config.showDimensions,
    showPinHoles: config.showPinHoles,
    showHardware: config.showHardware,
    showFire: config.showFire,
    showReferenceGhost: config.showReferenceGhost,
  });
  return safeLayout === 'fireplace-wall'
    ? preset
    : fitBookcasesToSelectedOpening(preset);
}

export function clampConfig(input: ModelConfig): ModelConfig {
  const roomLayout = isRoomLayoutId(input.roomLayout) ? input.roomLayout : 'fireplace-wall';
  const fallback = makeRawLayoutDefault(roomLayout);
  const output: ModelConfig = {
    ...fallback,
    ...input,
    roomLayout,
    placementTarget: normalizePlacementTarget(roomLayout, input.placementTarget),
  };

  for (const key of numericKeys) {
    const value = Number(output[key]);
    const range = ranges[key];
    const safe = Number.isFinite(value) ? value : Number(fallback[key]);
    const clamped = range ? Math.min(range[1], Math.max(range[0], safe)) : safe;
    (output[key] as number) = key === 'shelfCount' ? Math.round(clamped) : clamped;
  }

  // In the deep-alcove study, these two explicit opening dimensions are the
  // physical room envelope. Resolve them before clamping any dormant layout
  // values so repeated normalization cannot drift hidden URL/state fields.
  if (output.roomLayout === 'offset-alcove') {
    output.roomWidth = output.alcoveOpeningWidth;
    output.roomDepth = output.alcoveDepth;
  }

  const minimumBookcaseWidth = ranges.leftBookcaseWidth?.[0] ?? 44;
  output.bookcaseHeight = Math.min(output.bookcaseHeight, output.roomHeight - 0.5);
  output.baseDepth = Math.max(output.baseDepth, output.upperDepth + 1);
  output.baseHeight = Math.min(output.baseHeight, output.bookcaseHeight - 30);
  output.wallOpeningWidth = Math.min(output.wallOpeningWidth, output.roomWidth);
  output.nicheWidth = Math.min(output.nicheWidth, output.roomWidth);
  output.nicheDepth = Math.min(output.nicheDepth, output.roomDepth - 12);
  if (output.roomLayout !== 'offset-alcove') {
    output.alcoveOpeningWidth = Math.min(output.alcoveOpeningWidth, output.roomWidth);
    output.alcoveDepth = Math.min(output.alcoveDepth, output.roomDepth);
  }
  output.windowSillHeight = Math.min(output.windowSillHeight, output.roomHeight - 24 - 6);
  output.windowHeight = Math.min(output.windowHeight, output.roomHeight - output.windowSillHeight - 6);
  output.doorHeight = Math.min(
    output.doorHeight,
    output.roomHeight - ROOM_STUDY.doorCasingWidth - 3,
  );
  output.mediaZoneHeight = Math.min(output.mediaZoneHeight, output.roomHeight - 12);
  output.sideNookWidth = Math.min(output.sideNookWidth, output.roomWidth);
  output.sideNookDepth = Math.min(output.sideNookDepth, output.roomDepth - 12);

  if (output.roomLayout === 'window-wall') {
    const requiredRoomWidth =
      2 * (minimumBookcaseWidth + output.centerGap) +
      output.windowWidth +
      2 * ROOM_STUDY.windowCasingWidth;
    output.roomWidth = Math.min(ranges.roomWidth?.[1] ?? 360, Math.max(output.roomWidth, requiredRoomWidth));
  }

  if (output.roomLayout === 'offset-window-wall') {
    const windowOuterWidth = output.windowWidth + 2 * ROOM_STUDY.windowCasingWidth;
    const windowHalfWidth = windowOuterWidth / 2;
    let requiredRoomWidth = 2 * (Math.abs(output.windowCenterX) + windowHalfWidth);
    if (
      output.placementTarget === 'offset-window-left' ||
      output.placementTarget === 'offset-window-both'
    ) {
      requiredRoomWidth = Math.max(
        requiredRoomWidth,
        2 * (
          minimumBookcaseWidth +
          windowHalfWidth +
          output.centerGap -
          output.windowCenterX
        ),
      );
    }
    if (
      output.placementTarget === 'offset-window-right' ||
      output.placementTarget === 'offset-window-both'
    ) {
      requiredRoomWidth = Math.max(
        requiredRoomWidth,
        2 * (
          minimumBookcaseWidth +
          windowHalfWidth +
          output.centerGap +
          output.windowCenterX
        ),
      );
    }
    output.roomWidth = Math.min(
      ranges.roomWidth?.[1] ?? 360,
      Math.max(output.roomWidth, requiredRoomWidth),
    );
  }

  if (output.roomLayout === 'door-wall') {
    const doorOuterWidth = output.doorWidth + 2 * ROOM_STUDY.doorCasingWidth;
    const doorHalfWidth = doorOuterWidth / 2;
    let requiredRoomWidth = 2 * (Math.abs(output.doorCenterX) + doorHalfWidth);
    if (output.placementTarget === 'door-left' || output.placementTarget === 'door-both') {
      requiredRoomWidth = Math.max(
        requiredRoomWidth,
        2 * (
          minimumBookcaseWidth +
          doorHalfWidth +
          output.centerGap -
          output.doorCenterX
        ),
      );
    }
    if (output.placementTarget === 'door-right' || output.placementTarget === 'door-both') {
      requiredRoomWidth = Math.max(
        requiredRoomWidth,
        2 * (
          minimumBookcaseWidth +
          doorHalfWidth +
          output.centerGap +
          output.doorCenterX
        ),
      );
    }
    output.roomWidth = Math.min(
      ranges.roomWidth?.[1] ?? 360,
      Math.max(output.roomWidth, requiredRoomWidth),
    );
  }

  if (output.roomLayout === 'double-window-wall') {
    const maximumRoomWidth = ranges.roomWidth?.[1] ?? 360;
    const windowOuterWidth = output.windowWidth + 2 * ROOM_STUDY.windowCasingWidth;
    let requiredRoomWidth: number;
    if (output.placementTarget === 'double-window-center') {
      output.doubleWindowGap = Math.max(
        output.doubleWindowGap,
        minimumBookcaseWidth + 2 * output.centerGap,
      );
      requiredRoomWidth = 2 * windowOuterWidth + output.doubleWindowGap;
    } else {
      const minimumDoubleWindowGap = ranges.doubleWindowGap?.[0] ?? 44;
      const maximumDoubleWindowGap = Math.max(
        minimumDoubleWindowGap,
        maximumRoomWidth -
          2 * windowOuterWidth -
          2 * (minimumBookcaseWidth + output.centerGap),
      );
      output.doubleWindowGap = Math.min(output.doubleWindowGap, maximumDoubleWindowGap);
      requiredRoomWidth =
        2 * windowOuterWidth +
        output.doubleWindowGap +
        2 * (minimumBookcaseWidth + output.centerGap);
    }
    output.roomWidth = Math.min(
      maximumRoomWidth,
      Math.max(output.roomWidth, requiredRoomWidth),
    );
  }

  if (output.roomLayout === 'media-wall') {
    const requiredRoomWidth =
      output.mediaZoneWidth + 2 * (minimumBookcaseWidth + output.centerGap);
    output.roomWidth = Math.min(
      ranges.roomWidth?.[1] ?? 360,
      Math.max(output.roomWidth, requiredRoomWidth),
    );
  }

  if (output.roomLayout === 'center-niche') {
    output.roomWidth = Math.max(output.roomWidth, output.nicheWidth);
  }
  if (output.roomLayout === 'side-nook') {
    output.roomWidth = Math.max(output.roomWidth, output.sideNookWidth);
  }
  if (output.roomLayout === 'fireplace-wall') {
    const minimumChimneyWidth = ranges.chimneyWidth?.[0] ?? 42;
    output.roomWidth = Math.max(
      output.roomWidth,
      150,
      minimumChimneyWidth + 2 * (minimumBookcaseWidth + output.centerGap),
    );
    const maximumChimneyWidth = Math.max(
      minimumChimneyWidth,
      output.roomWidth - 2 * (minimumBookcaseWidth + output.centerGap),
    );
    output.chimneyWidth = Math.min(output.chimneyWidth, maximumChimneyWidth);

    output.fireplaceOpeningWidth = Math.min(
      output.fireplaceOpeningWidth,
      Math.max(24, output.chimneyWidth - 14),
    );
    output.mantelWidth = Math.max(output.mantelWidth, output.fireplaceOpeningWidth + 14);
    output.mantelWidth = Math.min(output.mantelWidth, output.chimneyWidth);
    const mantelOuterMargin = Math.max(1.25, output.mantelWidth * 0.035);
    const mantelPilasterWidth = Math.min(7.5, Math.max(5.25, output.mantelWidth * 0.105));
    const maximumOpeningInsidePilasters = Math.max(
      24,
      output.mantelWidth - 2 * (mantelOuterMargin + mantelPilasterWidth + 0.85),
    );
    output.fireplaceOpeningWidth = Math.min(output.fireplaceOpeningWidth, maximumOpeningInsidePilasters);
    const chimneyFaceHeight = Math.max(34, output.roomHeight - output.chimneyTopInset);
    output.fireplaceOpeningHeight = Math.min(
      output.fireplaceOpeningHeight,
      Math.max(18, chimneyFaceHeight - 14),
    );
    output.mantelHeight = Math.max(output.mantelHeight, output.fireplaceOpeningHeight + 14);
    output.mantelHeight = Math.min(output.mantelHeight, chimneyFaceHeight);
    output.hearthWidth = Math.max(output.hearthWidth, output.mantelWidth);
    output.hearthWidth = Math.min(output.hearthWidth, output.chimneyWidth + 2);
  }

  const capacities = getActivePlacementCapacities(output);
  for (const capacity of capacities) {
    const key = capacity.sourceSide === 'left' ? 'leftBookcaseWidth' : 'rightBookcaseWidth';
    output[key] = Math.min(output[key], capacity.openingWidth);
  }

  const activeSides = new Set(capacities.map((capacity) => capacity.sourceSide));
  const activeBayWidths = [...activeSides].map((side) => bayWidthForOverall(
    side === 'left' ? output.leftBookcaseWidth : output.rightBookcaseWidth,
    output.sideFiller,
  ));
  const maximumShelfThickness = Math.max(
    ...activeBayWidths.map((bayWidth) => selectAdjustableShelfRule(bayWidth).thickness),
    1,
  );
  const usableUpperHeight = Math.max(
    0,
    output.bookcaseHeight -
      (output.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness) -
      output.crownHeight -
      CONSTRUCTION.faceFrameWidth,
  );
  const maximumShelfCount = Math.max(
    2,
    Math.floor(
      (usableUpperHeight - MINIMUM_SHELF_OPENING) /
      (maximumShelfThickness + MINIMUM_SHELF_OPENING),
    ),
  );
  output.shelfCount = Math.min(output.shelfCount, maximumShelfCount);
  return output;
}

export function deriveLayout(config: ModelConfig): DerivedLayout {
  const upperStartY = config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness;
  const upperClearHeight = Math.max(
    12,
    config.bookcaseHeight - upperStartY - config.crownHeight - CONSTRUCTION.faceFrameWidth,
  );

  const leftBookcaseX = -(
    config.chimneyWidth / 2 +
    config.centerGap +
    config.leftBookcaseWidth / 2
  );
  const rightBookcaseX =
    config.chimneyWidth / 2 + config.centerGap + config.rightBookcaseWidth / 2;

  const leftBayWidth = Math.max(1, bayWidthForOverall(config.leftBookcaseWidth, config.sideFiller));
  const rightBayWidth = Math.max(1, bayWidthForOverall(config.rightBookcaseWidth, config.sideFiller));
  const leftShelfRule = selectAdjustableShelfRule(leftBayWidth);
  const rightShelfRule = selectAdjustableShelfRule(rightBayWidth);
  const placements = deriveBookcasePlacements(config);

  const fireplaceLeftOuterEdge = leftBookcaseX - config.leftBookcaseWidth / 2;
  const fireplaceRightOuterEdge = rightBookcaseX + config.rightBookcaseWidth / 2;
  const leftPlacement = placements.find((placement) => placement.sourceSide === 'left');
  const rightPlacement = placements.find((placement) => placement.sourceSide === 'right');
  const leftSideClearance = config.roomLayout === 'fireplace-wall'
    ? fireplaceLeftOuterEdge + config.roomWidth / 2
    : leftPlacement
      ? Math.min(
        leftPlacement.x - leftPlacement.width / 2 - leftPlacement.openingStartX,
        leftPlacement.openingEndX - (leftPlacement.x + leftPlacement.width / 2),
      )
      : 0;
  const rightSideClearance = config.roomLayout === 'fireplace-wall'
    ? config.roomWidth / 2 - fireplaceRightOuterEdge
    : rightPlacement
      ? Math.min(
        rightPlacement.x - rightPlacement.width / 2 - rightPlacement.openingStartX,
        rightPlacement.openingEndX - (rightPlacement.x + rightPlacement.width / 2),
      )
      : 0;

  const structuralWarnings: string[] = [];
  const activeSides = new Set(placements.map((placement) => placement.sourceSide));
  if (activeSides.has('left') && leftShelfRule.supportRequired) {
    structuralWarnings.push(
      `Left bookcase clear shelf span is ${formatInches(leftBayWidth)}, above the 36″ unsupported limit. Retain 1 1⁄2″ shelf geometry and add a verified support design.`,
    );
  }
  if (activeSides.has('right') && rightShelfRule.supportRequired) {
    structuralWarnings.push(
      `Right bookcase clear shelf span is ${formatInches(rightBayWidth)}, above the 36″ unsupported limit. Retain 1 1⁄2″ shelf geometry and add a verified support design.`,
    );
  }
  if (placements.some((placement) =>
    placement.x - placement.width / 2 < placement.openingStartX - 1e-6 ||
    placement.x + placement.width / 2 > placement.openingEndX + 1e-6
  )) {
    structuralWarnings.push('A bookcase exceeds its selected installation opening. Reduce its width or enlarge the opening.');
  }
  if (config.roomLayout === 'center-niche' && config.baseDepth + 1.5 > config.nicheDepth + 1) {
    structuralWarnings.push('The base cabinet projects beyond the modeled niche face; verify the intended face alignment in the field.');
  }
  if (config.roomLayout === 'side-nook' && config.baseDepth + 1.5 > config.sideNookDepth + 1) {
    structuralWarnings.push('The base cabinet projects beyond the modeled side-nook face; verify the intended face alignment in the field.');
  }
  if (config.bookcaseHeight + 0.01 < config.roomHeight - 6) {
    structuralWarnings.push('A larger-than-typical top filler remains above the crown.');
  }

  const layoutOption = getRoomLayoutOption(config.roomLayout);
  const placementOption = getPlacementOptions(config.roomLayout).find(
    (option) => option.value === config.placementTarget,
  ) ?? getPlacementOptions(config.roomLayout)[0];
  const selectedOpeningWidth = placements.length > 0
    ? Math.min(...placements.map((placement) => placement.openingWidth))
    : 0;
  const installationFrontZ = Math.max(
    config.roomLayout === 'fireplace-wall' ? config.chimneyDepth + config.mantelDepth : 0,
    ...placements.map((placement) => placement.z + config.baseDepth + 1.5),
  );

  return {
    roomLayout: config.roomLayout,
    layoutLabel: layoutOption.label,
    hasFireplace: config.roomLayout === 'fireplace-wall',
    bookcasePlacements: placements,
    selectedOpeningLabel: placementOption.label,
    selectedOpeningWidth,
    installationFrontZ,
    leftBookcaseX,
    rightBookcaseX,
    leftBayWidth,
    rightBayWidth,
    leftAdjustableShelfThickness: leftShelfRule.thickness,
    rightAdjustableShelfThickness: rightShelfRule.thickness,
    leftShelfSupportRequired: leftShelfRule.supportRequired,
    rightShelfSupportRequired: rightShelfRule.supportRequired,
    upperStartY,
    upperClearHeight,
    centerFrontZ: installationFrontZ,
    availableLeftWall: (config.roomWidth - config.chimneyWidth) / 2,
    availableRightWall: (config.roomWidth - config.chimneyWidth) / 2,
    leftSideClearance,
    rightSideClearance,
    structuralWarnings,
  };
}

export function deriveBookcasePlacements(config: ModelConfig): BookcasePlacement[] {
  return getActivePlacementCapacities(config).map((capacity) => {
    const width = capacity.sourceSide === 'left'
      ? config.leftBookcaseWidth
      : config.rightBookcaseWidth;
    let x = (capacity.openingStartX + capacity.openingEndX) / 2;
    if (capacity.anchor === 'left') x = capacity.openingStartX + width / 2;
    if (capacity.anchor === 'right') x = capacity.openingEndX - width / 2;
    return {
      id: capacity.id,
      sourceSide: capacity.sourceSide,
      label: capacity.label,
      x,
      z: 0,
      rotationY: 0,
      width,
      openingStartX: capacity.openingStartX,
      openingEndX: capacity.openingEndX,
      openingWidth: capacity.openingWidth,
    };
  });
}

export function fitBookcasesToSelectedOpening(config: ModelConfig): ModelConfig {
  const normalized = clampConfig(config);
  const next = { ...normalized };
  for (const capacity of getActivePlacementCapacities(normalized)) {
    const key = capacity.sourceSide === 'left' ? 'leftBookcaseWidth' : 'rightBookcaseWidth';
    next[key] = floorToIncrement(capacity.openingWidth, 0.125);
  }
  return clampConfig(next);
}

/** Selects MDF shelf stock directly from the drawing's clear-span schedule. */
export function selectAdjustableShelfRule(clearSpan: number): AdjustableShelfRule {
  const span = Number.isFinite(clearSpan) ? Math.max(0, clearSpan) : 0;
  for (const rule of SHELF_SPAN_LIMITS) {
    if (span <= rule.maximumSpan) {
      return { thickness: rule.thickness, supportRequired: false };
    }
  }
  return { thickness: 1.5, supportRequired: true };
}

/** Snaps a height to the nearest drawing-defined shelf-pin level. */
export function snapToShelfPinGrid(value: number, origin: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(origin)) return origin;
  return origin + Math.round((value - origin) / CONSTRUCTION.shelfPinSpacing) * CONSTRUCTION.shelfPinSpacing;
}

export function formatInches(value: number, denominator = 16): string {
  const sign = value < 0 ? '−' : '';
  const absolute = Math.abs(value);
  let whole = Math.floor(absolute + 1e-8);
  let numerator = Math.round((absolute - whole) * denominator);
  if (numerator === denominator) {
    whole += 1;
    numerator = 0;
  }
  if (numerator === 0) return `${sign}${whole}″`;
  const gcd = greatestCommonDivisor(numerator, denominator);
  const fraction = `${numerator / gcd}⁄${denominator / gcd}`;
  return whole === 0 ? `${sign}${fraction}″` : `${sign}${whole} ${fraction}″`;
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y > 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

export function readConfigFromUrl(): ModelConfig {
  const params = new URLSearchParams(window.location.search);
  const rawLayout = params.get('roomLayout');
  const roomLayout = isRoomLayoutId(rawLayout) ? rawLayout : 'fireplace-wall';
  const config: ModelConfig = makeRawLayoutDefault(roomLayout);

  for (const key of numericKeys) {
    const raw = params.get(String(key));
    if (raw !== null && raw.trim() !== '') {
      (config[key] as number) = Number(raw);
    }
  }
  for (const key of booleanKeys) {
    const raw = params.get(String(key));
    if (raw !== null) {
      (config[key] as boolean) = raw === '1' || raw === 'true';
    }
  }

  const placementTarget = params.get('placementTarget');
  config.placementTarget = placementTarget === null
    ? normalizePlacementTarget(roomLayout, config.placementTarget)
    : normalizePlacementTarget(roomLayout, placementTarget);
  const cabinetFinish = params.get('cabinetFinish');
  if (cabinetFinish && ['warm-white', 'pure-white', 'soft-gray', 'deep-green'].includes(cabinetFinish)) {
    config.cabinetFinish = cabinetFinish as CabinetFinish;
  }
  const floorFinish = params.get('floorFinish');
  if (floorFinish && ['natural-oak', 'white-oak', 'walnut'].includes(floorFinish)) {
    config.floorFinish = floorFinish as FloorFinish;
  }

  return clampConfig(config);
}

export function configToUrl(config: ModelConfig): string {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  const normalized = clampConfig(config);
  const initial = getDefaultConfigForLayout(normalized.roomLayout);

  if (normalized.roomLayout !== DEFAULT_CONFIG.roomLayout) {
    params.set('roomLayout', normalized.roomLayout);
  }
  if (normalized.placementTarget !== initial.placementTarget) {
    params.set('placementTarget', normalized.placementTarget);
  }
  const activeSides = new Set(
    deriveBookcasePlacements(normalized).map((placement) => placement.sourceSide),
  );
  const activeLayoutKeys = new Set(getLayoutDimensionKeys(normalized.roomLayout));
  for (const key of numericKeys) {
    if (!SHARED_NUMERIC_KEYS.has(key) && !activeLayoutKeys.has(key)) continue;
    if (key === 'leftBookcaseWidth' && !activeSides.has('left')) continue;
    if (key === 'rightBookcaseWidth' && !activeSides.has('right')) continue;
    const current = Number(normalized[key]);
    const defaultValue = Number(initial[key]);
    if (Math.abs(current - defaultValue) > 1e-6) params.set(String(key), String(current));
  }
  for (const key of booleanKeys) {
    const current = Boolean(normalized[key]);
    const defaultValue = Boolean(initial[key]);
    if (current !== defaultValue) params.set(String(key), current ? '1' : '0');
  }
  if (normalized.cabinetFinish !== initial.cabinetFinish) {
    params.set('cabinetFinish', normalized.cabinetFinish);
  }
  if (normalized.floorFinish !== initial.floorFinish) {
    params.set('floorFinish', normalized.floorFinish);
  }

  url.search = params.toString();
  return url.toString();
}

export function copyConfig(config: ModelConfig): ModelConfig {
  return JSON.parse(JSON.stringify(config)) as ModelConfig;
}

interface PlacementCapacity {
  id: BookcasePlacement['id'];
  sourceSide: BookcasePlacement['sourceSide'];
  label: string;
  openingStartX: number;
  openingEndX: number;
  openingWidth: number;
  anchor: 'left' | 'center' | 'right';
}

function getActivePlacementCapacities(config: ModelConfig): PlacementCapacity[] {
  const makeCapacity = (
    id: PlacementCapacity['id'],
    sourceSide: PlacementCapacity['sourceSide'],
    label: string,
    openingStartX: number,
    openingEndX: number,
    anchor: PlacementCapacity['anchor'],
  ): PlacementCapacity => ({
    id,
    sourceSide,
    label,
    openingStartX,
    openingEndX,
    openingWidth: Math.max(0, openingEndX - openingStartX),
    anchor,
  });

  const placementTarget = normalizePlacementTarget(config.roomLayout, config.placementTarget);
  switch (placementTarget) {
    case 'fireplace-pair': {
      const leftEnd = -config.chimneyWidth / 2 - config.centerGap;
      const rightStart = config.chimneyWidth / 2 + config.centerGap;
      return [
        makeCapacity('left', 'left', 'Left fireplace opening', -config.roomWidth / 2, leftEnd, 'right'),
        makeCapacity('right', 'right', 'Right fireplace opening', rightStart, config.roomWidth / 2, 'left'),
      ];
    }
    case 'wall-left':
      return [makeCapacity(
        'left',
        'left',
        'Left wall study span',
        -config.roomWidth / 2,
        -config.roomWidth / 2 + config.wallOpeningWidth,
        'left',
      )];
    case 'wall-right':
      return [makeCapacity(
        'right',
        'right',
        'Right wall study span',
        config.roomWidth / 2 - config.wallOpeningWidth,
        config.roomWidth / 2,
        'right',
      )];
    case 'wall-center':
      return [makeCapacity(
        'center',
        'left',
        'Centered wall study span',
        -config.wallOpeningWidth / 2,
        config.wallOpeningWidth / 2,
        'center',
      )];
    case 'window-left':
      return [windowCapacity(config, 'left', makeCapacity)];
    case 'window-right':
      return [windowCapacity(config, 'right', makeCapacity)];
    case 'window-both':
      return [windowCapacity(config, 'left', makeCapacity), windowCapacity(config, 'right', makeCapacity)];
    case 'niche-center':
      return [makeCapacity(
        'center',
        'left',
        'Center niche opening',
        -config.nicheWidth / 2,
        config.nicheWidth / 2,
        'center',
      )];
    case 'alcove-center':
      return [makeCapacity(
        'center',
        'left',
        'Deep alcove rear wall',
        -config.alcoveOpeningWidth / 2,
        config.alcoveOpeningWidth / 2,
        'center',
      )];
    case 'door-left':
      return [featureFlankCapacity(
        config,
        'left',
        config.doorCenterX,
        config.doorWidth + 2 * ROOM_STUDY.doorCasingWidth,
        'doorway',
        makeCapacity,
      )];
    case 'door-right':
      return [featureFlankCapacity(
        config,
        'right',
        config.doorCenterX,
        config.doorWidth + 2 * ROOM_STUDY.doorCasingWidth,
        'doorway',
        makeCapacity,
      )];
    case 'door-both':
      return [
        featureFlankCapacity(
          config,
          'left',
          config.doorCenterX,
          config.doorWidth + 2 * ROOM_STUDY.doorCasingWidth,
          'doorway',
          makeCapacity,
        ),
        featureFlankCapacity(
          config,
          'right',
          config.doorCenterX,
          config.doorWidth + 2 * ROOM_STUDY.doorCasingWidth,
          'doorway',
          makeCapacity,
        ),
      ];
    case 'offset-window-left':
      return [windowCapacity(config, 'left', makeCapacity, config.windowCenterX, 'offset window')];
    case 'offset-window-right':
      return [windowCapacity(config, 'right', makeCapacity, config.windowCenterX, 'offset window')];
    case 'offset-window-both':
      return [
        windowCapacity(config, 'left', makeCapacity, config.windowCenterX, 'offset window'),
        windowCapacity(config, 'right', makeCapacity, config.windowCenterX, 'offset window'),
      ];
    case 'double-window-center': {
      const openingHalfWidth = config.doubleWindowGap / 2 - config.centerGap;
      return [makeCapacity(
        'center',
        'left',
        'Wall between windows',
        -openingHalfWidth,
        openingHalfWidth,
        'center',
      )];
    }
    case 'double-window-outer': {
      const windowOuterWidth = config.windowWidth + 2 * ROOM_STUDY.windowCasingWidth;
      const outerWindowEdge = config.doubleWindowGap / 2 + windowOuterWidth;
      return [
        makeCapacity(
          'left',
          'left',
          'Outside left window',
          -config.roomWidth / 2,
          -outerWindowEdge - config.centerGap,
          'right',
        ),
        makeCapacity(
          'right',
          'right',
          'Outside right window',
          outerWindowEdge + config.centerGap,
          config.roomWidth / 2,
          'left',
        ),
      ];
    }
    case 'media-left':
      return [featureFlankCapacity(
        config,
        'left',
        0,
        config.mediaZoneWidth,
        'media zone',
        makeCapacity,
      )];
    case 'media-right':
      return [featureFlankCapacity(
        config,
        'right',
        0,
        config.mediaZoneWidth,
        'media zone',
        makeCapacity,
      )];
    case 'media-both':
      return [
        featureFlankCapacity(config, 'left', 0, config.mediaZoneWidth, 'media zone', makeCapacity),
        featureFlankCapacity(config, 'right', 0, config.mediaZoneWidth, 'media zone', makeCapacity),
      ];
    case 'side-nook-left':
      return [makeCapacity(
        'left',
        'left',
        'Left side nook',
        -config.roomWidth / 2,
        -config.roomWidth / 2 + config.sideNookWidth,
        'center',
      )];
    case 'side-nook-right':
      return [makeCapacity(
        'right',
        'right',
        'Right side nook',
        config.roomWidth / 2 - config.sideNookWidth,
        config.roomWidth / 2,
        'center',
      )];
    default:
      return [];
  }
}

function windowCapacity(
  config: ModelConfig,
  side: 'left' | 'right',
  makeCapacity: (
    id: PlacementCapacity['id'],
    sourceSide: PlacementCapacity['sourceSide'],
    label: string,
    openingStartX: number,
    openingEndX: number,
    anchor: PlacementCapacity['anchor'],
  ) => PlacementCapacity,
  centerX = 0,
  featureLabel = 'window',
): PlacementCapacity {
  const windowOuterWidth = config.windowWidth + 2 * ROOM_STUDY.windowCasingWidth;
  if (side === 'left') {
    return makeCapacity(
      'left',
      'left',
      `Left ${featureLabel} opening`,
      -config.roomWidth / 2,
      centerX - windowOuterWidth / 2 - config.centerGap,
      'right',
    );
  }
  return makeCapacity(
    'right',
    'right',
    `Right ${featureLabel} opening`,
    centerX + windowOuterWidth / 2 + config.centerGap,
    config.roomWidth / 2,
    'left',
  );
}

function featureFlankCapacity(
  config: ModelConfig,
  side: 'left' | 'right',
  featureCenterX: number,
  featureOuterWidth: number,
  featureLabel: string,
  makeCapacity: (
    id: PlacementCapacity['id'],
    sourceSide: PlacementCapacity['sourceSide'],
    label: string,
    openingStartX: number,
    openingEndX: number,
    anchor: PlacementCapacity['anchor'],
  ) => PlacementCapacity,
): PlacementCapacity {
  if (side === 'left') {
    return makeCapacity(
      'left',
      'left',
      `Left ${featureLabel} opening`,
      -config.roomWidth / 2,
      featureCenterX - featureOuterWidth / 2 - config.centerGap,
      'right',
    );
  }
  return makeCapacity(
    'right',
    'right',
    `Right ${featureLabel} opening`,
    featureCenterX + featureOuterWidth / 2 + config.centerGap,
    config.roomWidth / 2,
    'left',
  );
}

function bayWidthForOverall(width: number, sideFiller: number): number {
  return (
    width -
    sideFiller -
    2 * CONSTRUCTION.carcassThickness -
    CONSTRUCTION.centerDividerWidth
  ) / 2;
}

function floorToIncrement(value: number, increment: number): number {
  return Math.floor((value + 1e-8) / increment) * increment;
}

function makeRawLayoutDefault(layout: RoomLayoutId): ModelConfig {
  return {
    ...DEFAULT_CONFIG,
    ...LAYOUT_ENVIRONMENT_DEFAULTS[layout],
    roomLayout: layout,
    placementTarget: normalizePlacementTarget(
      layout,
      LAYOUT_ENVIRONMENT_DEFAULTS[layout].placementTarget,
    ),
  };
}

function normalizePlacementTarget(
  layout: RoomLayoutId,
  target: unknown,
): PlacementTarget {
  const options = getPlacementOptions(layout);
  return options.some((option) => option.value === target)
    ? target as PlacementTarget
    : options[0].value;
}

function isRoomLayoutId(value: unknown): value is RoomLayoutId {
  return ROOM_LAYOUT_OPTIONS.some((option) => option.value === value);
}
