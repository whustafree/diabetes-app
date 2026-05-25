export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'merienda' | 'ayunas';

export type GlucoseCategory = 'bajo' | 'normal' | 'elevado' | 'alto' | 'peligroso';

// ─── Perfil de Usuario ───

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DiabetesType = 'type1' | 'type2' | 'prediabetic' | 'none' | 'gestational';
export type BMICategory = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad_grado1' | 'obesidad_grado2' | 'obesidad_grado3';
export type HealthRiskLevel = 'bajo' | 'moderado' | 'alto' | 'muy_alto';

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  activityLevel: ActivityLevel;
  diabetesType: DiabetesType;
  diabetesYears?: number; // años desde diagnóstico
  targetWeight?: number; // peso deseado en kg
  medications?: string;
}

export interface HealthAssessment {
  bmi: number;
  bmiCategory: BMICategory;
  bodyFatPercentage: number;
  bodyFatCategory: string;
  bmr: number;
  tdee: number;
  healthRisks: HealthRisk[];
  idealWeightRange: { min: number; max: number };
  healthyBodyFatRange: { min: number; max: number };
  riskLevel: HealthRiskLevel;
}

export interface HealthRisk {
  condition: string;
  risk: HealthRiskLevel;
  description: string;
  recommendation: string;
}

export const activityLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario (poco o ningún ejercicio)',
  light: 'Ligero (1-3 días/semana)',
  moderate: 'Moderado (3-5 días/semana)',
  active: 'Activo (6-7 días/semana)',
  very_active: 'Muy activo (2 veces/día o trabajo físico)',
};

export const diabetesTypeLabels: Record<DiabetesType, string> = {
  type1: 'Diabetes Tipo 1',
  type2: 'Diabetes Tipo 2',
  prediabetic: 'Prediabetes',
  gestational: 'Diabetes Gestacional',
  none: 'No tengo diabetes',
};

export const genderLabels: Record<Gender, string> = {
  male: 'Hombre',
  female: 'Mujer',
};

// ─── Recetas y Comidas ───

export interface Ingredient {
  name: string;
  amount: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
}

export type MealSlot = 'desayuno' | 'almuerzo' | 'cena' | 'snack_am' | 'snack_pm';
export type CuisineType = 'mexicana' | 'mediterranea' | 'internacional';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  mealSlot: MealSlot;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  prepTime: number; // minutos
  servings: number;
  diabeticFriendly: boolean;
  glycemicIndex: 'bajo' | 'medio' | 'alto';
  tags: string[];
  image?: string;
}

export interface DayMealPlan {
  day: string; // 'lunes', 'martes', etc.
  meals: {
    slot: MealSlot;
    recipe: Recipe;
    portion: string; // ej: '1 porción', '2 tortillas'
  }[];
  totalNutrition: NutritionInfo;
}

export interface WeeklyMealPlan {
  weekStart: string;
  days: DayMealPlan[];
  averageDailyCalories: number;
}

export interface CalorieTarget {
  maintenance: number;
  mildDeficit: number; // -250 kcal
  moderateDeficit: number; // -500 kcal
  aggressiveDeficit: number; // -750 kcal
}

export interface DietRecommendation {
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterL: number;
  weeklyWeightLoss: string; // ej: '0.5 kg/semana'
  duration: string; // ej: '12 semanas'
  notes: string[];
}

export const mealSlotLabels: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack_am: 'Snack AM',
  snack_pm: 'Snack PM',
};

export const dayLabels = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// ─── Glucosa (existente) ───

export interface GlucoseEntry {
  id: string;
  date: string; // ISO string
  value: number; // mg/dL
  meal?: MealType;
  insulin?: number; // unidades de insulina
  notes?: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  average: number;
  min: number;
  max: number;
  entries: number;
}

export interface GlucoseRecord {
  entries: GlucoseEntry[];
}

export function categorizeGlucose(value: number): GlucoseCategory {
  if (value < 70) return 'bajo';
  if (value >= 70 && value <= 100) return 'normal';
  if (value > 100 && value <= 140) return 'elevado';
  if (value > 140 && value <= 200) return 'alto';
  return 'peligroso';
}

export const categoryColors: Record<GlucoseCategory, string> = {
  bajo: 'bg-blue-500 text-white',
  normal: 'bg-green-500 text-white',
  elevado: 'bg-yellow-500 text-black',
  alto: 'bg-orange-500 text-white',
  peligroso: 'bg-red-500 text-white',
};

export const categoryTextColors: Record<GlucoseCategory, string> = {
  bajo: 'text-blue-600',
  normal: 'text-green-600',
  elevado: 'text-yellow-600',
  alto: 'text-orange-600',
  peligroso: 'text-red-600',
};

export const categoryLabels: Record<GlucoseCategory, string> = {
  bajo: 'Bajo',
  normal: 'Normal',
  elevado: 'Elevado',
  alto: 'Alto',
  peligroso: '¡Peligroso!',
};

export const mealLabels: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  merienda: 'Merienda',
  ayunas: 'Ayunas',
};

// ─── Registro de Comidas (Food Log) ───

export type FoodLogMealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack' | 'colacion';

export interface FoodLogEntry {
  id: string;
  date: string; // ISO string
  mealType: FoodLogMealType;
  foods: string; // descripción de lo que comió
  carbs?: number; // gramos estimados
  calories?: number;
  notes?: string;
  glucoseBefore?: number; // glucosa antes de comer
  glucoseAfter?: number; // glucosa 1-2h después
  createdAt: string;
}

export const foodLogMealLabels: Record<FoodLogMealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
  colacion: 'Colación',
};

export const foodLogMealIcons: Record<FoodLogMealType, string> = {
  desayuno: '🌅',
  almuerzo: '🌞',
  cena: '🌙',
  snack: '🥜',
  colacion: '🍎',
};

// ─── Medicamentos ───

export interface Medication {
  id: string;
  name: string;
  dosage: string; // ej: "500 mg", "10 ml"
  frequencyHours: number; // cada X horas
  startTime: string; // hora primera dosis, formato HH:mm
  notes?: string;
  enabled: boolean;
  createdAt: string;
}

export function getNextDoseTime(medication: Medication, fromDate: Date = new Date()): Date {
  const [hours, minutes] = medication.startTime.split(':').map(Number);
  const start = new Date(fromDate);
  start.setHours(hours, minutes, 0, 0);

  // Si la hora de inicio de hoy aún no ha llegado, esa es la próxima dosis
  if (start > fromDate) return start;

  // Si ya pasó, sumamos frequencyHours hasta obtener una hora futura
  while (start <= fromDate) {
    start.setHours(start.getHours() + medication.frequencyHours);
  }
  return start;
}

export function formatDoseTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function getTimeUntilNextDose(medication: Medication): { hours: number; minutes: number; nextTime: Date } {
  const next = getNextDoseTime(medication);
  const diffMs = next.getTime() - Date.now();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  return {
    hours: Math.floor(diffMin / 60),
    minutes: diffMin % 60,
    nextTime: next,
  };
}

// ─── Recordatorios ───

export type ReminderType = 'glucose' | 'medication' | 'meal' | 'exercise' | 'water' | 'custom';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description?: string;
  time: string; // HH:mm format
  days: number[]; // 0=Sun, 1=Mon...6=Sat
  enabled: boolean;
  soundEnabled: boolean;
  createdAt: string;
}

export const reminderTypeLabels: Record<ReminderType, string> = {
  glucose: 'Medir Glucosa',
  medication: 'Medicación',
  meal: 'Comida',
  exercise: 'Ejercicio',
  water: 'Tomar Agua',
  custom: 'Personalizado',
};

export const reminderTypeIcons: Record<ReminderType, string> = {
  glucose: '🩸',
  medication: '💊',
  meal: '🍽️',
  exercise: '🏃',
  water: '💧',
  custom: '⏰',
};
