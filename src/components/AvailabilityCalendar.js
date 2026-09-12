import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import "./AvailabilityCalendar.css";

const MONTH_NAMES = {
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

const DAY_NAMES = {
  fr: ["L","M","M","J","V","S","D"],
  de: ["M","D","M","D","F","S","S"],
  en: ["M","T","W","T","F","S","S"]
};

// Construit une clé "YYYY-MM-DD" à partir d'année/mois/jour locaux,
// sans jamais passer par Date.toISOString() (qui convertit en UTC
// et peut décaler la date d'un jour selon le fuseau horaire du visiteur).
function makeDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Ajoute des jours à une clé "YYYY-MM-DD" en restant en arithmétique
// de date pure (UTC neutre), pour éviter tout glissement de fuseau.
function addDaysToKey(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  const yy = utcDate.getUTCFullYear();
  const mm = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Lundi = 0 ... Dimanche = 6
function getFirstWeekdayOffset(year, month) {
  const day = new Date(year, month, 1).getDay(); // Dimanche = 0
  return (day + 6) % 7;
}

export default function AvailabilityCalendar() {
  const { lang, t } = useLanguage();

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [blockedDates, setBlockedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlockedDates() {
      setLoading(true);

      const { data, error } = await supabase
        .from("reservations")
        .select("date_arrivee, date_depart")
        .in("status", ["confirmee", "bloquee"]);

      if (!isMounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Convention choisie : le jour d'ARRIVÉE est marqué occupé,
      // le jour de DÉPART reste disponible (le logement se libère ce jour-là).
      // date_arrivee et date_depart arrivent de Supabase au format "YYYY-MM-DD".
      const dates = new Set();
      (data || []).forEach((res) => {
        let cursor = res.date_arrivee; // ex: "2026-09-19"
        const end = res.date_depart;   // ex: "2026-09-20"
        while (cursor < end) {
          dates.add(cursor);
          cursor = addDaysToKey(cursor, 1);
        }
      });

      setBlockedDates(dates);
      setLoading(false);
    }

    fetchBlockedDates();
    return () => { isMounted = false; };
  }, [viewYear, viewMonth]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstOffset = getFirstWeekdayOffset(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthLabel = `${MONTH_NAMES[lang][viewMonth]} ${viewYear}`;
  const dayLabels = DAY_NAMES[lang];

  const todayKey = makeDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} aria-label="Mois précédent">‹</button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button onClick={goToNextMonth} aria-label="Mois suivant">›</button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {dayLabels.map((d, i) => (
          <div key={i} className="calendar-weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-cell empty" />;

          const key = makeDateKey(viewYear, viewMonth, day);
          const isPast = key < todayKey;
          const isBlocked = blockedDates.has(key);

          let className = "calendar-cell";
          if (isPast) className += " past";
          else if (isBlocked) className += " blocked";
          else className += " available";

          return (
            <div key={i} className={className}>
              {day}
            </div>
          );
        })}
      </div>

      {loading && <p className="calendar-loading">{t.booking.loading}</p>}

      <div className="calendar-legend">
        <span><span className="legend-dot available"></span> {lang === "de" ? "Verfügbar" : lang === "en" ? "Available" : "Disponible"}</span>
        <span><span className="legend-dot blocked"></span> {lang === "de" ? "Belegt" : lang === "en" ? "Booked" : "Réservé"}</span>
      </div>
    </div>
  );
}
