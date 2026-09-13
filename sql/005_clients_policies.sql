-- Autorise le back-office (utilisateurs connectés via Supabase Auth, donc la fille)
-- à lire et écrire dans les tables clients et appreciations_clients.
-- Le grand public (clé anon, non connecté) reste totalement bloqué.

create policy "Lecture clients pour utilisateurs connectés"
on clients
for select
to authenticated
using (true);

create policy "Creation clients pour utilisateurs connectés"
on clients
for insert
to authenticated
with check (true);

create policy "Lecture appreciations pour utilisateurs connectés"
on appreciations_clients
for select
to authenticated
using (true);

create policy "Creation appreciations pour utilisateurs connectés"
on appreciations_clients
for insert
to authenticated
with check (true);
