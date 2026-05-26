import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
 signInWithEmailAndPassword,
 createUserWithEmailAndPassword,
 signOut,
 onAuthStateChanged,
 updateProfile,
 sendPasswordResetEmail,
 deleteUser,
 EmailAuthProvider,
 reauthenticateWithCredential,
 updatePassword,
 setPersistence,
 browserLocalPersistence,
 browserSessionPersistence,
 signInWithPopup,
 GoogleAuthProvider,
 type User,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDB, isFirebaseConfigured } from '../firebase/config';

interface AuthContextValue {
 user: User | null;
 loading: boolean;
 firebaseReady: boolean;
 isDemo: boolean;
 login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
 register: (email: string, password: string, name: string) => Promise<void>;
 logout: () => Promise<void>;
 resetPassword: (email: string) => Promise<void>;
 deleteAccount: (password: string) => Promise<void>;
 changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
 loginWithGoogle: () => Promise<void>;
 loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER_KEY = 'diabetes-app-demo-user';

function getDemoUser(): User | null {
 try {
 const data = localStorage.getItem(DEMO_USER_KEY);
 return data ? JSON.parse(data) : null;
 } catch {
 return null;
 }
}

function saveDemoUser() {
 localStorage.setItem(DEMO_USER_KEY, JSON.stringify({
 uid: 'demo-user',
 email: 'demo@diabetescontrol.app',
 displayName: 'Usuario Demo',
 isDemo: true,
 }));
}

function clearDemoUser() {
 localStorage.removeItem(DEMO_USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);
 const [isDemo, setIsDemo] = useState(false);
 const firebaseReady = isFirebaseConfigured();

 useEffect(() => {
 if (!firebaseReady) {
 // Si Firebase no está configurado, verificar demo user
 const demoUser = getDemoUser();
 if (demoUser) {
 setUser(demoUser as any);
 setIsDemo(true);
 }
 setLoading(false);
 return;
 }
 const auth = getFirebaseAuth();
 const unsub = onAuthStateChanged(auth, (user) => {
 if (user) {
 setUser(user);
 setIsDemo(false);
 } else {
 // Si no hay usuario de Firebase, verificar demo
 const demoUser = getDemoUser();
 if (demoUser) {
 setUser(demoUser as any);
 setIsDemo(true);
 } else {
 setUser(null);
 setIsDemo(false);
 }
 }
 setLoading(false);
 });
 return unsub;
 }, [firebaseReady]);

 const login = async (email: string, password: string, rememberMe: boolean = true) => {
 const auth = getFirebaseAuth();
 await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
 await signInWithEmailAndPassword(auth, email, password);
 };

 const register = async (email: string, password: string, name: string) => {
 const auth = getFirebaseAuth();
 const result = await createUserWithEmailAndPassword(auth, email, password);
 await updateProfile(result.user, { displayName: name });
 // Create user document in Firestore
 try {
 const db = getFirestoreDB();
 await setDoc(doc(db, 'users', result.user.uid), {
 name,
 email,
 createdAt: new Date().toISOString(),
 });
 } catch (err) {
 console.warn('Error creating user doc:', err);
 }
 };

 const logout = async () => {
 if (isDemo) {
 clearDemoUser();
 setUser(null);
 setIsDemo(false);
 return;
 }
 const auth = getFirebaseAuth();
 await signOut(auth);
 };

 const resetPassword = async (email: string) => {
 const auth = getFirebaseAuth();
 await sendPasswordResetEmail(auth, email);
 };

 const deleteAccount = async (password: string) => {
 const auth = getFirebaseAuth();
 const currentUser = auth.currentUser;
 if (!currentUser || !currentUser.email) {
 throw new Error('No hay usuario autenticado');
 }

 // Re-autenticar antes de eliminar
 const credential = EmailAuthProvider.credential(currentUser.email, password);
 await reauthenticateWithCredential(currentUser, credential);

 // Eliminar datos de Firestore
 try {
 const db = getFirestoreDB();
 const uid = currentUser.uid;
 const subcollections = ['medications', 'reminders', 'glucose', 'profile'];
 await Promise.allSettled(
 subcollections.map(col => deleteDoc(doc(db, 'users', uid, col, 'all')))
 );
 // Eliminar el documento del usuario
 await deleteDoc(doc(db, 'users', uid));
 } catch (err) {
 console.warn('Error eliminando datos de Firestore:', err);
 }

 // Eliminar datos locales
 try {
 const keysToRemove = [
 'diabetes-app-entries',
 'diabetes-app-profile',
 'diabetes-app-medications',
 'diabetes-app-reminders',
 ];
 keysToRemove.forEach(key => localStorage.removeItem(key));
 } catch {}

 // Eliminar la cuenta de Firebase Auth
 await deleteUser(currentUser);
 };

 const changePassword = async (currentPassword: string, newPassword: string) => {
 const auth = getFirebaseAuth();
 const currentUser = auth.currentUser;
 if (!currentUser || !currentUser.email) {
 throw new Error('No hay usuario autenticado');
 }
 // Re-autenticar antes de cambiar contraseña
 const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
 await reauthenticateWithCredential(currentUser, credential);
 await updatePassword(currentUser, newPassword);
 };

 const loginWithGoogle = async () => {
 const auth = getFirebaseAuth();
 const provider = new GoogleAuthProvider();
 await signInWithPopup(auth, provider);
 };

 const loginAsDemo = async () => {
 // Si ya hay sesión de Firebase, cerrarla primero
 if (firebaseReady) {
 try {
 const auth = getFirebaseAuth();
 await signOut(auth);
 } catch {}
 }
 saveDemoUser();
 setIsDemo(true);
 setUser(getDemoUser() as any);
 };

 return (
 <AuthContext.Provider value={{ user, loading, firebaseReady, isDemo, login, register, logout, resetPassword, deleteAccount, changePassword, loginWithGoogle, loginAsDemo }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth(): AuthContextValue {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
 return ctx;
}
