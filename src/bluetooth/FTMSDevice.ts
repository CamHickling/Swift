import {
  FTMS_SERVICE_UUID,
  FTMS_INDOOR_BIKE_DATA_UUID,
  FTMS_CONTROL_POINT_UUID,
  FTMS_OP_REQUEST_CONTROL,
  FTMS_OP_SET_TARGET_POWER,
  FTMS_OP_SET_TARGET_RESISTANCE,
} from '../types/bluetooth';
import type { IndoorBikeData } from '../types/bluetooth';
import { parseIndoorBikeData } from './parsers';

export type FTMSDataCallback = (data: IndoorBikeData) => void;

export class FTMSDevice {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private indoorBikeDataChar: BluetoothRemoteGATTCharacteristic | null = null;
  private controlPointChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataCallback: FTMSDataCallback | null = null;
  private hasControl = false;

  get connected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  get deviceName(): string {
    return this.device?.name ?? 'Unknown Trainer';
  }

  get deviceId(): string {
    return this.device?.id ?? '';
  }

  async connect(onData: FTMSDataCallback): Promise<void> {
    this.dataCallback = onData;

    try {
      // Request device with FTMS service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [FTMS_SERVICE_UUID] }],
        optionalServices: [FTMS_SERVICE_UUID],
      });

      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Get FTMS service
      const service = await this.server.getPrimaryService(FTMS_SERVICE_UUID);

      // Get Indoor Bike Data characteristic and subscribe
      this.indoorBikeDataChar = await service.getCharacteristic(FTMS_INDOOR_BIKE_DATA_UUID);
      await this.indoorBikeDataChar.startNotifications();
      this.indoorBikeDataChar.addEventListener(
        'characteristicvaluechanged',
        this.handleIndoorBikeData.bind(this)
      );

      // Try to get control point characteristic
      try {
        this.controlPointChar = await service.getCharacteristic(FTMS_CONTROL_POINT_UUID);
        await this.controlPointChar.startNotifications();
        this.controlPointChar.addEventListener(
          'characteristicvaluechanged',
          this.handleControlPointResponse.bind(this)
        );
      } catch {
        console.warn('Control point characteristic not available');
      }
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
    this.indoorBikeDataChar = null;
    this.controlPointChar = null;
    this.hasControl = false;
  }

  private handleDisconnect(): void {
    console.log('FTMS device disconnected');
    this.cleanup();
  }

  private handleIndoorBikeData(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (data && this.dataCallback) {
      const parsed = parseIndoorBikeData(data);
      this.dataCallback(parsed);
    }
  }

  private handleControlPointResponse(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (data) {
      // Response format: [responseOpCode, requestOpCode, resultCode]
      const requestCode = data.getUint8(1);
      const result = data.getUint8(2);
      console.log(`Control Point Response: op=${requestCode}, result=${result === 1 ? 'success' : 'failed'}`);

      if (requestCode === FTMS_OP_REQUEST_CONTROL && result === 1) {
        this.hasControl = true;
      }
    }
  }

  async requestControl(): Promise<boolean> {
    if (!this.controlPointChar) {
      console.warn('Control point not available');
      return false;
    }

    try {
      const command = new Uint8Array([FTMS_OP_REQUEST_CONTROL]);
      await this.controlPointChar.writeValue(command);
      // Wait a bit for the response
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.hasControl;
    } catch (error) {
      console.error('Failed to request control:', error);
      return false;
    }
  }

  async setTargetPower(watts: number): Promise<boolean> {
    if (!this.controlPointChar) {
      console.warn('Control point not available');
      return false;
    }

    if (!this.hasControl) {
      const gotControl = await this.requestControl();
      if (!gotControl) {
        console.warn('Could not get control of trainer');
        return false;
      }
    }

    try {
      // Op code (1 byte) + Target Power (2 bytes, little-endian, signed)
      const command = new Uint8Array(3);
      const view = new DataView(command.buffer);
      view.setUint8(0, FTMS_OP_SET_TARGET_POWER);
      view.setInt16(1, Math.round(watts), true);
      await this.controlPointChar.writeValue(command);
      return true;
    } catch (error) {
      console.error('Failed to set target power:', error);
      return false;
    }
  }

  async setTargetResistance(level: number): Promise<boolean> {
    if (!this.controlPointChar) {
      console.warn('Control point not available');
      return false;
    }

    if (!this.hasControl) {
      const gotControl = await this.requestControl();
      if (!gotControl) {
        console.warn('Could not get control of trainer');
        return false;
      }
    }

    try {
      // Op code (1 byte) + Resistance Level (1 byte, 0.1 resolution)
      // Level is 0-200 representing 0.0-20.0
      const command = new Uint8Array(2);
      command[0] = FTMS_OP_SET_TARGET_RESISTANCE;
      command[1] = Math.round(level * 10);
      await this.controlPointChar.writeValue(command);
      return true;
    } catch (error) {
      console.error('Failed to set target resistance:', error);
      return false;
    }
  }
}
