import React from "react";
import { languages } from "../i18n";
import { useLanguage } from "../i18n/LanguageContext";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switcher" role="group" aria-label="Choix de la langue">
      {languages.map((l) => (
        <button
          key={l.code}
          className={`lang-btn ${lang === l.code ? "active" : ""}`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
