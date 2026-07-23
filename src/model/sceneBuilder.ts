import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { ModelConfig } from './config';
import { deriveLayout } from './config';
import { buildBookcase } from './bookcase';
import { buildDimensions } from './dimensions';
import { buildFireplace } from './fireplace';
import {
  createMaterialLibrary,
  disposeMaterialLibrary,
  type MaterialLibrary,
} from './materials';
import { disposeObject, type PartMetadata } from './primitives';
import { buildRoom } from './room';

export interface SceneAssembly {
  root: THREE.Group;
  installations: THREE.Group;
  materials: MaterialLibrary;
  derived: ReturnType<typeof deriveLayout>;
  update: (timeSeconds: number) => void;
  destroy: () => void;
}

export function buildSceneAssembly(config: ModelConfig): SceneAssembly {
  const materials = createMaterialLibrary(config.cabinetFinish, config.floorFinish);
  const derived = deriveLayout(config);
  const root = new THREE.Group();
  root.name = 'Parametric bookcase room study';

  const room = buildRoom(config, derived, materials);
  root.add(room);

  const installations = new THREE.Group();
  installations.name = 'Built-in installations';
  for (const placement of derived.bookcasePlacements) {
    const bookcase = buildBookcase(placement.sourceSide, config, derived, materials);
    bookcase.group.name = `${placement.label} bookcase`;
    bookcase.group.position.set(placement.x, 0, placement.z);
    bookcase.group.rotation.y = placement.rotationY;
    bookcase.group.userData.placementId = placement.id;
    const metadata = bookcase.group.userData.part as PartMetadata | undefined;
    if (metadata) {
      bookcase.group.userData.part = {
        ...metadata,
        name: `${placement.label} bookcase`,
        note: 'The shared drawing-based two-bay, four-door cabinet installed in the selected room opening.',
      } satisfies PartMetadata;
    }
    installations.add(bookcase.group);
  }
  root.add(installations);

  let updateFireplace = (_timeSeconds: number): void => undefined;
  if (derived.hasFireplace) {
    const fireplace = buildFireplace(config, materials);
    root.add(fireplace.group);
    updateFireplace = fireplace.update;
  }

  const dimensions = buildDimensions(config, derived, materials);
  root.add(dimensions);

  const lighting = buildLighting(config);
  root.add(lighting);

  return {
    root,
    installations,
    materials,
    derived,
    update: updateFireplace,
    destroy: () => {
      root.traverse((object) => {
        if (object instanceof CSS2DObject) {
          object.element.remove();
        }
      });
      disposeObject(root);
      disposeMaterialLibrary(materials);
    },
  };
}

function buildLighting(config: ModelConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Architectural lighting';
  group.userData.pickable = false;

  const hemisphere = new THREE.HemisphereLight(0xf6f1e8, 0x58606a, 0.38);
  hemisphere.name = 'Ambient room light';
  group.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff5e8, 1.12);
  key.name = 'Front key light';
  key.position.set(-config.roomWidth * 0.34, config.roomHeight * 1.35, config.roomDepth * 0.9);
  key.target.position.set(0, config.roomHeight * 0.42, derivedFrontZ(config) + 2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00045;
  key.shadow.normalBias = 0.025;
  const span = Math.max(config.roomWidth, config.roomDepth) * 0.68;
  key.shadow.camera.left = -span;
  key.shadow.camera.right = span;
  key.shadow.camera.top = span;
  key.shadow.camera.bottom = -span;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = config.roomDepth * 3.2;
  group.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xcbd9ed, 0.28);
  fill.name = 'Cool fill light';
  fill.position.set(config.roomWidth * 0.52, config.roomHeight * 0.8, config.roomDepth * 0.45);
  fill.target.position.set(0, config.roomHeight * 0.45, derivedFrontZ(config));
  group.add(fill, fill.target);

  const frontArea = new THREE.RectAreaLight(
    0xfff2de,
    Math.max(7, config.roomWidth * 0.04),
    config.roomWidth * 0.72,
    config.roomHeight * 0.42,
  );
  frontArea.name = 'Large front softbox';
  frontArea.position.set(0, config.roomHeight * 0.66, config.roomDepth * 0.93);
  frontArea.lookAt(0, config.roomHeight * 0.45, derivedFrontZ(config) + 3);
  group.add(frontArea);

  const leftWash = new THREE.SpotLight(0xffe5c5, 32, config.roomDepth * 1.2, Math.PI / 4.2, 0.62, 1.2);
  leftWash.name = 'Left bookcase wash';
  leftWash.position.set(-config.roomWidth * 0.25, config.roomHeight * 0.93, config.roomDepth * 0.45);
  leftWash.target.position.set(-config.roomWidth * 0.24, config.roomHeight * 0.5, 8);
  group.add(leftWash, leftWash.target);

  const rightWash = leftWash.clone();
  rightWash.name = 'Right bookcase wash';
  rightWash.position.x *= -1;
  rightWash.target = new THREE.Object3D();
  rightWash.target.position.set(config.roomWidth * 0.24, config.roomHeight * 0.5, 8);
  group.add(rightWash, rightWash.target);

  return group;
}

function derivedFrontZ(config: ModelConfig): number {
  if (config.roomLayout === 'fireplace-wall') {
    return Math.max(config.baseDepth, config.chimneyDepth + config.mantelDepth);
  }
  return config.baseDepth;
}
