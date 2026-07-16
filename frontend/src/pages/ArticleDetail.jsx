import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, User, CalendarDays, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/ArticleCard";
import api from "@/lib/api";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";

const catLabel = (v) => ARTICLE_CATEGORIES.find((c) => c.value === v)?.label || v;

export default function ArticleDetail() {
  const { slug } = useParams();
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => (await api.get(`/articles/${slug}`)).data,
  });

  if (isLoading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
      </div>
    );

  if (isError || !article)
    return (
      <div className="container-stmp py-24 text-center">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Button asChild className="mt-6 bg-[#0E7A3A] hover:bg-[#0b632f]">
          <Link to="/actualites">Retour aux actualités</Link>
        </Button>
      </div>
    );

  return (
    <article className="pb-20">
      <div className="relative h-[42vh] min-h-[320px] overflow-hidden">
        <img src={resolveImageUrl(article.image)} alt={article.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08160c]/95 via-[#08160c]/50 to-transparent" />
        <div className="container-stmp absolute inset-x-0 bottom-0 z-10 pb-10">
          <nav className="flex items-center gap-1.5 text-sm text-white/70 mb-4">
            <Link to="/" className="hover:text-white">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/actualites" className="hover:text-white">Actualités</Link>
          </nav>
          <Badge className="bg-[#F2D400] text-[#1F2937] hover:bg-[#F2D400] border-0 mb-4">
            {catLabel(article.category)}
          </Badge>
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-white max-w-4xl">
            {article.title}
          </h1>
        </div>
      </div>

      <div className="container-stmp">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-5 py-6 border-b border-border text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-[#7FAE3C]" /> {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-[#7FAE3C]" /> {formatDate(article.created_at)}
            </span>
          </div>

          <div className="prose prose-lg max-w-none mt-8">
            <p className="text-xl leading-relaxed text-foreground/90 font-medium">{article.excerpt}</p>
            {article.content.split("\n").filter(Boolean).map((p, i) => (
              <p key={i} className="mt-5 text-foreground/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <div className="mt-10">
            <Button asChild variant="outline">
              <Link to="/actualites">
                <ChevronLeft className="h-4 w-4 mr-1" /> Retour aux actualités
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
