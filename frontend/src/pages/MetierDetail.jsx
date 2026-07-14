import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, FileText, Package } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotifDivider } from "@/components/SectionHeading";
import { METIER_DETAILS, SERVICES, PRODUCT_CATEGORIES } from "@/lib/constants";

export default function MetierDetail() {
  const { key } = useParams();
  const data = METIER_DETAILS[key];
  if (!data) return <Navigate to="/" replace />;

  const service = SERVICES.find((s) => s.key === key);
  const Icon = service?.icon || Package;
  const others = SERVICES.filter((s) => s.key !== key);
  const relatedCatLabel = data.relatedCategory
    ? PRODUCT_CATEGORIES.find((c) => c.value === data.relatedCategory)?.label
    : null;

  return (
    <>
      <PageHero crumb={data.title} title={data.title} subtitle={data.tagline} image={data.image} />

      <section className="py-16">
        <div className="container-stmp grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <Reveal>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A]">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold">{data.title}</h2>
              </div>
              {data.intro.split("\n").filter(Boolean).map((p, i) => (
                <p key={i} className="mt-4 text-muted-foreground leading-relaxed">{p}</p>
              ))}
            </Reveal>

            <Reveal>
              <h3 className="mt-10 font-heading font-semibold text-lg">Nos prestations</h3>
              <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                {data.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-[#7FAE3C] shrink-0 mt-0.5" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="metier-quote-btn">
                  <FileText className="h-5 w-5 mr-2" /> Demander un devis
                </Link>
              </Button>
              {relatedCatLabel && (
                <Button asChild size="lg" variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
                  <Link to={`/produits?cat=${data.relatedCategory}`} data-testid="metier-products-btn">
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
                <h3 className="font-heading font-semibold text-lg">Nos autres métiers</h3>
                <div className="mt-4 space-y-1.5">
                  {others.map((s) => (
                    <Link
                      key={s.key}
                      to={`/metiers/${s.key}`}
                      data-testid={`metier-other-${s.key}`}
                      className="group flex items-center gap-3 rounded-lg p-3 hover:bg-[#0E7A3A]/5 transition-colors"
                    >
                      <div className="h-10 w-10 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <span className="flex-1 text-sm font-medium">{s.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0E7A3A] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
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
                Besoin d'une solution en {data.title.toLowerCase()} ?
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
