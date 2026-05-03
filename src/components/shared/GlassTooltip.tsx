import { COLORS } from '../../theme';
import { formatCurrency } from '../../utils/format';

interface GlassTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string; dataKey?: string }[];
  label?: string | number;
  labelPrefix?: string;
  compact?: boolean;
}

export default function GlassTooltip({ active, payload, label, labelPrefix, compact }: GlassTooltipProps) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelPrefix ? `${labelPrefix} ${label}` : label;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      backdropFilter: 'blur(6px)',
      minWidth: compact ? undefined : 160,
    }}>
      {displayLabel != null && (
        <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 6px 0' }}>{displayLabel}</p>
      )}
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 12, color: COLORS.textSecondary, margin: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || COLORS.accent, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: COLORS.textPrimary }}>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}
