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
- **Médiathèque (Media Library) — juil. 2026** :
  - Nouvelle collection MongoDB `media` : `{id, url, storage_path, filename, content_type, size, section, alt, title, tags, uploaded_by, created_at, updated_at}` — 3 sections figées `header` / `content` / `footer`.
  - Endpoints admin : `POST /api/admin/media` (upload multipart avec query section/alt/title/tags), `GET /api/admin/media?section=<x>&q=<txt>`, `GET /api/admin/media/counts` (counts par section), `GET /api/admin/media/{id}` (avec `usages` = {total, products, articles, realisations, partners, pages}), `PATCH /api/admin/media/{id}` (section, alt, title, tags), `DELETE /api/admin/media/{id}`. Réutilise Emergent Object Storage. Extensions autorisées : JPG/PNG/WebP/GIF/SVG (≤ 10 Mo).
  - Nouvelle page admin `/admin/medias` (icône `Images` dans sidebar) : titre + sélecteur de section pour l'upload + bouton multi-fichiers, onglets `Toutes / Header / Contenu / Footer` avec badges de comptage, barre de recherche (titre/alt/tag/filename), grille responsive (2→5 colonnes) avec badges de section colorés (vert=header, ambre=content, gris=footer), actions hover par card (Copier URL / Modifier / Supprimer).
  - Modal **Aperçu grand format** (Dialog) : image plein cadre + metadata (titre, section, taille, date, alt, tags, fichier) + actions Copier URL / Ouvrir / Modifier.
  - Modal **Édition** : Select section, Input titre, Textarea alt (SEO/a11y), Input tags CSV.
  - **AlertDialog suppression** : si l'image est référencée ailleurs, un panneau ⚠️ jaune liste les usages (produits/articles/réalisations/partenaires/pages) et le bouton Supprimer reste actif (choix 2.b — autoriser avec alerte forte).
  - **MediaPickerDialog** (composant réutilisable) intégré dans `CoverImageField` (pages CMS/couvertures) et `ImageField` du `CrudManager` (produits, articles, réalisations, partenaires) : bouton **« Médiathèque »** à côté du bouton **« Téléverser »**. Le picker permet de filtrer par section, chercher, upload direct + sélection puis injection de l'URL relative `/api/files/stmp-agri/media/<uuid>.<ext>` dans le champ image du formulaire.
  - Testé end-to-end : **100 % backend (19/19 nouveaux tests + 88/88 régression) + 100 % frontend (12/12 flux : sidebar, page, upload multi, filtre onglets, recherche, aperçu, édition, copie URL, suppression avec/sans usages, MediaPicker dans produit, injection URL).**
- **Réseaux sociaux — juil. 2026** :
  - Nouvelle collection MongoDB `socials` : `{id, name, url, icon_url, is_active, order, created_at, updated_at}`. Endpoints : `GET /api/socials` (public, actifs uniquement, triés par `order`), `GET/POST /api/admin/socials`, `PATCH/DELETE /api/admin/socials/{id}`, `POST /api/admin/socials/reorder {ids}`. Validation URL : http(s):// / mailto: / tel: uniquement.
  - **Seed initial** de 4 réseaux : Facebook / LinkedIn / Instagram / WhatsApp avec icônes SVG monochromes blanches encodées en data-url (paths simplifiés officiels) — remplaçables via l'admin.
  - Nouvelle page admin `/admin/reseaux` (icône Share2 dans sidebar) : liste triable **drag & drop** (`@dnd-kit`, réordonnancement optimiste avec rollback), previews circulaires sombres façon footer, actions inline (Eye toggle actif, Pencil éditer, Trash supprimer), dialog Ajouter/Modifier avec champs Nom*, URL* (validation), section Icône (Input URL + **MediaPickerDialog** section=footer par défaut + preview live + bouton Retirer), Switch Actif, badge « Inactif » sur la row.
  - **Footer public dynamique** — nouveau hook `useSocials` (React Query, cache 60s). Footer consomme la liste et rend les icônes (`data-testid=footer-socials`), fallback initiales monogramme si `icon_url` absent, désactivés (is_active=false) exclus.
  - **Bouton flottant WhatsApp dynamique** — cherche le réseau nommé « WhatsApp » actif (case-insensitive) ; ajoute `?text=…` automatiquement si l'URL est `wa.me` ou `whatsapp.com` ; fallback sur `COMPANY.whatsappHref` sinon.
  - Testé end-to-end : **100 % backend (21/21 nouveaux tests + 110/110 régression) + 100 % frontend (12/12 flux : sidebar, page, seed, dialog Ajouter avec validation, Modifier, toggle actif, drag & drop reorder, MediaPicker icône, suppression, footer public dynamique, bouton WhatsApp dynamique).**
- **CRUD Activités — juil. 2026** :
  - Nouvelle collection MongoDB `activities` : `{id, key(slug figé), title, tagline, icon_url, image, gallery[], teaser, intro, features[], related_category, parent_id, order, is_active, created_at, updated_at}`.
  - Endpoints : `GET /api/activities` (public, arbre à 2 niveaux avec children), `GET /api/activities/{key}` (avec children + parent breadcrumb), `GET/POST /api/admin/activities`, `GET /api/admin/activities/{id}` (détail admin), `PATCH/DELETE /api/admin/activities/{id}`, `POST /api/admin/activities/reorder` (bulk reparent + reorder).
  - Seed : 5 activités migrées depuis constants.js (Achat/vente engrais, Phytosanitaires, Agroalimentaire, Transport, Commerce général) — plus aucun contenu figé côté frontend.
  - **Hiérarchie à 2 niveaux max** : rubrique principale (`parent_id=null`) ou sous-rubrique (`parent_id={parent}`). Backend empêche l'imbrication d'une sous-rubrique sous une sous-rubrique + le rattachement d'une activité qui a déjà des enfants. Suppression détache les enfants au lieu de cascader.
  - **Slug immuable après création** (choix 2.b) : passer `key` au PATCH est silencieusement ignoré. Génération automatique du slug depuis le titre avec suffixe `-N` si collision.
  - Nouvelle page admin `/admin/activites` (icône Layers dans sidebar) : arborescence indentée (drag & drop `@dnd-kit` scopé au même parent), actions inline (toggle actif, aperçu, modifier, supprimer avec AlertDialog).
  - Éditeur `/admin/activites/nouveau` et `/admin/activites/:id` avec 3 onglets : **Général** (Titre, Tagline, Hiérarchie, Catégorie liée, Actif) / **Contenu** (Teaser, Intro, features triables `@dnd-kit`) / **Médias** (icône via `MediaPickerDialog`, image principale via `CoverImageField`, galerie via `GalleryField`).
  - **Frontend public dynamique** — nouveau hook `useActivities()` + `useActivityByKey(key)` (React Query 60s). Pages `/activites` et `/activites/:key` lisent l'API ; la fiche affiche breadcrumb parent, features, section **Nos sous-catégories** (si children), galerie, CTA devis/produits liés, autres activités en sidebar.
  - Testé end-to-end : **100 % backend (24/24 nouveaux tests + 134/134 régression) + 100 % frontend (13/13 flux via testing_agent_v3_fork : sidebar, liste seedée, création new, redirection, slug auto, apparition immédiate côté public, édition, drag features, slug immutable, création sous-rubrique visible sur parent + breadcrumb, blocage 3ème niveau, toggle actif, suppression avec détachement children, aperçu, MediaPicker).**

## Implémenté (mise à jour fév. 2026 - suite)

## Tests
- Backend : 24 tests pytest — 100% OK. Frontend : flux critiques — 100% OK (itération 1).

## Identifiants admin
- /admin/login — admin@stmpagri.ci / StmpAgri2025!

## Backlog / Prochaines étapes
- P1 : Bascule multilingue FR/EN complète.
- P1 : Envoi de devis PDF (le devis reste texte ; générer/joindre un PDF). Notifications e-mail : FAIT (Resend).
- P1 : Rédiger le contenu définitif des 6 sous-rubriques « Pourquoi STMP Agri ? » et des 5 fiches d'activités.
- P1 : Médiathèque UI (grille + recherche + copier URL, sélectionnable depuis n'importe quel champ image) : **FAIT (juil. 2026)** — page /admin/medias + MediaPickerDialog intégré dans les champs image (produits, articles, réalisations, partenaires, pages CMS).
- **P2 : CMS Pages Phase 3** — blocs custom (accordéons, colonnes, boutons, vidéos, audio, shortcodes), permissions granulaires (rôles Éditeur/Auteur/Modérateur avec Lire/Créer/Modifier/Publier/Supprimer/Restaurer), pages protégées par mot de passe / rôle, CSS/JS custom + templates par page, commentaires internes par page.
- P2 : Catalogues PDF téléchargeables + certificats PDF.
- P2 : Widget de chat WhatsApp flottant réel (actuellement bouton avec lien statique).
  - Le lien du bouton est désormais dynamique (juil. 2026) — synchronisé avec le réseau WhatsApp actif dans /admin/reseaux. Reste à implémenter le widget de chat en bulle si souhaité.
- P2 : Refactoring backend (`server.py` > 1100 lignes) → découper en `/app/backend/routes/` + `/app/backend/models/`.
- P2 : Gestion / suppression des fichiers uploadés (endpoint admin de nettoyage, garbage-collect des orphelins). Upload/Download : FAIT.
- P2 : Remplacer les coordonnées de démonstration par les vraies (tél, WhatsApp, adresse, réseaux sociaux, Google Maps).
- P3 : Optimisation SEO avancée (sitemap, meta par page, données structurées).
