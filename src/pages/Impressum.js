import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./Impressum.css";

export default function Impressum() {
  const { t } = useLanguage();

  return (
    <div className="impressum-page">
      <header className="site-header">
        <a href="/" className="logo">Zentrale Maisonette Griesheim</a>
        <LanguageSwitcher />
      </header>

      <main className="impressum-content">
        <h1>{t.impressum.title}</h1>

        <section>
          <h2>{t.impressum.responsibleTitle}</h2>
          <p>Mariem Kammoun</p>
          <p>Wilhelm-Leuschner-Straße 8</p>
          <p>64347 Griesheim</p>
          <p>Deutschland</p>
        </section>

        <section>
          <h2>{t.impressum.contactTitle}</h2>
          <p>
            {t.contact.phoneLabel}:{" "}
            <a href="tel:015755141663">015755141663</a>
          </p>
          <p>
            {t.contact.emailLabel}:{" "}
            <a href="mailto:mariemguestservices@gmail.com">mariemguestservices@gmail.com</a>
          </p>
        </section>

        <section>
          <h2>{t.impressum.responsibilityTitle}</h2>
          <p>{t.impressum.responsibilityText}</p>
        </section>

        <section>
          <h2>{t.impressum.disputeTitle}</h2>
          <p>{t.impressum.disputeText}</p>
        </section>

        <p className="impressum-back">
          <a href="/">← {t.impressum.backLink}</a>
        </p>
      </main>
    </div>
  );
}
