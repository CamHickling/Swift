import { create } from 'zustand';
import { FTMSDevice, HeartRateDevice } from '../bluetooth';
import type { IndoorBikeData, HeartRateData } from '../types/bluetooth';

interface DeviceState {
  // Devices
  trainerDevice: FTMSDevice | null;
  heartRateDevice: HeartRateDevice | null;

  // Connection state
  trainerConnected: boolean;
  heartRateConnected: boolean;
  trainerName: string;
  heartRateName: string;

  // Connection status
  isConnectingTrainer: boolean;
  isConnectingHeartRate: boolean;
  connectionError: string | null;

  // Actions
  connectTrainer: (onData: (data: IndoorBikeData) => void) => Promise<void>;
  disconnectTrainer: () => Promise<void>;
  connectHeartRate: (onData: (data: HeartRateData) => void) => Promise<void>;
  disconnectHeartRate: () => Promise<void>;
  setTargetPower: (watts: number) => Promise<boolean>;
  setTargetResistance: (level: number) => Promise<boolean>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  trainerDevice: null,
  heartRateDevice: null,
  trainerConnected: false,
  heartRateConnected: false,
  trainerName: '',
  heartRateName: '',
  isConnectingTrainer: false,
  isConnectingHeartRate: false,
  connectionError: null,

  connectTrainer: async (onData) => {
    set({ isConnectingTrainer: true, connectionError: null });

    const device = new FTMSDevice();

    try {
      await device.connect((data) => {
        onData(data);
        // Update connection state if needed
        if (!get().trainerConnected && device.connected) {
          set({
            trainerConnected: true,
            trainerName: device.deviceName,
          });
        }
      });

      set({
        trainerDevice: device,
        trainerConnected: true,
        trainerName: device.deviceName,
        isConnectingTrainer: false,
      });
    } catch (error) {
      set({
        isConnectingTrainer: false,
        connectionError: error instanceof Error ? error.message : 'Failed to connect trainer',
      });
      throw error;
    }
  },

  disconnectTrainer: async () => {
    const { trainerDevice } = get();
    if (trainerDevice) {
      await trainerDevice.disconnect();
    }
    set({
      trainerDevice: null,
      trainerConnected: false,
      trainerName: '',
    });
  },

  connectHeartRate: async (onData) => {
    set({ isConnectingHeartRate: true, connectionError: null });

    const device = new HeartRateDevice();

    try {
      await device.connect((data) => {
        onData(data);
        // Update connection state if needed
        if (!get().heartRateConnected && device.connected) {
          set({
            heartRateConnected: true,
            heartRateName: device.deviceName,
          });
        }
      });

      set({
        heartRateDevice: device,
        heartRateConnected: true,
        heartRateName: device.deviceName,
        isConnectingHeartRate: false,
      });
    } catch (error) {
      set({
        isConnectingHeartRate: false,
        connectionError: error instanceof Error ? error.message : 'Failed to connect heart rate monitor',
      });
      throw error;
    }
  },

  disconnectHeartRate: async () => {
    const { heartRateDevice } = get();
    if (heartRateDevice) {
      await heartRateDevice.disconnect();
    }
    set({
      heartRateDevice: null,
      heartRateConnected: false,
      heartRateName: '',
    });
  },

  setTargetPower: async (watts) => {
    const { trainerDevice } = get();
    if (!trainerDevice) return false;
    return trainerDevice.setTargetPower(watts);
  },

  setTargetResistance: async (level) => {
    const { trainerDevice } = get();
    if (!trainerDevice) return false;
    return trainerDevice.setTargetResistance(level);
  },
}));
