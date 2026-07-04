import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { translations, TranslationKey, Language } from "@/lib/i18n";

export type Theme = "light" | "dark";

interface AppSettingsContextValue {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleLanguage: () => void;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

const THEME_KEY = "aura:theme";
const LANG_KEY = "aura:language";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "pt";
  const saved = window.localStorage.getItem(LANG_KEY) as Language | null;
  if (saved === "pt" || saved === "en") return saved;
  const nav = window.navigator?.language?.toLowerCase() ?? "pt";
  return nav.startsWith("en") ? "en" : "pt";
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANG_KEY, language);
  }, [language]);

  const value = useMemo<AppSettingsContextValue>(() => ({
    theme,
    language,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setLanguage: setLanguageState,
    toggleLanguage: () => setLanguageState((l) => (l === "pt" ? "en" : "pt")),
    t: (key) => translations[language][key] ?? translations.pt[key] ?? key,
  }), [theme, language]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
}

export function useT() {
  return useAppSettings().t;
}