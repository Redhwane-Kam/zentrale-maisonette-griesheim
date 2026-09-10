-- Table des clients (informations agrégées, indépendantes d'une réservation ponctuelle)
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text,
  telephone text,
  created_at timestamptz not null default now()
);

-- Table des appréciations internes sur un client
-- rating : note simple pour faciliter le tri (ex: 1 à 5, ou "bon"/"problematique")
-- Jamais visible publiquement : accès réservé au back-office uniquement (RLS ci-dessous)
create table appreciations_clients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  reservation_id uuid references reservations(id) on delete set null,
  rating text not null,
  commentaire text,
  degats_signales boolean not null default false,
  created_at timestamptz not null default now(),

  constraint rating_valide check (rating in ('excellent', 'correct', 'problematique'))
);

-- Sécurité : RLS activé, AUCUNE règle publique ajoutée.
-- Résultat : ni "anon" ni personne via le site public ne peut lire ou écrire ici.
-- Seul un accès via la clé service_role (back-office sécurisé, à construire) pourra y accéder.
alter table clients enable row level security;
alter table appreciations_clients enable row level security;

create index idx_appreciations_client on appreciations_clients (client_id);
