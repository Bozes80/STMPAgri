import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, FileText, Package, Layers, Loader2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotifDivider } from "@/components/SectionHeading";
import { resolveImageUrl } from "@/lib/media";
import { useCategories } from "@/hooks/useCategories";
import { useActivities, useActivityByKey } from "@/hooks/useActivities";

export default function ActiviteDetail() {
  const { key } = useParams();
  const { activity, isLoading } = useActivityByKey(key);
  const { activities } = useActivities();
  const { categories } = useCategories();

  if (isLoading) {
    return <div className="py-32 text-center"><Loader2 className="h-8 w-8 animate-spin inline-block text-[#0E7A3A]" /></div>;
  }
  if (!activity) return <Navigate to="/activites" replace />;

  const relatedCatLabel = activity.related_category
    ? categories.find((c) => c.value === activity.related_category)?.name
    : null;

  // "Autres activités" — exclut la courante et son parent éventuel
  const excludeIds = new Set([activity.id, activity.parent_id].filter(Boolean));
  const others = (activities || []).filter((a) => !excludeIds.has(a.id));

  const isChild = !!activity.parent_id;
  const parent = activity.parent;
  const children = activity.children || [];

  return (
    <>
      <PageHero
        crumb={parent ? `${parent.title} · ${activity.title}` : activity.title}
        title={activity.title}
        subtitle={activity.tagline}
        image={resolveImageUrl(activity.image)}
      />

      <section className="py-16">
        <div className="container-stmp grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            {isChild && parent && (
              <Reveal>
                <Link to={`/activites/${parent.key}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#0E7A3A] transition-colors mb-4"
                  data-testid="activite-back-parent">
                  <ArrowRight className="h-4 w-4 rotate-180" /> Retour à {parent.title}
                </Link>
              </Reveal>
            )}
            <Reveal>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 grid place-items-center rounded-xl bg-[#0E7A3A]/10 text-[#0E7A3A] overflow-hidden">
                  {activity.icon_url ? (
                    <img src={resolveImageUrl(activity.icon_url)} alt="" className="h-8 w-8 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <Layers className="h-7 w-7" />
                  )}
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold">{activity.title}</h2>
              </div>
              {(activity.intro || "").split("\n").filter(Boolean).map((p, i) => (
                <p key={i} className="mt-4 text-muted-foreground leading-relaxed">{p}</p>
              ))}
            </Reveal>

            {activity.features?.length > 0 && (
              <Reveal>
                <h3 className="mt-10 font-heading font-semibold text-lg">Ce que nous vous apportons</h3>
                <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                  {activity.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-[#7FAE3C] shrink-0 mt-0.5" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {children.length > 0 && (
              <Reveal>
                <h3 className="mt-12 font-heading font-semibold text-lg">Nos sous-catégories</h3>
                <div className="mt-4 grid sm:grid-cols-2 gap-3" data-testid="activite-children">
                  {children.map((c) => (
                    <Link key={c.id} to={`/activites/${c.key}`}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-[#0E7A3A]/40 hover:shadow-md transition-all"
                      data-testid={`activite-child-${c.key}`}
                    >
                      <div className="h-10 w-10 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0 overflow-hidden">
                        {c.icon_url ? (
                          <img src={resolveImageUrl(c.icon_url)} alt="" className="h-5 w-5 object-contain"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm group-hover:text-[#0E7A3A] transition-colors">{c.title}</div>
                        {c.tagline && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.tagline}</div>}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0E7A3A] group-hover:translate-x-0.5 transition-all mt-1" />
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            {activity.gallery?.length > 0 && (
              <Reveal>
                <h3 className="mt-12 font-heading font-semibold text-lg">Galerie</h3>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="activite-gallery">
                  {activity.gallery.map((g, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={resolveImageUrl(g)} alt="" className="w-full h-full object-cover" loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="activite-quote-btn">
                  <FileText className="h-5 w-5 mr-2" /> Demander un devis
                </Link>
              </Button>
              {relatedCatLabel && (
                <Button asChild size="lg" variant="outline" className="border-[#0E7A3A]/30 text-[#0E7A3A] hover:bg-[#0E7A3A]/5">
                  <Link to={`/produits?cat=${activity.related_category}`} data-testid="activite-products-btn">
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
                  {others.map((a) => (
                    <Link
                      key={a.id}
                      to={`/activites/${a.key}`}
                      data-testid={`activite-other-${a.key}`}
                      className="group flex items-center gap-3 rounded-lg p-3 hover:bg-[#0E7A3A]/5 transition-colors"
                    >
                      <div className="h-10 w-10 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0 overflow-hidden">
                        {a.icon_url ? (
                          <img src={resolveImageUrl(a.icon_url)} alt="" className="h-5 w-5 object-contain"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium">{a.title}</span>
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
                Besoin d'une solution en {activity.title.toLowerCase()} ?
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
