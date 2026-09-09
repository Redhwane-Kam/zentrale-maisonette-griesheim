import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import "./BookingForm.css";

export default function BookingForm() {
  const { t } = useLanguage();

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);

  const [state, setState] = useState("idle"); // idle | loading | unavailable | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    setState("loading");

    try {
      // Vérifie qu'il n'y a pas de réservation confirmée/bloquée qui chevauche ces dates
      const { data: conflicts, error: checkError } = await supabase
        .from("reservations")
        .select("id")
        .in("status", ["confirmee", "bloquee"])
        .lt("date_arrivee", checkout)
        .gt("date_depart", checkin);

      if (checkError) throw checkError;

      if (conflicts && conflicts.length > 0) {
        setState("unavailable");
        return;
      }

      // Crée la réservation en statut "en_attente"
      const { error: insertError } = await supabase.from("reservations").insert({
        date_arrivee: checkin,
        date_depart: checkout,
        nom_voyageur: name,
        email_voyageur: email,
        telephone_voyageur: phone,
        nombre_voyageurs: Number(guests),
        status: "en_attente",
        source: "site"
      });

      if (insertError) throw insertError;

      setState("success");
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="booking-message booking-success">
        {t.booking.success}
      </div>
    );
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h2>{t.booking.title}</h2>

      {/* Alerte toujours visible, avant l'envoi */}
      <div className="booking-alert">
        {t.booking.pendingAlert}
      </div>

      <div className="booking-row">
        <label>
          {t.booking.checkin}
          <input
            type="date"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            required
          />
        </label>
        <label>
          {t.booking.checkout}
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        {t.booking.nameLabel}
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        {t.booking.emailLabel}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label>
        {t.booking.phoneLabel}
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>

      <label>
        {t.booking.guestsLabel}
        <input
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          required
        />
      </label>

      {state === "unavailable" && (
        <div className="booking-message booking-error">{t.booking.unavailable}</div>
      )}
      {state === "error" && (
        <div className="booking-message booking-error">{t.booking.error}</div>
      )}

      <button type="submit" disabled={state === "loading"}>
        {state === "loading" ? t.booking.loading : t.booking.submit}
      </button>
    </form>
  );
}
