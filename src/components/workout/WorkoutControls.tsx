import { useWorkoutStore, useLiveDataStore, useDeviceStore } from '../../stores';
import { useEffect, useRef } from 'react';

export function WorkoutControls() {
  const {
    status,
    startFreeRide,
    pause,
    resume,
    stop,
    addSample,
    tick,
    reset,
    targetPower,
  } = useWorkoutStore();

  const { current } = useLiveDataStore();
  const { trainerConnected, setTargetPower } = useDeviceStore();

  const tickIntervalRef = useRef<number | null>(null);

  // Handle workout tick (1 second intervals)
  useEffect(() => {
    if (status === 'running') {
      tickIntervalRef.current = window.setInterval(() => {
        tick();
        // Add sample at 1Hz
        addSample({
          power: current.power,
          cadence: current.cadence,
          heartRate: current.heartRate || undefined,
          speed: current.speed,
        });
      }, 1000);
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [status, tick, addSample, current]);

  // Apply target power to trainer when it changes
  useEffect(() => {
    if (targetPower && trainerConnected && status === 'running') {
      setTargetPower(targetPower);
    }
  }, [targetPower, trainerConnected, status, setTargetPower]);

  const handleStart = () => {
    startFreeRide();
  };

  const handleStop = async () => {
    const record = await stop();
    if (record) {
      console.log('Workout saved:', record);
    }
  };

  const handleReset = () => {
    reset();
    useLiveDataStore.getState().reset();
  };

  return (
    <div className="workout-controls">
      {status === 'idle' && (
        <button onClick={handleStart} className="btn-start" disabled={!trainerConnected}>
          {trainerConnected ? 'Start Free Ride' : 'Connect Trainer First'}
        </button>
      )}

      {status === 'running' && (
        <>
          <button onClick={pause} className="btn-pause">
            Pause
          </button>
          <button onClick={handleStop} className="btn-stop">
            Stop & Save
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button onClick={resume} className="btn-resume">
            Resume
          </button>
          <button onClick={handleStop} className="btn-stop">
            Stop & Save
          </button>
        </>
      )}

      {status === 'completed' && (
        <button onClick={handleReset} className="btn-reset">
          New Workout
        </button>
      )}
    </div>
  );
}
