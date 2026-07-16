import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, CheckCircle2, Target, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";

const catLabel = (v) => PRODUCT_CATEGORIES.find((c) => c.value === v)?.label || v;

export default function ProduitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
  });

  if (isLoading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
      </div>
    );

  if (isError || !product)
    return (
      <div className="container-stmp py-24 text-center">
        <p className="text-muted-foreground">Produit introuvable.</p>
        <Button asChild className="mt-6 bg-[#0E7A3A] hover:bg-[#0b632f]">
          <Link to="/produits">Retour au catalogue</Link>
        </Button>
      </div>
    );

  return (
    <div className="py-12 md:py-16">
      <div className="container-stmp">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-[#0E7A3A]">Accueil</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/produits" className="hover:text-[#0E7A3A]">Produits</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="overflow-hidden rounded-2xl border border-border">
            <img src={resolveImageUrl(product.image)} alt={product.name} className="w-full aspect-square object-cover" />
          </div>

          <div>
            <Badge className="bg-[#A8D45A]/20 text-[#0E7A3A] hover:bg-[#A8D45A]/30 border-0">
              {catLabel(product.category)}
            </Badge>
            <h1 className="mt-4 font-heading text-3xl md:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-5 text-muted-foreground leading-relaxed">{product.description}</p>

            {product.characteristics?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#0E7A3A]" /> Caractéristiques techniques
                </h3>
                <ul className="mt-3 space-y-2">
                  {product.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#7FAE3C] shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.applications?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#0E7A3A]" /> Domaines d'application
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.applications.map((a, i) => (
                    <span key={i} className="rounded-full bg-muted px-3 py-1 text-sm text-foreground/80">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                <Link to="/devis" data-testid="detail-quote-btn">
                  <FileText className="h-5 w-5 mr-2" /> Demander un devis
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5 mr-1" /> Retour
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
