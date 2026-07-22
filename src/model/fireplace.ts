import * as THREE from 'three';
import type { ModelConfig } from './config';
import type { MaterialLibrary } from './materials';
import {
  addEdgeHighlight,
  createBox,
  createLinearMoulding,
  createRosette,
  setPartMetadata,
} from './primitives';

export interface FireplaceBuildResult {
  group: THREE.Group;
  update: (timeSeconds: number) => void;
}

export function buildFireplace(
  config: ModelConfig,
  materials: MaterialLibrary,
): FireplaceBuildResult {
  const group = new THREE.Group();
  group.name = 'Classical fireplace and electric firebox';
  group.position.z = config.chimneyDepth;
  const finishedDepth = Math.max(config.hearthDepth, config.mantelDepth);
  setPartMetadata(group, {
    name: 'Classical fireplace and electric firebox',
    category: 'Fireplace assembly',
    width: config.hearthWidth,
    height: config.mantelHeight,
    depth: finishedDepth,
    material: 'Paint-grade mantel, stone hearth, electric insert',
    note: 'Decorative mantel modeled from the reference elevation and placed on the room-layout chimney breast.',
  });

  const openingBottom = 1;
  const openingTop = openingBottom + config.fireplaceOpeningHeight;
  const fireboxDepth = Math.max(1.2, config.mantelDepth * 0.12);
  const mantelFaceZ = config.mantelDepth * 0.62;
  const shelfTopY = config.mantelHeight;

  const hearth = createBox({
    name: 'Fireplace hearth slab',
    category: 'Hearth',
    width: config.hearthWidth,
    height: 0.75,
    depth: config.hearthDepth,
    y: 0.375,
    z: config.hearthDepth / 2,
    material: materials.stone,
    radius: 0.045,
    note: 'Low projecting study hearth; the references do not provide a fabrication depth.',
    materialLabel: 'Honed stone',
  });
  addEdgeHighlight(hearth, 0x615a50, 0.18);
  group.add(hearth);

  const fireboxBack = createBox({
    name: 'Recessed firebox backing',
    category: 'Electric fireplace insert',
    width: config.fireplaceOpeningWidth,
    height: config.fireplaceOpeningHeight,
    depth: 0.28,
    y: openingBottom + config.fireplaceOpeningHeight / 2,
    z: 0.14,
    material: materials.stoneDark,
    radius: 0.04,
    materialLabel: 'Dark recessed firebox backing',
  });
  group.add(fireboxBack);

  const tileGroup = buildHerringboneTile(
    config.fireplaceOpeningWidth,
    config.fireplaceOpeningHeight,
    openingBottom,
    materials,
  );
  group.add(tileGroup);

  buildFireboxFrame(group, config, materials, openingBottom);
  buildMantel(group, config, materials, openingBottom, openingTop, mantelFaceZ, shelfTopY);

  const fire = buildAnimatedFire(config, materials, openingBottom, fireboxDepth);
  fire.group.visible = config.showFire;
  group.add(fire.group);

  if (config.showReferenceGhost) {
    const envelope = createBox({
      name: 'Fireplace design envelope',
      category: 'Reference envelope',
      width: config.mantelWidth,
      height: config.mantelHeight,
      depth: finishedDepth,
      y: config.mantelHeight / 2,
      z: finishedDepth / 2,
      material: materials.ghost,
      castShadow: false,
      receiveShadow: false,
      pickable: false,
    });
    group.add(envelope);
  }

  return {
    group,
    update: (timeSeconds: number) => {
      fire.update(timeSeconds);
    },
  };
}

function buildFireboxFrame(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
  openingBottom: number,
): void {
  const frameWidth = 0.55;
  const frameZ = 0.92;
  const frameDepth = 0.26;
  const centerY = openingBottom + config.fireplaceOpeningHeight / 2;

  group.add(
    createBox({
      name: 'Firebox left metal frame',
      category: 'Firebox trim',
      width: frameWidth,
      height: config.fireplaceOpeningHeight,
      depth: frameDepth,
      x: -config.fireplaceOpeningWidth / 2 + frameWidth / 2,
      y: centerY,
      z: frameZ,
      material: materials.firebox,
      radius: 0.035,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox right metal frame',
      category: 'Firebox trim',
      width: frameWidth,
      height: config.fireplaceOpeningHeight,
      depth: frameDepth,
      x: config.fireplaceOpeningWidth / 2 - frameWidth / 2,
      y: centerY,
      z: frameZ,
      material: materials.firebox,
      radius: 0.035,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox top metal frame',
      category: 'Firebox trim',
      width: config.fireplaceOpeningWidth - frameWidth * 2,
      height: frameWidth,
      depth: frameDepth,
      y: openingBottom + config.fireplaceOpeningHeight - frameWidth / 2,
      z: frameZ,
      material: materials.firebox,
      radius: 0.035,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox bottom metal frame',
      category: 'Firebox trim',
      width: config.fireplaceOpeningWidth - frameWidth * 2,
      height: frameWidth,
      depth: frameDepth,
      y: openingBottom + frameWidth / 2,
      z: frameZ,
      material: materials.firebox,
      radius: 0.035,
      materialLabel: 'Dark steel trim',
    }),
  );

  const glass = createBox({
    name: 'Firebox glass front',
    category: 'Firebox glazing',
    width: config.fireplaceOpeningWidth - 0.55,
    height: config.fireplaceOpeningHeight - 0.55,
    depth: 0.12,
    y: centerY,
    z: frameZ + frameDepth / 2 + 0.05,
    material: materials.glass,
    castShadow: false,
    receiveShadow: false,
    materialLabel: 'Tempered fireplace glass',
  });
  group.add(glass);
}

function buildMantel(
  group: THREE.Group,
  config: ModelConfig,
  materials: MaterialLibrary,
  openingBottom: number,
  openingTop: number,
  mantelFaceZ: number,
  shelfTopY: number,
): void {
  const outerMargin = Math.max(1.25, config.mantelWidth * 0.035);
  const pilasterWidth = Math.min(7.5, Math.max(5.25, config.mantelWidth * 0.105));
  const sideFieldWidth = Math.max(
    0.3,
    (config.mantelWidth - config.fireplaceOpeningWidth) / 2 - pilasterWidth - outerMargin,
  );
  const pilasterCenterX = config.mantelWidth / 2 - outerMargin - pilasterWidth / 2;
  const pilasterBottom = 0.75;
  const friezeBottom = Math.max(openingTop + 6.5, config.mantelHeight - 11.5);
  const shaftBottom = 6.5;
  const shaftTop = friezeBottom - 2;
  const shaftHeight = Math.max(12, shaftTop - shaftBottom);
  const pilasterDepth = config.mantelDepth * 0.5;
  const friezeHeight = Math.max(3, shelfTopY - friezeBottom - 2.65);
  const friezeCenterY = friezeBottom + friezeHeight / 2;
  const friezeReliefHeight = Math.max(1.6, friezeHeight - 1.75);
  const sideRosetteRadius = Math.min(1.2, friezeReliefHeight * 0.38);

  // Broad painted surround field from the reference elevation. The thin black
  // electric-insert reveal sits behind this plane instead of covering it.
  const surroundDepth = Math.min(1, config.mantelDepth * 0.12);
  const surroundZ = 0.7;
  const legHeight = friezeBottom - openingBottom;
  const legCenterY = openingBottom + legHeight / 2;
  const headerHeight = Math.max(0.5, friezeBottom - openingTop);
  group.add(
    createBox({
      name: 'Fireplace left painted surround field',
      category: 'Painted mantel surround',
      width: sideFieldWidth,
      height: legHeight,
      depth: surroundDepth,
      x: -config.fireplaceOpeningWidth / 2 - sideFieldWidth / 2,
      y: legCenterY,
      z: surroundZ,
      material: materials.cabinet,
      radius: 0.025,
      materialLabel: 'Paint-grade mantel surround',
    }),
    createBox({
      name: 'Fireplace right painted surround field',
      category: 'Painted mantel surround',
      width: sideFieldWidth,
      height: legHeight,
      depth: surroundDepth,
      x: config.fireplaceOpeningWidth / 2 + sideFieldWidth / 2,
      y: legCenterY,
      z: surroundZ,
      material: materials.cabinet,
      radius: 0.025,
      materialLabel: 'Paint-grade mantel surround',
    }),
    createBox({
      name: 'Fireplace painted lintel field',
      category: 'Painted mantel surround',
      width: config.fireplaceOpeningWidth,
      height: headerHeight,
      depth: surroundDepth,
      y: openingTop + headerHeight / 2,
      z: surroundZ,
      material: materials.cabinet,
      radius: 0.025,
      materialLabel: 'Paint-grade mantel surround',
    }),
  );

  for (const direction of [-1, 1] as const) {
    const x = direction * pilasterCenterX;
    const sideName = direction < 0 ? 'left' : 'right';

    group.add(
      createBox({
        name: `Mantel ${sideName} plinth base`,
        category: 'Mantel pilaster',
        width: pilasterWidth + 1.55,
        height: 2.7,
        depth: pilasterDepth + 1.5,
        x,
        y: pilasterBottom + 1.35,
        z: (pilasterDepth + 1.5) / 2,
        material: materials.cabinetEdge,
        radius: 0.08,
        materialLabel: 'Paint-grade carved mantel',
      }),
      createBox({
        name: `Mantel ${sideName} lower plinth`,
        category: 'Mantel pilaster',
        width: pilasterWidth + 0.8,
        height: 3.7,
        depth: pilasterDepth + 0.75,
        x,
        y: pilasterBottom + 2.7 + 1.85,
        z: (pilasterDepth + 0.75) / 2,
        material: materials.cabinet,
        radius: 0.06,
        materialLabel: 'Paint-grade carved mantel',
      }),
      createBox({
        name: `Mantel ${sideName} pilaster shaft`,
        category: 'Mantel pilaster',
        width: pilasterWidth,
        height: shaftHeight,
        depth: pilasterDepth,
        x,
        y: shaftBottom + shaftHeight / 2,
        z: pilasterDepth / 2,
        material: materials.cabinet,
        radius: 0.07,
        materialLabel: 'Paint-grade carved mantel',
      }),
      createBox({
        name: `Mantel ${sideName} capital lower block`,
        category: 'Mantel pilaster capital',
        width: pilasterWidth + 0.8,
        height: 1.35,
        depth: pilasterDepth + 0.75,
        x,
        y: shaftTop + 0.675,
        z: (pilasterDepth + 0.75) / 2,
        material: materials.cabinetEdge,
        radius: 0.05,
        materialLabel: 'Paint-grade carved mantel',
      }),
      createBox({
        name: `Mantel ${sideName} capital upper block`,
        category: 'Mantel pilaster capital',
        width: pilasterWidth + 1.45,
        height: 1.35,
        depth: pilasterDepth + 1.25,
        x,
        y: shaftTop + 1.75,
        z: (pilasterDepth + 1.25) / 2,
        material: materials.cabinetEdge,
        radius: 0.05,
        materialLabel: 'Paint-grade carved mantel',
      }),
    );

    const panelHeight = Math.max(6, shaftHeight - 2.2);
    const pilasterPanel = createBox({
      name: `Mantel ${sideName} framed relief panel`,
      category: 'Mantel carved detail',
      width: Math.max(2.2, pilasterWidth - 1.35),
      height: panelHeight,
      depth: 0.22,
      x,
      y: shaftBottom + shaftHeight / 2,
      z: pilasterDepth + 0.08,
      material: materials.cabinetShadow,
      radius: 0.035,
      materialLabel: 'Paint-grade recessed relief panel',
      pickable: false,
    });
    addEdgeHighlight(pilasterPanel, 0x625c54, 0.38);
    group.add(pilasterPanel);

    const motifCount = Math.min(10, Math.max(6, Math.floor(panelHeight / 2.2)));
    for (let motifIndex = 0; motifIndex < motifCount; motifIndex += 1) {
      const motifGeometry = new THREE.TorusGeometry(0.4, 0.105, 8, 20);
      const motif = new THREE.Mesh(motifGeometry, materials.cabinetEdge);
      motif.name = `Mantel ${sideName} oval relief ${motifIndex + 1}`;
      motif.position.set(
        x,
        shaftBottom + 1.25 + motifIndex * ((shaftHeight - 2.5) / Math.max(1, motifCount - 1)),
        pilasterDepth + 0.25,
      );
      motif.scale.y = 1.28;
      motif.castShadow = true;
      motif.userData.pickable = false;
      group.add(motif);
    }

    const rosette = createRosette({
      name: `Mantel ${sideName} capital rosette`,
      radius: sideRosetteRadius,
      depth: 0.66,
      x,
      y: friezeCenterY,
      z: mantelFaceZ + 0.08,
      material: materials.cabinetEdge,
      petals: 12,
    });
    group.add(rosette);
  }

  const friezeWidth = config.mantelWidth - outerMargin * 2;
  const friezeDepth = config.mantelDepth * 0.58;
  group.add(
    createBox({
      name: 'Mantel frieze field',
      category: 'Mantel frieze',
      width: friezeWidth,
      height: friezeHeight,
      depth: friezeDepth,
      y: friezeCenterY,
      z: friezeDepth / 2,
      material: materials.cabinet,
      radius: 0.06,
      materialLabel: 'Paint-grade carved mantel',
    }),
    createBox({
      name: 'Mantel frieze lower rail',
      category: 'Mantel frieze',
      width: friezeWidth,
      height: 1.15,
      depth: config.mantelDepth * 0.69,
      y: friezeBottom + 0.575,
      z: config.mantelDepth * 0.345,
      material: materials.cabinetEdge,
      radius: 0.05,
      materialLabel: 'Paint-grade carved mantel',
    }),
  );

  const panelHeight = friezeReliefHeight;
  const centerPanelWidth = Math.max(7, friezeWidth * 0.18);
  const rosetteZoneWidth = pilasterWidth + 0.6;
  const sidePanelWidth = Math.max(
    4,
    (friezeWidth - centerPanelWidth - rosetteZoneWidth * 2) / 2,
  );
  const reliefZ = friezeDepth + 0.13;
  for (const direction of [-1, 1] as const) {
    const panelX = direction * (centerPanelWidth / 2 + sidePanelWidth / 2);
    const medallionPanel = createBox({
      name: `Mantel ${direction < 0 ? 'left' : 'right'} six-medallion frieze panel`,
      category: 'Mantel carved detail',
      width: sidePanelWidth,
      height: panelHeight,
      depth: 0.22,
      x: panelX,
      y: friezeCenterY,
      z: reliefZ,
      material: materials.cabinetShadow,
      radius: 0.03,
      materialLabel: 'Paint-grade recessed relief panel',
      pickable: false,
    });
    addEdgeHighlight(medallionPanel, 0x625c54, 0.38);
    group.add(medallionPanel);
    for (let medallionIndex = 0; medallionIndex < 6; medallionIndex += 1) {
      const medallionGeometry = new THREE.TorusGeometry(0.37, 0.1, 8, 18);
      const medallion = new THREE.Mesh(medallionGeometry, materials.cabinetEdge);
      medallion.name = `Mantel ${direction < 0 ? 'left' : 'right'} frieze medallion ${medallionIndex + 1}`;
      medallion.position.set(
        panelX - sidePanelWidth / 2 + sidePanelWidth * ((medallionIndex + 0.5) / 6),
        friezeCenterY,
        reliefZ + 0.23,
      );
      medallion.castShadow = true;
      medallion.userData.pickable = false;
      group.add(medallion);
    }
  }

  const centerPanel = createBox({
    name: 'Mantel framed center wave panel',
    category: 'Mantel carved detail',
    width: centerPanelWidth,
    height: panelHeight,
    depth: 0.22,
    y: friezeCenterY,
    z: reliefZ,
    material: materials.cabinetShadow,
    radius: 0.03,
    materialLabel: 'Paint-grade recessed relief panel',
    pickable: false,
  });
  addEdgeHighlight(centerPanel, 0x625c54, 0.38);
  group.add(centerPanel);
  for (let ribIndex = 0; ribIndex < 9; ribIndex += 1) {
    const baseX = -centerPanelWidth / 2 + centerPanelWidth * ((ribIndex + 1) / 10);
    const ribHeight = Math.max(0.8, panelHeight - 0.55);
    const points: THREE.Vector3[] = [];
    for (let pointIndex = 0; pointIndex <= 12; pointIndex += 1) {
      const progress = pointIndex / 12;
      points.push(
        new THREE.Vector3(
          baseX + Math.sin(progress * Math.PI * 2.4 + ribIndex * 0.42) * 0.14,
          friezeCenterY - ribHeight / 2 + progress * ribHeight,
          reliefZ + 0.3,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const rib = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 22, 0.075, 6, false),
      materials.cabinetEdge,
    );
    rib.name = `Mantel center wave rib ${ribIndex + 1}`;
    rib.castShadow = true;
    rib.userData.pickable = false;
    group.add(rib);
  }

  const centerRosette = createRosette({
    name: 'Mantel center sunburst',
    radius: Math.min(1.42, panelHeight * 0.4),
    depth: 0.72,
    x: 0,
    y: friezeCenterY,
    z: reliefZ + 0.34,
    material: materials.cabinetEdge,
    petals: 16,
  });
  group.add(centerRosette);

  // Layered mantel shelf and ogee below it.
  const moulding = createLinearMoulding({
    name: 'Mantel ogee moulding',
    length: config.mantelWidth - 1.2,
    height: 2.35,
    projection: 2.25,
    y: shelfTopY - 3.2,
    z: config.mantelDepth * 0.58 + 2.25,
    material: materials.cabinetEdge,
    profile: 'mantel',
    category: 'Mantel crown moulding',
  });
  group.add(moulding);

  const shelf = createBox({
    name: 'Mantel shelf',
    category: 'Mantel shelf',
    width: config.mantelWidth,
    height: 1.6,
    depth: config.mantelDepth,
    y: shelfTopY - 0.8,
    z: config.mantelDepth / 2,
    material: materials.cabinetEdge,
    radius: 0.09,
    materialLabel: 'Paint-grade mantel shelf',
  });
  addEdgeHighlight(shelf, 0x645e56, 0.2);
  group.add(shelf);

  group.add(
    createBox({
      name: 'Mantel shelf top cap',
      category: 'Mantel shelf',
      width: config.mantelWidth,
      height: 0.42,
      depth: config.mantelDepth,
      y: shelfTopY - 0.21,
      z: config.mantelDepth / 2,
      material: materials.cabinetEdge,
      radius: 0.06,
      materialLabel: 'Paint-grade mantel shelf',
    }),
  );
}

function buildHerringboneTile(
  openingWidth: number,
  openingHeight: number,
  openingBottom: number,
  materials: MaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Herringbone fireplace interior';
  setPartMetadata(group, {
    name: 'Herringbone fireplace interior',
    category: 'Fireplace interior finish',
    width: openingWidth,
    height: openingHeight,
    depth: 0.3,
    material: 'Herringbone tile / brick',
  });

  const backing = createBox({
    name: 'Herringbone tile backing',
    category: 'Fireplace interior finish',
    width: openingWidth - 0.45,
    height: openingHeight - 0.45,
    depth: 0.32,
    y: openingBottom + openingHeight / 2,
    z: 0.34,
    material: materials.tile,
    materialLabel: 'Light herringbone field',
  });
  group.add(backing);

  const brickLength = 2.2;
  const brickHeight = 0.54;
  const brickDepth = 0.12;
  const geometry = new THREE.BoxGeometry(brickLength, brickHeight, brickDepth);
  const transformsA: THREE.Matrix4[] = [];
  const transformsB: THREE.Matrix4[] = [];
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const margin = 0.55;
  const minX = -openingWidth / 2 + margin;
  const maxX = openingWidth / 2 - margin;
  const minY = openingBottom + margin;
  const maxY = openingBottom + openingHeight - margin;
  const stepX = 1.7;
  const stepY = 1.275;
  let row = 0;
  for (let y = minY; y <= maxY; y += stepY) {
    let column = 0;
    const offset = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = minX - stepX; x <= maxX + stepX; x += stepX) {
      const centerX = x + offset;
      if (centerX < minX - 0.2 || centerX > maxX + 0.2) {
        column += 1;
        continue;
      }
      const angle = (row + column) % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
      position.set(centerX, y, 0.58);
      const matrix = new THREE.Matrix4().compose(position, quaternion, scale);
      ((row + column) % 3 === 0 ? transformsB : transformsA).push(matrix);
      column += 1;
    }
    row += 1;
  }

  const meshA = new THREE.InstancedMesh(geometry, materials.tile, transformsA.length);
  meshA.name = 'Herringbone light bricks';
  transformsA.forEach((matrix, index) => meshA.setMatrixAt(index, matrix));
  meshA.castShadow = true;
  meshA.receiveShadow = true;
  meshA.userData.pickable = false;
  meshA.instanceMatrix.needsUpdate = true;
  group.add(meshA);

  const meshB = new THREE.InstancedMesh(geometry, materials.tileAlternate, transformsB.length);
  meshB.name = 'Herringbone alternate bricks';
  transformsB.forEach((matrix, index) => meshB.setMatrixAt(index, matrix));
  meshB.castShadow = true;
  meshB.receiveShadow = true;
  meshB.userData.pickable = false;
  meshB.instanceMatrix.needsUpdate = true;
  group.add(meshB);

  return group;
}

function buildAnimatedFire(
  config: ModelConfig,
  materials: MaterialLibrary,
  openingBottom: number,
  fireboxDepth: number,
): { group: THREE.Group; update: (timeSeconds: number) => void } {
  const group = new THREE.Group();
  group.name = 'Animated electric flame effect';
  group.userData.pickable = false;

  const emberBed = createBox({
    name: 'Glowing ember bed',
    category: 'Electric flame effect',
    width: config.fireplaceOpeningWidth * 0.78,
    height: 1.05,
    depth: 1.1,
    y: openingBottom + 1.18,
    z: 0.72,
    material: materials.ember,
    radius: 0.42,
    materialLabel: 'LED ember bed',
    pickable: false,
  });
  group.add(emberBed);

  const logGeometry = new THREE.CylinderGeometry(0.38, 0.5, config.fireplaceOpeningWidth * 0.28, 12);
  logGeometry.rotateZ(Math.PI / 2);
  for (let i = 0; i < 4; i += 1) {
    const log = new THREE.Mesh(logGeometry, materials.log);
    log.name = `Ceramic log ${i + 1}`;
    log.position.set(
      (i - 1.5) * config.fireplaceOpeningWidth * 0.12,
      openingBottom + 1.35 + (i % 2) * 0.36,
      0.58 + (i % 2) * 0.05,
    );
    log.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.18;
    log.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.12;
    log.castShadow = true;
    log.userData.pickable = false;
    group.add(log);
  }

  const flameMaterials: THREE.ShaderMaterial[] = [];
  const flameGeometry = new THREE.PlaneGeometry(
    config.fireplaceOpeningWidth * 0.64,
    config.fireplaceOpeningHeight * 0.52,
    1,
    1,
  );
  for (let layer = 0; layer < 2; layer += 1) {
    const material = createFlameMaterial(layer);
    flameMaterials.push(material);
    const plane = new THREE.Mesh(flameGeometry, material);
    plane.name = `Procedural flame layer ${layer + 1}`;
    plane.position.set(
      (layer - 1) * 0.28,
      openingBottom + config.fireplaceOpeningHeight * (0.29 + layer * 0.012),
      0.84 + layer * 0.025,
    );
    plane.scale.set(1 - layer * 0.08, 1 - layer * 0.04, 1);
    plane.renderOrder = 4 + layer;
    plane.userData.pickable = false;
    group.add(plane);
  }

  const light = new THREE.PointLight(0xff5c20, 62, 70, 1.75);
  light.name = 'Fireplace flicker light';
  light.position.set(0, openingBottom + config.fireplaceOpeningHeight * 0.46, fireboxDepth + 5);
  light.castShadow = false;
  group.add(light);

  return {
    group,
    update: (timeSeconds: number) => {
      flameMaterials.forEach((material, index) => {
        material.uniforms.uTime.value = timeSeconds * (0.9 + index * 0.12);
      });
      light.intensity = 56 + Math.sin(timeSeconds * 7.3) * 6 + Math.sin(timeSeconds * 12.7) * 4;
      emberBed.scale.x = 1 + Math.sin(timeSeconds * 4.2) * 0.008;
    },
  };
}

function createFlameMaterial(layer: number): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLayer: { value: layer },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uLayer;
      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.52;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p = p * 2.02 + vec2(7.1, 3.7);
          amplitude *= 0.48;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv;
        float y = uv.y;
        float sway = sin(uTime * 2.2 + y * 8.0 + uLayer) * (0.035 + y * 0.06);
        vec2 p = vec2((uv.x - 0.5 + sway) * 3.1, y * 3.6 - uTime * 1.35);
        float n = fbm(p + vec2(0.0, uLayer * 1.7));
        float width = mix(0.44, 0.07, pow(y, 0.82));
        float core = 1.0 - smoothstep(width * 0.62, width, abs(uv.x - 0.5 + sway * 0.7));
        float tongues = smoothstep(0.2 + y * 0.34, 0.77, n + core * 0.76);
        float base = smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.68, 0.98, y));
        float glow = core * (1.0 - y) * 0.16;
        float alpha = max(tongues * core * base * (0.92 - uLayer * 0.13), glow * base);
        float hot = smoothstep(0.46, 0.96, tongues + (1.0 - y) * 0.38);
        vec3 orange = vec3(1.0, 0.18, 0.015);
        vec3 amber = vec3(1.0, 0.56, 0.05);
        vec3 pale = vec3(1.0, 0.46, 0.08);
        vec3 color = mix(orange, amber, hot);
        color = mix(color, pale, pow(hot, 3.0) * (1.0 - y));
        gl_FragColor = vec4(color * 0.76, alpha * 0.2);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.userData.disposeWithObject = true;
  return material;
}
