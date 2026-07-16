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

## Tests
- Backend : 24 tests pytest — 100% OK. Frontend : flux critiques — 100% OK (itération 1).

## Identifiants admin
- /admin/login — admin@stmpagri.ci / StmpAgri2025!

## Backlog / Prochaines étapes
- P1 : Bascule multilingue FR/EN complète.
- P1 : Envoi de devis PDF (le devis reste texte ; générer/joindre un PDF). Notifications e-mail : FAIT (Resend).
- P1 : Remplacer le contenu de démonstration des 5 fiches d'activités par le contenu final rédigé par STMP Agri.
- P2 : Catalogues PDF téléchargeables + certificats PDF.
- P2 : Widget de chat WhatsApp flottant réel (actuellement bouton avec lien statique).
- P2 : Gestion / suppression des fichiers uploadés (endpoint admin de nettoyage, garbage-collect des orphelins). Upload/Download : FAIT.
- P2 : Remplacer les coordonnées de démonstration par les vraies (tél, WhatsApp, adresse, réseaux sociaux, Google Maps).
- P3 : Optimisation SEO avancée (sitemap, meta par page, données structurées).
