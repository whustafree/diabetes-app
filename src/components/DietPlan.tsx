import { useState, useMemo } from 'react';
import { Scale, ArrowDown, Dumbbell, Droplets, Moon, Apple, Beef, Wheat, Salad, Target, Info, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { loadProfile, calculateCalorieTargets, assessHealth, bmiCategoryLabels, getIdealWeightRange, generateDietRecommendation } from '../utils/health';
import type { DietRecommendation } from '../types';

export default function DietPlan() {
 const profile = useMemo(() => loadProfile(), []);
 const [deficitAmount, setDeficitAmount] = useState<250 | 500 | 750>(500);
 const [showInfo, setShowInfo] = useState(false);

 const healthData = useMemo(() => {
 if (!profile) return null;
 return assessHealth(profile);
 }, [profile]);

 const calorieTargets = useMemo(() => {
 if (!healthData) return null;
 return calculateCalorieTargets(healthData.tdee);
 }, [healthData]);

 const recommendation = useMemo(() => {
 if (!profile || !healthData) return null;
 return generateDietRecommendation(profile, healthData.tdee, deficitAmount);
 }, [profile, healthData, deficitAmount]);

 if (!profile || !healthData || !calorieTargets || !recommendation) {
 return (
 <div className="max-w-lg mx-auto bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-700 text-center">
 <Scale className="w-12 h-12 text-gray-300 text-gray-400 mx-auto mb-4"/>
 <h2 className="text-xl font-bold text-white mb-2">Plan de Dieta Personalizado</h2>
 <p className="text-gray-400 text-gray-400 text-sm mb-6">
 Para generar tu plan de dieta necesitas crear tu perfil primero.
 </p>
 <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700 border-yellow-800 text-sm text-yellow-300">
 Ve a la sección <strong>"Perfil"</strong> y completa tus datos para obtener tu plan personalizado.
 </div>
 </div>
 );
 }

 const bmiStatus = bmiCategoryLabels[healthData.bmiCategory];
 const weightToLose = profile.weight - (profile.targetWeight || getIdealWeightRange(profile.height, profile.gender).max);

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Header */}
 <div className="text-center">
 <div className="flex items-center justify-center gap-3 mb-2">
 <Scale className="w-7 h-7 text-emerald-600"/>
 <h2 className="text-2xl font-extrabold text-white">Plan de Dieta</h2>
 </div>
 <p className="text-gray-400 text-gray-400 text-sm">Déficit calórico personalizado para pérdida de peso saludable</p>
 </div>

 {/* Current Status */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Target className="w-5 h-5 text-blue-500"/>
 Tu Situación Actual
 </h3>
 <div className="grid sm:grid-cols-3 gap-4">
 <div className="p-4 rounded-xl bg-gray-700/50">
 <div className="text-xs font-semibold text-gray-400 text-gray-400 mb-1">Peso Actual</div>
 <div className="text-2xl font-bold text-white">{profile.weight} <span className="text-sm font-normal text-gray-400 text-gray-500">kg</span></div>
 </div>
 <div className="p-4 rounded-xl bg-gray-700/50">
 <div className="text-xs font-semibold text-gray-400 text-gray-400 mb-1">IMC</div>
 <div className="text-2xl font-bold text-white">{healthData.bmi} <span className="text-sm font-normal text-gray-400 text-gray-500">- {bmiStatus}</span></div>
 </div>
 <div className="p-4 rounded-xl bg-gray-700/50">
 <div className="text-xs font-semibold text-gray-400 text-gray-400 mb-1">Gasto Calórico (TDEE)</div>
 <div className="text-2xl font-bold text-white">{healthData.tdee} <span className="text-sm font-normal text-gray-400 text-gray-500">kcal/día</span></div>
 </div>
 </div>
 {weightToLose > 0 && (
 <div className="mt-4 p-3 rounded-xl bg-blue-900/20 border border-blue-100 border-blue-800 flex items-center gap-2">
 <ArrowDown className="w-5 h-5 text-blue-400"/>
 <p className="text-sm text-blue-300 font-medium">
 Meta de pérdida: <strong>{Math.round(weightToLose)} kg</strong>
 {profile.targetWeight && ` (de ${profile.weight} kg a ${profile.targetWeight} kg)`}
 </p>
 </div>
 )}
 </div>

 {/* Deficit Selector */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4">Nivel de Déficit Calórico</h3>
 <div className="grid grid-cols-3 gap-3">
 {[
 { value: 250 as const, label: 'Suave', desc: '-250 kcal/día', loss: '0.25 kg/sem', pace: 'Lento pero sostenible' },
 { value: 500 as const, label: 'Moderado', desc: '-500 kcal/día', loss: '0.5 kg/sem', pace: 'Ritmo ideal y saludable' },
 { value: 750 as const, label: 'Acelerado', desc: '-750 kcal/día', loss: '0.7-1 kg/sem', pace: 'Más rápido, requiere disciplina' },
 ].map(opt => (
 <button
 key={opt.value}
 onClick={() => setDeficitAmount(opt.value)}
 className={`p-4 rounded-xl border-2 text-center transition-all ${
 deficitAmount === opt.value
 ? 'border-emerald-500 bg-emerald-900/30'
 : 'border-gray-100 border-gray-600 bg-gray-700/50 hover:border-gray-200 hover:border-gray-500'
 }`}
 >
 <div className={`text-sm font-bold ${deficitAmount === opt.value ? 'text-emerald-300' : 'text-gray-300'}`}>
 {opt.label}
 </div>
 <div className={`text-lg font-extrabold my-1 ${deficitAmount === opt.value ? 'text-emerald-400' : 'text-gray-800 text-white'}`}>
 {opt.desc}
 </div>
 <div className="text-xs text-gray-400 text-gray-500">{opt.pace}</div>
 </button>
 ))}
 </div>
 <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 text-gray-500">
 <AlertCircle className="w-3.5 h-3.5"/>
 No se recomienda un déficit mayor a 1000 kcal/día sin supervisión médica
 </div>
 </div>

 {/* Recommended Plan */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Target className="w-5 h-5 text-emerald-500"/>
 Tu Plan Personalizado
 </h3>

 {/* Main target */}
 <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white mb-5">
 <div className="text-sm opacity-80 mb-1">Consumo Diario Recomendado</div>
 <div className="text-4xl font-extrabold mb-1">{recommendation.targetCalories} <span className="text-lg font-normal opacity-80">kcal</span></div>
 <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
 <span>Pérdida: ~{recommendation.weeklyWeightLoss}</span>
 <span>Duración estimada: {recommendation.duration}</span>
 </div>
 </div>

 {/* Macros */}
 <h4 className="text-sm font-bold text-gray-400 mb-3">Distribución de Macronutrientes</h4>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
 {[
 { icon: Beef, label: 'Proteína', value: `${recommendation.proteinG}g`, color: 'text-blue-600', bg: 'bg-blue-50', pct: '30%' },
 { icon: Wheat, label: 'Carbohidratos', value: `${recommendation.carbsG}g`, color: 'text-orange-600', bg: 'bg-orange-50', pct: '35%' },
 { icon: Droplets, label: 'Grasas', value: `${recommendation.fatG}g`, color: 'text-purple-600', bg: 'bg-purple-50', pct: '35%' },
 { icon: Salad, label: 'Fibra', value: `${recommendation.fiberG}g`, color: 'text-green-600', bg: 'bg-green-50', pct: 'min' },
 ].map(m => {
 const Icon = m.icon;
 return (
 <div key={m.label} className={`${m.bg} bg-opacity-20 rounded-xl p-4 text-center`}>
 <Icon className={`w-5 h-5 ${m.color} text-opacity-90 mx-auto mb-1`} />
 <div className={`text-lg font-bold ${m.color} text-opacity-90`}>{m.value}</div>
 <div className="text-xs text-gray-400 text-gray-500">{m.label} ({m.pct})</div>
 </div>
 );
 })}
 </div>

 {/* Water */}
 <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-900/20 border border-cyan-100 border-cyan-800 mb-4">
 <Droplets className="w-5 h-5 text-cyan-400"/>
 <div>
 <span className="text-sm font-semibold text-cyan-300">Agua recomendada: {recommendation.waterL} litros/día</span>
 <p className="text-xs text-cyan-400">La hidratación es clave para el control de glucosa y metabolismo</p>
 </div>
 </div>

 {/* Calorie comparison */}
 <div className="space-y-2 mb-4">
 <div className="flex justify-between text-sm">
 <span className="text-gray-400">Mantenimiento (TDEE)</span>
 <span className="font-semibold text-gray-200">{calorieTargets.maintenance} kcal</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-gray-400">Déficit aplicado</span>
 <span className="font-semibold text-red-500">-{deficitAmount} kcal</span>
 </div>
 <div className="border-t border-gray-700 border-gray-600 pt-2 flex justify-between text-sm">
 <span className="font-bold text-gray-300">Total diario</span>
 <span className="font-bold text-emerald-600">{recommendation.targetCalories} kcal</span>
 </div>
 </div>
 </div>

 {/* Notes and Recommendations */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <button
 onClick={() => setShowInfo(!showInfo)}
 className="flex items-center justify-between w-full"
 >
 <h3 className="text-lg font-bold text-white flex items-center gap-2">
 <Info className="w-5 h-5 text-blue-500"/>
 Recomendaciones y Consejos
 </h3>
 {showInfo ? <ChevronUp className="w-5 h-5 text-gray-400 text-gray-500"/> : <ChevronDown className="w-5 h-5 text-gray-400 text-gray-500"/>}
 </button>
 {showInfo && (
 <div className="mt-4 space-y-2">
 {recommendation.notes.map((note, i) => (
 <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-700/50">
 <span className="text-blue-500 mt-0.5">💡</span>
 <p className="text-sm text-gray-300">{note}</p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Weekly Schedule */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Dumbbell className="w-5 h-5 text-orange-500"/>
 Rutina Semanal Recomendada
 </h3>
 <div className="grid sm:grid-cols-2 gap-3">
 {[
 { day: 'Lunes', activity: 'Cardio moderado', detail: '30 min caminata rápida o bicicleta', type: 'cardio' },
 { day: 'Martes', activity: 'Fuerza', detail: '30 min ejercicios con peso corporal', type: 'strength' },
 { day: 'Miércoles', activity: 'Cardio + Core', detail: '20 min cardio + 15 min abdominales', type: 'mixed' },
 { day: 'Jueves', activity: 'Fuerza', detail: '30 min bandas de resistencia o pesas ligeras', type: 'strength' },
 { day: 'Viernes', activity: 'Cardio intervalos', detail: '20 min HIIT o caminata con pendiente', type: 'cardio' },
 { day: 'Sábado', activity: 'Actividad recreativa', detail: 'Natación, baile, senderismo 45 min', type: 'fun' },
 { day: 'Domingo', activity: 'Recuperación', detail: 'Estiramientos, yoga o caminata ligera 20 min', type: 'recovery' },
 ].map(item => (
 <div key={item.day} className={`p-3 rounded-xl border ${
 item.type === 'cardio' ? 'border-red-100 border-red-900/30 bg-red-900/20' :
 item.type === 'strength' ? 'border-blue-100 border-blue-900/30 bg-blue-900/20' :
 item.type === 'mixed' ? 'border-purple-100 border-purple-900/30 bg-purple-900/20' :
 item.type === 'fun' ? 'border-green-100 border-green-900/30 bg-green-900/20' :
 'border-gray-100 border-gray-600 bg-gray-700/50'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-sm font-bold text-gray-300">{item.day}</span>
 <span className="text-xs text-gray-400 text-gray-500">{item.activity}</span>
 </div>
 <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
 </div>
 ))}
 </div>
 <div className="mt-4 p-3 rounded-xl bg-yellow-900/20 border border-yellow-100 border-yellow-800 flex items-start gap-2">
 <Moon className="w-5 h-5 text-yellow-400 mt-0.5"/>
 <div>
 <p className="text-sm font-semibold text-yellow-300">Descanso y Sueño</p>
 <p className="text-xs text-yellow-400">Duerme 7-8 horas diarias. El descanso adecuado regula las hormonas del hambre y mejora el control de glucosa.</p>
 </div>
 </div>
 </div>
 </div>
 );
}
