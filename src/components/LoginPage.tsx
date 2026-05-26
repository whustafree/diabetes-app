import { useState } from 'react';
import { Activity, Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'reset';

export default function LoginPage() {
  const { login, register, resetPassword, firebaseReady } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password, rememberMe);
        setShowSuccessAnimation(true);
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('El nombre es obligatorio');
        await register(email, password, name.trim());
        setShowSuccessAnimation(true);
      }
    } catch (err: any) {
      const msg = err.code
        ? err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Correo o contraseña incorrectos'
          : err.code === 'auth/email-already-in-use'
          ? 'Este correo ya está registrado'
          : err.code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : err.code === 'auth/invalid-email'
          ? 'Correo electrónico inválido'
          : err.code === 'auth/too-many-requests'
          ? 'Demasiados intentos. Intenta de nuevo más tarde.'
          : err.code === 'auth/network-request-failed'
          ? 'Error de conexión. Verifica tu internet.'
          : err.message || 'Error de autenticación'
        : err.message || 'Error de autenticación';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico primero');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found'
        ? 'No hay cuenta asociada a este correo'
        : 'Error al enviar correo de recuperación';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex flex-col transition-colors duration-300">
      {/* ─── TOP BAR ─── */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-base font-extrabold text-gray-800 dark:text-white">Diabetes Control</h1>
        </div>

      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* ─── BRANDING HERO ─── */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-200 dark:shadow-blue-900/50">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white leading-tight">
              {mode === 'login' ? 'Bienvenido de nuevo' : mode === 'register' ? 'Crea tu cuenta' : 'Recuperar acceso'}
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-xs mx-auto">
              {mode === 'login'
                ? 'Inicia sesión para acceder a tu plan personalizado de control'
                : mode === 'register'
                ? 'Regístrate para guardar tus datos en la nube de forma segura'
                : 'Te enviaremos un enlace para restablecer tu contraseña'}
            </p>
          </div>

          {/* ─── AUTH CARD ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
            {/* Error message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-2.5 mb-5">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-3.5 rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-start gap-2.5 mb-5">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            {mode === 'reset' ? (
              /* ─── RESET PASSWORD ─── */
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="animate-pulse">Enviando...</span>
                  ) : (
                    'Enviar correo de recuperación'
                  )}
                </button>

                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a iniciar sesión
                </button>
              </div>
            ) : (
              /* ─── LOGIN / REGISTER FORM ─── */
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="animate-pulse">Procesando...</span>
                  ) : mode === 'login' ? (
                    <><LogIn className="w-5 h-5" /> Iniciar Sesión</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Crear Cuenta</>
                  )}
                </button>

                {/* Remember Me + Forgot password */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-lg border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        Recordarme
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                      className="text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ─── MODE TOGGLE ─── */}
            {/* Google Sign-In + Demo */}
            {mode === 'login' && firebaseReady && (
              <div className="mt-5">
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
                      O continúa con
                    </span>
                  </div>
                </div>
                <GoogleLoginButton />
              </div>
            )}

            {mode !== 'reset' && (
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); setName(''); setPassword(''); }}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* ─── FOOTER ─── */}
          <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-6">
            Tus datos se guardan de forma segura en Firebase
          </p>
        </div>
      </div>

      {/* ─── SUCCESS ANIMATION OVERLAY ─── */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-700/90 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center animate-[scaleIn_0.5s_ease-out]">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle className="w-12 h-12 text-white animate-[bounceIn_0.6s_ease-out]" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-lg text-blue-200">
              Prepárate para tu sesión...
            </p>
            <div className="flex justify-center gap-1 mt-6">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ─── DEMO MODE ─── */}
      {!firebaseReady && (
        <DemoModeCard />
      )}
    </div>
  );
}

// ─── Google Sign-In Button ───

function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // Usuario cerró el popup, no es error
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Agrega este dominio en Firebase Console > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        <Chrome className="w-5 h-5 text-blue-500" />
        {loading ? 'Conectando...' : 'Continuar con Google'}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}

// ─── Demo Mode ───

function DemoModeCard() {
  const { loginAsDemo } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await loginAsDemo();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-dashed border-gray-200 dark:border-gray-600">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Firebase no está configurado aún. Puedes explorar la app en modo demo con datos de ejemplo.
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-gray-600 to-slate-600 text-white font-semibold hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-gray-200 dark:shadow-gray-900/50"
      >
        <Activity className="w-5 h-5" />
        {loading ? 'Iniciando...' : 'Explorar en modo Demo'}
      </button>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        Los datos se guardan localmente en este dispositivo
      </p>
    </div>
  );
}
