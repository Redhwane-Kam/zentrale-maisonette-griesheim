# Guide : activer les paiements Stripe (à faire par toi-même)

Ce document explique comment connecter Stripe à ton site, étape par étape.
Personne d'autre que toi n'a besoin de voir ces clés — c'est fait exprès :
elles donnent accès à l'argent reçu par le site, donc elles restent privées.

## Étape 1 — Créer ton compte Stripe

1. Va sur https://dashboard.stripe.com/register
2. Crée ton compte avec ton email professionnel
3. Une fois connectée, reste en **"Mode test"** au début (interrupteur en haut à droite du tableau de bord) — ça permet de tout tester sans vrai argent, avec de fausses cartes bancaires

## Étape 2 — Récupérer ta clé secrète (mode test)

1. Menu de gauche → **Développeurs** → **Clés API**
2. Copie la **"Clé secrète"** qui commence par `sk_test_...`

## Étape 3 — Configurer le webhook

C'est ce qui permet à Stripe de dire à ton site "le paiement a bien été reçu".

1. Développeurs → **Webhooks** → **Ajouter un point de terminaison**
2. URL à indiquer : `https://zentrale-maisonette-griesheim.vercel.app/api/stripe-webhook`
3. Événement à sélectionner : `checkout.session.completed`
4. Une fois créé, Stripe affiche un **"Secret de signature"** commençant par `whsec_...` — copie-le aussi

## Étape 4 — Ajouter ces clés dans Vercel

1. Va sur https://vercel.com et connecte-toi (ton père t'a peut-être déjà donné l'accès au projet, ou crée ton propre accès)
2. Ouvre le projet **zentrale-maisonette-griesheim**
3. **Settings** → **Environment Variables**
4. Ajoute ces deux lignes :
   - `STRIPE_SECRET_KEY` = ta clé `sk_test_...`
   - `STRIPE_WEBHOOK_SECRET` = ta clé `whsec_...`
5. Clique **Save**, puis redéploie le projet (Vercel te le proposera automatiquement)

## Étape 5 — Activer les moyens de paiement

Par défaut, seule la carte bancaire est active. Pour ajouter PayPal, Klarna, giropay :
1. Dans Stripe → **Paramètres** → **Moyens de paiement**
2. Active ceux que tu veux (PayPal, Klarna, giropay, SEPA)

## Étape 6 — Tester

En mode test, utilise cette fausse carte bancaire pour vérifier que tout marche :
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres

Si la réservation passe bien de "en attente" à "confirmée" après ce faux paiement, tout fonctionne.

## Étape 7 — Passer en production (quand tu es prête)

Quand tout est testé et que tu veux accepter de vrais paiements :
1. Bascule Stripe en **"Mode live"**
2. Récupère les nouvelles clés `sk_live_...` et le nouveau webhook en mode live
3. Remplace les valeurs dans Vercel par ces nouvelles clés

⚠️ Ne mélange jamais les clés `test` et `live` — Stripe les garde bien séparées, c'est normal et volontaire.
