import { useMemo } from 'react';
import type { GlucoseEntry, Medication, Reminder, UserProfile, HealthAssessment } from '../types';
import { getTimeUntilNextDose, reminderTypeLabels, reminderTypeIcons } from '../types';
import { loadProfile, assessHealth, bmiCategoryLabels, riskLevelLabels, riskLevelColors } from '../utils/health';
import { Sun, Moon, Sunrise } from 'lucide-react';

// ─── Storage Keys (consistent with Medications.tsx / Reminders.tsx) ───
const MEDICATIONS_KEY = 'diabetes-app-medications';
const REMINDERS_KEY = 'diabetes-app-reminders';

// ─── Helpers ───

function loadMedications(): Medication[] {
 try {
 const data = localStorage.getItem(MEDICATIONS_KEY);
 return data ? JSON.parse(data) : [];
 } catch { return []; }
}

function loadReminders(): Reminder[] {
 try {
 const data = localStorage.getItem(REMINDERS_KEY);
 return data ? JSON.parse(data) : [];
 } catch { return []; }
}

function getGreeting(): { text: string; icon: typeof Sun } {
 const hour = new Date().getHours();
 if (hour < 12) return { text: 'Buenos días', icon: Sunrise };
 if (hour < 18) return { text: 'Buenas tardes', icon: Sun };
 return { text: 'Buenas noches', icon: Moon };
}

function getTodayReminders(reminders: Reminder[]): Reminder[] {
 const today = new Date().getDay();
 return reminders.filter(r => r.enabled && r.days.includes(today));
}

// ─── Types for return value ───

export interface UpcomingMed {
 med: Medication;
 hours: number;
 minutes: number;
 nextTime: Date;
 isDue: boolean;
}

export interface AppData {
 profile: UserProfile | null;
 assessment: HealthAssessment | null;
 medications: Medication[];
 reminders: Reminder[];
 greeting: { text: string; icon: typeof Sun };
 GreetingIcon: typeof Sun;
 upcomingMeds: UpcomingMed[];
 todayReminders: Reminder[];
}

// ─── Hook ───

export function useAppData(): AppData {
 // Cargar datos desde localStorage (solo una vez al montar)
 const profile = useMemo(() => loadProfile(), []);
 const medications = useMemo(() => loadMedications(), []);
 const reminders = useMemo(() => loadReminders(), []);

 // Evaluación de salud
 const assessment: HealthAssessment | null = useMemo(() => {
 return profile ? assessHealth(profile) : null;
 }, [profile]);

 // Saludo dinámico
 const greeting = useMemo(() => getGreeting(), []);
 const GreetingIcon = greeting.icon;

 // Próximas dosis (top 3)
 const upcomingMeds = useMemo(() => {
 const enabled = medications.filter(m => m.enabled);
 return enabled
 .map(med => {
 const info = getTimeUntilNextDose(med);
 const isDue =
 info.nextTime.getTime() - Date.now() < 5 * 60000 &&
 info.nextTime.getTime() - Date.now() > -60000;
 return { med, ...info, isDue };
 })
 .sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime())
 .slice(0, 3);
 }, [medications]);

 // Recordatorios de hoy
 const todayReminders = useMemo(() => getTodayReminders(reminders), [reminders]);

 return {
 profile,
 assessment,
 medications,
 reminders,
 greeting,
 GreetingIcon,
 upcomingMeds,
 todayReminders,
 };
}
