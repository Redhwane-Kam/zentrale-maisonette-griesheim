// /api/generate-invoice.js
// Génère la facture PDF d'une réservation et la renvoie directement en téléchargement.
// Accès protégé : nécessite un token de session Supabase valide (vérifié via la clé service_role).

import { createClient } from "@supabase/supabase-js";
import { generateInvoicePdf } from "../src/lib/invoicePdf.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let body;
  try {
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      let data = "";
      for await (const chunk of req) data += chunk;
      body = data ? JSON.parse(data) : {};
    }
  } catch (err) {
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const { reservationId, numeroFacture, accessToken } = body;

  if (!reservationId) {
    return res.status(400).json({ error: "reservationId requis" });
  }

  // Vérifie que la requête provient bien d'une session admin valide
  if (!accessToken) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Session invalide" });
  }

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .single();

  if (fetchError || !reservation) {
    return res.status(404).json({ error: "Réservation introuvable" });
  }

  try {
    const pdfBytes = await generateInvoicePdf(reservation, { numeroFacture });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Rechnung-${numeroFacture || reservationId.slice(0, 8)}.pdf"`
    );
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Erreur génération PDF:", err);
    return res.status(500).json({ error: "Erreur lors de la génération du PDF", detail: err.message });
  }
}
