import { useState } from 'react';
import type { WorkoutInterval, WorkoutTemplate } from '../../types/workout';
import { saveTemplate } from '../../db';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function WorkoutBuilder() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [intervals, setIntervals] = useState<WorkoutInterval[]>([]);

  // New interval form
  const [intervalName, setIntervalName] = useState('');
  const [duration, setDuration] = useState(60);
  const [power, setPower] = useState(150);

  const addInterval = () => {
    const newInterval: WorkoutInterval = {
      id: generateId(),
      name: intervalName || `Interval ${intervals.length + 1}`,
      duration,
      targetPower: power,
      targetPowerType: 'absolute',
    };
    setIntervals([...intervals, newInterval]);
    setIntervalName('');
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter((i) => i.id !== id));
  };

  const duplicateInterval = (interval: WorkoutInterval) => {
    const newInterval = { ...interval, id: generateId() };
    setIntervals([...intervals, newInterval]);
  };

  const moveInterval = (index: number, direction: 'up' | 'down') => {
    const newIntervals = [...intervals];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= intervals.length) return;

    [newIntervals[index], newIntervals[targetIndex]] = [
      newIntervals[targetIndex],
      newIntervals[index],
    ];
    setIntervals(newIntervals);
  };

  const totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const handleSave = async () => {
    if (!name || intervals.length === 0) {
      alert('Please provide a name and at least one interval');
      return;
    }

    const template: WorkoutTemplate = {
      name,
      description,
      intervals,
      totalDuration,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveTemplate(template);
      alert('Workout saved!');
      // Reset form
      setName('');
      setDescription('');
      setIntervals([]);
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout');
    }
  };

  // Quick add presets
  const addWarmup = () => {
    setIntervals([
      ...intervals,
      {
        id: generateId(),
        name: 'Warmup',
        duration: 300,
        targetPower: 100,
        targetPowerType: 'absolute',
      },
    ]);
  };

  const addCooldown = () => {
    setIntervals([
      ...intervals,
      {
        id: generateId(),
        name: 'Cooldown',
        duration: 300,
        targetPower: 100,
        targetPowerType: 'absolute',
      },
    ]);
  };

  return (
    <div className="workout-builder">
      <h2>Workout Builder</h2>

      <div className="builder-form">
        <div className="form-group">
          <label>Workout Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workout"
          />
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Workout description..."
          />
        </div>
      </div>

      <div className="quick-add">
        <button onClick={addWarmup}>+ Add Warmup (5min)</button>
        <button onClick={addCooldown}>+ Add Cooldown (5min)</button>
      </div>

      <div className="interval-list">
        <h3>Intervals ({formatDuration(totalDuration)} total)</h3>

        {intervals.length === 0 ? (
          <p className="no-intervals">No intervals added yet</p>
        ) : (
          intervals.map((interval, index) => (
            <div key={interval.id} className="interval-item">
              <div className="interval-info">
                <span className="interval-name">{interval.name}</span>
                <span className="interval-details">
                  {formatDuration(interval.duration)} @ {interval.targetPower}W
                </span>
              </div>
              <div className="interval-actions">
                <button onClick={() => moveInterval(index, 'up')} disabled={index === 0}>
                  ↑
                </button>
                <button
                  onClick={() => moveInterval(index, 'down')}
                  disabled={index === intervals.length - 1}
                >
                  ↓
                </button>
                <button onClick={() => duplicateInterval(interval)}>⧉</button>
                <button onClick={() => removeInterval(interval.id)} className="btn-delete">
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="add-interval-form">
        <h4>Add Interval</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={intervalName}
              onChange={(e) => setIntervalName(e.target.value)}
              placeholder="Interval name"
            />
          </div>
          <div className="form-group">
            <label>Duration (seconds)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={10}
              max={3600}
            />
          </div>
          <div className="form-group">
            <label>Power (watts)</label>
            <input
              type="number"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              min={50}
              max={2000}
            />
          </div>
          <button onClick={addInterval} className="btn-add">
            Add
          </button>
        </div>
      </div>

      <div className="builder-actions">
        <button
          onClick={handleSave}
          className="btn-save"
          disabled={!name || intervals.length === 0}
        >
          Save Workout
        </button>
      </div>
    </div>
  );
}
