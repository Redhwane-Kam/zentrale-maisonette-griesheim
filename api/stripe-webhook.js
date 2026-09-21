// /api/stripe-webhook.js
// Stripe appelle cette URL automatiquement quand un paiement est confirmé.
// C'est ICI, et seulement ici, qu'une réservation passe de "en_attente" à "confirmee".
//
// Variables d'environnement nécessaires sur Vercel :
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   (fourni par Stripe lors de la création du webhook)
//   SUPABASE_SERVICE_ROLE_KEY  (clé privée, jamais utilisée côté site public)

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false // Stripe a besoin du corps brut de la requête pour vérifier la signature
  }
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Signature webhook invalide:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const reservationId = session.metadata?.reservation_id;

    if (reservationId) {
      const { data: updatedReservation, error } = await supabase
        .from("reservations")
        .update({ status: "confirmee", updated_at: new Date().toISOString() })
        .eq("id", reservationId)
        .select()
        .single();

      if (error) {
        console.error("Erreur mise à jour réservation:", error);
        return res.status(500).json({ error: "Erreur base de données" });
      }

      // Envoi de l'email de confirmation au client — une erreur ici ne doit
      // jamais faire échouer la confirmation de la réservation elle-même,
      // donc elle est isolée dans son propre bloc try/catch.
      if (updatedReservation?.email_voyageur && process.env.RESEND_API_KEY) {
        try {
          await sendConfirmationEmail(updatedReservation);
        } catch (emailErr) {
          console.error("Erreur envoi email de confirmation:", emailErr);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}

async function sendConfirmationEmail(reservation) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [reservation.email_voyageur],
      subject: "Réservation confirmée — Zentrale Maisonette Griesheim",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Votre réservation est confirmée !</h2>
          <p>Bonjour ${reservation.nom_voyageur || ""},</p>
          <p>Nous vous confirmons que votre paiement a bien été reçu et que votre réservation est validée.</p>
          <table style="width: 100%; margin: 16px 0; font-size: 14px;">
            <tr><td><strong>Arrivée</strong></td><td>${reservation.date_arrivee}</td></tr>
            <tr><td><strong>Départ</strong></td><td>${reservation.date_depart}</td></tr>
            <tr><td><strong>Voyageurs</strong></td><td>${reservation.nombre_voyageurs || "—"}</td></tr>
            <tr><td><strong>Montant</strong></td><td>${reservation.prix_total || "—"}€</td></tr>
          </table>
          <p>Nous avons hâte de vous accueillir !</p>
          <p style="color: #777; font-size: 12px;">Mariem Guest Services — Zentrale Maisonette Griesheim</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend a répondu ${response.status}: ${errorBody}`);
  }
}
