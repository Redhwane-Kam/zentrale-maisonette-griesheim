import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "./ContactBlock.css";

const CONTACT = {
  nom: "Mariem Kammoun",
  adresse: ["Wilhelm-Leuschner-Straße 8", "64347 Griesheim", "Deutschland"],
  tel: "015755141663",
  email: "mariemguestservices@gmail.com"
};

export default function ContactBlock() {
  const { t } = useLanguage();

  return (
    <div className="contact-block">
      <h3>{CONTACT.nom}</h3>
      {CONTACT.adresse.map((ligne, i) => (
        <p key={i}>{ligne}</p>
      ))}
      <p>
        <a href={`tel:${CONTACT.tel.replace(/\s/g, "")}`}>{t.contact.phoneLabel} : {CONTACT.tel}</a>
      </p>
      <p>
        <a href={`mailto:${CONTACT.email}`}>{t.contact.emailLabel} : {CONTACT.email}</a>
      </p>
    </div>
  );
}
