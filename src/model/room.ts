import * as THREE from 'three';
import type { ModelConfig } from './config';
import { deriveLayout } from './config';
import type { MaterialLibrary } from './materials';
import { addEdgeHighlight, createBox, setPartMetadata } from './primitives';

export function buildRoom(config: ModelConfig, materials: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Room layout shell';
  group.visible = config.showRoom;
  setPartMetadata(group, {
    name: 'Room layout shell',
    category: 'Room',
    width: config.roomWidth,
    height: config.roomHeight,
    depth: config.roomDepth,
    material: 'Painted gypsum walls and wood floor',
    note: 'Open-front U-shaped room copied from the supplied layout image, with central chimney projection.',
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
    materialLabel: 'Prefinished wood flooring',
  });
  floor.castShadow = false;
  floor.receiveShadow = true;
  group.add(floor);

  const backWall = createBox({
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
  });
  group.add(backWall);

  for (const direction of [-1, 1] as const) {
    const sideWall = createBox({
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
    });
    group.add(sideWall);

    const frontReturn = createBox({
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
    });
    group.add(frontReturn);
  }

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
    note: 'Central projected wall copied from the supplied room layout.',
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

  buildBaseboards(group, config, materials);

  if (config.showCeiling) {
    const ceiling = createBox({
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
    });
    group.add(ceiling);
  }

  if (config.showReferenceGhost) {
    const footprint = createBox({
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
    });
    group.add(footprint);
  }

  return group;
}

function buildBaseboards(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
): void {
  const baseboardHeight = 4.25;
  const baseboardDepth = 0.62;
  const backY = baseboardHeight / 2;
  const layout = deriveLayout(config);
  const leftOuter = layout.leftBookcaseX - config.leftBookcaseWidth / 2;
  const leftInner = layout.leftBookcaseX + config.leftBookcaseWidth / 2;
  const rightInner = layout.rightBookcaseX - config.rightBookcaseWidth / 2;
  const rightOuter = layout.rightBookcaseX + config.rightBookcaseWidth / 2;
  const exposedBackWallSegments = [
    { name: 'Left outer', start: -config.roomWidth / 2, end: leftOuter },
    { name: 'Left chimney gap', start: leftInner, end: -config.chimneyWidth / 2 },
    { name: 'Right chimney gap', start: config.chimneyWidth / 2, end: rightInner },
    { name: 'Right outer', start: rightOuter, end: config.roomWidth / 2 },
  ];
  for (const segment of exposedBackWallSegments) {
    const width = segment.end - segment.start;
    if (width <= 0.08) continue;
    group.add(
      createBox({
        name: `${segment.name} back-wall baseboard`,
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

  const sideBaseboardStart = config.baseDepth + 0.25;
  const sideBaseboardDepth = Math.max(0.1, config.roomDepth - sideBaseboardStart);
  for (const direction of [-1, 1] as const) {
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
