// Exemple : /api/hello.js devient automatiquement l'URL /api/hello
// Ceci est un test de vérification — à remplacer par la vraie logique Stripe
// lors de l'étape "Paiement" de notre plan.

export default function handler(req, res) {
  res.status(200).json({ message: "API Vercel opérationnelle" });
}
