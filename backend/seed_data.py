# Contenu initial STMP Agri (textes B2B professionnels + images vérifiées)

IMG = {
    "african_agri": "https://images.unsplash.com/photo-1768775517205-7f4bc1b3f771?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwYWdyaWN1bHR1cmUlMjBmaWVsZCUyMHN1bnNldHxlbnwwfHx8fDE3ODM5NTU4ODN8MA&ixlib=rb-4.1.0&q=85",
    "cargo1": "https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMHNoaXAlMjBjb250YWluZXJzJTIwcG9ydHxlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
    "cargo2": "https://images.unsplash.com/photo-1678182451047-196f22a4143e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxjYXJnbyUyMHNoaXAlMjBjb250YWluZXJzJTIwcG9ydHxlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
    "truck": "https://images.unsplash.com/photo-1670509295484-df0c2512fec4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxjb21tZXJjaWFsJTIwdHJhbnNwb3J0JTIwdHJ1Y2slMjBoaWdod2F5fGVufDB8fHx8MTc4Mzk1NTg4M3ww&ixlib=rb-4.1.0&q=85",
    "sustain": "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHw0fHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBoYW5kc3xlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
    "warehouse": "https://images.unsplash.com/photo-1586528116022-aeda1613c63d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHx3YXJlaG91c2UlMjBsb2dpc3RpY3MlMjB3b3JrZXJzfGVufDB8fHx8MTc4Mzk1NTg4M3ww&ixlib=rb-4.1.0&q=85",
    "agro": "https://images.unsplash.com/photo-1651525669944-00de65d3b8a5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxmb29kJTIwcHJvY2Vzc2luZyUyMGFncm8lMjBpbmR1c3RyeXxlbnwwfHx8fDE3ODM5NTU4OTh8MA&ixlib=rb-4.1.0&q=85",
    "fertilizer": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxmZXJ0aWxpemVyJTIwcGxhbnQlMjBzYWNrcyUyMGFncmljdWx0dXJlfGVufDB8fHx8MTc4Mzk1NTg5OHww&ixlib=rb-4.1.0&q=85",
}

SEED_STATS = {"partners": 45, "countries": 12, "clients": 380, "years": 4}

SEED_PRODUCTS = [
    {
        "name": "NPK", "category": "engrais", "subcategory": "NPK",
        "description": "Engrais complet équilibré en azote, phosphore et potassium, adapté à un large éventail de cultures vivrières et de rente en Côte d'Ivoire.",
        "characteristics": ["Composition : 15% N - 15% P₂O₅ - 15% K₂O", "Granulés homogènes hydrosolubles", "Conditionnement : sacs de 50 kg", "Origine : import certifié"],
        "applications": ["Cultures vivrières (riz, maïs, manioc)", "Cultures maraîchères", "Fertilisation de fond"],
        "image": "https://images.pexels.com/photos/31673795/pexels-photo-31673795.jpeg?auto=compress&cs=tinysrgb&w=1200", "featured": True, "order": 1,
    },
    {
        "name": "Urée 46% N", "category": "engrais", "subcategory": "UREE",
        "description": "Engrais azoté à haute concentration, idéal pour stimuler la croissance végétative et augmenter les rendements.",
        "characteristics": ["Azote : 46% sous forme uréique", "Granulométrie régulière", "Sacs de 50 kg", "Haute solubilité"],
        "applications": ["Céréales", "Cultures industrielles (coton, canne à sucre)", "Apport en couverture"],
        "image": "https://images.pexels.com/photos/5987894/pexels-photo-5987894.jpeg?auto=compress&cs=tinysrgb&w=1200", "featured": True, "order": 2,
    },
    {
        "name": "Chlorure de Potassium (KCL 60%)", "category": "engrais", "subcategory": "KCL",
        "description": "Source concentrée de potassium favorisant la résistance des plantes et la qualité des récoltes.",
        "characteristics": ["Potassium : 60% K₂O", "Rouge granulé", "Sacs de 50 kg"],
        "applications": ["Palmier à huile", "Hévéa", "Cultures fruitières"],
        "image": "https://images.pexels.com/photos/14242187/pexels-photo-14242187.jpeg?auto=compress&cs=tinysrgb&w=1200", "featured": False, "order": 3,
    },
    {
        "name": "Kieserite (Sulfate de Magnésium)", "category": "engrais", "subcategory": "KIESERITE",
        "description": "Engrais magnésien et soufré qui corrige les carences et optimise la photosynthèse.",
        "characteristics": ["25% MgO - 20% SO₃", "Granulés solubles", "Sacs de 50 kg"],
        "applications": ["Palmier à huile", "Cacaoyer", "Cultures sensibles aux carences en magnésium"],
        "image": "https://images.pexels.com/photos/11996941/pexels-photo-11996941.jpeg?auto=compress&cs=tinysrgb&w=1200", "featured": False, "order": 4,
    },
    {
        "name": "Fertilisant organo-minéral", "category": "fertilisants", "subcategory": None,
        "description": "Amendement enrichi combinant matière organique et éléments minéraux pour restaurer la fertilité des sols.",
        "characteristics": ["Matière organique > 40%", "Enrichi NPK", "Améliore la structure du sol"],
        "applications": ["Restauration des sols appauvris", "Maraîchage", "Agriculture durable"],
        "image": IMG["sustain"], "featured": True, "order": 5,
    },
    {
        "name": "Amendement calcaire (chaux agricole)", "category": "fertilisants", "subcategory": None,
        "description": "Correcteur d'acidité des sols pour améliorer l'assimilation des nutriments.",
        "characteristics": ["Riche en carbonate de calcium", "Réduit l'acidité du sol", "Sacs de 25 kg"],
        "applications": ["Sols acides", "Préparation des parcelles"],
        "image": IMG["sustain"], "featured": False, "order": 6,
    },
    {
        "name": "Herbicide sélectif céréales", "category": "herbicides", "subcategory": None,
        "description": "Solution de désherbage sélectif conforme aux normes phytosanitaires en vigueur, respectueuse des cultures.",
        "characteristics": ["Homologué CSP", "Action systémique", "Bidon de 1 L et 5 L"],
        "applications": ["Riziculture", "Maïsiculture", "Désherbage post-levée"],
        "image": IMG["african_agri"], "featured": False, "order": 7,
    },
    {
        "name": "Herbicide total non sélectif", "category": "herbicides", "subcategory": None,
        "description": "Désherbant à large spectre pour la préparation des terrains et l'entretien des zones non cultivées.",
        "characteristics": ["Large spectre", "Action rapide", "Conforme aux normes"],
        "applications": ["Préparation des sols", "Entretien des périmètres"],
        "image": IMG["african_agri"], "featured": False, "order": 8,
    },
    {
        "name": "Insecticide de protection des cultures", "category": "insecticides", "subcategory": None,
        "description": "Protection efficace contre les ravageurs, formulée selon les bonnes pratiques agricoles.",
        "characteristics": ["Homologué", "Faible dose d'emploi", "Bidon de 1 L"],
        "applications": ["Cacaoyer", "Cultures maraîchères", "Vergers"],
        "image": IMG["sustain"], "featured": False, "order": 9,
    },
    {
        "name": "Fongicide systémique", "category": "fongicides", "subcategory": None,
        "description": "Traitement préventif et curatif contre les maladies fongiques des cultures.",
        "characteristics": ["Double action préventive/curative", "Homologué", "Sachet hydrosoluble"],
        "applications": ["Cacaoyer (pourriture brune)", "Maraîchage", "Bananeraie"],
        "image": IMG["african_agri"], "featured": False, "order": 10,
    },
    {
        "name": "Pulvérisateur à dos 16 L", "category": "equipements", "subcategory": None,
        "description": "Équipement robuste pour l'application précise des intrants phytosanitaires.",
        "characteristics": ["Capacité 16 L", "Buses réglables", "Sangles ergonomiques"],
        "applications": ["Traitement des cultures", "Petites et moyennes exploitations"],
        "image": IMG["warehouse"], "featured": False, "order": 11,
    },
    {
        "name": "Kit d'irrigation goutte-à-goutte", "category": "equipements", "subcategory": None,
        "description": "Système d'irrigation économe en eau pour optimiser la productivité des exploitations.",
        "characteristics": ["Économie d'eau jusqu'à 50%", "Modulable par surface", "Installation simple"],
        "applications": ["Maraîchage", "Cultures fruitières", "Agriculture de précision"],
        "image": IMG["african_agri"], "featured": True, "order": 12,
    },
]

SEED_ARTICLES = [
    {
        "title": "Bien choisir son engrais NPK selon sa culture",
        "excerpt": "Comprendre les équilibres N-P-K pour maximiser vos rendements tout en préservant la fertilité de vos sols.",
        "content": "Le choix d'un engrais NPK adapté est déterminant pour la réussite d'une campagne agricole. L'azote (N) favorise la croissance végétative, le phosphore (P) le développement racinaire et la floraison, tandis que le potassium (K) renforce la résistance des plantes et la qualité des récoltes.\n\nPour les cultures vivrières comme le riz ou le maïs, un engrais équilibré 15-15-15 constitue une base solide. Les cultures de rente telles que le palmier à huile ou l'hévéa nécessitent quant à elles des apports plus riches en potassium.\n\nSTMP Agri accompagne les producteurs dans le diagnostic de leurs sols et la définition d'un plan de fertilisation sur mesure, garantissant un usage raisonné des intrants et des résultats durables.",
        "category": "nutrition", "image": IMG["fertilizer"], "author": "Équipe agronomique STMP",
    },
    {
        "title": "Protection phytosanitaire : les bonnes pratiques",
        "excerpt": "Protéger ses cultures tout en respectant l'environnement et la réglementation en vigueur.",
        "content": "La protection des cultures repose sur une approche raisonnée combinant prévention, surveillance et traitement ciblé. Le recours aux produits phytosanitaires doit toujours respecter les doses homologuées et les délais avant récolte.\n\nSTMP Agri distribue exclusivement des produits conformes aux normes du Comité Sanitaire Phytosanitaire, et forme les producteurs aux bonnes pratiques d'application pour garantir la sécurité des opérateurs et des consommateurs.",
        "category": "phytosanitaire", "image": IMG["african_agri"], "author": "Équipe technique STMP",
    },
    {
        "title": "Logistique agricole : sécuriser l'approvisionnement en intrants",
        "excerpt": "Comment une chaîne logistique maîtrisée garantit la disponibilité des intrants au bon moment.",
        "content": "La réussite d'une campagne dépend étroitement de la disponibilité des intrants au moment opportun. Une rupture d'approvisionnement en pleine période de semis peut compromettre toute une récolte.\n\nGrâce à sa flotte de véhicules, ses entrepôts et son réseau de partenaires logistiques, STMP Agri assure une distribution fiable sur l'ensemble du territoire ivoirien et sous-régional, avec un suivi rigoureux des marchandises.",
        "category": "logistique", "image": IMG["truck"], "author": "Direction logistique STMP",
    },
    {
        "title": "Import-export agricole en Afrique de l'Ouest : opportunités et défis",
        "excerpt": "Le commerce international des produits agricoles, un levier de croissance pour la région.",
        "content": "L'Afrique de l'Ouest dispose d'un potentiel agricole considérable. L'import-export permet de sécuriser l'accès aux intrants de qualité tout en valorisant les productions locales sur les marchés internationaux.\n\nSTMP Agri maîtrise les formalités douanières, le sourcing international et la logistique portuaire, offrant à ses clients un accompagnement de bout en bout dans leurs opérations commerciales.",
        "category": "commerce", "image": IMG["cargo1"], "author": "Direction commerciale STMP",
    },
    {
        "title": "Agriculture durable : préserver nos sols pour les générations futures",
        "excerpt": "Adopter des pratiques agricoles responsables au service de la sécurité alimentaire.",
        "content": "L'agriculture durable concilie productivité, rentabilité et respect de l'environnement. Elle repose sur l'utilisation raisonnée des intrants, la préservation de la fertilité des sols et la formation des producteurs.\n\nFidèle à sa devise « Nourrir nos terres pour nourrir l'Afrique », STMP Agri s'engage activement dans la promotion de bonnes pratiques agricoles auprès des coopératives et des exploitants.",
        "category": "conseils", "image": IMG["sustain"], "author": "Équipe RSE STMP",
    },
    {
        "title": "Innovations agricoles : l'irrigation goutte-à-goutte au service du rendement",
        "excerpt": "Optimiser l'usage de l'eau grâce aux technologies d'irrigation de précision.",
        "content": "Face aux aléas climatiques, l'irrigation goutte-à-goutte s'impose comme une solution efficace pour économiser l'eau tout en améliorant les rendements. Cette technologie permet d'apporter la juste quantité d'eau et de nutriments directement aux racines.\n\nSTMP Agri propose des kits d'irrigation modulables et accompagne les exploitations dans leur transition vers une agriculture de précision.",
        "category": "innovation", "image": IMG["african_agri"], "author": "Équipe innovation STMP",
    },
]

SEED_REALISATIONS = [
    {"title": "Livraison de 5 000 tonnes d'engrais NPK", "description": "Approvisionnement d'une coopérative régionale en engrais complets pour la campagne rizicole, dans les délais impartis.", "category": "intrants", "image": IMG["fertilizer"], "location": "Bouaké, Côte d'Ivoire", "year": "2024", "order": 1},
    {"title": "Opération logistique multimodale", "description": "Acheminement de conteneurs du port d'Abidjan vers l'hinterland via un réseau de transport routier optimisé.", "category": "logistique", "image": IMG["cargo1"], "location": "Abidjan → Korhogo", "year": "2024", "order": 2},
    {"title": "Partenariat avec une coopérative cacaoyère", "description": "Fourniture d'intrants et de produits phytosanitaires accompagnée d'un programme de formation aux bonnes pratiques.", "category": "partenariat", "image": IMG["sustain"], "location": "San-Pédro", "year": "2023", "order": 3},
    {"title": "Importation réussie d'urée 46%", "description": "Sourcing international, dédouanement et distribution de 3 000 tonnes d'urée pour les cultures industrielles.", "category": "import", "image": IMG["cargo2"], "location": "Port d'Abidjan", "year": "2024", "order": 4},
    {"title": "Extension de la flotte de transport", "description": "Renforcement de notre capacité logistique avec l'acquisition de nouveaux camions pour le transport national et sous-régional.", "category": "infrastructure", "image": IMG["truck"], "location": "Côte d'Ivoire", "year": "2023", "order": 5},
    {"title": "Distribution agroalimentaire régionale", "description": "Valorisation et distribution de produits agroalimentaires transformés vers les marchés de la sous-région.", "category": "agroalimentaire", "image": IMG["agro"], "location": "Afrique de l'Ouest", "year": "2024", "order": 6},
]

SEED_PARTNERS = [
    {"name": "Fournisseurs internationaux d'intrants", "type": "Fournisseur", "order": 1},
    {"name": "Coopératives agricoles", "type": "Coopérative", "order": 2},
    {"name": "Producteurs locaux", "type": "Producteur", "order": 3},
    {"name": "Industriels agroalimentaires", "type": "Industriel", "order": 4},
    {"name": "Institutions publiques", "type": "Institution", "order": 5},
    {"name": "Organisations non gouvernementales", "type": "ONG", "order": 6},
    {"name": "Partenaires bancaires", "type": "Banque", "order": 7},
    {"name": "Compagnies de transport", "type": "Transport", "order": 8},
    {"name": "Partenaires logistiques portuaires", "type": "Logistique", "order": 9},
    {"name": "Distributeurs régionaux", "type": "Distribution", "order": 10},
]

SEED_CERTIFICATIONS = [
    {"title": "Agrément d'exercice - Distribution d'intrants", "issuer": "Ministère de l'Agriculture", "description": "Autorisation officielle d'importation et de distribution d'intrants agricoles sur le territoire national.", "year": "2016", "order": 1},
    {"title": "Homologation phytosanitaire (CSP)", "issuer": "Comité Sanitaire Phytosanitaire", "description": "Conformité de nos produits phytosanitaires aux réglementations nationales et régionales.", "year": "2018", "order": 2},
    {"title": "Certification qualité ISO 9001", "issuer": "Organisme certificateur", "description": "Système de management de la qualité orienté satisfaction client et amélioration continue.", "year": "2020", "order": 3},
    {"title": "Norme HACCP - Agroalimentaire", "issuer": "Autorité sanitaire", "description": "Maîtrise de la sécurité sanitaire des produits agroalimentaires transformés et distribués.", "year": "2021", "order": 4},
    {"title": "Agrément transport de marchandises", "issuer": "Ministère des Transports", "description": "Autorisation d'exercice pour le transport national et international de marchandises.", "year": "2019", "order": 5},
]
