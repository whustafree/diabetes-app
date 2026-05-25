import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirestoreDB, isFirebaseConfigured } from '../firebase/config';

const THEME_SYNC_KEY = 'diabetes-app-theme-synced';

type Theme = 'light' | 'dark';

/**
 * Save theme preference to Firestore under users/{uid}/preferences/theme
 */
export async function saveThemeToCloud(uid: string, theme: Theme): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  try {
    const db = getFirestoreDB();
    await setDoc(doc(db, 'users', uid, 'preferences', 'theme'), {
      theme,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    localStorage.setItem(THEME_SYNC_KEY, 'true');
    return true;
  } catch (err) {
    console.warn('[ThemeSync] Error saving theme to Firestore:', err);
    return false;
  }
}

/**
 * Load theme preference from Firestore
 */
export async function loadThemeFromCloud(uid: string): Promise<Theme | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const db = getFirestoreDB();
    const snap = await getDoc(doc(db, 'users', uid, 'preferences', 'theme'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.theme === 'dark' || data.theme === 'light') {
        return data.theme;
      }
    }
    return null;
  } catch (err) {
    console.warn('[ThemeSync] Error loading theme from Firestore:', err);
    return null;
  }
}

/**
 * Check if theme has been synced before
 */
export function hasSyncedTheme(): boolean {
  return localStorage.getItem(THEME_SYNC_KEY) === 'true';
}
