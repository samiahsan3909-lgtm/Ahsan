import * as THREE from 'three';
import { CarCustomization } from './types';

// Shared procedural textures cache to maximize performance and avoid memory leaks
let asphaltTextureCache: THREE.CanvasTexture | null = null;
let coinFaceTextureCache: THREE.CanvasTexture | null = null;
let billboardTextureCaches: THREE.CanvasTexture[] = [];

/**
 * Creates procedural asphalt canvas texture with lane markings
 */
export function getRoadTexture(): THREE.CanvasTexture {
  if (asphaltTextureCache) return asphaltTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle asphalt grain noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.fillRect(x, y, 1, 1);
  }

  // Road shoulders (curbs)
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, 40, 1024); // Left shoulder
  ctx.fillRect(984, 0, 40, 1024); // Right shoulder

  // Outer solid lines: Yellow on left, White on right
  ctx.fillStyle = '#eab308'; // Amber yellow
  ctx.fillRect(45, 0, 10, 1024);

  ctx.fillStyle = '#f8fafc'; // Crisp white
  ctx.fillRect(969, 0, 10, 1024);

  // 3 Dashed lane dividers (dividing 4 lanes)
  // Lane centers are at: ~160, ~390, ~630, ~860
  // Dividers at: 275, 512, 749
  const dividerX = [275, 512, 749];
  ctx.fillStyle = '#ffffff';

  dividerX.forEach(x => {
    // 8 dashes per 1024px segment
    const dashLength = 70;
    const gapLength = 60;
    const cycle = dashLength + gapLength;
    for (let y = 10; y < 1024; y += cycle) {
      ctx.fillRect(x - 4, y, 8, dashLength);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  asphaltTextureCache = texture;

  return texture;
}

/**
 * Procedural coin face texture with embossed star
 */
function getCoinTexture(): THREE.CanvasTexture {
  if (coinFaceTextureCache) return coinFaceTextureCache;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, 256, 256);

  // Outer ring
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 115, 0, Math.PI * 2);
  ctx.stroke();

  // Embossed Star in center
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  const spikes = 5;
  const outerRadius = 70;
  const innerRadius = 35;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.moveTo(128, 128 - outerRadius);
  for (let i = 0; i < spikes; i++) {
    let x = 128 + Math.cos(rot) * outerRadius;
    let y = 128 + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = 128 + Math.cos(rot) * innerRadius;
    y = 128 + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(128, 128 - outerRadius);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  coinFaceTextureCache = texture;
  return texture;
}

/**
 * Creates soft contact shadow plane
 */
function createContactShadow(width: number, length: number): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(width * 1.3, length * 1.15);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

export interface PlayerCarRef {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  accentMeshes: THREE.Mesh[];
  frontWheels: THREE.Group[];
  allWheels: THREE.Group[];
  exhausts: THREE.Vector3[];
  neonMesh: THREE.Mesh;
  taillightMat: THREE.MeshStandardMaterial;
}

/**
 * Creates a detailed 8-part procedural sports car for the player
 */
export function createPlayerCar(custom: CarCustomization): PlayerCarRef {
  const group = new THREE.Group();
  group.name = 'player-car';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: custom.primaryColor,
    metalness: 0.85,
    roughness: 0.18,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: custom.accentColor,
    metalness: 0.6,
    roughness: 0.35,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: custom.glassColor,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.7,
    transparent: true,
    opacity: 0.85,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x111114,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.95,
    roughness: 0.1,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });

  const neonMat = new THREE.MeshBasicMaterial({
    color: custom.neonColor,
    transparent: true,
    opacity: 0.75,
  });

  const accentMeshes: THREE.Mesh[] = [];

  // 1. Lower Chassis / Splitter
  const chassisGeo = new THREE.BoxGeometry(2.1, 0.25, 4.4);
  const chassis = new THREE.Mesh(chassisGeo, accentMat);
  chassis.position.set(0, 0.3, 0);
  chassis.castShadow = true;
  group.add(chassis);
  accentMeshes.push(chassis);

  // 2. Main Aerodynamic Body Shell
  const bodyGeo = new THREE.BoxGeometry(2.0, 0.55, 4.1);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.set(0, 0.65, 0.05);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 2b. Sloped Front Hood & Nose Cone
  const hoodGeo = new THREE.BoxGeometry(1.85, 0.32, 1.4);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.6, -1.35);
  hood.rotation.x = 0.15; // Sloped aerodynamic nose
  hood.castShadow = true;
  group.add(hood);

  // 3. Cabin / Cockpit Roof & Windshield
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 1.05, 0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // Cockpit carbon roof cap
  const roofCapGeo = new THREE.BoxGeometry(1.5, 0.08, 1.6);
  const roofCap = new THREE.Mesh(roofCapGeo, accentMat);
  roofCap.position.set(0, 1.32, 0.2);
  group.add(roofCap);
  accentMeshes.push(roofCap);

  // 4. Rear Spoiler Wing
  const spoilerPillarGeo = new THREE.BoxGeometry(0.08, 0.35, 0.12);
  const leftPillar = new THREE.Mesh(spoilerPillarGeo, accentMat);
  leftPillar.position.set(-0.7, 1.08, 1.85);
  const rightPillar = leftPillar.clone();
  rightPillar.position.set(0.7, 1.08, 1.85);
  group.add(leftPillar, rightPillar);
  accentMeshes.push(leftPillar, rightPillar);

  const wingGeo = new THREE.BoxGeometry(1.9, 0.06, 0.45);
  const wing = new THREE.Mesh(wingGeo, accentMat);
  wing.position.set(0, 1.25, 1.85);
  wing.rotation.x = -0.08;
  group.add(wing);
  accentMeshes.push(wing);

  // 5. Headlights (Front LED angled strips)
  const headlightGeo = new THREE.BoxGeometry(0.35, 0.1, 0.1);
  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  leftHeadlight.position.set(-0.72, 0.62, -2.05);
  leftHeadlight.rotation.y = 0.15;
  const rightHeadlight = leftHeadlight.clone();
  rightHeadlight.position.set(0.72, 0.62, -2.05);
  rightHeadlight.rotation.y = -0.15;
  group.add(leftHeadlight, rightHeadlight);

  // 6. Taillights (Rear wide continuous neon bar)
  const taillightGeo = new THREE.BoxGeometry(1.7, 0.12, 0.08);
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(0, 0.72, 2.1);
  group.add(taillight);

  // 7. Dual Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.9, roughness: 0.2 });
  const leftExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  leftExhaust.rotation.x = Math.PI / 2;
  leftExhaust.position.set(-0.45, 0.35, 2.15);

  const rightExhaust = leftExhaust.clone();
  rightExhaust.position.set(0.45, 0.35, 2.15);
  group.add(leftExhaust, rightExhaust);

  const exhausts = [
    new THREE.Vector3(-0.45, 0.35, 2.2),
    new THREE.Vector3(0.45, 0.35, 2.2),
  ];

  // 8. 4 Wheels (with tire + chrome rim)
  const frontWheels: THREE.Group[] = [];
  const allWheels: THREE.Group[] = [];

  const wheelPositions = [
    { x: -1.05, y: 0.36, z: -1.35, isFront: true },
    { x: 1.05, y: 0.36, z: -1.35, isFront: true },
    { x: -1.05, y: 0.36, z: 1.35, isFront: false },
    { x: 1.05, y: 0.36, z: 1.35, isFront: false },
  ];

  wheelPositions.forEach(pos => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, rubberMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    // Brake caliper detail
    const caliperGeo = new THREE.BoxGeometry(0.12, 0.16, 0.1);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(pos.x > 0 ? -0.06 : 0.06, 0.1, 0);
    wheelGroup.add(caliper);

    group.add(wheelGroup);
    allWheels.push(wheelGroup);
    if (pos.isFront) {
      frontWheels.push(wheelGroup);
    }
  });

  // 9. Underglow Neon Plane
  const neonGeo = new THREE.PlaneGeometry(1.9, 3.8);
  const neonMesh = new THREE.Mesh(neonGeo, neonMat);
  neonMesh.rotation.x = -Math.PI / 2;
  neonMesh.position.set(0, 0.08, 0);
  group.add(neonMesh);

  // 10. Contact Shadow
  const shadow = createContactShadow(2.1, 4.4);
  group.add(shadow);

  return {
    group,
    bodyMesh,
    accentMeshes,
    frontWheels,
    allWheels,
    exhausts,
    neonMesh,
    taillightMat,
  };
}

/**
 * Creates traffic car mesh based on type and color
 */
export function createTrafficCarMesh(
  type: 'sedan' | 'suv' | 'sports' | 'truck',
  colorHex: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = `traffic-${type}`;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.35,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.4,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    emissive: 0xef4444,
    emissiveIntensity: 1.8,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 2.0,
  });

  let width = 2.0;
  let length = 4.2;

  if (type === 'suv') {
    width = 2.2;
    length = 4.6;
    // Lower body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4.4), bodyMat);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    group.add(body);

    // High Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 3.0), glassMat);
    cabin.position.set(0, 1.35, 0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof rack rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.6), darkMat);
    railL.position.set(-0.85, 1.72, 0.2);
    const railR = railL.clone();
    railR.position.set(0.85, 1.72, 0.2);
    group.add(railL, railR);
  } else if (type === 'truck') {
    width = 2.4;
    length = 6.2;
    // Truck Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.8), bodyMat);
    cab.position.set(0, 1.1, -1.8);
    cab.castShadow = true;
    group.add(cab);

    // Cab Windshield
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.2), glassMat);
    cabGlass.position.set(0, 1.3, -2.65);
    group.add(cabGlass);

    // Freight Box Container
    const freightMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, metalness: 0.2 });
    const container = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.8, 3.8), freightMat);
    container.position.set(0, 1.45, 1.0);
    container.castShadow = true;
    group.add(container);
  } else if (type === 'sports') {
    width = 2.0;
    length = 4.0;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.45, 4.0), bodyMat);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.8), glassMat);
    cabin.position.set(0, 0.95, 0.1);
    cabin.castShadow = true;
    group.add(cabin);

    // Small spoiler
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.3), darkMat);
    wing.position.set(0, 0.9, 1.8);
    group.add(wing);
  } else {
    // Standard Sedan
    width = 2.0;
    length = 4.3;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 4.2), bodyMat);
    body.position.set(0, 0.6, 0);
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.5, 2.2), glassMat);
    cabin.position.set(0, 1.08, 0.2);
    cabin.castShadow = true;
    group.add(cabin);
  }

  // Headlights & Taillights
  const hlGeo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
  const hlL = new THREE.Mesh(hlGeo, headlightMat);
  hlL.position.set(-width * 0.38, 0.55, -length * 0.49);
  const hlR = hlL.clone();
  hlR.position.set(width * 0.38, 0.55, -length * 0.49);
  group.add(hlL, hlR);

  const tlGeo = new THREE.BoxGeometry(0.35, 0.1, 0.08);
  const tlL = new THREE.Mesh(tlGeo, taillightMat);
  tlL.position.set(-width * 0.38, 0.6, length * 0.49);
  const tlR = tlL.clone();
  tlR.position.set(width * 0.38, 0.6, length * 0.49);
  group.add(tlL, tlR);

  // Wheels
  const wheelRadius = type === 'truck' || type === 'suv' ? 0.4 : 0.34;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  const wOffsets = [
    { x: -width * 0.48, z: -length * 0.3 },
    { x: width * 0.48, z: -length * 0.3 },
    { x: -width * 0.48, z: length * 0.3 },
    { x: width * 0.48, z: length * 0.3 },
  ];

  wOffsets.forEach(p => {
    const w = new THREE.Mesh(wheelGeo, rubberMat);
    w.position.set(p.x, wheelRadius, p.z);
    w.castShadow = true;
    group.add(w);
  });

  // Contact shadow
  group.add(createContactShadow(width, length));

  return group;
}

/**
 * Creates 3D Gold Coin
 */
export function createCoinMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'coin';

  const coinTexture = getCoinTexture();
  const coinGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.16, 24);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
    map: coinTexture,
  });

  const coin = new THREE.Mesh(coinGeo, goldMat);
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 1.0;
  coin.castShadow = true;
  group.add(coin);

  // Outer glowing aura halo ring
  const ringGeo = new THREE.RingGeometry(0.95, 1.1, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 1.0;
  group.add(ring);

  // Tiny contact shadow underneath
  const shadow = createContactShadow(1.2, 1.2);
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

/**
 * Creates 3D Nitro Canister
 */
export function createNitroMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'nitro-pickup';

  const cylinderGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.3, 16);
  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
  });
  const cylinder = new THREE.Mesh(cylinderGeo, cyanMat);
  cylinder.position.y = 1.0;
  cylinder.castShadow = true;
  group.add(cylinder);

  // Top valve nozzle
  const valveGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12);
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.1 });
  const valve = new THREE.Mesh(valveGeo, valveMat);
  valve.position.y = 1.8;
  group.add(valve);

  // Glow ring
  const haloGeo = new THREE.TorusGeometry(0.65, 0.05, 12, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.0;
  group.add(halo);

  const shadow = createContactShadow(1.2, 1.2);
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

/**
 * Billboard procedural textures
 */
function getBillboardTexture(index: number): THREE.CanvasTexture {
  if (billboardTextureCaches[index]) return billboardTextureCaches[index];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const messages = [
    { title: 'TURBO RUSH', sub: 'MAXIMUM ADRENALINE', bg: '#0f172a', text: '#06b6d4' },
    { title: 'OCTANE 100', sub: 'HYPER FUEL FOR CHAMPIONS', bg: '#1c1917', text: '#f59e0b' },
    { title: 'APEX RACING', sub: 'RULE THE HIGHWAY', bg: '#18181b', text: '#ef4444' },
    { title: 'NITRO BURST', sub: 'PRESS SPACE FOR BOOST', bg: '#022c22', text: '#10b981' },
  ];

  const m = messages[index % messages.length];

  ctx.fillStyle = m.bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = m.text;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = m.text;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.title, 256, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(m.sub, 256, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  billboardTextureCaches[index] = texture;
  return texture;
}

/**
 * Creates a single 100-meter road segment with road surface, guardrails,
 * street lamps, billboards, trees, and roadside terrain
 */
export function createRoadSegment(segmentLength: number, segmentIndex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `road-segment-${segmentIndex}`;

  // 1. Asphalt Road Mesh
  const roadTexture = getRoadTexture();
  const roadGeo = new THREE.PlaneGeometry(16, segmentLength);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.8,
    metalness: 0.1,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // 2. Roadside Grass/Terrain Bands on Left and Right
  const terrainGeo = new THREE.PlaneGeometry(80, segmentLength);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x142018, // Dark cyber foliage green
    roughness: 0.9,
    metalness: 0.05,
  });

  const leftTerrain = new THREE.Mesh(terrainGeo, terrainMat);
  leftTerrain.rotation.x = -Math.PI / 2;
  leftTerrain.position.set(-48, -0.05, 0);
  leftTerrain.receiveShadow = true;
  group.add(leftTerrain);

  const rightTerrain = new THREE.Mesh(terrainGeo, terrainMat);
  rightTerrain.rotation.x = -Math.PI / 2;
  rightTerrain.position.set(48, -0.05, 0);
  rightTerrain.receiveShadow = true;
  group.add(rightTerrain);

  // 3. Metallic Guardrails
  const railGeo = new THREE.BoxGeometry(0.3, 0.6, segmentLength);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });

  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-8.15, 0.45, 0);
  leftRail.castShadow = true;
  group.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(8.15, 0.45, 0);
  rightRail.castShadow = true;
  group.add(rightRail);

  // 4. Street Lamps along the right side
  const lampInterval = 33.3;
  for (let z = -segmentLength / 2 + 15; z < segmentLength / 2; z += lampInterval) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(9.5, 0, z);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 7, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.5;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Curved arm extending over the road
    const armGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(-1.0, 7.0, 0);
    lampGroup.add(arm);

    // Glowing LED Luminaire
    const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
    const lampHeadMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });
    const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
    lampHead.position.set(-1.8, 6.9, 0);
    lampGroup.add(lampHead);

    group.add(lampGroup);
  }

  // 5. Roadside Trees (Left and Right margins)
  const treeCount = 6;
  const treeZStep = segmentLength / treeCount;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f271d, roughness: 0.9 });
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });

  for (let i = 0; i < treeCount; i++) {
    const zPos = -segmentLength / 2 + i * treeZStep + Math.sin(i * 1.5) * 4;

    // Left tree
    const leftTree = createLowPolyTree(trunkMat, leavesMat);
    leftTree.position.set(-13 - (i % 3) * 3, 0, zPos);
    group.add(leftTree);

    // Right tree
    const rightTree = createLowPolyTree(trunkMat, leavesMat);
    rightTree.position.set(14 + ((i + 1) % 3) * 3, 0, zPos);
    group.add(rightTree);
  }

  // 6. Neon Billboards (every other segment)
  if (segmentIndex % 2 === 0) {
    const billboard = createBillboard(segmentIndex);
    billboard.position.set(13.5, 0, -10);
    group.add(billboard);
  }

  // 7. Distant City Skyline Silhouette (buildings placed far on the sides)
  for (let b = 0; b < 4; b++) {
    const bHeight = 15 + Math.random() * 25;
    const bWidth = 8 + Math.random() * 8;
    const bDepth = 8 + Math.random() * 8;
    const buildingGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.8,
      metalness: 0.3,
    });
    const bLeft = new THREE.Mesh(buildingGeo, buildingMat);
    bLeft.position.set(-35 - Math.random() * 15, bHeight / 2, -segmentLength / 2 + b * 25);
    group.add(bLeft);

    const bRight = new THREE.Mesh(buildingGeo, buildingMat);
    bRight.position.set(35 + Math.random() * 15, bHeight / 2, -segmentLength / 2 + b * 25 + 12);
    group.add(bRight);
  }

  return group;
}

function createLowPolyTree(trunkMat: THREE.Material, leavesMat: THREE.Material): THREE.Group {
  const tree = new THREE.Group();
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 6);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage (Cone)
  const foliageGeo = new THREE.ConeGeometry(1.6, 4.0, 7);
  const foliage = new THREE.Mesh(foliageGeo, leavesMat);
  foliage.position.y = 3.6;
  foliage.castShadow = true;
  tree.add(foliage);

  const scale = 0.85 + Math.random() * 0.35;
  tree.scale.set(scale, scale, scale);
  tree.rotation.y = Math.random() * Math.PI * 2;
  return tree;
}

function createBillboard(index: number): THREE.Group {
  const group = new THREE.Group();

  // Support posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
  const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 9, 8);

  const postL = new THREE.Mesh(postGeo, postMat);
  postL.position.set(-2.5, 4.5, 0);
  const postR = new THREE.Mesh(postGeo, postMat);
  postR.position.set(2.5, 4.5, 0);
  group.add(postL, postR);

  // Billboard Sign Frame
  const frameGeo = new THREE.BoxGeometry(6.6, 3.6, 0.4);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.5 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 8.5, 0);
  group.add(frame);

  // Sign display plane with illuminated graphic
  const boardTexture = getBillboardTexture(index);
  const signGeo = new THREE.PlaneGeometry(6.0, 3.0);
  const signMat = new THREE.MeshBasicMaterial({
    map: boardTexture,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 8.5, 0.22);
  group.add(sign);

  return group;
}
