-- Autorise le back-office (utilisateurs connectés) à voir et gérer TOUTES les réservations,
-- y compris les infos personnelles des voyageurs et les changements de statut.

create policy "Lecture complete reservations pour utilisateurs connectés"
on reservations
for select
to authenticated
using (true);

create policy "Modification reservations pour utilisateurs connectés"
on reservations
for update
to authenticated
using (true)
with check (true);
