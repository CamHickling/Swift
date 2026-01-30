// Bluetooth UUIDs
export const FTMS_SERVICE_UUID = 0x1826;
export const FTMS_INDOOR_BIKE_DATA_UUID = 0x2ad2;
export const FTMS_CONTROL_POINT_UUID = 0x2ad9;
export const FTMS_FEATURE_UUID = 0x2acc;

export const HEART_RATE_SERVICE_UUID = 0x180d;
export const HEART_RATE_MEASUREMENT_UUID = 0x2a37;

// FTMS Control Point Op Codes
export const FTMS_OP_REQUEST_CONTROL = 0x00;
export const FTMS_OP_RESET = 0x01;
export const FTMS_OP_SET_TARGET_POWER = 0x05;
export const FTMS_OP_SET_TARGET_RESISTANCE = 0x04;
export const FTMS_OP_SET_INDOOR_BIKE_SIMULATION = 0x11;

// Data types
export interface IndoorBikeData {
  speed: number; // km/h
  cadence: number; // rpm
  power: number; // watts
  heartRate?: number; // bpm
  timestamp: number;
}

export interface HeartRateData {
  heartRate: number; // bpm
  contactDetected?: boolean;
  timestamp: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'trainer' | 'heartRate';
  connected: boolean;
}

export type TrainerControlMode = 'erg' | 'resistance' | 'simulation';

export interface TrainerControl {
  mode: TrainerControlMode;
  targetPower?: number; // watts (ERG mode)
  resistanceLevel?: number; // 0-100 (resistance mode)
  grade?: number; // percentage (simulation mode)
}
