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
    "https://www.google.com/maps?q=Yopougon,Abidjan,Cote+d'Ivoire&output=embed",
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
