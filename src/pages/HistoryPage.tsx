import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkoutRecord } from '../types/workout';
import { getRecentWorkouts, deleteWorkout } from '../db';

export function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const records = await getRecentWorkouts(50);
      setWorkouts(records);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this workout?')) return;
    try {
      await deleteWorkout(id);
      setWorkouts(workouts.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Failed to delete workout:', error);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading workouts...</div>;
  }

  return (
    <div className="history-page">
      <h1>Workout History</h1>

      {workouts.length === 0 ? (
        <div className="no-workouts">
          <p>No workouts recorded yet.</p>
          <Link to="/" className="btn-primary">
            Start Your First Ride
          </Link>
        </div>
      ) : (
        <div className="workout-list">
          {workouts.map((workout) => (
            <div key={workout.id} className="workout-card">
              <div className="workout-header">
                <h3>{workout.name}</h3>
                <span className="workout-date">{formatDate(workout.startTime)}</span>
              </div>
              <div className="workout-stats">
                <div className="stat">
                  <span className="stat-value">{formatDuration(workout.summary.duration)}</span>
                  <span className="stat-label">Duration</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Math.round(workout.summary.avgPower)}W</span>
                  <span className="stat-label">Avg Power</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Math.round(workout.summary.maxPower)}W</span>
                  <span className="stat-label">Max Power</span>
                </div>
                {workout.summary.avgHeartRate && (
                  <div className="stat">
                    <span className="stat-value">{Math.round(workout.summary.avgHeartRate)}</span>
                    <span className="stat-label">Avg HR</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-value">{workout.summary.distance.toFixed(1)}km</span>
                  <span className="stat-label">Distance</span>
                </div>
              </div>
              <div className="workout-actions">
                <Link to={`/workout/${workout.id}`} className="btn-view">
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(workout.id!)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
