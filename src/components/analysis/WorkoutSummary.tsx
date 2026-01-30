import type { WorkoutSummary as Summary } from '../../types/workout';

interface WorkoutSummaryProps {
  summary: Summary;
}

export function WorkoutSummaryDisplay({ summary }: WorkoutSummaryProps) {
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="workout-summary">
      <h3>Workout Summary</h3>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Duration</span>
          <span className="summary-value">{formatDuration(summary.duration)}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Distance</span>
          <span className="summary-value">{summary.distance.toFixed(2)} km</span>
        </div>

        <div className="summary-item highlight">
          <span className="summary-label">Avg Power</span>
          <span className="summary-value">{Math.round(summary.avgPower)} W</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Max Power</span>
          <span className="summary-value">{Math.round(summary.maxPower)} W</span>
        </div>

        {summary.normalizedPower && (
          <div className="summary-item">
            <span className="summary-label">NP</span>
            <span className="summary-value">{Math.round(summary.normalizedPower)} W</span>
          </div>
        )}

        {summary.avgHeartRate && (
          <div className="summary-item">
            <span className="summary-label">Avg HR</span>
            <span className="summary-value">{Math.round(summary.avgHeartRate)} bpm</span>
          </div>
        )}

        {summary.maxHeartRate && (
          <div className="summary-item">
            <span className="summary-label">Max HR</span>
            <span className="summary-value">{Math.round(summary.maxHeartRate)} bpm</span>
          </div>
        )}

        <div className="summary-item">
          <span className="summary-label">Avg Cadence</span>
          <span className="summary-value">{Math.round(summary.avgCadence)} rpm</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Max Cadence</span>
          <span className="summary-value">{Math.round(summary.maxCadence)} rpm</span>
        </div>

        {summary.tss && (
          <div className="summary-item highlight">
            <span className="summary-label">TSS</span>
            <span className="summary-value">{Math.round(summary.tss)}</span>
          </div>
        )}

        {summary.intensityFactor && (
          <div className="summary-item">
            <span className="summary-label">IF</span>
            <span className="summary-value">{summary.intensityFactor.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
