import { useStravaStore } from '../stores/stravaStore';
import { initiateStravaAuth, isStravaConfigured } from '../services/stravaService';

export function SettingsPage() {
  const { isConnected, athleteName, disconnect } = useStravaStore();
  const configured = isStravaConfigured();

  const handleConnectStrava = () => {
    initiateStravaAuth();
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Strava Integration</h2>

        {!configured ? (
          <div className="strava-not-configured">
            <p>Strava integration requires configuration.</p>
            <p>To enable Strava uploads:</p>
            <ol>
              <li>
                Create a Strava API application at{' '}
                <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer">
                  strava.com/settings/api
                </a>
              </li>
              <li>Deploy the token exchange worker (see /worker folder)</li>
              <li>
                Create a <code>.env</code> file with:
                <pre>
{`VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_REDIRECT_URI=your_app_url/#/strava/callback
VITE_TOKEN_EXCHANGE_URL=your_worker_url`}
                </pre>
              </li>
            </ol>
          </div>
        ) : isConnected ? (
          <div className="strava-connected">
            <div className="strava-status">
              <span className="strava-icon">🔗</span>
              <div>
                <p className="connected-label">Connected to Strava</p>
                <p className="athlete-name">{athleteName}</p>
              </div>
            </div>
            <button onClick={disconnect} className="btn-disconnect">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="strava-disconnected">
            <p>Connect your Strava account to automatically upload workouts.</p>
            <button onClick={handleConnectStrava} className="btn-strava">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Connect with Strava
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>About</h2>
        <p>Swift - Indoor Cycling App</p>
        <p className="version">Version 1.0.0</p>
        <p className="about-description">
          A web-based fitness tracking app for smart trainers and heart rate monitors.
          Uses Web Bluetooth to connect to FTMS-compatible trainers (like Wahoo KICKR)
          and heart rate monitors (like Wahoo TICKR).
        </p>
      </section>

      <section className="settings-section">
        <h2>Data</h2>
        <p className="data-info">
          All workout data is stored locally in your browser using IndexedDB.
          Data will be lost if you clear your browser data.
        </p>
      </section>
    </div>
  );
}
