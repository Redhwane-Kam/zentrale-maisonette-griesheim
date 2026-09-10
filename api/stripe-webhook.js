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
      const { error } = await supabase
        .from("reservations")
        .update({ status: "confirmee", updated_at: new Date().toISOString() })
        .eq("id", reservationId);

      if (error) {
        console.error("Erreur mise à jour réservation:", error);
        return res.status(500).json({ error: "Erreur base de données" });
      }
    }
  }

  return res.status(200).json({ received: true });
}
