import * as THREE from 'three';
import {
  CONSTRUCTION,
  snapToShelfPinGrid,
  type AdjustableShelfThickness,
  type DerivedLayout,
  type ModelConfig,
} from './config';
import type { MaterialLibrary } from './materials';
import {
  addEdgeHighlight,
  createBox,
  createCylinderPart,
  createShakerDoor,
  setPartMetadata,
} from './primitives';

export interface BookcaseBuildResult {
  group: THREE.Group;
  shelfPinMeshes: THREE.InstancedMesh[];
}

export function buildBookcase(
  side: 'left' | 'right',
  config: ModelConfig,
  derived: DerivedLayout,
  materials: MaterialLibrary,
): BookcaseBuildResult {
  const width = side === 'left' ? config.leftBookcaseWidth : config.rightBookcaseWidth;
  const bayWidth = side === 'left' ? derived.leftBayWidth : derived.rightBayWidth;
  const adjustableShelfThickness = side === 'left'
    ? derived.leftAdjustableShelfThickness
    : derived.rightAdjustableShelfThickness;
  const finishedDepth = Math.max(
    config.baseDepth + 1.5,
    config.upperDepth + config.crownProjection,
    config.showHardware ? config.baseDepth + 2 : 0,
  );
  const group = new THREE.Group();
  group.name = `${capitalize(side)} fireplace bookcase`;
  group.position.x = side === 'left' ? derived.leftBookcaseX : derived.rightBookcaseX;
  setPartMetadata(group, {
    name: `${capitalize(side)} fireplace bookcase`,
    category: 'Built-in assembly',
    width,
    height: config.bookcaseHeight,
    depth: finishedDepth,
    material: 'Paint-grade MDF / plywood',
    note: 'Two-bay upper bookcase over four-door base cabinet with crown and field fillers.',
  });

  const frontFrameDepth = CONSTRUCTION.carcassThickness;
  const caseWidth = width - config.sideFiller;
  const caseOffsetX = side === 'left' ? config.sideFiller / 2 : -config.sideFiller / 2;
  const cabinetGroup = new THREE.Group();
  cabinetGroup.name = `${capitalize(side)} aligned cabinet carcass`;
  cabinetGroup.position.x = caseOffsetX;
  group.add(cabinetGroup);
  const upperStartY = derived.upperStartY;
  const crownBaseY = config.bookcaseHeight - config.crownHeight;
  const clearUpperHeight = crownBaseY - upperStartY - CONSTRUCTION.faceFrameWidth;
  const outerStileCenter = caseWidth / 2 - CONSTRUCTION.faceFrameWidth / 2;
  const outerCaseSideCenter = caseWidth / 2 - CONSTRUCTION.carcassThickness / 2;
  const bayCenterOffset = CONSTRUCTION.centerDividerWidth / 2 + bayWidth / 2;
  const faceOpeningWidth = (
    caseWidth - 3 * CONSTRUCTION.faceFrameWidth
  ) / 2;
  const faceBayCenterOffset = CONSTRUCTION.faceFrameWidth / 2 + faceOpeningWidth / 2;
  const upperFrontZ = config.upperDepth;
  const baseFrontZ = config.baseDepth;

  // Floor-to-top finished filler faces with concealed plywood backers, as shown
  // in the plan/detail callout. Base and upper faces follow their respective
  // cabinet depths instead of reading as one unsupported solid block.
  for (const direction of [side === 'left' ? -1 : 1] as const) {
    const fillerX = direction * (width / 2 - config.sideFiller / 2);
    const sideName = direction < 0 ? 'left' : 'right';
    const faceDepth = 1;
    const backerDepth = CONSTRUCTION.carcassThickness;
    const upperFillerHeight = Math.max(0.1, config.bookcaseHeight - upperStartY);
    const fillerParts = [
      createBox({
        name: `${capitalize(side)} ${sideName} base field filler`,
        category: 'Field filler / scribe',
        width: config.sideFiller,
        height: config.baseHeight,
        depth: faceDepth,
        x: fillerX,
        y: config.baseHeight / 2,
        z: config.baseDepth + frontFrameDepth - faceDepth / 2,
        material: materials.cabinet,
        radius: 0.035,
        note: 'Field-fit finished filler; minimum width shown on the drawing is 3/4 inch.',
        materialLabel: '1 inch finished paint-grade filler face',
      }),
      createBox({
        name: `${capitalize(side)} ${sideName} upper field filler`,
        category: 'Field filler / scribe',
        width: config.sideFiller,
        height: upperFillerHeight,
        depth: faceDepth,
        x: fillerX,
        y: upperStartY + upperFillerHeight / 2,
        z: config.upperDepth + frontFrameDepth - faceDepth / 2,
        material: materials.cabinet,
        radius: 0.035,
        note: 'Field-fit finished filler; minimum width shown on the drawing is 3/4 inch.',
        materialLabel: '1 inch finished paint-grade filler face',
      }),
      createBox({
        name: `${capitalize(side)} ${sideName} base filler backer`,
        category: 'Unfinished filler backer',
        width: config.sideFiller,
        height: config.baseHeight,
        depth: backerDepth,
        x: fillerX,
        y: config.baseHeight / 2,
        z: config.baseDepth + frontFrameDepth - faceDepth - backerDepth / 2,
        material: materials.interiorBack,
        materialLabel: 'Unfinished plywood backer',
      }),
      createBox({
        name: `${capitalize(side)} ${sideName} upper filler backer`,
        category: 'Unfinished filler backer',
        width: config.sideFiller,
        height: upperFillerHeight,
        depth: backerDepth,
        x: fillerX,
        y: upperStartY + upperFillerHeight / 2,
        z: config.upperDepth + frontFrameDepth - faceDepth - backerDepth / 2,
        material: materials.interiorBack,
        materialLabel: 'Unfinished plywood backer',
      }),
    ];
    addEdgeHighlight(fillerParts[0]);
    addEdgeHighlight(fillerParts[1]);
    group.add(...fillerParts);
  }

  const baseShelfPinMeshes = buildBaseCabinet({
    side,
    group: cabinetGroup,
    config,
    materials,
    width,
    caseWidth,
    bayWidth,
    adjustableShelfThickness,
    faceOpeningWidth,
    outerStileCenter,
    bayCenterOffset,
    faceBayCenterOffset,
    baseFrontZ,
    frontFrameDepth,
  });

  // Countertop / transition shelf between base and upper.
  const counter = createBox({
    name: `${capitalize(side)} bookcase countertop`,
    category: 'Countertop / fixed transition shelf',
    width,
    height: CONSTRUCTION.fixedTransitionShelfThickness,
    depth: config.baseDepth + 1.5,
    y: config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness / 2,
    z: (config.baseDepth + 1.5) / 2,
    material: materials.cabinetEdge,
    radius: 0.055,
    note: 'Single drawing-defined 1-1/4 inch transition shelf with a modest finished front projection.',
    materialLabel: 'Paint-grade MDF with finished edge',
  });
  addEdgeHighlight(counter, 0x6d665d, 0.2);
  group.add(counter);

  buildUpperBookcase({
    side,
    group: cabinetGroup,
    config,
    materials,
    width,
    caseWidth,
    bayWidth,
    adjustableShelfThickness,
    outerCaseSideCenter,
    outerStileCenter,
    bayCenterOffset,
    upperStartY,
    crownBaseY,
    clearUpperHeight,
    upperFrontZ,
    frontFrameDepth,
  });

  buildCrown({
    side,
    group,
    config,
    materials,
    width,
    upperFrontZ,
    crownBaseY,
  });

  const shelfPinMeshes = config.showPinHoles
    ? [
      ...baseShelfPinMeshes,
      ...buildPinHoles({
        side,
        group: cabinetGroup,
        config,
        materials,
        bayWidth,
        bayCenterOffset,
        upperStartY,
        crownBaseY,
      }),
    ]
    : [];

  if (config.showReferenceGhost) {
    const ghost = createBox({
      name: `${capitalize(side)} design envelope`,
      category: 'Reference envelope',
      width,
      height: config.bookcaseHeight,
      depth: finishedDepth,
      y: config.bookcaseHeight / 2,
      z: finishedDepth / 2,
      material: materials.ghost,
      castShadow: false,
      receiveShadow: false,
      pickable: false,
    });
    group.add(ghost);
  }

  return { group, shelfPinMeshes };
}

interface BaseBuildOptions {
  side: 'left' | 'right';
  group: THREE.Group;
  config: ModelConfig;
  materials: MaterialLibrary;
  width: number;
  caseWidth: number;
  bayWidth: number;
  adjustableShelfThickness: AdjustableShelfThickness;
  faceOpeningWidth: number;
  outerStileCenter: number;
  bayCenterOffset: number;
  faceBayCenterOffset: number;
  baseFrontZ: number;
  frontFrameDepth: number;
}

function buildBaseCabinet(options: BaseBuildOptions): THREE.InstancedMesh[] {
  const {
    side,
    group,
    config,
    materials,
    caseWidth,
    bayWidth,
    adjustableShelfThickness,
    faceOpeningWidth,
    outerStileCenter,
    bayCenterOffset,
    faceBayCenterOffset,
    baseFrontZ,
    frontFrameDepth,
  } = options;
  const label = capitalize(side);
  const baseCaseBottom = config.toeKickHeight;
  const baseCaseHeight = config.baseHeight - config.toeKickHeight;
  const caseCenterY = baseCaseBottom + baseCaseHeight / 2;
  const backDepth = CONSTRUCTION.finishedBackThickness;

  const back = createBox({
    name: `${label} base cabinet back`,
    category: 'Base cabinet carcass',
    width: caseWidth - 2 * CONSTRUCTION.carcassThickness,
    height: baseCaseHeight - CONSTRUCTION.carcassThickness,
    depth: backDepth,
    y: caseCenterY,
    z: backDepth / 2,
    material: materials.interiorBack,
    materialLabel: '1/4 inch finished plywood back',
  });
  group.add(back);

  for (const direction of [-1, 1] as const) {
    const sidePanel = createBox({
      name: `${label} base ${direction < 0 ? 'left' : 'right'} side panel`,
      category: 'Base cabinet carcass',
      width: CONSTRUCTION.carcassThickness,
      height: baseCaseHeight,
      depth: config.baseDepth,
      x: direction * (caseWidth / 2 - CONSTRUCTION.carcassThickness / 2),
      y: caseCenterY,
      z: config.baseDepth / 2,
      material: materials.cabinet,
      materialLabel: 'Paint-grade cabinet panel',
    });
    group.add(sidePanel);
  }

  group.add(
    createBox({
      name: `${label} base cabinet bottom`,
      category: 'Base cabinet carcass',
      width: caseWidth - 2 * CONSTRUCTION.carcassThickness,
      height: CONSTRUCTION.carcassThickness,
      depth: config.baseDepth - backDepth,
      y: baseCaseBottom + CONSTRUCTION.carcassThickness / 2,
      z: backDepth + (config.baseDepth - backDepth) / 2,
      material: materials.cabinet,
      materialLabel: 'Paint-grade cabinet panel',
    }),
    createBox({
      name: `${label} base cabinet top stretcher`,
      category: 'Base cabinet carcass',
      width: caseWidth - 2 * CONSTRUCTION.carcassThickness,
      height: CONSTRUCTION.carcassThickness,
      depth: 4,
      y: config.baseHeight - CONSTRUCTION.carcassThickness / 2,
      z: config.baseDepth - 2,
      material: materials.cabinet,
      materialLabel: 'Paint-grade cabinet panel',
    }),
    createBox({
      name: `${label} base cabinet center partition`,
      category: 'Base cabinet carcass',
      width: CONSTRUCTION.centerDividerWidth,
      height: baseCaseHeight - CONSTRUCTION.carcassThickness,
      depth: config.baseDepth - 0.4,
      y: caseCenterY,
      z: config.baseDepth / 2,
      material: materials.cabinet,
      materialLabel: 'Paint-grade cabinet panel',
    }),
  );

  // One adjustable interior shelf per lower bay, visible in the side elevation.
  const basePinOriginY = baseCaseBottom + 3;
  const desiredBaseShelfY = baseCaseBottom + baseCaseHeight * 0.53;
  const baseShelfSupportY = snapToShelfPinGrid(
    desiredBaseShelfY - adjustableShelfThickness / 2 - 0.12,
    basePinOriginY,
  );
  const baseShelfY = baseShelfSupportY + adjustableShelfThickness / 2 + 0.12;
  for (const direction of [-1, 1] as const) {
    const shelf = createBox({
      name: `${label} base ${direction < 0 ? 'left' : 'right'} adjustable shelf`,
      category: 'Base cabinet shelf',
      width: bayWidth,
      height: adjustableShelfThickness,
      depth: config.baseDepth - 1.35,
      x: direction * bayCenterOffset,
      y: baseShelfY,
      z: (config.baseDepth - 1.35) / 2 + 0.35,
      material: materials.cabinet,
      materialLabel: `${adjustableShelfThickness} inch MDF`,
    });
    group.add(shelf);
  }

  const supportGeometry = new THREE.CylinderGeometry(
    CONSTRUCTION.shelfPinDiameter / 2,
    CONSTRUCTION.shelfPinDiameter / 2,
    0.34,
    14,
  );
  supportGeometry.rotateZ(Math.PI / 2);
  const supports = new THREE.InstancedMesh(supportGeometry, materials.metal, 8);
  supports.name = `${label} base concealed shelf supports`;
  supports.castShadow = true;
  supports.receiveShadow = true;
  supports.userData.pickable = false;
  const supportMatrix = new THREE.Matrix4();
  let supportIndex = 0;
  for (const direction of [-1, 1] as const) {
    const bayCenter = direction * bayCenterOffset;
    for (const x of [bayCenter - bayWidth / 2 + 0.19, bayCenter + bayWidth / 2 - 0.19]) {
      for (const z of [2, config.baseDepth - 2.1]) {
        supportMatrix.makeTranslation(x, baseShelfSupportY, z);
        supports.setMatrixAt(supportIndex++, supportMatrix);
      }
    }
  }
  supports.instanceMatrix.needsUpdate = true;
  group.add(supports);

  // Recessed toe kick and individual adjustable cabinet feet.
  const toeKick = createBox({
    name: `${label} recessed toe kick`,
    category: 'Toe kick',
    width: caseWidth,
    height: config.toeKickHeight,
    depth: CONSTRUCTION.carcassThickness,
    y: config.toeKickHeight / 2,
    z: config.baseDepth - config.toeKickRecess - CONSTRUCTION.carcassThickness / 2,
    material: materials.cabinetShadow,
    materialLabel: 'Paint-grade toe kick',
    note: 'Nominal 4 inch toe kick; drawing notes this may vary or be flush/recessed.',
  });
  group.add(toeKick);

  const footX = caseWidth / 2 - 4.25;
  const footZFront = config.baseDepth - config.toeKickRecess - 2;
  const footZBack = 3;
  for (const x of [-footX, footX]) {
    for (const z of [footZBack, footZFront]) {
      const foot = createCylinderPart({
        name: `${label} adjustable cabinet foot`,
        category: 'Cabinet support',
        radius: 0.72,
        height: Math.max(1.1, config.toeKickHeight - 0.5),
        material: materials.metal,
        x,
        y: Math.max(1.1, config.toeKickHeight - 0.5) / 2,
        z,
        radialSegments: 20,
        materialLabel: 'Adjustable polymer / metal leg',
      });
      group.add(foot);
    }
  }

  // Face frame: 1-1/2 inch fixed rails and stiles per the drawing.
  const frameYBottom = config.toeKickHeight + CONSTRUCTION.faceFrameWidth / 2;
  const frameYTop = config.baseHeight - CONSTRUCTION.faceFrameWidth / 2;
  const frameHeight = config.baseHeight - config.toeKickHeight;
  const faceZ = baseFrontZ + frontFrameDepth / 2 - 0.02;
  group.add(
    createBox({
      name: `${label} base left face-frame stile`,
      category: 'Face frame',
      width: CONSTRUCTION.faceFrameWidth,
      height: frameHeight,
      depth: frontFrameDepth,
      x: -outerStileCenter,
      y: config.toeKickHeight + frameHeight / 2,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
    createBox({
      name: `${label} base right face-frame stile`,
      category: 'Face frame',
      width: CONSTRUCTION.faceFrameWidth,
      height: frameHeight,
      depth: frontFrameDepth,
      x: outerStileCenter,
      y: config.toeKickHeight + frameHeight / 2,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
    createBox({
      name: `${label} base center face-frame stile`,
      category: 'Face frame',
      width: CONSTRUCTION.faceFrameWidth,
      height: frameHeight,
      depth: frontFrameDepth,
      y: config.toeKickHeight + frameHeight / 2,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
    createBox({
      name: `${label} base top face-frame rail`,
      category: 'Face frame',
      width: caseWidth - 2 * CONSTRUCTION.faceFrameWidth,
      height: CONSTRUCTION.faceFrameWidth,
      depth: frontFrameDepth,
      y: frameYTop,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
    createBox({
      name: `${label} base bottom face-frame rail`,
      category: 'Face frame',
      width: caseWidth - 2 * CONSTRUCTION.faceFrameWidth,
      height: CONSTRUCTION.faceFrameWidth,
      depth: frontFrameDepth,
      y: frameYBottom,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
  );

  const reveal = 0.13;
  const doorOpeningHeight = frameHeight - CONSTRUCTION.faceFrameWidth * 2;
  const doorHeight = doorOpeningHeight - reveal * 2;
  const doorWidth = (faceOpeningWidth - reveal * 3) / 2;
  const doorY = config.toeKickHeight + CONSTRUCTION.faceFrameWidth + doorOpeningHeight / 2;
  const doorZ = baseFrontZ + frontFrameDepth + 0.18;
  const railWidth = Math.min(2.4, Math.max(1.8, doorWidth * 0.16));

  const doorPositions: Array<{ x: number; hinge: 'left' | 'right'; index: number }> = [];
  let doorIndex = 1;
  for (const bayDirection of [-1, 1] as const) {
    const bayCenter = bayDirection * faceBayCenterOffset;
    doorPositions.push(
      {
        x: bayCenter - doorWidth / 2 - reveal / 2,
        hinge: 'left',
        index: doorIndex++,
      },
      {
        x: bayCenter + doorWidth / 2 + reveal / 2,
        hinge: 'right',
        index: doorIndex++,
      },
    );
  }

  for (const doorPosition of doorPositions) {
    const door = createShakerDoor({
      name: `${label} base door ${doorPosition.index}`,
      width: doorWidth,
      height: doorHeight,
      depth: CONSTRUCTION.doorThickness,
      railWidth,
      x: doorPosition.x,
      y: doorY,
      z: doorZ,
      materials,
      hardware: config.showHardware,
      hingeSide: doorPosition.hinge,
    });
    group.add(door);
  }

  if (!config.showPinHoles) return [];
  const firstHoleY = baseCaseBottom + 3;
  const lastHoleY = config.baseHeight - 3;
  const levels = Math.max(
    1,
    Math.floor((lastHoleY - firstHoleY) / CONSTRUCTION.shelfPinSpacing) + 1,
  );
  const holeGeometry = new THREE.CylinderGeometry(
    CONSTRUCTION.shelfPinDiameter / 2,
    CONSTRUCTION.shelfPinDiameter / 2,
    0.065,
    14,
  );
  holeGeometry.rotateZ(Math.PI / 2);
  const holes = new THREE.InstancedMesh(holeGeometry, materials.hole, levels * 2 * 2 * 2);
  holes.name = `${label} base 5 mm shelf-pin holes`;
  holes.castShadow = false;
  holes.receiveShadow = false;
  holes.userData.pickable = false;
  holes.userData.part = {
    name: `${label} base 5 mm shelf-pin drilling`,
    category: 'Shelf-pin system',
    width: CONSTRUCTION.shelfPinDiameter,
    height: (levels - 1) * CONSTRUCTION.shelfPinSpacing,
    depth: 0.065,
    material: '5 mm drilled holes',
    note: 'Front and rear lower-cabinet rows on the drawing-defined 2-inch grid.',
  };
  const holeMatrix = new THREE.Matrix4();
  let holeIndex = 0;
  for (const direction of [-1, 1] as const) {
    const bayCenter = direction * bayCenterOffset;
    const surfaces = [bayCenter - bayWidth / 2 + 0.025, bayCenter + bayWidth / 2 - 0.025];
    for (const x of surfaces) {
      for (const z of [2.15, config.baseDepth - 2.2]) {
        for (let level = 0; level < levels; level += 1) {
          holeMatrix.makeTranslation(
            x,
            firstHoleY + level * CONSTRUCTION.shelfPinSpacing,
            z,
          );
          holes.setMatrixAt(holeIndex++, holeMatrix);
        }
      }
    }
  }
  holes.instanceMatrix.needsUpdate = true;
  group.add(holes);
  return [holes];
}

interface UpperBuildOptions {
  side: 'left' | 'right';
  group: THREE.Group;
  config: ModelConfig;
  materials: MaterialLibrary;
  width: number;
  caseWidth: number;
  bayWidth: number;
  adjustableShelfThickness: AdjustableShelfThickness;
  outerCaseSideCenter: number;
  outerStileCenter: number;
  bayCenterOffset: number;
  upperStartY: number;
  crownBaseY: number;
  clearUpperHeight: number;
  upperFrontZ: number;
  frontFrameDepth: number;
}

function buildUpperBookcase(options: UpperBuildOptions): void {
  const {
    side,
    group,
    config,
    materials,
    caseWidth,
    bayWidth,
    adjustableShelfThickness,
    outerCaseSideCenter,
    outerStileCenter,
    bayCenterOffset,
    upperStartY,
    crownBaseY,
    clearUpperHeight,
    upperFrontZ,
    frontFrameDepth,
  } = options;
  const label = capitalize(side);
  const upperCaseHeight = crownBaseY - upperStartY;
  const upperCenterY = upperStartY + upperCaseHeight / 2;
  const backDepth = CONSTRUCTION.finishedBackThickness;

  const back = createBox({
    name: `${label} upper finished back`,
    category: 'Upper bookcase back',
    width: caseWidth - 2 * CONSTRUCTION.carcassThickness,
    height: upperCaseHeight - CONSTRUCTION.faceFrameWidth,
    depth: backDepth,
    y: upperStartY + (upperCaseHeight - CONSTRUCTION.faceFrameWidth) / 2,
    z: backDepth / 2,
    material: materials.interiorBack,
    note: 'Finished back panel over field backer, coordinated with the top detail.',
    materialLabel: '1/4 inch finished plywood',
  });
  group.add(back);

  // Outer structural side panels behind the 1-1/2 inch face-frame stiles.
  for (const direction of [-1, 1] as const) {
    const sidePanel = createBox({
      name: `${label} upper ${direction < 0 ? 'left' : 'right'} side panel`,
      category: 'Upper bookcase carcass',
      width: CONSTRUCTION.carcassThickness,
      height: upperCaseHeight,
      depth: config.upperDepth,
      x: direction * outerCaseSideCenter,
      y: upperCenterY,
      z: config.upperDepth / 2,
      material: materials.cabinet,
      materialLabel: 'Paint-grade cabinet panel',
    });
    group.add(sidePanel);
  }

  const centerDivider = createBox({
    name: `${label} 1-1/2 inch fixed center divider`,
    category: 'Upper fixed partition',
    width: CONSTRUCTION.centerDividerWidth,
    height: upperCaseHeight,
    depth: config.upperDepth - 0.2,
    y: upperCenterY,
    z: (config.upperDepth - 0.2) / 2 + 0.08,
    material: materials.cabinet,
    note: 'Fixed center divider dimensioned at 1-1/2 inches on the reference elevation.',
    materialLabel: 'Paint-grade MDF',
  });
  group.add(centerDivider);

  // The countertop above is the single fixed lower/transition shelf shown in
  // the elevation. Only the separate fixed top remains inside the upper case.
  group.add(
    createBox({
      name: `${label} upper fixed top shelf`,
      category: 'Fixed shelf',
      width: caseWidth - 2 * CONSTRUCTION.carcassThickness,
      height: CONSTRUCTION.carcassThickness,
      depth: config.upperDepth,
      y: crownBaseY - CONSTRUCTION.carcassThickness / 2,
      z: config.upperDepth / 2,
      material: materials.cabinet,
      note: 'Fixed shelf supporting crown/filler zone.',
      materialLabel: '3/4 inch fixed cabinet panel',
    }),
  );

  // Front face frame stiles and top rail.
  const faceZ = upperFrontZ + frontFrameDepth / 2 - 0.02;
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${label} upper ${direction < 0 ? 'left' : 'right'} face-frame stile`,
        category: 'Face frame',
        width: CONSTRUCTION.faceFrameWidth,
        height: upperCaseHeight,
        depth: frontFrameDepth,
        x: direction * outerStileCenter,
        y: upperCenterY,
        z: faceZ,
        material: materials.cabinetEdge,
        materialLabel: '1-1/2 inch paint-grade face frame',
      }),
    );
  }
  group.add(
    createBox({
      name: `${label} upper center face-frame stile`,
      category: 'Face frame',
      width: CONSTRUCTION.faceFrameWidth,
      height: upperCaseHeight,
      depth: frontFrameDepth,
      y: upperCenterY,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
    createBox({
      name: `${label} upper top face-frame rail`,
      category: 'Face frame',
      width: caseWidth - 2 * CONSTRUCTION.faceFrameWidth,
      height: CONSTRUCTION.faceFrameWidth,
      depth: frontFrameDepth,
      y: crownBaseY - CONSTRUCTION.faceFrameWidth / 2,
      z: faceZ,
      material: materials.cabinetEdge,
      materialLabel: '1-1/2 inch paint-grade face frame',
    }),
  );

  // Adjustable shelves, each with a distinct finished front edge and four concealed support pins.
  const shelfDepth = config.upperDepth - 0.5;
  const shelfFrontZ = shelfDepth;
  const firstPinY = upperStartY + 3;
  const lastPinY = crownBaseY - 3;
  const availablePinLevels = Math.max(
    1,
    Math.floor((lastPinY - firstPinY) / CONSTRUCTION.shelfPinSpacing) + 1,
  );
  const shelfTotal = Math.min(config.shelfCount, availablePinLevels);
  const pinRadius = CONSTRUCTION.shelfPinDiameter / 2;
  const pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, 0.34, 14);
  pinGeometry.rotateZ(Math.PI / 2);
  const pins = new THREE.InstancedMesh(pinGeometry, materials.metal, shelfTotal * 2 * 4);
  pins.name = `${label} concealed shelf supports`;
  pins.castShadow = true;
  pins.receiveShadow = true;
  pins.userData.pickable = false;
  const matrix = new THREE.Matrix4();
  let pinIndex = 0;
  const openingTopY = crownBaseY - CONSTRUCTION.faceFrameWidth;
  const openingHeight = Math.max(1, openingTopY - upperStartY);

  for (let shelfIndex = 0; shelfIndex < shelfTotal; shelfIndex += 1) {
    // Divide the clear elevation into equal openings, then move each shelf to
    // the nearest drawing-defined two-inch pin level without allowing two
    // shelves to collapse onto the same support row.
    const idealShelfY = upperStartY + openingHeight * ((shelfIndex + 1) / (shelfTotal + 1));
    const preferredLevel = Math.round(
      (
        idealShelfY - adjustableShelfThickness / 2 - 0.12 - firstPinY
      ) / CONSTRUCTION.shelfPinSpacing,
    );
    const minimumLevel = shelfIndex;
    const maximumLevel = availablePinLevels - (shelfTotal - shelfIndex);
    const levelIndex = Math.max(minimumLevel, Math.min(maximumLevel, preferredLevel));
    const supportY = snapToShelfPinGrid(
      firstPinY + Math.max(0, levelIndex) * CONSTRUCTION.shelfPinSpacing,
      firstPinY,
    );
    const shelfY = supportY + adjustableShelfThickness / 2 + 0.12;
    for (const direction of [-1, 1] as const) {
      const bayCenter = direction * bayCenterOffset;
      const shelf = createBox({
        name: `${label} ${direction < 0 ? 'left' : 'right'} bay adjustable shelf ${shelfIndex + 1}`,
        category: 'Adjustable shelf',
        width: bayWidth,
        height: adjustableShelfThickness,
        depth: shelfDepth,
        x: bayCenter,
        y: shelfY,
        z: shelfDepth / 2 + 0.15,
        material: materials.cabinet,
        note: '5 mm pin-adjustable shelf; typical adjustment shown as two holes up / two holes down.',
        materialLabel: `${adjustableShelfThickness} inch MDF with finished front edge`,
      });
      group.add(shelf);

      const edgeBand = createBox({
        name: `${label} shelf ${shelfIndex + 1} finished front edge`,
        category: 'Shelf edge',
        width: bayWidth,
        height: adjustableShelfThickness,
        depth: 0.12,
        x: bayCenter,
        y: shelfY,
        z: shelfFrontZ + 0.15 - 0.06,
        material: materials.cabinetEdge,
        radius: 0.025,
        materialLabel: 'Finished MDF edge',
        pickable: false,
      });
      group.add(edgeBand);

      const xLeft = bayCenter - bayWidth / 2 + 0.19;
      const xRight = bayCenter + bayWidth / 2 - 0.19;
      const zRear = 2.0;
      const zFront = config.upperDepth - 2.1;
      for (const x of [xLeft, xRight]) {
        for (const z of [zRear, zFront]) {
          matrix.makeTranslation(x, supportY, z);
          pins.setMatrixAt(pinIndex++, matrix);
        }
      }
    }
  }
  pins.instanceMatrix.needsUpdate = true;
  group.add(pins);

  // Small shadow reveals at the face-frame / carcass joint add the same layered reading as the detail drawing.
  const revealWidth = 0.08;
  for (const direction of [-1, 1] as const) {
    group.add(
      createBox({
        name: `${label} upper ${direction < 0 ? 'left' : 'right'} frame reveal`,
        category: 'Shadow reveal',
        width: revealWidth,
        height: clearUpperHeight,
        depth: 0.04,
        x: direction * (outerStileCenter - CONSTRUCTION.faceFrameWidth / 2 - revealWidth / 2),
        y: upperStartY + CONSTRUCTION.faceFrameWidth + clearUpperHeight / 2,
        z: upperFrontZ + frontFrameDepth + 0.025,
        material: materials.cabinetShadow,
        castShadow: false,
        receiveShadow: false,
        pickable: false,
      }),
    );
  }
}

interface CrownBuildOptions {
  side: 'left' | 'right';
  group: THREE.Group;
  config: ModelConfig;
  materials: MaterialLibrary;
  width: number;
  upperFrontZ: number;
  crownBaseY: number;
}

function buildCrown(options: CrownBuildOptions): void {
  const { side, group, config, materials, width, upperFrontZ, crownBaseY } = options;
  const label = capitalize(side);
  const crown = createBox({
    name: `${label} bookcase crown moulding`,
    category: 'Crown / top filler',
    width,
    height: config.crownHeight,
    depth: config.crownProjection,
    y: crownBaseY + config.crownHeight / 2,
    z: upperFrontZ + config.crownProjection / 2,
    material: materials.cabinetEdge,
    radius: 0.025,
    note: 'Field-adjustable crown zone; drawing notes approximately 1-1/2 inches may be added or removed.',
    materialLabel: 'Paint-grade flat crown / top filler',
  });
  addEdgeHighlight(crown, 0x665f56, 0.16);
  group.add(crown);

  const fillerHeight = Math.max(0, config.roomHeight - config.bookcaseHeight);
  if (fillerHeight > 0.1) {
    group.add(
      createBox({
        name: `${label} top field filler`,
        category: 'Top filler',
        width,
        height: fillerHeight,
        depth: 0.75,
        y: config.bookcaseHeight + fillerHeight / 2,
        z: config.upperDepth - 0.375,
        material: materials.cabinet,
        note: 'Field-fit top filler to room ceiling.',
        materialLabel: 'Paint-grade filler',
      }),
    );
  }
}

interface PinHoleBuildOptions {
  side: 'left' | 'right';
  group: THREE.Group;
  config: ModelConfig;
  materials: MaterialLibrary;
  bayWidth: number;
  bayCenterOffset: number;
  upperStartY: number;
  crownBaseY: number;
}

function buildPinHoles(options: PinHoleBuildOptions): THREE.InstancedMesh[] {
  const {
    side,
    group,
    config,
    materials,
    bayWidth,
    bayCenterOffset,
    upperStartY,
    crownBaseY,
  } = options;
  const label = capitalize(side);
  const firstY = upperStartY + 3;
  const lastY = crownBaseY - 3;
  const spacing = CONSTRUCTION.shelfPinSpacing;
  const levels = Math.max(1, Math.floor((lastY - firstY) / spacing) + 1);
  const surfacesPerBay = 2;
  const rowsPerSurface = 2;
  const instanceCount = levels * 2 * surfacesPerBay * rowsPerSurface;
  const geometry = new THREE.CylinderGeometry(
    CONSTRUCTION.shelfPinDiameter / 2,
    CONSTRUCTION.shelfPinDiameter / 2,
    0.065,
    14,
  );
  geometry.rotateZ(Math.PI / 2);
  const holes = new THREE.InstancedMesh(geometry, materials.hole, instanceCount);
  holes.name = `${label} 5 mm shelf-pin holes`;
  holes.castShadow = false;
  holes.receiveShadow = false;
  holes.userData.pickable = false;
  holes.userData.part = {
    name: `${label} 5 mm shelf-pin drilling`,
    category: 'Shelf-pin system',
    width: CONSTRUCTION.shelfPinDiameter,
    height: (levels - 1) * spacing,
    depth: 0.065,
    material: '5 mm drilled holes',
    note: 'Two front/back vertical rows; 2-up / 2-down typical adjustment logic.',
  };

  const matrix = new THREE.Matrix4();
  let index = 0;
  for (const bayDirection of [-1, 1] as const) {
    const bayCenter = bayDirection * bayCenterOffset;
    const surfaces = [bayCenter - bayWidth / 2 + 0.025, bayCenter + bayWidth / 2 - 0.025];
    for (const x of surfaces) {
      for (const z of [2.15, config.upperDepth - 2.2]) {
        for (let level = 0; level < levels; level += 1) {
          const y = firstY + level * spacing;
          matrix.makeTranslation(x, y, z);
          holes.setMatrixAt(index++, matrix);
        }
      }
    }
  }
  holes.instanceMatrix.needsUpdate = true;
  group.add(holes);
  return [holes];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
