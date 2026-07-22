import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLibrary } from './materials';

export interface PartMetadata {
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  material?: string;
  note?: string;
}

export interface BoxOptions {
  name: string;
  category?: string;
  width: number;
  height: number;
  depth: number;
  x?: number;
  y?: number;
  z?: number;
  material: THREE.Material;
  radius?: number;
  bevelSegments?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  note?: string;
  materialLabel?: string;
  pickable?: boolean;
}

export function createBox(options: BoxOptions): THREE.Mesh {
  const {
    name,
    category = 'Millwork',
    width,
    height,
    depth,
    x = 0,
    y = 0,
    z = 0,
    material,
    radius = 0,
    bevelSegments = 2,
    castShadow = true,
    receiveShadow = true,
    note,
    materialLabel,
    pickable = true,
  } = options;

  const geometry = radius > 0
    ? new RoundedBoxGeometry(width, height, depth, bevelSegments, Math.min(radius, width / 4, height / 4, depth / 4))
    : new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  setPartMetadata(mesh, {
    name,
    category,
    width,
    height,
    depth,
    material: materialLabel,
    note,
  }, pickable);
  return mesh;
}

export function setPartMetadata(
  object: THREE.Object3D,
  metadata: PartMetadata,
  pickable = true,
): void {
  object.userData.part = metadata;
  object.userData.pickable = pickable;
}

export interface ShakerDoorOptions {
  name: string;
  width: number;
  height: number;
  depth: number;
  railWidth: number;
  x: number;
  y: number;
  z: number;
  materials: MaterialLibrary;
  hardware?: boolean;
  hingeSide: 'left' | 'right';
}

export function createShakerDoor(options: ShakerDoorOptions): THREE.Group {
  const {
    name,
    width,
    height,
    depth,
    railWidth,
    x,
    y,
    z,
    materials,
    hardware = true,
    hingeSide,
  } = options;
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  setPartMetadata(group, {
    name,
    category: 'Base cabinet door',
    width,
    height,
    depth,
    material: 'Paint-grade MDF',
    note: 'Inset Shaker door with recessed center panel.',
  });

  const innerWidth = Math.max(1, width - railWidth * 2);
  const innerHeight = Math.max(1, height - railWidth * 2);
  const frameDepth = depth;
  const panelDepth = Math.max(0.2, depth * 0.42);
  const panelZ = -depth / 2 + panelDepth / 2 + 0.04;

  group.add(
    createBox({
      name: `${name} left stile`,
      category: 'Door frame',
      width: railWidth,
      height,
      depth: frameDepth,
      x: -width / 2 + railWidth / 2,
      material: materials.cabinet,
      radius: 0.08,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} right stile`,
      category: 'Door frame',
      width: railWidth,
      height,
      depth: frameDepth,
      x: width / 2 - railWidth / 2,
      material: materials.cabinet,
      radius: 0.08,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} top rail`,
      category: 'Door frame',
      width: innerWidth,
      height: railWidth,
      depth: frameDepth,
      y: height / 2 - railWidth / 2,
      material: materials.cabinet,
      radius: 0.08,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} bottom rail`,
      category: 'Door frame',
      width: innerWidth,
      height: railWidth,
      depth: frameDepth,
      y: -height / 2 + railWidth / 2,
      material: materials.cabinet,
      radius: 0.08,
      materialLabel: 'Paint-grade MDF',
    }),
  );

  const panel = createBox({
    name: `${name} recessed panel`,
    category: 'Door panel',
    width: innerWidth - 0.16,
    height: innerHeight - 0.16,
    depth: panelDepth,
    z: panelZ,
    material: materials.cabinetShadow,
    radius: 0.06,
    materialLabel: 'Paint-grade MDF',
  });
  group.add(panel);

  const bevelDepth = Math.min(0.18, depth * 0.25);
  const bevelWidth = 0.18;
  const bevelMaterial = materials.cabinetEdge;
  group.add(
    createBox({
      name: `${name} inner bevel top`,
      category: 'Door profile',
      width: innerWidth,
      height: bevelWidth,
      depth: bevelDepth,
      y: innerHeight / 2 + bevelWidth / 2,
      z: depth / 2 - bevelDepth / 2 - 0.015,
      material: bevelMaterial,
      radius: 0.04,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} inner bevel bottom`,
      category: 'Door profile',
      width: innerWidth,
      height: bevelWidth,
      depth: bevelDepth,
      y: -innerHeight / 2 - bevelWidth / 2,
      z: depth / 2 - bevelDepth / 2 - 0.015,
      material: bevelMaterial,
      radius: 0.04,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} inner bevel left`,
      category: 'Door profile',
      width: bevelWidth,
      height: innerHeight,
      depth: bevelDepth,
      x: -innerWidth / 2 - bevelWidth / 2,
      z: depth / 2 - bevelDepth / 2 - 0.015,
      material: bevelMaterial,
      radius: 0.04,
      materialLabel: 'Paint-grade MDF',
    }),
    createBox({
      name: `${name} inner bevel right`,
      category: 'Door profile',
      width: bevelWidth,
      height: innerHeight,
      depth: bevelDepth,
      x: innerWidth / 2 + bevelWidth / 2,
      z: depth / 2 - bevelDepth / 2 - 0.015,
      material: bevelMaterial,
      radius: 0.04,
      materialLabel: 'Paint-grade MDF',
    }),
  );

  if (hardware) {
    const knobGeometry = new THREE.SphereGeometry(0.33, 18, 12);
    const knob = new THREE.Mesh(knobGeometry, materials.brass);
    knob.name = `${name} knob`;
    knob.position.set(
      hingeSide === 'left' ? width / 2 - 1.3 : -width / 2 + 1.3,
      0,
      depth / 2 + 0.33,
    );
    knob.castShadow = true;
    setPartMetadata(knob, {
      name: `${name} knob`,
      category: 'Hardware',
      width: 0.66,
      height: 0.66,
      depth: 0.66,
      material: 'Aged brass',
    });
    group.add(knob);
  }

  // A Shaker door is inspected as one manufactured assembly; only its optional knob remains separate.
  for (const child of group.children) {
    const metadata = child.userData.part as PartMetadata | undefined;
    if (metadata?.category !== 'Hardware') child.userData.pickable = false;
  }

  return group;
}

export interface MouldingOptions {
  name: string;
  length: number;
  height: number;
  projection: number;
  x?: number;
  y?: number;
  z?: number;
  material: THREE.Material;
  profile?: 'crown' | 'ogee' | 'simple' | 'mantel';
  category?: string;
  note?: string;
}

export function createLinearMoulding(options: MouldingOptions): THREE.Mesh {
  const {
    name,
    length,
    height,
    projection,
    x = 0,
    y = 0,
    z = 0,
    material,
    profile = 'crown',
    category = 'Moulding',
    note,
  } = options;
  const shape = new THREE.Shape();
  const points = getMouldingProfile(height, projection, profile);
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: Math.min(0.055, height * 0.03),
    bevelSize: Math.min(0.055, height * 0.03),
    bevelSegments: 2,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-length / 2, 0, 0);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  setPartMetadata(mesh, {
    name,
    category,
    width: length,
    height,
    depth: projection,
    material: 'Paint-grade moulding',
    note,
  });
  return mesh;
}

function getMouldingProfile(
  height: number,
  projection: number,
  profile: MouldingOptions['profile'],
): Array<[number, number]> {
  if (profile === 'simple') {
    return [
      [0, 0],
      [projection * 0.76, 0],
      [projection, height * 0.38],
      [projection * 0.84, height * 0.75],
      [projection * 0.58, height],
      [0, height],
    ];
  }
  if (profile === 'mantel') {
    return [
      [0, 0],
      [projection * 0.55, 0],
      [projection * 0.72, height * 0.16],
      [projection * 0.68, height * 0.34],
      [projection * 0.92, height * 0.55],
      [projection, height * 0.76],
      [projection * 0.82, height],
      [0, height],
    ];
  }
  if (profile === 'ogee') {
    return [
      [0, 0],
      [projection * 0.62, 0],
      [projection * 0.78, height * 0.12],
      [projection * 0.72, height * 0.34],
      [projection * 0.9, height * 0.54],
      [projection, height * 0.72],
      [projection * 0.75, height],
      [0, height],
    ];
  }
  return [
    [0, 0],
    [projection * 0.42, 0],
    [projection * 0.66, height * 0.14],
    [projection * 0.6, height * 0.34],
    [projection * 0.9, height * 0.58],
    [projection, height * 0.78],
    [projection * 0.82, height],
    [0, height],
  ];
}

export function createCylinderPart(options: {
  name: string;
  category?: string;
  radius: number;
  height: number;
  radialSegments?: number;
  material: THREE.Material;
  x?: number;
  y?: number;
  z?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  note?: string;
  materialLabel?: string;
  pickable?: boolean;
}): THREE.Mesh {
  const {
    name,
    category = 'Decorative detail',
    radius,
    height,
    radialSegments = 24,
    material,
    x = 0,
    y = 0,
    z = 0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    note,
    materialLabel,
    pickable = true,
  } = options;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotationX, rotationY, rotationZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  setPartMetadata(mesh, {
    name,
    category,
    width: radius * 2,
    height,
    depth: radius * 2,
    material: materialLabel,
    note,
  }, pickable);
  return mesh;
}

export function createRosette(options: {
  name: string;
  radius: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  material: THREE.Material;
  petals?: number;
}): THREE.Group {
  const { name, radius, depth, x, y, z, material, petals = 12 } = options;
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  setPartMetadata(group, {
    name,
    category: 'Decorative rosette',
    width: radius * 2,
    height: radius * 2,
    depth,
    material: 'Paint-grade carved detail',
  });

  const center = createCylinderPart({
    name: `${name} center`,
    radius: radius * 0.28,
    height: depth,
    material,
    rotationX: Math.PI / 2,
    pickable: false,
  });
  group.add(center);

  const petalGeometry = new THREE.SphereGeometry(1, 14, 10);
  for (let i = 0; i < petals; i += 1) {
    const angle = (i / petals) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeometry, material);
    petal.name = `${name} petal ${i + 1}`;
    petal.scale.set(radius * 0.18, radius * 0.39, depth * 0.36);
    petal.position.set(
      Math.cos(angle) * radius * 0.58,
      Math.sin(angle) * radius * 0.58,
      depth * 0.08,
    );
    petal.rotation.z = angle - Math.PI / 2;
    petal.castShadow = true;
    petal.userData.pickable = false;
    group.add(petal);
  }
  return group;
}

export function addEdgeHighlight(
  mesh: THREE.Mesh,
  color = 0x6a645c,
  opacity = 0.16,
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 24);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  material.userData.disposeWithObject = true;
  const lines = new THREE.LineSegments(edges, material);
  lines.name = `${mesh.name} edge detail`;
  lines.userData.pickable = false;
  mesh.add(lines);
  return lines;
}

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else if (object.material && object.material.userData?.disposeWithObject) {
        object.material.dispose();
      }
    }
    if (object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight) {
      object.shadow.map?.dispose();
      object.shadow.mapPass?.dispose();
    }
  });
}
