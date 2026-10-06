# FIFA Promo — Rapports d’appel

Outil web de démonstration pour saisir et suivre des rapports d’appels de promotion FIFA, avec une interface recréée à partir de la capture de référence.

## Fonctionnalités

- Écran principal dense à thème sombre, avec navigation latérale, calendrier, chronomètre d’appel, profil client, produits, gains, actions et historique récent.
- Macros de plainte utilisables à la souris ou au clavier : `Ctrl+0` à `Ctrl+5`, `Ctrl+9` et `Ctrl+I`.
- Vues Rapport, Dashboard, Mes rapports, Commandes, Paramètres et Aide.
- Cinq dossiers fictifs modifiables au premier lancement. Les saisies sont conservées localement dans le navigateur tant qu’aucune connexion Supabase n’est configurée.
- Exports téléchargeables de tous les rapports au format CSV UTF-8 ou JSON.
- Paramètres pour l’URL Supabase, la clé `anon`/publique et le nom de la table, avec test de connexion.

Aucun identifiant Supabase n’est inclus. Tant que tu ne fournis pas tes paramètres, l’application reste en mode de démonstration locale. N’entre jamais une clé `service_role` dans le navigateur : utilise uniquement une clé publique `anon` et configure les politiques RLS de ton projet selon les autorisations de tes opérateurs.

## Lancer l’application

Prérequis : Node.js 22 et pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev:static
```

Ouvre ensuite `http://localhost:3000`. Pour produire la version statique :

```bash
pnpm check
pnpm build:static
```

Le site compilé est généré dans `dist/public/`. Le serveur de développement statique écoute sur `0.0.0.0` et utilise `PORT` s’il est défini.

## Brancher Supabase plus tard

Dans l’application, ouvre **Paramètres** et renseigne :

1. l’URL HTTPS de ton projet Supabase ;
2. la clé publique `anon` du projet ;
3. le nom de table, par défaut `call_reports`.

Le bouton **Tester la connexion** vérifie que la table est lisible ; **Enregistrer les paramètres** active la lecture et l’écriture Supabase. Les paramètres sont conservés dans le `localStorage` de ce navigateur. La table doit exposer une colonne `id` unique et les colonnes ci-dessous ; la structure conseillée est également affichée dans les Paramètres :

```sql
create table public.call_reports (
  id text primary key,
  created_at timestamptz default now(),
  date date,
  contact_channel text,
  client_name text,
  phone text,
  commune text,
  gain_name text,
  announced_gain text,
  gain_status text,
  product text,
  point_of_sale text,
  code_capsule text,
  participated boolean default false,
  internal_actions boolean default false,
  complaint text,
  priority text,
  follow_up boolean default false,
  company_action text,
  internal_comment text,
  status text,
  duration_seconds integer
);
```

Avant de connecter des opérateurs, active RLS et crée des policies adaptées aux rôles de ton organisation. Les opérations utilisent l’API REST Supabase du navigateur avec la clé publique ; aucun secret serveur n’est demandé ou embarqué.

## Structure du projet

- `client/src/pages/Home.tsx` : coque et navigation.
- `client/src/components/ReportWorkspace.tsx` : formulaire de rapport et panneaux latéraux.
- `client/src/components/SettingsView.tsx` : connexion Supabase et exports.
- `client/src/lib/report-data.ts` : données fictives, persistance locale, adaptateur REST et exports CSV/JSON.
- `client/src/types/report.ts` : types partagés du modèle.
- `client/src/index.css` : palette, halos, surfaces vitrées et adaptations responsive.
- `client/public/assets/` : fragments d’image de démonstration dérivés de la référence fournie.
- `dist/public/` : build statique prêt à servir.
