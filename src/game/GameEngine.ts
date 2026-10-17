import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CAR_MODELS,
  LANES,
  PHYSICS,
  ROAD_SEGMENT_COUNT,
  ROAD_SEGMENT_LENGTH,
  ROAD_WIDTH,
} from './constants';
import {
  createCoinMesh,
  createNitroMesh,
  createPlayerCar,
  createRoadSegment,
  createTrafficCarMesh,
  PlayerCarRef,
} from './models';
import {
  CarCustomization,
  CollectibleData,
  GameMode,
  GameStats,
  InputState,
  TrafficCarData,
} from './types';
import { sounds } from '../audio/SoundEffects';

// Pre-allocated math helpers for zero-GC in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _boxA = new THREE.Box3();
const _boxB = new THREE.Box3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onNearMiss: (points: number) => void;
  onGameOver: (finalStats: GameStats) => void;
  onCoinCollected: (totalCoins: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock: THREE.Clock = new THREE.Clock();
  private reqId: number | null = null;
  private isDestroyed: boolean = false;

  // Game Mode
  private mode: GameMode = 'MENU';
  private currentCarCustomization: CarCustomization = CAR_MODELS[0];

  // Lighting & Rig
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Road
  private roadSegments: THREE.Group[] = [];
  private roadOffsetZ: number = 0;

  // Player
  private playerCarRef!: PlayerCarRef;
  private playerX: number = 0;
  private playerTargetX: number = 0;
  private playerZ: number = 0;
  private playerSpeedKmH: number = 0;
  private playerTilt: number = 0;
  private playerWheelSteer: number = 0;
  private isCrashing: boolean = false;
  private crashRotation: number = 0;
  private crashTimer: number = 0;

  // Camera dynamics
  private cameraShakeIntensity: number = 0;
  private targetCameraFov: number = 60;
  private baseCameraPos = new THREE.Vector3(0, 4.2, 7.8);
  private cameraLookTarget = new THREE.Vector3(0, 1.2, -6);

  // Garage Turntable Camera
  private garageAngle: number = 0;

  // Traffic
  private traffic: TrafficCarData[] = [];
  private nextTrafficSpawnZ: number = -120;
  private trafficColors = ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#9333ea', '#ea580c', '#ffffff', '#334155'];

  // Collectibles
  private collectibles: CollectibleData[] = [];
  private nextCoinSpawnZ: number = -80;
  private nextNitroSpawnZ: number = -220;

  // Particles
  private nitroParticles: THREE.Points | null = null;
  private nitroParticlePositions: Float32Array = new Float32Array(150 * 3);
  private nitroParticleLifetimes: Float32Array = new Float32Array(150);

  private crashParticles: THREE.Points | null = null;
  private crashParticleVelocities: Float32Array = new Float32Array(120 * 3);
  private crashParticlePositions: Float32Array = new Float32Array(120 * 3);

  // Hitstop
  private hitstopDuration: number = 0;

  // Stats
  private stats: GameStats = {
    score: 0,
    distance: 0,
    coins: 0,
    speed: 0,
    maxSpeed: 0,
    nitro: 100,
    isNitroActive: false,
    nearMisses: 0,
    multiplier: 1,
    highScore: 0,
    totalCoins: 0,
  };

  // Inputs
  private input: InputState = {
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
  };

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load saved high score & coins from localStorage
    const savedHighScore = localStorage.getItem('turbo_rush_high_score');
    if (savedHighScore) {
      this.stats.highScore = parseInt(savedHighScore, 10) || 0;
    }
    const savedCoins = localStorage.getItem('turbo_rush_total_coins');
    if (savedCoins) {
      this.stats.totalCoins = parseInt(savedCoins, 10) || 0;
    }

    this.initThree();
    this.initEnvironment();
    this.initRoad();
    this.initPlayer();
    this.initParticles();
    this.bindEvents();

    this.animate = this.animate.bind(this);
    this.clock.start();
    this.reqId = requestAnimationFrame(this.animate);
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913); // Atmospheric midnight sky
    this.scene.fog = new THREE.FogExp2(0x060913, 0.0075); // Blends road gracefully into the horizon

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.copy(this.baseCameraPos);

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Studio Environment map using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();
  }

  private initEnvironment() {
    // 3-Point Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    // Key Light (Warm golden sunlight)
    this.keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    this.keyLight.position.set(25, 45, 20);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 120;
    const d = 30;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Gentle back/rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-20, 15, -40);
    this.scene.add(rimLight);
  }

  private initRoad() {
    this.roadSegments = [];
    for (let i = 0; i < ROAD_SEGMENT_COUNT; i++) {
      const segment = createRoadSegment(ROAD_SEGMENT_LENGTH, i);
      // Position segment so they chain continuously from behind player to horizon
      segment.position.z = -i * ROAD_SEGMENT_LENGTH + 40;
      this.scene.add(segment);
      this.roadSegments.push(segment);
    }
  }

  private initPlayer() {
    this.playerCarRef = createPlayerCar(this.currentCarCustomization);
    this.scene.add(this.playerCarRef.group);
    this.resetPlayerPosition();
  }

  private initParticles() {
    // Nitro Flame Particles
    const nitroGeo = new THREE.BufferGeometry();
    nitroGeo.setAttribute('position', new THREE.BufferAttribute(this.nitroParticlePositions, 3));
    const nitroMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.nitroParticles = new THREE.Points(nitroGeo, nitroMat);
    this.scene.add(this.nitroParticles);

    // Crash Sparks Particles
    const crashGeo = new THREE.BufferGeometry();
    crashGeo.setAttribute('position', new THREE.BufferAttribute(this.crashParticlePositions, 3));
    const crashMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.crashParticles = new THREE.Points(crashGeo, crashMat);
    this.crashParticles.visible = false;
    this.scene.add(this.crashParticles);
  }

  private resetPlayerPosition() {
    this.playerX = 0;
    this.playerTargetX = 0;
    this.playerZ = 0;
    this.playerSpeedKmH = 0;
    this.playerTilt = 0;
    this.playerWheelSteer = 0;
    this.isCrashing = false;
    this.crashRotation = 0;
    this.crashTimer = 0;

    if (this.playerCarRef) {
      this.playerCarRef.group.position.set(0, 0, 0);
      this.playerCarRef.group.rotation.set(0, 0, 0);
    }
  }

  // --- Input & Controls ---
  public setInput(input: Partial<InputState>) {
    Object.assign(this.input, input);
  }

  public setMode(mode: GameMode) {
    this.mode = mode;

    if (mode === 'PLAYING') {
      sounds.startEngine();
      this.clock.start();
    } else if (mode === 'PAUSED' || mode === 'GAMEOVER' || mode === 'GARAGE' || mode === 'MENU') {
      sounds.stopEngine();
    }
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public resetGame() {
    this.resetPlayerPosition();
    this.clearTraffic();
    this.clearCollectibles();

    this.stats.score = 0;
    this.stats.distance = 0;
    this.stats.coins = 0;
    this.stats.speed = 0;
    this.stats.maxSpeed = 0;
    this.stats.nitro = 100;
    this.stats.isNitroActive = false;
    this.stats.nearMisses = 0;
    this.stats.multiplier = 1;

    this.nextTrafficSpawnZ = -100;
    this.nextCoinSpawnZ = -60;
    this.nextNitroSpawnZ = -220;
    this.cameraShakeIntensity = 0;

    this.setMode('PLAYING');
  }

  public setCarCustomization(custom: CarCustomization) {
    this.currentCarCustomization = custom;

    // Update player car materials
    if (this.playerCarRef) {
      (this.playerCarRef.bodyMesh.material as THREE.MeshStandardMaterial).color.set(custom.primaryColor);
      this.playerCarRef.accentMeshes.forEach(m => {
        (m.material as THREE.MeshStandardMaterial).color.set(custom.accentColor);
      });
      (this.playerCarRef.neonMesh.material as THREE.MeshBasicMaterial).color.set(custom.neonColor);
    }
  }

  private clearTraffic() {
    this.traffic.forEach(t => this.scene.remove(t.mesh));
    this.traffic = [];
  }

  private clearCollectibles() {
    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.collectibles = [];
  }

  // --- Game Loop ---
  private animate() {
    if (this.isDestroyed) return;

    this.reqId = requestAnimationFrame(this.animate);

    const rawDelta = this.clock.getDelta();
    // Clamp frame delta time to avoid physics tunneling during tab switches
    const dt = Math.min(rawDelta, 0.05);

    if (this.hitstopDuration > 0) {
      this.hitstopDuration -= dt;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.mode === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (this.mode === 'GARAGE' || this.mode === 'MENU') {
      this.updateShowroom(dt);
    }

    // Camera shake decay
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = THREE.MathUtils.damp(this.cameraShakeIntensity, 0, 8, dt);
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updatePlaying(dt: number) {
    if (this.isCrashing) {
      this.updateCrashAnimation(dt);
      return;
    }

    // 1. Acceleration & Braking Physics
    const custom = this.currentCarCustomization;
    const maxNormalSpeed = custom.topSpeed;
    const maxNitroSpeed = maxNormalSpeed * 1.25;

    let targetSpeed = PHYSICS.BASE_CRUISE_SPEED;
    const wantsAccelerate = this.input.accelerate;
    const wantsBrake = this.input.brake;
    const wantsNitro = this.input.nitro && this.stats.nitro > 5;

    if (wantsNitro) {
      this.stats.isNitroActive = true;
      targetSpeed = maxNitroSpeed;
      this.playerSpeedKmH += PHYSICS.NITRO_ACCELERATION * dt;
      this.stats.nitro = Math.max(0, this.stats.nitro - PHYSICS.NITRO_CONSUMPTION_RATE * dt);
      if (this.stats.nitro <= 0) {
        this.stats.isNitroActive = false;
      }
    } else {
      this.stats.isNitroActive = false;
      // Passive nitro recharge
      this.stats.nitro = Math.min(100, this.stats.nitro + PHYSICS.NITRO_RECHARGE_RATE * dt);

      if (wantsAccelerate) {
        targetSpeed = maxNormalSpeed;
        this.playerSpeedKmH += PHYSICS.ACCELERATION_RATE * (custom.acceleration / 80) * dt;
      } else if (wantsBrake) {
        targetSpeed = PHYSICS.MIN_SPEED;
        this.playerSpeedKmH -= PHYSICS.BRAKE_DECELERATION * dt;
        sounds.playBrake();
      } else {
        // Natural coasting
        if (this.playerSpeedKmH > PHYSICS.BASE_CRUISE_SPEED) {
          this.playerSpeedKmH -= PHYSICS.COASTING_DECELERATION * dt;
        } else if (this.playerSpeedKmH < PHYSICS.BASE_CRUISE_SPEED) {
          this.playerSpeedKmH += PHYSICS.ACCELERATION_RATE * 0.5 * dt;
        }
      }
    }

    this.playerSpeedKmH = Math.max(0, Math.min(this.playerSpeedKmH, wantsNitro ? maxNitroSpeed : maxNormalSpeed));

    // Update Taillights emissive on braking
    if (wantsBrake) {
      this.playerCarRef.taillightMat.emissiveIntensity = 4.5;
    } else {
      this.playerCarRef.taillightMat.emissiveIntensity = 2.0;
    }

    // 2. Lateral Steering Physics
    let steerDir = 0;
    if (this.input.steerLeft) steerDir -= 1;
    if (this.input.steerRight) steerDir += 1;

    const lateralSpeed = PHYSICS.LATERAL_SPEED * (custom.handling / 90) * (this.playerSpeedKmH / 120 + 0.3);
    this.playerX += steerDir * lateralSpeed * dt;

    // Road side boundary clamping (soft bounce)
    const maxRoadX = ROAD_WIDTH / 2 - 1.25;
    if (this.playerX < -maxRoadX) {
      this.playerX = -maxRoadX;
      this.cameraShakeIntensity = 0.15;
    } else if (this.playerX > maxRoadX) {
      this.playerX = maxRoadX;
      this.cameraShakeIntensity = 0.15;
    }

    // 3. Body Roll & Front Wheel Yaw
    const targetTilt = -steerDir * PHYSICS.TILT_MAX_ANGLE;
    this.playerTilt = THREE.MathUtils.damp(this.playerTilt, targetTilt, 10, dt);

    const targetWheelSteer = steerDir * PHYSICS.WHEEL_TURN_MAX;
    this.playerWheelSteer = THREE.MathUtils.damp(this.playerWheelSteer, targetWheelSteer, 14, dt);

    // Apply to player car
    this.playerCarRef.group.position.x = this.playerX;
    this.playerCarRef.group.rotation.z = this.playerTilt;
    this.playerCarRef.group.rotation.y = -this.playerTilt * 0.5;

    // Rotate front wheels
    this.playerCarRef.frontWheels.forEach(w => {
      w.rotation.y = this.playerWheelSteer;
    });

    // Spin all wheels based on forward motion
    const wheelRotSpeed = (this.playerSpeedKmH / 3.6) / 0.35 * dt;
    this.playerCarRef.allWheels.forEach(w => {
      w.children[0].rotation.x += wheelRotSpeed;
    });

    // 4. Infinite Road Scrolling
    // Speed in units/sec: 1 km/h = (1000m / 3600s) = ~0.277 m/s
    const speedUnitsPerSec = (this.playerSpeedKmH / 3.6);
    const frameDistance = speedUnitsPerSec * dt;

    this.roadSegments.forEach(segment => {
      segment.position.z += frameDistance;
      // When segment scrolls past the camera behind the player, wrap it back to front
      if (segment.position.z > 70) {
        segment.position.z -= ROAD_SEGMENT_COUNT * ROAD_SEGMENT_LENGTH;
      }
    });

    // 5. Traffic Update & Spawning
    this.updateTraffic(dt, frameDistance);

    // 6. Collectibles Update & Spawning
    this.updateCollectibles(dt, frameDistance);

    // 7. Nitro Exhaust Particles
    this.updateNitroParticles(dt, wantsNitro);

    // 8. Stats & Distance Update
    this.stats.distance += frameDistance;
    this.stats.speed = Math.round(this.playerSpeedKmH);
    if (this.stats.speed > this.stats.maxSpeed) {
      this.stats.maxSpeed = this.stats.speed;
    }

    // Score increases with speed and distance
    const speedBonus = (this.playerSpeedKmH / 100);
    this.stats.score += Math.round(frameDistance * speedBonus * this.stats.multiplier);

    // Dynamic difficulty: increase traffic density as distance grows
    this.nextTrafficSpawnZ = THREE.MathUtils.damp(
      this.nextTrafficSpawnZ,
      Math.max(-80, -140 + Math.min(this.stats.distance * 0.02, 60)),
      1,
      dt
    );

    // 9. Camera Dynamic Follow & FOV Warp
    const targetFov = wantsNitro ? 75 : 60;
    this.targetCameraFov = THREE.MathUtils.damp(this.targetCameraFov, targetFov, 6, dt);
    this.camera.fov = this.targetCameraFov;
    this.camera.updateProjectionMatrix();

    // Camera smoothly follows player lateral X with subtle lag
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.playerX * 0.6, 8, dt);
    this.camera.position.y = this.baseCameraPos.y + (wantsNitro ? -0.2 : 0);
    this.camera.position.z = this.baseCameraPos.z + (wantsNitro ? 0.6 : 0);

    _vec3A.set(this.playerX * 0.4, this.cameraLookTarget.y, this.cameraLookTarget.z);
    this.camera.lookAt(_vec3A);

    // Audio Engine Update
    sounds.updateEngine(this.playerSpeedKmH, wantsNitro);

    // Notify React HUD
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private updateTraffic(dt: number, frameDistance: number) {
    // 1. Move active traffic cars
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      // Traffic car drives forward at its own speed (km/h)
      const carSpeedUnits = (car.speed / 3.6);
      // Relative motion towards player
      car.z += (frameDistance - carSpeedUnits * dt);
      car.mesh.position.z = car.z;

      // Subtle lateral swaying within lane
      car.mesh.position.x = THREE.MathUtils.damp(car.mesh.position.x, car.targetX, 2, dt);

      // Check Collision with player
      _boxA.setFromObject(this.playerCarRef.bodyMesh);
      _boxB.setFromObject(car.mesh);

      // Tight collision box for forgiving, fun arcade racing
      _boxA.expandByScalar(-0.15);
      _boxB.expandByScalar(-0.15);

      if (_boxA.intersectsBox(_boxB)) {
        this.triggerCrash();
        return;
      }

      // Check Near-Miss Bonus (swooshing past within 2.8m laterally while overtaking)
      if (!car.nearMissChecked && car.z > -2 && car.z < 3) {
        const lateralDist = Math.abs(this.playerX - car.mesh.position.x);
        if (lateralDist > 1.2 && lateralDist < 2.9) {
          car.nearMissChecked = true;
          this.stats.nearMisses += 1;
          const points = 250 * this.stats.multiplier;
          this.stats.score += points;
          sounds.playNearMiss();
          this.cameraShakeIntensity = 0.18;
          this.callbacks.onNearMiss(points);
        }
      }

      // Remove traffic car if far behind player
      if (car.z > 35) {
        this.scene.remove(car.mesh);
        this.traffic.splice(i, 1);
      }
    }

    // 2. Spawn new traffic at forward horizon
    if (this.traffic.length < 9) {
      const minSpawnZ = -360;
      let lowestZ = 0;
      this.traffic.forEach(t => {
        if (t.z < lowestZ) lowestZ = t.z;
      });

      if (lowestZ > minSpawnZ + 45) {
        this.spawnTrafficCar(minSpawnZ);
      }
    }
  }

  private spawnTrafficCar(spawnZ: number) {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    const laneX = LANES[laneIdx];

    // Ensure no existing car is already at this lane near spawnZ
    const tooClose = this.traffic.some(t => Math.abs(t.x - laneX) < 1.0 && Math.abs(t.z - spawnZ) < 40);
    if (tooClose) return;

    const types: ('sedan' | 'suv' | 'sports' | 'truck')[] = ['sedan', 'suv', 'sports', 'truck'];
    const type = types[Math.floor(Math.random() * types.length)];
    const color = this.trafficColors[Math.floor(Math.random() * this.trafficColors.length)];

    const mesh = createTrafficCarMesh(type, color);
    mesh.position.set(laneX, 0, spawnZ);
    this.scene.add(mesh);

    // Traffic travels between 75 and 115 km/h
    const speed = 75 + Math.random() * 40;

    this.traffic.push({
      mesh,
      lane: laneIdx,
      speed,
      z: spawnZ,
      x: laneX,
      targetX: laneX + (Math.random() - 0.5) * 0.4,
      length: type === 'truck' ? 6.2 : 4.4,
      width: type === 'truck' ? 2.4 : 2.0,
      type,
      passed: false,
      nearMissChecked: false,
    });
  }

  private updateCollectibles(dt: number, frameDistance: number) {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.z += frameDistance;
      item.mesh.position.z = item.z;

      // Spin collectible
      item.mesh.rotation.y += 3.5 * dt;
      // Gentle bobbing
      item.mesh.position.y = 0.8 + Math.sin(this.clock.getElapsedTime() * 5 + item.x) * 0.2;

      // Check collision with player
      const dx = Math.abs(this.playerX - item.x);
      const dz = Math.abs(this.playerZ - item.z);

      if (dx < 1.6 && dz < 2.5 && !item.collected) {
        item.collected = true;
        this.scene.remove(item.mesh);
        this.collectibles.splice(i, 1);

        if (item.type === 'coin') {
          this.stats.coins += 1;
          this.stats.totalCoins += 1;
          this.stats.score += 100 * this.stats.multiplier;
          localStorage.setItem('turbo_rush_total_coins', String(this.stats.totalCoins));
          sounds.playCoin();
          this.callbacks.onCoinCollected(this.stats.totalCoins);
        } else {
          // Nitro canister
          this.stats.nitro = Math.min(100, this.stats.nitro + PHYSICS.NITRO_BOOST_REFILL);
          this.stats.score += 200;
          sounds.playNitroRefill();
        }
        continue;
      }

      // Recycle if passed behind player
      if (item.z > 25) {
        this.scene.remove(item.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // Spawn Coin Chains or Nitro Pickups
    if (this.collectibles.length < 12) {
      if (Math.random() < 0.04) {
        this.spawnCoinGroup(-280);
      }
      if (Math.random() < 0.012) {
        this.spawnNitroPickup(-320);
      }
    }
  }

  private spawnCoinGroup(startZ: number) {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    const laneX = LANES[laneIdx];
    const count = 3 + Math.floor(Math.random() * 4);

    for (let c = 0; c < count; c++) {
      const mesh = createCoinMesh();
      const z = startZ - c * 7;
      mesh.position.set(laneX, 0.8, z);
      this.scene.add(mesh);

      this.collectibles.push({
        mesh,
        type: 'coin',
        lane: laneIdx,
        x: laneX,
        z,
        collected: false,
      });
    }
  }

  private spawnNitroPickup(startZ: number) {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    const laneX = LANES[laneIdx];

    const mesh = createNitroMesh();
    mesh.position.set(laneX, 0.8, startZ);
    this.scene.add(mesh);

    this.collectibles.push({
      mesh,
      type: 'nitro',
      lane: laneIdx,
      x: laneX,
      z: startZ,
      collected: false,
    });
  }

  private updateNitroParticles(dt: number, isActive: boolean) {
    if (!this.nitroParticles) return;

    const positions = this.nitroParticlePositions;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      this.nitroParticleLifetimes[i] -= dt * 3.5;

      if (this.nitroParticleLifetimes[i] <= 0 && isActive) {
        // Respawn at one of the two player exhausts
        const exhaustIdx = i % 2;
        const offset = this.playerCarRef.exhausts[exhaustIdx];
        positions[i * 3] = this.playerX + offset.x + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = offset.y + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = this.playerZ + offset.z;
        this.nitroParticleLifetimes[i] = 0.25 + Math.random() * 0.2;
      } else {
        // Drift backward rapidly
        positions[i * 3 + 2] += (this.playerSpeedKmH / 3.6 + 15) * dt;
        positions[i * 3 + 1] += (Math.random() - 0.3) * dt;
      }
    }

    this.nitroParticles.geometry.attributes.position.needsUpdate = true;
    this.nitroParticles.visible = isActive;
  }

  private triggerCrash() {
    this.isCrashing = true;
    this.crashTimer = 0;
    this.hitstopDuration = 0.05; // 50ms dramatic hitstop
    this.cameraShakeIntensity = 0.65;
    sounds.playCrash();
    sounds.stopEngine();

    // Trigger crash particle burst
    if (this.crashParticles) {
      this.crashParticles.visible = true;
      const count = this.crashParticlePositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.crashParticlePositions[i * 3] = this.playerX;
        this.crashParticlePositions[i * 3 + 1] = 0.8;
        this.crashParticlePositions[i * 3 + 2] = this.playerZ;

        this.crashParticleVelocities[i * 3] = (Math.random() - 0.5) * 24;
        this.crashParticleVelocities[i * 3 + 1] = 5 + Math.random() * 15;
        this.crashParticleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 24;
      }
      this.crashParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  private updateCrashAnimation(dt: number) {
    this.crashTimer += dt;

    // Spin car around and bounce
    this.crashRotation += 12 * dt;
    this.playerCarRef.group.rotation.y = this.crashRotation;
    this.playerCarRef.group.position.y = Math.max(0, Math.sin(this.crashTimer * 6) * 1.5);
    this.playerCarRef.group.position.x += Math.sin(this.crashTimer * 10) * 0.1;

    // Update crash sparks
    if (this.crashParticles && this.crashParticles.visible) {
      const count = this.crashParticlePositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.crashParticlePositions[i * 3] += this.crashParticleVelocities[i * 3] * dt;
        this.crashParticlePositions[i * 3 + 1] += this.crashParticleVelocities[i * 3 + 1] * dt;
        this.crashParticlePositions[i * 3 + 2] += this.crashParticleVelocities[i * 3 + 2] * dt;
        this.crashParticleVelocities[i * 3 + 1] -= 25 * dt; // gravity
      }
      this.crashParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Transition to GAMEOVER screen after 1.4s of crash showcase
    if (this.crashTimer > 1.4) {
      // Save High Score
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
        localStorage.setItem('turbo_rush_high_score', String(this.stats.highScore));
      }

      this.setMode('GAMEOVER');
      this.callbacks.onGameOver({ ...this.stats });
    }
  }

  private updateShowroom(dt: number) {
    // Elegant rotating camera around the player car in garage / menu
    this.garageAngle += 0.45 * dt;
    const radius = 7.5;
    const camX = Math.sin(this.garageAngle) * radius;
    const camZ = Math.cos(this.garageAngle) * radius;

    this.camera.position.set(camX, 2.5, camZ);
    this.camera.lookAt(0, 0.8, 0);

    // Slowly spin player wheels
    this.playerCarRef.allWheels.forEach(w => {
      w.children[0].rotation.x += 0.5 * dt;
    });
  }

  // Window resize handler
  public handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.handleResize());
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
    }
    sounds.stopEngine();

    // Clean Three.js resources
    this.scene.clear();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
