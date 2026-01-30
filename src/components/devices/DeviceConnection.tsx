import { useDeviceStore, useLiveDataStore } from '../../stores';

export function DeviceConnection() {
  const {
    trainerConnected,
    heartRateConnected,
    trainerName,
    heartRateName,
    isConnectingTrainer,
    isConnectingHeartRate,
    connectionError,
    connectTrainer,
    disconnectTrainer,
    connectHeartRate,
    disconnectHeartRate,
  } = useDeviceStore();

  const { updateFromTrainer, updateFromHeartRate } = useLiveDataStore();

  const handleConnectTrainer = async () => {
    try {
      await connectTrainer(updateFromTrainer);
    } catch (error) {
      console.error('Failed to connect trainer:', error);
    }
  };

  const handleConnectHeartRate = async () => {
    try {
      await connectHeartRate(updateFromHeartRate);
    } catch (error) {
      console.error('Failed to connect heart rate monitor:', error);
    }
  };

  return (
    <div className="device-connection">
      <h2>Devices</h2>

      {connectionError && (
        <div className="error-message">{connectionError}</div>
      )}

      <div className="device-card">
        <div className="device-info">
          <span className="device-icon">🚴</span>
          <div>
            <h3>Trainer (KICKR)</h3>
            {trainerConnected ? (
              <span className="connected">{trainerName}</span>
            ) : (
              <span className="disconnected">Not connected</span>
            )}
          </div>
        </div>
        <button
          onClick={trainerConnected ? disconnectTrainer : handleConnectTrainer}
          disabled={isConnectingTrainer}
          className={trainerConnected ? 'btn-disconnect' : 'btn-connect'}
        >
          {isConnectingTrainer
            ? 'Connecting...'
            : trainerConnected
              ? 'Disconnect'
              : 'Connect'}
        </button>
      </div>

      <div className="device-card">
        <div className="device-info">
          <span className="device-icon">❤️</span>
          <div>
            <h3>Heart Rate (TICKR)</h3>
            {heartRateConnected ? (
              <span className="connected">{heartRateName}</span>
            ) : (
              <span className="disconnected">Not connected</span>
            )}
          </div>
        </div>
        <button
          onClick={heartRateConnected ? disconnectHeartRate : handleConnectHeartRate}
          disabled={isConnectingHeartRate}
          className={heartRateConnected ? 'btn-disconnect' : 'btn-connect'}
        >
          {isConnectingHeartRate
            ? 'Connecting...'
            : heartRateConnected
              ? 'Disconnect'
              : 'Connect'}
        </button>
      </div>
    </div>
  );
}
