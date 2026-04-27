import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

interface BarConfig {
  dataKey: string;
  label: string;
  color: string;
}

interface ComparisonChartProps {
  data: Record<string, number | string>[];
  bars: BarConfig[];
  xKey: string;
  height?: number;
  formatY?: (v: number) => string;
  formatTooltip?: (v: number) => string;
  colorByData?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltip,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string | number;
  formatTooltip: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip-entry">
          <span className="dot" style={{ background: p.fill }} />
          {p.name}: <strong>{formatTooltip(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ComparisonChart({
  data,
  bars,
  xKey,
  height = 260,
  formatY = (v) => formatCurrency(v, true),
  formatTooltip = (v) => formatCurrency(v),
  colorByData = false,
}: ComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
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
          content={<CustomTooltip formatTooltip={formatTooltip} />}
          cursor={{ fill: 'rgba(108,99,255,0.05)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {bars.map((b) => (
          <Bar key={b.dataKey} dataKey={b.dataKey} name={b.label} fill={b.color} radius={[4, 4, 0, 0]}>
            {colorByData &&
              data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={bars[idx % bars.length]?.color ?? b.color}
                />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
