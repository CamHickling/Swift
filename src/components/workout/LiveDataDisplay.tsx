import { useLiveDataStore, useWorkoutStore } from '../../stores';
import { MetricDisplay } from './MetricDisplay';

export function LiveDataDisplay() {
  const { current, power3s, heartRate3s, cadence3s, maxPower, maxHeartRate } = useLiveDataStore();
  const { targetPower, elapsedTime, status } = useWorkoutStore();

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine power color based on target
  const getPowerColor = (): string | undefined => {
    if (!targetPower) return undefined;
    const diff = current.power - targetPower;
    if (diff > 10) return '#f59e0b'; // Above target - amber
    if (diff < -10) return '#3b82f6'; // Below target - blue
    return '#10b981'; // On target - green
  };

  return (
    <div className="live-data-display">
      {status !== 'idle' && (
        <div className="elapsed-time">
          <span className="time-label">Time</span>
          <span className="time-value">{formatTime(elapsedTime)}</span>
        </div>
      )}

      <div className="metrics-grid">
        <MetricDisplay
          label="Power"
          value={current.power}
          unit="W"
          size="large"
          color={getPowerColor()}
          secondary={power3s}
          secondaryLabel="3s avg"
        />

        <MetricDisplay
          label="Heart Rate"
          value={current.heartRate}
          unit="bpm"
          size="large"
          color="#ef4444"
          secondary={heartRate3s}
          secondaryLabel="3s avg"
        />

        <MetricDisplay
          label="Cadence"
          value={current.cadence}
          unit="rpm"
          size="medium"
          secondary={cadence3s}
          secondaryLabel="3s avg"
        />

        <MetricDisplay
          label="Speed"
          value={current.speed}
          unit="km/h"
          size="medium"
        />
      </div>

      {targetPower && (
        <div className="target-display">
          <div className="target-label">Target Power</div>
          <div className="target-value">{targetPower}W</div>
          <div className="target-diff">
            {current.power > targetPower + 10 && (
              <span className="above-target">↑ {Math.round(current.power - targetPower)}W above</span>
            )}
            {current.power < targetPower - 10 && (
              <span className="below-target">↓ {Math.round(targetPower - current.power)}W below</span>
            )}
            {Math.abs(current.power - targetPower) <= 10 && (
              <span className="on-target">On target</span>
            )}
          </div>
        </div>
      )}

      <div className="session-stats">
        <div className="stat">
          <span className="stat-label">Max Power</span>
          <span className="stat-value">{maxPower}W</span>
        </div>
        <div className="stat">
          <span className="stat-label">Max HR</span>
          <span className="stat-value">{maxHeartRate}bpm</span>
        </div>
      </div>
    </div>
  );
}
