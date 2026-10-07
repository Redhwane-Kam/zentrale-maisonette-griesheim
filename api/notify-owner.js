// /api/notify-owner.js
// Appelée par le formulaire de réservation juste après l'enregistrement
// d'une demande : envoie un email à Mariem pour l'informer qu'une nouvelle
// demande attend sa décision dans /mawka3.
//
// Variable d'environnement nécessaire sur Vercel : RESEND_API_KEY
// (déjà présente — ce fichier ne fait que la réutiliser).

const OWNER_EMAIL = "redhwanekamoun@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  if (!process.env.RESEND_API_KEY) {
    // Pas de clé configurée : on ne bloque jamais la réservation pour autant.
    return res.status(200).json({ sent: false, reason: "RESEND_API_KEY absente" });
  }

  const reservation = req.body;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: [OWNER_EMAIL],
        subject: "Nouvelle demande de réservation — Zentrale Maisonette Griesheim",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Nouvelle demande de réservation</h2>
            <p>Une nouvelle demande vient d'être soumise sur le site. Merci de vous connecter au back-office pour l'étudier et la confirmer ou la refuser.</p>
            <table style="width: 100%; margin: 16px 0; font-size: 14px;">
              <tr><td><strong>Nom</strong></td><td>${reservation.nom || "—"}</td></tr>
              <tr><td><strong>Email</strong></td><td>${reservation.email || "—"}</td></tr>
              <tr><td><strong>Téléphone</strong></td><td>${reservation.telephone || "—"}</td></tr>
              <tr><td><strong>Arrivée</strong></td><td>${reservation.date_arrivee || "—"}</td></tr>
              <tr><td><strong>Départ</strong></td><td>${reservation.date_depart || "—"}</td></tr>
              <tr><td><strong>Voyageurs</strong></td><td>${reservation.nombre_voyageurs || "—"}</td></tr>
            </table>
            <p><a href="https://zentrale-maisonette-griesheim.vercel.app/mawka3">Voir la demande dans le back-office</a></p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend a répondu ${response.status}: ${errorBody}`);
      return res.status(200).json({ sent: false });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    // Une erreur d'envoi ne doit jamais faire échouer la réservation
    // elle-même : on la journalise et on répond 200 quand même.
    console.error("Erreur envoi notification propriétaire:", err);
    return res.status(200).json({ sent: false });
  }
}
