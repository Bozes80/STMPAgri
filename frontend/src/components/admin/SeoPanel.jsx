import { useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { resolveImageUrl } from "@/lib/media";

const truncate = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s);

export default function SeoPanel({ value, onChange, page, siteBaseUrl }) {
  const seo = value || {};
  const set = (k, v) => onChange?.({ ...seo, [k]: v });

  const canonicalUrl = useMemo(() => {
    if (seo.canonical) return seo.canonical;
    const base = (siteBaseUrl || process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
    const slug = page?.slug || "…";
    return `${base}/p/${slug}`;
  }, [seo.canonical, siteBaseUrl, page?.slug]);

  const previewTitle = truncate(seo.meta_title || page?.title || "Titre de votre page — STMP Agri", 60);
  const previewDesc = truncate(seo.meta_description || page?.summary || "Description qui apparaît sur Google (max 160 caractères).", 160);
  const previewUrl = canonicalUrl.replace(/^https?:\/\//, "");

  return (
    <div className="space-y-6" data-testid="seo-panel">
      <Card className="p-4 bg-muted/40 border-border">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <Search className="h-3.5 w-3.5" /> Aperçu Google
        </div>
        <div className="space-y-1 font-sans">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 truncate">{previewUrl}</div>
          <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-tight truncate">{previewTitle}</div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-snug">{previewDesc}</p>
        </div>
      </Card>

      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium">Meta title (60 car. max)</Label>
          <Input value={seo.meta_title || ""} onChange={(e) => set("meta_title", e.target.value)}
            maxLength={70} data-testid="seo-meta-title" placeholder={page?.title || "Titre optimisé pour Google"} />
          <p className="text-xs text-muted-foreground mt-1">{(seo.meta_title || "").length}/70</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Meta description (160 car. max)</Label>
          <Textarea rows={3} value={seo.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)}
            maxLength={180} data-testid="seo-meta-description" placeholder="Description accrocheuse qui incitera au clic." />
          <p className="text-xs text-muted-foreground mt-1">{(seo.meta_description || "").length}/180</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Meta keywords (séparés par virgule)</Label>
          <Input value={seo.meta_keywords || ""} onChange={(e) => set("meta_keywords", e.target.value)}
            data-testid="seo-meta-keywords" placeholder="engrais, npk, côte d'ivoire" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Canonical URL</Label>
            <Input value={seo.canonical || ""} onChange={(e) => set("canonical", e.target.value)}
              data-testid="seo-canonical" placeholder="Laissez vide pour utiliser l'URL par défaut" />
          </div>
          <div>
            <Label className="text-sm font-medium">Robots</Label>
            <Select value={seo.robots || "index,follow"} onValueChange={(v) => set("robots", v)}>
              <SelectTrigger data-testid="seo-robots"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="index,follow">index, follow (par défaut)</SelectItem>
                <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7FAE3C] mb-3">Open Graph & réseaux sociaux</p>
          <div className="grid gap-4">
            <div>
              <Label className="text-sm font-medium">Open Graph title</Label>
              <Input value={seo.og_title || ""} onChange={(e) => set("og_title", e.target.value)} data-testid="seo-og-title"
                placeholder="Titre partagé sur Facebook / LinkedIn" />
            </div>
            <div>
              <Label className="text-sm font-medium">Open Graph description</Label>
              <Textarea rows={2} value={seo.og_description || ""} onChange={(e) => set("og_description", e.target.value)}
                data-testid="seo-og-description" placeholder="Résumé qui apparaît sous l'aperçu réseau social" />
            </div>
            <div>
              <Label className="text-sm font-medium">Open Graph image (URL)</Label>
              <Input value={seo.og_image || ""} onChange={(e) => set("og_image", e.target.value)} data-testid="seo-og-image"
                placeholder="/api/files/... ou https://…" />
              {seo.og_image ? (
                <img
                  src={resolveImageUrl(seo.og_image)}
                  alt="OG preview"
                  className="mt-2 h-32 w-auto rounded-md object-cover border border-border"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : null}
            </div>
            <div>
              <Label className="text-sm font-medium">Twitter Card</Label>
              <Select value={seo.twitter_card || "summary_large_image"} onValueChange={(v) => set("twitter_card", v)}>
                <SelectTrigger data-testid="seo-twitter-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">summary</SelectItem>
                  <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
