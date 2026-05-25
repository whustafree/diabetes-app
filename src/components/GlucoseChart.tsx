import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import type { GlucoseEntry } from '../types';
import { categorizeGlucose, categoryTextColors } from '../types';
import { formatTime } from '../utils/helpers';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface GlucoseChartProps {
  entries: GlucoseEntry[];
}

export default function GlucoseChart({ entries }: GlucoseChartProps) {
  const chartData = useMemo(() => {
    const last7 = entries.filter(
      (e) => new Date(e.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return last7
      .slice()
      .reverse()
      .map((e) => ({
        time: formatTime(e.date),
        value: e.value,
        date: new Date(e.date).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        }),
      }));
  }, [entries]);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const values = entries.map(e => e.value);
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange: values.filter(v => v >= 70 && v <= 140).length,
      total: values.length,
    };
  }, [entries]);

  const inRangePercent = stats ? Math.round((stats.inRange / stats.total) * 100) : 0;

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 dark:text-gray-400 font-medium">No hay datos para mostrar el gráfico</p>
        <p className="text-gray-300 dark:text-gray-500 text-sm mt-1">Registra mediciones para ver tendencias</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Tendencia (7 días)
        </h3>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              En rango: {inRangePercent}%
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Prom: {stats.avg}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-700" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[40, 300]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value: number) => [`${value} mg/dL`, 'Glucosa']}
            labelFormatter={(label, payload) => {
              if (payload?.[0]?.payload?.date) {
                return `${payload[0].payload.date} - ${label}`;
              }
              return label;
            }}
          />
          <ReferenceLine
            y={70}
            stroke="#60a5fa"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: '70',
              position: 'insideBottomRight',
              fill: '#60a5fa',
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={140}
            stroke="#eab308"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: '140',
              position: 'insideTopRight',
              fill: '#eab308',
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#glucoseGradient)"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500">Rango bajo (&lt;70)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500">Rango alto (&gt;140)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500">Rango normal</span>
        </div>
      </div>
    </div>
  );
}
