import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBookcase } from '../src/model/bookcase';
import { CONSTRUCTION, DEFAULT_CONFIG, deriveLayout } from '../src/model/config';
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
  it('uses fixed drawing stock for carcass, back, frame, doors, and transition shelves', () => {
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
    expect(metadata(group, 'Left upper fixed bottom shelf').height).toBe(CONSTRUCTION.fixedTransitionShelfThickness);
    expect(metadata(group, 'Left upper fixed top shelf').height).toBe(CONSTRUCTION.carcassThickness);
  });

  it('applies the selected per-side thickness to upper and lower adjustable shelves', () => {
    const config = {
      ...DEFAULT_CONFIG,
      leftBookcaseWidth: 60,
      rightBookcaseWidth: 79,
    };
    const layout = deriveLayout(config);
    const left = buildBookcase('left', config, layout, testMaterials).group;
    const right = buildBookcase('right', config, layout, testMaterials).group;

    expect(metadata(left, 'Left base left adjustable shelf').height).toBe(1);
    expect(metadata(left, 'Left left bay adjustable shelf 1').height).toBe(1);
    expect(metadata(right, 'Right base right adjustable shelf').height).toBe(1.5);
    expect(metadata(right, 'Right right bay adjustable shelf 1').height).toBe(1.5);
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

  it('places drilling and shelf supports on the same two-inch grid', () => {
    const layout = deriveLayout(DEFAULT_CONFIG);
    const result = buildBookcase('left', DEFAULT_CONFIG, layout, testMaterials);
    const holes = result.shelfPinMeshes[0];
    const supports = result.group.getObjectByName('Left concealed shelf supports');
    if (!holes || !(supports instanceof THREE.InstancedMesh)) {
      throw new Error('Expected shelf-pin and support instances.');
    }

    const first = new THREE.Matrix4();
    const second = new THREE.Matrix4();
    holes.getMatrixAt(0, first);
    holes.getMatrixAt(1, second);
    expect(second.elements[13] - first.elements[13]).toBeCloseTo(CONSTRUCTION.shelfPinSpacing, 10);

    const support = new THREE.Matrix4();
    supports.getMatrixAt(0, support);
    const pinOriginY = layout.upperStartY + 3;
    const gridIndex = (support.elements[13] - pinOriginY) / CONSTRUCTION.shelfPinSpacing;
    expect(gridIndex).toBeCloseTo(Math.round(gridIndex), 10);
  });
});
