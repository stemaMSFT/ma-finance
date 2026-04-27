interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  helpText?: string;
  disabled?: boolean;
  showMinMax?: boolean;
}

export default function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  helpText,
  disabled = false,
  showMinMax = true,
}: SliderInputProps) {
  const display = formatValue ? formatValue(value) : String(value);
  const minDisplay = formatValue ? formatValue(min) : String(min);
  const maxDisplay = formatValue ? formatValue(max) : String(max);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="input-field slider-field">
      <div className="slider-header">
        <label className="input-label">{label}</label>
        <span className="slider-value">{display}</span>
      </div>
      <div className="slider-track-wrapper">
        <input
          type="range"
          className="slider-control"
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      {showMinMax && (
        <div className="slider-minmax">
          <span>{minDisplay}</span>
          <span>{maxDisplay}</span>
        </div>
      )}
      {helpText && <span className="input-help">{helpText}</span>}
    </div>
  );
}
