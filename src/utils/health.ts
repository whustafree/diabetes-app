import type {
  UserProfile,
  HealthAssessment,
  HealthRisk,
  BMICategory,
  HealthRiskLevel,
  CalorieTarget,
  DietRecommendation,
  Gender,
  ActivityLevel,
} from '../types';

// ─── BMI ───

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'bajo_peso';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'sobrepeso';
  if (bmi < 35) return 'obesidad_grado1';
  if (bmi < 40) return 'obesidad_grado2';
  return 'obesidad_grado3';
}

export const bmiCategoryLabels: Record<BMICategory, string> = {
  bajo_peso: 'Bajo peso',
  normal: 'Normal',
  sobrepeso: 'Sobrepeso',
  obesidad_grado1: 'Obesidad Grado I',
  obesidad_grado2: 'Obesidad Grado II',
  obesidad_grado3: 'Obesidad Grado III',
};

export const bmiCategoryColors: Record<BMICategory, string> = {
  bajo_peso: 'text-blue-400 bg-blue-900/30',
  normal: 'text-green-400 bg-green-900/30',
  sobrepeso: 'text-yellow-400 bg-yellow-900/30',
  obesidad_grado1: 'text-orange-400 bg-orange-900/30',
  obesidad_grado2: 'text-red-400 bg-red-900/30',
  obesidad_grado3: 'text-red-300 bg-red-900/40',
};

// ─── Body Fat Percentage (US Navy / BMI-based) ───

export function calculateBodyFatPercentage(bmi: number, age: number, gender: Gender): number {
  if (gender === 'male') {
    return Math.round(((1.20 * bmi) + (0.23 * age) - 16.2) * 10) / 10;
  }
  return Math.round(((1.20 * bmi) + (0.23 * age) - 5.4) * 10) / 10;
}

export function getBodyFatCategory(percentage: number, gender: Gender): string {
  if (gender === 'male') {
    if (percentage < 6) return 'Esencial (atleta)';
    if (percentage < 14) return 'Saludable (deportista)';
    if (percentage < 18) return 'Normal (saludable)';
    if (percentage < 25) return 'Aceptable (promedio)';
    return 'Exceso (obesidad)';
  }
  if (percentage < 14) return 'Esencial (atleta)';
  if (percentage < 21) return 'Saludable (deportista)';
  if (percentage < 25) return 'Normal (saludable)';
  if (percentage < 32) return 'Aceptable (promedio)';
  return 'Exceso (obesidad)';
}

export function getHealthyBodyFatRange(gender: Gender): { min: number; max: number } {
  return gender === 'male' ? { min: 10, max: 20 } : { min: 18, max: 28 };
}

export function getBodyFatColor(percentage: number, gender: Gender): string {
  const cat = getBodyFatCategory(percentage, gender);
  if (cat.includes('Esencial') || cat.includes('Saludable')) return 'text-green-400 bg-green-900/30';
  if (cat.includes('Normal')) return 'text-blue-400 bg-blue-900/30';
  if (cat.includes('Aceptable')) return 'text-yellow-400 bg-yellow-900/30';
  return 'text-red-400 bg-red-900/30';
}

// ─── BMR (Mifflin-St Jeor) ───

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

// ─── TDEE ───

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityFactors[activityLevel]);
}

// ─── Calorie Targets ───

export function calculateCalorieTargets(tdee: number): CalorieTarget {
  return {
    maintenance: tdee,
    mildDeficit: Math.max(tdee - 250, 1400),
    moderateDeficit: Math.max(tdee - 500, 1200),
    aggressiveDeficit: Math.max(tdee - 750, 1000),
  };
}

// ─── Ideal Weight (Devine formula) ───

export function getIdealWeightRange(heightCm: number, gender: Gender): { min: number; max: number } {
  // Devine formula gives one value; we provide ±10%
  let ideal: number;
  const heightInches = heightCm / 2.54;
  if (gender === 'male') {
    ideal = 50 + 2.3 * (heightInches - 60);
  } else {
    ideal = 45.5 + 2.3 * (heightInches - 60);
  }
  const min = Math.round(ideal * 0.9 * 10) / 10;
  const max = Math.round(ideal * 1.1 * 10) / 10;
  return { min, max };
}

// ─── Health Risk Assessment ───

function getRiskLevel(bmi: number, age: number, diabetesType: string, bodyFat: number): HealthRiskLevel {
  let score = 0;

  if (bmi >= 30) score += 3;
  else if (bmi >= 25) score += 2;
  else if (bmi >= 18.5) score += 0;
  else score += 1;

  if (age > 60) score += 3;
  else if (age > 45) score += 2;
  else if (age > 30) score += 1;

  if (diabetesType === 'type2' || diabetesType === 'type1') score += 3;
  else if (diabetesType === 'prediabetic') score += 2;
  else if (diabetesType === 'gestational') score += 1;

  if (bodyFat > 30) score += 2;
  else if (bodyFat > 25) score += 1;

  if (score >= 8) return 'muy_alto';
  if (score >= 5) return 'alto';
  if (score >= 3) return 'moderado';
  return 'bajo';
}

export const riskLevelLabels: Record<HealthRiskLevel, string> = {
  bajo: 'Bajo',
  moderado: 'Moderado',
  alto: 'Alto',
  muy_alto: 'Muy Alto',
};

export const riskLevelColors: Record<HealthRiskLevel, string> = {
  bajo: 'text-green-400 bg-green-900/30 border-green-200',
  moderado: 'text-yellow-600 bg-yellow-900/30 border-yellow-800',
  alto: 'text-orange-400 bg-orange-900/30 border-orange-200',
  muy_alto: 'text-red-600 bg-red-900/30 border-red-800',
};

function assessRisks(profile: UserProfile, bmi: number, bodyFat: number): HealthRisk[] {
  const risks: HealthRisk[] = [];

  // BMI-related risks
  if (bmi >= 30) {
    risks.push({
      condition: 'Obesidad',
      risk: 'alto',
      description: 'El IMC indica obesidad, lo que aumenta significativamente el riesgo cardiovascular y complicaciones de diabetes.',
      recommendation: 'Se recomienda un plan de pérdida de peso con déficit calórico supervisado por un profesional.',
    });
  } else if (bmi >= 25) {
    risks.push({
      condition: 'Sobrepeso',
      risk: 'moderado',
      description: 'El IMC indica sobrepeso. Puede afectar el control de la glucosa y aumentar la resistencia a la insulina.',
      recommendation: 'Implementar un déficit calórico moderado de 300-500 kcal/día y aumentar actividad física.',
    });
  } else if (bmi < 18.5) {
    risks.push({
      condition: 'Bajo peso',
      risk: 'moderado',
      description: 'El peso está por debajo de lo saludable, lo que puede causar desnutrición y complicaciones en diabetes.',
      recommendation: 'Consultar con un nutriólogo para un plan de aumento de peso saludable.',
    });
  }

  // Age-related risks
  if (profile.age > 60) {
    risks.push({
      condition: 'Edad avanzada',
      risk: 'alto',
      description: 'La edad avanzada aumenta el riesgo de complicaciones cardiovasculares y de diabetes.',
      recommendation: 'Controles médicos regulares cada 3-6 meses. Monitoreo constante de glucosa y presión arterial.',
    });
  } else if (profile.age > 45) {
    risks.push({
      condition: 'Edad de riesgo',
      risk: 'moderado',
      description: 'A partir de los 45 años aumenta el riesgo de diabetes tipo 2 y complicaciones.',
      recommendation: 'Exámenes anuales de hemoglobina glucosilada (A1C), perfil lipídico y presión arterial.',
    });
  }

  // Diabetes-related risks
  if (profile.diabetesType === 'type1' || profile.diabetesType === 'type2') {
    risks.push({
      condition: 'Diabetes diagnosticada',
      risk: 'alto',
      description: 'Requiere manejo constante de glucosa, medicación y estilo de vida saludable.',
      recommendation: 'Mantener A1C < 7%. Monitoreo diario de glucosa. Consultar endocrinólogo cada 3 meses.',
    });
  } else if (profile.diabetesType === 'prediabetic') {
    risks.push({
      condition: 'Prediabetes',
      risk: 'moderado',
      description: 'Niveles de glucosa elevados pero no diagnósticos de diabetes. Riesgo de progresión a tipo 2.',
      recommendation: 'Intervención intensiva en estilo de vida: pérdida del 5-7% del peso corporal, 150 min/semana de ejercicio.',
    });
  }

  // Body fat risks
  if (bodyFat > 30) {
    risks.push({
      condition: 'Exceso de grasa corporal',
      risk: 'alto',
      description: 'El alto porcentaje de grasa corporal está asociado con resistencia a la insulina y síndrome metabólico.',
      recommendation: 'Combinar entrenamiento de fuerza con cardio 4-5 veces/semana. Dieta alta en proteína y fibra.',
    });
  } else if (bodyFat > 25) {
    risks.push({
      condition: 'Grasa corporal elevada',
      risk: 'moderado',
      description: 'El porcentaje de grasa está por encima del rango saludable recomendado.',
      recommendation: 'Aumentar actividad física y ajustar macronutrientes para reducir grasa corporal.',
    });
  }

  // Cardiovascular risk (combined factors)
  if (bmi >= 25 && profile.age > 40 && (profile.diabetesType === 'type2' || profile.diabetesType === 'prediabetic')) {
    risks.push({
      condition: 'Riesgo cardiovascular',
      risk: 'alto',
      description: 'Combinación de sobrepeso, edad y diabetes/prediabetes aumenta el riesgo de enfermedades del corazón.',
      recommendation: 'Evaluación cardiovascular anual. Control de presión arterial < 130/80 mmHg. Dieta baja en sodio y grasas saturadas.',
    });
  }

  return risks;
}

// ─── Full Health Assessment ───

export function assessHealth(profile: UserProfile): HealthAssessment {
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(bmi);
  const bodyFatPercentage = calculateBodyFatPercentage(bmi, profile.age, profile.gender);
  const bodyFatCategory = getBodyFatCategory(bodyFatPercentage, profile.gender);
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const healthRisks = assessRisks(profile, bmi, bodyFatPercentage);
  const idealWeightRange = getIdealWeightRange(profile.height, profile.gender);
  const healthyBodyFatRange = getHealthyBodyFatRange(profile.gender);

  return {
    bmi,
    bmiCategory,
    bodyFatPercentage,
    bodyFatCategory,
    bmr,
    tdee,
    healthRisks,
    idealWeightRange,
    healthyBodyFatRange,
    riskLevel: getRiskLevel(bmi, profile.age, profile.diabetesType, bodyFatPercentage),
  };
}

// ─── Diet Recommendation ───

export function generateDietRecommendation(
  profile: UserProfile,
  tdee: number,
  deficit: number
): DietRecommendation {
  const targetCalories = Math.max(tdee - deficit, 1200);

  // Macros for diabetes: moderate-low carb, high protein, healthy fats
  const proteinG = Math.round((targetCalories * 0.30) / 4); // 30% protein
  const carbsG = Math.round((targetCalories * 0.35) / 4);   // 35% carbs
  const fatG = Math.round((targetCalories * 0.35) / 9);      // 35% fat
  const fiberG = Math.max(Math.round(profile.weight * 0.03), 25); // 3g per kg min 25g
  const waterL = Math.round((profile.weight * 0.033) * 10) / 10;

  const weeklyLoss = deficit >= 750 ? '0.7-1 kg' : deficit >= 500 ? '0.5 kg' : '0.25 kg';

  const notes: string[] = [
    'Distribuye los carbohidratos en 3 comidas principales y 2 snacks para mantener glucosa estable.',
    'Prioriza carbohidratos de bajo índice glucémico (verduras, legumbres, granos enteros).',
    'Incluye proteína magra en cada comida para aumentar saciedad y preservar músculo.',
    'Evita azúcares añadidos, harinas refinadas y bebidas azucaradas.',
    'Realiza 30-45 minutos de actividad física moderada al menos 5 días/semana.',
    'Monitorea tu glucosa 1-2 horas después de comer para entender cómo reaccionas a diferentes alimentos.',
    'Duerme 7-8 horas diarias; el mal sueño afecta el control de glucosa y el hambre.',
    'Considera suplementar con vitamina D y magnesio (consulta a tu médico primero).',
  ];

  if (profile.diabetesType === 'type1' || profile.diabetesType === 'type2') {
    notes.push('Ajusta la insulina según los carbohidratos consumidos. Consulta con tu endocrinólogo.');
    notes.push('Mantén un registro detallado de comidas y glucosa para identificar patrones.');
  }

  return {
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterL,
    weeklyWeightLoss: weeklyLoss,
    duration: `${Math.ceil((profile.weight - (profile.targetWeight || profile.weight - 5)) / (parseFloat(weeklyLoss) || 0.5))} semanas`,
    notes,
  };
}

// ─── LocalStorage Helpers ───

const PROFILE_KEY = 'diabetes-app-profile';

export function loadProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
