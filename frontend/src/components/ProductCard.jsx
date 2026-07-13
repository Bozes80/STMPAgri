import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const catLabel = (v) => PRODUCT_CATEGORIES.find((c) => c.value === v)?.label || v;

export default function ProductCard({ product }) {
  return (
    <Card
      data-testid={`product-card-${product.id}`}
      className="group overflow-hidden border-border rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#0E7A3A]/40 hover:shadow-lg flex flex-col"
    >
      <Link to={`/produits/${product.id}`} className="block overflow-hidden aspect-[4/3]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <Badge variant="secondary" className="w-fit mb-2 bg-[#A8D45A]/20 text-[#0E7A3A] hover:bg-[#A8D45A]/30 border-0">
          {catLabel(product.category)}
        </Badge>
        <Link to={`/produits/${product.id}`}>
          <h3 className="font-heading font-semibold text-lg leading-snug hover:text-[#0E7A3A] transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button asChild size="sm" className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white flex-1">
            <Link to="/devis" data-testid={`product-quote-${product.id}`}>
              <FileText className="h-4 w-4 mr-1.5" /> Devis
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/produits/${product.id}`} aria-label="Voir le produit">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
