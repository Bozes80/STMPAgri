import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Globe2, Users, Award, CalendarClock, CheckCircle2, MoveUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Reveal from "@/components/Reveal";
import { SectionHeading, MotifDivider } from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import ArticleCard from "@/components/ArticleCard";
import api from "@/lib/api";
import { SERVICES, WHY_US, IMAGES, COMPANY } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";
import { useHome } from "@/hooks/useHome";
import heroImg from "@/assets/hero.webp";

const ACTIVITIES = [
  {
    title: "Achat et vente d'engrais",
    image: IMAGES.fertilizer,
    text: "STMP Agri sélectionne et distribue des engrais de qualité — NPK, Urée, KCL, Kieserite — pour optimiser la nutrition de vos cultures et maximiser vos rendements. Un approvisionnement fiable, au meilleur rapport qualité-prix.",
    cta: "Découvrir cette activité",
    to: "/activites/achat-vente-engrais",
  },
  {
    title: "Vente de produits phytosanitaires",
    image: IMAGES.phyto,
    text: "Herbicides, insecticides et fongicides homologués et conformes aux normes phytosanitaires en vigueur. Nous protégeons vos cultures tout en garantissant la sécurité des opérateurs et des consommateurs.",
    cta: "Découvrir cette activité",
    to: "/activites/produits-phytosanitaires",
  },
  {
    title: "Distribution de produits agroalimentaires",
    image: IMAGES.agro,
    text: "De la valorisation à la distribution, STMP Agri accompagne la filière agroalimentaire avec des solutions logistiques adaptées et un réseau de distribution étendu sur toute la sous-région.",
    cta: "Découvrir cette activité",
    to: "/activites/agroalimentaire",
  },
  {
    title: "Transport de marchandises",
    image: IMAGES.truck,
    text: "Notre flotte et notre réseau de partenaires assurent le transport routier national et international, le stockage et le suivi de vos marchandises, dans le respect des délais et en toute sécurité.",
    cta: "Découvrir cette activité",
    to: "/activites/transport-marchandises",
  },
  {
    title: "Commerce général",
    image: IMAGES.cargo2,
    text: "Import-export, sourcing et distribution de biens et services pour les secteurs public et privé. STMP Agri est votre partenaire de confiance pour vos opérations commerciales à l'international.",
    cta: "Découvrir cette activité",
    to: "/activites/commerce-general",
  },
];

function Hero() {
  const { home } = useHome();
  const heroData = home?.hero || {};
  const bgSrc = heroData.background_image ? resolveImageUrl(heroData.background_image) : heroImg;
  const title = heroData.title || "Des solutions intégrées pour l'agriculture, la logistique et le commerce international.";
  const subtitle = heroData.subtitle || "STMP Agri accompagne les producteurs, les entreprises et les institutions avec des solutions fiables en approvisionnement agricole, transport de marchandises, import-export et commerce général.";
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={bgSrc} alt="" className="h-full w-full object-cover"
          onError={(e) => { e.currentTarget.src = heroImg; }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08160c]/90 via-[#0b1f10]/75 to-[#0E7A3A]/30" />
      </div>

      <div className="container-stmp relative z-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#F2D400]" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              {COMPANY.slogan}
            </span>
          </div>

          <h1 data-testid="hero-title" className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-white">
            {title}
          </h1>

          <p data-testid="hero-subtitle" className="mt-6 text-lg text-white/80 max-w-2xl leading-relaxed whitespace-pre-line">
            {subtitle}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              data-testid="hero-quote-btn"
              className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00] h-12 px-7 text-base"
            >
              <Link to="/devis">
                <FileText className="h-5 w-5 mr-2" /> Demander un devis
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              data-testid="hero-discover-btn"
              className="h-12 px-7 text-base bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/activites">
                Découvrir nos activités <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {["Intrants certifiés", "Réseau international", "Logistique maîtrisée"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle2 className="h-4 w-4 text-[#A8D45A]" /> {t}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function About() {
  const { home } = useHome();
  const a = home?.about;
  if (!a || !(a.text || "").trim()) return null;
  const paragraphs = (a.text || "").split("\n").filter((p) => p.trim());
  const hasImage = !!a.image;
  return (
    <section id="apropos" data-testid="home-about-section" className="py-24 bg-background border-y border-border">
      <div className="container-stmp">
        <Reveal>
          <div className={`grid gap-12 items-center ${hasImage ? "lg:grid-cols-2" : ""}`}>
            <div>
              <SectionHeading eyebrow={a.eyebrow || "À propos"} title={a.title || "STMP Agri"} />
              <div className="mt-6 space-y-4 max-w-2xl">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
                  <Link to="/metiers" data-testid="home-about-metiers-btn">
                    Découvrir nos métiers <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
            {hasImage && (
              <div className="relative">
                <div className="aspect-[5/4] rounded-3xl overflow-hidden border border-border shadow-lg">
                  <img src={resolveImageUrl(a.image)} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }} />
                </div>
                <div className="absolute -bottom-4 -left-4 hidden md:block h-24 w-24 rounded-2xl bg-[#F2D400]/30 -z-10" />
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Metiers() {
  return (
    <section id="metiers" className="py-24 motif-plots">
      <div className="container-stmp">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Nos métiers"
            title="Une expertise multisectorielle au service de vos ambitions"
            subtitle="De l'approvisionnement agricole au commerce international, STMP Agri couvre l'ensemble de la chaîne de valeur."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.05}>
              <Link to={`/metiers/${s.key}`} data-testid={`service-card-${s.key}`} className="block h-full">
                <Card
                  className="group h-full p-8 border-border rounded-xl bg-card transition-all duration-300 hover:-translate-y-1 hover:border-[#0E7A3A]/40 hover:shadow-lg"
                >
                  <div className="h-14 w-14 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A] transition-colors group-hover:bg-[#0E7A3A] group-hover:text-white">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 font-heading font-semibold text-xl">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0E7A3A] group-hover:gap-2 transition-all">
                    En savoir plus <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Activities() {
  return (
    <section className="py-24 bg-muted/40">
      <div className="container-stmp">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Nos activités"
            title="Des services concrets, une exécution rigoureuse"
          />
        </Reveal>
        <div className="mt-16 space-y-20">
          {ACTIVITIES.map((a, i) => {
            const reversed = i % 2 === 1;
            return (
              <Reveal key={a.title}>
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                  <div className={`overflow-hidden rounded-2xl ${reversed ? "lg:order-2" : ""}`}>
                    <img
                      src={a.image}
                      alt={a.title}
                      loading="lazy"
                      className="w-full aspect-[16/11] object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className={reversed ? "lg:order-1" : ""}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-px w-8 bg-[#F2D400]" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7FAE3C]">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl md:text-3xl font-semibold">{a.title}</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{a.text}</p>
                    <div className="mt-6 flex gap-3">
                      <Button asChild variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
                        <Link to={a.to}>{a.cta}</Link>
                      </Button>
                      <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
                        <Link to="/devis">Demander un devis</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const [active, setActive] = useState(null);
  return (
    <section className="py-24 bg-[#0E7A3A] text-white relative overflow-hidden">
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#F2D400]/10 blur-3xl" />
      <div className="container-stmp relative">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Pourquoi STMP Agri ?"
            title="La confiance, au cœur de chaque partenariat"
          />
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((w, i) => (
            <Reveal key={w.key} delay={i * 0.05}>
              <button
                type="button"
                onClick={() => setActive(w)}
                data-testid={`why-us-card-${w.key}`}
                className="group h-full w-full text-left rounded-xl border border-white/15 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-[#F2D400]/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F2D400]/60"
                aria-label={`En savoir plus : ${w.title}`}
              >
                <div className="flex items-start justify-between">
                  <w.icon className="h-8 w-8 text-[#F2D400]" />
                  <MoveUpRight className="h-4 w-4 text-white/40 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </div>
                <h3 className="mt-4 font-heading font-semibold text-lg">{w.title}</h3>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{w.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#F2D400]/90 group-hover:text-[#F2D400]">
                  Découvrir <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent
          data-testid="why-us-modal"
          className="max-w-2xl border-border bg-card"
        >
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A]">
                    <active.icon className="h-5 w-5" />
                  </div>
                  <DialogTitle className="font-heading text-xl md:text-2xl">
                    {active.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="pt-3 text-sm md:text-base leading-relaxed text-muted-foreground">
                  {active.intro}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#7FAE3C] mb-3">
                  Concrètement
                </h4>
                <ul className="space-y-2.5">
                  {active.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#0E7A3A] shrink-0 mt-0.5" />
                      <span className="text-foreground/85">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  asChild
                  className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]"
                  data-testid="why-us-modal-quote-btn"
                >
                  <Link to="/devis" onClick={() => setActive(null)}>
                    <FileText className="h-4 w-4 mr-2" /> Demander un devis
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  data-testid="why-us-modal-contact-btn"
                >
                  <Link to="/contact" onClick={() => setActive(null)}>
                    Nous contacter
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await api.get("/stats")).data,
  });
  const items = [
    { icon: Users, value: data?.partners, suffix: "+", label: "Partenaires de confiance" },
    { icon: Globe2, value: data?.countries, suffix: "", label: "Pays couverts" },
    { icon: Award, value: data?.clients, suffix: "+", label: "Clients accompagnés" },
    { icon: CalendarClock, value: data?.years, suffix: " ans", label: "D'expérience" },
  ];
  return (
    <section className="py-16 border-y border-border bg-background">
      <div className="container-stmp grid grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map((it) => (
          <div key={it.label} className="text-center" data-testid={`stat-${it.label}`}>
            <it.icon className="h-7 w-7 mx-auto text-[#7FAE3C]" />
            <div className="mt-3 font-heading text-4xl font-bold text-[#0E7A3A] dark:text-[#A8D45A]">
              {it.value ?? "—"}
              {it.value != null && it.suffix}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { data = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });
  const featured = data.filter((p) => p.featured).slice(0, 4);
  if (featured.length === 0) return null;
  return (
    <section className="py-24">
      <div className="container-stmp">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <SectionHeading eyebrow="Catalogue" title="Nos produits phares" />
          </Reveal>
          <Button asChild variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
            <Link to="/produits" data-testid="see-all-products">
              Tout le catalogue <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <Reveal key={p.id}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestArticles() {
  const { data = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => (await api.get("/articles")).data,
  });
  const latest = data.slice(0, 3);
  if (latest.length === 0) return null;
  return (
    <section className="py-24 bg-muted/40">
      <div className="container-stmp">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <SectionHeading eyebrow="Actualités" title="Conseils & expertise agricole" />
          </Reveal>
          <Button asChild variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
            <Link to="/actualites" data-testid="see-all-articles">
              Toutes les actualités <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {latest.map((a) => (
            <Reveal key={a.id}>
              <ArticleCard article={a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-20">
      <div className="container-stmp">
        <div className="relative overflow-hidden rounded-3xl bg-[#111C15] px-8 py-16 text-center md:px-16">
          <div className="absolute inset-0 motif-plots opacity-40" />
          <div className="relative">
            <MotifDivider className="mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white">
              Un projet agricole, logistique ou commercial ?
            </h2>
            <p className="mt-4 text-white/70 max-w-xl mx-auto">
              Confiez vos besoins à STMP Agri. Nos conseillers vous proposent une offre adaptée dans les plus brefs délais.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="cta-quote-btn">Demander un devis</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Metiers />
      <About />
      <Activities />
      <WhyUs />
      <Stats />
      <FeaturedProducts />
      <LatestArticles />
      <CtaBand />
    </>
  );
}
