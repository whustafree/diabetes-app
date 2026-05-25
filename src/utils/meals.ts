import type { Recipe, DayMealPlan, MealSlot, NutritionInfo } from '../types';
import { generateId } from './helpers';

// ─── RECETAS BASE (Todas diabético-friendly) ───

const recipes: Recipe[] = [
  // ─── DESAYUNOS ───
  {
    id: 'break-01',
    name: 'Omelette de claras con espinacas y champiñones',
    description: 'Omelette rico en proteína con vegetales de bajo índice glucémico.',
    mealSlot: 'desayuno',
    ingredients: [
      { name: 'Claras de huevo', amount: '4 unidades' },
      { name: 'Espinacas frescas', amount: '1 taza' },
      { name: 'Champiñones', amount: '1/2 taza' },
      { name: 'Aceite de oliva', amount: '1 cucharadita' },
      { name: 'Sal y pimienta', amount: 'al gusto' },
      { name: 'Tomate cherry', amount: '5 unidades' },
    ],
    instructions: [
      'Saltea los champiñones en rodajas con aceite de oliva hasta dorar.',
      'Agrega las espinacas y cocina 1 minuto hasta que reduzcan.',
      'Bate las claras con sal y pimienta, viértelas sobre los vegetales.',
      'Cocina a fuego medio 3-4 minutos, dobla y sirve con tomates cherry.',
    ],
    nutrition: { calories: 210, protein: 28, carbs: 6, fat: 9, fiber: 3 },
    prepTime: 12,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['desayuno', 'alto_proteina', 'bajo_carbohidrato'],
  },
  {
    id: 'break-02',
    name: 'Avena nocturna con canela y frutos rojos',
    description: 'Avena remojada overnight con antioxidantes y fibra soluble.',
    mealSlot: 'desayuno',
    ingredients: [
      { name: 'Avena integral en hojuelas', amount: '1/2 taza' },
      { name: 'Leche de almendras sin azúcar', amount: '1/2 taza' },
      { name: 'Yogurt griego natural', amount: '2 cucharadas' },
      { name: 'Frutos rojos congelados', amount: '1/2 taza' },
      { name: 'Canela molida', amount: '1 cucharadita' },
      { name: 'Semillas de chía', amount: '1 cucharada' },
    ],
    instructions: [
      'Mezcla la avena con la leche de almendras, yogurt y semillas de chía.',
      'Agrega la canela y mezcla bien.',
      'Refrigera toda la noche (mínimo 6 horas).',
      'Por la mañana, agrega los frutos rojos descongelados y disfruta frío.',
    ],
    nutrition: { calories: 280, protein: 14, carbs: 38, fat: 9, fiber: 9 },
    prepTime: 5,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['desayuno', 'fibra', 'antioxidantes', 'preparacion_anticipada'],
  },
  {
    id: 'break-03',
    name: 'Chilaquiles saludables de tortilla de nopal',
    description: 'Versión diabético-friendly de chilaquiles con tortillas de nopal.',
    mealSlot: 'desayuno',
    ingredients: [
      { name: 'Tortillas de nopal (o maíz bajo IG)', amount: '3 piezas' },
      { name: 'Salsa verde casera', amount: '1/2 taza' },
      { name: 'Pechuga de pollo deshebrada', amount: '80g' },
      { name: 'Crema light', amount: '1 cucharada' },
      { name: 'Queso panela bajo en grasa', amount: '30g' },
      { name: 'Cilantro fresco', amount: 'al gusto' },
      { name: 'Cebolla morada en rodajas', amount: 'al gusto' },
    ],
    instructions: [
      'Corta las tortillas en triángulos y hornea a 180°C por 10 minutos hasta que estén crujientes.',
      'Calienta la salsa verde en un sartén.',
      'Agrega los totopos de nopal a la salsa y mezcla suavemente.',
      'Sirve con pollo deshebrado, crema light, queso panela, cebolla y cilantro.',
    ],
    nutrition: { calories: 320, protein: 28, carbs: 30, fat: 10, fiber: 8 },
    prepTime: 20,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['desayuno', 'mexicana', 'alto_proteina'],
  },
  {
    id: 'break-04',
    name: 'Smoothie bowl de espinacas y proteína',
    description: 'Smoothie bowl verde rico en proteína ideal para empezar el día.',
    mealSlot: 'desayuno',
    ingredients: [
      { name: 'Espinacas frescas', amount: '2 tazas' },
      { name: 'Proteína vegetal en polvo (vainilla)', amount: '1 scoop' },
      { name: 'Leche de almendras sin azúcar', amount: '1 taza' },
      { name: 'Aguacate', amount: '1/4 pieza' },
      { name: 'Semillas de cáñamo', amount: '1 cucharada' },
      { name: 'Granola sin azúcar', amount: '2 cucharadas' },
    ],
    instructions: [
      'Licúa las espinacas, proteína, leche de almendras y aguacate hasta obtener textura cremosa.',
      'Vierte en un tazón.',
      'Decora con semillas de cáñamo y granola sin azúcar.',
    ],
    nutrition: { calories: 290, protein: 30, carbs: 18, fat: 12, fiber: 7 },
    prepTime: 8,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['desayuno', 'alto_proteina', 'verde', 'rapido'],
  },

  // ─── ALMUERZOS ───
  {
    id: 'lunch-01',
    name: 'Pechuga de pollo a la plancha con quinoa y verduras',
    description: 'Proteína magra con quinoa, rica en fibra y proteína completa.',
    mealSlot: 'almuerzo',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g' },
      { name: 'Quinoa cocida', amount: '1 taza' },
      { name: 'Brócoli', amount: '1 taza' },
      { name: 'Pimiento morrón', amount: '1/2 pieza' },
      { name: 'Aceite de oliva', amount: '1 cucharada' },
      { name: 'Especias (orégano, ajo, comino)', amount: 'al gusto' },
      { name: 'Limón', amount: '1/2 pieza' },
    ],
    instructions: [
      'Sazona la pechuga con especias, ajo en polvo y jugo de limón.',
      'Cocina a la plancha 6-7 minutos por lado.',
      'Cocina el brócoli al vapor 5 minutos y saltea con pimiento.',
      'Sirve la pechuga en rebanadas sobre quinoa y verduras salteadas.',
    ],
    nutrition: { calories: 380, protein: 38, carbs: 32, fat: 10, fiber: 6 },
    prepTime: 25,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['almuerzo', 'alto_proteina', 'quinoa', 'mealprep'],
  },
  {
    id: 'lunch-02',
    name: 'Tacos de pescado estilo Baja con tortilla de maíz',
    description: 'Tacos de pescado blanco con ensalada fresca y crema ligera.',
    mealSlot: 'almuerzo',
    ingredients: [
      { name: 'Filete de pescado blanco (merluza/bacalao)', amount: '150g' },
      { name: 'Tortillas de maíz', amount: '3 pequeñas' },
      { name: 'Repollo morado rallado', amount: '1 taza' },
      { name: 'Zanahoria rallada', amount: '1/2 taza' },
      { name: 'Yogurt griego natural', amount: '2 cucharadas' },
      { name: 'Jugo de limón', amount: '1 cucharada' },
      { name: 'Cilantro', amount: 'al gusto' },
      { name: 'Aceite de oliva', amount: '1 cucharadita' },
    ],
    instructions: [
      'Cocina el pescado en sartén con aceite de oliva, 3-4 minutos por lado. Desmenuza.',
      'Mezcla el repollo con zanahoria, yogurt griego y limón para la ensalada.',
      'Calienta las tortillas en comal.',
      'Arma los tacos con pescado, ensalada y cilantro.',
    ],
    nutrition: { calories: 340, protein: 32, carbs: 28, fat: 11, fiber: 5 },
    prepTime: 18,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['almuerzo', 'mexicana', 'pescado', 'bajo_calorias'],
  },
  {
    id: 'lunch-03',
    name: 'Ensalada de lentejas con atún y verduras',
    description: 'Ensalada completa y nutritiva, rica en fibra y proteína.',
    mealSlot: 'almuerzo',
    ingredients: [
      { name: 'Lentejas cocidas', amount: '1 taza' },
      { name: 'Atún en agua (lata)', amount: '1 lata' },
      { name: 'Jitomate cherry', amount: '1/2 taza' },
      { name: 'Pepino', amount: '1/2 pieza' },
      { name: 'Aguacate', amount: '1/4 pieza' },
      { name: 'Cebolla morada', amount: '1/4 pieza' },
      { name: 'Vinagreta de limón y mostaza', amount: '2 cucharadas' },
    ],
    instructions: [
      'Mezcla las lentejas escurridas con el atún desmenuzado.',
      'Agrega los vegetales picados (jitomate, pepino, cebolla, aguacate).',
      'Aliña con vinagreta de limón y mostaza.',
      'Mezcla bien y sirve fría o a temperatura ambiente.',
    ],
    nutrition: { calories: 360, protein: 32, carbs: 35, fat: 10, fiber: 12 },
    prepTime: 10,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['almuerzo', 'vegetariana', 'fibra', 'alto_proteina', 'rapida'],
  },
  {
    id: 'lunch-04',
    name: 'Bowl de pollo al curry con coliflor arroz',
    description: 'Arroz de coliflor con pollo al curry ligero, bajo en carbohidratos.',
    mealSlot: 'almuerzo',
    ingredients: [
      { name: 'Pechuga de pollo en cubos', amount: '150g' },
      { name: 'Coliflor (procesada como arroz)', amount: '2 tazas' },
      { name: 'Leche de coco light', amount: '1/4 taza' },
      { name: 'Pasta de curry rojo', amount: '1 cucharadita' },
      { name: 'Pimiento morrón', amount: '1/2 pieza' },
      { name: 'Espinacas', amount: '1 taza' },
      { name: 'Aceite de coco', amount: '1 cucharadita' },
    ],
    instructions: [
      'Saltea el pollo en aceite de coco hasta dorar. Reserva.',
      'En el mismo sartén, saltea el pimiento y la coliflor 3-4 minutos.',
      'Agrega la pasta de curry y leche de coco, mezcla bien.',
      'Incorpora el pollo y las espinacas, cocina 2 minutos hasta que las espinacas reduzcan.',
    ],
    nutrition: { calories: 350, protein: 35, carbs: 14, fat: 18, fiber: 7 },
    prepTime: 22,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['almuerzo', 'bajo_carbohidrato', 'sin_grano'],
  },

  // ─── CENAS ───
  {
    id: 'dinner-01',
    name: 'Salmón al horno con espárragos y puré de coliflor',
    description: 'Salmón rico en omega-3 con puré de coliflor bajo en carbohidratos.',
    mealSlot: 'cena',
    ingredients: [
      { name: 'Filete de salmón', amount: '150g' },
      { name: 'Espárragos frescos', amount: '8 piezas' },
      { name: 'Coliflor', amount: '2 tazas' },
      { name: 'Aceite de oliva', amount: '1 cucharada' },
      { name: 'Ajo', amount: '1 diente' },
      { name: 'Limón', amount: '1/2 pieza' },
      { name: 'Eneldo o perejil', amount: 'al gusto' },
    ],
    instructions: [
      'Sazona el salmón con ajo, eneldo, limón y aceite de oliva.',
      'Hornea a 190°C por 15-18 minutos junto con los espárragos.',
      'Cocina la coliflor al vapor 8 minutos, luego licúa con un diente de ajo y sal.',
      'Sirve el salmón con espárragos y puré de coliflor.',
    ],
    nutrition: { calories: 340, protein: 35, carbs: 10, fat: 19, fiber: 5 },
    prepTime: 25,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['cena', 'alto_proteina', 'omega3', 'bajo_carbohidrato'],
  },
  {
    id: 'dinner-02',
    name: 'Sopa de verduras con albóndigas de pollo',
    description: 'Sopa reconfortante con proteína magra y muchas verduras.',
    mealSlot: 'cena',
    ingredients: [
      { name: 'Pollo molido magro', amount: '120g' },
      { name: 'Caldo de pollo bajo en sodio', amount: '2 tazas' },
      { name: 'Zanahoria', amount: '1 pieza' },
      { name: 'Calabacita', amount: '1 pieza' },
      { name: 'Apio', amount: '1 rama' },
      { name: 'Espinacas', amount: '1 taza' },
      { name: 'Ajo y cebolla', amount: 'al gusto' },
    ],
    instructions: [
      'Forma albóndigas pequeñas con el pollo molido, ajo picado y sal.',
      'Hierve el caldo con la cebolla, ajo y verduras picadas 10 minutos.',
      'Agrega las albóndigas y cocina 8 minutos más.',
      'Añade las espinacas al final, apaga el fuego y sirve.',
    ],
    nutrition: { calories: 280, protein: 30, carbs: 14, fat: 12, fiber: 5 },
    prepTime: 25,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['cena', 'sopa', 'bajo_calorias', 'confort'],
  },
  {
    id: 'dinner-03',
    name: 'Wrap de lechuga con pavo y hummus',
    description: 'Wrap sin tortilla envuelto en lechuga, fresco y ligero.',
    mealSlot: 'cena',
    ingredients: [
      { name: 'Pechuga de pavo rebanada', amount: '100g' },
      { name: 'Hummus natural', amount: '2 cucharadas' },
      { name: 'Hojas de lechuga romana', amount: '4 grandes' },
      { name: 'Aguacate', amount: '1/2 pieza' },
      { name: 'Pepino en tiras', amount: '1/2 pieza' },
      { name: 'Zanahoria rallada', amount: '1/4 taza' },
      { name: 'Mostaza Dijon', amount: '1 cucharadita' },
    ],
    instructions: [
      'Extiende las hojas de lechuga sobre una superficie plana.',
      'Unta hummus y mostaza sobre la lechuga.',
      'Coloca el pavo, aguacate en rebanadas, pepino y zanahoria.',
      'Envuelve apretadamente como un wrap y corta por la mitad.',
    ],
    nutrition: { calories: 270, protein: 28, carbs: 12, fat: 14, fiber: 6 },
    prepTime: 10,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['cena', 'rapido', 'sin_grano', 'bajo_carbohidrato', 'fresco'],
  },

  // ─── SNACKS ───
  {
    id: 'snack-01',
    name: 'Hummus con palitos de verduras',
    description: 'Hummus casero rico en proteína vegetal y fibra.',
    mealSlot: 'snack_am',
    ingredients: [
      { name: 'Garbanzo cocido', amount: '1/2 taza' },
      { name: 'Tahini', amount: '1 cucharada' },
      { name: 'Jugo de limón', amount: '1 cucharada' },
      { name: 'Ajo', amount: '1 diente' },
      { name: 'Aceite de oliva', amount: '1 cucharadita' },
      { name: 'Apio, zanahoria, pepino en palitos', amount: '1 taza' },
    ],
    instructions: [
      'Licúa el garbanzo con tahini, limón, ajo y aceite de oliva.',
      'Ajusta la consistencia con un poco de agua.',
      'Sirve con palitos de verduras variadas.',
    ],
    nutrition: { calories: 180, protein: 8, carbs: 18, fat: 9, fiber: 6 },
    prepTime: 8,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['snack', 'vegetariano', 'fibra', 'vegano'],
  },
  {
    id: 'snack-02',
    name: 'Yogurt griego con nueces y canela',
    description: 'Snack proteico con grasas saludables y antioxidantes.',
    mealSlot: 'snack_pm',
    ingredients: [
      { name: 'Yogurt griego natural sin azúcar', amount: '1 taza' },
      { name: 'Nueces pecanas', amount: '4-5 piezas' },
      { name: 'Canela molida', amount: '1/2 cucharadita' },
      { name: 'Esencia de vainilla', amount: '1/2 cucharadita' },
      { name: 'Stevia o monk fruit', amount: 'al gusto (opcional)' },
    ],
    instructions: [
      'Coloca el yogurt en un tazón.',
      'Agrega las nueces troceadas, canela y vainilla.',
      'Mezcla y disfruta frío.',
    ],
    nutrition: { calories: 160, protein: 16, carbs: 8, fat: 8, fiber: 1 },
    prepTime: 3,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['snack', 'alto_proteina', 'rapido'],
  },
  {
    id: 'snack-03',
    name: 'Rollitos de jamón serrano con queso panela y aguacate',
    description: 'Snack salado y proteico ideal para media tarde.',
    mealSlot: 'snack_pm',
    ingredients: [
      { name: 'Jamón serrano bajo en sodio', amount: '3 rebanadas' },
      { name: 'Queso panela', amount: '40g' },
      { name: 'Aguacate', amount: '1/4 pieza' },
      { name: 'Rúcula', amount: '1/2 taza' },
      { name: 'Aceite de oliva', amount: '1 cucharadita' },
    ],
    instructions: [
      'Corta el queso panela y aguacate en tiras.',
      'Coloca rúcula, queso y aguacate sobre cada rebanada de jamón.',
      'Enrolla y asegura con un palillo si es necesario.',
      'Rocía con aceite de oliva.',
    ],
    nutrition: { calories: 190, protein: 18, carbs: 3, fat: 13, fiber: 2 },
    prepTime: 5,
    servings: 1,
    diabeticFriendly: true,
    glycemicIndex: 'bajo',
    tags: ['snack', 'bajo_carbohidrato', 'alto_proteina', 'rapido'],
  },
];

// ─── HELPERS ───

export function getRecipesByMealSlot(slot: MealSlot): Recipe[] {
  return recipes.filter(r => r.mealSlot === slot);
}

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find(r => r.id === id);
}

export function getAllRecipes(): Recipe[] {
  return recipes;
}

export function searchRecipes(query: string): Recipe[] {
  const q = query.toLowerCase();
  return recipes.filter(
    r =>
      r.name.toLowerCase().includes(q) ||
      r.tags.some(t => t.includes(q)) ||
      r.description.toLowerCase().includes(q)
  );
}

// ─── MENÚ SEMANAL ───

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function sumNutrition(nutritions: NutritionInfo[]): NutritionInfo {
  return {
    calories: nutritions.reduce((s, n) => s + n.calories, 0),
    protein: Math.round(nutritions.reduce((s, n) => s + n.protein, 0) * 10) / 10,
    carbs: Math.round(nutritions.reduce((s, n) => s + n.carbs, 0) * 10) / 10,
    fat: Math.round(nutritions.reduce((s, n) => s + n.fat, 0) * 10) / 10,
    fiber: Math.round(nutritions.reduce((s, n) => s + n.fiber, 0) * 10) / 10,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateWeeklyMealPlan(calorieTarget: number): DayMealPlan[] {
  const slots: MealSlot[] = ['desayuno', 'snack_am', 'almuerzo', 'snack_pm', 'cena'];

  return dayNames.map((dayName, dayIndex) => {
    // Get recipes for each meal slot, shuffling with a seed based on day to get variety
    const dayRecipes: { slot: MealSlot; recipe: Recipe }[] = [];

    for (const slot of slots) {
      const available = getRecipesByMealSlot(slot);
      // Rotate recipes based on day index so each day has different recipes
      const recipeIndex = (dayIndex + slot.length) % available.length;
      dayRecipes.push({ slot, recipe: available[recipeIndex] });
    }

    const totalNutrition = sumNutrition(dayRecipes.map(r => r.recipe.nutrition));

    return {
      day: dayName,
      meals: dayRecipes.map(({ slot, recipe }) => ({
        slot,
        recipe,
        portion: '1 porción',
      })),
      totalNutrition,
    };
  });
}

// ─── SUGERENCIAS DE COMIDA BASADAS EN GLUCOSA ───

export function getMealSuggestionForGlucose(glucoseValue: number): {
  title: string;
  suggestion: string;
  foods: string[];
  avoid: string[];
} {
  if (glucoseValue < 70) {
    return {
      title: '⚠️ Glucosa baja - Necesitas carbohidratos de acción rápida',
      suggestion: 'Consume 15g de carbohidratos de acción rápida. Espera 15 minutos y vuelve a medir. Luego come una comida balanceada.',
      foods: ['1/2 vaso de jugo de naranja (sin azúcar añadida)', '1 cucharada de miel o mermelada', '3-4 piezas de galletas saladas', '1 fruta pequeña (manzana o pera)'],
      avoid: ['Chocolate (la grasa retrasa la absorción)', 'Refrescos regulares', 'Pastelillos o donas'],
    };
  }

  if (glucoseValue <= 100) {
    return {
      title: '✅ Glucosa normal - Excelente momento para comer',
      suggestion: 'Tu glucosa está en rango óptimo. Puedes comer tu siguiente comida con tranquilidad.',
      foods: ['Comida balanceada con proteína magra', 'Ensalada con verduras de hoja verde', 'Agua con limón o té sin azúcar'],
      avoid: ['Evita exceso de carbohidratos simples', 'No te saltes comidas para mantener el nivel'],
    };
  }

  if (glucoseValue <= 140) {
    return {
      title: '📈 Glucosa ligeramente elevada',
      suggestion: 'Reduce los carbohidratos en tu siguiente comida y prioriza proteína y fibra.',
      foods: ['Proteína magra (pollo, pescado, tofu)', 'Verduras de hoja verde al vapor', '1 porción pequeña de quinoa o lentejas', 'Té verde sin azúcar'],
      avoid: ['Pan, tortillas, arroz blanco', 'Refrescos y jugos', 'Frutas muy dulces (plátano, uvas, mango)'],
    };
  }

  if (glucoseValue <= 200) {
    return {
      title: '🔴 Glucosa alta - Toma precaución',
      suggestion: 'Evita carbohidratos en tu siguiente comida. Prioriza proteína, grasas saludables y verduras.',
      foods: ['Pechuga de pollo o pescado a la plancha', 'Ensalada grande con aderezo de aceite de oliva', 'Verduras al vapor (brócoli, coliflor, espinacas)', 'Agua natural abundante'],
      avoid: ['Todos los granos y cereales', 'Frutas', 'Lácteos con lactosa', 'Bebidas endulzadas'],
    };
  }

  return {
    title: '🚨 ¡Glucosa peligrosamente alta!',
    suggestion: 'No consumas carbohidratos. Toma agua, camina suavemente y consulta a tu médico si los niveles no bajan.',
    foods: ['Agua natural en abundancia', 'Té de manzanilla o té verde sin azúcar', 'Caldo de verduras sin pasta ni arroz', 'Verduras crujientes (apio, pepino)'],
    avoid: ['Todo tipo de carbohidratos y azúcares', 'Alimentos procesados', 'Bebidas endulzadas', 'Ejercicio intenso si tienes cetonas'],
  };
}
