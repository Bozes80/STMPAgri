# PRD — STMP Agri (Site vitrine + Back-office)

## Problème / Contexte
Site vitrine haut de gamme, institutionnel et bilingue-ready (FR au lancement) pour **STMP Agri**
(Société de Transport de Management et de Production Agri), entreprise ivoirienne : import-export,
intrants agricoles, engrais/fertilisants, produits phytosanitaires, transport/logistique, agroalimentaire,
commerce général. Slogan : « Nourrir nos terres pour nourrir l'Afrique ».

## Choix utilisateur
- Formulaires : enregistrés en base + consultés via tableau de bord admin.
- Contenu : back-office admin complet (produits, actualités, réalisations, partenaires, certifications).
- Langue : Français uniquement au lancement.
- Coordonnées : données de démonstration (à remplacer).
- Style : institutionnel & épuré, standards internationaux.

## Stack & Design
- FastAPI + React (CRA/craco) + MongoDB. Auth : JWT custom (Bearer, localStorage `stmp_token`).
- Palette de marque : Vert foncé #0E7A3A, olive #7FAE3C, vert clair #A8D45A, jaune doré #F2D400, anthracite #1F2937.
- Fonts : Outfit (titres), Manrope (corps). Mode sombre. Motif « parcelles + soleil » (logo SVG maison).

## Implémenté (déc. 2025)
- **Public** : Accueil (hero, 6 métiers, 5 activités alternées, pourquoi nous, stats, produits vedettes, actualités, CTA),
  Produits (catalogue filtrable + recherche + fiche détail), Réalisations, Actualités (blog + détail),
  Certifications (frise chronologique), Partenaires (carrousel + stats), RSE (4 piliers), Contact (formulaire + Google Maps + horaires),
  Demande de devis (formulaire intelligent multi-sections + calendrier + consentement + message de succès).
- **Transverse** : header sticky glass + recherche globale, footer riche + newsletter, bouton flottant WhatsApp, mode sombre, animations Framer Motion, SEO title/lang.
- **Backend** : endpoints publics (products/articles/realisations/partners/certifications/stats/search),
  soumissions (contact/quote/newsletter), auth (login/me/logout), admin CRUD complet + overview + gestion des soumissions.
  Amorçage automatique (admin + 12 produits, 6 articles, 6 réalisations, 10 partenaires, 5 certifications, stats).
- **Back-office** (/admin) : login, dashboard, gestion CRUD produits/articles/réalisations/partenaires/certifications,
  messages de contact, demandes de devis (statuts), abonnés newsletter.

## Implémenté (mise à jour fév. 2026)
- **Produit ajouté** : « Soude caustique (Hydroxyde de sodium - NaOH) » dans la catégorie Engrais, avec image de perles/granulés blancs (Pexels 7717461). Synchronisé dans `seed_data.py` + base.
- **Notifications e-mail (Resend géré par Emergent)** : à chaque soumission des formulaires **Contact** et **Demande de devis** :
  - notification interne envoyée à `ressourceshumaine@stmpagri.ci`, `eugenekonan@stmpagri.ci`, `resplogistique@stmpagri.ci` (Reply-To = e-mail du visiteur) ;
  - accusé de réception envoyé au visiteur.
  - Envois non bloquants (échec e-mail n'empêche pas l'enregistrement en base). Module : `/app/backend/email_service.py`.
  - Config `.env` : `EMERGENT_EMAIL_KEY`, `EMAIL_FROM_NAME="STMP Agri"`, `NOTIFICATION_EMAILS`.
  - Testé end-to-end (HTTP 202 sur les 4 envois + toast de succès UI).
- **Restructuration du menu (front-office)** :
  - Menu principal : Accueil, Nos métiers, **Nos activités (dropdown 5 items)**, Nos produits, Nos réalisations, Actualités, Contact.
  - Menu secondaire discret « Plus » (Partenaires, Certifications, RSE).
  - Menu mobile (Sheet) reproduit la même hiérarchie avec sous-liens indentés.
- **Nouvelle section Nos activités** :
  - Page d'aperçu `/activites` (5 cartes avec icônes lucide, teaser, CTA).
  - 5 pages détaillées `/activites/:key` — clé slugifiée (achat-vente-engrais, produits-phytosanitaires, agroalimentaire, transport-marchandises, commerce-general).
  - Chaque fiche : hero + intro + « Ce que nous vous apportons » (5 bullets) + CTA devis/produits/contact + sidebar « Nos autres activités ».
  - Bouton hero « Découvrir nos activités » redirige vers `/activites`.
  - La section « Nos activités » de la Home pointe vers les nouvelles fiches détaillées.
  - Contenu de démonstration à remplacer plus tard par STMP Agri.
- **Upload/Download images (back-office)** — stockage objet géré par Emergent :
  - `POST /api/admin/upload` (admin auth, multipart, ≤ 10 Mo, JPG/PNG/WebP/GIF/SVG) → `{url, path, size}`.
  - `GET /api/files/{path:path}` public, sert le fichier avec Cache-Control immutable.
  - Composant `ImageField` dans le `CrudManager` : prévisualisation, boutons Téléverser/Remplacer/Voir/Retirer + input URL manuel.
  - Toutes les pages admin avec image (Produits, Articles, Réalisations, Partenaires) utilisent `type: "image"`.
  - Frontend public affiche via `resolveImageUrl` (préfixe `REACT_APP_BACKEND_URL` pour les URLs `/api/files/...`).
  - Config `.env` : `EMERGENT_LLM_KEY`. Modules : `/app/backend/storage_service.py`, `/app/frontend/src/lib/media.js`.
  - Testé end-to-end (upload 200 + download 200 + 29/29 pytest OK).
- **Gestion des catégories de produits (back-office)** :
  - Nouvelle collection `categories` (id, name, value/slug, description, order).
  - Endpoints : `GET /api/categories` (public), `POST/PUT/DELETE /api/admin/categories` (admin auth).
  - Validation : slug requis non vide, format `[a-z0-9-]+`, rejet du slug réservé `all` (400). Unicité du slug (409).
  - Suppression **bloquée** avec message clair si des produits sont rattachés (409 : « Suppression impossible : X produit(s) rattaché(s)… »).
  - Renommer un slug propage automatiquement le changement sur `products.category` (cascade sûre).
  - Nouvelle page admin `/admin/categories` avec sidebar dédiée (icône Tag).
  - Hook `useCategories`/`useCategoryLabel` (React Query, cache 5 min) — le catalogue public (filtres, badges), les cartes produits, la fiche produit, et le formulaire admin lisent désormais les catégories dynamiquement depuis l'API.
  - Seed initial idempotent : 6 catégories créées au premier démarrage (Engrais, Fertilisants, Herbicides, Insecticides, Fongicides, Équipements agricoles).
  - Testé end-to-end (31/32 pytest, tous les flux admin + public validés).
- **Section « Pourquoi STMP Agri ? » rendue fonctionnelle** :
  - Les 6 sous-rubriques (Expertise multisectorielle, Réseau international, Qualité des produits, Respect des délais, Accompagnement personnalisé, Agriculture durable) sont désormais **cliquables**.
  - Chaque carte ouvre un **modal élégant** (Shadcn Dialog) avec : icône, titre, intro contextuelle, 5 preuves concrètes (bullets), CTAs « Demander un devis » et « Nous contacter ».
  - Contenu de démonstration à remplacer par les textes définitifs de STMP Agri.
  - Testid `why-us-card-<key>` sur chaque carte, `why-us-modal-quote-btn` / `why-us-modal-contact-btn` dans le modal.
- **CMS Pages — v1 (back-office & rendu public)** :
  - Nouvelle collection MongoDB `pages` (unicité sur `slug`).
  - Modèle Page : title, slug (auto-généré + éditable), summary, content_html (WYSIWYG), cover_image, gallery (list), icon, category, tags, status (draft/published/archived), parent_id, order, show_in_main_nav, author_email (JWT), published_at, created_at, updated_at, seo (sous-objet meta_title/meta_description/meta_keywords/canonical/robots/og_title/og_description/og_image/twitter_card).
  - Endpoints : `GET /api/pages` (public, publiées uniquement, filtre `nav_only`), `GET /api/pages/{slug}` (public), `GET /api/admin/pages`, `POST/PUT/DELETE /api/admin/pages/{id}`, `POST /api/admin/pages/{id}/status?status=<x>`.
  - Slug renommé propage l'unicité automatiquement (suffix aléatoire si collision). Passage au statut « Publié » fixe `published_at` automatiquement si vide.
  - **Éditeur WYSIWYG** (TipTap) : H1/H2/H3, gras/italique/souligné, listes puces/ordonnées, alignement, citation, code, liens, images (upload direct via `/api/admin/upload`), séparateur, undo/redo.
  - **Panneau SEO** avec **aperçu Google en temps réel** (URL verte + titre bleu + description grise) et compteurs de caractères.
  - **Image de couverture + galerie multi-images** (upload/preview/réordonner/retirer).
  - **Planification** : datetime local pour définir la date/heure de publication.
  - **Hiérarchie** : sélecteur de page parente + ordre + catégorie + tags + switch « afficher dans le menu principal ».
  - **Route publique dynamique** `/p/:slug` : PageHero + breadcrumb + titre + résumé + contenu HTML + galerie + balises SEO complètes via `react-helmet-async` (title, description, keywords, robots, canonical, Open Graph, Twitter Card).
  - **Admin UI** : sidebar « Pages » (icône FileEdit), liste avec recherche/filtre statut/tri des colonnes/actions rapides (publier, archiver, brouillon, supprimer via AlertDialog), éditeur 4 onglets (Contenu / Média / SEO / Réglages) + panneau publication latéral.
  - Testé end-to-end : **100 % backend (15/15 tests + 31/32 regression, 1 xfail préexistant) + 100 % frontend (tous testids et flux vérifiés incluant le rendu public avec balises Helmet).**
- **CMS Pages — Phase 2 : Menus, hiérarchie visuelle, sélection multiple** :
  - **Constructeur de menus** — nouvelle collection MongoDB `menus`, page admin `/admin/menus` avec deux onglets (Menu principal + Menu pied de page). Chaque menu : nom + liste d'items (label, url, target `_self`/`_blank`, icon, parent_id, order). Support des sous-éléments avec indentation visuelle. Ajout / édition / suppression via dialog. **Drag & drop** de réordonnancement (@dnd-kit). Suggestions d'URLs internes dans le formulaire. Boucles parent/enfant impossibles.
  - Endpoints : `GET /api/menus/{location}` (public, retourne menu vide si absent), `GET /api/admin/menus[/{location}]` (admin), `PUT /api/admin/menus/{location}` (upsert).
  - **Header + Footer publics dynamiques** — nouveaux hook `useMenu` (React Query, cache 60s). Header lit `main`, Footer lit `footer`. Items avec `children` rendus en dropdown (Nos activités → 5 activités). Fallback élégant si menu vide.
  - Seed initial : 12 items pour le menu principal (7 top-level + 5 sous-items 'Nos activités') et 10 items pour le pied de page.
  - **Hiérarchie visuelle des pages** — nouveau toggle Table/Arborescence sur `/admin/pages`. La vue arborescence affiche les pages en tree avec drag handle par ligne (drag & drop pour réordonner au sein d'un même parent) et sélecteur de parent inline pour reparenter (POST `/api/admin/pages/reorder`).
  - **Sélection multiple + suppression en masse** sur la vue Table — colonne checkbox, « tout sélectionner », toolbar « Actions groupées » avec compteur et bouton « Supprimer la sélection » + AlertDialog de confirmation. Les enfants orphelins remontent à la racine.
  - Endpoints : `POST /api/admin/pages/bulk-delete {ids}` et `POST /api/admin/pages/reorder {items: [{id, parent_id, order}]}`.
  - Testé end-to-end : **100 % backend (18/18 nouveaux tests) + 100 % frontend (Menus + Bulk + Tree + Header/Footer dynamiques + persistance vérifiés).**

## Tests
- Backend : 24 tests pytest — 100% OK. Frontend : flux critiques — 100% OK (itération 1).

## Identifiants admin
- /admin/login — admin@stmpagri.ci / StmpAgri2025!

## Backlog / Prochaines étapes
- P1 : Bascule multilingue FR/EN complète.
- P1 : Envoi de devis PDF (le devis reste texte ; générer/joindre un PDF). Notifications e-mail : FAIT (Resend).
- P1 : Rédiger le contenu définitif des 6 sous-rubriques « Pourquoi STMP Agri ? » et des 5 fiches d'activités.
- P1 : Médiathèque UI (navigateur des uploads précédents avec grid + recherche + copier URL, sélectionnable depuis n'importe quel champ image).
- **P2 : CMS Pages Phase 3** — blocs custom (accordéons, colonnes, boutons, vidéos, audio, shortcodes), permissions granulaires (rôles Éditeur/Auteur/Modérateur avec Lire/Créer/Modifier/Publier/Supprimer/Restaurer), pages protégées par mot de passe / rôle, CSS/JS custom + templates par page, commentaires internes par page.
- P2 : Catalogues PDF téléchargeables + certificats PDF.
- P2 : Widget de chat WhatsApp flottant réel (actuellement bouton avec lien statique).
- P2 : Gestion / suppression des fichiers uploadés (endpoint admin de nettoyage, garbage-collect des orphelins). Upload/Download : FAIT.
- P2 : Remplacer les coordonnées de démonstration par les vraies (tél, WhatsApp, adresse, réseaux sociaux, Google Maps).
- P3 : Optimisation SEO avancée (sitemap, meta par page, données structurées).
