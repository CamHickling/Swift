import { create } from 'zustand';
import type { WorkoutSample, WorkoutRecord, WorkoutStatus, WorkoutTemplate, WorkoutSummary } from '../types/workout';
import { db } from '../db';

interface WorkoutState {
  // Active workout state
  status: WorkoutStatus;
  startTime: number | null;
  elapsedTime: number; // seconds
  samples: WorkoutSample[];

  // Structured workout
  activeTemplate: WorkoutTemplate | null;
  currentIntervalIndex: number;
  intervalElapsedTime: number; // seconds into current interval
  targetPower: number | null;

  // Recording
  isRecording: boolean;
  lastSampleTime: number;

  // Actions
  startFreeRide: () => void;
  startWorkout: (template: WorkoutTemplate) => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<WorkoutRecord | null>;
  addSample: (sample: Omit<WorkoutSample, 'timestamp'>) => void;
  tick: () => void; // Called every second
  reset: () => void;
}

function calculateSummary(samples: WorkoutSample[], duration: number): WorkoutSummary {
  if (samples.length === 0) {
    return {
      duration,
      distance: 0,
      avgPower: 0,
      maxPower: 0,
      avgHeartRate: undefined,
      maxHeartRate: undefined,
      avgCadence: 0,
      maxCadence: 0,
    };
  }

  const powers = samples.map((s) => s.power);
  const cadences = samples.map((s) => s.cadence);
  const heartRates = samples.filter((s) => s.heartRate !== undefined).map((s) => s.heartRate!);
  const speeds = samples.map((s) => s.speed);

  // Calculate distance (sum of speed * time interval)
  // Assuming 1 sample per second, speed in km/h
  const distance = speeds.reduce((sum, speed) => sum + speed / 3600, 0);

  return {
    duration,
    distance,
    avgPower: powers.reduce((a, b) => a + b, 0) / powers.length,
    maxPower: Math.max(...powers),
    avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : undefined,
    maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : undefined,
    avgCadence: cadences.reduce((a, b) => a + b, 0) / cadences.length,
    maxCadence: Math.max(...cadences),
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  status: 'idle',
  startTime: null,
  elapsedTime: 0,
  samples: [],
  activeTemplate: null,
  currentIntervalIndex: 0,
  intervalElapsedTime: 0,
  targetPower: null,
  isRecording: false,
  lastSampleTime: 0,

  startFreeRide: () => {
    set({
      status: 'running',
      startTime: Date.now(),
      elapsedTime: 0,
      samples: [],
      activeTemplate: null,
      currentIntervalIndex: 0,
      intervalElapsedTime: 0,
      targetPower: null,
      isRecording: true,
      lastSampleTime: Date.now(),
    });
  },

  startWorkout: (template) => {
    const firstInterval = template.intervals[0];
    set({
      status: 'running',
      startTime: Date.now(),
      elapsedTime: 0,
      samples: [],
      activeTemplate: template,
      currentIntervalIndex: 0,
      intervalElapsedTime: 0,
      targetPower: firstInterval?.targetPower ?? null,
      isRecording: true,
      lastSampleTime: Date.now(),
    });
  },

  pause: () => {
    set({ status: 'paused', isRecording: false });
  },

  resume: () => {
    set({ status: 'running', isRecording: true, lastSampleTime: Date.now() });
  },

  stop: async () => {
    const state = get();
    if (!state.startTime) return null;

    const record: WorkoutRecord = {
      templateId: state.activeTemplate?.id,
      name: state.activeTemplate?.name ?? `Free Ride - ${new Date(state.startTime).toLocaleDateString()}`,
      startTime: state.startTime,
      endTime: Date.now(),
      samples: state.samples,
      summary: calculateSummary(state.samples, state.elapsedTime),
    };

    // Save to database
    try {
      const id = await db.workouts.add(record);
      record.id = id;
    } catch (error) {
      console.error('Failed to save workout:', error);
    }

    set({
      status: 'completed',
      isRecording: false,
    });

    return record;
  },

  addSample: (sampleData) => {
    const state = get();
    if (!state.isRecording) return;

    const now = Date.now();
    // Only record at ~1Hz
    if (now - state.lastSampleTime < 900) return;

    const sample: WorkoutSample = {
      ...sampleData,
      timestamp: now,
      targetPower: state.targetPower ?? undefined,
    };

    set({
      samples: [...state.samples, sample],
      lastSampleTime: now,
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== 'running') return;

    const newElapsedTime = state.elapsedTime + 1;
    let newIntervalIndex = state.currentIntervalIndex;
    let newIntervalElapsed = state.intervalElapsedTime + 1;
    let newTargetPower = state.targetPower;

    // Handle structured workout interval progression
    if (state.activeTemplate) {
      const currentInterval = state.activeTemplate.intervals[state.currentIntervalIndex];

      if (currentInterval && newIntervalElapsed >= currentInterval.duration) {
        // Move to next interval
        newIntervalIndex = state.currentIntervalIndex + 1;
        newIntervalElapsed = 0;

        const nextInterval = state.activeTemplate.intervals[newIntervalIndex];
        if (nextInterval) {
          newTargetPower = nextInterval.targetPower;
        } else {
          // Workout complete
          get().stop();
          return;
        }
      }
    }

    set({
      elapsedTime: newElapsedTime,
      currentIntervalIndex: newIntervalIndex,
      intervalElapsedTime: newIntervalElapsed,
      targetPower: newTargetPower,
    });
  },

  reset: () => {
    set({
      status: 'idle',
      startTime: null,
      elapsedTime: 0,
      samples: [],
      activeTemplate: null,
      currentIntervalIndex: 0,
      intervalElapsedTime: 0,
      targetPower: null,
      isRecording: false,
      lastSampleTime: 0,
    });
  },
}));
