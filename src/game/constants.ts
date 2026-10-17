import { CarCustomization } from './types';

export const ROAD_WIDTH = 15; // 4 lanes, ~3.75m each
export const LANES = [-5.25, -1.75, 1.75, 5.25]; // 4 lane center X coordinates
export const ROAD_SEGMENT_LENGTH = 100;
export const ROAD_SEGMENT_COUNT = 5; // Total visible road length = 500m
export const ROAD_Z_START = 50; // behind player
export const ROAD_Z_END = -450; // forward horizon

export const PHYSICS = {
  MIN_SPEED: 0,
  BASE_CRUISE_SPEED: 65, // km/h
  MAX_NORMAL_SPEED: 180, // km/h
  MAX_NITRO_SPEED: 250, // km/h
  ACCELERATION_RATE: 55, // km/h per second
  NITRO_ACCELERATION: 110, // km/h per second
  BRAKE_DECELERATION: 90, // km/h per second
  COASTING_DECELERATION: 20, // km/h per second
  LATERAL_SPEED: 14, // units/sec lateral lane steering
  TILT_MAX_ANGLE: 0.12, // radians roll when steering
  WHEEL_TURN_MAX: 0.4, // radians front wheel yaw
  NITRO_CONSUMPTION_RATE: 28, // % per second
  NITRO_RECHARGE_RATE: 4.5, // % per second passive recharge
  NITRO_BOOST_REFILL: 40, // % from pickup
};

export const CAR_MODELS: CarCustomization[] = [
  {
    id: 'inferno-gt',
    name: 'Inferno GT',
    primaryColor: '#ef4444', // Crimson Red
    accentColor: '#18181b', // Carbon Black
    glassColor: '#0ea5e9',
    neonColor: '#ef4444',
    topSpeed: 210,
    acceleration: 85,
    handling: 90,
  },
  {
    id: 'cyber-wraith',
    name: 'Cyber Wraith',
    primaryColor: '#06b6d4', // Cyan Neon
    accentColor: '#09090b', // Deep Void
    glassColor: '#38bdf8',
    neonColor: '#06b6d4',
    topSpeed: 225,
    acceleration: 88,
    handling: 94,
  },
  {
    id: 'phantom-black',
    name: 'Midnight Phantom',
    primaryColor: '#1e1e24', // Stealth Carbon
    accentColor: '#e11d48', // Ruby trims
    glassColor: '#111827',
    neonColor: '#e11d48',
    topSpeed: 235,
    acceleration: 82,
    handling: 88,
  },
  {
    id: 'golden-bullet',
    name: 'Aero Midas',
    primaryColor: '#f59e0b', // Electric Gold
    accentColor: '#27272a',
    glassColor: '#fef08a',
    neonColor: '#fbbf24',
    topSpeed: 240,
    acceleration: 92,
    handling: 85,
  },
  {
    id: 'toxic-venom',
    name: 'Toxic Venom',
    primaryColor: '#10b981', // Emerald Acid
    accentColor: '#18181b',
    glassColor: '#6ee7b7',
    neonColor: '#10b981',
    topSpeed: 230,
    acceleration: 90,
    handling: 95,
  },
  {
    id: 'hyper-violet',
    name: 'Solar Sunset',
    primaryColor: '#f97316', // Sunset Orange
    accentColor: '#7c3aed', // Purple accent
    glassColor: '#fed7aa',
    neonColor: '#f97316',
    topSpeed: 220,
    acceleration: 87,
    handling: 91,
  },
];
