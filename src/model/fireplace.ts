import * as THREE from 'three';
import type { ModelConfig } from './config';
import type { MaterialLibrary } from './materials';
import {
  addEdgeHighlight,
  createBox,
  createCylinderPart,
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
  setPartMetadata(group, {
    name: 'Classical fireplace and electric firebox',
    category: 'Fireplace assembly',
    width: config.hearthWidth,
    height: config.mantelHeight,
    depth: config.hearthDepth,
    material: 'Paint-grade mantel, stone hearth, electric insert',
    note: 'Decorative mantel modeled from the reference elevation and placed on the room-layout chimney breast.',
  });

  const openingBottom = 5.25;
  const openingTop = openingBottom + config.fireplaceOpeningHeight;
  const fireboxDepth = Math.max(4, config.mantelDepth * 0.48);
  const mantelFaceZ = config.mantelDepth * 0.62;
  const shelfTopY = config.mantelHeight;

  const hearth = createBox({
    name: 'Fireplace hearth slab',
    category: 'Hearth',
    width: config.hearthWidth,
    height: 1.5,
    depth: config.hearthDepth,
    y: 0.75,
    z: config.hearthDepth / 2 - 1.5,
    material: materials.stone,
    radius: 0.12,
    note: 'Projected stone hearth centered on the electric firebox.',
    materialLabel: 'Honed stone',
  });
  addEdgeHighlight(hearth, 0x615a50, 0.18);
  group.add(hearth);

  const fireboxBack = createBox({
    name: 'Electric firebox body',
    category: 'Electric fireplace insert',
    width: config.fireplaceOpeningWidth + 5.5,
    height: config.fireplaceOpeningHeight + 5,
    depth: fireboxDepth,
    y: openingBottom + config.fireplaceOpeningHeight / 2,
    z: fireboxDepth / 2 + 0.4,
    material: materials.firebox,
    radius: 0.3,
    materialLabel: 'Black steel insert',
  });
  group.add(fireboxBack);

  const tileGroup = buildHerringboneTile(
    config.fireplaceOpeningWidth,
    config.fireplaceOpeningHeight,
    openingBottom,
    materials,
  );
  group.add(tileGroup);

  buildFireboxFrame(group, config, materials, openingBottom, fireboxDepth);
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
      depth: config.mantelDepth,
      y: config.mantelHeight / 2,
      z: config.mantelDepth / 2,
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
  fireboxDepth: number,
): void {
  const frameWidth = 1.25;
  const outerWidth = config.fireplaceOpeningWidth + frameWidth * 2;
  const outerHeight = config.fireplaceOpeningHeight + frameWidth * 2;
  const frameZ = fireboxDepth + 0.75;
  const frameDepth = 0.82;
  const centerY = openingBottom + config.fireplaceOpeningHeight / 2;

  group.add(
    createBox({
      name: 'Firebox left metal frame',
      category: 'Firebox trim',
      width: frameWidth,
      height: outerHeight,
      depth: frameDepth,
      x: -outerWidth / 2 + frameWidth / 2,
      y: centerY,
      z: frameZ,
      material: materials.metal,
      radius: 0.09,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox right metal frame',
      category: 'Firebox trim',
      width: frameWidth,
      height: outerHeight,
      depth: frameDepth,
      x: outerWidth / 2 - frameWidth / 2,
      y: centerY,
      z: frameZ,
      material: materials.metal,
      radius: 0.09,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox top metal frame',
      category: 'Firebox trim',
      width: config.fireplaceOpeningWidth,
      height: frameWidth,
      depth: frameDepth,
      y: openingBottom + config.fireplaceOpeningHeight + frameWidth / 2,
      z: frameZ,
      material: materials.metal,
      radius: 0.09,
      materialLabel: 'Dark steel trim',
    }),
    createBox({
      name: 'Firebox bottom metal frame',
      category: 'Firebox trim',
      width: config.fireplaceOpeningWidth,
      height: frameWidth,
      depth: frameDepth,
      y: openingBottom - frameWidth / 2,
      z: frameZ,
      material: materials.metal,
      radius: 0.09,
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
    z: frameZ + frameDepth / 2 + 0.09,
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
  const surroundGap = 2.25;
  const pilasterWidth = Math.max(6.5, (config.mantelWidth - config.fireplaceOpeningWidth) / 2 - 3.5);
  const pilasterCenterX = config.fireplaceOpeningWidth / 2 + surroundGap + pilasterWidth / 2;
  const pilasterBottom = 1.5;
  const friezeBottom = Math.max(openingTop + 3.4, config.mantelHeight - 13.2);
  const shaftBottom = 8.8;
  const shaftTop = friezeBottom - 2.1;
  const shaftHeight = Math.max(12, shaftTop - shaftBottom);
  const pilasterDepth = config.mantelDepth * 0.57;

  // Inner stone/tile surround trim.
  const innerTrim = 2.45;
  const trimDepth = 1.15;
  const trimZ = config.mantelDepth * 0.28;
  const centerY = openingBottom + config.fireplaceOpeningHeight / 2;
  group.add(
    createBox({
      name: 'Fireplace left inner surround',
      category: 'Mantel surround',
      width: innerTrim,
      height: config.fireplaceOpeningHeight + innerTrim * 2,
      depth: trimDepth,
      x: -config.fireplaceOpeningWidth / 2 - innerTrim / 2,
      y: centerY,
      z: trimZ,
      material: materials.stone,
      radius: 0.06,
      materialLabel: 'Honed stone surround',
    }),
    createBox({
      name: 'Fireplace right inner surround',
      category: 'Mantel surround',
      width: innerTrim,
      height: config.fireplaceOpeningHeight + innerTrim * 2,
      depth: trimDepth,
      x: config.fireplaceOpeningWidth / 2 + innerTrim / 2,
      y: centerY,
      z: trimZ,
      material: materials.stone,
      radius: 0.06,
      materialLabel: 'Honed stone surround',
    }),
    createBox({
      name: 'Fireplace top inner surround',
      category: 'Mantel surround',
      width: config.fireplaceOpeningWidth,
      height: innerTrim,
      depth: trimDepth,
      y: openingTop + innerTrim / 2,
      z: trimZ,
      material: materials.stone,
      radius: 0.06,
      materialLabel: 'Honed stone surround',
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

    // Five vertical flutes and leaf/bead details approximate the carved column shown in the reference.
    const fluteCount = 5;
    const fluteSpacing = pilasterWidth / (fluteCount + 1);
    for (let flute = 0; flute < fluteCount; flute += 1) {
      const fluteX = x - pilasterWidth / 2 + fluteSpacing * (flute + 1);
      const fluteMesh = createCylinderPart({
        name: `Mantel ${sideName} pilaster flute ${flute + 1}`,
        category: 'Mantel carved detail',
        radius: 0.22,
        height: shaftHeight - 3.0,
        material: materials.cabinetEdge,
        x: fluteX,
        y: shaftBottom + shaftHeight / 2,
        z: pilasterDepth + 0.12,
        radialSegments: 18,
        materialLabel: 'Paint-grade carved detail',
        pickable: false,
      });
      group.add(fluteMesh);
    }

    for (let bead = 0; bead < 7; bead += 1) {
      const beadY = shaftBottom + 1.2 + bead * ((shaftHeight - 2.4) / 6);
      const beadGeometry = new THREE.SphereGeometry(0.52, 18, 12);
      const beadMesh = new THREE.Mesh(beadGeometry, materials.cabinetEdge);
      beadMesh.name = `Mantel ${sideName} carved leaf bead ${bead + 1}`;
      beadMesh.position.set(x, beadY, pilasterDepth + 0.42);
      beadMesh.scale.set(0.82, 1.25, 0.52);
      beadMesh.castShadow = true;
      beadMesh.userData.pickable = false;
      group.add(beadMesh);
    }

    const rosette = createRosette({
      name: `Mantel ${sideName} capital rosette`,
      radius: 1.2,
      depth: 0.66,
      x,
      y: friezeBottom + 3.05,
      z: mantelFaceZ + 0.84,
      material: materials.cabinetEdge,
      petals: 12,
    });
    group.add(rosette);
  }

  const friezeHeight = shelfTopY - friezeBottom - 2.65;
  const friezeWidth = config.mantelWidth - 8.2;
  group.add(
    createBox({
      name: 'Mantel frieze field',
      category: 'Mantel frieze',
      width: friezeWidth,
      height: friezeHeight,
      depth: config.mantelDepth * 0.58,
      y: friezeBottom + friezeHeight / 2,
      z: config.mantelDepth * 0.29,
      material: materials.cabinet,
      radius: 0.06,
      materialLabel: 'Paint-grade carved mantel',
    }),
    createBox({
      name: 'Mantel frieze lower rail',
      category: 'Mantel frieze',
      width: friezeWidth + 1.1,
      height: 1.15,
      depth: config.mantelDepth * 0.69,
      y: friezeBottom + 0.575,
      z: config.mantelDepth * 0.345,
      material: materials.cabinetEdge,
      radius: 0.05,
      materialLabel: 'Paint-grade carved mantel',
    }),
  );

  // Dentil band beneath the shelf.
  const dentilY = shelfTopY - 4.0;
  const dentilCount = Math.max(8, Math.floor((config.mantelWidth - 10) / 3.1));
  const dentilSpan = config.mantelWidth - 10;
  const dentilSpacing = dentilSpan / dentilCount;
  for (let i = 0; i < dentilCount; i += 1) {
    group.add(
      createBox({
        name: `Mantel dentil ${i + 1}`,
        category: 'Mantel dentil band',
        width: 1.2,
        height: 1.0,
        depth: 1.2,
        x: -dentilSpan / 2 + dentilSpacing * (i + 0.5),
        y: dentilY,
        z: mantelFaceZ + 0.85,
        material: materials.cabinetEdge,
        radius: 0.035,
        materialLabel: 'Paint-grade carved detail',
        pickable: false,
      }),
    );
  }

  // Center sunburst and smaller bead ornaments across the frieze.
  const centerRosette = createRosette({
    name: 'Mantel center sunburst',
    radius: 1.42,
    depth: 0.72,
    x: 0,
    y: friezeBottom + friezeHeight * 0.53,
    z: mantelFaceZ + 0.88,
    material: materials.cabinetEdge,
    petals: 16,
  });
  group.add(centerRosette);

  for (const direction of [-1, 1] as const) {
    const beadStart = direction * 4.3;
    for (let i = 0; i < 6; i += 1) {
      const bead = createCylinderPart({
        name: `Mantel frieze bead ${direction < 0 ? 'left' : 'right'} ${i + 1}`,
        category: 'Mantel carved detail',
        radius: 0.4,
        height: 0.48,
        material: materials.cabinetEdge,
        x: beadStart + direction * i * 1.18,
        y: friezeBottom + friezeHeight * 0.52,
        z: mantelFaceZ + 0.82,
        rotationX: Math.PI / 2,
        radialSegments: 18,
        materialLabel: 'Paint-grade carved detail',
        pickable: false,
      });
      group.add(bead);
    }
  }

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
      width: config.mantelWidth + 1.2,
      height: 0.42,
      depth: config.mantelDepth + 1.2,
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
    z: 0.82,
    material: materials.stoneDark,
    materialLabel: 'Dark refractory backing',
  });
  group.add(backing);

  const brickLength = 4.4;
  const brickHeight = 1.08;
  const brickDepth = 0.23;
  const geometry = new THREE.BoxGeometry(brickLength, brickHeight, brickDepth);
  const transformsA: THREE.Matrix4[] = [];
  const transformsB: THREE.Matrix4[] = [];
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const margin = 1.0;
  const minX = -openingWidth / 2 + margin;
  const maxX = openingWidth / 2 - margin;
  const minY = openingBottom + margin;
  const maxY = openingBottom + openingHeight - margin;
  const stepX = 3.4;
  const stepY = 2.55;
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
      position.set(centerX, y, 1.08);
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
    depth: 3.25,
    y: openingBottom + 1.18,
    z: fireboxDepth - 0.8,
    material: materials.ember,
    radius: 0.42,
    materialLabel: 'LED ember bed',
    pickable: false,
  });
  group.add(emberBed);

  const logGeometry = new THREE.CylinderGeometry(0.72, 0.92, config.fireplaceOpeningWidth * 0.38, 12);
  logGeometry.rotateZ(Math.PI / 2);
  for (let i = 0; i < 4; i += 1) {
    const log = new THREE.Mesh(logGeometry, materials.log);
    log.name = `Ceramic log ${i + 1}`;
    log.position.set(
      (i - 1.5) * config.fireplaceOpeningWidth * 0.12,
      openingBottom + 2.2 + (i % 2) * 0.55,
      fireboxDepth + 0.3 + (i % 2) * 0.55,
    );
    log.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.18;
    log.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.12;
    log.castShadow = true;
    log.userData.pickable = false;
    group.add(log);
  }

  const flameMaterials: THREE.ShaderMaterial[] = [];
  const flameTongues: Array<{
    mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
    baseX: number;
    phase: number;
  }> = [];
  const flameGeometry = new THREE.PlaneGeometry(
    config.fireplaceOpeningWidth * 0.84,
    config.fireplaceOpeningHeight * 0.82,
    1,
    1,
  );
  for (let layer = 0; layer < 3; layer += 1) {
    const material = createFlameMaterial(layer);
    flameMaterials.push(material);
    const plane = new THREE.Mesh(flameGeometry, material);
    plane.name = `Procedural flame layer ${layer + 1}`;
    plane.position.set(
      (layer - 1) * 0.28,
      openingBottom + config.fireplaceOpeningHeight * (0.42 + layer * 0.015),
      fireboxDepth + 0.7 + layer * 0.12,
    );
    plane.scale.set(1 - layer * 0.08, 1 - layer * 0.04, 1);
    plane.renderOrder = 4 + layer;
    plane.userData.pickable = false;
    group.add(plane);
  }

  // Individual translucent tongues keep the electric flame readable even under bright room lighting.
  const tongueCount = 9;
  for (let index = 0; index < tongueCount; index += 1) {
    const phase = index * 1.37;
    const width = config.fireplaceOpeningWidth * (0.055 + (index % 3) * 0.009);
    const height = config.fireplaceOpeningHeight * (0.2 + ((index * 7) % 9) * 0.018);
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.bezierCurveTo(-width * 0.55, height * 0.3, -width * 0.2, height * 0.7, 0, height);
    shape.bezierCurveTo(width * 0.34, height * 0.65, width * 0.56, height * 0.28, width / 2, 0);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape, 18);
    const color = index % 3 === 0 ? 0xffe28a : index % 2 === 0 ? 0xffa21a : 0xff4c08;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: index % 3 === 0 ? 0.48 : 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    material.userData.disposeWithObject = true;
    const tongue = new THREE.Mesh(geometry, material);
    const baseX = ((index + 0.5) / tongueCount - 0.5) * config.fireplaceOpeningWidth * 0.72;
    tongue.name = `Electric flame tongue ${index + 1}`;
    tongue.position.set(baseX, openingBottom + 1.55, fireboxDepth + 1.48 + (index % 3) * 0.035);
    tongue.renderOrder = 9 + index;
    tongue.userData.pickable = false;
    flameTongues.push({ mesh: tongue, baseX, phase });
    group.add(tongue);
  }

  const light = new THREE.PointLight(0xff5c20, 110, 70, 1.75);
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
      flameTongues.forEach(({ mesh, baseX, phase }, index) => {
        mesh.position.x = baseX + Math.sin(timeSeconds * (1.8 + index * 0.025) + phase) * 0.2;
        mesh.scale.x = 0.94 + Math.sin(timeSeconds * 2.35 + phase) * 0.08;
        mesh.scale.y = 0.88 + Math.sin(timeSeconds * 3.1 + phase * 0.72) * 0.12;
      });
      light.intensity = 98 + Math.sin(timeSeconds * 7.3) * 9 + Math.sin(timeSeconds * 12.7) * 6;
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
        vec3 pale = vec3(1.0, 0.92, 0.52);
        vec3 color = mix(orange, amber, hot);
        color = mix(color, pale, pow(hot, 3.0) * (1.0 - y));
        gl_FragColor = vec4(color, alpha);
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
