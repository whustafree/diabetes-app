import { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';

interface AuthModalProps {
 onClose: () => void;
}

type AuthMode = 'login' | 'register';

export default function AuthModal({ onClose }: AuthModalProps) {
 const { login, register, resetPassword, firebaseReady } = useAuth();
 const [mode, setMode] = useState<AuthMode>('login');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [loading, setLoading] = useState(false);
 const [resetSent, setResetSent] = useState(false);

 if (!firebaseReady) {
 return (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"onClick={onClose}>
 <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"onClick={e => e.stopPropagation()}>
 <div className="flex items-center gap-3 mb-4">
 <AlertCircle className="w-6 h-6 text-yellow-500"/>
 <h2 className="text-lg font-bold text-white">Firebase no configurado</h2>
 </div>
 <p className="text-sm text-gray-400 mb-4">
 Para usar autenticación en la nube, configura Firebase:
 </p>
 <ol className="text-sm text-gray-300 space-y-2 mb-4 list-decimal list-inside">
 <li>Crea un proyecto en <a href="https://console.firebase.google.com"className="text-blue-400 underline"target="_blank"rel="noopener">Firebase Console</a></li>
 <li>Agrega una App Web y copia la configuración</li>
 <li>Crea un archivo <code className="bg-gray-700 px-2 py-0.5 rounded text-xs">.env</code> en la raíz del proyecto</li>
 <li>Pega las variables del <code className="bg-gray-700 px-2 py-0.5 rounded text-xs">.env.example</code> con tus valores</li>
 </ol>
 <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold hover:bg-gray-200 transition">
 Entendido
 </button>
 </div>
 </div>
 );
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setSuccess('');
 setLoading(true);

 try {
 if (mode === 'login') {
 await login(email, password);
 setSuccess('Inicio de sesión exitoso');
 setTimeout(onClose, 500);
 } else {
 if (!name.trim()) throw new Error('El nombre es obligatorio');
 await register(email, password, name.trim());
 setSuccess('Cuenta creada exitosamente');
 setTimeout(onClose, 500);
 }
 } catch (err: any) {
 const msg = err.code
 ? err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
 ? 'Correo o contraseña incorrectos'
 : err.code === 'auth/email-already-in-use'
 ? 'Este correo ya está registrado'
 : err.code === 'auth/weak-password'
 ? 'La contraseña debe tener al menos 6 caracteres'
 : err.code === 'auth/invalid-email'
 ? 'Correo electrónico inválido'
 : err.message || 'Error de autenticación'
 : err.message || 'Error de autenticación';
 setError(msg);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"onClick={onClose}>
 <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"onClick={e => e.stopPropagation()}>
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
 {mode === 'login' ? <LogIn className="w-5 h-5 text-white"/> : <UserPlus className="w-5 h-5 text-white"/>}
 </div>
 <div>
 <h2 className="text-lg font-bold text-white">
 {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
 </h2>
 <p className="text-xs text-gray-400 text-gray-500">
 {mode === 'login' ? 'Accede a tus datos en la nube' : 'Guarda tus datos en la nube'}
 </p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-700 transition text-gray-400">
 <X className="w-5 h-5"/>
 </button>
 </div>

 {/* Error */}
 {error && (
 <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 border-red-800 flex items-start gap-2 mb-4">
 <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
 <p className="text-sm text-red-300">{error}</p>
 </div>
 )}

 {/* Success */}
 {success && (
 <div className="p-3 rounded-xl bg-green-900/30 border border-green-700 border-green-800 flex items-start gap-2 mb-4">
 <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"/>
 <p className="text-sm text-green-300">{success}</p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 {mode === 'register' && (
 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <User className="w-4 h-4"/> Nombre
 </label>
 <input
 type="text"
 value={name}
 onChange={e => setName(e.target.value)}
 placeholder="Tu nombre"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 required
 />
 </div>
 )}

 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Mail className="w-4 h-4"/> Correo Electrónico
 </label>
 <input
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="tu@correo.com"
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
 <Lock className="w-4 h-4"/> Contraseña
 </label>
 <input
 type="password"
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="Mínimo 6 caracteres"
 minLength={6}
 className="w-full px-4 py-3 rounded-xl border border-gray-700 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
 required
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-900/50 active:scale-[0.98]"
 >
 {loading ? (
 <span className="animate-pulse">Procesando...</span>
 ) : mode === 'login' ? (
 <><LogIn className="w-5 h-5"/> Iniciar Sesión</>
 ) : (
 <><UserPlus className="w-5 h-5"/> Crear Cuenta</>
 )}
 </button>

 {/* Forgot password */}
 {mode === 'login' && !resetSent && (
 <div className="text-center">
 <button
 type="button"
 onClick={async () => {
 if (!email.trim()) {
 setError('Ingresa tu correo electrónico primero');
 return;
 }
 setError('');
 setLoading(true);
 try {
 await resetPassword(email);
 setResetSent(true);
 setSuccess('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
 } catch (err: any) {
 const msg = err.code === 'auth/user-not-found'
 ? 'No hay cuenta asociada a este correo'
 : 'Error al enviar correo de recuperación';
 setError(msg);
 } finally {
 setLoading(false);
 }
 }}
 className="text-xs text-gray-400 text-gray-400 hover:text-blue-400 hover:text-blue-400 transition-colors mt-2"
 >
 ¿Olvidaste tu contraseña?
 </button>
 </div>
 )}

 {resetSent && (
 <div className="text-center">
 <button
 type="button"
 onClick={() => { setResetSent(false); setSuccess(''); }}
 className="text-xs text-blue-400 font-medium hover:underline"
 >
 Volver a iniciar sesión
 </button>
 </div>
 )}
 </form>

 {/* Toggle mode */}
 {!resetSent && (
 <div className="mt-4 text-center">
 <p className="text-sm text-gray-400 text-gray-500">
 {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
 <button
 onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
 className="text-blue-400 font-semibold hover:underline"
 >
 {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
 </button>
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
