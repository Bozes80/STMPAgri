import { Link } from "react-router-dom";
import { ArrowRight, FileText, Layers, Loader2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotifDivider } from "@/components/SectionHeading";
import { resolveImageUrl } from "@/lib/media";
import { useActivities } from "@/hooks/useActivities";
import { IMAGES } from "@/lib/constants";

export default function Activites() {
  const { activities, isLoading } = useActivities();

  const heroImage = activities?.[0]?.image || IMAGES.heroField || "";

  return (
    <>
      <PageHero
        crumb="Nos activités"
        title="Nos activités"
        subtitle="Cinq expertises commerciales et opérationnelles au service des producteurs, industriels et institutions."
        image={resolveImageUrl(heroImage)}
      />

      <section className="py-16">
        <div className="container-stmp">
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin inline-block text-[#0E7A3A]" /></div>
          ) : activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-16" data-testid="activites-empty">
              Aucune activité pour le moment.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" data-testid="activites-grid">
              {activities.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.05}>
                  <Link
                    to={`/activites/${a.key}`}
                    data-testid={`activite-card-${a.key}`}
                    className="group block h-full"
                  >
                    <Card className="h-full overflow-hidden border-border rounded-2xl bg-card transition-all duration-300 hover:-translate-y-1 hover:border-[#0E7A3A]/40 hover:shadow-xl">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        {a.image ? (
                          <img
                            src={resolveImageUrl(a.image)}
                            alt={a.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Layers className="h-12 w-12 opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08160c]/70 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 h-11 w-11 grid place-items-center rounded-xl bg-white/90 text-[#0E7A3A] shadow-sm overflow-hidden">
                          {a.icon_url ? (
                            <img src={resolveImageUrl(a.icon_url)} alt="" className="h-6 w-6 object-contain"
                              onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <Layers className="h-5 w-5" />
                          )}
                        </div>
                        <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-white/90">
                          0{i + 1}
                        </span>
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading font-semibold text-lg md:text-xl">{a.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {a.teaser}
                        </p>
                        {a.children?.length > 0 && (
                          <p className="mt-2 text-xs text-[#0E7A3A] font-semibold">
                            + {a.children.length} sous-rubrique{a.children.length > 1 ? "s" : ""}
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0E7A3A] group-hover:gap-2 transition-all">
                          En savoir plus <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="container-stmp">
          <div className="relative overflow-hidden rounded-3xl bg-[#111C15] px-8 py-14 text-center">
            <div className="absolute inset-0 motif-plots opacity-40" />
            <div className="relative">
              <MotifDivider className="mb-5" />
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white">
                Un projet à concrétiser ?
              </h2>
              <p className="mt-3 text-white/70 max-w-xl mx-auto">
                Confiez vos besoins à nos conseillers. Nous vous proposons une offre adaptée sous 48 heures.
              </p>
              <Button asChild size="lg" className="mt-7 bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="activites-quote-btn">
                  <FileText className="h-5 w-5 mr-2" /> Demander un devis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
