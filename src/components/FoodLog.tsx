import { useState, useMemo, useCallback } from 'react';
import { UtensilsCrossed, Plus, X, Search, Trash2, Apple, Beef, Wheat, Droplets, Timer, TrendingUp, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import PullToRefresh from './PullToRefresh';
import EmptyState from './EmptyState';
import type { FoodLogEntry, FoodLogMealType } from '../types';
import { foodLogMealLabels, foodLogMealIcons } from '../types';
import { loadFoodLog, addFoodEntry, deleteFoodEntry, getWeekFoodLog, getFoodLogStats } from '../utils/foodLog';
import { formatDate, formatTime } from '../utils/helpers';

const mealTypes: FoodLogMealType[] = ['desayuno', 'almuerzo', 'cena', 'snack', 'colacion'];

export default function FoodLog() {
 const [entries, setEntries] = useState<FoodLogEntry[]>(() => loadFoodLog());
 const [showForm, setShowForm] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');

 const weekEntries = useMemo(() => getWeekFoodLog(), [entries]);
 const stats = useMemo(() => getFoodLogStats(weekEntries), [weekEntries]);

 const filtered = useMemo(() => {
 if (!searchQuery) return entries;
 const q = searchQuery.toLowerCase();
 return entries.filter(e =>
 e.foods.toLowerCase().includes(q) ||
 foodLogMealLabels[e.mealType].toLowerCase().includes(q) ||
 e.notes?.toLowerCase().includes(q)
 );
 }, [entries, searchQuery]);

 const handleAdd = (entry: Omit<FoodLogEntry, 'id' | 'createdAt'>) => {
 const updated = addFoodEntry(entry);
 setEntries(updated);
 setShowForm(false);
 };

 const handleDelete = (id: string) => {
 const updated = deleteFoodEntry(id);
 setEntries(updated);
 };  const handleRefresh = useCallback(() => {
    const updated = loadFoodLog();
    setEntries(updated);
  }, []);

  return (
 <PullToRefresh onRefresh={handleRefresh}>
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <UtensilsCrossed className="w-6 h-6 text-orange-500"/>
 <h2 className="text-2xl font-extrabold text-white">Registro de Comidas</h2>
 </div>
 <p className="text-sm text-gray-400 text-gray-500">
 Lleva el control de lo que realmente comes
 </p>
 </div>
 <button
 onClick={() => setShowForm(!showForm)}
 className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-900/50 transition-all active:scale-95"
 >
 <Plus className="w-4 h-4"/>
 Registrar comida
 </button>
 </div>

 {/* Formulario rápido */}
 {showForm && (
 <FoodForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
 )}

 {/* Stats semanales */}
 {weekEntries.length > 0 && (
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700">
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comidas esta semana</p>
 <p className="text-2xl font-extrabold text-white mt-1">{stats.totalMeals}</p>
 </div>
 <div className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700">
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Carbohidratos totales</p>
 <p className="text-2xl font-extrabold text-orange-400 mt-1">{stats.totalCarbs}g</p>
 </div>
 <div className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700">
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Promedio por comida</p>
 <p className="text-2xl font-extrabold text-white mt-1">{stats.averageCarbsPerMeal}g</p>
 </div>
 <div className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700">
 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Días con registro</p>
 <p className="text-2xl font-extrabold text-emerald-400 mt-1">
 {new Set(weekEntries.map(e => e.date.split('T')[0])).size}
 </p>
 </div>
 </div>
 )}

 {/* Search */}
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Buscar en tu registro de comidas..."
 className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-700 border-gray-600 bg-gray-800 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
 />
 </div>

 {/* Empty / No results */}
 {filtered.length === 0 ? (
 <EmptyState
 icon={searchQuery ? Search : Inbox}
 emoji={searchQuery ? undefined : '🍽️'}
 title={searchQuery ? 'Sin resultados' : 'No hay comidas registradas'}
 description={searchQuery
 ? 'Intenta con otros términos de búsqueda'
 : 'Registra tu primera comida para empezar a llevar el control de tu alimentación'
 }
 action={!searchQuery ? {
 label: 'Registrar comida',
 onClick: () => setShowForm(true),
 icon: Plus,
 } : undefined}
 />  ) : (
     <div className="space-y-3">
      {filtered.map(entry => (
       <FoodLogCard key={entry.id} entry={entry} onDelete={handleDelete} />
      ))}
     </div>
    )}
    </div>
    </PullToRefresh>
   );
}

// ─── Food Form ───

function FoodForm({ onSubmit, onCancel }: {
 onSubmit: (entry: Omit<FoodLogEntry, 'id' | 'createdAt'>) => void;
 onCancel: () => void;
}) {
 const [mealType, setMealType] = useState<FoodLogMealType>('almuerzo');
 const [foods, setFoods] = useState('');
 const [carbs, setCarbs] = useState('');
 const [calories, setCalories] = useState('');
 const [glucoseBefore, setGlucoseBefore] = useState('');
 const [glucoseAfter, setGlucoseAfter] = useState('');
 const [notes, setNotes] = useState('');
 const [showAdvanced, setShowAdvanced] = useState(false);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!foods.trim()) return;

 onSubmit({
 date: new Date().toISOString(),
 mealType,
 foods: foods.trim(),
 carbs: carbs ? parseInt(carbs) : undefined,
 calories: calories ? parseInt(calories) : undefined,
 notes: notes.trim() || undefined,
 glucoseBefore: glucoseBefore ? parseInt(glucoseBefore) : undefined,
 glucoseAfter: glucoseAfter ? parseInt(glucoseAfter) : undefined,
 });
 };

 return (
 <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-5 shadow-md border border-orange-100 border-gray-700 space-y-4">
 {/* Meal type selector */}
 <div className="flex gap-2 flex-wrap">
 {mealTypes.map(type => (
 <button
 key={type}
 type="button"
 onClick={() => setMealType(type)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
 mealType === type
 ? 'bg-orange-100 bg-orange-900/40 text-orange-400 border border-orange-700'
 : 'bg-gray-50 bg-gray-700 text-gray-400 border border-gray-700 border-gray-600 hover:border-orange-200'
 }`}
 >
 <span>{foodLogMealIcons[type]}</span>
 {foodLogMealLabels[type]}
 </button>
 ))}
 </div>

 {/* Foods description */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5">
 ¿Qué comiste?
 </label>
 <textarea
 value={foods}
 onChange={e => setFoods(e.target.value)}
 placeholder="Ej: Pechuga de pollo con ensalada, arroz integral y frijoles"
 rows={3}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm resize-none"
 required
 />
 </div>

 {/* Quick macros row */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
 <Wheat className="w-3 h-3 text-orange-500"/>
 Carbohidratos (g) — opcional
 </label>
 <input
 type="number"
 value={carbs}
 onChange={e => setCarbs(e.target.value)}
 placeholder="45"
 className="w-full px-3 py-2.5 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
 <Apple className="w-3 h-3 text-green-500"/>
 Calorías — opcional
 </label>
 <input
 type="number"
 value={calories}
 onChange={e => setCalories(e.target.value)}
 placeholder="450"
 className="w-full px-3 py-2.5 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
 />
 </div>
 </div>

 {/* Advanced toggle */}
 <button
 type="button"
 onClick={() => setShowAdvanced(!showAdvanced)}
 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-400 transition-colors"
 >
 {showAdvanced ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
 {showAdvanced ? 'Menos opciones' : 'Más opciones'}
 </button>

 {showAdvanced && (
 <div className="space-y-3 pt-2 border-t border-gray-700">
 {/* Glucose before/after */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
 <Timer className="w-3 h-3 text-blue-500"/>
 Glucosa antes (mg/dL)
 </label>
 <input
 type="number"
 value={glucoseBefore}
 onChange={e => setGlucoseBefore(e.target.value)}
 placeholder="120"
 className="w-full px-3 py-2.5 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
 <TrendingUp className="w-3 h-3 text-red-500"/>
 Glucosa después (mg/dL)
 </label>
 <input
 type="number"
 value={glucoseAfter}
 onChange={e => setGlucoseAfter(e.target.value)}
 placeholder="140"
 className="w-full px-3 py-2.5 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
 />
 </div>
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">
 Notas
 </label>
 <input
 type="text"
 value={notes}
 onChange={e => setNotes(e.target.value)}
 placeholder="¿Cómo te sientes? ¿Alguna observación?"
 className="w-full px-3 py-2.5 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
 />
 </div>
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={onCancel}
 className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-700 transition-all"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all active:scale-95 text-sm shadow-lg shadow-orange-900/50"
 >
 Guardar registro
 </button>
 </div>
 </form>
 );
}

// ─── Food Log Card ───

function FoodLogCard({ entry, onDelete }: { entry: FoodLogEntry; onDelete: (id: string) => void }) {
 const [showDelete, setShowDelete] = useState(false);

 const glucoseImpact = entry.glucoseBefore && entry.glucoseAfter
 ? entry.glucoseAfter - entry.glucoseBefore
 : null;

 return (
 <div className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700 hover:shadow-md transition-all">
 <div className="flex items-start gap-3">
 {/* Icon */}
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
 entry.mealType === 'desayuno' ? 'bg-yellow-900/30' :
 entry.mealType === 'almuerzo' ? 'bg-orange-900/30' :
 entry.mealType === 'cena' ? 'bg-indigo-900/30' :
 'bg-green-900/30'
 }`}>
 {foodLogMealIcons[entry.mealType]}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="text-xs font-semibold text-gray-400 text-gray-400 bg-gray-700 px-2 py-0.5 rounded-lg">
 {foodLogMealLabels[entry.mealType]}
 </span>
 <span className="text-[10px] text-gray-300 text-gray-600">
 {formatDate(entry.date)} • {formatTime(entry.createdAt)}
 </span>
 </div>
 <p className="text-sm font-semibold text-white mt-1">
 {entry.foods}
 </p>

 {/* Macros row */}
 <div className="flex items-center gap-3 mt-2">
 {entry.carbs !== undefined && (
 <span className="flex items-center gap-1 text-xs text-gray-400 bg-orange-900/20 px-2 py-0.5 rounded-lg">
 <Wheat className="w-3 h-3 text-orange-500"/>
 {entry.carbs}g carbs
 </span>
 )}
 {entry.calories !== undefined && (
 <span className="flex items-center gap-1 text-xs text-gray-400 bg-green-900/20 px-2 py-0.5 rounded-lg">
 <Apple className="w-3 h-3 text-green-500"/>
 {entry.calories} kcal
 </span>
 )}
 {glucoseImpact !== null && (
 <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${
 glucoseImpact > 30
 ? 'bg-red-50 text-red-400 bg-red-900/20 text-red-400'
 : glucoseImpact > 0
 ? 'bg-yellow-50 text-yellow-400 bg-yellow-900/20 text-yellow-400'
 : 'bg-green-50 text-green-400 bg-green-900/20 text-green-400'
 }`}>
 <TrendingUp className="w-3 h-3"/>
 {glucoseImpact > 0 ? '+' : ''}{glucoseImpact} mg/dL
 </span>
 )}
 </div>

 {entry.notes && (
 <p className="text-xs text-gray-400 text-gray-400 mt-2 italic">
 {entry.notes}
 </p>
 )}
 </div>

 {/* Delete button */}
 <div className="relative flex-shrink-0">
 <button
 onClick={() => setShowDelete(!showDelete)}
 className="p-2 text-gray-300 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:bg-red-900/20 rounded-xl transition-all"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 {showDelete && (
 <div className="absolute right-0 top-full mt-1 bg-gray-800 bg-gray-700 rounded-xl shadow-xl border border-gray-700 border-gray-600 z-10 p-2 min-w-[140px] animate-[fadeIn_0.15s_ease-out]">
 <p className="text-xs text-gray-400 mb-2 px-2">¿Eliminar registro?</p>
 <div className="flex gap-1">
 <button
 onClick={() => setShowDelete(false)}
 className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:bg-gray-700 hover:bg-gray-600 transition-all"
 >
 No
 </button>
 <button
 onClick={() => { onDelete(entry.id); setShowDelete(false); }}
 className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
 >
 Sí
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
