import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WorkoutSample } from '../../types/workout';

interface WorkoutChartProps {
  samples: WorkoutSample[];
  showHeartRate?: boolean;
  showCadence?: boolean;
  showPower?: boolean;
}

export function WorkoutChart({
  samples,
  showHeartRate = true,
  showCadence = true,
  showPower = true,
}: WorkoutChartProps) {
  if (samples.length === 0) {
    return <div className="no-data">No data to display</div>;
  }

  // Format data for Recharts
  const startTime = samples[0].timestamp;
  const data = samples.map((sample) => ({
    time: Math.floor((sample.timestamp - startTime) / 1000),
    power: sample.power,
    heartRate: sample.heartRate,
    cadence: sample.cadence,
    targetPower: sample.targetPower,
  }));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="workout-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#9ca3af"
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            yAxisId="power"
            orientation="left"
            stroke="#3b82f6"
            label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="hr"
            orientation="right"
            stroke="#ef4444"
            label={{ value: 'HR (bpm)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelFormatter={(value) => `Time: ${formatTime(value as number)}`}
          />
          <Legend />

          {showPower && (
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="power"
              stroke="#3b82f6"
              dot={false}
              name="Power"
              strokeWidth={2}
            />
          )}

          {showPower && data.some((d) => d.targetPower) && (
            <Line
              yAxisId="power"
              type="stepAfter"
              dataKey="targetPower"
              stroke="#10b981"
              dot={false}
              name="Target Power"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}

          {showHeartRate && (
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="heartRate"
              stroke="#ef4444"
              dot={false}
              name="Heart Rate"
              strokeWidth={2}
            />
          )}

          {showCadence && (
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="cadence"
              stroke="#f59e0b"
              dot={false}
              name="Cadence"
              strokeWidth={1}
              opacity={0.7}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
