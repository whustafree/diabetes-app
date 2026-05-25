import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast';

const THEMES: Theme[] = ['light', 'dark', 'sepia', 'high-contrast'];

const THEME_META: Record<Theme, {
  icon: string;
  label: string;
  metaColor: string;
  description: string;
}> = {
  light: {
    icon: '☀️',
    label: 'Claro',
    metaColor: '#2563eb',
    description: 'Tema claro clásico',
  },
  dark: {
    icon: '🌙',
    label: 'Oscuro',
    metaColor: '#0f172a',
    description: 'Tema oscuro por defecto',
  },
  sepia: {
    icon: '🟫',
    label: 'Sepia',
    metaColor: '#d4c5a9',
    description: 'Tono cálido y suave para reducir fatiga visual',
  },
  'high-contrast': {
    icon: '🔲',
    label: 'Alto contraste',
    metaColor: '#000000',
    description: 'Máximo contraste para mejor legibilidad',
  },
};

export { THEMES, THEME_META };

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isDark: boolean;
  themeMeta: typeof THEME_META[Theme];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'diabetes-app-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && THEMES.includes(stored as Theme)) return stored as Theme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes/attributes
    root.classList.remove('dark');
    root.removeAttribute('data-theme');

    // Apply theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia' || theme === 'high-contrast') {
      root.setAttribute('data-theme', theme);
      // These themes also benefit from dark mode base
      root.classList.add('dark');
    }

    localStorage.setItem(THEME_KEY, theme);
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', THEME_META[theme]?.metaColor || '#2563eb');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const cycleTheme = () => {
    setTheme(prev => {
      const idx = THEMES.indexOf(prev);
      return THEMES[(idx + 1) % THEMES.length];
    });
  };

  const themeMeta = THEME_META[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, cycleTheme, isDark, themeMeta }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
