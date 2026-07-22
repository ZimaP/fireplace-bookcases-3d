import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBookcase } from '../src/model/bookcase';
import {
  clampConfig,
  CONSTRUCTION,
  DEFAULT_CONFIG,
  deriveLayout,
  MINIMUM_SHELF_OPENING,
} from '../src/model/config';
import type { MaterialLibrary } from '../src/model/materials';
import type { PartMetadata } from '../src/model/primitives';

const sharedMaterial = new THREE.MeshStandardMaterial();
const testMaterials = new Proxy({} as MaterialLibrary, {
  get: () => sharedMaterial,
});

function metadata(group: THREE.Group, name: string): PartMetadata {
  const object = group.getObjectByName(name);
  if (!object?.userData.part) throw new Error(`Missing model part: ${name}`);
  return object.userData.part as PartMetadata;
}

describe('bookcase construction geometry', () => {
  it('uses fixed drawing stock and only one transition shelf', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const { group } = buildBookcase('left', DEFAULT_CONFIG, layout, testMaterials);

    expect(metadata(group, 'Left base left side panel').width).toBe(CONSTRUCTION.carcassThickness);
    expect(metadata(group, 'Left upper right side panel').width).toBe(CONSTRUCTION.carcassThickness);
    expect(metadata(group, 'Left base cabinet back').depth).toBe(CONSTRUCTION.finishedBackThickness);
    expect(metadata(group, 'Left upper finished back').depth).toBe(CONSTRUCTION.finishedBackThickness);
    expect(metadata(group, 'Left base center face-frame stile').width).toBe(CONSTRUCTION.faceFrameWidth);
    expect(metadata(group, 'Left base cabinet center partition').width).toBe(CONSTRUCTION.centerDividerWidth);
    expect(metadata(group, 'Left base door 1').depth).toBe(CONSTRUCTION.doorThickness);
    expect(metadata(group, 'Left bookcase countertop').height).toBe(CONSTRUCTION.fixedTransitionShelfThickness);
    expect(group.getObjectByName('Left upper fixed bottom shelf')).toBeUndefined();
    expect(metadata(group, 'Left upper fixed top shelf').height).toBe(CONSTRUCTION.carcassThickness);

    const transitionParts: THREE.Object3D[] = [];
    group.traverse((object) => {
      const part = object.userData.part as PartMetadata | undefined;
      if (part?.category === 'Countertop / fixed transition shelf') transitionParts.push(object);
    });
    expect(transitionParts.map((part) => part.name)).toEqual(['Left bookcase countertop']);
  });

  it('places a field filler and plywood backers only at each wall-facing edge', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const left = buildBookcase('left', DEFAULT_CONFIG, layout, testMaterials).group;
    const right = buildBookcase('right', DEFAULT_CONFIG, layout, testMaterials).group;

    expect(metadata(left, 'Left left base field filler').width).toBe(DEFAULT_CONFIG.sideFiller);
    expect(metadata(left, 'Left left upper field filler').width).toBe(DEFAULT_CONFIG.sideFiller);
    expect(metadata(left, 'Left left base filler backer').depth).toBe(CONSTRUCTION.carcassThickness);
    expect(metadata(left, 'Left left upper filler backer').depth).toBe(CONSTRUCTION.carcassThickness);
    expect(left.getObjectByName('Left right base field filler')).toBeUndefined();
    expect(left.getObjectByName('Left right upper field filler')).toBeUndefined();

    expect(metadata(right, 'Right right base field filler').width).toBe(DEFAULT_CONFIG.sideFiller);
    expect(metadata(right, 'Right right upper field filler').width).toBe(DEFAULT_CONFIG.sideFiller);
    expect(right.getObjectByName('Right left base field filler')).toBeUndefined();
    expect(right.getObjectByName('Right left upper field filler')).toBeUndefined();

    expect(left.getObjectByName('Left aligned cabinet carcass')?.position.x).toBe(
      DEFAULT_CONFIG.sideFiller / 2,
    );
    expect(right.getObjectByName('Right aligned cabinet carcass')?.position.x).toBe(
      -DEFAULT_CONFIG.sideFiller / 2,
    );
  });

  it.each([
    [58.5, 1],
    [66.5, 1.25],
    [76.5, 1.5],
    [76.625, 1.5],
  ] as const)('applies scheduled stock at %s inches overall width', (width, thickness) => {
    const config = { ...DEFAULT_CONFIG, leftBookcaseWidth: width };
    const layout = deriveLayout(config);
    const left = buildBookcase('left', config, layout, testMaterials).group;

    expect(metadata(left, 'Left base left adjustable shelf').height).toBe(thickness);
    expect(metadata(left, 'Left left bay adjustable shelf 1').height).toBe(thickness);
  });

  it('aligns the clear shelf span to carcass and center-divider faces', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const { group } = buildBookcase('left', DEFAULT_CONFIG, layout, testMaterials);
    const side = group.getObjectByName('Left upper left side panel');
    const shelf = group.getObjectByName('Left left bay adjustable shelf 1');
    const baseShelf = group.getObjectByName('Left base left adjustable shelf');
    if (!side || !shelf || !baseShelf) throw new Error('Expected carcass geometry.');

    const sideInnerFace = side.position.x + CONSTRUCTION.carcassThickness / 2;
    const shelfLeftEdge = shelf.position.x - layout.leftBayWidth / 2;
    const shelfRightEdge = shelf.position.x + layout.leftBayWidth / 2;

    expect(shelfLeftEdge).toBeCloseTo(sideInnerFace, 10);
    expect(shelfRightEdge).toBeCloseTo(-CONSTRUCTION.centerDividerWidth / 2, 10);
    expect((baseShelf.userData.part as PartMetadata).width).toBe(layout.leftBayWidth);
  });

  it('places upper and lower drilling and supports on the same two-inch grid', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const result = buildBookcase('left', DEFAULT_CONFIG, layout, testMaterials);
    const [baseHoles, upperHoles] = result.shelfPinMeshes;
    const baseSupports = result.group.getObjectByName('Left base concealed shelf supports');
    const upperSupports = result.group.getObjectByName('Left concealed shelf supports');
    if (
      !baseHoles ||
      !upperHoles ||
      !(baseSupports instanceof THREE.InstancedMesh) ||
      !(upperSupports instanceof THREE.InstancedMesh)
    ) {
      throw new Error('Expected upper and lower shelf-pin and support instances.');
    }

    expect(result.shelfPinMeshes.map((mesh) => mesh.name)).toEqual([
      'Left base 5 mm shelf-pin holes',
      'Left 5 mm shelf-pin holes',
    ]);
    expect((baseHoles.userData.part as PartMetadata).width).toBeCloseTo(
      CONSTRUCTION.shelfPinDiameter,
      10,
    );
    expect((upperHoles.userData.part as PartMetadata).width).toBeCloseTo(
      CONSTRUCTION.shelfPinDiameter,
      10,
    );

    for (const holes of [baseHoles, upperHoles]) {
      const first = new THREE.Matrix4();
      const second = new THREE.Matrix4();
      holes.getMatrixAt(0, first);
      holes.getMatrixAt(1, second);
      expect(second.elements[13] - first.elements[13]).toBeCloseTo(
        CONSTRUCTION.shelfPinSpacing,
        10,
      );
    }

    for (const [supports, pinOriginY] of [
      [baseSupports, DEFAULT_CONFIG.toeKickHeight + 3],
      [upperSupports, layout.upperStartY + 3],
    ] as const) {
      const support = new THREE.Matrix4();
      supports.getMatrixAt(0, support);
      const gridIndex = (support.elements[13] - pinOriginY) / CONSTRUCTION.shelfPinSpacing;
      expect(gridIndex).toBeCloseTo(Math.round(gridIndex), 10);
    }
  });

  it('builds only shelf layouts that satisfy the density guard', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      roomHeight: 84,
      bookcaseHeight: 72,
      baseHeight: 42,
      crownHeight: 8,
      shelfCount: 8,
    });
    const layout = deriveLayout(config);
    const group = buildBookcase('left', config, layout, testMaterials).group;
    const shelves: THREE.Object3D[] = [];
    for (let index = 1; index <= config.shelfCount; index += 1) {
      const shelf = group.getObjectByName(`Left left bay adjustable shelf ${index}`);
      if (!shelf) throw new Error(`Missing guarded shelf ${index}.`);
      shelves.push(shelf);
    }

    expect(config.shelfCount).toBe(2);
    expect(group.getObjectByName('Left left bay adjustable shelf 3')).toBeUndefined();

    const clearOpenings: number[] = [];
    let previousTop = layout.upperStartY;
    for (const shelf of shelves) {
      const part = shelf.userData.part as PartMetadata;
      const shelfBottom = shelf.position.y - part.height / 2;
      clearOpenings.push(shelfBottom - previousTop);
      previousTop = shelf.position.y + part.height / 2;
    }
    const openingTop = config.bookcaseHeight - config.crownHeight - CONSTRUCTION.faceFrameWidth;
    clearOpenings.push(openingTop - previousTop);

    expect(Math.min(...clearOpenings)).toBeGreaterThanOrEqual(MINIMUM_SHELF_OPENING);
  });

  it('reports a finished-depth envelope that contains crown and optional hardware', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      upperDepth: 22,
      baseDepth: 22,
      crownProjection: 4,
      showHardware: true,
      showReferenceGhost: true,
    });
    const layout = deriveLayout(config);
    const group = buildBookcase('left', config, layout, testMaterials).group;
    const assembly = group.userData.part as PartMetadata;
    const envelope = group.getObjectByName('Left design envelope');
    if (!envelope) throw new Error('Missing bookcase design envelope.');

    expect(assembly.depth).toBe(26);
    expect((envelope.userData.part as PartMetadata).depth).toBe(26);
    expect(envelope.position.z).toBe(13);
  });

  it.each([
    ['minimum', { roomWidth: 150, roomHeight: 84, chimneyWidth: 42, leftBookcaseWidth: 44, rightBookcaseWidth: 44 }],
    ['default', {}],
    ['maximum', { roomWidth: 360, roomHeight: 168, chimneyWidth: 96, leftBookcaseWidth: 108, rightBookcaseWidth: 108, bookcaseHeight: 156, baseHeight: 42 }],
    ['over-36 span', { roomWidth: 360, leftBookcaseWidth: 108, rightBookcaseWidth: 76.625, sideFiller: 0.75 }],
  ] as const)('keeps %s assembly dimensions positive and finite', (_name, overrides) => {
    const config = clampConfig({ ...DEFAULT_CONFIG, ...overrides });
    const layout = deriveLayout(config);

    for (const side of ['left', 'right'] as const) {
      const group = buildBookcase(side, config, layout, testMaterials).group;
      group.traverse((object) => {
        const part = object.userData.part as PartMetadata | undefined;
        if (!part) return;
        for (const dimension of [part.width, part.height, part.depth]) {
          expect(Number.isFinite(dimension)).toBe(true);
          expect(dimension).toBeGreaterThan(0);
        }
      });
    }
  });
});
