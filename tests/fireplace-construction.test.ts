import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { clampConfig, DEFAULT_CONFIG } from '../src/model/config';
import { buildFireplace } from '../src/model/fireplace';
import type { MaterialLibrary } from '../src/model/materials';
import type { PartMetadata } from '../src/model/primitives';

const sharedMaterial = new THREE.MeshStandardMaterial();
const testMaterials = new Proxy({} as MaterialLibrary, {
  get: () => sharedMaterial,
});

describe('fireplace construction geometry', () => {
  it('places the thin steel bezel inside the nominal opening', () => {
    const config = clampConfig(DEFAULT_CONFIG);
    const { group } = buildFireplace(config, testMaterials);
    const left = group.getObjectByName('Firebox left metal frame');
    const top = group.getObjectByName('Firebox top metal frame');
    if (!left || !top) throw new Error('Missing firebox bezel parts.');

    const leftPart = left.userData.part as PartMetadata;
    const topPart = top.userData.part as PartMetadata;
    expect(left.position.x - leftPart.width / 2).toBeCloseTo(
      -config.fireplaceOpeningWidth / 2,
      10,
    );
    expect(left.position.x + leftPart.width / 2).toBeGreaterThan(
      -config.fireplaceOpeningWidth / 2,
    );
    expect(top.position.y + topPart.height / 2).toBeCloseTo(
      1 + config.fireplaceOpeningHeight,
      10,
    );
  });

  it('reports and centers the full projecting depth', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      mantelDepth: 18,
      hearthDepth: 10,
      showReferenceGhost: true,
    });
    const { group } = buildFireplace(config, testMaterials);
    const assembly = group.userData.part as PartMetadata;
    const envelope = group.getObjectByName('Fireplace design envelope');
    if (!envelope) throw new Error('Missing fireplace design envelope.');

    expect(assembly.depth).toBe(18);
    expect((envelope.userData.part as PartMetadata).depth).toBe(18);
    expect(envelope.position.z).toBe(9);
  });

  it('scales the center sunburst within a short frieze panel', () => {
    const config = clampConfig({
      ...DEFAULT_CONFIG,
      fireplaceOpeningHeight: 20,
      mantelHeight: 34,
    });
    const { group } = buildFireplace(config, testMaterials);
    const sunburst = group.getObjectByName('Mantel center sunburst');
    const panel = group.getObjectByName('Mantel framed center wave panel');
    if (!sunburst || !panel) throw new Error('Missing mantel relief geometry.');

    const sunburstPart = sunburst.userData.part as PartMetadata;
    const panelPart = panel.userData.part as PartMetadata;
    expect(sunburstPart.height).toBeLessThanOrEqual(panelPart.height);
  });
});
