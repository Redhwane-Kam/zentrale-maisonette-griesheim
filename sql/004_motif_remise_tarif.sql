-- Ajouts à la table reservations pour :
--   - le message de motivation du voyageur (façon Airbnb)
--   - la réduction "client de confiance" (appliquée manuellement par l'hôte, jamais par le voyageur)
--   - l'option tarif non-remboursable (réduction 10%, uniquement séjours courts <28 nuits)

alter table reservations
  add column message_voyageur text,
  add column remise_pourcentage numeric not null default 0,
  add column tarif_non_remboursable boolean not null default false;

alter table reservations
  add constraint remise_valide check (remise_pourcentage in (0, 5, 10));

-- La remise "client de confiance" ne doit être modifiable que depuis le back-office (service_role),
-- jamais par le formulaire public. On s'assure qu'un visiteur ne peut pas l'insérer directement :
-- (la policy d'insertion publique existante limite déjà status='en_attente' ;
--  on ajoute ici la contrainte qu'une insertion publique ne peut pas fixer de remise)

drop policy if exists "Creation publique en attente" on reservations;

create policy "Creation publique en attente"
on reservations
for insert
to anon
with check (
  status = 'en_attente'
  and remise_pourcentage = 0
  and tarif_non_remboursable in (true, false) -- le voyageur PEUT choisir cette option, elle est publique
);
