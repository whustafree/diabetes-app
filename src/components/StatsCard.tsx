import type { DailyStats } from '../types';
import { getGlucoseStatus } from '../utils/helpers';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';

interface StatsCardProps {
 stats: DailyStats;
 lastValue: number;
}

export default function StatsCard({ stats, lastValue }: StatsCardProps) {
 const status = getGlucoseStatus(lastValue);

 const cards = [
 {
 label: 'Última Lectura',
 value: `${lastValue} mg/dL`,
 sub: status.label,
 icon: Activity,
 color: status.color,
 bg: 'bg-gray-800',
 },
 {
 label: 'Promedio (7 días)',
 value: `${stats.average} mg/dL`,
 sub: `${stats.entries} mediciones`,
 icon: TrendingDown,
 color: getGlucoseStatus(stats.average).color,
 bg: 'bg-gray-800',
 },
 {
 label: 'Mínimo',
 value: `${stats.min} mg/dL`,
 sub: '',
 icon: TrendingDown,
 color: 'text-blue-500',
 bg: 'bg-white',
 },
 {
 label: 'Máximo',
 value: `${stats.max} mg/dL`,
 sub: '',
 icon: TrendingUp,
 color: 'text-orange-500',
 bg: 'bg-gray-800',
 },
 ];

 return (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {cards.map((card) => {
 const Icon = card.icon;
 return (
 <div
 key={card.label}
 className={`${card.bg} rounded-2xl p-5 shadow-sm border border-gray-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
 >
 <div className="flex items-start justify-between mb-3">
 <span className="text-xs font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">
 {card.label}
 </span>
 <Icon className={`w-5 h-5 ${card.color}`} />
 </div>
 <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
 {card.sub && (
 <p className="text-xs text-gray-400 text-gray-400 mt-1 font-medium">{card.sub}</p>
 )}
 </div>
 );
 })}
 </div>
 );
}
