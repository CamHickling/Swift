import { create } from 'zustand';
import type { IndoorBikeData, HeartRateData } from '../types/bluetooth';

interface LiveMetrics {
  power: number;
  cadence: number;
  heartRate: number;
  speed: number;
  timestamp: number;
}

interface LiveDataState {
  // Current metrics
  current: LiveMetrics;

  // Recent history for smoothing/display (last 30 seconds)
  powerHistory: number[];
  heartRateHistory: number[];
  cadenceHistory: number[];

  // 3-second averages
  power3s: number;
  heartRate3s: number;
  cadence3s: number;

  // Session stats
  maxPower: number;
  maxHeartRate: number;
  maxCadence: number;

  // Actions
  updateFromTrainer: (data: IndoorBikeData) => void;
  updateFromHeartRate: (data: HeartRateData) => void;
  reset: () => void;
}

const HISTORY_LENGTH = 30; // 30 seconds of history

function calculateAverage(arr: number[], count: number): number {
  const slice = arr.slice(-count);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

const initialMetrics: LiveMetrics = {
  power: 0,
  cadence: 0,
  heartRate: 0,
  speed: 0,
  timestamp: 0,
};

export const useLiveDataStore = create<LiveDataState>((set, get) => ({
  current: { ...initialMetrics },
  powerHistory: [],
  heartRateHistory: [],
  cadenceHistory: [],
  power3s: 0,
  heartRate3s: 0,
  cadence3s: 0,
  maxPower: 0,
  maxHeartRate: 0,
  maxCadence: 0,

  updateFromTrainer: (data) => {
    const state = get();

    // Update power history
    const newPowerHistory = [...state.powerHistory, data.power].slice(-HISTORY_LENGTH);
    const newCadenceHistory = [...state.cadenceHistory, data.cadence].slice(-HISTORY_LENGTH);

    // Calculate 3-second averages (assuming ~4Hz data rate, so ~12 samples)
    const power3s = calculateAverage(newPowerHistory, 12);
    const cadence3s = calculateAverage(newCadenceHistory, 12);

    set({
      current: {
        ...state.current,
        power: data.power,
        cadence: data.cadence,
        speed: data.speed,
        heartRate: data.heartRate ?? state.current.heartRate,
        timestamp: data.timestamp,
      },
      powerHistory: newPowerHistory,
      cadenceHistory: newCadenceHistory,
      power3s,
      cadence3s,
      maxPower: Math.max(state.maxPower, data.power),
      maxCadence: Math.max(state.maxCadence, data.cadence),
      maxHeartRate: data.heartRate ? Math.max(state.maxHeartRate, data.heartRate) : state.maxHeartRate,
    });
  },

  updateFromHeartRate: (data) => {
    const state = get();

    // Update heart rate history
    const newHeartRateHistory = [...state.heartRateHistory, data.heartRate].slice(-HISTORY_LENGTH);

    // Calculate 3-second average (HR sensors typically 1Hz, so 3 samples)
    const heartRate3s = calculateAverage(newHeartRateHistory, 3);

    set({
      current: {
        ...state.current,
        heartRate: data.heartRate,
        timestamp: data.timestamp,
      },
      heartRateHistory: newHeartRateHistory,
      heartRate3s,
      maxHeartRate: Math.max(state.maxHeartRate, data.heartRate),
    });
  },

  reset: () => {
    set({
      current: { ...initialMetrics },
      powerHistory: [],
      heartRateHistory: [],
      cadenceHistory: [],
      power3s: 0,
      heartRate3s: 0,
      cadence3s: 0,
      maxPower: 0,
      maxHeartRate: 0,
      maxCadence: 0,
    });
  },
}));
