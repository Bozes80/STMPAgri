import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";
import { IMAGES } from "@/lib/constants";

export default function PublicPage() {
  const { slug } = useParams();
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["public-page", slug],
    queryFn: async () => (await api.get(`/pages/${slug}`)).data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="container-stmp py-24 text-center">
        <p className="text-muted-foreground text-lg">Cette page n'est pas disponible.</p>
        <Button asChild className="mt-6 bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
          <Link to="/"><ChevronLeft className="h-4 w-4 mr-1" /> Retour à l'accueil</Link>
        </Button>
      </div>
    );
  }

  const seo = page.seo || {};
  const canonical = seo.canonical
    || `${(process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "")}/p/${page.slug}`;
  const ogImage = seo.og_image || page.cover_image || "";
  const heroImg = page.cover_image || IMAGES.fertilizer;
  const isTiptapEmpty = !page.content_html || page.content_html === "<p></p>";

  return (
    <>
      <Helmet>
        <title>{seo.meta_title || `${page.title} — STMP Agri`}</title>
        {seo.meta_description && <meta name="description" content={seo.meta_description} />}
        {seo.meta_keywords && <meta name="keywords" content={seo.meta_keywords} />}
        <meta name="robots" content={seo.robots || "index,follow"} />
        <link rel="canonical" href={canonical} />
        {/* Open Graph */}
        <meta property="og:title" content={seo.og_title || seo.meta_title || page.title} />
        <meta property="og:description" content={seo.og_description || seo.meta_description || page.summary || ""} />
        {ogImage && <meta property="og:image" content={resolveImageUrl(ogImage)} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        {/* Twitter */}
        <meta name="twitter:card" content={seo.twitter_card || "summary_large_image"} />
        <meta name="twitter:title" content={seo.og_title || seo.meta_title || page.title} />
        <meta name="twitter:description" content={seo.og_description || seo.meta_description || page.summary || ""} />
        {ogImage && <meta name="twitter:image" content={resolveImageUrl(ogImage)} />}
      </Helmet>

      <PageHero crumb={page.title} title={page.title} subtitle={page.summary} image={heroImg} />

      <section className="py-16">
        <div className="container-stmp max-w-3xl">
          {page.category && (
            <Badge className="mb-4 bg-[#A8D45A]/20 text-[#0E7A3A] hover:bg-[#A8D45A]/30 border-0">{page.category}</Badge>
          )}
          {isTiptapEmpty ? (
            <p className="text-muted-foreground italic">Le contenu de cette page n'est pas encore rédigé.</p>
          ) : (
            <article
              className="tiptap-render prose prose-slate dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-[#0E7A3A] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
              // Contenu généré par le WYSIWYG admin — HTML de confiance
              dangerouslySetInnerHTML={{ __html: page.content_html }}
              data-testid="public-page-content"
            />
          )}

          {page.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {page.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>
              ))}
            </div>
          )}
        </div>

        {page.gallery?.length > 0 && (
          <div className="container-stmp max-w-5xl mt-12">
            <h2 className="font-heading text-xl font-semibold mb-4">Galerie</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {page.gallery.map((g, i) => (
                <a key={i} href={resolveImageUrl(g)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-border">
                  <img src={resolveImageUrl(g)} alt="" loading="lazy" className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-500" />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
