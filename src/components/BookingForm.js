import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import {
  calculerNombreNuits,
  calculerPrixTotal,
  estLongSejour,
  PRIX_PAR_NUIT
} from "../lib/pricing";
import "./BookingForm.css";

export default function BookingForm() {
  const { t } = useLanguage();

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [motivation, setMotivation] = useState("");
  const [tarifNonRemboursable, setTarifNonRemboursable] = useState(false);

  const [state, setState] = useState("idle"); // idle | loading | unavailable | success | error

  const nombreNuits = calculerNombreNuits(checkin, checkout);
  const longSejour = estLongSejour(nombreNuits);
  const montantTotal = calculerPrixTotal({
    nombreNuits,
    tarifNonRemboursable: tarifNonRemboursable && !longSejour
  });

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
      const { data: newReservation, error: insertError } = await supabase
        .from("reservations")
        .insert({
          date_arrivee: checkin,
          date_depart: checkout,
          nom_voyageur: name,
          email_voyageur: email,
          telephone_voyageur: phone,
          nombre_voyageurs: Number(guests),
          status: "en_attente",
          source: "site",
          prix_total: montantTotal,
          message_voyageur: motivation,
          tarif_non_remboursable: tarifNonRemboursable && !longSejour
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirige vers le paiement Stripe
      const checkoutResponse = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: newReservation.id,
          montantEuros: montantTotal,
          emailVoyageur: email,
          nomLogement: "Zentrale Maisonette Griesheim"
        })
      });

      const checkoutData = await checkoutResponse.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }

      throw new Error("Impossible de créer le paiement");
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

      <label>
        {t.motivation.label}
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder={t.motivation.placeholder}
          rows={3}
        />
      </label>

      {/* Option tarif non-remboursable : uniquement pour les séjours courts */}
      {nombreNuits > 0 && !longSejour && (
        <label className="booking-checkbox">
          <input
            type="checkbox"
            checked={tarifNonRemboursable}
            onChange={(e) => setTarifNonRemboursable(e.target.checked)}
          />
          {t.cancellation.nonRefundableOption}
        </label>
      )}

      {nombreNuits > 0 && (
        <div className="booking-price">
          {nombreNuits} × {PRIX_PAR_NUIT}€
          {tarifNonRemboursable && !longSejour ? " (−10%)" : ""}
          {" = "}
          <strong>{montantTotal}€</strong>
        </div>
      )}

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
