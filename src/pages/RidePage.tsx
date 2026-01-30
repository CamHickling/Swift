import { DeviceConnection } from '../components/devices';
import { LiveDataDisplay, WorkoutControls, TrainerControl } from '../components/workout';
import { useDeviceStore, useWorkoutStore } from '../stores';

export function RidePage() {
  const { trainerConnected, heartRateConnected } = useDeviceStore();
  useWorkoutStore();

  return (
    <div className="ride-page">
      <div className="ride-layout">
        <aside className="sidebar">
          <DeviceConnection />
          {trainerConnected && <TrainerControl />}
        </aside>

        <main className="main-content">
          {!trainerConnected && !heartRateConnected ? (
            <div className="connect-prompt">
              <h2>Connect Your Devices</h2>
              <p>Connect your trainer and/or heart rate monitor to get started.</p>
            </div>
          ) : (
            <>
              <LiveDataDisplay />
              <WorkoutControls />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
