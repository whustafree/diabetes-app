import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { User, Ruler, Weight, Cake, Activity, Heart, AlertTriangle, Target, Flame, Droplets, ChevronDown, ChevronUp, Save, Edit3, Cloud, CloudOff, RefreshCw, Trash2, AlertCircle, Lock, LogOut, DownloadCloud, UploadCloud } from 'lucide-react';
import PullToRefresh from './PullToRefresh';
import SkeletonLoader from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';
import type { UserProfile, HealthAssessment, Gender, ActivityLevel, DiabetesType } from '../types';
import { genderLabels, activityLabels, diabetesTypeLabels } from '../types';
import { saveProfile, loadProfile, assessHealth, bmiCategoryLabels, bmiCategoryColors, riskLevelLabels, riskLevelColors } from '../utils/health';
import { useAuth } from '../contexts/AuthContext';
import { saveProfileToCloud, loadProfileFromCloud } from '../utils/profileSync';
import { isFirebaseConfigured } from '../firebase/config';

export default function UserProfileSection() {
 const { user: authUser, firebaseReady: fbReady, deleteAccount, logout } = useAuth();
 const user = authUser;
 const firebaseReady = fbReady;
 const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
 const [editing, setEditing] = useState(!profile);
 const [form, setForm] = useState<UserProfile>(
 profile || {
 name: '',
 age: 30,
 weight: 70,
 height: 165,
 gender: 'male',
 activityLevel: 'sedentary',
 diabetesType: 'none',
 }
 );
 const [saved, setSaved] = useState(false);
 const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
 const [cloudError, setCloudError] = useState<string | null>(null);
 const [cloudSyncing, setCloudSyncing] = useState(false);
 // Si el usuario está autenticado pero no hay perfil local, esperar sync cloud
 // initialSyncDone = true cuando ya sabemos que no hay perfil en la nube o ya se cargó
 const [initialSyncDone, setInitialSyncDone] = useState(
 !(user && firebaseReady) || !!profile
 );
 const cloudInitDone = useRef(false);
 const lastSyncedUid = useRef<string | undefined>(undefined);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [deletePassword, setDeletePassword] = useState('');
 const [deleteError, setDeleteError] = useState('');
 const [showProfileLogoutConfirm, setShowProfileLogoutConfirm] = useState(false);
 const profileLogoutRef = useRef<HTMLDivElement>(null);
 const [deleting, setDeleting] = useState(false);

 const assessment: HealthAssessment | null = useMemo(() => {
 if (!profile) return null;
 return assessHealth(profile);
 }, [profile]);

 // Cerrar dropdown de logout al hacer clic fuera
 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (profileLogoutRef.current && !profileLogoutRef.current.contains(e.target as Node)) {
 setShowProfileLogoutConfirm(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Función para sincronizar perfil desde la nube (reutilizable)
 const syncProfileFromCloud = useCallback(async () => {
 if (!user || !firebaseReady) return false;
 setCloudSyncing(true);
 setCloudError(null);
 try {
 const cloudProfile = await loadProfileFromCloud(user.uid);
 if (cloudProfile) {
 setProfile(cloudProfile);
 setForm(cloudProfile);
 setEditing(false);
 saveProfile(cloudProfile);
 setCloudStatus('synced');
 setCloudError(null);
 return true;
 } else {
 setCloudStatus('idle');
 setCloudError('No se encontró un perfil en la nube con este usuario. ¿Creaste tu perfil desde otro dispositivo?' +
 ' Asegúrate de haber guardado el perfil (botón"Crear Perfil") en el otro dispositivo para que se suba a la nube.');
 return false;
 }
 } catch (err: any) {
 setCloudStatus('offline');
 setCloudError(`Error de conexión: ${err?.message || 'No se pudo conectar con Firebase. Verifica tu conexión a internet.'}`);
 return false;
 } finally {
 setCloudSyncing(false);
 setInitialSyncDone(true);
 }
 }, [user?.uid, firebaseReady]);

 // Cloud sync: carga inicial desde Firebase
 useEffect(() => {
 if (!user || !firebaseReady) {
 cloudInitDone.current = true;
 lastSyncedUid.current = undefined;
 setCloudStatus('offline');
 setInitialSyncDone(true);
 return;
 }

 // Si el uid cambió (otro usuario), resetear el flag de inicialización
 if (lastSyncedUid.current !== user.uid) {
 cloudInitDone.current = false;
 lastSyncedUid.current = user.uid;
 }
 // Evitar doble ejecución (StrictMode o re-montaje)
 if (cloudInitDone.current) return;

 setCloudStatus('syncing');
 loadProfileFromCloud(user.uid).then(cloudProfile => {
 cloudInitDone.current = true;
 if (cloudProfile) {
 setProfile(cloudProfile);
 setForm(cloudProfile);
 setEditing(false);
 saveProfile(cloudProfile);
 setCloudStatus('synced');
 } else if (profile) {
 saveProfileToCloud(user.uid, profile).then(ok => {
 setCloudStatus(ok ? 'synced' : 'offline');
 if (!ok) setCloudError('No se pudo guardar tu perfil en la nube. Revisa las reglas de Firestore o tu conexión.');
 });
 } else {
 setCloudStatus('idle');
 }
 setInitialSyncDone(true);
 }).catch((err: any) => {
 cloudInitDone.current = true;
 setCloudStatus('offline');
 setCloudError(`Error al sincronizar: ${err?.message || 'No se pudo conectar con Firebase.'}`);
 setInitialSyncDone(true);
 });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.uid, firebaseReady]);

 const handleSave = () => {
 setCloudError(null);
 saveProfile(form);
 setProfile(form);
 setEditing(false);
 setSaved(true);
 setCloudStatus('syncing');
 if (user && firebaseReady) {
 saveProfileToCloud(user.uid, form).then(ok => {
 setCloudStatus(ok ? 'synced' : 'offline');
 if (!ok) setCloudError('No se pudo guardar el perfil en la nube. Los datos se guardaron localmente.');
 });
 }
 setTimeout(() => setSaved(false), 2000);
 };

 const handleEdit = () => {
 setCloudError(null);
 setForm(profile!);
 setEditing(true);
 };

 const handleDeleteAccount = async () => {
 if (!deletePassword) {
 setDeleteError('Ingresa tu contraseña para confirmar');
 return;
 }
 setDeleteError('');
 setDeleting(true);
 try {
 await deleteAccount(deletePassword);
 // La redirección ocurre automáticamente cuando el usuario es eliminado
 // El estado de auth cambia y la UI se actualiza sola
 } catch (err: any) {
 const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
 ? 'Contraseña incorrecta'
 : err.code === 'auth/requires-recent-login'
 ? 'Por seguridad, cierra sesión y vuelve a iniciarla antes de eliminar tu cuenta'
 : err.message || 'Error al eliminar la cuenta';
 setDeleteError(msg);
 } finally {
 setDeleting(false);
 }
 };

 // Función para subir perfil a la nube (reutilizable)
 const syncProfileToCloud = useCallback(async () => {
 if (!user || !firebaseReady || !profile) return false;
 setCloudStatus('syncing');
 setCloudError(null);
 try {
 const ok = await saveProfileToCloud(user.uid, profile);
 if (!ok) {
 setCloudStatus('offline');
 setCloudError('No se pudo guardar el perfil en la nube. Revisa las reglas de Firestore o tu conexión.');
 return false;
 }
 setCloudStatus('synced');
 return true;
 } catch (err: any) {
 setCloudStatus('offline');
 setCloudError(`Error al subir: ${err?.message || 'No se pudo conectar con Firebase.'}`);
 return false;
 }
 }, [user?.uid, firebaseReady, profile]);  // ─── LOADING (mientras se sincroniza desde la nube) ───

  if (!initialSyncDone) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
        <SkeletonLoader variant="profile-header" />
        <SkeletonLoader variant="stats-grid" />
        <SkeletonLoader variant="card" count={4} />
        <SkeletonLoader variant="form" />
      </div>
    );
  }

 // ─── FORMULARIO ───

 if (editing) {
 return (
 <div className="max-w-2xl mx-auto">
 <div className="bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-700">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-2.5 rounded-xl bg-blue-100 bg-blue-900/40">
 <User className="w-5 h-5 text-blue-400"/>
 </div>
 <div>
 <h2 className="text-xl font-bold text-white">
 {profile ? 'Editar Perfil' : 'Tu Perfil'}
 </h2>
 <p className="text-sm text-gray-400 text-gray-500">Completa tus datos para obtener evaluación de salud</p>
 </div>
 </div>

 {/* Cloud sync error banner */}
 {cloudError && (
 <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700 border-yellow-800 flex items-start gap-3 mb-2">
 <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-yellow-800 text-yellow-300">Problema de sincronización</p>
 <p className="text-xs text-yellow-300 text-yellow-400 mt-1">{cloudError}</p>
 </div>
 </div>
 )}

 {/* Sync from cloud button - only show when creating profile (no local profile) */}
 {user && firebaseReady && !profile && (
 <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700 border-blue-800 flex items-start gap-3 mb-2">
 <DownloadCloud className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"/>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-blue-200 text-blue-300">¿Ya tienes un perfil en otro dispositivo?</p>
 <p className="text-xs text-blue-300 text-blue-400 mt-1">
 Si ya creaste tu perfil desde otro dispositivo (computadora, otro celular),
 puedes sincronizarlo desde la nube en lugar de crear uno nuevo.
 </p>
 <button
 onClick={syncProfileFromCloud}
 disabled={cloudSyncing}
 className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
 >
 {cloudSyncing ? (
 <><RefreshCw className="w-4 h-4 animate-spin"/> Sincronizando...</>
 ) : (
 <><DownloadCloud className="w-4 h-4"/> Sincronizar desde la nube</>
 )}
 </button>
 </div>
 </div>
 )}

 <div className="space-y-5">
 {/* Name */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <User className="w-4 h-4"/>
 Nombre
 </label>
 <input
 type="text"
 value={form.name}
 onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 placeholder="Tu nombre"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 {/* Age */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Cake className="w-4 h-4"/>
 Edad
 </label>
 <input
 type="number"
 value={form.age || ''}
 onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 0 }))}
 min={10}
 max={120}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>

 {/* Gender */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <User className="w-4 h-4"/>
 Género
 </label>
 <div className="flex gap-2">
 {(Object.entries(genderLabels) as [Gender, string][]).map(([key, label]) => (
 <button
 key={key}
 type="button"
 onClick={() => setForm(f => ({ ...f, gender: key }))}
 className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
 form.gender === key
 ? 'bg-blue-100 bg-blue-900/40 text-blue-300 ring-1 ring-blue-300'
 : 'bg-gray-50 bg-gray-700 text-gray-300 hover:bg-gray-700 hover:bg-gray-600 border border-gray-700 border-gray-600'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 {/* Weight */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Weight className="w-4 h-4"/>
 Peso (kg)
 </label>
 <input
 type="number"
 value={form.weight || ''}
 onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))}
 min={20}
 max={300}
 step={0.1}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>

 {/* Height */}
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Ruler className="w-4 h-4"/>
 Altura (cm)
 </label>
 <input
 type="number"
 value={form.height || ''}
 onChange={e => setForm(f => ({ ...f, height: parseFloat(e.target.value) || 0 }))}
 min={100}
 max={250}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>
 </div>

 {/* Activity Level */}
 <div> <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Activity className="w-4 h-4"/>
 Nivel de Actividad
 </label>
 <select
 value={form.activityLevel}
 onChange={e => setForm(f => ({ ...f, activityLevel: e.target.value as ActivityLevel }))}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
 >
 {(Object.entries(activityLabels) as [ActivityLevel, string][]).map(([key, label]) => (
 <option key={key} value={key}>{label}</option>
 ))}
 </select>
 </div>

 {/* Diabetes Type */}
 <div> <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Heart className="w-4 h-4"/>
 Condición de Diabetes
 </label>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {(Object.entries(diabetesTypeLabels) as [DiabetesType, string][]).map(([key, label]) => (
 <button
 key={key}
 type="button"
 onClick={() => setForm(f => ({ ...f, diabetesType: key }))}
 className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
 form.diabetesType === key
 ? 'bg-blue-100 bg-blue-900/40 text-blue-300 ring-1 ring-blue-300'
 : 'bg-gray-50 bg-gray-700 text-gray-300 hover:bg-gray-700 hover:bg-gray-600 border border-gray-700 border-gray-600'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>

 {/* Target Weight */}
 <div> <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Target className="w-4 h-4"/>
 Peso deseado (kg) <span className="text-gray-400 text-gray-400 font-normal">- opcional</span>
 </label>
 <input
 type="number"
 value={form.targetWeight || ''}
 onChange={e => setForm(f => ({ ...f, targetWeight: parseFloat(e.target.value) || undefined }))}
 min={20}
 max={300}
 step={0.1}
 placeholder="¿Cuánto te gustaría pesar?"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>

 {/* Medications */}
 <div> <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Activity className="w-4 h-4"/>
 Medicamentos <span className="text-gray-400 text-gray-400 font-normal">- opcional</span>
 </label>
 <input
 type="text"
 value={form.medications || ''}
 onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
 placeholder="Ej: Metformina 500mg, Insulina..."
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 />
 </div>

 <button
 onClick={handleSave}
 disabled={!form.name || !form.age || !form.weight || !form.height}
 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/50 hover:shadow-xl active:scale-[0.98]"
 >
 <Save className="w-5 h-5"/>
 {profile ? 'Guardar Cambios' : 'Crear Perfil'}
 </button>
 </div>
 </div>
 </div>
 );
 } // ─── VISTA DEL PERFIL ───

  if (!profile || !assessment) return null;

  return (
 <PullToRefresh onRefresh={syncProfileFromCloud}>
 <div className="max-w-4xl mx-auto space-y-6">
 {/* Profile Header */}
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-900/50 shadow-blue-800/50">
 {profile.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <h2 className="text-xl font-bold text-white">{profile.name}</h2>
 <p className="text-sm text-gray-400 text-gray-500">
 {profile.age} años · {profile.weight} kg · {profile.height} cm · {genderLabels[profile.gender]}
 </p>
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 bg-blue-900/40 text-blue-400 mt-1">
 {diabetesTypeLabels[profile.diabetesType]}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {/* Cloud sync status */}
 {cloudStatus === 'syncing' && <span title="Sincronizando..."><RefreshCw className="w-4 h-4 text-blue-400 animate-spin"/></span>}
 {cloudStatus === 'synced' && <span title="Sincronizado con la nube"><Cloud className="w-4 h-4 text-green-500"/></span>}
 {cloudStatus === 'offline' && <span title="Solo datos locales"><CloudOff className="w-4 h-4 text-gray-400"/></span>}
 <button
 onClick={handleEdit}
 className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-blue-400 hover:text-blue-400 hover:bg-blue-50 hover:bg-blue-900/20 transition-all"
 >
 <Edit3 className="w-4 h-4"/>
 Editar
 </button>
 {firebaseReady && user && (
 <div className="relative"ref={profileLogoutRef}>
 <button
 onClick={() => setShowProfileLogoutConfirm(true)}
 className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 hover:bg-red-900/20 transition-all"
 title="Cerrar sesión"
 >
 <LogOut className="w-4 h-4"/>
 </button>

 {/* Confirmación de cierre de sesión inline */}
 {showProfileLogoutConfirm && (
 <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
 <p className="text-sm font-semibold text-white mb-1">¿Cerrar sesión?</p>
 <p className="text-xs text-gray-400 text-gray-400 mb-3">Tus datos locales se conservarán.</p>
 <div className="flex gap-2">
 <button
 onClick={() => setShowProfileLogoutConfirm(false)}
 className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-700 text-gray-300 hover:bg-gray-200 hover:bg-gray-600 transition-all"
 >
 Cancelar
 </button>
 <button
 onClick={() => { logout(); }}
 className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all"
 >
 Salir
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Cloud sync error banner - also visible in profile view */}
 {cloudError && (
 <div className="mt-4 p-4 rounded-xl bg-yellow-900/20 border border-yellow-700 border-yellow-800 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"/>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-yellow-800 text-yellow-300">Problema de sincronización con la nube</p>
 <p className="text-xs text-yellow-300 text-yellow-400 mt-1">{cloudError}</p>
 <button
 onClick={syncProfileToCloud}
 disabled={cloudStatus === 'syncing'}
 className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-all"
 >
 {cloudStatus === 'syncing' ? (
 <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Subiendo...</>
 ) : (
 <><UploadCloud className="w-3.5 h-3.5"/> Reintentar subir a la nube</>
 )}
 </button>
 </div>
 </div>
 )}

 {/* Manual upload button when not synced */}
 {user && firebaseReady && cloudStatus !== 'synced' && !cloudError && (
 <div className="mt-4 p-3 rounded-xl bg-blue-900/20 border border-blue-700 border-blue-800 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CloudOff className="w-4 h-4 text-blue-400"/>
 <p className="text-xs font-medium text-blue-300">Perfil solo guardado localmente</p>
 </div>
 <button
 onClick={syncProfileToCloud}
 disabled={cloudStatus === 'syncing'}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
 >
 {cloudStatus === 'syncing' ? (
 <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Subiendo...</>
 ) : (
 <><UploadCloud className="w-3.5 h-3.5"/> Subir a la nube</>
 )}
 </button>
 </div>
 )}
 </div>

 {/* Health Metrics Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 {
 label: 'IMC',
 value: assessment.bmi,
 sub: bmiCategoryLabels[assessment.bmiCategory],
 color: bmiCategoryColors[assessment.bmiCategory].split(' ')[0],
 bg: bmiCategoryColors[assessment.bmiCategory].split(' ')[1],
 icon: '📊',
 },
 {
 label: 'Grasa Corporal',
 value: `${assessment.bodyFatPercentage}%`,
 sub: assessment.bodyFatCategory,    color: 'text-purple-400',
    bg: 'bg-purple-900/30',
 icon: '🔬',
 },
 {
 label: 'Tasa Metabólica',
 value: `${assessment.bmr} kcal`,
 sub: 'BMR (basal)',    color: 'text-orange-400',
    bg: 'bg-orange-900/30',
 icon: '🔥',
 },
 {
 label: 'Gasto Calórico',
 value: `${assessment.tdee} kcal`,
 sub: 'TDEE (total)',    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
 icon: '⚡',
 }, ].map(card => (
 <div key={card.label} className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700 hover:shadow-md transition-all">
 <div className="flex items-start justify-between mb-2">
 <span className="text-xs font-semibold text-gray-400 text-gray-400 uppercase tracking-wider">{card.label}</span>
 <span className="text-lg">{card.icon}</span>
 </div>
 <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
 <div className="text-xs text-gray-400 text-gray-400 mt-1">{card.sub}</div>
 </div>
 ))}
 </div>

 {/* Risk Level Banner */}
 <div className={`rounded-2xl p-5 border ${riskLevelColors[assessment.riskLevel]}`}>
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-6 h-6 mt-0.5 flex-shrink-0"/>
 <div>
 <h3 className="font-bold text-white mb-1">
 Nivel de Riesgo: {riskLevelLabels[assessment.riskLevel]}
 </h3>
 <p className="text-sm text-gray-400">
 Basado en tu IMC, edad, condición de diabetes y porcentaje de grasa corporal.
 </p>
 </div>
 </div>
 </div>

 {/* Health Risks */}
 {assessment.healthRisks.length > 0 && (
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Heart className="w-5 h-5 text-red-500"/>
 Evaluación de Riesgos
 </h3>
 <div className="space-y-3">
 {assessment.healthRisks.map((risk, i) => (
 <div key={i} className={`p-4 rounded-xl border ${
 risk.risk === 'alto' || risk.risk === 'muy_alto'          ? 'bg-red-900/30 border-red-800'
          : 'bg-yellow-900/30 border-yellow-800'
 }`}>
 <div className="flex items-center gap-2 mb-1">
 <span className={`font-bold text-sm ${          risk.risk === 'alto' || risk.risk === 'muy_alto' ? 'text-red-300' : 'text-yellow-300'
 }`}>
 {risk.condition}
 </span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${          risk.risk === 'alto' || risk.risk === 'muy_alto'
          ? 'bg-red-900/50 text-red-300'
          : 'bg-yellow-900/50 text-yellow-300'
 }`}>
 {riskLevelLabels[risk.risk]}
 </span>
 </div>
 <p className="text-sm text-gray-300 mb-2">{risk.description}</p>
 <p className="text-sm font-medium text-gray-300">
 <span className="text-blue-400">💡 Recomendación:</span> {risk.recommendation}
 </p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Targets */} <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
 <Target className="w-5 h-5 text-green-500"/>
 Tus Metas de Salud
 </h3>
 <div className="grid sm:grid-cols-2 gap-4">  <div className="p-4 rounded-xl bg-blue-900/30 border border-blue-800">
 <div className="text-sm font-semibold text-blue-300 mb-1">Peso ideal</div>  <div className="text-lg font-bold text-blue-200">
 {assessment.idealWeightRange.min} - {assessment.idealWeightRange.max} kg
 </div>
 <div className="text-xs text-blue-400 mt-1">
 {profile.weight > assessment.idealWeightRange.max
 ? `Debes perder ${Math.round(profile.weight - assessment.idealWeightRange.max)} kg`
 : profile.weight < assessment.idealWeightRange.min
 ? `Debes ganar ${Math.round(assessment.idealWeightRange.min - profile.weight)} kg`
 : '¡Estás en tu rango de peso ideal!'}
 </div>
 </div>  <div className="p-4 rounded-xl bg-purple-900/30 border border-purple-800">
 <div className="text-sm font-semibold text-purple-300 mb-1">% Grasa saludable</div>  <div className="text-lg font-bold text-purple-200">
 {assessment.healthyBodyFatRange.min}% - {assessment.healthyBodyFatRange.max}%
 </div>
 <div className="text-xs text-purple-400 mt-1">
 {assessment.bodyFatPercentage > assessment.healthyBodyFatRange.max
 ? `Debes reducir ${Math.round(assessment.bodyFatPercentage - assessment.healthyBodyFatRange.max)}% de grasa`
 : assessment.bodyFatPercentage < assessment.healthyBodyFatRange.min
 ? 'Tu grasa corporal está por debajo del rango saludable'
 : '¡Tu grasa corporal está en rango saludable!'}
 </div>
 </div>
 </div>
 </div>

 {/* Ideal weight progression */}
 {profile.targetWeight && profile.targetWeight < profile.weight && (
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
 <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
 <Flame className="w-5 h-5 text-orange-500"/>
 Progreso hacia tu meta
 </h3>
 <div className="space-y-3">
 <div className="flex items-center justify-between text-sm">
 <span className="text-gray-400">Actual: <strong>{profile.weight} kg</strong></span>
 <span className="text-gray-400">Meta: <strong>{profile.targetWeight} kg</strong></span>
 </div>
 <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
 <div
 className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
 style={{
 width: `${Math.min(
 ((profile.weight - profile.targetWeight) / (profile.weight - (profile.targetWeight || profile.weight - 5))) * 100,
 100
 )}%`,
 }}
 />
 </div>
 <p className="text-xs text-gray-400 text-gray-400 text-center">
 {Math.round(profile.weight - profile.targetWeight)} kg por perder para alcanzar tu meta
 </p>
 </div>
 </div>
 )}

 {/* Delete Account Section */}
 {firebaseReady && user && (
 <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 border-red-900/30">
 <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
 <Trash2 className="w-5 h-5"/>
 Zona de Peligro
 </h3>
 <p className="text-sm text-gray-400 mb-4">
 Eliminar tu cuenta borrará todos tus datos en la nube de forma permanente.
 Esta acción no se puede deshacer.
 </p>
 <button
 onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); setDeletePassword(''); }}
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-900/20 hover:bg-red-100 hover:bg-red-900/40 border border-red-700 border-red-800 transition-all"
 >
 <Trash2 className="w-4 h-4"/>
 Eliminar mi cuenta
 </button>
 </div>
 )}

 {/* Delete Confirmation Modal */}
 <ConfirmModal
 open={showDeleteConfirm}
 onClose={() => !deleting && setShowDeleteConfirm(false)}
 onConfirm={handleDeleteAccount}
 icon={AlertCircle}
 iconBgColor="bg-red-100 bg-red-900/40"
 iconColor="text-red-400"
 title="Eliminar Cuenta"
 description="Esta acción es irreversible"
 confirmLabel="Eliminar cuenta"
 confirmGradient="from-red-600 to-rose-600"
 loading={deleting}
 loadingLabel="Eliminando..."
 disabled={!deletePassword}
 >
 <div className="bg-red-900/20 rounded-xl p-4 mb-4 border border-red-700 border-red-800">
 <p className="text-sm text-red-300 font-medium">
 Se eliminará todo tu contenido en la nube:
 </p>
 <ul className="text-sm text-red-400 mt-2 space-y-1 list-disc list-inside">
 <li>Registros de glucosa</li>
 <li>Perfil y evaluación de salud</li>
 <li>Medicamentos y horarios</li>
 <li>Recordatorios personalizados</li>
 <li>Planes de comida y dieta</li>
 </ul>
 </div>
 <p className="text-sm text-gray-400 mb-4">
 Los datos locales en este dispositivo <strong>no se eliminarán</strong> automáticamente.
 Ingresa tu contraseña para confirmar.
 </p>
 {deleteError && (
 <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 border-red-800 flex items-start gap-2 mb-3">
 <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
 <p className="text-sm text-red-300">{deleteError}</p>
 </div>
 )}
 <div className="mb-4">
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Lock className="w-4 h-4"/> Contraseña
 </label>
 <input
 type="password"
 value={deletePassword}
 onChange={e => setDeletePassword(e.target.value)}
 placeholder="Tu contraseña actual"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 outline-none transition-all"
 disabled={deleting}
 onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
 autoFocus
 />
 </div>
 </ConfirmModal>

 {saved && (
 <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg font-semibold fade-in text-sm">
 ✅ Perfil guardado exitosamente
 </div>
 )}
 </div>
 </PullToRefresh>
 );
}
