// /api/generate-invoice.js
// Génère la facture PDF d'une réservation et la renvoie directement en téléchargement.
// Accès protégé : nécessite un token de session Supabase valide.

import { createClient } from "@supabase/supabase-js";
import { generateInvoicePdf } from "../src/lib/invoicePdf.js";

// Clé anon publique — utilisée uniquement pour vérifier la validité d'un token de session.
// Ce n'est pas un secret : c'est la même clé que celle utilisée côté site public.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Z2d4bnBta2Zsd21mYnNzb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODQ3OTEsImV4cCI6MjEwNDU2MDc5MX0.v-yLqA71YU_IPHOhDKzX-GghYP75loBprzMpLn-DoC0";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Client "anon" dédié à la vérification du token de session envoyé par le navigateur
  const supabaseAuth = createClient(process.env.SUPABASE_URL, SUPABASE_ANON_KEY);

  // Client "service_role" pour les opérations privilégiées (lecture de la réservation)
  const supabaseAdmin = createClient(
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
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    console.error("Erreur vérification session:", userError);
    return res.status(401).json({ error: "Session invalide", detail: userError?.message });
  }

  const { data: reservation, error: fetchError } = await supabaseAdmin
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
