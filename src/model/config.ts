export type CabinetFinish = 'warm-white' | 'pure-white' | 'soft-gray' | 'deep-green';
export type FloorFinish = 'natural-oak' | 'white-oak' | 'walnut';

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
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  wallThickness: number;

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
  roomWidth: 222,
  roomDepth: 150,
  roomHeight: 108,
  wallThickness: 4.5,

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

export interface DerivedLayout {
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
  roomWidth: [150, 360],
  roomDepth: [96, 300],
  roomHeight: [84, 168],
  wallThickness: [3.5, 8],
  chimneyWidth: [42, 96],
  chimneyDepth: [3, 24],
  chimneyTopInset: [0, 36],
  leftBookcaseWidth: [44, 108],
  rightBookcaseWidth: [44, 108],
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

export function clampConfig(input: ModelConfig): ModelConfig {
  const output = { ...input };
  for (const key of numericKeys) {
    const value = Number(output[key]);
    const range = ranges[key];
    const safe = Number.isFinite(value) ? value : Number(DEFAULT_CONFIG[key]);
    const clamped = range ? Math.min(range[1], Math.max(range[0], safe)) : safe;
    (output[key] as number) = key === 'shelfCount' ? Math.round(clamped) : clamped;
  }

  output.bookcaseHeight = Math.min(output.bookcaseHeight, output.roomHeight - 0.5);

  // Keep the full parametric assembly inside the supplied room shell. The
  // overall inputs may change, but a narrower room may not silently force the
  // independently sized cases through the side walls or into the chimney.
  const minimumBookcaseWidth = ranges.leftBookcaseWidth?.[0] ?? 44;
  const minimumChimneyWidth = ranges.chimneyWidth?.[0] ?? 40;
  const maximumChimneyWidth = Math.max(
    minimumChimneyWidth,
    output.roomWidth - 2 * (minimumBookcaseWidth + output.centerGap),
  );
  output.chimneyWidth = Math.min(output.chimneyWidth, maximumChimneyWidth);
  const maximumBookcaseWidth = Math.max(
    minimumBookcaseWidth,
    (output.roomWidth - output.chimneyWidth) / 2 - output.centerGap,
  );
  output.leftBookcaseWidth = Math.min(output.leftBookcaseWidth, maximumBookcaseWidth);
  output.rightBookcaseWidth = Math.min(output.rightBookcaseWidth, maximumBookcaseWidth);

  output.baseDepth = Math.max(output.baseDepth, output.upperDepth + 1);
  output.baseHeight = Math.min(output.baseHeight, output.bookcaseHeight - 30);
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
  output.fireplaceOpeningWidth = Math.min(
    output.fireplaceOpeningWidth,
    maximumOpeningInsidePilasters,
  );
  const chimneyFaceHeight = Math.max(34, output.roomHeight - output.chimneyTopInset);
  output.fireplaceOpeningHeight = Math.min(
    output.fireplaceOpeningHeight,
    Math.max(18, chimneyFaceHeight - 14),
  );
  output.mantelHeight = Math.max(output.mantelHeight, output.fireplaceOpeningHeight + 14);
  output.mantelHeight = Math.min(output.mantelHeight, chimneyFaceHeight);
  output.hearthWidth = Math.max(output.hearthWidth, output.mantelWidth);
  output.hearthWidth = Math.min(output.hearthWidth, output.chimneyWidth + 2);

  const leftBayWidth = (
    output.leftBookcaseWidth -
    output.sideFiller -
    2 * CONSTRUCTION.carcassThickness -
    CONSTRUCTION.centerDividerWidth
  ) / 2;
  const rightBayWidth = (
    output.rightBookcaseWidth -
    output.sideFiller -
    2 * CONSTRUCTION.carcassThickness -
    CONSTRUCTION.centerDividerWidth
  ) / 2;
  const maximumShelfThickness = Math.max(
    selectAdjustableShelfRule(leftBayWidth).thickness,
    selectAdjustableShelfRule(rightBayWidth).thickness,
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

  const leftBayWidth = Math.max(
    1,
    (
      config.leftBookcaseWidth -
      config.sideFiller -
      2 * CONSTRUCTION.carcassThickness -
      CONSTRUCTION.centerDividerWidth
    ) / 2,
  );
  const rightBayWidth = Math.max(
    1,
    (
      config.rightBookcaseWidth -
      config.sideFiller -
      2 * CONSTRUCTION.carcassThickness -
      CONSTRUCTION.centerDividerWidth
    ) / 2,
  );

  const leftShelfRule = selectAdjustableShelfRule(leftBayWidth);
  const rightShelfRule = selectAdjustableShelfRule(rightBayWidth);

  const leftOuterEdge = leftBookcaseX - config.leftBookcaseWidth / 2;
  const rightOuterEdge = rightBookcaseX + config.rightBookcaseWidth / 2;
  const leftSideClearance = leftOuterEdge - -config.roomWidth / 2;
  const rightSideClearance = config.roomWidth / 2 - rightOuterEdge;

  const structuralWarnings: string[] = [];
  if (leftShelfRule.supportRequired) {
    structuralWarnings.push(
      `Left bookcase clear shelf span is ${formatInches(leftBayWidth)}, above the 36″ unsupported limit. Retain 1 1⁄2″ shelf geometry and add a verified support design.`,
    );
  }
  if (rightShelfRule.supportRequired) {
    structuralWarnings.push(
      `Right bookcase clear shelf span is ${formatInches(rightBayWidth)}, above the 36″ unsupported limit. Retain 1 1⁄2″ shelf geometry and add a verified support design.`,
    );
  }
  if (leftSideClearance < 0 || rightSideClearance < 0) {
    structuralWarnings.push('The bookcases overlap the side-wall limits. Reduce unit widths or increase room width.');
  }
  if (config.bookcaseHeight + 0.01 < config.roomHeight - 6) {
    structuralWarnings.push('A larger-than-typical top filler remains above the crown.');
  }
  return {
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
    centerFrontZ: config.chimneyDepth,
    availableLeftWall: (config.roomWidth - config.chimneyWidth) / 2,
    availableRightWall: (config.roomWidth - config.chimneyWidth) / 2,
    leftSideClearance,
    rightSideClearance,
    structuralWarnings,
  };
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
  const config: ModelConfig = { ...DEFAULT_CONFIG };

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

  for (const key of numericKeys) {
    const current = Number(config[key]);
    const initial = Number(DEFAULT_CONFIG[key]);
    if (Math.abs(current - initial) > 1e-6) params.set(String(key), String(current));
  }
  for (const key of booleanKeys) {
    const current = Boolean(config[key]);
    const initial = Boolean(DEFAULT_CONFIG[key]);
    if (current !== initial) params.set(String(key), current ? '1' : '0');
  }
  if (config.cabinetFinish !== DEFAULT_CONFIG.cabinetFinish) {
    params.set('cabinetFinish', config.cabinetFinish);
  }
  if (config.floorFinish !== DEFAULT_CONFIG.floorFinish) {
    params.set('floorFinish', config.floorFinish);
  }

  url.search = params.toString();
  return url.toString();
}

export function copyConfig(config: ModelConfig): ModelConfig {
  return JSON.parse(JSON.stringify(config)) as ModelConfig;
}
