import type { FoodLogEntry } from '../types';
import { generateId } from './helpers';

const STORAGE_KEY = 'diabetes-app-food-log';

export function loadFoodLog(): FoodLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFoodLog(entries: FoodLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addFoodEntry(entry: Omit<FoodLogEntry, 'id' | 'createdAt'>): FoodLogEntry[] {
  const entries = loadFoodLog();
  const newEntry: FoodLogEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  entries.unshift(newEntry);
  saveFoodLog(entries);
  return entries;
}

export function deleteFoodEntry(id: string): FoodLogEntry[] {
  const entries = loadFoodLog().filter(e => e.id !== id);
  saveFoodLog(entries);
  return entries;
}

export function updateFoodEntry(id: string, updates: Partial<FoodLogEntry>): FoodLogEntry[] {
  const entries = loadFoodLog().map(e => e.id === id ? { ...e, ...updates } : e);
  saveFoodLog(entries);
  return entries;
}

export function getTodayFoodLog(): FoodLogEntry[] {
  const today = new Date().toISOString().split('T')[0];
  return loadFoodLog().filter(e => e.date.startsWith(today));
}

export function getWeekFoodLog(): FoodLogEntry[] {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return loadFoodLog().filter(e => new Date(e.date) >= weekAgo);
}

export function getFoodLogStats(entries: FoodLogEntry[]): {
  totalMeals: number;
  totalCarbs: number;
  totalCalories: number;
  averageCarbsPerMeal: number;
  averageCaloriesPerMeal: number;
  mealsByType: Record<string, number>;
} {
  const mealsByType: Record<string, number> = {};
  let totalCarbs = 0;
  let totalCalories = 0;
  let mealsWithCarbs = 0;
  let mealsWithCalories = 0;

  entries.forEach(e => {
    mealsByType[e.mealType] = (mealsByType[e.mealType] || 0) + 1;
    if (e.carbs !== undefined) {
      totalCarbs += e.carbs;
      mealsWithCarbs++;
    }
    if (e.calories !== undefined) {
      totalCalories += e.calories;
      mealsWithCalories++;
    }
  });

  return {
    totalMeals: entries.length,
    totalCarbs,
    totalCalories,
    averageCarbsPerMeal: mealsWithCarbs > 0 ? Math.round(totalCarbs / mealsWithCarbs) : 0,
    averageCaloriesPerMeal: mealsWithCalories > 0 ? Math.round(totalCalories / mealsWithCalories) : 0,
    mealsByType,
  };
}
