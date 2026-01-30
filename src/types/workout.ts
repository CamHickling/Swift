// Workout data types

export interface WorkoutSample {
  timestamp: number;
  power: number;
  cadence: number;
  heartRate?: number;
  speed: number;
  targetPower?: number;
}

export interface WorkoutInterval {
  id: string;
  name: string;
  duration: number; // seconds
  targetPower: number; // watts (absolute or % FTP)
  targetPowerType: 'absolute' | 'ftp';
  cadenceTarget?: {
    min: number;
    max: number;
  };
}

export interface WorkoutTemplate {
  id?: number;
  name: string;
  description?: string;
  intervals: WorkoutInterval[];
  totalDuration: number; // calculated
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSummary {
  duration: number; // seconds
  distance: number; // km
  avgPower: number;
  maxPower: number;
  normalizedPower?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence: number;
  maxCadence: number;
  tss?: number;
  intensityFactor?: number;
}

export interface WorkoutRecord {
  id?: number;
  templateId?: number;
  name: string;
  startTime: number;
  endTime: number;
  samples: WorkoutSample[];
  summary: WorkoutSummary;
}

export type WorkoutStatus = 'idle' | 'running' | 'paused' | 'completed';
