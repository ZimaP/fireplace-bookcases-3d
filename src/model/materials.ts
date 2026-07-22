import * as THREE from 'three';
import type { CabinetFinish, FloorFinish } from './config';

export interface MaterialLibrary {
  cabinet: THREE.MeshPhysicalMaterial;
  cabinetEdge: THREE.MeshPhysicalMaterial;
  cabinetShadow: THREE.MeshStandardMaterial;
  interiorBack: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  wallSide: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  floorTrim: THREE.MeshStandardMaterial;
  stone: THREE.MeshPhysicalMaterial;
  stoneDark: THREE.MeshStandardMaterial;
  tile: THREE.MeshStandardMaterial;
  tileAlternate: THREE.MeshStandardMaterial;
  firebox: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  hole: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  ember: THREE.MeshStandardMaterial;
  log: THREE.MeshStandardMaterial;
  dimension: THREE.LineBasicMaterial;
  dimensionFill: THREE.MeshBasicMaterial;
  ghost: THREE.MeshBasicMaterial;
}

const CABINET_COLORS: Record<CabinetFinish, number> = {
  'warm-white': 0xe2ddd3,
  'pure-white': 0xf0f0ed,
  'soft-gray': 0xbfc1bd,
  'deep-green': 0x243a31,
};

const FLOOR_BASE: Record<FloorFinish, string> = {
  'natural-oak': '#b88c5f',
  'white-oak': '#cdbb99',
  walnut: '#6d4936',
};

export function createMaterialLibrary(
  cabinetFinish: CabinetFinish,
  floorFinish: FloorFinish,
): MaterialLibrary {
  const cabinetColor = CABINET_COLORS[cabinetFinish];
  const cabinetTexture = createPaintTexture(cabinetColor);
  const floorMaps = createFloorTextures(floorFinish);
  const wallTexture = createWallTexture();
  const stoneTexture = createStoneTexture();

  return {
    cabinet: new THREE.MeshPhysicalMaterial({
      color: cabinetColor,
      map: cabinetTexture,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.72,
    }),
    cabinetEdge: new THREE.MeshPhysicalMaterial({
      color: shadeColor(cabinetColor, 0.88),
      map: cabinetTexture,
      roughness: 0.43,
      clearcoat: 0.2,
      clearcoatRoughness: 0.62,
    }),
    cabinetShadow: new THREE.MeshStandardMaterial({
      color: shadeColor(cabinetColor, cabinetFinish === 'deep-green' ? 0.6 : 0.73),
      roughness: 0.75,
    }),
    interiorBack: new THREE.MeshStandardMaterial({
      color: shadeColor(cabinetColor, cabinetFinish === 'deep-green' ? 0.75 : 0.84),
      map: cabinetTexture,
      roughness: 0.68,
    }),
    wall: new THREE.MeshStandardMaterial({
      color: 0xd4d4d0,
      map: wallTexture,
      roughness: 0.9,
    }),
    wallSide: new THREE.MeshStandardMaterial({
      color: 0xc5c7c5,
      map: wallTexture,
      roughness: 0.92,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: floorMaps.color,
      bumpMap: floorMaps.bump,
      bumpScale: 0.085,
      roughness: floorFinish === 'walnut' ? 0.54 : 0.62,
    }),
    floorTrim: new THREE.MeshStandardMaterial({
      color: 0xd8d3cb,
      roughness: 0.68,
    }),
    stone: new THREE.MeshPhysicalMaterial({
      color: 0xc9c2b7,
      map: stoneTexture,
      roughness: 0.52,
      clearcoat: 0.08,
      clearcoatRoughness: 0.8,
    }),
    stoneDark: new THREE.MeshStandardMaterial({
      color: 0x5f5d58,
      roughness: 0.7,
    }),
    tile: new THREE.MeshStandardMaterial({
      color: 0xd9d3c8,
      roughness: 0.78,
    }),
    tileAlternate: new THREE.MeshStandardMaterial({
      color: 0xcac1b4,
      roughness: 0.8,
    }),
    firebox: new THREE.MeshStandardMaterial({
      color: 0x111315,
      roughness: 0.44,
      metalness: 0.35,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x6f7377,
      roughness: 0.35,
      metalness: 0.8,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0x9d7749,
      roughness: 0.28,
      metalness: 0.78,
    }),
    hole: new THREE.MeshStandardMaterial({
      color: cabinetFinish === 'deep-green' ? 0x0e1814 : 0x4b4b47,
      roughness: 0.88,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x303741,
      roughness: 0.08,
      transmission: 0.36,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      thickness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    ember: new THREE.MeshStandardMaterial({
      color: 0x7a1a05,
      emissive: 0xff3c05,
      emissiveIntensity: 2.8,
      roughness: 0.8,
    }),
    log: new THREE.MeshStandardMaterial({
      color: 0x352018,
      roughness: 0.96,
    }),
    dimension: new THREE.LineBasicMaterial({
      color: 0xd99a52,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
    }),
    dimensionFill: new THREE.MeshBasicMaterial({
      color: 0xd99a52,
      depthTest: false,
      depthWrite: false,
    }),
    ghost: new THREE.MeshBasicMaterial({
      color: 0x8ab6d6,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  };
}

function createPaintTexture(color: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create paint texture canvas.');

  const base = new THREE.Color(color);
  context.fillStyle = `#${base.getHexString()}`;
  context.fillRect(0, 0, 256, 256);
  const image = context.getImageData(0, 0, 256, 256);
  const data = image.data;
  const random = mulberry32(29418);
  for (let i = 0; i < data.length; i += 4) {
    const grain = (random() - 0.5) * 4.5;
    data[i] = clampByte(data[i] + grain);
    data[i + 1] = clampByte(data[i + 1] + grain);
    data[i + 2] = clampByte(data[i + 2] + grain);
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.anisotropy = 8;
  return texture;
}

function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create wall texture canvas.');

  context.fillStyle = '#eeece7';
  context.fillRect(0, 0, 256, 256);
  const random = mulberry32(7812);
  for (let i = 0; i < 4500; i += 1) {
    const alpha = random() * 0.035;
    const value = Math.floor(185 + random() * 45);
    context.fillStyle = `rgba(${value},${value},${value},${alpha})`;
    const x = random() * 256;
    const y = random() * 256;
    context.fillRect(x, y, 0.7 + random() * 1.1, 0.7 + random() * 1.1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function createFloorTextures(finish: FloorFinish): {
  color: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const context = canvas.getContext('2d');
  const bumpContext = bumpCanvas.getContext('2d');
  if (!context || !bumpContext) throw new Error('Unable to create floor texture canvas.');

  const random = mulberry32(finish === 'walnut' ? 81974 : finish === 'white-oak' ? 51974 : 31974);
  const plankHeight = 88;
  const base = new THREE.Color(FLOOR_BASE[finish]);
  context.fillStyle = `#${base.getHexString()}`;
  context.fillRect(0, 0, width, height);
  bumpContext.fillStyle = '#858585';
  bumpContext.fillRect(0, 0, width, height);

  for (let row = 0; row < Math.ceil(height / plankHeight); row += 1) {
    const y = row * plankHeight;
    const offset = row % 2 === 0 ? -230 : -60;
    let x = offset;
    while (x < width) {
      const plankWidth = 260 + random() * 280;
      const tone = 0.78 + random() * 0.38;
      const plankColor = base.clone().multiplyScalar(tone);
      context.fillStyle = `#${plankColor.getHexString()}`;
      context.fillRect(x + 1, y + 1, plankWidth - 2, plankHeight - 2);

      const gradient = context.createLinearGradient(x, y, x + plankWidth, y);
      gradient.addColorStop(0, 'rgba(255,255,255,0.02)');
      gradient.addColorStop(0.35, 'rgba(255,255,255,0.08)');
      gradient.addColorStop(0.75, 'rgba(0,0,0,0.06)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.01)');
      context.fillStyle = gradient;
      context.fillRect(x + 2, y + 2, plankWidth - 4, plankHeight - 4);

      context.strokeStyle = finish === 'walnut' ? 'rgba(25,12,8,.45)' : 'rgba(73,45,25,.28)';
      context.lineWidth = 1.4;
      context.strokeRect(x + 0.5, y + 0.5, plankWidth - 1, plankHeight - 1);
      bumpContext.fillStyle = '#878787';
      bumpContext.fillRect(x + 1, y + 1, plankWidth - 2, plankHeight - 2);
      bumpContext.strokeStyle = '#4a4a4a';
      bumpContext.lineWidth = 2;
      bumpContext.strokeRect(x + 1, y + 1, plankWidth - 2, plankHeight - 2);

      const grainLines = 10 + Math.floor(random() * 11);
      for (let g = 0; g < grainLines; g += 1) {
        const gy = y + 5 + random() * (plankHeight - 10);
        const amplitude = 1 + random() * 5;
        const phase = random() * Math.PI * 2;
        context.beginPath();
        context.moveTo(x, gy);
        for (let px = 0; px <= plankWidth; px += 16) {
          const wave = Math.sin(px * 0.026 + phase) * amplitude + (random() - 0.5) * 1.2;
          context.lineTo(x + px, gy + wave);
        }
        context.strokeStyle = finish === 'walnut'
          ? `rgba(24,10,7,${0.08 + random() * 0.16})`
          : `rgba(83,50,25,${0.05 + random() * 0.11})`;
        context.lineWidth = 0.6 + random() * 1.2;
        context.stroke();

        bumpContext.beginPath();
        bumpContext.moveTo(x, gy);
        for (let px = 0; px <= plankWidth; px += 16) {
          const wave = Math.sin(px * 0.026 + phase) * amplitude;
          bumpContext.lineTo(x + px, gy + wave);
        }
        bumpContext.strokeStyle = '#777777';
        bumpContext.lineWidth = 0.8;
        bumpContext.stroke();
      }
      x += plankWidth;
    }
  }

  const color = new THREE.CanvasTexture(canvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(2.8, 3.8);
  color.anisotropy = 12;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.copy(color.repeat);
  bump.anisotropy = 8;

  return { color, bump };
}

function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create stone texture canvas.');
  context.fillStyle = '#d7d1c7';
  context.fillRect(0, 0, 512, 512);
  const random = mulberry32(55281);
  for (let i = 0; i < 120; i += 1) {
    context.beginPath();
    const startX = random() * 512;
    const startY = random() * 512;
    context.moveTo(startX, startY);
    const length = 20 + random() * 160;
    for (let t = 0; t < length; t += 10) {
      context.lineTo(startX + t, startY + Math.sin(t * 0.07) * (2 + random() * 4) + (random() - 0.5) * 2);
    }
    const dark = random() > 0.65;
    context.strokeStyle = dark
      ? `rgba(82,76,67,${0.025 + random() * 0.06})`
      : `rgba(255,255,255,${0.025 + random() * 0.07})`;
    context.lineWidth = 0.5 + random() * 1.3;
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.1);
  texture.anisotropy = 8;
  return texture;
}

function shadeColor(color: number, scalar: number): number {
  return new THREE.Color(color).multiplyScalar(scalar).getHex();
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function disposeMaterialLibrary(materials: MaterialLibrary): void {
  const unique = new Set<THREE.Material>(Object.values(materials));
  for (const material of unique) {
    const mat = material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.bumpMap?.dispose();
    mat.normalMap?.dispose();
    mat.roughnessMap?.dispose();
    material.dispose();
  }
}
