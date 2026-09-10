// src/lib/pricing.js
// Centralise toute la logique de prix et de conditions d'annulation,
// pour que le formulaire, le back-office et les factures utilisent
// toujours exactement les mêmes règles.

export const PRIX_PAR_NUIT = 110;
export const SEUIL_LONG_SEJOUR = 28; // nuits

export function calculerNombreNuits(dateArriveeStr, dateDepartStr) {
  if (!dateArriveeStr || !dateDepartStr) return 0;
  const diff = new Date(dateDepartStr) - new Date(dateArriveeStr);
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function estLongSejour(nombreNuits) {
  return nombreNuits >= SEUIL_LONG_SEJOUR;
}

/**
 * Calcule le prix total.
 * remisePourcentage : 0, 5 ou 10 — réservé au back-office (client de confiance)
 * tarifNonRemboursable : réduction de 10%, choisie par le voyageur, séjours courts uniquement
 */
export function calculerPrixTotal({ nombreNuits, remisePourcentage = 0, tarifNonRemboursable = false }) {
  let prix = nombreNuits * PRIX_PAR_NUIT;

  if (tarifNonRemboursable && !estLongSejour(nombreNuits)) {
    prix = prix * 0.9; // -10%
  }

  if (remisePourcentage > 0) {
    prix = prix * (1 - remisePourcentage / 100);
  }

  return Math.round(prix * 100) / 100; // arrondi à 2 décimales
}

/**
 * Détermine le pourcentage remboursable si le voyageur annule aujourd'hui.
 * Retourne un nombre entre 0 et 100.
 */
export function calculerRemboursement({ dateArriveeStr, dateAnnulationStr, nombreNuits, tarifNonRemboursable }) {
  if (tarifNonRemboursable) {
    return 0; // le voyageur a accepté l'absence de remboursement en échange de -10%
  }

  const joursAvantArrivee = Math.round(
    (new Date(dateArriveeStr) - new Date(dateAnnulationStr)) / (1000 * 60 * 60 * 24)
  );

  if (estLongSejour(nombreNuits)) {
    // Séjour long (28 nuits ou plus)
    if (joursAvantArrivee >= 30) return 100;
    // Moins de 30 jours avant l'arrivée : les 30 premières nuits ne sont pas remboursables.
    // On calcule la part remboursable proportionnellement au reste du séjour.
    const nuitsNonRemboursables = Math.min(30, nombreNuits);
    const nuitsRemboursables = Math.max(0, nombreNuits - nuitsNonRemboursables);
    return Math.round((nuitsRemboursables / nombreNuits) * 100);
  }

  // Séjour court (< 28 nuits)
  if (joursAvantArrivee >= 14) return 100;
  if (joursAvantArrivee >= 7) return 50; // "remboursement partiel" — 50% par défaut, ajustable avec votre fille
  return 0;
}
