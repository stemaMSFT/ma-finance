import { useState } from 'react';

interface InputGroupProps {
  title: string;
  helpText?: string;
  tooltip?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function InputGroup({
  title,
  helpText,
  tooltip,
  children,
  collapsible = false,
  defaultOpen = true,
}: InputGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="input-group card">
      <div
        className={`input-group-header${collapsible ? ' collapsible' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <div className="input-group-title-row">
          <h3 className="input-group-title">{title}</h3>
          {tooltip && (
            <span
              className="tooltip-anchor"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="tooltip-icon">?</span>
              {showTooltip && <div className="tooltip-box">{tooltip}</div>}
            </span>
          )}
        </div>
        {helpText && <p className="input-group-help">{helpText}</p>}
        {collapsible && (
          <span className={`collapse-arrow ${open ? 'open' : ''}`}>▾</span>
        )}
      </div>
      {(!collapsible || open) && <div className="input-group-body">{children}</div>}
    </div>
  );
}
