import { Link } from "react-router-dom";
import { Leaf, Recycle, Users, Scale, CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading, MotifDivider } from "@/components/SectionHeading";
import { IMAGES } from "@/lib/constants";

const PILLARS = [
  {
    icon: Leaf,
    title: "Agriculture durable",
    points: ["Préservation des sols", "Utilisation raisonnée des intrants", "Sensibilisation des producteurs", "Promotion des bonnes pratiques agricoles"],
  },
  {
    icon: Recycle,
    title: "Protection de l'environnement",
    points: ["Réduction des déchets", "Gestion responsable des emballages", "Réduction de l'empreinte carbone", "Optimisation du transport"],
  },
  {
    icon: Users,
    title: "Engagement social",
    points: ["Formation des agriculteurs", "Création d'emplois", "Soutien aux coopératives", "Développement local"],
  },
  {
    icon: Scale,
    title: "Gouvernance",
    points: ["Transparence", "Éthique", "Respect des réglementations", "Lutte contre la corruption"],
  },
];

export default function RSE() {
  return (
    <>
      <PageHero
        crumb="RSE"
        title="Responsabilité Sociétale d'Entreprise"
        subtitle="Fidèles à notre devise « Nourrir nos terres pour nourrir l'Afrique », nous agissons pour un développement durable et responsable."
        image={IMAGES.sustain}
      />

      <section className="py-16">
        <div className="container-stmp">
          <Reveal>
            <SectionHeading align="center" eyebrow="Nos engagements" title="Quatre piliers pour un impact durable" />
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <Card data-testid={`rse-pillar-${i}`} className="h-full p-8 border-border rounded-xl hover:border-[#0E7A3A]/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-13 w-13 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A] p-3">
                      <p.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading font-semibold text-xl">{p.title}</h3>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-[#7FAE3C] mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMAGES.african_agri} alt="Équipes STMP Agri sur le terrain" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[#08160c]/80" />
        </div>
        <div className="container-stmp relative z-10 py-24 text-center">
          <MotifDivider className="mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white max-w-3xl mx-auto">
            Nos équipes sur le terrain, au plus près des producteurs
          </h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Formation, accompagnement et proximité : nous plaçons l'humain et la durabilité au centre de notre action.
          </p>
          <Button asChild size="lg" className="mt-8 bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
            <Link to="/contact">Rejoindre nos initiatives</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
