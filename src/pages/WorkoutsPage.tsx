import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkoutTemplate } from '../types/workout';
import { getAllTemplates, deleteTemplate } from '../db';
import { useWorkoutStore } from '../stores';
import { useNavigate } from 'react-router-dom';

export function WorkoutsPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { startWorkout } = useWorkoutStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this workout template?')) return;
    try {
      await deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleStart = (template: WorkoutTemplate) => {
    startWorkout(template);
    navigate('/');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading workouts...</div>;
  }

  return (
    <div className="workouts-page">
      <div className="page-header">
        <h1>Structured Workouts</h1>
        <Link to="/builder" className="btn-primary">
          Create New Workout
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="no-workouts">
          <p>No workouts created yet.</p>
          <p>Create structured interval workouts to train with.</p>
          <Link to="/builder" className="btn-primary">
            Create Your First Workout
          </Link>
        </div>
      ) : (
        <div className="template-list">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3>{template.name}</h3>
                <span className="template-duration">{formatDuration(template.totalDuration)}</span>
              </div>
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}
              <div className="template-intervals">
                {template.intervals.slice(0, 5).map((interval) => (
                  <span key={interval.id} className="interval-badge">
                    {interval.name}: {interval.targetPower}W
                  </span>
                ))}
                {template.intervals.length > 5 && (
                  <span className="more-badge">+{template.intervals.length - 5} more</span>
                )}
              </div>
              <div className="template-actions">
                <button onClick={() => handleStart(template)} className="btn-start">
                  Start Workout
                </button>
                <button
                  onClick={() => handleDelete(template.id!)}
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
