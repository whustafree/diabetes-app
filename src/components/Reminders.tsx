import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Clock, PlusCircle, Trash2, Save, CalendarDays, Activity, Cloud, CloudOff, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';
import type { Reminder, ReminderType } from '../types';
import { reminderTypeLabels, reminderTypeIcons } from '../types';
import { generateId } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { saveRemindersToCloud, loadRemindersFromCloud } from '../utils/reminderSync';
import { requestNotificationPermission, saveTokenToFirestore } from '../utils/notifications';
import { addScheduledNotification, removeScheduledNotification } from '../utils/notificationScheduler';

const STORAGE_KEY = 'diabetes-app-reminders';

function loadReminders(): Reminder[] {
 try {
 const data = localStorage.getItem(STORAGE_KEY);
 return data ? JSON.parse(data) : getDefaultReminders();
 } catch {
 return getDefaultReminders();
 }
}

function saveReminders(reminders: Reminder[]): void {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function getDefaultReminders(): Reminder[] {
 return [
 {
 id: 'default-1',
 type: 'glucose',
 title: 'Medición de glucosa en ayunas',
 description: 'Mide tu glucosa antes del desayuno',
 time: '08:00',
 days: [1, 2, 3, 4, 5, 6, 0],
 enabled: true,
 soundEnabled: true,
 createdAt: new Date().toISOString(),
 },
 {
 id: 'default-2',
 type: 'medication',
 title: 'Tomar medicación matutina',
 description: 'Toma tus medicamentos recetados',
 time: '08:30',
 days: [1, 2, 3, 4, 5, 6, 0],
 enabled: true,
 soundEnabled: true,
 createdAt: new Date().toISOString(),
 },
 {
 id: 'default-3',
 type: 'meal',
 title: 'Hora del desayuno',
 description: 'No olvides desayunar saludable',
 time: '09:00',
 days: [1, 2, 3, 4, 5, 6, 0],
 enabled: true,
 soundEnabled: true,
 createdAt: new Date().toISOString(),
 },
 {
 id: 'default-4',
 type: 'glucose',
 title: 'Medición post-comida',
 description: 'Mide tu glucosa 2 horas después de comer',
 time: '13:00',
 days: [1, 2, 3, 4, 5, 6, 0],
 enabled: true,
 soundEnabled: true,
 createdAt: new Date().toISOString(),
 },
 {
 id: 'default-5',
 type: 'water',
 title: 'Recordatorio de agua',
 description: 'Bebe un vaso de agua',
 time: '11:00',
 days: [1, 2, 3, 4, 5, 6, 0],
 enabled: true,
 soundEnabled: false,
 createdAt: new Date().toISOString(),
 },
 ];
}

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const typeColors: Record<ReminderType, string> = {
 glucose: 'bg-blue-900/30 border-blue-700 border-blue-800',
 medication: 'bg-red-900/30 border-red-700 border-red-800',
 meal: 'bg-green-900/30 border-green-700 border-green-800',
 exercise: 'bg-orange-900/30 border-orange-700 border-orange-800',
 water: 'bg-cyan-900/30 border-cyan-200 border-cyan-800',
 custom: 'bg-purple-900/30 border-purple-700 border-purple-800',
};

function requestBrowserPermission() {
 if ('Notification' in window && Notification.permission === 'default') {
 Notification.requestPermission();
 }
}

export default function Reminders() {
 const { user, firebaseReady } = useAuth();
 const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
 const [isAdding, setIsAdding] = useState(false);
 const [notificationGranted, setNotificationGranted] = useState(
 'Notification' in window && Notification.permission === 'granted'
 );
 const [pushEnabled, setPushEnabled] = useState(false);
 const [pushLoading, setPushLoading] = useState(false);
 const [pushError, setPushError] = useState('');
 const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
 const cloudInitDone = useRef(false);
 const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

 // New reminder form state
 const [newType, setNewType] = useState<ReminderType>('glucose');
 const [newTitle, setNewTitle] = useState('');
 const [newDesc, setNewDesc] = useState('');
 const [newTime, setNewTime] = useState('08:00');
 const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

 // Registrar recordatorios por defecto en el scheduler al montar
 useEffect(() => {
 requestBrowserPermission();
 // Verificar si ya hay push FCM activo
 const stored = localStorage.getItem('fcm-push-enabled');
 if (stored === 'true') setPushEnabled(true);

 // Registrar recordatorios activos en el scheduler (incluyendo default)
 const all = loadReminders();
 for (const r of all) {
 if (r.enabled) {
 addScheduledNotification({
 id: `reminder-${r.id}`,
 type: r.type,
 title: r.title,
 body: r.description,
 time: r.time,
 days: r.days,
 enabled: true,
 sourceId: r.id,
 });
 }
 }
 }, []);

 // Cloud sync: carga inicial desde Firebase
 useEffect(() => {
 if (!user || !firebaseReady) {
 cloudInitDone.current = true;
 setCloudStatus('offline');
 return;
 }
 setCloudStatus('syncing');
 loadRemindersFromCloud(user.uid).then(cloudData => {
 cloudInitDone.current = true;
 if (cloudData && cloudData.items.length > 0) {
 // Usar datos de la nube directamente (evita que defaults locales sobrescriban)
 setReminders(cloudData.items);
 localStorage.setItem('diabetes-app-reminders', JSON.stringify(cloudData.items));
 setCloudStatus('synced');
 } else if (reminders && reminders.length > 0) {
 // No hay datos en la nube, subir los locales
 saveRemindersToCloud(user.uid, reminders).then(ok => {
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
 }, [user, firebaseReady]);

 // Check reminders every minute
 const checkReminders = useCallback(() => {
 const now = new Date();
 const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
 const currentDay = now.getDay();

 for (const reminder of reminders) {
 if (!reminder.enabled) continue;
 if (!reminder.days.includes(currentDay)) continue;
 if (reminder.time !== currentTime) continue;

 // Send browser notification
 if ('Notification' in window && Notification.permission === 'granted') {
 const notif = new Notification(reminder.title, {
 body: reminder.description || 'Recordatorio de Diabetes Control',
 icon: '/vite.svg',
 tag: reminder.id,
 });
 if (reminder.soundEnabled) {
 // Simple beep using AudioContext
 try {
 const ctx = new AudioContext();
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.frequency.value = 800;
 gain.gain.value = 0.3;
 osc.start();
 osc.stop(ctx.currentTime + 0.15);
 } catch {}
 }
 setTimeout(() => notif.close(), 5000);
 }
 }
 }, [reminders]);

 useEffect(() => {
 const interval = setInterval(checkReminders, 30000); // Check every 30s
 return () => clearInterval(interval);
 }, [checkReminders]);

 // Cloud sync: sincronización automática ante cambios (debounced 1.5s)
 useEffect(() => {
 if (!cloudInitDone.current || !user || !firebaseReady) return;
 if (syncTimer.current) clearTimeout(syncTimer.current);
 syncTimer.current = setTimeout(() => {
 setCloudStatus('syncing');
 saveRemindersToCloud(user.uid, reminders).then(ok => {
 setCloudStatus(ok ? 'synced' : 'offline');
 });
 }, 1500);
 return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
 }, [reminders, user, firebaseReady]);

 const handleToggle = (id: string) => {
 const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
 setReminders(updated);
 saveReminders(updated);
 // Actualizar scheduler
 const reminder = updated.find(r => r.id === id);
 if (reminder) {
 removeScheduledNotification(`reminder-${id}`);
 if (reminder.enabled) {
 addScheduledNotification({
 id: `reminder-${id}`,
 type: reminder.type,
 title: reminder.title,
 body: reminder.description,
 time: reminder.time,
 days: reminder.days,
 enabled: true,
 sourceId: id,
 });
 }
 }
 };

 const handleDelete = (id: string) => {
 const updated = reminders.filter(r => r.id !== id);
 setReminders(updated);
 saveReminders(updated);
 removeScheduledNotification(`reminder-${id}`);
 };

 const handleAdd = () => {
 if (!newTitle.trim()) return;
 const reminder: Reminder = {
 id: generateId(),
 type: newType,
 title: newTitle.trim(),
 description: newDesc.trim() || undefined,
 time: newTime,
 days: newDays,
 enabled: true,
 soundEnabled: true,
 createdAt: new Date().toISOString(),
 };
 const updated = [...reminders, reminder];
 setReminders(updated);
 saveReminders(updated);

 // Programar notificación local
 addScheduledNotification({
 id: `reminder-${reminder.id}`,
 type: reminder.type,
 title: reminder.title,
 body: reminder.description,
 time: reminder.time,
 days: reminder.days,
 enabled: true,
 sourceId: reminder.id,
 });

 setIsAdding(false);
 setNewTitle('');
 setNewDesc('');
 setNewType('glucose');
 setNewTime('08:00');
 setNewDays([1, 2, 3, 4, 5, 6, 0]);
 };

 const handlePermissionRequest = () => {
 requestBrowserPermission();
 setNotificationGranted(Notification.permission === 'granted');
 };

 const handleEnablePush = async () => {
 if (!user) {
 setPushError('Debes iniciar sesión para activar notificaciones push');
 return;
 }
 setPushLoading(true);
 setPushError('');
 try {
 const token = await requestNotificationPermission();
 if (token) {
 await saveTokenToFirestore(user.uid, token);
 setPushEnabled(true);
 localStorage.setItem('fcm-push-enabled', 'true');
 } else {
 setPushError('No se pudo obtener el permiso. Revisa la configuración de tu navegador.');
 }
 } catch (err) {
 setPushError('Error al activar notificaciones push: ' + (err instanceof Error ? err.message : 'desconocido'));
 }
 setPushLoading(false);
 };

 const handleDisablePush = () => {
 setPushEnabled(false);
 setPushError('');
 localStorage.setItem('fcm-push-enabled', 'false');
 };

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Header */}
 <div className="text-center">
 <div className="flex items-center justify-center gap-3 mb-2">
 <Bell className="w-7 h-7 text-purple-600"/>
 <h2 className="text-2xl font-extrabold text-white">Recordatorios</h2>
 </div>
 <p className="text-gray-400 text-gray-400 text-sm">Nunca olvides medir tu glucosa o tomar tus medicamentos</p>

 {/* Cloud sync status */}
 {cloudStatus !== 'idle' && (
 <div className="mt-2 flex items-center justify-center gap-1.5">
 {cloudStatus === 'syncing' && (
 <>
 <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin"/>
 <span className="text-xs text-blue-400 font-medium">Sincronizando...</span>
 </>
 )}
 {cloudStatus === 'synced' && (
 <>
 <Cloud className="w-3.5 h-3.5 text-green-500"/>
 <span className="text-xs text-green-400 font-medium">Sincronizado con la nube</span>
 </>
 )}
 {cloudStatus === 'offline' && (
 <>
 <CloudOff className="w-3.5 h-3.5 text-gray-400"/>
 <span className="text-xs text-gray-400 font-medium">Solo datos locales</span>
 </>
 )}
 </div>
 )}
 </div>

 {/* Push Notifications Section */}
 {firebaseReady && user && (
 <div className={`rounded-2xl p-4 border transition-all ${
 pushEnabled
 ? 'bg-green-900/20 border-green-700 border-green-800'
 : 'bg-yellow-900/20 border-yellow-700 border-yellow-800'
 }`}>
 <div className="flex items-start gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
 pushEnabled ? 'bg-green-100 bg-green-900/40' : 'bg-yellow-100 bg-yellow-900/40'
 }`}>
 {pushEnabled
 ? <CheckCircle2 className="w-5 h-5 text-green-400"/>
 : <Smartphone className="w-5 h-5 text-yellow-400"/>
 }
 </div>
 <div className="flex-1">
 <p className="text-sm font-semibold text-white">
 {pushEnabled ? 'Notificaciones push activadas' : 'Notificaciones push'}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">
 {pushEnabled
 ? 'Recibirás notificaciones incluso cuando la app esté cerrada.'
 : 'Activa las notificaciones push para recibir alertas incluso con la app cerrada.'
 }
 </p>
 {pushError && (
 <p className="text-xs text-red-400 mt-1.5">{pushError}</p>
 )}
 <button
 onClick={pushEnabled ? handleDisablePush : handleEnablePush}
 disabled={pushLoading}
 className={`mt-3 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
 pushEnabled
 ? 'bg-red-900/30 text-red-400 hover:bg-red-200 hover:bg-red-900/50'
 : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl active:scale-[0.98]'
 }`}
 >
 {pushLoading ? (
 <span className="flex items-center gap-1.5">
 <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
 Activando...
 </span>
 ) : pushEnabled ? (
 'Desactivar push'
 ) : (
 'Activar notificaciones push'
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Browser Notification Permission */}
 {!notificationGranted && 'Notification' in window && Notification.permission !== 'denied' && (
 <div className="bg-yellow-900/30 border border-yellow-700 border-yellow-800 rounded-2xl p-4 flex items-start gap-3">
 <BellOff className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
 <div className="flex-1">
 <p className="text-sm font-semibold text-yellow-300">Notificaciones del navegador desactivadas</p>
 <p className="text-xs text-yellow-400 mt-1">Activa las notificaciones del navegador para recibir recordatorios en tu dispositivo.</p>
 </div>
 <button
 onClick={handlePermissionRequest}
 className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-xs font-semibold hover:bg-yellow-600 transition"
 >
 Activar
 </button>
 </div>
 )}

 {/* Add Button */}
 <button
 onClick={() => setIsAdding(!isAdding)}
 className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 ${
 isAdding
 ? 'bg-gray-700 text-gray-300'
 : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 hover:shadow-xl active:scale-[0.98]'
 }`}
 >
 <PlusCircle className="w-5 h-5"/>
 {isAdding ? 'Cancelar' : 'Nuevo Recordatorio'}
 </button>

 {/* Add Form */}
 {isAdding && (
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700 space-y-4">
 <h3 className="font-bold text-white">Nuevo Recordatorio</h3>

 {/* Type selector */}
 <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
 {(Object.entries(reminderTypeLabels) as [ReminderType, string][]).map(([key, label]) => (
 <button
 key={key}
 onClick={() => { setNewType(key); if (!newTitle) setNewTitle(label); }}
 className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
 newType === key
 ? 'bg-purple-100 bg-purple-900/50 text-purple-300 ring-1 ring-purple-300'
 : 'bg-gray-50 bg-gray-700 text-gray-400 hover:bg-gray-700 hover:bg-gray-600 border border-gray-700 border-gray-600'
 }`}
 >
 {reminderTypeIcons[key]} {label}
 </button>
 ))}
 </div>

 <input
 type="text"
 value={newTitle}
 onChange={e => setNewTitle(e.target.value)}
 placeholder="Título del recordatorio"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
 />

 <input
 type="text"
 value={newDesc}
 onChange={e => setNewDesc(e.target.value)}
 placeholder="Descripción (opcional)"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
 />

 <div className="flex items-center gap-4">
 <div className="flex-1">
 <label className="block text-xs font-semibold text-gray-400 mb-1">Hora</label>
 <input
 type="time"
 value={newTime}
 onChange={e => setNewTime(e.target.value)}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
 />
 </div>
 </div>

 {/* Days selector */}
 <div>
 <label className="block text-xs font-semibold text-gray-400 mb-1.5">Repetir</label>
 <div className="flex gap-1.5">
 {dayLabels.map((label, i) => (
 <button
 key={i}
 onClick={() => setNewDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
 className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${
 newDays.includes(i)
 ? 'bg-purple-100 bg-purple-900/50 text-purple-300'
 : 'bg-gray-50 bg-gray-700 text-gray-400 text-gray-400 hover:bg-gray-700 hover:bg-gray-600'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>

 <button
 onClick={handleAdd}
 disabled={!newTitle.trim()}
 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
 >
 <Save className="w-5 h-5"/>
 Guardar Recordatorio
 </button>
 </div>
 )}

 {/* Reminder List */}
 <div className="space-y-3">
 {reminders.length === 0 ? (
 <div className="text-center py-10">
 <Bell className="w-12 h-12 text-gray-300 text-gray-400 mx-auto mb-3"/>
 <p className="text-gray-400 text-gray-400 font-medium">No hay recordatorios</p>
 </div>
 ) : (
 reminders.map(reminder => (
 <div
 key={reminder.id}
 className={`rounded-2xl p-4 border transition-all ${typeColors[reminder.type]} ${
 reminder.enabled ? 'opacity-100' : 'opacity-50'
 }`}
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3 flex-1">
 <span className="text-xl mt-0.5">{reminderTypeIcons[reminder.type]}</span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className={`font-bold text-sm ${reminder.enabled ? 'text-gray-800 text-white' : 'text-gray-400 text-gray-500'}`}>
 {reminder.title}
 </h4>
 <span className="text-xs font-medium text-gray-400 text-gray-400 bg-gray-800 bg-gray-700 px-2 py-0.5 rounded-full">
 {reminder.time}
 </span>
 </div>
 {reminder.description && (
 <p className="text-xs text-gray-400 mt-0.5">{reminder.description}</p>
 )}
 <div className="flex gap-1 mt-1.5">
 {reminder.days.sort().map(d => (
 <span key={d} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
 reminder.enabled
 ? 'bg-gray-700 text-gray-400'
 : 'bg-gray-700 text-gray-300 text-gray-600'
 }`}>
 {dayLabels[d]}
 </span>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-1 ml-2">
 <button
 onClick={() => handleToggle(reminder.id)}
 className={`p-2 rounded-xl transition-all ${
 reminder.enabled
 ? 'text-purple-500 hover:bg-purple-50 hover:bg-purple-900/30'
 : 'text-gray-300 text-gray-400 hover:bg-gray-700'
 }`}
 title={reminder.enabled ? 'Desactivar' : 'Activar'}
 >
 {reminder.enabled ? <Bell className="w-4 h-4"/> : <BellOff className="w-4 h-4"/>}
 </button>
 <button
 onClick={() => handleDelete(reminder.id)}
 className="p-2 rounded-xl text-gray-300 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:bg-red-900/30 transition-all"
 title="Eliminar"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Info */}
 <div className="bg-blue-900/30 border border-blue-700 border-blue-800 rounded-2xl p-4">
 <div className="flex items-start gap-3">
 <Activity className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"/>
 <div>
 <p className="text-sm font-semibold text-blue-300">¿Cómo funcionan los recordatorios?</p>
 <p className="text-xs text-blue-400 mt-1">
 Los recordatorios se verifican cada 30 segundos mientras la app está abierta.
 Recibirás una notificación del navegador cuando sea hora. Asegúrate de mantener la app abierta o instalada como PWA.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
