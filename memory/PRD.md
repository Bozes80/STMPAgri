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

## Tests
- Backend : 24 tests pytest — 100% OK. Frontend : flux critiques — 100% OK (itération 1).

## Identifiants admin
- /admin/login — admin@stmpagri.ci / StmpAgri2025!

## Backlog / Prochaines étapes
- P1 : Bascule multilingue FR/EN complète.
- P1 : Notification e-mail des demandes (Resend/SendGrid) + envoi de devis PDF.
- P2 : Upload d'images dans l'admin (stockage objet) au lieu d'URL.
- P2 : Téléchargement de catalogues PDF réels + certificats PDF.
- P2 : Remplacer les coordonnées de démonstration par les vraies (tél, WhatsApp, adresse, réseaux sociaux, Google Maps).
- P3 : Optimisation SEO avancée (sitemap, meta par page, données structurées).
