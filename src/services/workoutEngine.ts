import type { WorkoutTemplate, WorkoutInterval, WorkoutSample } from '../types/workout';

/**
 * Calculate Normalized Power (NP)
 * NP = 4th root of (average of (30-second rolling avg power)^4)
 */
export function calculateNormalizedPower(samples: WorkoutSample[]): number {
  if (samples.length < 30) {
    // Not enough data for 30s rolling average
    const powers = samples.map((s) => s.power);
    return powers.reduce((a, b) => a + b, 0) / powers.length;
  }

  const powers = samples.map((s) => s.power);
  const rollingAvgs: number[] = [];

  // Calculate 30-second rolling averages
  for (let i = 29; i < powers.length; i++) {
    const window = powers.slice(i - 29, i + 1);
    const avg = window.reduce((a, b) => a + b, 0) / 30;
    rollingAvgs.push(avg);
  }

  // Raise each to the 4th power, average, then 4th root
  const fourthPowers = rollingAvgs.map((avg) => Math.pow(avg, 4));
  const avgFourthPower = fourthPowers.reduce((a, b) => a + b, 0) / fourthPowers.length;
  return Math.pow(avgFourthPower, 0.25);
}

/**
 * Calculate Intensity Factor (IF)
 * IF = NP / FTP
 */
export function calculateIntensityFactor(normalizedPower: number, ftp: number): number {
  return normalizedPower / ftp;
}

/**
 * Calculate Training Stress Score (TSS)
 * TSS = (duration_seconds * NP * IF) / (FTP * 3600) * 100
 */
export function calculateTSS(
  durationSeconds: number,
  normalizedPower: number,
  ftp: number
): number {
  const intensityFactor = calculateIntensityFactor(normalizedPower, ftp);
  return (durationSeconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
}

/**
 * Calculate time in power zones
 */
export interface PowerZones {
  z1: number; // Recovery: <55% FTP
  z2: number; // Endurance: 55-75% FTP
  z3: number; // Tempo: 75-90% FTP
  z4: number; // Threshold: 90-105% FTP
  z5: number; // VO2max: 105-120% FTP
  z6: number; // Anaerobic: >120% FTP
}

export function calculateTimeInZones(samples: WorkoutSample[], ftp: number): PowerZones {
  const zones: PowerZones = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0 };

  samples.forEach((sample) => {
    const percent = (sample.power / ftp) * 100;

    if (percent < 55) zones.z1++;
    else if (percent < 75) zones.z2++;
    else if (percent < 90) zones.z3++;
    else if (percent < 105) zones.z4++;
    else if (percent < 120) zones.z5++;
    else zones.z6++;
  });

  return zones;
}

/**
 * Parse ZWO (Zwift workout) file format
 */
export function parseZWO(xml: string): WorkoutTemplate | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const workout = doc.querySelector('workout');
    if (!workout) return null;

    const name = doc.querySelector('name')?.textContent ?? 'Imported Workout';
    const description = doc.querySelector('description')?.textContent ?? '';

    const intervals: WorkoutInterval[] = [];
    let totalDuration = 0;

    // Process workout elements
    const elements = workout.children;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tagName = el.tagName.toLowerCase();

      let interval: WorkoutInterval | null = null;

      switch (tagName) {
        case 'steadystate': {
          const duration = parseInt(el.getAttribute('Duration') ?? '0', 10);
          const power = parseFloat(el.getAttribute('Power') ?? '0.5');
          interval = {
            id: `${i}`,
            name: `Steady State`,
            duration,
            targetPower: Math.round(power * 100), // Convert FTP percentage to watts placeholder
            targetPowerType: 'ftp' as const,
          };
          break;
        }
        case 'warmup': {
          const duration = parseInt(el.getAttribute('Duration') ?? '0', 10);
          const powerLow = parseFloat(el.getAttribute('PowerLow') ?? '0.25');
          const powerHigh = parseFloat(el.getAttribute('PowerHigh') ?? '0.75');
          interval = {
            id: `${i}`,
            name: 'Warmup',
            duration,
            targetPower: Math.round(((powerLow + powerHigh) / 2) * 100),
            targetPowerType: 'ftp' as const,
          };
          break;
        }
        case 'cooldown': {
          const duration = parseInt(el.getAttribute('Duration') ?? '0', 10);
          const powerLow = parseFloat(el.getAttribute('PowerLow') ?? '0.25');
          const powerHigh = parseFloat(el.getAttribute('PowerHigh') ?? '0.75');
          interval = {
            id: `${i}`,
            name: 'Cooldown',
            duration,
            targetPower: Math.round(((powerLow + powerHigh) / 2) * 100),
            targetPowerType: 'ftp' as const,
          };
          break;
        }
        case 'intervalst': {
          const repeat = parseInt(el.getAttribute('Repeat') ?? '1', 10);
          const onDuration = parseInt(el.getAttribute('OnDuration') ?? '0', 10);
          const offDuration = parseInt(el.getAttribute('OffDuration') ?? '0', 10);
          const onPower = parseFloat(el.getAttribute('OnPower') ?? '1.0');
          const offPower = parseFloat(el.getAttribute('OffPower') ?? '0.5');

          for (let r = 0; r < repeat; r++) {
            intervals.push({
              id: `${i}-${r}-on`,
              name: `Interval ${r + 1} - ON`,
              duration: onDuration,
              targetPower: Math.round(onPower * 100),
              targetPowerType: 'ftp' as const,
            });
            intervals.push({
              id: `${i}-${r}-off`,
              name: `Interval ${r + 1} - REST`,
              duration: offDuration,
              targetPower: Math.round(offPower * 100),
              targetPowerType: 'ftp' as const,
            });
            totalDuration += onDuration + offDuration;
          }
          continue; // Skip the normal interval push
        }
        case 'freeride': {
          const duration = parseInt(el.getAttribute('Duration') ?? '0', 10);
          interval = {
            id: `${i}`,
            name: 'Free Ride',
            duration,
            targetPower: 0,
            targetPowerType: 'absolute' as const,
          };
          break;
        }
      }

      if (interval) {
        intervals.push(interval);
        totalDuration += interval.duration;
      }
    }

    return {
      name,
      description,
      intervals,
      totalDuration,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Failed to parse ZWO file:', error);
    return null;
  }
}

/**
 * Convert workout to ZWO format for export
 */
export function exportToZWO(template: WorkoutTemplate, ftp: number): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Swift</author>
  <name>${escapeXml(template.name)}</name>
  <description>${escapeXml(template.description ?? '')}</description>
  <sportType>bike</sportType>
  <workout>
`;

  template.intervals.forEach((interval) => {
    const power = interval.targetPowerType === 'ftp'
      ? interval.targetPower / 100
      : interval.targetPower / ftp;

    xml += `    <SteadyState Duration="${interval.duration}" Power="${power.toFixed(2)}"/>
`;
  });

  xml += `  </workout>
</workout_file>`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
