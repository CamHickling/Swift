import {
  HEART_RATE_SERVICE_UUID,
  HEART_RATE_MEASUREMENT_UUID,
} from '../types/bluetooth';
import type { HeartRateData } from '../types/bluetooth';
import { parseHeartRateData } from './parsers';

export type HeartRateDataCallback = (data: HeartRateData) => void;

export class HeartRateDevice {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private heartRateChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataCallback: HeartRateDataCallback | null = null;

  get connected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  get deviceName(): string {
    return this.device?.name ?? 'Unknown HR Monitor';
  }

  get deviceId(): string {
    return this.device?.id ?? '';
  }

  async connect(onData: HeartRateDataCallback): Promise<void> {
    this.dataCallback = onData;

    try {
      // Request device with Heart Rate service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE_UUID] }],
        optionalServices: [HEART_RATE_SERVICE_UUID],
      });

      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Get Heart Rate service
      const service = await this.server.getPrimaryService(HEART_RATE_SERVICE_UUID);

      // Get Heart Rate Measurement characteristic and subscribe
      this.heartRateChar = await service.getCharacteristic(HEART_RATE_MEASUREMENT_UUID);
      await this.heartRateChar.startNotifications();
      this.heartRateChar.addEventListener(
        'characteristicvaluechanged',
        this.handleHeartRateData.bind(this)
      );
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.device = null;
    this.server = null;
    this.heartRateChar = null;
  }

  private handleDisconnect(): void {
    console.log('Heart rate device disconnected');
    this.cleanup();
  }

  private handleHeartRateData(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (data && this.dataCallback) {
      const parsed = parseHeartRateData(data);
      this.dataCallback(parsed);
    }
  }
}
