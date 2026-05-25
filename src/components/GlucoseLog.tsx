import type { GlucoseEntry } from '../types';
import { mealLabels } from '../types';
import { getGlucoseStatus, formatDate, formatTime, deleteEntry } from '../utils/helpers';
import { Trash2, Syringe, Apple, Clock, CalendarDays } from 'lucide-react';

interface GlucoseLogProps {
  entries: GlucoseEntry[];
  onEntryDeleted: (entries: GlucoseEntry[]) => void;
}

function getGlucoseBg(value: number): string {
  if (value < 70) return 'bg-blue-100 text-blue-600';
  if (value <= 100) return 'bg-green-100 text-green-600';
  if (value <= 140) return 'bg-yellow-100 text-yellow-600';
  if (value <= 200) return 'bg-orange-100 text-orange-600';
  return 'bg-red-100 text-red-600';
}

export default function GlucoseLog({ entries, onEntryDeleted }: GlucoseLogProps) {
  const handleDelete = (id: string) => {
    const updated = deleteEntry(id);
    onEntryDeleted(updated);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 dark:text-gray-400 font-medium">No hay mediciones registradas</p>
        <p className="text-gray-300 dark:text-gray-500 text-sm mt-1">Comienza registrando tu primera medición</p>
      </div>
    );
  }

  // Group entries by date
  const grouped = entries.reduce<Record<string, GlucoseEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, dayEntries]) => (
        <div key={dateKey}>
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            {dateKey}
          </h4>
          <div className="space-y-2">
            {dayEntries.map((entry) => {
              const status = getGlucoseStatus(entry.value);
              const bgClass = getGlucoseBg(entry.value);
              return (
                <div
                  key={entry.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200 fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Glucose value badge */}
                      <div className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-lg ${bgClass}`}>
                        <span>{entry.value}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-800 dark:text-white">
                            {entry.value} mg/dL
                          </span>
                          <span className={`text-sm ${status.color}`}>
                            {status.emoji} {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.date)}
                          </span>
                          {entry.meal && (
                            <span className="flex items-center gap-1">
                              <Apple className="w-3 h-3" />
                              {mealLabels[entry.meal]}
                            </span>
                          )}
                          {entry.insulin && (
                            <span className="flex items-center gap-1">
                              <Syringe className="w-3 h-3" />
                              {entry.insulin} U
                            </span>
                          )}
                        </div>                          {entry.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
