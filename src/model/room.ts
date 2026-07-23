import * as THREE from 'three';
import type { DerivedLayout, ModelConfig } from './config';
import { getRoomLayoutOption, ROOM_STUDY } from './config';
import type { MaterialLibrary } from './materials';
import { addEdgeHighlight, createBox, setPartMetadata } from './primitives';

export function buildRoom(
  config: ModelConfig,
  derived: DerivedLayout,
  materials: MaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const layoutOption = getRoomLayoutOption(config.roomLayout);
  const sourceBasis = layoutOption.sourceKind.includes('reference')
    ? 'Reconstructed from an owner-supplied room reference'
    : 'Catalog planning scenario based on a common residential condition';
  group.name = `${derived.layoutLabel} room shell`;
  group.visible = config.showRoom;
  setPartMetadata(group, {
    name: `${derived.layoutLabel} room shell`,
    category: 'Room',
    width: config.roomWidth,
    height: config.roomHeight,
    depth: config.roomDepth,
    material: 'Painted gypsum walls and wood floor',
    note: `${sourceBasis}. Overall dimensions are editable study assumptions.`,
  });

  const floor = createBox({
    name: 'Wood floor',
    category: 'Room floor',
    width: config.roomWidth,
    height: 0.75,
    depth: config.roomDepth,
    y: -0.375,
    z: config.roomDepth / 2,
    material: materials.floor,
    radius: 0.035,
    castShadow: false,
    materialLabel: 'Prefinished wood flooring',
  });
  floor.receiveShadow = true;
  group.add(floor);

  switch (config.roomLayout) {
    case 'door-wall':
      buildDoorWall(group, config, materials);
      break;
    case 'offset-window-wall':
    case 'double-window-wall':
    case 'window-wall':
      buildWindowWall(group, config, materials, getWindowOpeningsForLayout(config));
      break;
    case 'media-wall':
      buildSolidBackWall(group, config, materials);
      buildMediaFeatureZone(group, config, materials);
      break;
    case 'side-nook':
      buildSolidBackWall(group, config, materials);
      buildSideNook(group, config, materials);
      break;
    case 'center-niche':
      buildSolidBackWall(group, config, materials);
      buildCenterNiche(group, config, materials);
      break;
    case 'fireplace-wall':
      buildSolidBackWall(group, config, materials);
      buildChimneyBreast(group, config, materials);
      break;
    case 'offset-alcove':
    case 'straight-wall':
    default:
      buildSolidBackWall(group, config, materials);
      break;
  }

  buildSideWalls(group, config, materials);
  buildBaseboards(group, config, derived, materials);

  if (config.showCeiling) {
    group.add(
      createBox({
        name: 'Room ceiling',
        category: 'Room ceiling',
        width: config.roomWidth + config.wallThickness * 2,
        height: 0.75,
        depth: config.roomDepth + config.wallThickness,
        y: config.roomHeight + 0.375,
        z: config.roomDepth / 2 - config.wallThickness / 2,
        material: materials.wall,
        castShadow: false,
        materialLabel: 'Painted gypsum ceiling',
      }),
    );
  }

  if (config.showReferenceGhost) {
    group.add(
      createBox({
        name: 'Room reference envelope',
        category: 'Reference envelope',
        width: config.roomWidth,
        height: config.roomHeight,
        depth: config.roomDepth,
        y: config.roomHeight / 2,
        z: config.roomDepth / 2,
        material: materials.ghost,
        castShadow: false,
        receiveShadow: false,
        pickable: false,
      }),
    );
  }

  return group;
}

function buildSolidBackWall(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  group.add(
    createBox({
      name: 'Back wall',
      category: 'Room wall',
      width: config.roomWidth,
      height: config.roomHeight,
      depth: config.wallThickness,
      y: config.roomHeight / 2,
      z: -config.wallThickness / 2,
      material: materials.wall,
      castShadow: false,
      materialLabel: 'Painted gypsum wall',
    }),
  );
}

function buildSideWalls(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${direction < 0 ? 'Left' : 'Right'} side wall`,
        category: 'Room wall',
        width: config.wallThickness,
        height: config.roomHeight,
        depth: config.roomDepth + config.wallThickness,
        x: direction * (config.roomWidth / 2 + config.wallThickness / 2),
        y: config.roomHeight / 2,
        z: config.roomDepth / 2 - config.wallThickness / 2,
        material: materials.wallSide,
        castShadow: false,
        materialLabel: 'Painted gypsum wall',
      }),
      createBox({
        name: `${direction < 0 ? 'Left' : 'Right'} front wall return`,
        category: 'Room wall return',
        width: config.wallThickness + 1.2,
        height: config.roomHeight,
        depth: config.wallThickness,
        x: direction * (config.roomWidth / 2 + config.wallThickness / 2),
        y: config.roomHeight / 2,
        z: config.roomDepth + config.wallThickness / 2,
        material: materials.wallSide,
        castShadow: false,
        materialLabel: 'Painted gypsum wall',
      }),
    );
  }
}

function buildChimneyBreast(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const chimneyHeight = Math.max(24, config.roomHeight - config.chimneyTopInset);
  const chimney = createBox({
    name: 'Central chimney breast',
    category: 'Room chimney projection',
    width: config.chimneyWidth,
    height: chimneyHeight,
    depth: config.chimneyDepth,
    y: chimneyHeight / 2,
    z: config.chimneyDepth / 2,
    material: materials.wall,
    radius: 0.04,
    castShadow: true,
    materialLabel: 'Painted gypsum chimney breast',
    note: 'Central projected wall copied from the supplied fireplace-room layout.',
  });
  addEdgeHighlight(chimney, 0x8b8882, 0.11);
  group.add(chimney);

  if (config.chimneyTopInset > 0.1) {
    group.add(
      createBox({
        name: 'Chimney top wall infill',
        category: 'Room wall',
        width: config.chimneyWidth,
        height: config.chimneyTopInset,
        depth: 0.6,
        y: chimneyHeight + config.chimneyTopInset / 2,
        z: 0.3,
        material: materials.wall,
        castShadow: false,
        materialLabel: 'Painted gypsum wall',
      }),
    );
  }
}

function buildCenterNiche(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const flankWidth = Math.max(0.1, (config.roomWidth - config.nicheWidth) / 2);
  for (const direction of [-1, 1] as const) {
    const projection = createBox({
      name: `${direction < 0 ? 'Left' : 'Right'} niche wall plane`,
      category: 'Room wall projection',
      width: flankWidth,
      height: config.roomHeight,
      depth: config.nicheDepth,
      x: direction * (config.nicheWidth / 2 + flankWidth / 2),
      y: config.roomHeight / 2,
      z: config.nicheDepth / 2,
      material: direction < 0 ? materials.wall : materials.wallSide,
      radius: 0.035,
      castShadow: true,
      materialLabel: 'Painted gypsum wall',
      note: 'Forward wall plane framing the recessed center opening shown in the supplied layout.',
    });
    addEdgeHighlight(projection, 0x8b8882, 0.1);
    group.add(projection);
  }
}

interface BackWallOpening {
  label: string;
  centerX: number;
  width: number;
  bottomY: number;
  height: number;
}

function makeWindowOpening(
  config: ModelConfig,
  centerX: number,
  label: string,
): BackWallOpening {
  return {
    label,
    centerX,
    width: config.windowWidth,
    bottomY: config.windowSillHeight,
    height: config.windowHeight,
  };
}

function makeDoubleWindowOpenings(config: ModelConfig): BackWallOpening[] {
  const outerWidth = config.windowWidth + 2 * ROOM_STUDY.windowCasingWidth;
  // The editable gap is clear trim-to-trim space, not raw masonry-opening space.
  const centerOffset = (outerWidth + config.doubleWindowGap) / 2;
  return [
    makeWindowOpening(config, -centerOffset, 'Left window'),
    makeWindowOpening(config, centerOffset, 'Right window'),
  ];
}

function getWindowOpeningsForLayout(config: ModelConfig): BackWallOpening[] {
  switch (config.roomLayout) {
    case 'offset-window-wall':
      return [makeWindowOpening(config, config.windowCenterX, 'Offset window')];
    case 'double-window-wall':
      return makeDoubleWindowOpenings(config);
    case 'window-wall':
    default:
      return [makeWindowOpening(config, 0, 'Window')];
  }
}

function buildDoorWall(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const doorway: BackWallOpening = {
    label: 'Doorway',
    centerX: config.doorCenterX,
    width: config.doorWidth,
    bottomY: 0,
    height: config.doorHeight,
  };
  buildSegmentedBackWall(group, config, materials, [doorway], 'Door wall');

  const casing = ROOM_STUDY.doorCasingWidth;
  const trimDepth = ROOM_STUDY.windowFrameDepth;
  group.add(
    createBox({
      name: 'Doorway top casing',
      category: 'Doorway trim',
      width: config.doorWidth + 2 * casing,
      height: casing,
      depth: trimDepth,
      x: config.doorCenterX,
      y: config.doorHeight + casing / 2,
      z: trimDepth / 2 - 0.25,
      material: materials.floorTrim,
      radius: 0.04,
      materialLabel: 'Paint-grade doorway casing',
      note: 'Simple catalog-study casing around a true floor-level wall opening; no door design is implied.',
    }),
  );
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${direction < 0 ? 'Left' : 'Right'} doorway casing`,
        category: 'Doorway trim',
        width: casing,
        height: config.doorHeight,
        depth: trimDepth,
        x: config.doorCenterX + direction * (config.doorWidth / 2 + casing / 2),
        y: config.doorHeight / 2,
        z: trimDepth / 2 - 0.25,
        material: materials.floorTrim,
        radius: 0.04,
        materialLabel: 'Paint-grade doorway casing',
      }),
    );
  }
}

function buildWindowWall(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
  openings: BackWallOpening[],
): void {
  buildSegmentedBackWall(group, config, materials, openings, 'Window wall');
  for (const opening of openings) buildWindowFeature(group, materials, opening);
}

function buildSegmentedBackWall(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
  openings: BackWallOpening[],
  wallLabel: string,
): void {
  const roomInterval = { start: -config.roomWidth / 2, end: config.roomWidth / 2 };
  const normalizedOpenings = openings
    .map((opening) => {
      const start = Math.max(roomInterval.start, opening.centerX - opening.width / 2);
      const end = Math.min(roomInterval.end, opening.centerX + opening.width / 2);
      const bottomY = Math.max(0, Math.min(opening.bottomY, config.roomHeight));
      const topY = Math.max(bottomY, Math.min(opening.bottomY + opening.height, config.roomHeight));
      return {
        ...opening,
        centerX: (start + end) / 2,
        width: Math.max(0, end - start),
        bottomY,
        height: Math.max(0, topY - bottomY),
      };
    })
    .filter((opening) => opening.width > 0.08 && opening.height > 0.08)
    .sort((a, b) => a.centerX - b.centerX);

  const horizontalBlockers = normalizedOpenings.map((opening) => ({
    start: opening.centerX - opening.width / 2,
    end: opening.centerX + opening.width / 2,
  }));
  const fullHeightFields = subtractIntervals(roomInterval, horizontalBlockers);
  for (const [index, field] of fullHeightFields.entries()) {
    const width = field.end - field.start;
    if (width <= 0.08) continue;
    group.add(
      createBox({
        name: `${wallLabel} full-height field ${index + 1}`,
        category: 'Room wall',
        width,
        height: config.roomHeight,
        depth: config.wallThickness,
        x: field.start + width / 2,
        y: config.roomHeight / 2,
        z: -config.wallThickness / 2,
        material: materials.wall,
        castShadow: false,
        materialLabel: 'Painted gypsum wall',
      }),
    );
  }

  for (const opening of normalizedOpenings) {
    if (opening.bottomY > 0.08) {
      group.add(
        createBox({
          name: `${opening.label} wall below opening`,
          category: 'Room wall',
          width: opening.width,
          height: opening.bottomY,
          depth: config.wallThickness,
          x: opening.centerX,
          y: opening.bottomY / 2,
          z: -config.wallThickness / 2,
          material: materials.wall,
          castShadow: false,
          materialLabel: 'Painted gypsum wall',
        }),
      );
    }
    const topY = opening.bottomY + opening.height;
    const aboveHeight = config.roomHeight - topY;
    if (aboveHeight > 0.08) {
      group.add(
        createBox({
          name: `${opening.label} wall above opening`,
          category: 'Room wall',
          width: opening.width,
          height: aboveHeight,
          depth: config.wallThickness,
          x: opening.centerX,
          y: topY + aboveHeight / 2,
          z: -config.wallThickness / 2,
          material: materials.wall,
          castShadow: false,
          materialLabel: 'Painted gypsum wall',
        }),
      );
    }
  }
}

function buildWindowFeature(
  group: THREE.Group,
  materials: MaterialLibrary,
  opening: BackWallOpening,
): void {
  const casing = ROOM_STUDY.windowCasingWidth;
  const frameDepth = ROOM_STUDY.windowFrameDepth;
  const windowCenterY = opening.bottomY + opening.height / 2;
  group.add(
    createBox({
      name: `${opening.label} glazing`,
      category: 'Window',
      width: Math.max(1, opening.width - 2),
      height: Math.max(1, opening.height - 2),
      depth: 0.28,
      x: opening.centerX,
      y: windowCenterY,
      z: -0.22,
      material: materials.windowGlass,
      castShadow: false,
      receiveShadow: false,
      materialLabel: 'Pale architectural glazing',
    }),
    createBox({
      name: `${opening.label} top casing`,
      category: 'Window trim',
      width: opening.width + 2 * casing,
      height: casing,
      depth: frameDepth,
      x: opening.centerX,
      y: opening.bottomY + opening.height + casing / 2,
      z: frameDepth / 2 - 0.25,
      material: materials.floorTrim,
      radius: 0.04,
      materialLabel: 'Paint-grade window casing',
    }),
    createBox({
      name: `${opening.label} bottom casing`,
      category: 'Window trim',
      width: opening.width + 2 * casing,
      height: casing,
      depth: frameDepth,
      x: opening.centerX,
      y: opening.bottomY - casing / 2,
      z: frameDepth / 2 - 0.25,
      material: materials.floorTrim,
      radius: 0.04,
      materialLabel: 'Paint-grade window casing',
    }),
  );
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${opening.label} ${direction < 0 ? 'left' : 'right'} casing`,
        category: 'Window trim',
        width: casing,
        height: opening.height,
        depth: frameDepth,
        x: opening.centerX + direction * (opening.width / 2 + casing / 2),
        y: windowCenterY,
        z: frameDepth / 2 - 0.25,
        material: materials.floorTrim,
        radius: 0.04,
        materialLabel: 'Paint-grade window casing',
      }),
    );
  }

  const muntinWidth = 0.8;
  for (const fraction of [-0.25, 0, 0.25]) {
    group.add(
      createBox({
        name: `${opening.label} vertical muntin ${fraction}`,
        category: 'Window muntin',
        width: muntinWidth,
        height: Math.max(1, opening.height - 2),
        depth: 0.72,
        x: opening.centerX + opening.width * fraction,
        y: windowCenterY,
        z: 0.16,
        material: materials.floorTrim,
        castShadow: false,
        materialLabel: 'Paint-grade window muntin',
      }),
    );
  }
  for (const fraction of [-1 / 6, 1 / 6]) {
    group.add(
      createBox({
        name: `${opening.label} horizontal muntin ${fraction}`,
        category: 'Window muntin',
        width: Math.max(1, opening.width - 2),
        height: muntinWidth,
        depth: 0.72,
        x: opening.centerX,
        y: windowCenterY + opening.height * fraction,
        z: 0.16,
        material: materials.floorTrim,
        castShadow: false,
        materialLabel: 'Paint-grade window muntin',
      }),
    );
  }
  group.add(
    createBox({
      name: `${opening.label} sill`,
      category: 'Window trim',
      width: opening.width + 2 * casing + 2,
      height: 1.4,
      depth: 4,
      x: opening.centerX,
      y: opening.bottomY - casing - 0.7,
      z: 1.35,
      material: materials.floorTrim,
      radius: 0.05,
      materialLabel: 'Paint-grade window sill',
    }),
  );
}

function getMediaZoneCenterY(config: ModelConfig): number {
  const halfHeight = config.mediaZoneHeight / 2;
  const preferredCenter = config.roomHeight * 0.55;
  return Math.min(
    config.roomHeight - halfHeight - 8,
    Math.max(halfHeight + 18, preferredCenter),
  );
}

function buildMediaFeatureZone(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const feature = createBox({
    name: 'Flush media feature zone',
    category: 'Room media feature',
    width: config.mediaZoneWidth,
    height: config.mediaZoneHeight,
    depth: 0.22,
    y: getMediaZoneCenterY(config),
    z: 0.1,
    material: materials.glass,
    radius: 0.12,
    castShadow: false,
    receiveShadow: false,
    materialLabel: 'Dark flush media surface',
    note: 'Wall-mounted catalog-study media datum only; this is not a cabinet design option.',
  });
  addEdgeHighlight(feature, 0x6f7478, 0.28);
  group.add(feature);
}

interface SideNookGeometry {
  openingSide: -1 | 1;
  projectionStartX: number;
  projectionEndX: number;
  projectionWidth: number;
  projectionCenterX: number;
}

function getSideNookGeometry(config: ModelConfig): SideNookGeometry {
  const openingSide: -1 | 1 = config.placementTarget === 'side-nook-right' ? 1 : -1;
  const halfRoom = config.roomWidth / 2;
  const openingWidth = Math.min(config.sideNookWidth, config.roomWidth);
  const projectionStartX = openingSide < 0 ? -halfRoom + openingWidth : -halfRoom;
  const projectionEndX = openingSide < 0 ? halfRoom : halfRoom - openingWidth;
  return {
    openingSide,
    projectionStartX,
    projectionEndX,
    projectionWidth: Math.max(0, projectionEndX - projectionStartX),
    projectionCenterX: (projectionStartX + projectionEndX) / 2,
  };
}

function buildSideNook(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const nook = getSideNookGeometry(config);
  if (nook.projectionWidth <= 0.08) return;
  const projection = createBox({
    name: `${nook.openingSide < 0 ? 'Right' : 'Left'} side-nook forward wall plane`,
    category: 'Room wall projection',
    width: nook.projectionWidth,
    height: config.roomHeight,
    depth: config.sideNookDepth,
    x: nook.projectionCenterX,
    y: config.roomHeight / 2,
    z: config.sideNookDepth / 2,
    material: materials.wall,
    radius: 0.035,
    castShadow: true,
    materialLabel: 'Painted gypsum wall',
    note: `Forward wall plane leaving a one-sided recessed opening on the ${nook.openingSide < 0 ? 'left' : 'right'}.`,
  });
  addEdgeHighlight(projection, 0x8b8882, 0.1);
  group.add(projection);
}

function buildBaseboards(
  group: THREE.Group,
  config: ModelConfig,
  derived: DerivedLayout,
  materials: MaterialLibrary,
): void {
  const baseboardHeight = 4.25;
  const baseboardDepth = 0.62;
  const backY = baseboardHeight / 2;
  const blockers = derived.bookcasePlacements.map((placement) => ({
    start: placement.x - placement.width / 2,
    end: placement.x + placement.width / 2,
  }));
  if (derived.hasFireplace) {
    blockers.push({ start: -config.chimneyWidth / 2, end: config.chimneyWidth / 2 });
  }
  blockers.push(...getArchitecturalBaseboardBlockers(config, baseboardHeight));

  const exposedBackWallSegments = subtractIntervals(
    { start: -config.roomWidth / 2, end: config.roomWidth / 2 },
    blockers,
  );
  for (const [index, segment] of exposedBackWallSegments.entries()) {
    const width = segment.end - segment.start;
    if (width <= 0.08) continue;
    group.add(
      createBox({
        name: `Back-wall baseboard ${index + 1}`,
        category: 'Room trim',
        width,
        height: baseboardHeight,
        depth: baseboardDepth,
        x: segment.start + width / 2,
        y: backY,
        z: baseboardDepth / 2 + 0.02,
        material: materials.floorTrim,
        radius: 0.045,
        materialLabel: 'Paint-grade baseboard',
      }),
    );
  }

  if (config.roomLayout === 'center-niche') {
    const flankWidth = Math.max(0, (config.roomWidth - config.nicheWidth) / 2);
    for (const direction of [-1, 1] as const) {
      if (flankWidth <= 0.08) continue;
      group.add(
        createBox({
          name: `${direction < 0 ? 'Left' : 'Right'} niche-face baseboard`,
          category: 'Room trim',
          width: flankWidth,
          height: baseboardHeight,
          depth: baseboardDepth,
          x: direction * (config.nicheWidth / 2 + flankWidth / 2),
          y: backY,
          z: config.nicheDepth + baseboardDepth / 2,
          material: materials.floorTrim,
          radius: 0.045,
          materialLabel: 'Paint-grade baseboard',
        }),
      );
    }
  }

  if (config.roomLayout === 'side-nook') {
    const nook = getSideNookGeometry(config);
    if (nook.projectionWidth > 0.08) {
      group.add(
        createBox({
          name: 'Side-nook forward-face baseboard',
          category: 'Room trim',
          width: nook.projectionWidth,
          height: baseboardHeight,
          depth: baseboardDepth,
          x: nook.projectionCenterX,
          y: backY,
          z: config.sideNookDepth + baseboardDepth / 2,
          material: materials.floorTrim,
          radius: 0.045,
          materialLabel: 'Paint-grade baseboard',
        }),
      );
    }
  }

  for (const direction of [-1, 1] as const) {
    const roomEdge = direction * (config.roomWidth / 2);
    const hasBookcaseAgainstSideWall = derived.bookcasePlacements.some((placement) => {
      const placementEdge = placement.x + direction * (placement.width / 2);
      return direction * (roomEdge - placementEdge) <= 0.5;
    });
    const sideBaseboardStart = hasBookcaseAgainstSideWall ? config.baseDepth + 0.25 : 0;
    const sideBaseboardDepth = Math.max(0.1, config.roomDepth - sideBaseboardStart);
    group.add(
      createBox({
        name: `${direction < 0 ? 'Left' : 'Right'} side-wall baseboard`,
        category: 'Room trim',
        width: baseboardDepth,
        height: baseboardHeight,
        depth: sideBaseboardDepth,
        x: direction * (config.roomWidth / 2 - baseboardDepth / 2),
        y: backY,
        z: sideBaseboardStart + sideBaseboardDepth / 2,
        material: materials.floorTrim,
        radius: 0.045,
        materialLabel: 'Paint-grade baseboard',
      }),
    );
  }
}

function getArchitecturalBaseboardBlockers(
  config: ModelConfig,
  baseboardHeight: number,
): Interval[] {
  const blockers: Interval[] = [];
  if (config.roomLayout === 'door-wall') {
    const halfOuterWidth = config.doorWidth / 2 + ROOM_STUDY.doorCasingWidth;
    blockers.push({
      start: config.doorCenterX - halfOuterWidth,
      end: config.doorCenterX + halfOuterWidth,
    });
  }

  if (
    config.roomLayout === 'window-wall' ||
    config.roomLayout === 'offset-window-wall' ||
    config.roomLayout === 'double-window-wall'
  ) {
    const casing = ROOM_STUDY.windowCasingWidth;
    for (const opening of getWindowOpeningsForLayout(config)) {
      const sillBottomY = opening.bottomY - casing - 1.4;
      if (sillBottomY > baseboardHeight + 0.05) continue;
      const halfSillWidth = opening.width / 2 + casing + 1;
      blockers.push({
        start: opening.centerX - halfSillWidth,
        end: opening.centerX + halfSillWidth,
      });
    }
  }

  if (config.roomLayout === 'media-wall') {
    const mediaBottomY = getMediaZoneCenterY(config) - config.mediaZoneHeight / 2;
    if (mediaBottomY <= baseboardHeight + 0.05) {
      blockers.push({
        start: -config.mediaZoneWidth / 2,
        end: config.mediaZoneWidth / 2,
      });
    }
  }

  if (config.roomLayout === 'side-nook') {
    const nook = getSideNookGeometry(config);
    blockers.push({ start: nook.projectionStartX, end: nook.projectionEndX });
  }
  return blockers;
}

interface Interval {
  start: number;
  end: number;
}

function subtractIntervals(source: Interval, blockers: Interval[]): Interval[] {
  const normalized = blockers
    .map((interval) => ({
      start: Math.max(source.start, Math.min(interval.start, interval.end)),
      end: Math.min(source.end, Math.max(interval.start, interval.end)),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);
  const output: Interval[] = [];
  let cursor = source.start;
  for (const interval of normalized) {
    if (interval.start > cursor) output.push({ start: cursor, end: interval.start });
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < source.end) output.push({ start: cursor, end: source.end });
  return output;
}
