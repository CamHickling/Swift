import type { IndoorBikeData } from '../../types/bluetooth';

/**
 * Parse FTMS Indoor Bike Data (0x2AD2)
 *
 * Format: Flags (2 bytes) followed by optional fields based on flags
 *
 * Flag bits (little-endian):
 * - Bit 0: More Data (0 = speed present, 1 = no speed)
 * - Bit 1: Average Speed present
 * - Bit 2: Instantaneous Cadence present
 * - Bit 3: Average Cadence present
 * - Bit 4: Total Distance present
 * - Bit 5: Resistance Level present
 * - Bit 6: Instantaneous Power present
 * - Bit 7: Average Power present
 * - Bit 8: Expended Energy present
 * - Bit 9: Heart Rate present
 * - Bit 10: Metabolic Equivalent present
 * - Bit 11: Elapsed Time present
 * - Bit 12: Remaining Time present
 */
export function parseIndoorBikeData(data: DataView): IndoorBikeData {
  let offset = 0;

  // Read flags (2 bytes, little-endian)
  const flags = data.getUint16(offset, true);
  offset += 2;

  const result: IndoorBikeData = {
    speed: 0,
    cadence: 0,
    power: 0,
    timestamp: Date.now(),
  };

  // Bit 0 inverted: if 0, instantaneous speed is present
  if ((flags & 0x01) === 0) {
    // Speed is in 0.01 km/h resolution
    result.speed = data.getUint16(offset, true) / 100;
    offset += 2;
  }

  // Bit 1: Average Speed present
  if (flags & 0x02) {
    offset += 2; // Skip average speed
  }

  // Bit 2: Instantaneous Cadence present
  if (flags & 0x04) {
    // Cadence is in 0.5 rpm resolution
    result.cadence = data.getUint16(offset, true) / 2;
    offset += 2;
  }

  // Bit 3: Average Cadence present
  if (flags & 0x08) {
    offset += 2; // Skip average cadence
  }

  // Bit 4: Total Distance present (3 bytes)
  if (flags & 0x10) {
    offset += 3; // Skip total distance
  }

  // Bit 5: Resistance Level present
  if (flags & 0x20) {
    offset += 2; // Skip resistance level
  }

  // Bit 6: Instantaneous Power present
  if (flags & 0x40) {
    result.power = data.getInt16(offset, true);
    offset += 2;
  }

  // Bit 7: Average Power present
  if (flags & 0x80) {
    offset += 2; // Skip average power
  }

  // Bit 8: Expended Energy present (total, per hour, per minute = 5 bytes)
  if (flags & 0x100) {
    offset += 5; // Skip expended energy
  }

  // Bit 9: Heart Rate present
  if (flags & 0x200) {
    result.heartRate = data.getUint8(offset);
    offset += 1;
  }

  return result;
}
