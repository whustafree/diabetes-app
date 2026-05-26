import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, UtensilsCrossed, Apple, Beef, Wheat, Droplets, Flame, Salad, Search, ChevronDown, ChevronUp, Info, ArrowLeft } from 'lucide-react';
import type { DayMealPlan, Recipe, MealSlot } from '../types';
import { mealSlotLabels } from '../types';
import { generateWeeklyMealPlan, getRecipesByMealSlot, searchRecipes, getMealSuggestionForGlucose } from '../utils/meals';

const igColors: Record<string, string> = {
 bajo: 'bg-green-900/40 text-green-300',
 medio: 'bg-yellow-900/40 text-yellow-300',
 alto: 'bg-red-900/40 text-red-300',
};

export default function MealPlanner() {
 const [weekPlan] = useState<DayMealPlan[]>(() => generateWeeklyMealPlan(1800));
 const [selectedDay, setSelectedDay] = useState(0);
 const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [showMealSuggestion, setShowMealSuggestion] = useState(false);
 const [glucoseInput, setGlucoseInput] = useState('');

 const currentDay = weekPlan[selectedDay];

 const recipeSuggestions = useMemo(() => {
 if (!searchQuery) return [];
 return searchRecipes(searchQuery).slice(0, 6);
 }, [searchQuery]);

 const breakfasts = useMemo(() => getRecipesByMealSlot('desayuno'), []);
 const lunches = useMemo(() => getRecipesByMealSlot('almuerzo'), []);
 const dinners = useMemo(() => getRecipesByMealSlot('cena'), []);

 const glucoseSuggestion = useMemo(() => {
 const val = parseFloat(glucoseInput);
 if (!val || val < 20 || val > 600) return null;
 return getMealSuggestionForGlucose(val);
 }, [glucoseInput]);

 // ─── RECIPE DETAIL MODAL ───
 if (selectedRecipe) {
 return (
 <div className="max-w-3xl mx-auto">
 <button
 onClick={() => setSelectedRecipe(null)}
 className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-300 mb-4 transition-colors"
 >
 <ArrowLeft className="w-4 h-4"/>
 Volver al plan semanal
 </button>
 <RecipeDetail recipe={selectedRecipe} />
 </div>
 );
 }

 return (
 <div className="max-w-5xl mx-auto space-y-6">
 {/* Header */}
 <div className="text-center">
 <div className="flex items-center justify-center gap-3 mb-2">
 <Salad className="w-7 h-7 text-green-600"/>
 <h2 className="text-2xl font-extrabold text-white">Plan de Comidas</h2>
 </div>
 <p className="text-gray-400 text-gray-400 text-sm">Recetas saludables y balanceadas para diabéticos</p>
 </div>

 {/* Glucose-based suggestion */}
 <div className="bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <button
 onClick={() => setShowMealSuggestion(!showMealSuggestion)}
 className="flex items-center justify-between w-full"
 >
 <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
 <Info className="w-4 h-4 text-blue-500"/>
 Sugerencia de comida según tu glucosa
 </span>
 {showMealSuggestion ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
 </button>
 {showMealSuggestion && (
 <div className="mt-4 space-y-3">
 <div className="flex gap-3">
 <input
 type="number"
 value={glucoseInput}
 onChange={e => setGlucoseInput(e.target.value)}
 placeholder="Ingresa tu glucosa actual (mg/dL)"
 className="flex-1 px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
 />
 </div>
 {glucoseSuggestion && (
 <div className="p-4 rounded-xl bg-gray-700/50 border border-gray-700 border-gray-600 space-y-3">
 <h4 className="font-bold text-white text-sm">{glucoseSuggestion.title}</h4>
 <p className="text-sm text-gray-300">{glucoseSuggestion.suggestion}</p>
 <div>
 <p className="text-xs font-semibold text-green-400 mb-1.5">✅ Recomendado:</p>
 <ul className="space-y-1">
 {glucoseSuggestion.foods.map((f, i) => (
 <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
 <span className="text-green-500 mt-0.5">•</span>
 {f}
 </li>
 ))}
 </ul>
 </div>
 {glucoseSuggestion.avoid.length > 0 && (
 <div>
 <p className="text-xs font-semibold text-red-300 mb-1.5">❌ Evitar:</p>
 <ul className="space-y-1">
 {glucoseSuggestion.avoid.map((f, i) => (
 <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
 <span className="text-red-500 mt-0.5">•</span>
 {f}
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Search */}
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Buscar recetas por nombre, ingrediente..."
 className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-700 border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
 />
 {searchQuery && recipeSuggestions.length > 0 && (
 <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 z-10 p-2 max-h-80 overflow-y-auto">
 {recipeSuggestions.map(recipe => (
 <button
 key={recipe.id}
 onClick={() => setSelectedRecipe(recipe)}
 className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-700 transition-colors text-left"
 >
 <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center text-lg">
 {recipe.mealSlot === 'desayuno' ? '🌅' : recipe.mealSlot === 'almuerzo' ? '🌞' : recipe.mealSlot === 'cena' ? '🌙' : '🥜'}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-white truncate">{recipe.name}</p>
 <p className="text-xs text-gray-400 text-gray-500">{recipe.nutrition.calories} kcal · {recipe.prepTime} min</p>
 </div>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${igColors[recipe.glycemicIndex]}`}>
 {recipe.glycemicIndex === 'bajo' ? 'Bajo IG' : recipe.glycemicIndex === 'medio' ? 'Medio IG' : 'Alto IG'}
 </span>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Day Selector */}
 <div className="flex items-center gap-2 justify-center">
 <button
 onClick={() => setSelectedDay(d => Math.max(0, d - 1))}
 disabled={selectedDay === 0}
 className="p-2 rounded-xl text-gray-400 text-gray-400 hover:text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
 >
 <ChevronLeft className="w-5 h-5"/>
 </button>
 <div className="flex gap-2 overflow-x-auto py-1 px-1">
 {weekPlan.map((day, i) => (
 <button
 key={day.day}
 onClick={() => setSelectedDay(i)}
 className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
 i === selectedDay
 ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
 : 'bg-gray-800 text-gray-300 hover:text-gray-300 hover:text-white border border-gray-700 border-gray-600 hover:shadow-sm'
 }`}
 >
 {day.day}
 </button>
 ))}
 </div>
 <button
 onClick={() => setSelectedDay(d => Math.min(weekPlan.length - 1, d + 1))}
 disabled={selectedDay === weekPlan.length - 1}
 className="p-2 rounded-xl text-gray-400 text-gray-400 hover:text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
 >
 <ChevronRight className="w-5 h-5"/>
 </button>
 </div>

 {/* Day Meal Plan */}
 {currentDay && (
 <div className="space-y-4">
 {/* Day's total nutrition card */}
 <div className="bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-3">
 <h3 className="font-bold text-white flex items-center gap-2">
 <Calendar className="w-5 h-5 text-green-500"/>
 {currentDay.day} - Resumen Nutricional
 </h3>
 <span className="text-sm font-bold text-green-600">
 {currentDay.totalNutrition.calories} kcal
 </span>
 </div>
 <div className="grid grid-cols-4 gap-3">
 <div className="text-center p-2 rounded-lg bg-blue-900/30">
 <div className="text-xs text-blue-400 font-semibold">Proteína</div>
 <div className="text-sm font-bold text-blue-300">{currentDay.totalNutrition.protein}g</div>
 </div>
 <div className="text-center p-2 rounded-lg bg-orange-900/30">
 <div className="text-xs text-orange-400 font-semibold">Carbohidratos</div>
 <div className="text-sm font-bold text-orange-300">{currentDay.totalNutrition.carbs}g</div>
 </div>
 <div className="text-center p-2 rounded-lg bg-purple-900/30">
 <div className="text-xs text-purple-400 font-semibold">Grasas</div>
 <div className="text-sm font-bold text-purple-300">{currentDay.totalNutrition.fat}g</div>
 </div>
 <div className="text-center p-2 rounded-lg bg-green-900/30">
 <div className="text-xs text-green-400 font-semibold">Fibra</div>
 <div className="text-sm font-bold text-green-300">{currentDay.totalNutrition.fiber}g</div>
 </div>
 </div>
 </div>

 {/* Meals for the day */}
 {currentDay.meals.map((meal, i) => (
 <div
 key={meal.slot}
 className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
 onClick={() => setSelectedRecipe(meal.recipe)}
 >
 <div className="p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className={`p-2 rounded-xl text-lg ${
 meal.slot === 'desayuno' ? 'bg-yellow-900/40' :
 meal.slot === 'almuerzo' ? 'bg-orange-900/40' :
 meal.slot === 'cena' ? 'bg-indigo-900/40' : 'bg-green-900/40'
 }`}>
 {meal.slot === 'desayuno' ? '🌅' : meal.slot === 'almuerzo' ? '🌞' : meal.slot === 'cena' ? '🌙' : '🥜'}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-white">{mealSlotLabels[meal.slot]}</h4>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${igColors[meal.recipe.glycemicIndex]}`}>
 {meal.recipe.glycemicIndex === 'bajo' ? 'Bajo IG' : meal.recipe.glycemicIndex === 'medio' ? 'Medio IG' : 'Alto IG'}
 </span>
 </div>
 <p className="text-sm font-semibold text-gray-300 mt-0.5">{meal.recipe.name}</p>
 </div>
 <div className="text-right">
 <div className="text-sm font-bold text-white">{meal.recipe.nutrition.calories}</div>
 <div className="text-xs text-gray-400 text-gray-500">kcal</div>
 </div>
 </div>

 <div className="flex items-center gap-4 text-xs text-gray-400 text-gray-500">
 <span className="flex items-center gap-1">
 <Clock className="w-3.5 h-3.5"/>
 {meal.recipe.prepTime} min
 </span>
 <span className="flex items-center gap-1">
 <Beef className="w-3.5 h-3.5"/>
 P: {meal.recipe.nutrition.protein}g
 </span>
 <span className="flex items-center gap-1">
 <Wheat className="w-3.5 h-3.5"/>
 C: {meal.recipe.nutrition.carbs}g
 </span>
 <span className="flex items-center gap-1">
 <Droplets className="w-3.5 h-3.5"/>
 G: {meal.recipe.nutrition.fat}g
 </span>
 <span className="flex items-center gap-1">
 <Salad className="w-3.5 h-3.5"/>
 F: {meal.recipe.nutrition.fiber}g
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Browse all recipes */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <UtensilsCrossed className="w-5 h-5 text-blue-500"/>
 Todas las Recetas
 </h3>

 {/* By category tabs */}
 <div className="space-y-6">
 <RecipeCategory title="🌅 Desayunos"recipes={breakfasts} onClick={setSelectedRecipe} />
 <RecipeCategory title="🌞 Almuerzos"recipes={lunches} onClick={setSelectedRecipe} />
 <RecipeCategory title="🌙 Cenas"recipes={dinners} onClick={setSelectedRecipe} />
 <RecipeCategory title="🥜 Snacks"recipes={getRecipesByMealSlot('snack_am').concat(getRecipesByMealSlot('snack_pm'))} onClick={setSelectedRecipe} />
 </div>
 </div>
 </div>
 );
}

// ─── SUB-COMPONENTS ───

function RecipeCategory({ title, recipes, onClick }: { title: string; recipes: Recipe[]; onClick: (r: Recipe) => void }) {
 const [open, setOpen] = useState(true);
 return (
 <div>
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center justify-between w-full mb-2"
 >
 <h4 className="text-sm font-bold text-gray-400">{title} ({recipes.length})</h4> {open ? <ChevronUp className="w-4 h-4 text-gray-400 text-gray-500"/> : <ChevronDown className="w-4 h-4 text-gray-400 text-gray-500"/>}
 </button>
 {open && (
 <div className="grid sm:grid-cols-2 gap-2">
 {recipes.map(recipe => (
 <button
 key={recipe.id}
 onClick={() => onClick(recipe)}
 className="text-left p-3 rounded-xl bg-gray-700/50 hover:bg-blue-50 hover:bg-blue-900/20 border border-gray-700 border-gray-600 hover:border-blue-200 transition-all"
 >
 <p className="text-sm font-semibold text-white">{recipe.name}</p>
 <div className="flex items-center gap-3 text-xs text-gray-400 text-gray-400 mt-1">
 <span>{recipe.nutrition.calories} kcal</span>
 <span>{recipe.prepTime} min</span>
 <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${igColors[recipe.glycemicIndex]}`}>
 IG {recipe.glycemicIndex}
 </span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 );
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
 return (
 <div className="space-y-6">
 {/* Recipe Header */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <div className="flex items-start gap-4 mb-4">
 <div className="p-3 rounded-2xl text-3xl bg-gradient-to-br from-green-900/30 to-emerald-900/30">
 {recipe.mealSlot === 'desayuno' ? '🌅' : recipe.mealSlot === 'almuerzo' ? '🌞' : recipe.mealSlot === 'cena' ? '🌙' : '🥜'}
 </div>
 <div className="flex-1">
 <h2 className="text-xl font-bold text-white mb-1">{recipe.name}</h2>
 <p className="text-sm text-gray-400 mb-2">{recipe.description}</p>
 <div className="flex flex-wrap gap-2">
 {recipe.tags.map(tag => (
 <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400">
 {tag}
 </span>
 ))}
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${igColors[recipe.glycemicIndex]}`}>
 IG {recipe.glycemicIndex === 'bajo' ? 'Bajo' : recipe.glycemicIndex === 'medio' ? 'Medio' : 'Alto'}
 </span>
 </div>
 </div>
 </div>

 {/* Nutrition */}
 <div className="grid grid-cols-5 gap-3 p-4 rounded-xl bg-gray-700/50">
 <div className="text-center">
 <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1"/>
 <div className="text-sm font-bold text-white">{recipe.nutrition.calories}</div>
 <div className="text-[10px] text-gray-400 text-gray-500">kcal</div>
 </div>
 <div className="text-center">
 <Beef className="w-4 h-4 text-blue-400 mx-auto mb-1"/>
 <div className="text-sm font-bold text-white">{recipe.nutrition.protein}g</div>
 <div className="text-[10px] text-gray-400 text-gray-500">Proteína</div>
 </div>
 <div className="text-center">
 <Wheat className="w-4 h-4 text-orange-400 mx-auto mb-1"/>
 <div className="text-sm font-bold text-white">{recipe.nutrition.carbs}g</div>
 <div className="text-[10px] text-gray-400 text-gray-500">Carbs</div>
 </div>
 <div className="text-center">
 <Droplets className="w-4 h-4 text-purple-400 mx-auto mb-1"/>
 <div className="text-sm font-bold text-white">{recipe.nutrition.fat}g</div>
 <div className="text-[10px] text-gray-400 text-gray-500">Grasa</div>
 </div>
 <div className="text-center">
 <Salad className="w-4 h-4 text-green-400 mx-auto mb-1"/>
 <div className="text-sm font-bold text-white">{recipe.nutrition.fiber}g</div>
 <div className="text-[10px] text-gray-400 text-gray-500">Fibra</div>
 </div>
 </div>

 {/* Time & Servings */}
 <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
 <span className="flex items-center gap-1">
 <Clock className="w-4 h-4"/>
 {recipe.prepTime} minutos
 </span>
 <span className="flex items-center gap-1">
 <UtensilsCrossed className="w-4 h-4"/>
 {recipe.servings} porción(es)
 </span>
 </div>
 </div>

 {/* Ingredients */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Apple className="w-5 h-5 text-green-500"/>
 Ingredientes
 </h3>
 <ul className="space-y-2">
 {recipe.ingredients.map((ing, i) => (
 <li key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
 <span className="text-sm text-gray-300">{ing.name}</span>
 <span className="text-sm font-semibold text-gray-400 bg-gray-700 px-3 py-1 rounded-lg">{ing.amount}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Instructions */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <UtensilsCrossed className="w-5 h-5 text-orange-500"/>
 Instrucciones
 </h3>
 <ol className="space-y-3">
 {recipe.instructions.map((step, i) => (
 <li key={i} className="flex gap-3">
 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 bg-blue-900/40 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
 {i + 1}
 </span>
 <span className="text-sm text-gray-300 pt-0.5">{step}</span>
 </li>
 ))}
 </ol>
 </div>
 </div>
 );
}
