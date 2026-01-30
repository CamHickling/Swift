import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { WorkoutRecord } from '../types/workout';
import { getWorkoutById } from '../db';
import { WorkoutChart, WorkoutSummaryDisplay } from '../components/analysis';
import { useStravaStore } from '../stores/stravaStore';
import { downloadTCX } from '../services/tcxExport';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const { isConnected, isUploading, uploadWorkout } = useStravaStore();

  useEffect(() => {
    if (id) {
      loadWorkout(Number(id));
    }
  }, [id]);

  const loadWorkout = async (workoutId: number) => {
    try {
      const record = await getWorkoutById(workoutId);
      setWorkout(record ?? null);
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStravaUpload = async () => {
    if (!workout) return;

    setUploadStatus('uploading');
    const result = await uploadWorkout(workout);

    if (result.success) {
      setUploadStatus('success');
      setUploadMessage(result.activityId ? `Uploaded! Activity ID: ${result.activityId}` : 'Upload processing...');
    } else {
      setUploadStatus('error');
      setUploadMessage(result.error || 'Upload failed');
    }
  };

  const handleDownloadTCX = () => {
    if (workout) {
      downloadTCX(workout);
    }
  };

  if (loading) {
    return <div className="loading">Loading workout...</div>;
  }

  if (!workout) {
    return (
      <div className="not-found">
        <h2>Workout not found</h2>
        <Link to="/history">Back to History</Link>
      </div>
    );
  }

  return (
    <div className="workout-detail-page">
      <div className="page-header">
        <Link to="/history" className="back-link">
          ← Back to History
        </Link>
        <h1>{workout.name}</h1>
        <span className="workout-date">
          {new Date(workout.startTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="export-actions">
        {isConnected ? (
          <button
            onClick={handleStravaUpload}
            disabled={isUploading || uploadStatus === 'uploading'}
            className="btn-strava"
          >
            {uploadStatus === 'uploading' || isUploading ? (
              'Uploading...'
            ) : uploadStatus === 'success' ? (
              'Uploaded to Strava'
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Upload to Strava
              </>
            )}
          </button>
        ) : (
          <Link to="/settings" className="btn-strava-connect">
            Connect Strava to Upload
          </Link>
        )}
        <button onClick={handleDownloadTCX} className="btn-secondary">
          Download TCX
        </button>
      </div>

      {uploadStatus !== 'idle' && (
        <div className={`upload-status ${uploadStatus}`}>
          {uploadMessage}
        </div>
      )}

      <WorkoutSummaryDisplay summary={workout.summary} />

      <div className="chart-section">
        <h2>Power & Heart Rate</h2>
        <WorkoutChart samples={workout.samples} />
      </div>
    </div>
  );
}
