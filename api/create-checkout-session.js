// /api/create-checkout-session.js
// Crée une session de paiement Stripe pour une réservation donnée.
// La clé secrète Stripe (STRIPE_SECRET_KEY) doit être configurée dans les
// "Environment Variables" du projet Vercel — jamais écrite dans le code.

import Stripe from "stripe";

// Lit et parse manuellement le corps de la requête, indépendamment
// du comportement de parsing automatique de l'environnement Vercel.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ error: "Configuration Stripe manquante côté serveur" });
  }

  const stripe = new Stripe(stripeSecretKey);

  let body;
  try {
    // req.body peut déjà être un objet parsé (comportement standard Vercel),
    // ou rester un flux brut selon la configuration — on gère les deux cas.
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      body = await readJsonBody(req);
    }
  } catch (err) {
    console.error("Erreur de lecture du corps de la requête:", err);
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const { reservationId, montantEuros, emailVoyageur, nomLogement } = body;

  if (!reservationId || !montantEuros || !emailVoyageur) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "sepa_debit", "paypal"],
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
    return res.status(500).json({ error: "Erreur lors de la création du paiement", detail: err.message });
  }
}
