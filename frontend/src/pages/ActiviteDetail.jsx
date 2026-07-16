import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, FileText, Package, Sprout, ShieldCheck, Factory, Truck, Store } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotifDivider } from "@/components/SectionHeading";
import { ACTIVITES, ACTIVITE_DETAILS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";

const ICONS = { Sprout, ShieldCheck, Factory, Truck, Store };

export default function ActiviteDetail() {
  const { key } = useParams();
  const activite = ACTIVITES.find((a) => a.key === key);
  const details = ACTIVITE_DETAILS[key];
  if (!activite || !details) return <Navigate to="/activites" replace />;

  const Icon = ICONS[activite.icon] || Package;
  const others = ACTIVITES.filter((a) => a.key !== key);
  const relatedCatLabel = activite.relatedCategory
    ? PRODUCT_CATEGORIES.find((c) => c.value === activite.relatedCategory)?.label
    : null;

  return (
    <>
      <PageHero
        crumb={activite.title}
        title={activite.title}
        subtitle={activite.tagline}
        image={activite.image}
      />

      <section className="py-16">
        <div className="container-stmp grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <Reveal>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A]">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold">{activite.title}</h2>
              </div>
              {details.intro.split("\n").filter(Boolean).map((p, i) => (
                <p key={i} className="mt-4 text-muted-foreground leading-relaxed">{p}</p>
              ))}
            </Reveal>

            <Reveal>
              <h3 className="mt-10 font-heading font-semibold text-lg">Ce que nous vous apportons</h3>
              <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                {details.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-[#7FAE3C] shrink-0 mt-0.5" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="activite-quote-btn">
                  <FileText className="h-5 w-5 mr-2" /> Demander un devis
                </Link>
              </Button>
              {relatedCatLabel && (
                <Button asChild size="lg" variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
                  <Link to={`/produits?cat=${activite.relatedCategory}`} data-testid="activite-products-btn">
                    <Package className="h-4 w-4 mr-2" /> Voir les {relatedCatLabel.toLowerCase()}
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>

          <aside className="lg:col-span-2">
            <Reveal delay={0.1}>
              <Card className="p-6 border-border rounded-2xl sticky top-24">
                <h3 className="font-heading font-semibold text-lg">Nos autres activités</h3>
                <div className="mt-4 space-y-1.5">
                  {others.map((a) => {
                    const OtherIcon = ICONS[a.icon] || Package;
                    return (
                      <Link
                        key={a.key}
                        to={`/activites/${a.key}`}
                        data-testid={`activite-other-${a.key}`}
                        className="group flex items-center gap-3 rounded-lg p-3 hover:bg-[#0E7A3A]/5 transition-colors"
                      >
                        <div className="h-10 w-10 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0">
                          <OtherIcon className="h-5 w-5" />
                        </div>
                        <span className="flex-1 text-sm font-medium">{a.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0E7A3A] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
          </aside>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-stmp">
          <div className="relative overflow-hidden rounded-3xl bg-[#111C15] px-8 py-14 text-center">
            <div className="absolute inset-0 motif-plots opacity-40" />
            <div className="relative">
              <MotifDivider className="mb-5" />
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white">
                Besoin d'une solution en {activite.title.toLowerCase()} ?
              </h2>
              <p className="mt-3 text-white/70 max-w-xl mx-auto">
                Nos conseillers vous répondent rapidement avec une offre adaptée à vos besoins.
              </p>
              <Button asChild size="lg" className="mt-7 bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis">Demander un devis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
