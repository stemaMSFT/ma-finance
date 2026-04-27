interface ToggleInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helpText?: string;
  disabled?: boolean;
  onLabel?: string;
  offLabel?: string;
}

export default function ToggleInput({
  label,
  checked,
  onChange,
  helpText,
  disabled = false,
  onLabel = 'On',
  offLabel = 'Off',
}: ToggleInputProps) {
  return (
    <div className="input-field toggle-field">
      <div className="toggle-row">
        <div className="toggle-labels">
          <span className="input-label">{label}</span>
          {helpText && <span className="input-help">{helpText}</span>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={`toggle-switch ${checked ? 'on' : 'off'}`}
          disabled={disabled}
          onClick={() => onChange(!checked)}
        >
          <span className="toggle-thumb" />
          <span className="toggle-text">{checked ? onLabel : offLabel}</span>
        </button>
      </div>
    </div>
  );
}
