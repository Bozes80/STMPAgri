import {
  Ship, Sprout, ShieldCheck, Truck, Factory, Store,
  Globe2, Users, Award, Clock, HeartHandshake, Leaf, PackageCheck,
} from "lucide-react";

export const COMPANY = {
  name: "STMP Agri",
  fullName: "Société de Transport de Management et de Production Agri",
  slogan: "Nourrir nos terres pour nourrir l'Afrique.",
  phone: "+225 27 21 34 26 74",
  phoneHref: "tel:+2252721342674",
  mobiles: [
    { value: "(+225) 05 01 04 64 64", href: "tel:+2250501046464" },
    { value: "(+225) 07 89 99 36 40", href: "tel:+2250789993640" },
  ],
  whatsapp: "225 07 07 07 07 07",
  whatsappHref: "https://wa.me/2250707070707",
  email: "contact@stmpagri.ci",
  address: "Treichville, Avenue 21, Rue 12 - Face de Cacomiaf",
  hours: [
    { day: "Lundi – Vendredi", time: "08h00 – 18h00" },
    { day: "Samedi", time: "09h00 – 13h00" },
    { day: "Dimanche", time: "Fermé" },
  ],
  social: {
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
  },
  mapEmbed:
    "https://www.google.com/maps?q=5.3012616,-4.0091536&z=17&output=embed",
};

export const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Nos métiers", to: "/#metiers" },
  { label: "Produits", to: "/produits" },
  { label: "Réalisations", to: "/realisations" },
  { label: "Actualités", to: "/actualites" },
  { label: "Partenaires", to: "/partenaires" },
  { label: "Certifications", to: "/certifications" },
  { label: "RSE", to: "/rse" },
  { label: "Contact", to: "/contact" },
];

export const SERVICES = [
  { icon: Ship, key: "import-export", title: "Import-export", text: "Gestion des opérations internationales, formalités douanières, sourcing et logistique." },
  { icon: Sprout, key: "intrants", title: "Intrants agricoles", text: "Distribution d'engrais, fertilisants, amendements et équipements agricoles." },
  { icon: ShieldCheck, key: "phyto", title: "Produits phytosanitaires", text: "Solutions de protection des cultures conformes aux normes en vigueur." },
  { icon: Truck, key: "transport", title: "Transport", text: "Transport routier, logistique, stockage et suivi des marchandises." },
  { icon: Factory, key: "agro", title: "Agroalimentaire", text: "Valorisation, transformation et distribution de produits agricoles." },
  { icon: Store, key: "commerce", title: "Commerce général", text: "Distribution de biens et services pour les secteurs public et privé." },
];

export const WHY_US = [
  { icon: Award, title: "Expertise multisectorielle", text: "Une maîtrise complète de la chaîne agricole, logistique et commerciale." },
  { icon: Globe2, title: "Réseau international", text: "Un réseau de partenaires fiables à travers l'Afrique et le monde." },
  { icon: PackageCheck, title: "Qualité des produits", text: "Des intrants certifiés et conformes aux normes en vigueur." },
  { icon: Clock, title: "Respect des délais", text: "Une logistique maîtrisée pour livrer au bon moment, partout." },
  { icon: HeartHandshake, title: "Accompagnement personnalisé", text: "Des conseils adaptés aux besoins réels de chaque client." },
  { icon: Leaf, title: "Agriculture durable", text: "Un engagement concret pour préserver nos sols et nos ressources." },
];

export const PRODUCT_CATEGORIES = [
  { value: "all", label: "Tous les produits" },
  { value: "engrais", label: "Engrais" },
  { value: "fertilisants", label: "Fertilisants" },
  { value: "herbicides", label: "Herbicides" },
  { value: "insecticides", label: "Insecticides" },
  { value: "fongicides", label: "Fongicides" },
  { value: "equipements", label: "Équipements agricoles" },
];

export const ARTICLE_CATEGORIES = [
  { value: "all", label: "Toutes" },
  { value: "conseils", label: "Conseils agricoles" },
  { value: "nutrition", label: "Nutrition des cultures" },
  { value: "phytosanitaire", label: "Protection phytosanitaire" },
  { value: "logistique", label: "Logistique" },
  { value: "commerce", label: "Commerce international" },
  { value: "innovation", label: "Innovations agricoles" },
];

export const SECTEURS = [
  "Agriculture", "Coopérative", "Industrie", "ONG",
  "Administration", "Commerce", "Transport", "Agroalimentaire", "Autre",
];

export const OBJETS_DEMANDE = [
  "Import-export", "Engrais", "Intrants agricoles", "Produits phytosanitaires",
  "Transport", "Agroalimentaire", "Commerce général", "Autre",
];

export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1768775517205-7f4bc1b3f771?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwYWdyaWN1bHR1cmUlMjBmaWVsZCUyMHN1bnNldHxlbnwwfHx8fDE3ODM5NTU4ODN8MA&ixlib=rb-4.1.0&q=85",
  cargo1: "https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMHNoaXAlMjBjb250YWluZXJzJTIwcG9ydHxlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
  cargo2: "https://images.unsplash.com/photo-1678182451047-196f22a4143e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxjYXJnbyUyMHNoaXAlMjBjb250YWluZXJzJTIwcG9ydHxlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
  truck: "https://images.unsplash.com/photo-1670509295484-df0c2512fec4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxjb21tZXJjaWFsJTIwdHJhbnNwb3J0JTIwdHJ1Y2slMjBoaWdod2F5fGVufDB8fHx8MTc4Mzk1NTg4M3ww&ixlib=rb-4.1.0&q=85",
  sustain: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHw0fHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBoYW5kc3xlbnwwfHx8fDE3ODM5NTU4ODR8MA&ixlib=rb-4.1.0&q=85",
  warehouse: "https://images.unsplash.com/photo-1586528116022-aeda1613c63d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHx3YXJlaG91c2UlMjBsb2dpc3RpY3MlMjB3b3JrZXJzfGVufDB8fHx8MTc4Mzk1NTg4M3ww&ixlib=rb-4.1.0&q=85",
  agro: "https://images.unsplash.com/photo-1651525669944-00de65d3b8a5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxmb29kJTIwcHJvY2Vzc2luZyUyMGFncm8lMjBpbmR1c3RyeXxlbnwwfHx8fDE3ODM5NTU4OTh8MA&ixlib=rb-4.1.0&q=85",
  fertilizer: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxmZXJ0aWxpemVyJTIwcGxhbnQlMjBzYWNrcyUyMGFncmljdWx0dXJlfGVufDB8fHx8MTc4Mzk1NTg5OHww&ixlib=rb-4.1.0&q=85",
  phyto: "https://images.pexels.com/photos/37965300/pexels-photo-37965300.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

export const METIER_DETAILS = {
  "import-export": {
    title: "Import-export",
    tagline: "Vos opérations internationales, gérées de bout en bout.",
    image: IMAGES.cargo1,
    intro:
      "STMP Agri accompagne les entreprises et les institutions dans l'ensemble de leurs opérations d'import-export. De la recherche de fournisseurs au dédouanement, en passant par la logistique portuaire, nous sécurisons chaque étape de la chaîne d'approvisionnement internationale.\nGrâce à notre réseau de partenaires en Afrique et à l'international, nous garantissons des délais maîtrisés et une parfaite conformité réglementaire.",
    features: [
      "Sourcing international de produits et d'intrants",
      "Gestion des formalités douanières",
      "Logistique portuaire et dédouanement au port d'Abidjan",
      "Acheminement vers l'hinterland et la sous-région",
      "Suivi documentaire et traçabilité des marchandises",
    ],
  },
  intrants: {
    title: "Intrants agricoles",
    tagline: "Des intrants certifiés pour des rendements durables.",
    image: IMAGES.fertilizer,
    intro:
      "Nous distribuons une gamme complète d'engrais, de fertilisants, d'amendements et d'équipements agricoles sélectionnés pour leur qualité et leur conformité aux normes.\nNos conseillers agronomiques accompagnent producteurs et coopératives dans le choix des intrants adaptés à chaque type de sol et de culture.",
    features: [
      "Engrais NPK, Urée, KCL, Kieserite",
      "Fertilisants organo-minéraux et amendements",
      "Équipements et matériels agricoles",
      "Conseil agronomique et plan de fertilisation",
      "Approvisionnement fiable sur tout le territoire",
    ],
    relatedCategory: "engrais",
  },
  phyto: {
    title: "Produits phytosanitaires",
    tagline: "Protéger les cultures, en toute conformité.",
    image: IMAGES.phyto,
    intro:
      "STMP Agri propose des solutions de protection des cultures — herbicides, insecticides et fongicides — homologuées et conformes aux réglementations phytosanitaires en vigueur.\nNous formons les producteurs aux bonnes pratiques d'application pour garantir la sécurité des opérateurs, des consommateurs et de l'environnement.",
    features: [
      "Herbicides sélectifs et totaux homologués",
      "Insecticides systémiques, de contact et biologiques",
      "Fongicides préventifs et curatifs",
      "Conformité aux normes du Comité Sanitaire Phytosanitaire",
      "Formation aux bonnes pratiques d'application",
    ],
    relatedCategory: "herbicides",
  },
  transport: {
    title: "Transport de marchandises",
    tagline: "Une logistique maîtrisée, du départ à la livraison.",
    image: IMAGES.truck,
    intro:
      "Notre flotte et notre réseau de partenaires assurent le transport routier national et international de vos marchandises, ainsi que leur stockage et leur suivi.\nNous garantissons le respect des délais et la sécurité des opérations logistiques, quel que soit le volume ou la destination.",
    features: [
      "Transport routier national et international",
      "Solutions de stockage et d'entreposage",
      "Suivi et traçabilité des marchandises",
      "Logistique multimodale (port, route)",
      "Respect rigoureux des délais",
    ],
  },
  agro: {
    title: "Agroalimentaire",
    tagline: "De la valorisation à la distribution.",
    image: IMAGES.agro,
    intro:
      "STMP Agri intervient sur la chaîne agroalimentaire : valorisation, transformation et distribution de produits agricoles vers les marchés locaux et de la sous-région.\nNous contribuons à créer de la valeur ajoutée locale tout en respectant les normes de sécurité sanitaire.",
    features: [
      "Valorisation des productions agricoles",
      "Transformation et conditionnement",
      "Distribution vers les marchés régionaux",
      "Maîtrise de la sécurité sanitaire (HACCP)",
      "Soutien aux filières et coopératives",
    ],
  },
  commerce: {
    title: "Commerce général",
    tagline: "Un partenaire de confiance pour vos achats et ventes.",
    image: IMAGES.cargo2,
    intro:
      "Au-delà de l'agriculture, STMP Agri assure la distribution de biens et services pour les secteurs public et privé.\nNotre expertise commerciale et notre réseau nous permettent de répondre à des besoins variés, avec réactivité et transparence.",
    features: [
      "Distribution de biens et services",
      "Approvisionnement pour le secteur public et privé",
      "Négoce et sourcing multi-produits",
      "Réactivité et transparence commerciale",
      "Accompagnement personnalisé des clients",
    ],
  },
};
