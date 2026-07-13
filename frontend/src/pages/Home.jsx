import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Globe2, Users, Award, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Reveal from "@/components/Reveal";
import { SectionHeading, MotifDivider } from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import ArticleCard from "@/components/ArticleCard";
import api from "@/lib/api";
import { SERVICES, WHY_US, IMAGES, COMPANY } from "@/lib/constants";

const ACTIVITIES = [
  {
    title: "Achat et vente d'engrais",
    image: IMAGES.fertilizer,
    text: "STMP Agri sélectionne et distribue des engrais de qualité — NPK, Urée, KCL, Kieserite — pour optimiser la nutrition de vos cultures et maximiser vos rendements. Un approvisionnement fiable, au meilleur rapport qualité-prix.",
    cta: "Découvrir nos engrais",
    to: "/produits?cat=engrais",
  },
  {
    title: "Vente de produits phytosanitaires",
    image: IMAGES.phyto,
    text: "Herbicides, insecticides et fongicides homologués et conformes aux normes phytosanitaires en vigueur. Nous protégeons vos cultures tout en garantissant la sécurité des opérateurs et des consommateurs.",
    cta: "Voir les produits phyto",
    to: "/produits?cat=herbicides",
  },
  {
    title: "Distribution de produits agroalimentaires",
    image: IMAGES.agro,
    text: "De la valorisation à la distribution, STMP Agri accompagne la filière agroalimentaire avec des solutions logistiques adaptées et un réseau de distribution étendu sur toute la sous-région.",
    cta: "En savoir plus",
    to: "/contact",
  },
  {
    title: "Transport de marchandises",
    image: IMAGES.truck,
    text: "Notre flotte et notre réseau de partenaires assurent le transport routier national et international, le stockage et le suivi de vos marchandises, dans le respect des délais et en toute sécurité.",
    cta: "Nos solutions transport",
    to: "/contact",
  },
  {
    title: "Commerce général",
    image: IMAGES.cargo2,
    text: "Import-export, sourcing et distribution de biens et services pour les secteurs public et privé. STMP Agri est votre partenaire de confiance pour vos opérations commerciales à l'international.",
    cta: "Nous contacter",
    to: "/contact",
  },
];

function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMAGES.hero} alt="Champs agricoles au coucher du soleil" className="h-full w-full object-cover" />
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

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-white">
            Des solutions intégrées pour l'agriculture, la logistique et le commerce international.
          </h1>

          <p className="mt-6 text-lg text-white/80 max-w-2xl leading-relaxed">
            STMP Agri accompagne les producteurs, les entreprises et les institutions avec des solutions fiables en
            approvisionnement agricole, transport de marchandises, import-export et commerce général.
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
              <Link to="/#metiers">
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
              <Card
                data-testid={`service-card-${s.key}`}
                className="group h-full p-8 border-border rounded-xl bg-card transition-all duration-300 hover:-translate-y-1 hover:border-[#0E7A3A]/40 hover:shadow-lg"
              >
                <div className="h-14 w-14 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A] transition-colors group-hover:bg-[#0E7A3A] group-hover:text-white">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 font-heading font-semibold text-xl">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </Card>
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
            <Reveal key={w.title} delay={i * 0.05}>
              <div className="h-full rounded-xl border border-white/15 bg-white/5 p-7 backdrop-blur-sm transition-colors hover:bg-white/10">
                <w.icon className="h-8 w-8 text-[#F2D400]" />
                <h3 className="mt-4 font-heading font-semibold text-lg">{w.title}</h3>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{w.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
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
      <Activities />
      <WhyUs />
      <Stats />
      <FeaturedProducts />
      <LatestArticles />
      <CtaBand />
    </>
  );
}
