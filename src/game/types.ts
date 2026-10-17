import type * as THREE from 'three';

export type GameMode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'GARAGE';

export interface CarCustomization {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  glassColor: string;
  neonColor: string;
  topSpeed: number; // km/h base
  acceleration: number; // 0-100 responsiveness
  handling: number;
}

export interface GameStats {
  score: number;
  distance: number; // in meters
  coins: number;
  speed: number; // in km/h
  maxSpeed: number;
  nitro: number; // 0 to 100
  isNitroActive: boolean;
  nearMisses: number;
  multiplier: number;
  highScore: number;
  totalCoins: number;
}

export interface InputState {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brake: boolean;
  nitro: boolean;
}

export interface TrafficCarData {
  mesh: THREE.Group;
  lane: number;
  speed: number;
  z: number;
  x: number;
  targetX: number;
  length: number;
  width: number;
  type: 'sedan' | 'suv' | 'sports' | 'truck';
  passed: boolean;
  nearMissChecked: boolean;
}

export interface CollectibleData {
  mesh: THREE.Group;
  type: 'coin' | 'nitro';
  lane: number;
  x: number;
  z: number;
  collected: boolean;
}
