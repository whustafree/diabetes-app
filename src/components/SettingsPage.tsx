import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Lock, Mail, LogOut, Trash2, AlertCircle, Eye, EyeOff,
  CheckCircle2, Loader2, AlertTriangle, History, Shield, Clock,
  Download, Bell
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { getActivityLog, addActivity, clearActivityLog, ActivityEntry } from '../utils/activityLog';
import { collectAllData, downloadJson, getExportStats } from '../utils/dataExport';
import { generatePdfReport, downloadPdf } from '../utils/pdfExport';
import { getNotifPreferences, setNotifPreference, setAllNotifPreferences, NOTIF_TYPES, type NotifType } from '../utils/notificationPreferences';

type SettingsTab = 'account' | 'security' | 'activity';

// ─── Activity type meta ───
const activityMeta: Record<string, { icon: string; color: string; label: string }> = {
  login: { icon: '🔓', color: 'text-green-600', label: 'Inicio de sesión' },
  logout: { icon: '🔒', color: 'text-yellow-600', label: 'Cierre de sesión' },
  password_change: { icon: '🔑', color: 'text-blue-600', label: 'Cambio de contraseña' },
  profile_update: { icon: '👤', color: 'text-purple-600', label: 'Actualización de perfil' },
  register: { icon: '✨', color: 'text-emerald-600', label: 'Registro' },
  settings_change: { icon: '⚙️', color: 'text-gray-600', label: 'Cambio de configuración' },
  account_delete: { icon: '💀', color: 'text-red-600', label: 'Eliminación de cuenta' },
};

function getActivityMeta(type: string) {
  return activityMeta[type] || { icon: '📝', color: 'text-gray-500', label: type };
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// ─── User role types ───
type UserRole = 'user' | 'admin';
const USER_ROLE_KEY = 'diabetes-app-user-role';
const ROLE_CHANGE_KEY = 'diabetes-app-role-changed';

function getSavedRole(): UserRole {
  try {
    return (localStorage.getItem(USER_ROLE_KEY) as UserRole) || 'user';
  } catch { return 'user'; }
}

function saveRole(role: UserRole) {
  localStorage.setItem(USER_ROLE_KEY, role);
  localStorage.setItem(ROLE_CHANGE_KEY, Date.now().toString());
}

export default function SettingsPage() {
  const { user, logout, deleteAccount, changePassword } = useAuth();

  // ─── Tabs ───
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // ─── Change Password ───
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ─── Logout ───
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Delete Account ───
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ─── Export Data ───
  const [exportStats, setExportStats] = useState(getExportStats);
  const [exporting, setExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  // ─── Notification Preferences ───
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifType, boolean>>(getNotifPreferences);
  const [allNotifs, setAllNotifs] = useState(
    Object.values(notifPrefs).every(v => v)
  );

  useEffect(() => {
    setExportStats(getExportStats());
  }, []);

  // ─── User Role ───
  const [userRole, setUserRole] = useState<UserRole>(getSavedRole);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  // ─── Activity Log ───
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const activityLog = useMemo(() => getActivityLog(), [activeTab]);
  const filteredLog = useMemo(() =>
    activityFilter === 'all' ? activityLog : activityLog.filter(e => e.type === activityFilter),
    [activityLog, activityFilter]
  );
  const activityTypes = useMemo(() => {
    const types = new Set(activityLog.map(e => e.type));
    return Array.from(types);
  }, [activityLog]);

  // ─── Handle Change Password ───
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Ingresa tu contraseña actual');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      addActivity({ type: 'password_change', label: 'Cambio de contraseña', detail: 'Contraseña actualizada exitosamente' });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      const msg =
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Contraseña actual incorrecta'
          : err.code === 'auth/requires-recent-login'
          ? 'Por seguridad, cierra sesión y vuelve a iniciarla antes de cambiar tu contraseña'
          : err.code === 'auth/weak-password'
          ? 'La contraseña es muy débil'
          : err.message || 'Error al cambiar la contraseña';
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Handle Logout ───
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      addActivity({ type: 'logout', label: 'Cierre de sesión' });
      await logout();
    } catch {}
    setLoggingOut(false);
  };

  // ─── Handle Delete Account ───
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Ingresa tu contraseña para confirmar');
      return;
    }
    setDeleteError('');
    setDeleting(true);
    try {
      addActivity({ type: 'account_delete', label: 'Cuenta eliminada' });
      await deleteAccount(deletePassword);
    } catch (err: any) {
      const msg =
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Contraseña incorrecta'
          : err.code === 'auth/requires-recent-login'
          ? 'Por seguridad, cierra sesión y vuelve a iniciarla antes de eliminar tu cuenta'
          : err.message || 'Error al eliminar la cuenta';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Handle Role Change ───
  // ─── Handle Export JSON ───
  const handleExport = () => {
    setExporting(true);
    try {
      const data = collectAllData(user?.email);
      downloadJson(data);
      addActivity({ type: 'settings_change', label: 'Exportación de datos', detail: 'Datos exportados como JSON' });
    } finally {
      setExporting(false);
    }
  };

  // ─── Handle Export PDF ───
  const handlePdfExport = async () => {
    setPdfExporting(true);
    try {
      const doc = await generatePdfReport(null, {
        includeGlucoseChart: false,
        includeHealthScore: true,
        includeFoodLog: true,
        includeStats: true,
      });
      downloadPdf(doc);
      addActivity({ type: 'settings_change', label: 'Exportación de datos', detail: 'Reporte PDF generado' });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  // ─── Handle Notification Toggle ───
  const handleNotifToggle = (type: NotifType, enabled: boolean) => {
    setNotifPreference(type, enabled);
    setNotifPrefs(prev => ({ ...prev, [type]: enabled }));
  };

  const handleAllNotifsToggle = (enabled: boolean) => {
    setAllNotifPreferences(enabled);
    const newPrefs = getNotifPreferences();
    setNotifPrefs(newPrefs);
    setAllNotifs(enabled);
  };

  const handleRoleChange = () => {
    if (pendingRole) {
      saveRole(pendingRole);
      setUserRole(pendingRole);
      addActivity({ type: 'settings_change', label: 'Cambio de rol', detail: `Rol cambiado a ${pendingRole === 'admin' ? 'Administrador' : 'Usuario'}` });
      setShowRoleConfirm(false);
      setPendingRole(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de cuenta</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Administra tu cuenta, seguridad y actividad
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100/80 dark:bg-gray-700/80 rounded-2xl p-1.5 max-w-sm">
        {[
          { id: 'account' as SettingsTab, label: 'Cuenta', icon: User },
          { id: 'security' as SettingsTab, label: 'Seguridad', icon: Lock },
          { id: 'activity' as SettingsTab, label: 'Actividad', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500 dark:text-blue-400' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB: CUENTA ─── */}
      {activeTab === 'account' && (
        <>
          {/* Información de la cuenta */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Información de la cuenta
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Correo electrónico</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email || '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nombre</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {user?.displayName || '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">UID (ID de usuario)</p>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{user?.uid}</p>
              </div>
            </div>
          </div>

          {/* Rol de usuario */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Rol de usuario
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    userRole === 'admin'
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {userRole === 'admin'
                    ? 'Tienes acceso completo a todas las funciones de la aplicación.'
                    : 'Acceso estándar a las funciones de la aplicación.'}
                </p>
              </div>
              <button
                onClick={() => {
                  const newRole: UserRole = userRole === 'admin' ? 'user' : 'admin';
                  setPendingRole(newRole);
                  setShowRoleConfirm(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-all"
              >
                {userRole === 'admin' ? 'Degradar a Usuario' : 'Ascender a Admin'}
              </button>
            </div>
          </div>

          {/* Exportar Datos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Exportar Datos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Descarga todos tus datos como archivo JSON o genera un reporte PDF completo con
              estadísticas, health score y registro de comidas.
            </p>
            {exportStats.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Datos incluidos</p>
                <div className="flex flex-wrap gap-1.5">
                  {exportStats.map(s => (
                    <span key={s.key} className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium">
                      {s.key.replace('diabetes-app-', '')} ({(s.size / 1024).toFixed(1)} KB)
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exportando...' : 'Exportar JSON'}
              </button>
              <button
                onClick={handlePdfExport}
                disabled={pdfExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 transition-all disabled:opacity-50"
              >
                <Loader2 className={`w-4 h-4 ${pdfExporting ? 'animate-spin' : ''}`} />
                {pdfExporting ? 'Generando PDF...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          {/* Preferencias de Notificaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              Tipos de Notificación
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Activa o desactiva qué tipos de notificaciones deseas recibir.
            </p>

            {/* Toggle all */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Todas las notificaciones</span>
              <button
                onClick={() => handleAllNotifsToggle(!allNotifs)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  allNotifs ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${allNotifs ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              {NOTIF_TYPES.map(({ key, icon, label, description }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotifToggle(key, !notifPrefs[key])}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                      notifPrefs[key] ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${notifPrefs[key] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cerrar Sesión */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-yellow-100 dark:border-yellow-900/30">
            <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Sesión
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Cerrar tu sesión actual. Tus datos locales se conservarán en este dispositivo.
            </p>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>

          {/* Eliminar Cuenta */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Zona de Peligro
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Eliminar tu cuenta borrará todos tus datos en la nube de forma permanente.
              Esta acción no se puede deshacer.
            </p>
            <button
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); setDeletePassword(''); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar mi cuenta
            </button>
          </div>
        </>
      )}

      {/* ─── TAB: SEGURIDAD ─── */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Cambiar Contraseña
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Ingresa tu contraseña actual y una nueva contraseña.
            Debe tener al menos 6 caracteres.
          </p>

          {passwordSuccess && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-start gap-3 mb-4 animate-[fadeIn_0.3s_ease-out]">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">Contraseña actualizada</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Tu contraseña se ha cambiado exitosamente.</p>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-3 mb-4 animate-[fadeIn_0.3s_ease-out]">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-12"
                  disabled={changingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Nueva contraseña
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={changingPassword}
              />
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(strength => {
                      const isActive =
                        (strength === 1 && newPassword.length >= 6) ||
                        (strength === 2 && newPassword.length >= 8) ||
                        (strength === 3 && newPassword.length >= 10 && /[^a-zA-Z0-9]/.test(newPassword));
                      return (
                        <div
                          key={strength}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            isActive
                              ? strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-yellow-400' : 'bg-green-400'
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    {newPassword.length < 6 ? 'Muy corta' : newPassword.length < 8 ? 'Débil' : newPassword.length < 10 ? 'Buena' : 'Fuerte'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Confirmar nueva contraseña
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                disabled={changingPassword}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl active:scale-[0.98]"
            >
              {changingPassword ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Cambiando contraseña...</>
              ) : (
                <><Lock className="w-5 h-5" /> Cambiar Contraseña</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: ACTIVIDAD ─── */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Registro de Actividad
            </h3>
            {activityLog.length > 0 && (
              <button
                onClick={() => { clearActivityLog(); }}
                className="text-[11px] text-red-500 font-semibold hover:text-red-600 transition"
              >
                Limpiar historial
              </button>
            )}
          </div>

          {/* Stats mini-cards */}
          {activityLog.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{activityLog.length}</p>
                <p className="text-[10px] text-blue-500 dark:text-blue-300 font-medium">Total</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {filteredLog.filter(e => e.type !== 'logout' && e.type !== 'account_delete').length}
                </p>
                <p className="text-[10px] text-green-500 dark:text-green-300 font-medium">Activas</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-center">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{activityTypes.length}</p>
                <p className="text-[10px] text-purple-500 dark:text-purple-300 font-medium">Tipos</p>
              </div>
            </div>
          )}

          {/* Filtro por tipo */}
          {activityTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  activityFilter === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos
              </button>
              {activityTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    activityFilter === type
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getActivityMeta(type).icon} {getActivityMeta(type).label}
                </button>
              ))}
            </div>
          )}

          {/* Lista de actividades */}
          {filteredLog.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Sin actividad registrada</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                Las acciones como inicio de sesión, cambio de contraseña y cierre de sesión aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredLog.map(entry => {
                const meta = getActivityMeta(entry.type);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                  >
                    <span className="text-lg mt-0.5 flex-shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{entry.label}</p>
                      {entry.detail && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entry.detail}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-medium text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── LOGOUT CONFIRMATION MODAL ─── */}
      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        icon={LogOut}
        iconBgColor="bg-yellow-100 dark:bg-yellow-900/40"
        iconColor="text-yellow-600 dark:text-yellow-400"
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas salir?"
        confirmLabel="Cerrar sesión"
        confirmGradient="from-yellow-500 to-orange-500"
        loading={loggingOut}
        loadingLabel="Cerrando sesión..."
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tus datos locales en este dispositivo se conservarán.
          Para acceder nuevamente, solo inicia sesión con tu correo y contraseña.
        </p>
      </ConfirmModal>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        icon={AlertCircle}
        iconBgColor="bg-red-100 dark:bg-red-900/40"
        iconColor="text-red-600 dark:text-red-400"
        title="Eliminar Cuenta"
        description="Esta acción es irreversible"
        confirmLabel="Eliminar cuenta"
        confirmGradient="from-red-600 to-rose-600"
        loading={deleting}
        loadingLabel="Eliminando..."
        disabled={!deletePassword}
      >
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">Se eliminará todo tu contenido en la nube:</p>
          <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
            <li>Registros de glucosa</li>
            <li>Perfil y evaluación de salud</li>
            <li>Medicamentos y horarios</li>
            <li>Recordatorios personalizados</li>
            <li>Planes de comida y dieta</li>
          </ul>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Los datos locales en este dispositivo <strong>no se eliminarán</strong> automáticamente.
          Ingresa tu contraseña para confirmar.
        </p>
        {deleteError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Contraseña
          </label>
          <input
            type="password"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            placeholder="Tu contraseña actual"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
            disabled={deleting}
            onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* ─── ROLE CHANGE CONFIRMATION MODAL ─── */}
      <ConfirmModal
        open={showRoleConfirm}
        onClose={() => { setShowRoleConfirm(false); setPendingRole(null); }}
        onConfirm={handleRoleChange}
        icon={Shield}
        iconBgColor="bg-indigo-100 dark:bg-indigo-900/40"
        iconColor="text-indigo-600 dark:text-indigo-400"
        title={pendingRole === 'admin' ? 'Ascender a Administrador' : 'Degradar a Usuario'}
        description="¿Estás seguro?"
        confirmLabel={pendingRole === 'admin' ? 'Ascender' : 'Degradar'}
        confirmGradient="from-indigo-600 to-purple-600"
        customIcon={<Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      >
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {pendingRole === 'admin'
              ? 'El rol de Administrador otorga acceso completo a todas las funciones y configuraciones de la aplicación.'
              : 'El rol de Usuario tiene acceso estándar a las funciones básicas de la aplicación.'}
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
