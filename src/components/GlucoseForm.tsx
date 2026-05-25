import { useState } from 'react';
import type { MealType, GlucoseEntry } from '../types';
import { mealLabels } from '../types';
import { addEntry, generateId } from '../utils/helpers';
import { PlusCircle, Syringe, Apple, StickyNote } from 'lucide-react';

interface GlucoseFormProps {
  onEntryAdded: (entries: GlucoseEntry[]) => void;
}

export default function GlucoseForm({ onEntryAdded }: GlucoseFormProps) {
  const [value, setValue] = useState('');
  const [meal, setMeal] = useState<MealType | ''>('');
  const [insulin, setInsulin] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const glucoseValue = parseFloat(value);
    if (isNaN(glucoseValue) || glucoseValue < 20 || glucoseValue > 600) return;

    const now = new Date().toISOString();
    const entry: GlucoseEntry = {
      id: generateId(),
      date: now,
      value: glucoseValue,
      meal: meal ? (meal as MealType) : undefined,
      insulin: insulin ? parseFloat(insulin) : undefined,
      notes: notes || undefined,
      createdAt: now,
    };

    const updatedEntries = addEntry(entry);
    onEntryAdded(updatedEntries);

    setValue('');
    setMeal('');
    setInsulin('');
    setNotes('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98]"
      >
        <PlusCircle className="w-5 h-5" />
        Nueva Medición
      </button>
    );
  }

  const glucoseValue = parseFloat(value);
  const isValid = !isNaN(glucoseValue) && glucoseValue >= 20 && glucoseValue <= 600;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Nueva Medición</h3>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Glucose Value */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
          Glucosa (mg/dL)
        </label>
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: 110"
            min={20}
            max={600}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg font-medium"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 font-medium">
            mg/dL
          </span>
        </div>
        {value && (
          <div className="mt-2 flex gap-2">
            {[70, 100, 140, 180, 250].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue(String(v))}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  String(v) === value
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Meal Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
          <Apple className="w-4 h-4" />
          Momento
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(mealLabels) as [MealType, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMeal(meal === key ? '' : key)}
              className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                meal === key
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Insulin */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
          <Syringe className="w-4 h-4" />
          Insulina (unidades)
        </label>
        <input
          type="number"
          value={insulin}
          onChange={(e) => setInsulin(e.target.value)}
          placeholder="Opcional"
          min={0}
          max={100}
          step={0.5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
          <StickyNote className="w-4 h-4" />
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional - Ej: Sentí mareos, comí mucho carbohidrato..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        <PlusCircle className="w-5 h-5" />
        Registrar Medición
      </button>
    </form>
  );
}
