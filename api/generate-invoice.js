// /api/generate-invoice.js
// Génère la facture PDF d'une réservation et la renvoie directement en téléchargement.
// Accès protégé : nécessite un token de session Supabase valide.
//
// La logique de génération PDF est intégrée directement dans ce fichier
// (plutôt qu'importée depuis /src) pour éviter tout problème de résolution
// de module cross-dossier lors du build des fonctions serverless Vercel.

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Clé anon publique — utilisée uniquement pour vérifier la validité d'un token de session.
// Ce n'est pas un secret : c'est la même clé que celle utilisée côté site public.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Z2d4bnBta2Zsd21mYnNzb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODQ3OTEsImV4cCI6MjEwNDU2MDc5MX0.v-yLqA71YU_IPHOhDKzX-GghYP75loBprzMpLn-DoC0";

const COLORS = {
  darkHeader: rgb(0.106, 0.122, 0.176),   // bleu-nuit du bandeau LEISTUNG
  gold: rgb(0.808, 0.639, 0.322),          // bandeau du montant total
  grayBg: rgb(0.95, 0.95, 0.96),           // bloc destinataire
  textDark: rgb(0.12, 0.12, 0.14),
  textGray: rgb(0.45, 0.45, 0.48),
  white: rgb(1, 1, 1),
  borderGray: rgb(0.85, 0.85, 0.87)
};

const EMETTEUR = {
  nom: "MARIEM GUEST SERVICES",
  sousTitre: "Zentrale Maisonette mit Büro & Parkplatz",
  contactNom: "Mariem Kammoun",
  adresse: ["Wilhelm-Leuschner-Straße 8", "64347 Griesheim", "Deutschland"],
  tel: "015755141663",
  email: "mariemguestservices@gmail.com",
  bookingId: "12727839"
};

function formatDateDE(dateStr) {
  if (!dateStr) return "TT.MM.JJJJ";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function formatEuro(n) {
  return `${Number(n).toFixed(2).replace(".", ",")} €`;
}

/**
 * Génère le PDF de facture en mémoire (Uint8Array), prêt à être renvoyé
 * par une fonction API ou téléchargé côté client.
 *
 * reservation : objet issu de la table `reservations`
 * options.numeroFacture : numéro saisi manuellement par la fille (ex: "RE-2026-0001")
 * options.dateFacture : date d'émission (YYYY-MM-DD), aujourd'hui par défaut
 */
export async function generateInvoicePdf(reservation, options = {}) {
  const numeroFacture = options.numeroFacture || "RE-XXXX-0000";
  const dateFacture = options.dateFacture || new Date().toISOString().split("T")[0];

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginX = 50;
  let y = height - 50;

  function text(str, x, yPos, { font = fontRegular, size = 10, color = COLORS.textDark } = {}) {
    page.drawText(str, { x, y: yPos, font, size, color });
  }

  function line(x1, y1, x2, y2, color = COLORS.borderGray, thickness = 1) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  }

  // --- En-tête : émetteur (gauche) / titre RECHNUNG (droite) ---
  text(EMETTEUR.nom, marginX, y, { font: fontBold, size: 13 });
  text(EMETTEUR.sousTitre, marginX, y - 15, { size: 9, color: COLORS.textGray });

  text("RECHNUNG", width - marginX - 90, y, { font: fontBold, size: 13 });
  text("Privatvermietung", width - marginX - 90, y - 15, { size: 9, color: COLORS.textGray });

  y -= 30;
  line(marginX, y, width - marginX, y, COLORS.textDark, 1.5);
  y -= 30;

  // --- Bloc émetteur (gauche) ---
  let leftY = y;
  text(EMETTEUR.contactNom, marginX, leftY, { font: fontBold, size: 10 });
  leftY -= 14;
  EMETTEUR.adresse.forEach((ligne) => {
    text(ligne, marginX, leftY, { size: 9.5 });
    leftY -= 13;
  });
  leftY -= 8;
  text(`Tel.: ${EMETTEUR.tel}`, marginX, leftY, { size: 9.5 });
  leftY -= 13;
  text(`E-Mail: ${EMETTEUR.email}`, marginX, leftY, { size: 9.5 });
  leftY -= 13;
  text(`Booking.com Unterkunftsnummer: ${EMETTEUR.bookingId}`, marginX, leftY, { size: 9.5 });

  // --- Bloc droit : Rechnungsnummer / datum / Leistungszeitraum ---
  const rightX = width - marginX - 170;
  let rightY = y;
  text("Rechnungsnummer", rightX, rightY, { font: fontBold, size: 9.5 });
  text(numeroFacture, rightX, rightY - 13, { size: 9.5, color: COLORS.textGray });
  rightY -= 36;
  text("Rechnungsdatum", rightX, rightY, { font: fontBold, size: 9.5 });
  text(formatDateDE(dateFacture), rightX, rightY - 13, { size: 9.5, color: COLORS.textGray });
  rightY -= 36;
  text("Leistungszeitraum", rightX, rightY, { font: fontBold, size: 9.5 });
  text(
    `${formatDateDE(reservation.date_arrivee)} - ${formatDateDE(reservation.date_depart)}`,
    rightX,
    rightY - 13,
    { size: 9.5, color: COLORS.textGray }
  );

  y = Math.min(leftY, rightY) - 30;

  // --- Bloc destinataire (RECHNUNGSEMPFÄNGER) ---
  text("RECHNUNGSEMPFÄNGER", marginX, y, { font: fontBold, size: 9, color: COLORS.textGray });
  y -= 16;

  const destBoxHeight = 70;
  page.drawRectangle({
    x: marginX,
    y: y - destBoxHeight + 10,
    width: width - marginX * 2,
    height: destBoxHeight,
    color: COLORS.grayBg
  });

  let destY = y - 8;
  text(reservation.nom_voyageur || "—", marginX + 14, destY, { font: fontBold, size: 10 });
  destY -= 15;
  text(reservation.email_voyageur || "", marginX + 14, destY, { size: 9.5 });
  destY -= 15;
  if (reservation.telephone_voyageur) {
    text(reservation.telephone_voyageur, marginX + 14, destY, { size: 9.5 });
  }

  y -= destBoxHeight + 20;

  // --- Tableau infos réservation (2 colonnes x 3 lignes) ---
  const tableTop = y;
  const rowH = 34;
  const col1X = marginX;
  const col2X = marginX + (width - marginX * 2) / 2;
  const colW = (width - marginX * 2) / 2;

  const infoRows = [
    ["Reservierungsnummer", reservation.id ? reservation.id.slice(0, 8).toUpperCase() : "—", "Name des Gastes", reservation.nom_voyageur || "—"],
    ["Check-in", formatDateDE(reservation.date_arrivee), "Check-out", formatDateDE(reservation.date_depart)],
    ["Übernachtungen", `${nombreNuitsEntre(reservation.date_arrivee, reservation.date_depart)} Nächte`, "Anzahl Gäste", `${reservation.nombre_voyageurs || "—"} Personen`]
  ];

  let rowY = tableTop;
  infoRows.forEach((row) => {
    page.drawRectangle({
      x: marginX, y: rowY - rowH, width: width - marginX * 2, height: rowH,
      borderColor: COLORS.borderGray, borderWidth: 1
    });
    line(col2X, rowY, col2X, rowY - rowH);

    text(row[0], col1X + 10, rowY - 12, { font: fontBold, size: 8.5 });
    text(row[1], col1X + 10, rowY - 24, { size: 9.5, color: COLORS.textGray });
    text(row[2], col2X + 10, rowY - 12, { font: fontBold, size: 8.5 });
    text(row[3], col2X + 10, rowY - 24, { size: 9.5, color: COLORS.textGray });

    rowY -= rowH;
  });

  y = rowY - 25;

  // --- Tableau prestation (LEISTUNG) ---
  const nuits = nombreNuitsEntre(reservation.date_arrivee, reservation.date_depart);
  const prixUnitaire = nuits > 0 ? (reservation.prix_total || 0) / nuits : 0;

  const theadH = 26;
  page.drawRectangle({ x: marginX, y: y - theadH, width: width - marginX * 2, height: theadH, color: COLORS.darkHeader });
  text("LEISTUNG", marginX + 10, y - 17, { font: fontBold, size: 9, color: COLORS.white });
  text("MENGE", marginX + 260, y - 17, { font: fontBold, size: 9, color: COLORS.white });
  text("EINZELPREIS", marginX + 330, y - 17, { font: fontBold, size: 9, color: COLORS.white });
  text("GESAMT", width - marginX - 60, y - 17, { font: fontBold, size: 9, color: COLORS.white });

  y -= theadH;
  const rowLeistungH = 40;
  page.drawRectangle({
    x: marginX, y: y - rowLeistungH, width: width - marginX * 2, height: rowLeistungH,
    borderColor: COLORS.borderGray, borderWidth: 1
  });
  text("Übernachtung / kurzfristige Vermietung der Maisonette", marginX + 10, y - 16, { size: 9 });
  text(
    `Leistungszeitraum: ${formatDateDE(reservation.date_arrivee)} - ${formatDateDE(reservation.date_depart)}`,
    marginX + 10, y - 29, { size: 8, color: COLORS.textGray }
  );
  text(`${nuits} Nächte`, marginX + 260, y - 20, { size: 9 });
  text(formatEuro(prixUnitaire), marginX + 330, y - 20, { size: 9 });
  text(formatEuro(reservation.prix_total || 0), width - marginX - 70, y - 20, { font: fontBold, size: 9 });

  y -= rowLeistungH + 15;

  // --- Bandeau total (RECHNUNGSBETRAG) ---
  const totalH = 34;
  page.drawRectangle({ x: marginX, y: y - totalH, width: width - marginX * 2, height: totalH, color: COLORS.gold });
  text("RECHNUNGSBETRAG", marginX + 12, y - 22, { font: fontBold, size: 11, color: COLORS.textDark });
  const totalStr = formatEuro(reservation.prix_total || 0);
  text(totalStr, width - marginX - 12 - totalStr.length * 6.5, y - 22, { font: fontBold, size: 13, color: COLORS.textDark });

  y -= totalH + 25;

  // --- Statut de paiement ---
  page.drawRectangle({
    x: marginX, y: y - 55, width: width - marginX * 2, height: 55,
    borderColor: COLORS.borderGray, borderWidth: 1
  });
  text("ZAHLUNGSSTATUS", marginX + 10, y - 16, { font: fontBold, size: 9.5 });
  const statutTexte = reservation.status === "confirmee"
    ? `Bereits bezahlt (${reservation.source || "Direktzahlung"}) am ${formatDateDE(dateFacture)}.`
    : "Zahlungsstatus: ausstehend.";
  text(statutTexte, marginX + 10, y - 32, { size: 9 });
  text("Diese Rechnung dient als Zahlungs- und Leistungsnachweis.", marginX + 10, y - 45, { size: 9 });

  y -= 55 + 20;

  // --- Mention légale privée ---
  text("Hinweis zur Privatvermietung", marginX, y, { font: fontBold, size: 9 });
  text(
    "Die Rechnung wird im Rahmen der privaten Vermietung ausgestellt. Ein gesonderter Umsatzsteuerausweis erfolgt nicht.",
    marginX, y - 13, { size: 8.5, color: COLORS.textGray }
  );

  // --- Pied de page ---
  const footerY = 60;
  const footerLineY = footerY + 20;
  line(marginX, footerLineY, width - marginX, footerLineY);
  text("Mariem Guest Services", marginX, footerY, { font: fontBold, size: 8.5 });
  text(
    `Mariem Kammoun · Wilhelm-Leuschner-Straße 8 · 64347 Griesheim`,
    marginX, footerY - 12, { size: 8, color: COLORS.textGray }
  );
  text(EMETTEUR.email, width - marginX - 150, footerY, { size: 8 });
  text(EMETTEUR.tel, width - marginX - 150, footerY - 12, { size: 8 });

  return pdfDoc.save();
}

function nombreNuitsEntre(dateArriveeStr, dateDepartStr) {
  if (!dateArriveeStr || !dateDepartStr) return 0;
  const [y1, m1, d1] = dateArriveeStr.split("-").map(Number);
  const [y2, m2, d2] = dateDepartStr.split("-").map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

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
    return res.status(500).json({ error: "Erreur lors de la génération du PDF", detail: err.message, stack: err.stack });
  }
}
