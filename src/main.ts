import './styles.css';
import './customer-experience.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  clampConfig,
  configToUrl,
  copyConfig,
  DEFAULT_CONFIG,
  fitBookcasesToSelectedOpening,
  getRoomLayoutOption,
  readConfigFromUrl,
  type ModelConfig,
} from './model/config';
import { buildSceneAssembly, type SceneAssembly } from './model/sceneBuilder';
import type { PartMetadata } from './model/primitives';
import {
  copyShareUrl,
  createAppUi,
  getCustomerWarnings,
  type PartDisplay,
  type ViewPreset,
} from './ui/controls';

RectAreaLightUniformsLib.init();

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Application mount point not found.');

let config = readConfigFromUrl();
let assembly: SceneAssembly | null = null;
let rebuildTimer: number | null = null;
let selectedHelper: THREE.Box3Helper | null = null;
let cameraTween: CameraTween | null = null;
let activeViewPreset: ViewPreset | null = 'hero';
let lastPointerMove = 0;
let savedStatusTimer: number | null = null;
let pointerGesture: PointerGesture | null = null;
let suppressClickUntil = 0;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcbd2d6, 0.00065);

const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 2400);
camera.position.set(0, 68, 225);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.setClearColor(0x000000, 0);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'label-renderer';
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironment = new RoomEnvironment();
scene.environment = pmremGenerator.fromScene(roomEnvironment, 0.035).texture;
scene.environmentIntensity = 0.68;
pmremGenerator.dispose();
roomEnvironment.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.screenSpacePanning = true;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI * 0.495;
controls.zoomToCursor = true;
controls.target.set(0, 52, 7);

const ui = createAppUi(app, config, {
  onConfigChange: (next) => {
    if (next.roomLayout !== config.roomLayout) {
      rebuildNow(next, true);
      setViewPreset('hero');
      const layoutOption = getRoomLayoutOption(next.roomLayout);
      flashStatus(layoutOption.sourceKind === 'owner-reference'
        ? `${layoutOption.label} is ready. Add your room measurements next.`
        : `${layoutOption.label} is ready as an editable planning layout.`);
      return;
    }
    scheduleRebuild(next);
  },
  onViewPreset: (preset) => setViewPreset(preset),
  onReset: () => {
    config = copyConfig(DEFAULT_CONFIG);
    rebuildNow(config, true);
    setViewPreset('hero');
    flashStatus('Planner reset. Start with the bookcase style you like.');
  },
  onFitPlacement: () => {
    const next = fitBookcasesToSelectedOpening(config);
    rebuildNow(next, true);
    flashStatus('Your bookcase was built to fit the selected opening.');
  },
  onSaveImage: () => saveCurrentView(),
  onCopyLink: async () => {
    try {
      await copyShareUrl(config);
      flashStatus('Share link copied with your current design.');
    } catch {
      flashStatus('The browser blocked clipboard access; copy the URL from the address bar.');
    }
  },
});

controls.addEventListener('start', () => {
  cameraTween = null;
});

ui.shell.canvasHost.appendChild(renderer.domElement);
ui.shell.overlayHost.appendChild(labelRenderer.domElement);
renderer.domElement.className = 'webgl-canvas';
renderer.domElement.setAttribute('aria-label', 'Interactive 3D bookcase room model');
renderer.domElement.tabIndex = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  if (performance.now() < suppressClickUntil) {
    suppressClickUntil = 0;
    return;
  }
  const part = pickPart(event);
  selectPart(part);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (pointerGesture?.pointerId === event.pointerId) {
    const distance = Math.hypot(
      event.clientX - pointerGesture.startX,
      event.clientY - pointerGesture.startY,
    );
    if (distance >= 6) {
      pointerGesture.dragged = true;
      clearActiveViewPreset();
      renderer.domElement.style.cursor = 'grabbing';
      return;
    }
  }

  const now = performance.now();
  if (now - lastPointerMove < 80) return;
  lastPointerMove = now;
  const part = pickPart(event);
  renderer.domElement.style.cursor = part ? 'pointer' : controls.enabled ? 'grab' : 'default';
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerGesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    button: event.button,
    dragged: false,
  };
  suppressClickUntil = 0;
  renderer.domElement.style.cursor = 'grabbing';
});
renderer.domElement.addEventListener('pointerup', (event) => {
  if (pointerGesture?.pointerId === event.pointerId) {
    suppressClickUntil = pointerGesture.dragged && pointerGesture.button === 0
      ? performance.now() + 350
      : 0;
    pointerGesture = null;
  }
  renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.addEventListener('pointercancel', () => {
  suppressClickUntil = 0;
  pointerGesture = null;
  renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.addEventListener('wheel', () => clearActiveViewPreset(), { passive: true });
renderer.domElement.addEventListener('dblclick', (event) => {
  const part = pickPart(event);
  if (!part?.object) return;
  frameObject(part.object);
});

const resizeObserver = new ResizeObserver(() => resizeRenderer());
resizeObserver.observe(ui.shell.viewport);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') selectPart(null);
  if (isEditableTarget(event.target)) return;
  if (event.key.toLowerCase() === 'f') setViewPreset('front');
  if (event.key.toLowerCase() === 'p') setViewPreset('plan');
});
window.addEventListener('popstate', () => {
  config = readConfigFromUrl();
  rebuildNow(config, false);
});

rebuildNow(config, false);
resizeRenderer();
setViewPreset('hero', false);

const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsElapsed = 0;

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;
  updateCameraTween(elapsed);
  controls.update();
  assembly?.update(elapsed);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  fpsFrames += 1;
  fpsElapsed += delta;
  if (fpsElapsed >= 0.75) {
    ui.setFps(fpsFrames / fpsElapsed);
    fpsFrames = 0;
    fpsElapsed = 0;
  }
});

function scheduleRebuild(next: ModelConfig): void {
  config = clampConfig(next);
  cancelStatusReset();
  ui.setStatus('Updating your 3D preview…');
  if (rebuildTimer !== null) window.clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(() => {
    rebuildTimer = null;
    rebuildNow(config, true);
  }, 110);
}

function rebuildNow(next: ModelConfig, updateUrl: boolean): void {
  config = clampConfig(next);
  cancelStatusReset();
  selectPart(null);

  if (assembly) {
    scene.remove(assembly.root);
    assembly.destroy();
    assembly = null;
  }

  assembly = buildSceneAssembly(config);
  scene.add(assembly.root);
  ui.sync(config, assembly.derived);
  updateControlBounds();
  if (!assembly.derived.hasFireplace && activeViewPreset === 'fireplace') {
    activeViewPreset = 'hero';
  }
  if (assembly.derived.bookcasePlacements.length < 2 && activeViewPreset === 'right-detail') {
    activeViewPreset = 'left-detail';
  }
  if (activeViewPreset) setViewPreset(activeViewPreset, false);

  if (updateUrl) {
    window.history.replaceState({}, '', configToUrl(config));
  }

  ui.setStatus(getModelStatus());
}

function updateControlBounds(): void {
  const maximumDistance = Math.max(config.roomWidth, config.roomDepth, config.roomHeight) * 3.25;
  controls.minDistance = 28;
  controls.maxDistance = maximumDistance;
}

function resizeRenderer(): void {
  const rect = ui.shell.viewport.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (activeViewPreset && assembly) setViewPreset(activeViewPreset, false);
}

interface PickResult {
  metadata: PartMetadata;
  object: THREE.Object3D;
}

function pickPart(event: PointerEvent | MouseEvent): PickResult | null {
  if (!assembly) return null;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObject(assembly.root, true);
  for (const intersection of intersections) {
    let object: THREE.Object3D | null = intersection.object;
    while (object && object !== assembly.root) {
      if (object.userData.pickable && object.userData.part) {
        return {
          metadata: object.userData.part as PartMetadata,
          object,
        };
      }
      object = object.parent;
    }
  }
  return null;
}

function selectPart(part: PickResult | null): void {
  clearSelection();
  if (!part) {
    ui.setPart(null);
    return;
  }

  const box = new THREE.Box3().setFromObject(part.object);
  if (!box.isEmpty()) {
    selectedHelper = new THREE.Box3Helper(box, 0xd69b55);
    selectedHelper.name = 'Selected part outline';
    selectedHelper.renderOrder = 200;
    const material = selectedHelper.material as THREE.LineBasicMaterial;
    material.depthTest = false;
    material.transparent = true;
    material.opacity = 0.95;
    scene.add(selectedHelper);
  }
  ui.setPart(part.metadata as PartDisplay);
}

function clearSelection(): void {
  if (selectedHelper) {
    scene.remove(selectedHelper);
    selectedHelper.geometry.dispose();
    (selectedHelper.material as THREE.Material).dispose();
    selectedHelper = null;
  }
}

function setViewPreset(preset: ViewPreset, animate = true): void {
  activeViewPreset = preset;
  ui.setActiveView(preset);

  const bounds = getPresetBounds(preset);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const target = new THREE.Vector3();
  const position = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  switch (preset) {
    case 'front':
      target.set(center.x, center.y, Math.min(assembly?.derived.installationFrontZ ?? 4, bounds.max.z));
      placeCameraForBounds(bounds, target, position, new THREE.Vector3(0, 0, 1), 1.14);
      break;
    case 'plan':
      target.set(center.x, 0, center.z);
      position.set(
        center.x,
        bounds.max.y + fitDistanceToRectangle(size.x, size.z, 1.18),
        center.z,
      );
      up.set(0, 0, -1);
      break;
    case 'left-detail':
      target.copy(center);
      placeCameraForBounds(bounds, target, position, new THREE.Vector3(-0.07, 0.035, 1), 1.12);
      break;
    case 'right-detail':
      target.copy(center);
      placeCameraForBounds(bounds, target, position, new THREE.Vector3(0.07, 0.035, 1), 1.12);
      break;
    case 'fireplace':
      target.copy(center);
      placeCameraForBounds(bounds, target, position, new THREE.Vector3(0, 0.025, 1), 1.14);
      break;
    case 'hero':
    default:
      target.set(
        center.x,
        bounds.min.y + size.y * 0.48,
        Math.min((assembly?.derived.installationFrontZ ?? 0) + 4, center.z),
      );
      placeCameraForBounds(bounds, target, position, new THREE.Vector3(-0.18, 0.12, 1), 1.2);
      break;
  }

  if (!animate) {
    cameraTween = null;
    camera.position.copy(position);
    camera.up.copy(up);
    controls.target.copy(target);
    camera.lookAt(target);
    controls.update();
    return;
  }

  cameraTween = {
    startTime: clock.elapsedTime,
    duration: 0.82,
    fromPosition: camera.position.clone(),
    toPosition: position,
    fromTarget: controls.target.clone(),
    toTarget: target,
    fromUp: camera.up.clone(),
    toUp: up,
  };
}

function getPresetBounds(preset: ViewPreset): THREE.Box3 {
  let subject: THREE.Object3D | null = assembly?.root ?? null;
  if (assembly) {
    if (preset === 'left-detail') {
      subject = assembly.installations.children[0] ?? assembly.installations;
    } else if (preset === 'right-detail') {
      subject = assembly.installations.children.at(-1) ?? assembly.installations;
    } else if (preset === 'fireplace') {
      subject = assembly.derived.hasFireplace
        ? assembly.root.getObjectByName('Classical fireplace and electric firebox') ?? assembly.root
        : assembly.installations;
    }
  }

  if (subject) {
    const bounds = new THREE.Box3().setFromObject(subject);
    if (!bounds.isEmpty()) return bounds;
  }

  return new THREE.Box3(
    new THREE.Vector3(-config.roomWidth / 2, -0.75, -config.wallThickness),
    new THREE.Vector3(
      config.roomWidth / 2,
      Math.max(config.roomHeight, config.bookcaseHeight, config.mantelHeight),
      config.roomDepth + 8,
    ),
  );
}

function placeCameraForBounds(
  bounds: THREE.Box3,
  target: THREE.Vector3,
  position: THREE.Vector3,
  viewDirection: THREE.Vector3,
  padding: number,
): void {
  const size = bounds.getSize(new THREE.Vector3());
  const direction = viewDirection.clone().normalize();
  let distance = fitDistanceToRectangle(size.x, size.y, padding);
  position.copy(target).addScaledVector(direction, distance);

  const minimumFrontZ = bounds.max.z + Math.max(10, size.z * 0.05);
  if (direction.z > 0.001 && position.z < minimumFrontZ) {
    distance += (minimumFrontZ - position.z) / direction.z;
    position.copy(target).addScaledVector(direction, distance);
  }
}

function fitDistanceToRectangle(width: number, height: number, padding: number): number {
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(0.1, camera.aspect));
  const verticalDistance = height / 2 / Math.tan(verticalFov / 2);
  const horizontalDistance = width / 2 / Math.tan(horizontalFov / 2);
  return Math.max(14, verticalDistance, horizontalDistance) * padding;
}

function updateCameraTween(timeSeconds: number): void {
  if (!cameraTween) return;
  const raw = (timeSeconds - cameraTween.startTime) / cameraTween.duration;
  const t = Math.min(1, Math.max(0, raw));
  const eased = 1 - Math.pow(1 - t, 3);
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
  controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
  camera.up.lerpVectors(cameraTween.fromUp, cameraTween.toUp, eased).normalize();
  camera.lookAt(controls.target);
  if (t >= 1) cameraTween = null;
}

function frameObject(object: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  clearActiveViewPreset();
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const direction = camera.position.clone().sub(controls.target).normalize();
  const topDown = Math.abs(direction.y) > 0.9;
  const distance = fitDistanceToRectangle(size.x, topDown ? size.z : size.y, 1.35);
  const destinationUp = topDown ? camera.up.clone() : new THREE.Vector3(0, 1, 0);
  cameraTween = {
    startTime: clock.elapsedTime,
    duration: 0.7,
    fromPosition: camera.position.clone(),
    toPosition: center.clone().addScaledVector(direction, distance),
    fromTarget: controls.target.clone(),
    toTarget: center,
    fromUp: camera.up.clone(),
    toUp: destinationUp,
  };
}

function countPickableParts(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((object) => {
    if (object.userData.pickable && object.userData.part) count += 1;
  });
  return count;
}

function saveCurrentView(): void {
  renderer.render(scene, camera);
  renderer.domElement.toBlob((blob) => {
    if (!blob) {
      flashStatus('Unable to create PNG in this browser.');
      return;
    }
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = `${config.roomLayout}-bookcase-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    flashStatus('Your design image was saved.');
  }, 'image/png');
}

function flashStatus(message: string): void {
  cancelStatusReset();
  ui.setStatus(message);
  savedStatusTimer = window.setTimeout(() => {
    ui.setStatus(getModelStatus());
    savedStatusTimer = null;
  }, 2600);
}

function cancelStatusReset(): void {
  if (savedStatusTimer === null) return;
  window.clearTimeout(savedStatusTimer);
  savedStatusTimer = null;
}

function getModelStatus(): string {
  if (!assembly) return 'Your preview is ready';
  const warningCount = getCustomerWarnings(assembly.derived).length;
  const roomName = getRoomLayoutOption(config.roomLayout).label;
  return `${roomName} preview ready · ${warningCount === 0 ? 'fit looks good' : `${warningCount} item${warningCount === 1 ? '' : 's'} to review`}`;
}

function clearActiveViewPreset(): void {
  if (activeViewPreset === null) return;
  activeViewPreset = null;
  ui.setActiveView(null);
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);
}

interface CameraTween {
  startTime: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromUp: THREE.Vector3;
  toUp: THREE.Vector3;
}

interface PointerGesture {
  pointerId: number;
  startX: number;
  startY: number;
  button: number;
  dragged: boolean;
}
