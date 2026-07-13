import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Newspaper, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function SearchDialog({ open, onOpenChange }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ products: [], articles: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults({ products: [], articles: [] });
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ products: [], articles: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get(`/search`, { params: { q } })
        .then(({ data }) => setResults(data))
        .catch(() => setResults({ products: [], articles: [] }))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults = results.products.length > 0 || results.articles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0" data-testid="search-dialog">
        <DialogTitle className="sr-only">Recherche</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="search-input"
            placeholder="Rechercher un produit, un article…"
            className="border-0 focus-visible:ring-0 h-14 text-base px-0 shadow-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q && (
            <p className="p-6 text-sm text-center text-muted-foreground">
              Saisissez au moins 2 caractères pour lancer la recherche.
            </p>
          )}
          {q.length >= 2 && !loading && !hasResults && (
            <p className="p-6 text-sm text-center text-muted-foreground" data-testid="search-no-result">
              Aucun résultat pour « {q} ».
            </p>
          )}
          {results.products.map((p) => (
            <button
              key={p.id}
              onClick={() => go(`/produits/${p.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted transition-colors"
            >
              <Package className="h-4 w-4 text-[#0E7A3A]" />
              <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground">Produit</span>
            </button>
          ))}
          {results.articles.map((a) => (
            <button
              key={a.id}
              onClick={() => go(`/actualites/${a.slug}`)}
              className="w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted transition-colors"
            >
              <Newspaper className="h-4 w-4 text-[#7FAE3C]" />
              <span className="flex-1 text-sm font-medium truncate">{a.title}</span>
              <span className="text-xs text-muted-foreground">Article</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
