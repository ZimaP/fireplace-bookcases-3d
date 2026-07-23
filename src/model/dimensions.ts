import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { DerivedLayout, ModelConfig } from './config';
import { CONSTRUCTION, formatInches } from './config';
import type { MaterialLibrary } from './materials';

export function buildDimensions(
  config: ModelConfig,
  derived: DerivedLayout,
  materials: MaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Dimension annotations';
  group.visible = config.showDimensions;
  group.renderOrder = 100;
  group.userData.pickable = false;

  const frontZ = config.roomDepth + 8;
  addDimension({
    parent: group,
    start: new THREE.Vector3(-config.roomWidth / 2, 1.25, frontZ),
    end: new THREE.Vector3(config.roomWidth / 2, 1.25, frontZ),
    label: `Room width  ${formatInches(config.roomWidth)}`,
    materials,
    extensions: [
      [new THREE.Vector3(-config.roomWidth / 2, 0, config.roomDepth), new THREE.Vector3(-config.roomWidth / 2, 1.25, frontZ)],
      [new THREE.Vector3(config.roomWidth / 2, 0, config.roomDepth), new THREE.Vector3(config.roomWidth / 2, 1.25, frontZ)],
    ],
  });

  const heightX = -config.roomWidth / 2 - 10;
  addDimension({
    parent: group,
    start: new THREE.Vector3(heightX, 0, 2),
    end: new THREE.Vector3(heightX, config.roomHeight, 2),
    label: `Room height  ${formatInches(config.roomHeight)}`,
    materials,
    extensions: [
      [new THREE.Vector3(-config.roomWidth / 2, 0, 0), new THREE.Vector3(heightX, 0, 2)],
      [
        new THREE.Vector3(-config.roomWidth / 2, config.roomHeight, 0),
        new THREE.Vector3(heightX, config.roomHeight, 2),
      ],
    ],
  });

  const bookcaseDimY = config.roomHeight + 5;
  for (const placement of derived.bookcasePlacements) {
    const width = placement.width;
    const centerX = placement.x;
    const frontZ = placement.z + config.upperDepth + 2;
    addDimension({
      parent: group,
      start: new THREE.Vector3(centerX - width / 2, bookcaseDimY, frontZ),
      end: new THREE.Vector3(centerX + width / 2, bookcaseDimY, frontZ),
      label: `${placement.label}  ${formatInches(width)}`,
      materials,
      extensions: [
        [
          new THREE.Vector3(centerX - width / 2, config.bookcaseHeight, placement.z + config.upperDepth),
          new THREE.Vector3(centerX - width / 2, bookcaseDimY, frontZ),
        ],
        [
          new THREE.Vector3(centerX + width / 2, config.bookcaseHeight, placement.z + config.upperDepth),
          new THREE.Vector3(centerX + width / 2, bookcaseDimY, frontZ),
        ],
      ],
    });
  }

  const firstPlacement = derived.bookcasePlacements[0];
  if (firstPlacement) {
    const heightX = firstPlacement.x - firstPlacement.width / 2 - 5.2;
    addDimension({
      parent: group,
      start: new THREE.Vector3(heightX, 0, firstPlacement.z + config.baseDepth + 1.5),
      end: new THREE.Vector3(heightX, config.bookcaseHeight, firstPlacement.z + config.baseDepth + 1.5),
      label: `Bookcase height  ${formatInches(config.bookcaseHeight)}`,
      materials,
      extensions: [
        [
          new THREE.Vector3(firstPlacement.x - firstPlacement.width / 2, 0, firstPlacement.z + config.baseDepth),
          new THREE.Vector3(heightX, 0, firstPlacement.z + config.baseDepth + 1.5),
        ],
        [
          new THREE.Vector3(
            firstPlacement.x - firstPlacement.width / 2,
            config.bookcaseHeight,
            firstPlacement.z + config.upperDepth,
          ),
          new THREE.Vector3(heightX, config.bookcaseHeight, firstPlacement.z + config.baseDepth + 1.5),
        ],
      ],
    });
  }

  if (derived.hasFireplace) {
    const mantelDimensionY = config.mantelHeight + 5;
    addDimension({
      parent: group,
      start: new THREE.Vector3(-config.mantelWidth / 2, mantelDimensionY, config.chimneyDepth + config.mantelDepth + 2),
      end: new THREE.Vector3(config.mantelWidth / 2, mantelDimensionY, config.chimneyDepth + config.mantelDepth + 2),
      label: `Mantel width  ${formatInches(config.mantelWidth)}`,
      materials,
      extensions: [
        [
          new THREE.Vector3(-config.mantelWidth / 2, config.mantelHeight, config.chimneyDepth + config.mantelDepth),
          new THREE.Vector3(-config.mantelWidth / 2, mantelDimensionY, config.chimneyDepth + config.mantelDepth + 2),
        ],
        [
          new THREE.Vector3(config.mantelWidth / 2, config.mantelHeight, config.chimneyDepth + config.mantelDepth),
          new THREE.Vector3(config.mantelWidth / 2, mantelDimensionY, config.chimneyDepth + config.mantelDepth + 2),
        ],
      ],
    });
  }

  const lastPlacement = derived.bookcasePlacements.at(-1);
  if (lastPlacement) {
    const baseDimX = lastPlacement.x + lastPlacement.width / 2 + 5.4;
    addDimension({
      parent: group,
      start: new THREE.Vector3(baseDimX, 0, lastPlacement.z + config.baseDepth + 1),
      end: new THREE.Vector3(
        baseDimX,
        config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness,
        lastPlacement.z + config.baseDepth + 1,
      ),
      label: `Base + top  ${formatInches(config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness)}`,
      materials,
      extensions: [
        [
          new THREE.Vector3(lastPlacement.x + lastPlacement.width / 2, 0, lastPlacement.z + config.baseDepth),
          new THREE.Vector3(baseDimX, 0, lastPlacement.z + config.baseDepth + 1),
        ],
        [
          new THREE.Vector3(
            lastPlacement.x + lastPlacement.width / 2,
            config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness,
            lastPlacement.z + config.baseDepth,
          ),
          new THREE.Vector3(
            baseDimX,
            config.baseHeight + CONSTRUCTION.fixedTransitionShelfThickness,
            lastPlacement.z + config.baseDepth + 1,
          ),
        ],
      ],
    });
  }

  return group;
}

interface DimensionOptions {
  parent: THREE.Group;
  start: THREE.Vector3;
  end: THREE.Vector3;
  label: string;
  materials: MaterialLibrary;
  extensions?: Array<[THREE.Vector3, THREE.Vector3]>;
}

function addDimension(options: DimensionOptions): void {
  const { parent, start, end, label, materials, extensions = [] } = options;
  const lineGroup = new THREE.Group();
  lineGroup.name = label;
  lineGroup.renderOrder = 100;
  lineGroup.userData.pickable = false;

  const points: THREE.Vector3[] = [start, end];
  for (const [extensionStart, extensionEnd] of extensions) {
    points.push(extensionStart, extensionEnd);
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const lines = new THREE.LineSegments(geometry, materials.dimension);
  lines.renderOrder = 100;
  lines.userData.pickable = false;
  lineGroup.add(lines);

  const direction = end.clone().sub(start).normalize();
  const length = start.distanceTo(end);
  const arrowLength = Math.min(2.5, Math.max(1.25, length * 0.03));
  const arrowRadius = arrowLength * 0.24;
  const coneGeometry = new THREE.ConeGeometry(arrowRadius, arrowLength, 16);

  const startArrow = new THREE.Mesh(coneGeometry, materials.dimensionFill);
  startArrow.position.copy(start).addScaledVector(direction, arrowLength / 2);
  startArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  startArrow.renderOrder = 101;
  startArrow.userData.pickable = false;
  lineGroup.add(startArrow);

  const endDirection = direction.clone().multiplyScalar(-1);
  const endArrow = new THREE.Mesh(coneGeometry, materials.dimensionFill);
  endArrow.position.copy(end).addScaledVector(endDirection, arrowLength / 2);
  endArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDirection);
  endArrow.renderOrder = 101;
  endArrow.userData.pickable = false;
  lineGroup.add(endArrow);

  const element = document.createElement('div');
  element.className = 'dimension-label';
  element.textContent = label;
  const labelObject = new CSS2DObject(element);
  labelObject.name = `${label} label`;
  labelObject.position.copy(start).lerp(end, 0.5);
  labelObject.position.y += Math.abs(direction.y) > 0.75 ? 0 : 1.25;
  labelObject.position.x += Math.abs(direction.y) > 0.75 ? 1.8 : 0;
  labelObject.userData.pickable = false;
  lineGroup.add(labelObject);

  parent.add(lineGroup);
}
