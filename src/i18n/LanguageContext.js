import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, defaultLanguage } from "./index";

const LanguageContext = createContext(null);

const STORAGE_KEY = "site_lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && translations[saved] ? saved : defaultLanguage;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage doit être utilisé à l'intérieur de <LanguageProvider>");
  }
  return ctx;
}
