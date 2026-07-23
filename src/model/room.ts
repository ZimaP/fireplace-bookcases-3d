import * as THREE from 'three';
import type { DerivedLayout, ModelConfig } from './config';
import { ROOM_STUDY } from './config';
import type { MaterialLibrary } from './materials';
import { addEdgeHighlight, createBox, setPartMetadata } from './primitives';

export function buildRoom(
  config: ModelConfig,
  derived: DerivedLayout,
  materials: MaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `${derived.layoutLabel} room shell`;
  group.visible = config.showRoom;
  setPartMetadata(group, {
    name: `${derived.layoutLabel} room shell`,
    category: 'Room',
    width: config.roomWidth,
    height: config.roomHeight,
    depth: config.roomDepth,
    material: 'Painted gypsum walls and wood floor',
    note: `${derived.layoutLabel} reconstructed from the supplied room image. Overall dimensions are editable study assumptions.`,
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
    case 'window-wall':
      buildWindowWall(group, config, materials);
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

function buildWindowWall(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const sideWidth = Math.max(0.1, (config.roomWidth - config.windowWidth) / 2);
  const windowCenterY = config.windowSillHeight + config.windowHeight / 2;
  const topHeight = Math.max(0.1, config.roomHeight - config.windowSillHeight - config.windowHeight);
  const wallParts = [
    createBox({
      name: 'Window wall left field',
      category: 'Room wall',
      width: sideWidth,
      height: config.roomHeight,
      depth: config.wallThickness,
      x: -(config.windowWidth / 2 + sideWidth / 2),
      y: config.roomHeight / 2,
      z: -config.wallThickness / 2,
      material: materials.wall,
      castShadow: false,
      materialLabel: 'Painted gypsum wall',
    }),
    createBox({
      name: 'Window wall right field',
      category: 'Room wall',
      width: sideWidth,
      height: config.roomHeight,
      depth: config.wallThickness,
      x: config.windowWidth / 2 + sideWidth / 2,
      y: config.roomHeight / 2,
      z: -config.wallThickness / 2,
      material: materials.wall,
      castShadow: false,
      materialLabel: 'Painted gypsum wall',
    }),
    createBox({
      name: 'Window wall below opening',
      category: 'Room wall',
      width: config.windowWidth,
      height: config.windowSillHeight,
      depth: config.wallThickness,
      y: config.windowSillHeight / 2,
      z: -config.wallThickness / 2,
      material: materials.wall,
      castShadow: false,
      materialLabel: 'Painted gypsum wall',
    }),
    createBox({
      name: 'Window wall above opening',
      category: 'Room wall',
      width: config.windowWidth,
      height: topHeight,
      depth: config.wallThickness,
      y: config.windowSillHeight + config.windowHeight + topHeight / 2,
      z: -config.wallThickness / 2,
      material: materials.wall,
      castShadow: false,
      materialLabel: 'Painted gypsum wall',
    }),
  ];
  group.add(...wallParts);

  const casing = ROOM_STUDY.windowCasingWidth;
  const frameDepth = ROOM_STUDY.windowFrameDepth;
  group.add(
    createBox({
      name: 'Window glazing',
      category: 'Window',
      width: Math.max(1, config.windowWidth - 2),
      height: Math.max(1, config.windowHeight - 2),
      depth: 0.28,
      y: windowCenterY,
      z: -0.22,
      material: materials.windowGlass,
      castShadow: false,
      receiveShadow: false,
      materialLabel: 'Pale architectural glazing',
    }),
    createBox({
      name: 'Window top casing',
      category: 'Window trim',
      width: config.windowWidth + 2 * casing,
      height: casing,
      depth: frameDepth,
      y: config.windowSillHeight + config.windowHeight + casing / 2,
      z: frameDepth / 2 - 0.25,
      material: materials.floorTrim,
      radius: 0.04,
      materialLabel: 'Paint-grade window casing',
    }),
    createBox({
      name: 'Window bottom casing',
      category: 'Window trim',
      width: config.windowWidth + 2 * casing,
      height: casing,
      depth: frameDepth,
      y: config.windowSillHeight - casing / 2,
      z: frameDepth / 2 - 0.25,
      material: materials.floorTrim,
      radius: 0.04,
      materialLabel: 'Paint-grade window casing',
    }),
  );
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${direction < 0 ? 'Left' : 'Right'} window casing`,
        category: 'Window trim',
        width: casing,
        height: config.windowHeight,
        depth: frameDepth,
        x: direction * (config.windowWidth / 2 + casing / 2),
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
        name: `Window vertical muntin ${fraction}`,
        category: 'Window muntin',
        width: muntinWidth,
        height: config.windowHeight - 2,
        depth: 0.72,
        x: config.windowWidth * fraction,
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
        name: `Window horizontal muntin ${fraction}`,
        category: 'Window muntin',
        width: config.windowWidth - 2,
        height: muntinWidth,
        depth: 0.72,
        y: windowCenterY + config.windowHeight * fraction,
        z: 0.16,
        material: materials.floorTrim,
        castShadow: false,
        materialLabel: 'Paint-grade window muntin',
      }),
    );
  }
  group.add(
    createBox({
      name: 'Window sill',
      category: 'Window trim',
      width: config.windowWidth + 2 * casing + 2,
      height: 1.4,
      depth: 4,
      y: config.windowSillHeight - casing - 0.7,
      z: 1.35,
      material: materials.floorTrim,
      radius: 0.05,
      materialLabel: 'Paint-grade window sill',
    }),
  );
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
