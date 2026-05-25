import type { GlucoseEntry } from '../types';

export interface HealthScoreResult {
  score: number; // 0-100
  label: string;
  color: string;
  emoji: string;
  details: {
    daysInRange: number;
    totalDays: number;
    inRangePercentage: number;
    averageGlucose: number;
    consistency: 'excelente' | 'buena' | 'regular' | 'variable';
    trend: 'mejorando' | 'estable' | 'empeorando';
    readingsPerDay: number;
  };
}

export function calculateHealthScore(entries: GlucoseEntry[]): HealthScoreResult {
  if (entries.length === 0) {
    return {
      score: 0,
      label: 'Sin datos',
      color: 'text-gray-400',
      emoji: '📊',
      details: {
        daysInRange: 0,
        totalDays: 0,
        inRangePercentage: 0,
        averageGlucose: 0,
        consistency: 'regular',
        trend: 'estable',
        readingsPerDay: 0,
      },
    };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const lastWeekEntries = entries.filter(e => new Date(e.date) >= weekAgo);
  const previousWeekEntries = entries.filter(
    e => new Date(e.date) >= twoWeeksAgo && new Date(e.date) < weekAgo
  );

  // Days in range (70-140 mg/dL is ideal range)
  const inRange = lastWeekEntries.filter(e => e.value >= 70 && e.value <= 140).length;
  const total = lastWeekEntries.length;
  const inRangePercentage = total > 0 ? Math.round((inRange / total) * 100) : 0;

  // Average glucose
  const averageGlucose = total > 0
    ? Math.round(lastWeekEntries.reduce((s, e) => s + e.value, 0) / total)
    : 0;

  // Consistency: standard deviation
  const consistency = calculateConsistency(lastWeekEntries, averageGlucose);

  // Trend: compare last 3 days vs previous 3 days
  const trend = calculateTrend(lastWeekEntries, previousWeekEntries, averageGlucose);

  // Readings per day
  const uniqueDays = new Set(lastWeekEntries.map(e => e.date.split('T')[0])).size;
  const readingsPerDay = uniqueDays > 0
    ? Math.round((total / uniqueDays) * 10) / 10
    : 0;

  // Calculate score (0-100)
  let score = 0;

  // In-range percentage: up to 40 points
  score += Math.round((inRangePercentage / 100) * 40);

  // Average glucose proximity to ideal (90): up to 30 points
  const idealGlucose = 90;
  const deviation = Math.abs(averageGlucose - idealGlucose);
  if (deviation <= 10) score += 30;
  else if (deviation <= 20) score += 25;
  else if (deviation <= 30) score += 20;
  else if (deviation <= 50) score += 12;
  else if (deviation <= 70) score += 5;

  // Consistency: up to 15 points
  if (consistency === 'excelente') score += 15;
  else if (consistency === 'buena') score += 10;
  else if (consistency === 'regular') score += 5;

  // Reading frequency: up to 15 points
  if (readingsPerDay >= 3) score += 15;
  else if (readingsPerDay >= 2) score += 12;
  else if (readingsPerDay >= 1) score += 8;
  else score += 3;

  // Cap at 100
  score = Math.min(100, Math.max(0, score));

  const label = getScoreLabel(score);
  const color = getScoreColor(score);
  const emoji = getScoreEmoji(score);

  return {
    score,
    label,
    color,
    emoji,
    details: {
      daysInRange: inRange,
      totalDays: total,
      inRangePercentage,
      averageGlucose,
      consistency,
      trend,
      readingsPerDay,
    },
  };
}

function calculateConsistency(entries: GlucoseEntry[], average: number): 'excelente' | 'buena' | 'regular' | 'variable' {
  if (entries.length < 2) return 'regular';

  const variance = entries.reduce((s, e) => s + Math.pow(e.value - average, 2), 0) / entries.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev <= 15) return 'excelente';
  if (stdDev <= 25) return 'buena';
  if (stdDev <= 40) return 'regular';
  return 'variable';
}

function calculateTrend(
  currentWeek: GlucoseEntry[],
  previousWeek: GlucoseEntry[],
  currentAvg: number
): 'mejorando' | 'estable' | 'empeorando' {
  if (previousWeek.length === 0) return 'estable';

  const prevAvg = previousWeek.reduce((s, e) => s + e.value, 0) / previousWeek.length;
  const diff = currentAvg - prevAvg;

  if (diff <= -5) return 'mejorando';
  if (diff >= 5) return 'empeorando';
  return 'estable';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Muy buena';
  if (score >= 60) return 'Buena';
  if (score >= 40) return 'Regular';
  if (score >= 20) return 'Necesita atención';
  return 'Requiere revisión';
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-yellow-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 75) return '🌟';
  if (score >= 60) return '👍';
  if (score >= 40) return '📊';
  if (score >= 20) return '⚠️';
  return '🔴';
}

// ─── Weekly trend data for charts ───

export interface WeekTrendPoint {
  date: string;
  label: string;
  average: number;
  min: number;
  max: number;
  entries: number;
}

export function getWeeklyTrend(entries: GlucoseEntry[]): WeekTrendPoint[] {
  const points: WeekTrendPoint[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = day.toISOString().split('T')[0];
    const dayEntries = entries.filter(e => e.date.startsWith(dayStr));

    const values = dayEntries.map(e => e.value);
    const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

    points.push({
      date: dayStr,
      label: day.toLocaleDateString('es-ES', { weekday: 'short' }),
      average: avg,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      entries: values.length,
    });
  }

  return points;
}
