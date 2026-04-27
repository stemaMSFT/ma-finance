import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

interface LineConfig {
  dataKey: string;
  label: string;
  color: string;
  strokeDasharray?: string;
}

interface ProjectionChartProps {
  data: Record<string, number | string>[];
  lines: LineConfig[];
  xKey: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  formatY?: (v: number) => string;
  formatTooltip?: (v: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltip,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string | number;
  formatTooltip: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip-entry" style={{ color: p.color }}>
          <span className="dot" style={{ background: p.color }} />
          {p.name}: <strong>{formatTooltip(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ProjectionChart({
  data,
  lines,
  xKey,
  height = 280,
  formatY = (v) => formatCurrency(v, true),
  formatTooltip = (v) => formatCurrency(v),
}: ProjectionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#888' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#888' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          content={
            <CustomTooltip formatTooltip={formatTooltip} />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {lines.map((l) => (
          <Line
            key={l.dataKey}
            type="monotone"
            dataKey={l.dataKey}
            name={l.label}
            stroke={l.color}
            strokeWidth={2.5}
            dot={false}
            strokeDasharray={l.strokeDasharray}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
