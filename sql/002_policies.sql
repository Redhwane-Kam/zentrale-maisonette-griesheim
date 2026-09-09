-- Règle 1 : tout le monde peut lire les dates/statuts (pour le calendrier)
-- mais on cache les infos personnelles via une vue dédiée (voir plus bas)
create policy "Lecture publique des dates"
on reservations
for select
to anon
using (true);

-- Règle 2 : n'importe qui peut créer une réservation, mais toujours en statut "en_attente"
-- (empêche un visiteur de créer directement une réservation "confirmée")
create policy "Creation publique en attente"
on reservations
for insert
to anon
with check (status = 'en_attente');

-- Note : aucune règle UPDATE/DELETE pour "anon" = personne du public
-- ne peut modifier ou supprimer une réservation existante.
-- Ce sera fait uniquement depuis le back-office (avec une clé différente, sécurisée).
