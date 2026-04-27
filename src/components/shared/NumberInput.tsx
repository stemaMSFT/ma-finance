interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  disabled?: boolean;
  suffix?: string;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  helpText,
  disabled = false,
  suffix,
}: NumberInputProps) {
  return (
    <div className="input-field">
      <label className="input-label">{label}</label>
      <div className={`input-wrapper${suffix ? ' has-suffix' : ''}`}>
        <input
          type="number"
          className="input-control"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              const clamped =
                min !== undefined
                  ? Math.max(min, max !== undefined ? Math.min(max, v) : v)
                  : max !== undefined
                  ? Math.min(max, v)
                  : v;
              onChange(clamped);
            }
          }}
        />
        {suffix && <span className="input-affix input-suffix">{suffix}</span>}
      </div>
      {helpText && <span className="input-help">{helpText}</span>}
    </div>
  );
}
