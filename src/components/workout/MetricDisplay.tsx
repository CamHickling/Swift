interface MetricDisplayProps {
  label: string;
  value: number;
  unit: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  secondary?: number;
  secondaryLabel?: string;
}

export function MetricDisplay({
  label,
  value,
  unit,
  size = 'medium',
  color,
  secondary,
  secondaryLabel,
}: MetricDisplayProps) {
  const sizeClass = `metric-${size}`;

  return (
    <div className={`metric-display ${sizeClass}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={color ? { color } : undefined}>
        {Math.round(value)}
        <span className="metric-unit">{unit}</span>
      </div>
      {secondary !== undefined && (
        <div className="metric-secondary">
          {secondaryLabel}: {Math.round(secondary)}
        </div>
      )}
    </div>
  );
}
