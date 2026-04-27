interface PercentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  disabled?: boolean;
  decimals?: number;
}

export default function PercentInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  helpText,
  disabled = false,
  decimals = 1,
}: PercentInputProps) {
  return (
    <div className="input-field">
      <label className="input-label">{label}</label>
      <div className="input-wrapper percent">
        <input
          type="number"
          className="input-control"
          value={parseFloat(value.toFixed(decimals))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              onChange(Math.min(max, Math.max(min, v)));
            }
          }}
        />
        <span className="input-affix input-suffix">%</span>
      </div>
      {helpText && <span className="input-help">{helpText}</span>}
    </div>
  );
}
