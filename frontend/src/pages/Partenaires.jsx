import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, Globe2, Network, Handshake } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/SectionHeading";
import api from "@/lib/api";
import { IMAGES } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";

function LogoTrack({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-4">
      <div className="flex w-max animate-marquee gap-5">
        {doubled.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 min-w-[240px]"
          >
            <div className="h-11 w-11 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0 overflow-hidden">
              {p.logo ? (
                <img
                  src={resolveImageUrl(p.logo)}
                  alt={p.name}
                  className="h-full w-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div className="leading-tight">
              <div className="font-heading font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Partenaires() {
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => (await api.get("/partners")).data,
  });
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await api.get("/stats")).data,
  });

  const statItems = [
    { icon: Handshake, value: stats?.partners, suffix: "+", label: "Partenaires" },
    { icon: Globe2, value: stats?.countries, suffix: "", label: "Pays couverts" },
    { icon: Network, value: "Intl.", suffix: "", label: "Réseau international" },
  ];

  const half = Math.ceil(partners.length / 2);

  return (
    <>
      <PageHero
        crumb="Partenaires"
        title="Nos partenaires de confiance"
        subtitle="Fournisseurs internationaux, coopératives, producteurs, institutions et partenaires logistiques : un réseau solide au service de vos projets."
        image={IMAGES.cargo2}
      />

      <section className="py-16">
        <div className="container-stmp grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statItems.map((s) => (
            <Reveal key={s.label}>
              <Card className="p-8 text-center border-border rounded-xl" data-testid={`partner-stat-${s.label}`}>
                <s.icon className="h-8 w-8 mx-auto text-[#7FAE3C]" />
                <div className="mt-3 font-heading text-4xl font-bold text-[#0E7A3A] dark:text-[#A8D45A]">
                  {s.value ?? "—"}
                  {typeof s.value === "number" && s.suffix}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-10 bg-muted/40">
        <div className="container-stmp">
          <Reveal>
            <SectionHeading align="center" eyebrow="Ils nous font confiance" title="Un écosystème de partenaires engagés" />
          </Reveal>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            <LogoTrack items={partners.slice(0, half)} />
            <LogoTrack items={partners.slice(half)} />
          </div>
        )}
      </section>
    </>
  );
}
