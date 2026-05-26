import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Activity, User, Salad, Scale, Bell, Pill, Cloud, CloudOff, RefreshCw, LogOut, X, Loader2, BellRing, BellPlus, ChevronDown, Settings, Utensils } from 'lucide-react';
import PageTransition from './components/PageTransition';
import { useAuth } from './contexts/AuthContext';
import { saveProfile } from './utils/health';
import { loadProfileFromCloud } from './utils/profileSync';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ConfirmModal from './components/ConfirmModal';

// Carga diferida (lazy) de componentes grandes para optimizar el bundle inicial
const UserProfileSection = lazy(() => import('./components/UserProfile'));
const MealPlanner = lazy(() => import('./components/MealPlanner'));
const DietPlan = lazy(() => import('./components/DietPlan'));
const Reminders = lazy(() => import('./components/Reminders'));
const Medications = lazy(() => import('./components/Medications'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const FoodLog = lazy(() => import('./components/FoodLog'));
import NotificationsPage, { persistNotification, getUnreadCount, markAllNotificationsRead } from './components/NotificationsPage';
import { initPushNotifications, onForegroundMessage } from './utils/notifications';
import { initNotificationScheduler } from './utils/notificationScheduler';
import { addActivity } from './utils/activityLog';
import { useNetworkStatus } from './utils/networkStatus';

type Section = 'dashboard' | 'profile' | 'meals' | 'diet' | 'medications' | 'reminders' | 'notifications' | 'settings' | 'foodlog';

const navItems: { id: Section; label: string; icon: typeof Activity }[] = [
 { id: 'dashboard', label: 'Dashboard', icon: Activity },
 { id: 'profile', label: 'Perfil', icon: User },
 { id: 'meals', label: 'Comidas', icon: Salad },
 { id: 'diet', label: 'Dieta', icon: Scale },
 { id: 'medications', label: 'Medicamentos', icon: Pill },
 { id: 'reminders', label: 'Recordatorios', icon: Bell },
 { id: 'notifications', label: 'Notificaciones', icon: BellPlus },
 { id: 'foodlog', label: 'Registro', icon: Utensils },
];

export default function App() {
 const [section, setSection] = useState<Section>('dashboard');
 const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
 const [showUserMenu, setShowUserMenu] = useState(false);
 const [loggingOut, setLoggingOut] = useState(false);
 const [profileSyncKey, setProfileSyncKey] = useState(0);
 const [profileSyncStatus, setProfileSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
 const userMenuRef = useRef<HTMLDivElement>(null);
 const { user, loading, firebaseReady, logout } = useAuth();
 const { isOnline, pendingCount } = useNetworkStatus();

 // ─── SYNC PERFIL CON FIRESTORE ───
 useEffect(() => {
 if (!user || !firebaseReady) return;

 let cancelled = false;
 const retryTimer: { current: ReturnType<typeof setTimeout> | null } = { current: null };

 setProfileSyncStatus('syncing');
 loadProfileFromCloud(user.uid).then(cloudProfile => {
 if (cancelled) return;
 if (cloudProfile) {
 saveProfile(cloudProfile);
 setProfileSyncKey(prev => prev + 1);
 setProfileSyncStatus('synced');
 } else {
 setProfileSyncStatus('idle');
 }
 }).catch(() => {
 if (cancelled) return;
 setProfileSyncStatus('offline');
 // Reintentar después de 5 segundos
 retryTimer.current = setTimeout(() => {
 if (!cancelled) setProfileSyncStatus('idle');
 }, 5000);
 });

 return () => {
 cancelled = true;
 if (retryTimer.current) clearTimeout(retryTimer.current);
 };
 }, [user?.uid, firebaseReady]);

 // ─── NOTIFICACIONES PUSH ───
 const [notification, setNotification] = useState<{
 id: string;
 title: string;
 body?: string;
 type?: string;
 } | null>(null);
 const [unreadCount, setUnreadCount] = useState(0);
 const [showNotificationPanel, setShowNotificationPanel] = useState(false);
 const [notificationsHistory, setNotificationsHistory] = useState<
 { id: string; title: string; body?: string; type?: string; time: Date }[]
 >([]);

 useEffect(() => {
 if (!user || !firebaseReady) return;

 // Inicializar notificaciones push (solicitar permiso + token FCM)
 initPushNotifications(user.uid).catch(() => {});

 // Escuchar mensajes en foreground
 const unsub = onForegroundMessage((payload) => {
 const id = Date.now().toString();
 const data = { id, title: payload.title || '', body: payload.body, type: payload.data?.type };
 setNotification(data);
 setUnreadCount(prev => prev + 1);
 setNotificationsHistory(prev => [{ ...data, time: new Date() }, ...prev].slice(0, 10));

 // Persistir a localStorage para el centro de notificaciones
 persistNotification(data);

 // Badging API: el useEffect en unreadCount lo sincroniza automáticamente

 // Reproducir sonido
 try {
 const ctx = new AudioContext();
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.frequency.value = 523.25; // Do5
 gain.gain.setValueAtTime(0.2, ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
 osc.start();
 osc.stop(ctx.currentTime + 0.4);
 } catch {}

 setTimeout(() => setNotification(null), 5000);
 });

 // Inicializar scheduler de notificaciones locales
 const unsubScheduler = initNotificationScheduler();

 return () => {
 unsub();
 unsubScheduler();
 };
 }, [user?.uid, firebaseReady]);

 // Sincronizar Badging API con unreadCount
 useEffect(() => {
 try {
 if (unreadCount > 0) {
 (navigator as any).setAppBadge?.(unreadCount);
 } else {
 (navigator as any).clearAppBadge?.();
 }
 } catch {}
 }, [unreadCount]);

 const markAllRead = () => {
 setUnreadCount(0);
 markAllNotificationsRead();
 // Badging API: limpiar badge
 try { (navigator as any).clearAppBadge?.(); } catch {}
 };

 // Cerrar menú de usuario al hacer clic fuera
 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
 setShowUserMenu(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleLogout = async () => {
 setLoggingOut(true);
 try {
 addActivity({ type: 'logout', label: 'Cierre de sesión' });
 await logout();
 setShowLogoutConfirm(false);
 } catch {}
 setLoggingOut(false);
 };

 // ─── AUTH GATE ───
 // Si Firebase está configurado y el usuario NO está autenticado, mostrar LoginPage
 const showLoginGate = firebaseReady && !loading && !user;

 if (loading && firebaseReady) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center transition-colors duration-300">
 <div className="text-center">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-900/50">
 <Activity className="w-8 h-8 text-white"/>
 </div>
 <Loader2 className="w-8 h-8 text-blue-400 mx-auto animate-spin"/>
 <p className="text-sm text-gray-400 text-gray-400 mt-3">Cargando...</p>
 </div>
 </div>
 );
 }

 if (showLoginGate) {
 return <LoginPage />;
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 transition-colors duration-300">
 {/* Top Navigation Bar */}
 <header className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50 transition-colors">
 <div className="max-w-6xl mx-auto px-4 sm:px-6">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
 <div className="flex items-center gap-2.5 flex-shrink-0">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
 <Activity className="w-5 h-5 text-white"/>
 </div>
 <div className="hidden sm:block">
 <h1 className="text-base font-extrabold text-white leading-tight">Diabetes Control</h1>
 <p className="text-[10px] text-gray-400 text-gray-400 leading-tight">Salud y Bienestar</p>
 </div>
 </div>

 {/* Right actions */}
 <div className="flex items-center gap-2">
 {/* Connection & Sync status */}
 {!isOnline && (
 <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-red-900/30 text-red-400 transition-all duration-300"title="Sin conexión a internet">
 <CloudOff className="w-3.5 h-3.5"/>
 <span>Sin conexión</span>
 {pendingCount > 0 && (
 <span className="ml-1 px-1.5 py-0.5 rounded-md bg-red-200 bg-red-800 text-[9px] font-bold">
 {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
 </span>
 )}
 </div>
 )}
 {isOnline && pendingCount > 0 && (
 <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-yellow-900/30 text-yellow-400 transition-all duration-300"title="Cambios pendientes de sincronizar">
 <RefreshCw className="w-3.5 h-3.5"/>
 <span>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
 </div>
 )}
 {/* Profile sync status */}
 {user && firebaseReady && profileSyncStatus === 'syncing' && (
 <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-900/30 text-blue-400">
 <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
 <span className="hidden md:inline">Sincronizando perfil...</span>
 </div>
 )}
 {user && firebaseReady && profileSyncStatus === 'offline' && (
 <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-yellow-900/30 text-yellow-400">
 <CloudOff className="w-3.5 h-3.5"/>
 <span className="hidden md:inline">Error de sync</span>
 </div>
 )}
 {/* Global sync status */}
 {firebaseReady && (
 <div
 className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 ${
 user
 ? 'bg-green-900/30 text-green-400'
 : 'bg-gray-700 text-gray-400 text-gray-500'
 }`}
 title={user ? 'Sincronizado con la nube - Datos guardados automáticamente' : 'Solo datos locales - Inicia sesión para sincronizar'}
 >
 {user ? <Cloud className="w-3.5 h-3.5"/> : <CloudOff className="w-3.5 h-3.5"/>}
 <span>{user ? 'Sincronizado' : 'Local'}</span>
 </div>
 )}

 {/* Notificaciones bell */}
 <div className="relative">
 <button
 onClick={() => { setShowNotificationPanel(!showNotificationPanel); if (unreadCount > 0) markAllRead(); }}
 className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 hover:bg-blue-900/30 transition-all relative"
 title="Notificaciones"
 >
 <BellRing className="w-5 h-5"/>
 {unreadCount > 0 && (
 <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>

 {/* Panel de notificaciones */}
 {showNotificationPanel && (
 <>
 <div className="fixed inset-0 z-40"onClick={() => setShowNotificationPanel(false)} />
 <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
 <div className="p-3 border-b border-gray-700 flex items-center justify-between">
 <h4 className="text-sm font-bold text-white">Notificaciones</h4>
 {notificationsHistory.length > 0 && (
 <button onClick={markAllRead} className="text-[11px] text-blue-400 font-semibold hover:text-blue-400 transition">
 Marcar todas leídas
 </button>
 )}
 </div>
 <div className="max-h-64 overflow-y-auto">
 {notificationsHistory.length === 0 ? (
 <div className="py-8 text-center">
 <BellRing className="w-8 h-8 text-gray-100 text-gray-400 mx-auto mb-2"/>
 <p className="text-xs text-gray-400 text-gray-500">Sin notificaciones</p>
 </div>
 ) : (
 notificationsHistory.map((n, i) => (
 <div
 key={n.id}
 className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-700/50 transition cursor-pointer ${
 i === 0 ? 'bg-blue-50/50 bg-blue-900/10' : ''
 }`}
 onClick={() => setShowNotificationPanel(false)}
 >
 <span className="text-lg mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-white truncate">{n.title}</p>
 {n.body && <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.body}</p>}
 <p className="text-[10px] text-gray-300 text-gray-400 mt-0.5">
 {n.time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </>
 )}
 </div>

 {/* Auth — Menú de usuario dropdown */}
 {firebaseReady && user && (
 <div className="relative"ref={userMenuRef}>
 <button
 onClick={() => setShowUserMenu(!showUserMenu)}
 className="flex items-center gap-1.5 p-1.5 pr-2 rounded-xl hover:bg-gray-700 transition-all group"
 title="Menú de usuario"
 >
 {user.photoURL ? (
 <img
 src={user.photoURL}
 alt="Foto de perfil"
 className="w-8 h-8 rounded-xl object-cover border-2 border-gray-700 border-gray-600 group-hover:border-blue-400 transition-colors"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold group-hover:shadow-md transition-shadow">
 {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
 </div>
 )}
 <span className="hidden sm:block text-xs text-gray-400 font-medium truncate max-w-[100px]">
 {user.displayName || user.email}
 </span>
 <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
 </button>

 {/* Dropdown menu */}
 {showUserMenu && (
 <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-[60] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
 {/* User info header */}
 <div className="p-4 border-b border-gray-700">
 <p className="text-sm font-bold text-white truncate">
 {user.displayName || 'Usuario'}
 </p>
 <p className="text-xs text-gray-400 text-gray-400 truncate mt-0.5">
 {user.email}
 </p>
 </div>

 <div className="p-2">
 {/* Ver perfil */}
 <button
 onClick={() => { setSection('profile'); setShowUserMenu(false); }}
 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-all"
 >
 <User className="w-4 h-4 text-gray-400"/>
 Mi Perfil
 </button>

 {/* Configuración de cuenta */}
 <button
 onClick={() => { setSection('settings'); setShowUserMenu(false); }}
 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-all"
 >
 <Settings className="w-4 h-4 text-gray-400"/>
 Configuración de cuenta
 </button>

 {/* Separador */}
 <div className="my-1 border-t border-gray-700"/>

 {/* Cerrar sesión */}
 <button
 onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:bg-red-900/20 transition-all"
 >
 <LogOut className="w-4 h-4"/>
 Cerrar Sesión
 </button>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Navigation — Desktop */}
 <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 bg-gray-700/80 rounded-2xl p-1">
 {navItems.map(item => {
 const Icon = item.icon;
 const isActive = section === item.id;
 return (
 <button
 key={item.id}
 onClick={() => setSection(item.id)}
 className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
 isActive
 ? 'bg-gray-700 text-white shadow-sm'
 : 'text-gray-400 hover:text-gray-400 hover:text-gray-200'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
 <span className="hidden sm:inline">{item.label}</span>
 </button>
 );
 })}
 </nav>
 </div>
 </div>
 </div>
 </header>

 {/* Main Content */}
 <main className="py-6 px-4 sm:px-6 lg:px-8">
 <div className="max-w-6xl mx-auto">          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3"/>
                <p className="text-sm text-gray-400 text-gray-500">Cargando sección...</p>
              </div>
            </div>
          }>
            <PageTransition transitionKey={section}>
              {section === 'dashboard' && <Dashboard key={profileSyncKey} onNavigate={setSection} />}
              {section === 'profile' && <UserProfileSection />}
              {section === 'meals' && <MealPlanner />}
              {section === 'diet' && <DietPlan />}
              {section === 'medications' && <Medications />}
              {section === 'reminders' && <Reminders />}
              {section === 'notifications' && <NotificationsPage />}
              {section === 'settings' && <SettingsPage />}
              {section === 'foodlog' && <FoodLog />}
            </PageTransition>
          </Suspense>
 </div>
 </main>

 {/* Logout Confirmation Modal */}
 <ConfirmModal
 open={showLogoutConfirm}
 onClose={() => setShowLogoutConfirm(false)}
 onConfirm={handleLogout}
 icon={LogOut}
 iconBgColor="bg-yellow-100 bg-yellow-900/40"
 iconColor="text-yellow-400"
 title="Cerrar Sesión"
 description="¿Estás seguro de que deseas salir?"
 confirmLabel="Cerrar sesión"
 confirmGradient="from-yellow-500 to-orange-500"
 loading={loggingOut}
 loadingLabel="Cerrando sesión..."
 >
 <p className="text-sm text-gray-400 mb-4">
 Tus datos locales en este dispositivo se conservarán.
 Para acceder nuevamente, solo inicia sesión con tu correo y contraseña.
 </p>
 </ConfirmModal>

 {/* Notificación toast mejorada */}
 {notification && (
 <ToastNotification
 id={notification.id}
 title={notification.title}
 body={notification.body}
 type={notification.type}
 onDismiss={() => setNotification(null)}
 />
 )}

 {/* Bottom Navigation — Mobile */}
 <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-lg border-t border-gray-700 z-50"style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
 <div className="flex items-center justify-around px-1 py-1">
 {navItems.map(item => {
 const Icon = item.icon;
 const isActive = section === item.id;
 return (
 <button
 key={item.id}
 onClick={() => setSection(item.id)}
 className={`flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-xl transition-all duration-200 min-w-0 ${
 isActive
 ? 'text-blue-400'
 : 'text-gray-400 text-gray-400 hover:text-gray-400 hover:text-gray-300'
 }`}
 >
 <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
 <span className={`text-[9px] font-semibold leading-tight truncate max-w-[60px] ${isActive ? 'opacity-100' : 'opacity-70'}`}>
 {item.label}
 </span>
 {isActive && <div className="w-4 h-0.5 rounded-full bg-blue-600 bg-blue-400 mt-0.5"/>}
 </button>
 );
 })}
 </div>
 </nav>

 {/* PWA Spacer for bottom nav on mobile */}
 <div className="md:hidden h-16"/>

 {/* Install PWA prompt */}
 <PWAInstallPrompt />
 </div>
 );
}

// ─── Helpers ───

const notifTypeStyles: Record<string, { icon: string; bg: string; color: string }> = {
 glucose: { icon: '🩸', bg: 'bg-blue-100 bg-blue-900/40', color: 'text-blue-400' },
 medication: { icon: '💊', bg: 'bg-red-100 bg-red-900/40', color: 'text-red-400' },
 meal: { icon: '🍽️', bg: 'bg-green-100 bg-green-900/40', color: 'text-green-400' },
 exercise: { icon: '🏃', bg: 'bg-orange-100 bg-orange-900/40', color: 'text-orange-400' },
 water: { icon: '💧', bg: 'bg-cyan-100 bg-cyan-900/40', color: 'text-cyan-400' },
 custom: { icon: '⏰', bg: 'bg-purple-100 bg-purple-900/40', color: 'text-purple-400' },
};

function getNotifIcon(type?: string): string {
 if (!type || !notifTypeStyles[type]) return '🔔';
 return notifTypeStyles[type].icon;
}

function getNotifStyle(type?: string) {
 if (!type || !notifTypeStyles[type]) return notifTypeStyles.custom;
 return notifTypeStyles[type];
}

// ─── Toast de Notificación con swipe ───

function ToastNotification({ id, title, body, type, onDismiss }: {
 id: string;
 title: string;
 body?: string;
 type?: string;
 onDismiss: () => void;
}) {
 const [offsetX, setOffsetX] = useState(0);
 const [isDismissing, setIsDismissing] = useState(false);
 const startX = useRef(0);
 const currentX = useRef(0);
 const style = getNotifStyle(type);

 const handleTouchStart = (e: React.TouchEvent) => {
 startX.current = e.touches[0].clientX;
 };

 const handleTouchMove = (e: React.TouchEvent) => {
 currentX.current = e.touches[0].clientX;
 const diff = currentX.current - startX.current;
 if (diff < 0) setOffsetX(diff);
 };

 const handleTouchEnd = () => {
 const diff = currentX.current - startX.current;
 if (diff < -80) {
 setIsDismissing(true);
 setTimeout(onDismiss, 200);
 } else {
 setOffsetX(0);
 }
 };

 return (
 <div
 className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50 ${isDismissing ? 'animate-[slideOutRight_0.2s_ease-in_forwards]' : 'animate-[slideInUp_0.3s_ease-out]'}`}
 style={{ transform: offsetX < 0 ? `translateX(${offsetX}px)` : undefined }}
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 >
 <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-4 flex items-start gap-3 relative overflow-hidden">
 {/* Barra de tipo */}
 <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${style.bg.replace('', '').replace('/40', '/60')}`} />

 {/* Icono */}
 <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
 <span className="text-lg">{getNotifIcon(type)}</span>
 </div>

 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-white">{title}</p>
 {body && (
 <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{body}</p>
 )}
 </div>

 <button
 onClick={onDismiss}
 className="p-1.5 text-gray-300 text-gray-400 hover:text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-xl transition flex-shrink-0 self-start"
 >
 <X className="w-4 h-4"/>
 </button>

 {/* Indicador de swipe */}
 <div className="absolute bottom-1 right-2 flex items-center gap-0.5 opacity-30">
 <svg className="w-3 h-3 text-gray-400"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
 <span className="text-[8px] text-gray-400 font-medium">desliza</span>
 </div>
 </div>
 </div>
 );
}

// PWA Install Prompt Component
function PWAInstallPrompt() {
 const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
 const [showPrompt, setShowPrompt] = useState(false);

 useEffect(() => {
 const handler = (e: Event) => {
 e.preventDefault();
 setDeferredPrompt(e);
 setShowPrompt(true);
 };
 window.addEventListener('beforeinstallprompt', handler);
 return () => window.removeEventListener('beforeinstallprompt', handler);
 }, []);

 if (!showPrompt) return null;

 const handleInstall = async () => {
 if (!deferredPrompt) return;
 deferredPrompt.prompt();
 const result = await deferredPrompt.userChoice;
 if (result.outcome === 'accepted') {
 setShowPrompt(false);
 }
 setDeferredPrompt(null);
 };

 return (
 <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-4 z-50 animate-[fadeIn_0.3s_ease-out]">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
 <Activity className="w-5 h-5 text-white"/>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-white">Instala Diabetes Control</p>
 <p className="text-xs text-gray-400 mt-0.5">Agrega la app a tu pantalla de inicio</p>
 </div>
 <button
 onClick={handleInstall}
 className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex-shrink-0 self-start"
 >
 Instalar
 </button>
 <button
 onClick={() => setShowPrompt(false)}
 className="p-1 text-gray-300 text-gray-400 hover:text-gray-500 hover:text-gray-300 transition flex-shrink-0"
 >
 ✕
 </button>
 </div>
 </div>
 );
}
