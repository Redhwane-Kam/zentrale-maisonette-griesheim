// /api/create-checkout-session.js
// Crée une session de paiement Stripe pour une réservation donnée.
// La clé secrète Stripe (STRIPE_SECRET_KEY) doit être configurée dans les
// "Environment Variables" du projet Vercel — jamais écrite dans le code.

import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Configuration Stripe manquante côté serveur" });
  }

  const stripe = new Stripe(stripeSecretKey);

  const { reservationId, montantEuros, emailVoyageur, nomLogement } = req.body;

  if (!reservationId || !montantEuros || !emailVoyageur) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "sepa_debit", "paypal", "giropay", "klarna"],
      customer_email: emailVoyageur,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: nomLogement || "Réservation logement"
            },
            unit_amount: Math.round(montantEuros * 100) // Stripe attend des centimes
          },
          quantity: 1
        }
      ],
      metadata: {
        reservation_id: reservationId
      },
      success_url: `${req.headers.origin}/?paiement=succes`,
      cancel_url: `${req.headers.origin}/?paiement=annule`
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe:", err);
    return res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
}
