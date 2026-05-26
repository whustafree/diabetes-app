import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Pill, PlusCircle, Trash2, Save, Clock, Bell, BellOff, Activity, Timer, AlertTriangle, ChevronDown, ChevronUp, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import PullToRefresh from './PullToRefresh';
import type { Medication } from '../types';
import { getNextDoseTime, formatDoseTime, getTimeUntilNextDose } from '../types';
import { generateId } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import {
 saveMedicationsToCloud,
 loadMedicationsFromCloud,
 mergeMedications,
} from '../utils/medicationSync';

const STORAGE_KEY = 'diabetes-app-medications';

function loadMedications(): Medication[] {
 try {
 const data = localStorage.getItem(STORAGE_KEY);
 return data ? JSON.parse(data) : [];
 } catch {
 return [];
 }
}

function saveMedications(medications: Medication[]): void {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
}

const DOSAGE_UNITS = ['mg', 'g', 'ml', 'UI', 'mcg', 'tabletas'] as const;

function requestNotificationPermission() {
 if ('Notification' in window && Notification.permission === 'default') {
 Notification.requestPermission();
 }
}

function playAlarmSound() {
 try {
 const ctx = new AudioContext();
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.frequency.value = 880;
 gain.gain.value = 0.3;
 osc.start();
 osc.stop(ctx.currentTime + 0.5);

 // Second beep
 setTimeout(() => {
 const ctx2 = new AudioContext();
 const osc2 = ctx2.createOscillator();
 const gain2 = ctx2.createGain();
 osc2.connect(gain2);
 gain2.connect(ctx2.destination);
 osc2.frequency.value = 660;
 gain2.gain.value = 0.3;
 osc2.start();
 osc2.stop(ctx2.currentTime + 0.3);
 }, 600);
 } catch {}
}

// Group medications by their next dose time (rounded to minute)
function groupDueMedications(
 medications: Medication[],
 windowMinutes: number = 5
): { meds: Medication[]; time: Date }[] {
 const groups = new Map<string, { meds: Medication[]; time: Date }>();

 for (const med of medications) {
 if (!med.enabled) continue;
 const nextTime = getNextDoseTime(med);
 const diffMs = nextTime.getTime() - Date.now();

 // Only include if due within the window
 if (diffMs < -60000 || diffMs > windowMinutes * 60000) continue;

 // Round to nearest minute for grouping
 const rounded = new Date(nextTime);
 rounded.setSeconds(0, 0);
 const key = rounded.toISOString();

 if (!groups.has(key)) {
 groups.set(key, { meds: [], time: rounded });
 }
 groups.get(key)!.meds.push(med);
 }

 return Array.from(groups.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
}

export default function Medications() {
 const [medications, setMedications] = useState<Medication[]>(loadMedications);
 const [isAdding, setIsAdding] = useState(false);
 const [notificationGranted, setNotificationGranted] = useState(
 'Notification' in window && Notification.permission === 'granted'
 );
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const lastNotifiedRef = useRef<Set<string>>(new Set());
 const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());
 const [cloudStatus, setCloudStatus] = useState<'offline' | 'online' | 'syncing'>('offline');
 const [cloudInitDone, setCloudInitDone] = useState(false);
 const { user, firebaseReady } = useAuth();
 const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 // New medication form state
 const [newName, setNewName] = useState('');
 const [newDosageValue, setNewDosageValue] = useState('500');
 const [newDosageUnit, setNewDosageUnit] = useState<string>('mg');
 const [newFrequency, setNewFrequency] = useState('8');
 const [newStartTime, setNewStartTime] = useState('08:00');
 const [newNotes, setNewNotes] = useState('');

 // Load from cloud on mount if user is logged in
 useEffect(() => {
 if (!user || !firebaseReady) {
 setCloudInitDone(true);
 setCloudStatus('offline');
 return;
 }

 setCloudStatus('syncing');
 loadMedicationsFromCloud(user.uid).then(cloudData => {
 const local = loadMedications();
 const { medications: merged, fromCloud } = mergeMedications(local, cloudData);
 setMedications(merged);
 saveMedications(merged);
 setCloudStatus('online');
 setCloudInitDone(true);

 // If local data is newer, sync it back to the cloud
 if (!fromCloud) {
 return saveMedicationsToCloud(user.uid, merged);
 }
 }).catch(() => {
 setCloudStatus('offline');
 setCloudInitDone(true);
 });
 }, [user, firebaseReady]);

 // Sync to cloud when medications change
 useEffect(() => {
 if (!user || !firebaseReady || !cloudInitDone) return;

 if (syncTimeoutRef.current) {
 clearTimeout(syncTimeoutRef.current);
 }

 setCloudStatus('syncing');
 syncTimeoutRef.current = setTimeout(async () => {
 const ok = await saveMedicationsToCloud(user.uid, medications);
 setCloudStatus(ok ? 'online' : 'offline');
 }, 1500); // debounce 1.5s

 return () => {
 if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
 };
 }, [medications, user, firebaseReady, cloudInitDone]);

 // Alarm check interval
 useEffect(() => {
 requestNotificationPermission();
 }, []);

 // Force re-render to update next dose times
 const [, forceUpdate] = useState(0);
 useEffect(() => {
 const interval = setInterval(() => {
 forceUpdate(n => n + 1);
 }, 30000);
 return () => clearInterval(interval);
 }, []);

 // Check for due medications and show notifications
 const checkAlarms = useCallback(() => {
 const now = new Date();
 const enabledMeds = medications.filter(m => m.enabled);
 const dueGroups = groupDueMedications(enabledMeds, 2); // 2-minute window

 for (const group of dueGroups) {
 const groupId = group.time.toISOString();
 if (lastNotifiedRef.current.has(groupId)) continue;

 // Mark as notified
 lastNotifiedRef.current.add(groupId);

 if ('Notification' in window && Notification.permission === 'granted') {
 if (group.meds.length === 1) {
 const med = group.meds[0];
 const notif = new Notification(`💊 ${med.name}`, {
 body: `Toma ${med.dosage} — ${med.notes || 'Medicamento programado'}`,
 icon: '/vite.svg',
 tag: `med-${med.id}-${groupId}`,
 });
 playAlarmSound();
 setTimeout(() => notif.close(), 10000);
 } else {
 // Combined alarm for multiple medications
 const names = group.meds.map(m => `• ${m.name} (${m.dosage})`).join('\n');
 const notif = new Notification(`💊 ¡Hora de tus medicamentos!`, {
 body: `Tienes ${group.meds.length} medicamentos para tomar:\n${names}`,
 icon: '/vite.svg',
 tag: `med-group-${groupId}`,
 });
 playAlarmSound();
 setTimeout(() => notif.close(), 15000);
 }
 }
 }

 // Clean up old notified entries (older than 1 hour)
 const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
 for (const key of lastNotifiedRef.current) {
 if (key < oneHourAgo) {
 lastNotifiedRef.current.delete(key);
 }
 }

 setLastCheckedTime(now);
 }, [medications]);

 useEffect(() => {
 const interval = setInterval(checkAlarms, 30000);
 return () => clearInterval(interval);
 }, [checkAlarms]);

 // Initial check
 useEffect(() => {
 checkAlarms();
 }, []);

 const handleToggle = (id: string) => {
 const updated = medications.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
 setMedications(updated);
 saveMedications(updated);
 };

 const handleDelete = (id: string) => {
 const updated = medications.filter(m => m.id !== id);
 setMedications(updated);
 saveMedications(updated);
 if (expandedId === id) setExpandedId(null);
 };

 const handleAdd = () => {
 if (!newName.trim() || !newDosageValue.trim() || !newFrequency.trim()) return;

 const dosage = `${newDosageValue.trim()} ${newDosageUnit}`;
 const medication: Medication = {
 id: generateId(),
 name: newName.trim(),
 dosage,
 frequencyHours: Number(newFrequency),
 startTime: newStartTime,
 notes: newNotes.trim() || undefined,
 enabled: true,
 createdAt: new Date().toISOString(),
 };

 const updated = [...medications, medication];
 setMedications(updated);
 saveMedications(updated);
 resetForm();
 setIsAdding(false);
 };

 const resetForm = () => {
 setNewName('');
 setNewDosageValue('500');
 setNewDosageUnit('mg');
 setNewFrequency('8');
 setNewStartTime('08:00');
 setNewNotes('');
 };

 const handlePermissionRequest = () => {
 requestNotificationPermission();
 setNotificationGranted('Notification' in window && Notification.permission === 'granted');
 };

 // Handle pull-to-refresh
 const handleCloudRefresh = useCallback(async () => {
    if (!user || !firebaseReady) return;
    setCloudStatus('syncing');
    try {
      const cloudData = await loadMedicationsFromCloud(user.uid);
      const local = loadMedications();
      const { medications: merged } = mergeMedications(local, cloudData);
      setMedications(merged);
      saveMedications(merged);
      setCloudStatus('online');
    } catch {
      setCloudStatus('offline');
    }
  }, [user, firebaseReady]);

 // Calculate next dose info for each medication
 const medWithDoseInfo = useMemo(() => {
 return medications.map(med => {
 if (!med.enabled) return { med, nextTime: null, timeUntil: null, isDue: false };
 const nextTime = getNextDoseTime(med);
 const timeUntil = getTimeUntilNextDose(med);
 const isDue = nextTime.getTime() - Date.now() < 5 * 60000 && nextTime.getTime() - Date.now() > -60000;
 return { med, nextTime, timeUntil, isDue };
 });
 }, [medications, lastCheckedTime]);

 const nextDueGroup = useMemo(() => {
 const enabled = medWithDoseInfo.filter(m => m.med.enabled && m.nextTime);
 if (enabled.length === 0) return null;
 return enabled.reduce((closest, current) =>
 !closest || (current.nextTime!.getTime() < closest.nextTime!.getTime()) ? current : closest
 );
 }, [medWithDoseInfo]);

 const dueCount = medWithDoseInfo.filter(m => m.isDue).length;

 return (
 <PullToRefresh onRefresh={handleCloudRefresh}>
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Header */}
 <div className="text-center">
 <div className="flex items-center justify-center gap-3 mb-2">
 <Pill className="w-7 h-7 text-emerald-600"/>
 <h2 className="text-2xl font-extrabold text-white">Medicamentos</h2>
 </div>
 <p className="text-gray-400 text-gray-400 text-sm">Controla tus medicamentos y recibe alarmas para cada dosis</p>

 {/* Cloud Sync Status */}
 {firebaseReady && (
 <div className="flex items-center justify-center gap-1.5 mt-2">
 {cloudStatus === 'online' ? (
 <>
 <Cloud className="w-3.5 h-3.5 text-emerald-500"/>
 <span className="text-[11px] font-medium text-emerald-500">Sincronizado con la nube</span>
 </>
 ) : cloudStatus === 'syncing' ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin"/>
 <span className="text-[11px] font-medium text-blue-500">Sincronizando...</span>
 </>
 ) : (
 <>
 <CloudOff className="w-3.5 h-3.5 text-gray-400"/>
 <span className="text-[11px] font-medium text-gray-400">Solo datos locales</span>
 </>
 )}
 </div>
 )}
 </div>

 {/* Next Dose Summary */}
 {medications.filter(m => m.enabled).length > 0 && (
 <div className={`rounded-2xl p-5 transition-all duration-300 ${
 dueCount > 0
 ? 'bg-red-900/30 border-2 border-red-300 border-red-700 animate-pulse'
 : 'bg-emerald-900/30 border border-emerald-700 border-emerald-800'
 }`}>
 <div className="flex items-center gap-3">
 {dueCount > 0 ? (
 <AlertTriangle className="w-6 h-6 text-red-500"/>
 ) : (
 <Timer className="w-6 h-6 text-emerald-500"/>
 )}
 <div className="flex-1">
 {dueCount > 0 ? (
 <div>
 <p className="text-sm font-bold text-red-300">
 ¡{dueCount} medicamento{dueCount > 1 ? 's' : ''} para tomar ahora!
 </p>
 <div className="mt-1 space-y-0.5">
 {medWithDoseInfo.filter(m => m.isDue).map(({ med, nextTime }) => (
 <p key={med.id} className="text-xs text-red-400">
 {med.name} — {med.dosage}
 </p>
 ))}
 </div>
 </div>
 ) : nextDueGroup && nextDueGroup.timeUntil ? (
 <div>
 <p className="text-sm font-semibold text-emerald-300">
 Próxima dosis: {nextDueGroup.med.name}
 </p>
 <p className="text-xs text-emerald-400 mt-0.5">
 En {nextDueGroup.timeUntil.hours > 0 ? `${nextDueGroup.timeUntil.hours}h ` : ''}{nextDueGroup.timeUntil.minutes}min &middot; {nextDueGroup.med.dosage}
 </p>
 </div>
 ) : (
 <p className="text-sm font-semibold text-emerald-300">
 No hay dosis pendientes
 </p>
 )}
 </div>
 <div className="text-right">
 <p className="text-xs text-gray-400">
 {medications.filter(m => m.enabled).length} activo{medications.filter(m => m.enabled).length > 1 ? 's' : ''}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Notification Permission */}
 {!notificationGranted && 'Notification' in window && Notification.permission !== 'denied' && (
 <div className="bg-yellow-900/30 border border-yellow-700 border-yellow-800 rounded-2xl p-4 flex items-start gap-3">
 <BellOff className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
 <div className="flex-1">
 <p className="text-sm font-semibold text-yellow-300">Notificaciones desactivadas</p>
 <p className="text-xs text-yellow-400 mt-1">Activa las notificaciones para recibir alarmas de tus medicamentos.</p>
 </div>
 <button
 onClick={handlePermissionRequest}
 className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-xs font-semibold hover:bg-yellow-600 transition flex-shrink-0"
 >
 Activar
 </button>
 </div>
 )}

 {/* Add Button */}
 <button
 onClick={() => { setIsAdding(!isAdding); if (!isAdding) resetForm(); }}
 className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 ${
 isAdding
 ? 'bg-gray-700 text-gray-300'
 : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/50 hover:shadow-xl active:scale-[0.98]'
 }`}
 >
 <PlusCircle className="w-5 h-5"/>
 {isAdding ? 'Cancelar' : 'Agregar Medicamento'}
 </button>

 {/* Add Form */}
 {isAdding && (
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700 space-y-4">
 <h3 className="font-bold text-white flex items-center gap-2">
 <Pill className="w-5 h-5 text-emerald-500"/>
 Nuevo Medicamento
 </h3>

 {/* Name */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre del medicamento</label>
 <input
 type="text"
 value={newName}
 onChange={e => setNewName(e.target.value)}
 placeholder="Ej: Metformina, Insulina..."
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
 />
 </div>

 {/* Dosage */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">Dosis</label>
 <div className="flex gap-2">
 <input
 type="number"
 value={newDosageValue}
 onChange={e => setNewDosageValue(e.target.value)}
 min="0"
 step="0.1"
 className="flex-1 px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
 />
 <select
 value={newDosageUnit}
 onChange={e => setNewDosageUnit(e.target.value)}
 className="w-28 px-3 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
 >
 {DOSAGE_UNITS.map(unit => (
 <option key={unit} value={unit}>{unit}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Frequency */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">Frecuencia</label>
 <div className="flex items-center gap-3">
 <input
 type="number"
 value={newFrequency}
 onChange={e => setNewFrequency(e.target.value)}
 min="1"
 max="24"
 className="w-24 px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center"
 />
 <span className="text-sm font-medium text-gray-400">cada</span>
 <div className="flex gap-1.5">
 {[4, 6, 8, 12, 24].map(h => (
 <button
 key={h}
 onClick={() => setNewFrequency(String(h))}
 className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
 Number(newFrequency) === h
 ? 'bg-emerald-100 bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-300'
 : 'bg-gray-50 bg-gray-700 text-gray-400 hover:bg-gray-700 hover:bg-gray-600 border border-gray-700 border-gray-600'
 }`}
 >
 {h}h
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Start Time */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">Hora de la primera dosis</label>
 <input
 type="time"
 value={newStartTime}
 onChange={e => setNewStartTime(e.target.value)}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
 />
 <p className="text-[10px] text-gray-400 text-gray-400 mt-1">
 Las siguientes dosis se calcularán automáticamente cada {newFrequency} horas
 </p>
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1">Notas (opcional)</label>
 <input
 type="text"
 value={newNotes}
 onChange={e => setNewNotes(e.target.value)}
 placeholder="Ej: Tomar con comida, antes de dormir..."
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
 />
 </div>

 <button
 onClick={handleAdd}
 disabled={!newName.trim() || !newDosageValue.trim() || !newFrequency.trim()}
 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
 >
 <Save className="w-5 h-5"/>
 Guardar Medicamento
 </button>
 </div>
 )}

 {/* Medication List */}
     <div className="space-y-3">
      {medications.length === 0 ? (
 <div className="text-center py-12">
 <Pill className="w-14 h-14 text-gray-300 text-gray-400 mx-auto mb-3"/>
 <p className="text-gray-400 text-gray-400 font-medium">No hay medicamentos registrados</p>
 <p className="text-xs text-gray-300 text-gray-400 mt-1">Agrega tus medicamentos para recibir alarmas</p>
 </div>
 ) : (
 medications.map((med, index) => {
 const info = medWithDoseInfo[index];
 const isExpanded = expandedId === med.id;

 return (          <div key={med.id}
            className={`stagger-enter rounded-2xl border transition-all duration-200 ${
 med.enabled
 ? info?.isDue
 ? 'bg-red-900/20 border-red-700 border-red-800 animate-[pulse_2s_ease-in-out_infinite]'
 : 'bg-gray-800 border-gray-700 hover:shadow-md'
 : 'bg-gray-800/50 border-gray-700 opacity-50'
 }`}
 >
 <div className="p-4">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
 info?.isDue
 ? 'bg-red-100 bg-red-900/50'
 : med.enabled
 ? 'bg-emerald-100 bg-emerald-900/50'
 : 'bg-gray-700'
 }`}>
 <Pill className={`w-5 h-5 ${
 info?.isDue
 ? 'text-red-600'
 : med.enabled
 ? 'text-emerald-600'
 : 'text-gray-400'
 }`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className={`font-bold text-sm ${
 med.enabled ? 'text-gray-800 text-white' : 'text-gray-400 text-gray-500'
 }`}>
 {med.name}
 </h4>
 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
 med.enabled
 ? 'bg-emerald-900/30 text-emerald-400'
 : 'bg-gray-700 text-gray-400 text-gray-500'
 }`}>
 {med.dosage}
 </span>
 </div>

 <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3"/>
 Cada {med.frequencyHours}h
 </span>
 <span className="flex items-center gap-1">
 <Timer className="w-3 h-3"/>
 Inicio: {med.startTime}
 </span>
 </div>

 {/* Next dose info */}
 {med.enabled && info?.timeUntil && (
 <div className={`mt-2 text-xs font-medium ${
 info.isDue
 ? 'text-red-400'
 : 'text-emerald-400'
 }`}>
 {info.isDue ? (
 <span className="flex items-center gap-1">
 <AlertTriangle className="w-3 h-3"/>
 ¡Hora de tomar!
 </span>
 ) : (
 <span>
 Próxima dosis: {formatDoseTime(info.nextTime!)} ({info.timeUntil.hours > 0 ? `${info.timeUntil.hours}h ` : ''}{info.timeUntil.minutes}min)
 </span>
 )}
 </div>
 )}

 {med.notes && (
 <p className="text-xs text-gray-400 text-gray-400 mt-1 italic">{med.notes}</p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1 ml-2 flex-shrink-0">
 <button
 onClick={() => handleToggle(med.id)}
 className={`p-2 rounded-xl transition-all ${
 med.enabled
 ? 'text-emerald-500 hover:bg-emerald-50 hover:bg-emerald-900/30'
 : 'text-gray-300 text-gray-400 hover:bg-gray-700'
 }`}
 title={med.enabled ? 'Desactivar alarma' : 'Activar alarma'}
 >
 {med.enabled ? <Bell className="w-4 h-4"/> : <BellOff className="w-4 h-4"/>}
 </button>
 <button
 onClick={() => setExpandedId(isExpanded ? null : med.id)}
 className="p-2 rounded-xl text-gray-300 text-gray-400 hover:text-gray-500 hover:bg-gray-700 transition-all"
 title="Ver más"
 >
 {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
 </button>
 <button
 onClick={() => handleDelete(med.id)}
 className="p-2 rounded-xl text-gray-300 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:bg-red-900/30 transition-all"
 title="Eliminar"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 </div>

 {/* Expanded info */}
 {isExpanded && med.enabled && info?.timeUntil && (
 <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="bg-gray-50 bg-gray-700/50 rounded-xl p-3 text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Dosis</p>
 <p className="text-sm font-bold text-gray-300 text-gray-100 mt-1">{med.dosage}</p>
 </div>
 <div className="bg-gray-50 bg-gray-700/50 rounded-xl p-3 text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Frecuencia</p>
 <p className="text-sm font-bold text-gray-300 text-gray-100 mt-1">Cada {med.frequencyHours}h</p>
 </div>
 <div className="bg-gray-50 bg-gray-700/50 rounded-xl p-3 text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Inicio</p>
 <p className="text-sm font-bold text-gray-300 text-gray-100 mt-1">{med.startTime}</p>
 </div>
 <div className="bg-gray-50 bg-gray-700/50 rounded-xl p-3 text-center">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">Próxima</p>
 <p className="text-sm font-bold text-emerald-400 mt-1">
 {formatDoseTime(info.nextTime!)}
 </p>
 </div>
 {/* Schedule grid */}
 <div className="col-span-2 sm:col-span-4 bg-gray-700/50 rounded-xl p-3">
 <p className="text-[10px] font-semibold text-gray-400 text-gray-400 uppercase tracking-wider mb-2">
 Horario de dosis siguientes
 </p>
 <div className="flex flex-wrap gap-1.5">
 {Array.from({ length: Math.min(8, Math.ceil(24 / med.frequencyHours)) }, (_, i) => {
 const [h, m] = med.startTime.split(':').map(Number);
 const doseDate = new Date();
 doseDate.setHours(h + i * med.frequencyHours, m, 0, 0);
 const isPast = doseDate < new Date();
 return (
 <span
 key={i}
 className={`text-xs font-medium px-2 py-1 rounded-lg ${
 isPast
 ? 'bg-gray-200 bg-gray-600 text-gray-400 text-gray-400 line-through'
 : 'bg-emerald-100 bg-emerald-900/40 text-emerald-300'
 }`}
 >
 {formatDoseTime(doseDate)}
 </span>
 );
 })}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Info */}
 <div className="bg-blue-900/30 border border-blue-700 border-blue-800 rounded-2xl p-4">
 <div className="flex items-start gap-3">
 <Activity className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"/>
 <div>
 <p className="text-sm font-semibold text-blue-300">¿Cómo funcionan las alarmas?</p>
 <p className="text-xs text-blue-400 mt-1">
 Las alarmas se verifican cada 30 segundos. Cuando varios medicamentos coinciden en la misma hora,
 recibirás una sola notificación combinada. Las notificaciones se muestran aunque la app esté en segundo plano
 (si está instalada como PWA). Mantén la app abierta o instalada para recibir las alarmas.
 </p>
 </div>
 </div>
 </div>
 </div>
 </PullToRefresh>
 );
}
