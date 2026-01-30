import { useState } from 'react';
import { useDeviceStore } from '../../stores';

type ControlMode = 'erg' | 'resistance';

export function TrainerControl() {
  const { trainerConnected, setTargetPower, setTargetResistance } = useDeviceStore();
  const [mode, setMode] = useState<ControlMode>('erg');
  const [ergTarget, setErgTarget] = useState(150);
  const [resistanceLevel, setResistanceLevel] = useState(5);

  if (!trainerConnected) {
    return null;
  }

  const handleErgSubmit = async () => {
    const success = await setTargetPower(ergTarget);
    if (!success) {
      console.error('Failed to set target power');
    }
  };

  const handleResistanceSubmit = async () => {
    const success = await setTargetResistance(resistanceLevel);
    if (!success) {
      console.error('Failed to set resistance');
    }
  };

  return (
    <div className="trainer-control">
      <h3>Trainer Control</h3>

      <div className="mode-tabs">
        <button
          className={mode === 'erg' ? 'active' : ''}
          onClick={() => setMode('erg')}
        >
          ERG Mode
        </button>
        <button
          className={mode === 'resistance' ? 'active' : ''}
          onClick={() => setMode('resistance')}
        >
          Resistance Mode
        </button>
      </div>

      {mode === 'erg' && (
        <div className="control-panel">
          <label>
            Target Power (watts)
            <input
              type="number"
              value={ergTarget}
              onChange={(e) => setErgTarget(Number(e.target.value))}
              min={50}
              max={2000}
              step={5}
            />
          </label>
          <div className="quick-buttons">
            {[100, 150, 200, 250, 300].map((w) => (
              <button
                key={w}
                onClick={() => {
                  setErgTarget(w);
                  setTargetPower(w);
                }}
              >
                {w}W
              </button>
            ))}
          </div>
          <button onClick={handleErgSubmit} className="btn-apply">
            Set Target Power
          </button>
        </div>
      )}

      {mode === 'resistance' && (
        <div className="control-panel">
          <label>
            Resistance Level (0-20)
            <input
              type="range"
              value={resistanceLevel}
              onChange={(e) => setResistanceLevel(Number(e.target.value))}
              min={0}
              max={20}
              step={0.5}
            />
            <span className="resistance-value">{resistanceLevel.toFixed(1)}</span>
          </label>
          <button onClick={handleResistanceSubmit} className="btn-apply">
            Set Resistance
          </button>
        </div>
      )}
    </div>
  );
}
