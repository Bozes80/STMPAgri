import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ARTICLE_CATEGORIES } from "@/lib/constants";

const catLabel = (v) => ARTICLE_CATEGORIES.find((c) => c.value === v)?.label || v;

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ArticleCard({ article }) {
  return (
    <Card
      data-testid={`article-card-${article.slug}`}
      className="group overflow-hidden border-border rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
    >
      <Link to={`/actualites/${article.slug}`} className="block overflow-hidden aspect-[16/10]">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-[#0E7A3A]/10 text-[#0E7A3A] hover:bg-[#0E7A3A]/15 border-0">
            {catLabel(article.category)}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(article.created_at)}
          </span>
        </div>
        <Link to={`/actualites/${article.slug}`}>
          <h3 className="font-heading font-semibold text-xl leading-snug group-hover:text-[#0E7A3A] transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{article.excerpt}</p>
        <Link
          to={`/actualites/${article.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0E7A3A] hover:gap-2 transition-all"
        >
          Lire l'article <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
