import { useCallback, useState, useEffect } from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  disabled?: boolean;
  compact?: boolean;
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  min,
  max,
  helpText,
  disabled = false,
}: CurrencyInputProps) {
  const format = (v: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(v));

  const [displayValue, setDisplayValue] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplayValue(format(value));
  }, [value, focused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      setDisplayValue(raw);
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        const clamped =
          min !== undefined
            ? Math.max(min, max !== undefined ? Math.min(max, num) : num)
            : max !== undefined
            ? Math.min(max, num)
            : num;
        onChange(clamped);
      } else if (raw === '') {
        onChange(0);
      }
    },
    [onChange, min, max],
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    setDisplayValue(format(value));
  }, [value]);

  return (
    <div className="input-field">
      <label className="input-label">{label}</label>
      <div className="input-wrapper currency">
        <span className="input-affix input-prefix">$</span>
        <input
          type="text"
          className="input-control"
          value={focused ? displayValue : format(value)}
          onChange={handleChange}
          onFocus={() => {
            setFocused(true);
            setDisplayValue(String(value));
          }}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>
      {helpText && <span className="input-help">{helpText}</span>}
    </div>
  );
}
