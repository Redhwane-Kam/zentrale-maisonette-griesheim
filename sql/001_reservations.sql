-- Table des réservations
-- status : 'en_attente' (juste après réservation, avant confirmation/paiement)
--          'confirmee'   (paiement reçu, date garantie)
--          'annulee'     (annulée par le voyageur ou l'hôte)
--          'bloquee'     (date bloquée manuellement, ou importée depuis Airbnb/Booking)

create table reservations (
  id uuid primary key default gen_random_uuid(),
  date_arrivee date not null,
  date_depart date not null,
  nom_voyageur text,
  email_voyageur text,
  telephone_voyageur text,
  nombre_voyageurs integer,
  status text not null default 'en_attente',
  source text not null default 'site', -- 'site', 'airbnb', 'booking'
  prix_total numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dates_valides check (date_depart > date_arrivee),
  constraint status_valide check (status in ('en_attente', 'confirmee', 'annulee', 'bloquee'))
);

-- Empêche que deux réservations confirmées/bloquées se chevauchent
create extension if not exists btree_gist;

alter table reservations
  add constraint pas_de_chevauchement
  exclude using gist (
    daterange(date_arrivee, date_depart) with &&
  )
  where (status in ('confirmee', 'bloquee'));

-- Index pour accélérer les recherches de disponibilité
create index idx_reservations_dates on reservations (date_arrivee, date_depart);
create index idx_reservations_status on reservations (status);
