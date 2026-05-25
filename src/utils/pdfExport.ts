import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { GlucoseEntry } from '../types';
import { loadEntries } from './helpers';
import { loadFoodLog, getFoodLogStats } from './foodLog';
import { calculateHealthScore, getWeeklyTrend } from './healthScore';
import type { HealthScoreResult, WeekTrendPoint } from './healthScore';
import { getGlucoseStatus } from './helpers';

// ─── PDF Report Generator ───

export interface PdfReportOptions {
  title?: string;
  includeGlucoseChart?: boolean;
  includeHealthScore?: boolean;
  includeFoodLog?: boolean;
  includeStats?: boolean;
}

export async function generatePdfReport(
  chartElement?: HTMLElement | null,
  options: PdfReportOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const entries = loadEntries();
  const foodLog = loadFoodLog();
  const healthScore = entries.length > 0 ? calculateHealthScore(entries) : null;
  const weekTrend = entries.length > 0 ? getWeeklyTrend(entries) : [];
  const weekFoodLog = loadFoodLog().filter(e => {
    const d = new Date(e.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });
  const foodStats = getFoodLogStats(weekFoodLog);

  // ─── Title Page ───
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 80, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Diabetes Control', margin, 35);
  doc.setFontSize(14);
  doc.text('Reporte de Salud', margin, 48);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })}`, margin, 60);

  y = 100;

  // ─── Summary Stats ───
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.text('Resumen General', margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Two-column stats
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);

  const leftCol = [
    `Mediciones totales: ${entries.length}`,
    `Registros de comida: ${foodLog.length}`,
    `Health Score: ${healthScore ? `${healthScore.score}/100` : 'Sin datos'}`,
  ];
  const rightCol = [
    `Categoría: ${healthScore ? healthScore.label : '—'}`,
    `Tendencia: ${healthScore ? healthScore.details.trend : '—'}`,
    `Comidas esta semana: ${foodStats.totalMeals}`,
  ];

  leftCol.forEach((text, i) => {
    doc.text(text, margin, y + i * 6);
  });
  rightCol.forEach((text, i) => {
    doc.text(text, pageWidth / 2, y + i * 6);
  });

  y += leftCol.length * 6 + 12;

  // ─── Glucose Stats ───
  if (entries.length > 0 && options.includeStats !== false) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(13);
    doc.text('Estadísticas de Glucosa', margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const avg = Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length);
    const min = Math.min(...entries.map(e => e.value));
    const max = Math.max(...entries.map(e => e.value));
    const inRange = entries.filter(e => e.value >= 70 && e.value <= 140).length;
    const inRangePct = Math.round((inRange / entries.length) * 100);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    const glucoseStats = [
      ['Promedio', `${avg} mg/dL`],
      ['Mínimo', `${min} mg/dL`],
      ['Máximo', `${max} mg/dL`],
      ['En rango (70-140)', `${inRangePct}% (${inRange} de ${entries.length})`],
    ];

    glucoseStats.forEach(([label, value]) => {
      doc.text(label, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });

    y += 6;
  }

  // ─── Health Score ───
  if (healthScore && options.includeHealthScore !== false) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(13);
    doc.text('Puntaje de Salud', margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    const healthDetails = [
      ['Puntaje', `${healthScore.score}/100 · ${healthScore.label}`],
      ['Tendencia', healthScore.details.trend === 'mejorando' ? '↑ Mejorando' : healthScore.details.trend === 'empeorando' ? '↓ Empeorando' : '→ Estable'],
      ['% en rango (última semana)', `${healthScore.details.inRangePercentage}%`],
      ['Glucosa promedio', `${healthScore.details.averageGlucose} mg/dL`],
      ['Consistencia', healthScore.details.consistency],
      ['Mediciones/día', `${healthScore.details.readingsPerDay}`],
    ];

    healthDetails.forEach(([label, value]) => {
      doc.text(label, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });

    y += 6;
  }

  // ─── Weekly Trend Data ───
  if (weekTrend.length > 0) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(13);
    doc.text('Tendencia Semanal', margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    // Table header
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    const colWidths = [22, 28, 22, 22, 22];
    const headers = ['Día', 'Promedio', 'Mín', 'Máx', 'Mediciones'];
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 4);
      x += colWidths[i];
    });
    y += 10;

    doc.setTextColor(60, 60, 60);
    weekTrend.forEach((day) => {
      const values = [day.label, day.entries > 0 ? `${day.average} mg/dL` : '—', day.min > 0 ? `${day.min}` : '—', day.max > 0 ? `${day.max}` : '—', `${day.entries}`];
      x = margin;
      values.forEach((v, i) => {
        doc.text(v, x + 2, y);
        x += colWidths[i];
      });
      y += 5;

      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    });

    y += 6;
  }

  // ─── Food Log Stats ───
  if (weekFoodLog.length > 0 && options.includeFoodLog !== false) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(13);
    doc.text('Registro de Comidas (última semana)', margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    const foodStatsData = [
      ['Total de comidas', `${foodStats.totalMeals}`],
      ['Carbohidratos totales', `${foodStats.totalCarbs}g`],
      ['Promedio de carbs/comida', `${foodStats.averageCarbsPerMeal}g`],
      ['Calorías totales', `${foodStats.totalCalories} kcal`],
      ['Promedio de calorías/comida', `${foodStats.averageCaloriesPerMeal} kcal`],
    ];

    foodStatsData.forEach(([label, value]) => {
      doc.text(label, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    });

    y += 6;
  }

  // ─── Chart Image ───
  if (chartElement && options.includeGlucoseChart !== false) {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      // Check if we need a new page
      if (y + imgHeight > 270) {
        doc.addPage();
        y = margin;
      }

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(13);
      doc.text('Gráfica de Glucosa', margin, y);
      y += 8;

      doc.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 120));
      y += Math.min(imgHeight, 120) + 10;
    } catch (e) {
      // If chart capture fails, skip it
      console.warn('Error capturing chart:', e);
    }
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Diabetes Control - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadPdf(doc: jsPDF, filename?: string): void {
  const name = filename || `diabetes-control-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

// ─── Formatear datos para imprimir ───

export function formatGlucoseTable(entries: GlucoseEntry[]): string[][] {
  return entries.slice(0, 20).map(e => [
    new Date(e.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    `${e.value} mg/dL`,
    getGlucoseStatus(e.value).emoji + ' ' + getGlucoseStatus(e.value).label,
    e.meal || '—',
    e.insulin ? `${e.insulin} U` : '—',
    e.notes || '—',
  ]);
}
