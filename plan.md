# Plan d’implémentation — FIFA Promo · Rapports d’appel

## Portée
Application web interactive, reprenant fidèlement une capture d’écran fournie. Le formulaire permet de créer, modifier et consulter des rapports. Les données de démonstration et le stockage local fonctionnent sans configuration externe ; la connexion Supabase est activable par l’utilisateur dans Paramètres lorsqu’il aura ses identifiants. Les exports sont disponibles en CSV et JSON.

## Décisions d’implémentation
- Frontend React + TypeScript/Vite du starter WebDev, servi en mode statique sur le port du projet ; pas de serveur Manus ni de base Manus.
- Wouter pour les vues navigables : rapport, tableau de bord, rapports, commandes, paramètres et aide.
- Modèle de rapport TypeScript commun aux vues, au stockage local, à l’adaptateur Supabase REST et aux exports.
- `localStorage` comme mode de démonstration et de secours, prérempli d’enregistrements factices. La configuration Supabase (URL, clé anon/public, table) est enregistrée localement et testée depuis l’interface. Une clé `service_role` ne sera jamais demandée.
- Supabase est utilisé directement depuis le navigateur uniquement avec une clé anon/public et des règles RLS configurées dans le projet fourni ultérieurement. Tant qu’aucune connexion valide n’existe, les interactions restent locales.
- Export téléchargeable de l’ensemble des rapports en CSV UTF-8 et JSON.

## Direction visuelle confirmée
- **Mouvement** : cockpit opérationnel néo-noir / glassmorphism de la référence, proche d’un tableau de contrôle broadcast sportif, plutôt qu’un dashboard SaaS générique.
- **Principes** : densité maîtrisée ; hiérarchie compacte mais lisible ; surfaces vitrées superposées ; feedback d’action immédiat et évident.
- **Couleurs** : fond bleu-noir quasi encre ; panneaux bleu ardoise semi-transparents ; rouge Coca-Cola / corail comme accent d’action et de sélection ; reflets chauds rouge-magenta et lueur blanche discrète pour séparer les plans. États validés verts, attente ambre, refus rouge.
- **Composition** : rail latéral fixe étroit ; barre de titre intégrée en haut ; formulaire central en colonnes serrées, historique et macros dans une colonne latérale ; bande de complétion et actions au bas de la zone. La disposition doit rappeler les proportions de la capture 1264×843 et s’adapter aux écrans plus étroits sans perdre les champs.
- **Éléments signature** : halo rouge diffus derrière les panneaux du bas ; anneau circulaire rouge autour de l’identifiant d’appel ; grande commande d’enregistrement en dégradé rouge lumineux.
- **Interactions** : boutons à états sélectionnés explicites, raccourcis clavier pour les macros, chronomètre vivant, navigation latérale, enregistrement local immédiat, import des réglages et export explicite.
- **Animation** : transitions courtes de bordure/lueur, micro-déplacement au survol et pulsation très subtile du point d’état ; aucune animation continue agressive hors indicateur d’enregistrement.
- **Typographie** : sans-serif d’interface compacte (Inter si disponible, sinon Arial), tailles proches de 11–14 px pour libellés et 19–24 px pour titre/valeurs ; chiffres tabulaires pour l’horloge et le gain ; italique script réservé au mot Coca-Cola de la référence.
- **Essence de marque** : « Le poste de suivi des appels de promotion, précis et prêt à enregistrer. » Personnalité : rapide, claire, rassurante.
- **Voix** : microcopy courte, française et orientée opérateur : « Saisissez rapidement. Naviguez au clavier. » / « Rapport enregistré — prêt pour le prochain appel. »
- **Wordmark** : libellé Coca-Cola en script blanc au sommet du rail, accompagné de FIFA PROMO en capitales fines ; les éléments restent de simples repères visuels de la référence.
- **Couleur signature** : rouge corail lumineux.

## Structure du projet
- `client/src/pages/Home.tsx` : coque applicative, navigation et vues.
- `client/src/components/ReportWorkspace.tsx` : écran de saisie et panneaux d’historique/macros.
- `client/src/components/SettingsView.tsx` : configuration Supabase et actions d’export.
- `client/src/types/report.ts` : forme commune d’un rapport et de la configuration.
- `client/src/lib/report-data.ts` : données de démonstration, persistance locale, REST Supabase et CSV/JSON.
- `client/src/index.css` : variables de palette, layout, effets vitrés, halos et points de rupture.
- `client/public/manus-routes.json` : manifeste des routes React servies par l’application.

## Limites et données
Les lignes de démonstration, les profils et les gains affichés sont fictifs. Les identifiants de projet Supabase et la clé anon/public n’ont pas encore été fournis ; aucune connexion réseau de production ne sera simulée comme si elle était réelle.