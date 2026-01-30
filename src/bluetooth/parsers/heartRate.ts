import type { HeartRateData } from '../../types/bluetooth';

/**
 * Parse Heart Rate Measurement (0x2A37)
 *
 * Format:
 * - Flags (1 byte):
 *   - Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
 *   - Bit 1-2: Sensor Contact Status
 *   - Bit 3: Energy Expended Present
 *   - Bit 4: RR-Interval Present
 * - Heart Rate Value (1 or 2 bytes based on flag)
 * - Energy Expended (2 bytes, optional)
 * - RR-Interval (2 bytes each, optional, multiple)
 */
export function parseHeartRateData(data: DataView): HeartRateData {
  let offset = 0;

  const flags = data.getUint8(offset);
  offset += 1;

  const is16Bit = (flags & 0x01) !== 0;
  const contactSupported = (flags & 0x04) !== 0;
  const contactDetected = contactSupported && (flags & 0x02) !== 0;

  let heartRate: number;
  if (is16Bit) {
    heartRate = data.getUint16(offset, true);
  } else {
    heartRate = data.getUint8(offset);
  }

  return {
    heartRate,
    contactDetected,
    timestamp: Date.now(),
  };
}
