-- Ajoute les colonnes nécessaires pour la vérification d'identité à l'arrivée
-- (sans paiement électronique ni upload de copie de pièce).

ALTER TABLE reservations
  ADD COLUMN type_piece_identite text,
  ADD COLUMN numero_piece_identite text,
  ADD COLUMN consentement_rgpd boolean DEFAULT false;
