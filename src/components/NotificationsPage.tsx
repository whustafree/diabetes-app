import { useState, useMemo, useEffect } from 'react';
import { BellRing, Search, Filter, Trash2, X, Bell, Clock, Activity, Smartphone, CalendarDays, TrendingUp, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'diabetes-app-notifications';

interface StoredNotification {
  id: string;
  title: string;
  body?: string;
  type?: string;
  time: string; // ISO string
  read: boolean;
}

const notifTypeMeta: Record<string, { icon: string; label: string; color: string }> = {
  glucose: { icon: '🩸', label: 'Glucosa', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
  medication: { icon: '💊', label: 'Medicación', color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
  meal: { icon: '🍽️', label: 'Comida', color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
  exercise: { icon: '🏃', label: 'Ejercicio', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' },
  water: { icon: '💧', label: 'Agua', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400' },
  custom: { icon: '⏰', label: 'Personalizado', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
};

const typeFilterOptions = [
  { value: 'all', label: 'Todas', icon: '🔔' },
  ...Object.entries(notifTypeMeta).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon })),
];

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function loadNotifications(): StoredNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveNotifications(items: StoredNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function persistNotification(notif: { id: string; title: string; body?: string; type?: string }) {
  const existing = loadNotifications();
  const stored: StoredNotification = {
    ...notif,
    time: new Date().toISOString(),
    read: false,
  };
  const updated = [stored, ...existing].slice(0, 100);
  saveNotifications(updated);
  return updated;
}

export function getUnreadCount(): number {
  return loadNotifications().filter(n => !n.read).length;
}

export function markAllNotificationsRead() {
  const items = loadNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(items);
}

// ─── Estadísticas semanales ───

interface WeeklyStats {
  dailyCounts: { day: string; count: number; date: string }[];
  totalWeek: number;
  mostFrequentType: { type: string; count: number };
  busiestDay: { name: string; count: number };
  dailyAverage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

function computeWeeklyStats(notifications: StoredNotification[]): WeeklyStats {
  const now = new Date();
  const last7Days: { day: string; date: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last7Days.push({
      day: dayNames[d.getDay()],
      date: d.toISOString().split('T')[0],
      count: 0,
    });
  }

  const typeCounts: Record<string, number> = {};
  let maxDayCount = 0;
  let maxDayName = '';
  let totalWeek = 0;

  for (const n of notifications) {
    const notifDate = new Date(n.time).toISOString().split('T')[0];
    const dayData = last7Days.find(d => d.date === notifDate);
    if (!dayData) continue;

    dayData.count++;
    totalWeek++;

    const t = n.type || 'custom';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  // Día más ocupado
  for (const d of last7Days) {
    if (d.count > maxDayCount) {
      maxDayCount = d.count;
      maxDayName = d.day;
    }
  }

  // Tipo más frecuente
  let mostFreqType = 'custom';
  let mostFreqCount = 0;
  for (const [t, c] of Object.entries(typeCounts)) {
    if (c > mostFreqCount) {
      mostFreqCount = c;
      mostFreqType = t;
    }
  }

  // Tendencia: comparar primeros 3 días vs últimos 3 días
  const firstHalf = last7Days.slice(0, 3).reduce((s, d) => s + d.count, 0);
  const secondHalf = last7Days.slice(-3).reduce((s, d) => s + d.count, 0);
  const trend: 'up' | 'down' | 'stable' =
    secondHalf > firstHalf ? 'up' :
    secondHalf < firstHalf ? 'down' : 'stable';
  const trendPercent = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  return {
    dailyCounts: last7Days,
    totalWeek,
    mostFrequentType: { type: mostFreqType, count: mostFreqCount },
    busiestDay: { name: maxDayName, count: maxDayCount },
    dailyAverage: totalWeek > 0 ? Math.round((totalWeek / 7) * 10) / 10 : 0,
    trend,
    trendPercent,
  };
}

// ─── Componente principal ───

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<StoredNotification[]>(loadNotifications);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<StoredNotification | null>(null);

  // Refrescar cada 5s
  useEffect(() => {
    setNotifications(loadNotifications());
    const interval = setInterval(() => {
      setNotifications(loadNotifications());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType: Record<string, number> = {};
    notifications.forEach(n => {
      const t = n.type || 'custom';
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total, unread, byType };
  }, [notifications]);

  const weeklyStats = useMemo(() => computeWeeklyStats(notifications), [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, search, typeFilter]);

  const handleClearAll = () => {
    saveNotifications([]);
    setNotifications([]);
  };

  const handleDismiss = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    setNotifications(updated);
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };

  const handleMarkRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
    setNotifications(updated);
  };

  const handleToggleRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    saveNotifications(updated);
    setNotifications(updated);
    if (selectedNotif) setSelectedNotif(updated.find(n => n.id === id) || null);
  };

  const openDetail = (n: StoredNotification) => {
    setSelectedNotif(n);
    if (!n.read) handleMarkRead(n.id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BellRing className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Centro de Notificaciones</h2>
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Historial de todas las notificaciones recibidas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BellRing className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">No leídas</span>
          </div>
          <p className="text-2xl font-extrabold text-red-500">{stats.unread}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Push</span>
          </div>
          <p className="text-2xl font-extrabold text-green-500">{(localStorage.getItem('fcm-push-enabled') === 'true') ? '✓' : '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Tipos</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-500">{Object.keys(stats.byType).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">Hoy</span>
          </div>
          <p className="text-2xl font-extrabold text-orange-500">{weeklyStats.dailyCounts[6]?.count || 0}</p>
        </div>
      </div>

      {/* Type distribution */}
      {Object.keys(stats.byType).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(stats.byType).map(([type, count]) => {
            const meta = notifTypeMeta[type] || notifTypeMeta.custom;
            return (
              <span key={type} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.color}`}>
                {meta.icon} {meta.label} <span className="opacity-60">×{count}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* ─── Estadísticas Semanales ─── */}
      {weeklyStats.totalWeek > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800 dark:text-white">Últimos 7 días</h3>
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 ${
              weeklyStats.trend === 'up' ? 'text-red-500' :
              weeklyStats.trend === 'down' ? 'text-green-500' :
              'text-gray-400'
            }`}>
              {weeklyStats.trend === 'up' && '↑'}
              {weeklyStats.trend === 'down' && '↓'}
              {weeklyStats.trend === 'stable' && '→'}
              {weeklyStats.trendPercent !== 0 && `${Math.abs(weeklyStats.trendPercent)}%`}
            </span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-24">
            {weeklyStats.dailyCounts.map((day, i) => {
              const maxCount = Math.max(...weeklyStats.dailyCounts.map(d => d.count), 1);
              const heightPercent = (day.count / maxCount) * 100;
              const isToday = i === weeklyStats.dailyCounts.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">{day.count}</span>
                  <div
                    className={`w-full rounded-lg transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className={`text-[9px] font-medium ${isToday ? 'text-blue-500 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-800 dark:text-white">{weeklyStats.totalWeek}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Total semanal</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-800 dark:text-white">{weeklyStats.dailyAverage}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Promedio diario</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-800 dark:text-white">
                {weeklyStats.busiestDay.name.startsWith('D') && weeklyStats.busiestDay.name.length > 3
                  ? weeklyStats.busiestDay.name.slice(0, 3)
                  : weeklyStats.busiestDay.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Día más activo ({weeklyStats.busiestDay.count})</p>
            </div>
          </div>

          {/* Most frequent type */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Tipo más frecuente:</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${(notifTypeMeta[weeklyStats.mostFrequentType.type] || notifTypeMeta.custom).color}`}>
              {(notifTypeMeta[weeklyStats.mostFrequentType.type] || notifTypeMeta.custom).icon}
              {(notifTypeMeta[weeklyStats.mostFrequentType.type] || notifTypeMeta.custom).label}
              <span className="opacity-60">×{weeklyStats.mostFrequentType.count}</span>
            </span>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar notificaciones..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl transition-all ${showFilters ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          title="Filtrar por tipo"
        >
          <Filter className="w-4 h-4" />
        </button>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
            title="Limpiar todo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Type filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
          {typeFilterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === opt.value
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BellRing className="w-16 h-16 text-gray-200 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">
              {search || typeFilter !== 'all' ? 'Sin resultados con los filtros actuales' : 'No hay notificaciones aún'}
            </p>
            {(search || typeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); }}
                className="mt-2 text-xs text-blue-500 font-semibold hover:text-blue-600 transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filtered.map(n => {
            const meta = notifTypeMeta[n.type || 'custom'] || notifTypeMeta.custom;
            const time = new Date(n.time);
            const isToday = new Date().toDateString() === time.toDateString();
            const timeStr = isToday
              ? time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : time.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={n.id}
                className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] ${
                  n.read
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    : 'bg-blue-50/80 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800'
                }`}
                onClick={() => openDetail(n)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${meta.color.split(' ')[0]} ${meta.color.split(' ')[1] || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-white'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className={`text-xs mt-0.5 line-clamp-1 ${n.read ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {n.body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      <span className="text-[10px] text-gray-300 dark:text-gray-600">{timeStr}</span>
                      {n.type && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDismiss(n.id); }}
                    className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0 self-start"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="text-center">
        <p className="text-[11px] text-gray-300 dark:text-gray-600">
          {notifications.length} notificaciones almacenadas • Se guardan localmente • Haz clic para ver detalle
        </p>
      </div>

      {/* ─── Modal de Detalle ─── */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedNotif(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            {/* Header with type bar */}
            <div className={`h-1.5 w-full ${(notifTypeMeta[selectedNotif.type || 'custom'] || notifTypeMeta.custom).color.split(' ')[0]}`} />

            <div className="p-6 space-y-5">
              {/* Close button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{(notifTypeMeta[selectedNotif.type || 'custom'] || notifTypeMeta.custom).icon}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(notifTypeMeta[selectedNotif.type || 'custom'] || notifTypeMeta.custom).color}`}>
                    {(notifTypeMeta[selectedNotif.type || 'custom'] || notifTypeMeta.custom).label}
                  </span>
                  {!selectedNotif.read && (
                    <span className="text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">Nueva</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white">{selectedNotif.title}</h3>
                {selectedNotif.body && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{selectedNotif.body}</p>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-gray-500">Fecha y hora</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {new Date(selectedNotif.time).toLocaleDateString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-gray-500">Tipo</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {(notifTypeMeta[selectedNotif.type || 'custom'] || notifTypeMeta.custom).label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-gray-500">Estado</span>
                  <span className={`font-semibold ${selectedNotif.read ? 'text-green-500' : 'text-blue-500'}`}>
                    {selectedNotif.read ? 'Leída' : 'No leída'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-gray-500">ID</span>
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{selectedNotif.id}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleToggleRead(selectedNotif.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-[0.98]"
                >
                  {selectedNotif.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {selectedNotif.read ? 'Marcar no leída' : 'Marcar leída'}
                </button>
                <button
                  onClick={() => handleDismiss(selectedNotif.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
