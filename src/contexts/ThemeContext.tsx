import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'default' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'braincash-theme';

interface ThemeContextType {
    theme: ThemeId;
    setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeId>(() => {
        if (typeof window === 'undefined') return 'default';
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
        if (stored === 'default' || stored === 'light' || stored === 'dark') return stored;
        return 'default';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-default', 'theme-light', 'theme-dark');
        root.classList.add(`theme-${theme}`);
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const setTheme = (newTheme: ThemeId) => setThemeState(newTheme);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
