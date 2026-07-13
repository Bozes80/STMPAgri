import { useQuery } from "@tanstack/react-query";
import {
  Loader2, ShieldCheck, FileCheck2, Leaf, ClipboardCheck, PackageSearch,
  Truck, Download, Award,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import api from "@/lib/api";
import { IMAGES } from "@/lib/constants";

const COMMITMENTS = [
  { icon: FileCheck2, title: "Agréments & autorisations", text: "Autorisations officielles d'exercice et d'importation d'intrants agricoles." },
  { icon: ShieldCheck, title: "Conformité phytosanitaire", text: "Produits homologués et conformes aux réglementations nationales et internationales." },
  { icon: ClipboardCheck, title: "Politique qualité", text: "Un système de management de la qualité orienté satisfaction client." },
  { icon: PackageSearch, title: "Traçabilité des marchandises", text: "Un suivi rigoureux de chaque lot, de l'origine à la livraison." },
  { icon: Truck, title: "Sécurité logistique", text: "Des opérations de transport et de stockage sécurisées et contrôlées." },
  { icon: Leaf, title: "Bonnes pratiques agricoles", text: "Un engagement fort pour une agriculture responsable et durable." },
];

export default function Certifications() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["certifications"],
    queryFn: async () => (await api.get("/certifications")).data,
  });

  return (
    <>
      <PageHero
        crumb="Certifications"
        title="Certifications & conformité"
        subtitle="Notre engagement envers la qualité, la sécurité et le respect des réglementations, à chaque étape de nos opérations."
        image={IMAGES.warehouse}
      />

      <section className="py-16">
        <div className="container-stmp">
          <Reveal>
            <SectionHeading align="center" eyebrow="Nos engagements" title="La qualité et la conformité au cœur de nos opérations" />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMMITMENTS.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.05}>
                <Card className="h-full p-7 border-border rounded-xl hover:border-[#0E7A3A]/40 transition-colors">
                  <div className="h-12 w-12 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A]">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-heading font-semibold text-lg">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/40">
        <div className="container-stmp">
          <Reveal>
            <SectionHeading eyebrow="Frise chronologique" title="Nos certifications & agréments" />
          </Reveal>

          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
            </div>
          ) : (
            <div className="mt-12 relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />
              <div className="space-y-8">
                {data.map((c, i) => (
                  <Reveal key={c.id}>
                    <div className={`relative flex gap-6 md:gap-0 md:items-center ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                      <div className="absolute left-4 md:left-1/2 h-4 w-4 rounded-full bg-[#F2D400] ring-4 ring-background md:-translate-x-1/2 mt-1.5 md:mt-0" />
                      <div className="md:w-1/2" />
                      <div className={`pl-12 md:pl-0 md:w-1/2 ${i % 2 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                        <Card data-testid={`certification-${c.id}`} className="p-6 border-border rounded-xl inline-block w-full">
                          <div className={`flex items-center gap-3 ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                            <Award className="h-5 w-5 text-[#0E7A3A] shrink-0" />
                            <span className="font-heading font-bold text-[#0E7A3A] dark:text-[#A8D45A]">{c.year}</span>
                          </div>
                          <h3 className="mt-2 font-heading font-semibold text-lg">{c.title}</h3>
                          {c.issuer && <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{c.issuer}</p>}
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                          {c.pdf_url && (
                            <Button asChild size="sm" variant="outline" className="mt-4">
                              <a href={c.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1.5" /> Télécharger le certificat
                              </a>
                            </Button>
                          )}
                        </Card>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
