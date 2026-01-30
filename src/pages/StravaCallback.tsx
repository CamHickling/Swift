import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStravaStore } from '../stores/stravaStore';

export function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useStravaStore();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Strava authorization failed: ${errorParam}`);
      setProcessing(false);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setProcessing(false);
      return;
    }

    handleAuthCallback(code)
      .then(() => {
        navigate('/settings', { replace: true });
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to Strava');
        setProcessing(false);
      });
  }, [searchParams, handleAuthCallback, navigate]);

  if (error) {
    return (
      <div className="strava-callback">
        <div className="callback-error">
          <h2>Connection Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/settings')} className="btn-primary">
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="strava-callback">
        <div className="callback-processing">
          <div className="spinner"></div>
          <p>Connecting to Strava...</p>
        </div>
      </div>
    );
  }

  return null;
}
