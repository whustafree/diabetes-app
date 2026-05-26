import { useState, useEffect, useRef, useMemo } from 'react';
import type { GlucoseEntry } from '../types';
import { diabetesTypeLabels, reminderTypeLabels, reminderTypeIcons } from '../types';
import { loadEntries, getDailyStats, saveEntries, getGlucoseStatus } from '../utils/helpers';
import { bmiCategoryLabels, riskLevelLabels } from '../utils/health';
import { useAppData } from '../hooks/useAppData';
import StatsCard from './StatsCard';
import GlucoseForm from './GlucoseForm';
import GlucoseChart from './GlucoseChart';
import GlucoseLog from './GlucoseLog';
import { History, LayoutDashboard, Activity, Cloud, CloudOff, RefreshCw, UserPlus, Pill, Bell, Timer, AlertTriangle, Heart, Target, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveGlucoseToCloud, loadGlucoseFromCloud, mergeGlucose } from '../utils/glucoseSync';
import { calculateHealthScore, getWeeklyTrend } from '../utils/healthScore';
import { TrendingUp, TrendingDown, Minus, BarChart3, Droplets } from 'lucide-react';

type DashboardSection = 'dashboard' | 'profile' | 'meals' | 'diet' | 'medications' | 'reminders';

interface DashboardProps {
 onNavigate?: (section: DashboardSection) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
 const { user, firebaseReady } = useAuth();
 const { profile, assessment, medications, reminders, greeting, GreetingIcon, upcomingMeds, todayReminders } = useAppData();

 const [entries, setEntries] = useState<GlucoseEntry[]>(() => loadEntries());
 const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
 const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
 const cloudInitDone = useRef(false);
 const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

 const stats = getDailyStats(entries.slice(0, 7));
 const lastValue = entries[0]?.value ?? 0;

 // Health Score
 const healthScore = useMemo(() => calculateHealthScore(entries), [entries]); 
 const weekTrend = useMemo(() => getWeeklyTrend(entries), [entries]);

 // Cloud sync: carga inicial desde Firebase
 useEffect(() => {
 if (!user || !firebaseReady) {
 cloudInitDone.current = true;
 setCloudStatus('offline');
 return;
 }
 setCloudStatus('syncing');
 loadGlucoseFromCloud(user.uid).then(cloudData => {
 const { entries: merged, fromCloud } = mergeGlucose(entries, cloudData);
 setEntries(merged);
 saveEntries(merged);
 cloudInitDone.current = true;
 if (fromCloud) {
 setCloudStatus('synced');
 } else if (merged.length > 0) {
 saveGlucoseToCloud(user.uid, merged).then(ok => {
 setCloudStatus(ok ? 'synced' : 'offline');
 });
 } else {
 setCloudStatus('synced');
 }
 }).catch(() => {
 cloudInitDone.current = true;
 setCloudStatus('offline');
 });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.uid, firebaseReady]);

 // Cloud sync: sincronización automática ante cambios (debounced 1.5s)
 useEffect(() => {
 if (!cloudInitDone.current || !user || !firebaseReady) return;
 if (syncTimer.current) clearTimeout(syncTimer.current);
 syncTimer.current = setTimeout(() => {
 setCloudStatus('syncing');
 saveGlucoseToCloud(user.uid, entries).then(ok => {
 setCloudStatus(ok ? 'synced' : 'offline');
 });
 }, 1500);
 return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [entries, user?.uid, firebaseReady]);

 const handleEntryAdded = (updatedEntries: GlucoseEntry[]) => {
 setEntries(updatedEntries);
 };

 const handleEntryDeleted = (updatedEntries: GlucoseEntry[]) => {
 setEntries(updatedEntries);
 };

 // ─── REAL-TIME GLUCOSE WIDGET ───
 const [liveGlucose, setLiveGlucose] = useState(entries[0]?.value ?? null);
 const [lastUpdate, setLastUpdate] = useState(Date.now());
 const [countdown, setCountdown] = useState(300);

 // Refresh entries from localStorage every 5 seconds (fast check)
 useEffect(() => {
 const interval = setInterval(() => {
 const fresh = loadEntries();
 if (fresh.length > 0 && fresh[0].value !== liveGlucose) {
 setLiveGlucose(fresh[0].value);
 setLastUpdate(Date.now());
 setCountdown(300);
 }
 }, 5000);
 return () => clearInterval(interval);
 }, [liveGlucose]);

 // Countdown timer for 5-minute refresh
 useEffect(() => {
 const interval = setInterval(() => {
 setCountdown(prev => {
 if (prev <= 1) {
 // Force re-check
 const fresh = loadEntries();
 if (fresh.length > 0) {
 setLiveGlucose(fresh[0].value);
 setLastUpdate(Date.now());
 }
 return 300;
 }
 return prev - 1;
 });
 }, 1000);
 return () => clearInterval(interval);
 }, []);

 const formatCountdown = (s: number) => {
 const m = Math.floor(s / 60);
 const sec = s % 60;
 return `${m}:${sec.toString().padStart(2, '0')}`;
 };

 const liveStatus = liveGlucose !== null ? getGlucoseStatus(liveGlucose) : null;

 return (
 <div className="max-w-5xl mx-auto space-y-6">
 {/* ─── REAL-TIME GLUCOSE WIDGET ─── */}
 {entries.length > 0 && liveGlucose !== null && liveStatus && (
 <div className="card-enter bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700 overflow-hidden relative">
 {/* Live indicator bar */}
 <div className={`absolute top-0 left-0 right-0 h-1 ${
 liveGlucose < 70 ? 'bg-blue-500' :
 liveGlucose <= 100 ? 'bg-green-500' :
 liveGlucose <= 140 ? 'bg-yellow-500' :
 liveGlucose <= 200 ? 'bg-orange-500' : 'bg-red-600'
 }`} />

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 {/* Glow icon */}
 <div className={`relative ${liveGlucose < 70 ? 'pulse-glow' : ''}`}>
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-opacity-20 ${
 liveGlucose < 70 ? 'bg-blue-500' :
 liveGlucose <= 100 ? 'bg-green-500' :
 liveGlucose <= 140 ? 'bg-yellow-500' :
 liveGlucose <= 200 ? 'bg-orange-500' : 'bg-red-600'
 }`}>
 <Droplets className={`w-7 h-7 ${
 liveGlucose < 70 ? 'text-blue-500' :
 liveGlucose <= 100 ? 'text-green-500' :
 liveGlucose <= 140 ? 'text-yellow-500' :
 liveGlucose <= 200 ? 'text-orange-500' : 'text-red-600'
 } ${liveGlucose < 70 || liveGlucose > 140 ? 'animate-pulse' : ''}`} />
 </div>
 </div>

 <div>
 <div className="flex items-center gap-2">
 <span className="relative flex h-2.5 w-2.5">
 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
 liveGlucose >= 70 && liveGlucose <= 140 ? 'bg-green-400' : 'bg-red-400'
 }`} />
 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
 liveGlucose >= 70 && liveGlucose <= 140 ? 'bg-green-500' : 'bg-red-500'
 }`} />
 </span>
 <span className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">
 Glucosa en Vivo
 </span>
 </div>
 <div className="flex items-baseline gap-2 mt-1">
 <span className={`text-3xl font-extrabold count-up ${
 liveGlucose < 70 ? 'text-blue-500' :
 liveGlucose <= 100 ? 'text-green-500' :
 liveGlucose <= 140 ? 'text-yellow-500' :
 liveGlucose <= 200 ? 'text-orange-500' : 'text-red-600'
 }`}>
 {liveGlucose}
 </span>
 <span className="text-sm font-medium text-gray-400 text-gray-500">mg/dL</span>
 <span className={`text-xs font-semibold ml-1 ${
 liveGlucose < 70 ? 'text-blue-500' :
 liveGlucose <= 100 ? 'text-green-500' :
 liveGlucose <= 140 ? 'text-yellow-500' :
 liveGlucose <= 200 ? 'text-orange-500' : 'text-red-600'
 }`}>
 {liveStatus.emoji} {liveStatus.label}
 </span>
 </div>
 </div>
 </div>

 <div className="text-right flex-shrink-0">
 <div className="flex items-center gap-2">
 <svg className={`w-4 h-4 ${countdown < 60 ? 'text-orange-400 animate-spin' : 'text-gray-300 text-gray-600'}`} style={{ animationDuration: countdown < 60 ? '2s' : '3s' }} viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2">
 <circle cx="12"cy="12"r="10"/>
 <path d="M12 6v6l4 2"/>
 </svg>
 <span className={`text-xs font-mono font-bold ${countdown < 60 ? 'text-orange-400' : 'text-gray-400 text-gray-500'}`}>
 {formatCountdown(countdown)}
 </span>
 </div>
 <p className="text-[10px] text-gray-400 text-gray-400 mt-0.5">
 Actualizado {new Date(lastUpdate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* ─── PERSONALIZED HEADER ─── */}
 <div className="card-enter bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/50">
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <GreetingIcon className="w-5 h-5 text-blue-200"/>
 <span className="text-sm font-medium text-blue-200">{greeting.text}</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 leading-tight">
 {profile ? profile.name : (user?.displayName || 'Bienvenido')}
 </h1>
 <p className="text-blue-200 text-sm mt-1 max-w-md">
 {profile
 ? `Tu plan personalizado de control • ${profile.diabetesType !== 'none' ? 'Manejando ' + diabetesTypeLabels[profile.diabetesType].toLowerCase() : 'Enfoque preventivo'}`
 : 'Configura tu perfil para obtener recomendaciones personalizadas'}
 </p>
 </div>
 <div className="flex flex-col items-end gap-2 flex-shrink-0">
 {/* Cloud sync status */}
 {cloudStatus !== 'idle' && (
 <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
 {cloudStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-blue-200 animate-spin"/>}
 {cloudStatus === 'synced' && <Cloud className="w-3 h-3 text-green-300"/>}
 {cloudStatus === 'offline' && <CloudOff className="w-3 h-3 text-gray-300"/>}
 <span className="text-[10px] font-medium text-white/80">
 {cloudStatus === 'syncing' ? 'Sincronizando...' : cloudStatus === 'synced' ? 'En la nube' : 'Local'}
 </span>
 </div>
 )}
 {/* Profile prompt */}
 {!profile && (
 <button
 onClick={() => onNavigate?.('profile')}
 className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm hover:bg-white/25 rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95"
 >
 <UserPlus className="w-4 h-4"/>
 Crear mi perfil
 </button>
 )}
 </div>
 </div>

 {/* Quick stats row */}
 {assessment && (
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 card-enter">
 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
 <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">IMC</p>
 <p className="text-lg font-bold mt-0.5">{assessment.bmi}</p>
 <p className="text-[10px] text-blue-200/80">{bmiCategoryLabels[assessment.bmiCategory]}</p>
 </div>
 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
 <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Grasa Corporal</p>
 <p className="text-lg font-bold mt-0.5">{assessment.bodyFatPercentage}%</p>
 <p className="text-[10px] text-blue-200/80">{assessment.bodyFatCategory}</p>
 </div>
 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
 <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Metabolismo</p>
 <p className="text-lg font-bold mt-0.5">{assessment.tdee}</p>
 <p className="text-[10px] text-blue-200/80">kcal/día</p>
 </div>
 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
 <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Riesgo</p>
 <p className={`text-lg font-bold mt-0.5 ${assessment.riskLevel === 'bajo' ? 'text-green-300' : assessment.riskLevel === 'moderado' ? 'text-yellow-300' : 'text-red-300'}`}>
 {riskLevelLabels[assessment.riskLevel]}
 </p>
 <p className="text-[10px] text-blue-200/80">Evaluación de salud</p>
 </div>
 </div>
 )}
 </div>

 {/* ─── HEALTH SCORE CARD ─── */}
 {entries.length > 0 && (
 <div className="card-enter"><HealthScoreCard score={healthScore} trend={weekTrend} /></div>
 )}

 {/* ─── MONTHLY COMPARISON ─── */}
 {entries.length > 0 && (
 <div className="card-enter"><MonthlyComparisonCard entries={entries} /></div>
 )}

 {/* ─── NO PROFILE ─── */}
 {!profile && (
 <div className="card-enter bg-gradient-to-r from-blue-50 to-indigo-50 from-blue-900/20 to-indigo-900/20 rounded-2xl p-6 border border-blue-100 border-blue-800/50 text-center">
 <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-3"/>
 <h2 className="text-lg font-bold text-gray-200 text-white mb-2">
 Personaliza tu experiencia
 </h2>
 <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
 Crea tu perfil de salud para recibir recomendaciones personalizadas, seguimiento de métricas y un plan adaptado a tu condición.
 </p>
 <button
 onClick={() => onNavigate?.('profile')}
 className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-900/50 transition-all active:scale-95"
 >
 <UserPlus className="w-5 h-5"/>
 Crear mi perfil ahora
 <ChevronRight className="w-4 h-4"/>
 </button>
 </div>
 )}

 {/* ─── TODAY'S OVERVIEW ─── */}
 <div className="grid sm:grid-cols-2 gap-4">
 {/* Upcoming Medications */}
 <div className="card-enter card-hover bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-gray-200 text-white flex items-center gap-2">
 <Pill className="w-4 h-4 text-emerald-500"/>
 Próximas dosis
 </h3>
 {medications.length > 0 && (
 <button onClick={() => onNavigate?.('medications')} className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-600 transition-colors">
 Ver todas
 </button>
 )}
 </div>

 {medications.length === 0 ? (
 <div className="text-center py-4">
 <Pill className="w-8 h-8 text-gray-300 text-gray-400 mx-auto mb-2"/>
 <p className="text-xs text-gray-400 text-gray-500">No hay medicamentos registrados</p>
 <button
 onClick={() => onNavigate?.('medications')}
 className="text-xs text-emerald-400 font-semibold hover:underline mt-1 inline-block"
 >
 Agregar medicamentos
 </button>
 </div>
 ) : upcomingMeds.length === 0 ? (
 <div className="flex items-center gap-3 py-3">
 <div className="w-8 h-8 rounded-full bg-green-100 bg-green-900/40 flex items-center justify-center">
 <Timer className="w-4 h-4 text-green-500"/>
 </div>
 <div>
 <p className="text-sm font-medium text-gray-300">Al día</p>
 <p className="text-xs text-gray-400 text-gray-500">Todas las dosis están al día</p>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 {upcomingMeds.map(({ med, hours, minutes, isDue, nextTime }) => (
 <div key={med.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
 isDue
 ? 'bg-red-900/20 border border-red-700 border-red-800'
 : 'bg-gray-50 bg-gray-700/50'
 }`}>
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
 isDue ? 'bg-red-100 bg-red-900/50' : 'bg-emerald-100 bg-emerald-900/50'
 }`}>
 {isDue ? (
 <AlertTriangle className="w-4 h-4 text-red-500"/>
 ) : (
 <Pill className="w-4 h-4 text-emerald-500"/>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-gray-300 text-gray-200 truncate">{med.name}</p>
 <p className="text-[10px] text-gray-400 text-gray-500">{med.dosage}</p>
 </div>
 <div className="text-right flex-shrink-0">
 {isDue ? (
 <span className="text-[10px] font-bold text-red-500">¡Ahora!</span>
 ) : (
 <>
 <p className="text-xs font-bold text-gray-300">
 {hours > 0 ? `${hours}h ` : ''}{minutes}min
 </p>
 <p className="text-[10px] text-gray-400 text-gray-500">{new Date(nextTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
 </>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Today's Reminders */}
 <div className="card-enter card-hover bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-gray-200 text-white flex items-center gap-2">
 <Bell className="w-4 h-4 text-purple-500"/>
 Recordatorios de hoy
 </h3>
 {reminders.length > 0 && (
 <button onClick={() => onNavigate?.('reminders')} className="text-[10px] font-semibold text-purple-400 hover:text-purple-600 transition-colors">
 Ver todos
 </button>
 )}
 </div>

 {todayReminders.length === 0 ? (
 <div className="text-center py-4">
 <Bell className="w-8 h-8 text-gray-300 text-gray-400 mx-auto mb-2"/>
 <p className="text-xs text-gray-400 text-gray-500">No hay recordatorios para hoy</p>
 <button
 onClick={() => onNavigate?.('reminders')}
 className="text-xs text-purple-400 font-semibold hover:underline mt-1 inline-block"
 >
 Crear recordatorios
 </button>
 </div>
 ) : (
 <div className="space-y-2">
 {todayReminders.slice(0, 4).map(reminder => {
 const now = new Date();
 const [h, m] = reminder.time.split(':').map(Number);
 const remTime = new Date();
 remTime.setHours(h, m, 0, 0);
 const isPast = remTime < now;

 return (
 <div key={reminder.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${
 isPast ? 'bg-gray-50 bg-gray-700/50 opacity-60' : 'bg-purple-900/20'
 }`}>
 <span className="text-lg">{reminderTypeIcons[reminder.type]}</span>
 <div className="flex-1 min-w-0">
 <p className={`text-xs font-bold truncate ${isPast ? 'text-gray-400 text-gray-500' : 'text-gray-700 text-gray-200'}`}>
 {reminder.title}
 </p>
 <p className={`text-[10px] ${isPast ? 'text-gray-300 text-gray-600' : 'text-gray-400 text-gray-500'}`}>
 {reminder.description || reminderTypeLabels[reminder.type]}
 </p>
 </div>
 <span className={`text-[10px] font-semibold flex-shrink-0 ${
 isPast ? 'text-gray-300 text-gray-600' : 'text-purple-500'
 }`}>
 {reminder.time}
 </span>
 </div>
 );
 })}
 {todayReminders.length > 4 && (
 <button
 onClick={() => onNavigate?.('reminders')}
 className="w-full text-center text-[10px] font-semibold text-purple-400 hover:text-purple-600 py-1 transition-colors"
 >
 +{todayReminders.length - 4} recordatorios más
 </button>
 )}
 </div>
 )}
 </div>
 </div>

 {/* ─── GLUCOSE SECTION ─── */}
 <div className="card-enter bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-base font-bold text-gray-200 text-white flex items-center gap-2">
 <Activity className="w-5 h-5 text-blue-500"/>
 Monitoreo de Glucosa
 </h3>
 {profile && assessment && (
 <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 text-gray-500">
 <Heart className="w-3.5 h-3.5 text-red-400"/>
 <span>Rango ideal: 70-100 mg/dL</span>
 </div>
 )}
 </div>

 {/* Stats Cards */}
 <StatsCard stats={stats} lastValue={lastValue} />

 {/* Quick Add */}
 <div className="mt-4">
 <GlucoseForm onEntryAdded={handleEntryAdded} />
 </div>

 {/* Tab Navigation */}
 <div className="flex gap-1 bg-gray-700 bg-gray-800/50 rounded-2xl p-1.5 mt-4">
 {[
 { id: 'dashboard' as const, label: 'Gráfica', icon: LayoutDashboard },
 { id: 'history' as const, label: 'Historial', icon: History },
 ].map((tab) => {
 const Icon = tab.icon;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
 activeTab === tab.id
 ? 'bg-gray-800 text-blue-400 shadow-sm'
 : 'text-gray-400 text-gray-400 hover:text-gray-400 hover:text-gray-300'
 }`}
 >
 <Icon className="w-4 h-4"/>
 {tab.label}
 </button>
 );
 })}
 </div>

 {/* Content */}
 {activeTab === 'dashboard' ? (
 <div className="mt-4">
 <GlucoseChart entries={entries} />
 </div>
 ) : (
 <div className="mt-4">
 <h4 className="text-sm font-bold text-gray-200 text-white mb-3 flex items-center gap-2">
 <History className="w-4 h-4 text-blue-500"/>
 Historial de Mediciones
 </h4>
 <GlucoseLog entries={entries} onEntryDeleted={handleEntryDeleted} />
 </div>
 )}
 </div>

 {/* ─── HEALTH TARGETS SUMMARY ─── */}
 {assessment && profile && (
 <div className="card-enter card-hover bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-gray-200 text-white flex items-center gap-2">
 <Target className="w-4 h-4 text-green-500"/>
 Tus metas de salud
 </h3>
 <button
 onClick={() => onNavigate?.('profile')}
 className="text-[10px] font-semibold text-blue-400 hover:text-blue-600 transition-colors"
 >
 Ver perfil completo
 </button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="bg-blue-900/20 rounded-xl p-3">
 <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Peso ideal</p>
 <p className="text-sm font-bold text-blue-300 mt-1">
 {assessment.idealWeightRange.min} - {assessment.idealWeightRange.max} kg
 </p>
 <p className="text-[10px] text-blue-500/70 mt-0.5">
 {profile.weight > assessment.idealWeightRange.max
 ? `Meta: perder ${Math.round(profile.weight - assessment.idealWeightRange.max)} kg`
 : profile.weight < assessment.idealWeightRange.min
 ? `Meta: ganar ${Math.round(assessment.idealWeightRange.min - profile.weight)} kg`
 : '¡Estás en tu rango!'}
 </p>
 </div>
 <div className="bg-purple-900/20 rounded-xl p-3">
 <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Grasa saludable</p>
 <p className="text-sm font-bold text-purple-300 mt-1">
 {assessment.healthyBodyFatRange.min}% - {assessment.healthyBodyFatRange.max}%
 </p>
 <p className="text-[10px] text-purple-500/70 mt-0.5">
 Actual: {assessment.bodyFatPercentage}%
 </p>
 </div>
 <div className="bg-orange-900/20 rounded-xl p-3">
 <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Calorías diarias</p>
 <p className="text-sm font-bold text-orange-300 mt-1">
 {assessment.tdee} kcal
 </p>
 <p className="text-[10px] text-orange-500/70 mt-0.5">
 Gasto energético total
 </p>
 </div>
 <div className={`rounded-xl p-3 ${
 assessment.riskLevel === 'bajo' ? 'bg-green-900/20' :
 assessment.riskLevel === 'moderado' ? 'bg-yellow-900/20' :
 'bg-red-900/20'
 }`}>
 <p className={`text-[10px] font-semibold uppercase tracking-wider ${
 assessment.riskLevel === 'bajo' ? 'text-green-500' :
 assessment.riskLevel === 'moderado' ? 'text-yellow-500' :
 'text-red-500'
 }`}>Nivel de riesgo</p>
 <p className={`text-sm font-bold mt-1 ${
 assessment.riskLevel === 'bajo' ? 'text-green-300' :
 assessment.riskLevel === 'moderado' ? 'text-yellow-300' :
 'text-red-300'
 }`}>
 {riskLevelLabels[assessment.riskLevel]}
 </p>
 <p className={`text-[10px] ${
 assessment.riskLevel === 'bajo' ? 'text-green-500/70' :
 assessment.riskLevel === 'moderado' ? 'text-yellow-500/70' :
 'text-red-500/70'
 } mt-0.5`}>
 {assessment.healthRisks.length} factores identificados
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// ─── HEALTH SCORE CARD ───

// ─── MONTHLY COMPARISON CARD ───

function MonthlyComparisonCard({ entries }: { entries: GlucoseEntry[] }) {
 const now = new Date();
 const currentMonth = now.getMonth();
 const currentYear = now.getFullYear();

 const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
 const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

 const currentMonthEntries = entries.filter(e => {
 const d = new Date(e.date);
 return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
 });

 const prevMonthEntries = entries.filter(e => {
 const d = new Date(e.date);
 return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
 });

 if (currentMonthEntries.length === 0 && prevMonthEntries.length === 0) return null;

 const calcStats = (arr: GlucoseEntry[]) => {
 if (arr.length === 0) return { avg: 0, min: 0, max: 0, inRange: 0, inRangePct: 0, readings: 0 };
 const avg = Math.round(arr.reduce((s, e) => s + e.value, 0) / arr.length);
 const min = Math.min(...arr.map(e => e.value));
 const max = Math.max(...arr.map(e => e.value));
 const inRange = arr.filter(e => e.value >= 70 && e.value <= 140).length;
 return { avg, min, max, inRange, inRangePct: Math.round((inRange / arr.length) * 100), readings: arr.length };
 };

 const current = calcStats(currentMonthEntries);
 const previous = calcStats(prevMonthEntries);

 const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

 const diffAvg = previous.avg > 0 ? current.avg - previous.avg : 0;
 const diffInRange = previous.readings > 0 ? current.inRangePct - previous.inRangePct : 0;
 const diffReadings = previous.readings > 0 ? current.readings - previous.readings : current.readings;

 const TrendIcon = diffAvg < 0 ? TrendingDown : diffAvg > 0 ? TrendingUp : Minus;
 const trendColor = diffAvg < 0 ? 'text-green-500' : diffAvg > 0 ? 'text-red-500' : 'text-gray-400';
 const trendLabel = diffAvg < 0 ? 'Mejor (↓ glucosa)' : diffAvg > 0 ? 'Peor (↑ glucosa)' : 'Sin cambio';

 return (
 <div className="card-hover bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-bold text-gray-200 text-white flex items-center gap-2">
 <BarChart3 className="w-5 h-5 text-indigo-500"/>
 Comparativa Mensual
 </h3>
 <div className={`flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
 <TrendIcon className="w-4 h-4"/>
 {trendLabel}
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
 {/* Header row */}
 <div className="hidden sm:block"/>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Promedio</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">En rango</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Mediciones</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Rango</p>
 </div>

 {/* Previous month */}
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 bg-gray-600 flex-shrink-0"/>
 <span className="text-xs font-bold text-gray-400">{monthNames[prevMonth]}</span>
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-gray-300 text-gray-200">
 {previous.avg > 0 ? `${previous.avg} mg/dL` : '—'}
 </p>
 </div>
 <div className="text-center">
 <p className={`text-sm font-bold ${previous.inRangePct >= 70 ? 'text-green-400' : previous.inRangePct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
 {previous.readings > 0 ? `${previous.inRangePct}%` : '—'}
 </p>
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-gray-300 text-gray-200">{previous.readings}</p>
 </div>
 <div className="text-center">
 <p className="text-xs font-medium text-gray-400">
 {previous.readings > 0 ? `${previous.min}-${previous.max}` : '—'}
 </p>
 </div>

 {/* Current month */}
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 flex-shrink-0"/>
 <span className="text-xs font-bold text-indigo-400">{monthNames[currentMonth]}</span>
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-indigo-400">
 {current.avg > 0 ? `${current.avg} mg/dL` : '—'}
 </p>
 </div>
 <div className="text-center">
 <p className={`text-sm font-bold ${current.inRangePct >= 70 ? 'text-green-400' : current.inRangePct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
 {current.readings > 0 ? `${current.inRangePct}%` : '—'}
 </p>
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-indigo-400">{current.readings}</p>
 </div>
 <div className="text-center">
 <p className="text-xs font-medium text-gray-400">
 {current.readings > 0 ? `${current.min}-${current.max}` : '—'}
 </p>
 </div>

 {/* Difference row */}
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-gray-400 text-gray-500">Diferencia</span>
 </div>
 <div className={`text-center text-xs font-bold ${trendColor}`}>
 {previous.avg > 0 ? `${diffAvg > 0 ? '+' : ''}${diffAvg}` : '—'}
 </div>
 <div className={`text-center text-xs font-bold ${diffInRange > 0 ? 'text-green-500' : diffInRange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
 {previous.readings > 0 ? `${diffInRange > 0 ? '+' : ''}${diffInRange}%` : '—'}
 </div>
 <div className={`text-center text-xs font-bold ${diffReadings > 0 ? 'text-indigo-500' : diffReadings < 0 ? 'text-gray-500' : 'text-gray-400'}`}>
 {diffReadings > 0 ? `+${diffReadings}` : diffReadings < 0 ? `${diffReadings}` : '—'}
 </div>
 <div />
 </div>
 </div>
 );
}

function HealthScoreCard({ score, trend }: {
 score: ReturnType<typeof calculateHealthScore>;
 trend: ReturnType<typeof getWeeklyTrend>;
}) {
 const circumference = 2 * Math.PI * 36;
 const offset = circumference - (score.score / 100) * circumference;

 // Trend direction indicator
 const trendArrow = score.details.trend === 'mejorando' ? '↑' : score.details.trend === 'empeorando' ? '↓' : '→';
 const trendColor = score.details.trend === 'mejorando' ? 'text-green-500' : score.details.trend === 'empeorando' ? 'text-red-500' : 'text-gray-400';

 return (
 <div className="card-hover bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700">
 <div className="flex items-start gap-5">
 {/* Circular score */}
 <div className="flex-shrink-0 relative">
 <svg width="90"height="90"className="transform -rotate-90">
 <circle cx="45"cy="45"r="36"fill="none"stroke="currentColor"strokeWidth="6"
 className="text-gray-100 text-gray-700"
 />
 <circle cx="45"cy="45"r="36"fill="none"strokeWidth="6"strokeLinecap="round"
 stroke="currentColor"
 className={`${score.color} drop-shadow-sm transition-all duration-1000`}
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 style={{ transition: 'stroke-dashoffset 1s ease-out' }}
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="text-2xl">{score.emoji}</span>
 </div>
 </div>

 {/* Details */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-sm font-bold text-gray-200 text-white">Puntaje de Salud</h3>
 <span className={`text-xs font-bold ${trendColor}`}>
 {trendArrow} {score.details.trend === 'mejorando' ? 'Mejorando' : score.details.trend === 'empeorando' ? 'Empeorando' : 'Estable'}
 </span>
 </div>
 <p className={`text-lg font-extrabold ${score.color}`}>
 {score.score}/100 · {score.label}
 </p>

 {/* Week mini bar chart */}
 <div className="flex items-end gap-1 mt-3 h-10">
 {trend.map((day, i) => {
 const maxVal = Math.max(...trend.map(d => d.average), 1);
 const height = day.entries > 0 ? Math.max((day.average / maxVal) * 100, 15) : 3;
 const isToday = i === trend.length - 1;
 return (
 <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
 <div
 className={`w-full rounded-sm transition-all duration-300 ${
 isToday ? 'bg-blue-500' : 'bg-blue-300 bg-blue-600/60'
 }`}
 style={{ height: `${height}%` }}
 title={`${day.label}: ${day.average} mg/dL`}
 />
 <span className={`text-[7px] font-medium ${isToday ? 'text-blue-400' : 'text-gray-400 text-gray-500'}`}>
 {day.label}
 </span>
 </div>
 );
 })}
 </div>

 {/* Stats row */}
 <div className="grid grid-cols-3 gap-2 mt-3">
 <div className="bg-gray-50 bg-gray-700/50 rounded-lg p-2 text-center">
 <p className="text-[10px] text-gray-400 text-gray-500">En rango</p>
 <p className="text-xs font-bold text-green-400">
 {score.details.inRangePercentage}%
 </p>
 </div>
 <div className="bg-gray-50 bg-gray-700/50 rounded-lg p-2 text-center">
 <p className="text-[10px] text-gray-400 text-gray-500">Promedio</p>
 <p className="text-xs font-bold text-gray-300 text-gray-200">
 {score.details.averageGlucose}
 </p>
 </div>
 <div className="bg-gray-50 bg-gray-700/50 rounded-lg p-2 text-center">
 <p className="text-[10px] text-gray-400 text-gray-500">Mediciones/día</p>
 <p className="text-xs font-bold text-blue-400">
 {score.details.readingsPerDay}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
