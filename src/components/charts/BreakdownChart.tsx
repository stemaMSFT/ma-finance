import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface BreakdownChartProps {
  data: DataItem[];
  height?: number;
  innerRadius?: number;
  formatValue?: (v: number) => string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const CustomTooltip = ({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: DataItem }[];
  formatValue: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-entry">
        <span className="dot" style={{ background: item.payload.color }} />
        {item.name}: <strong>{formatValue(item.value)}</strong>
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function BreakdownChart({
  data,
  height = 260,
  innerRadius = 55,
  formatValue = (v) => formatCurrency(v),
  showLegend = true,
  centerLabel,
  centerValue,
}: BreakdownChartProps) {
  const validData = data.filter((d) => d.value > 0);

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius + 60}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            paddingAngle={2}
          >
            {validData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
              iconType="circle"
              iconSize={8}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && centerValue && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -58%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
            {centerValue}
          </div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
            {centerLabel}
          </div>
        </div>
      )}
    </div>
  );
}
