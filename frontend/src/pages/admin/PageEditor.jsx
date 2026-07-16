import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Save, Send, ArrowLeft, ExternalLink, Loader2, FileText, Image as ImageIcon,
  Search, Settings, ArchiveIcon, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";
import WysiwygEditor from "@/components/admin/WysiwygEditor";
import SeoPanel from "@/components/admin/SeoPanel";
import GalleryField from "@/components/admin/GalleryField";
import CoverImageField from "@/components/admin/CoverImageField";

// Slugifier léger côté client (miroir de backend slugify)
function slugify(s) {
  return (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY_SEO = {
  meta_title: "", meta_description: "", meta_keywords: "", canonical: "",
  robots: "index,follow", og_title: "", og_description: "", og_image: "",
  twitter_card: "summary_large_image",
};

const EMPTY_PAGE = {
  title: "", slug: "", summary: "", content_html: "", cover_image: "",
  gallery: [], icon: "", category: "", tags: [],
  status: "draft", parent_id: null, order: 0, show_in_main_nav: false,
  seo: EMPTY_SEO, published_at: null,
};

const STATUS_META = {
  draft:     { label: "Brouillon", className: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200" },
  published: { label: "Publié",    className: "bg-[#0E7A3A] text-white" },
  archived:  { label: "Archivé",   className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
};

// Convert local datetime input → ISO
const toIso = (dt) => (dt ? new Date(dt).toISOString() : null);
const toLocalDT = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PageEditor() {
  const { id } = useParams(); // undefined ⇒ création
  const isNew = !id;
  const qc = useQueryClient();
  const nav = useNavigate();
  const [form, setForm] = useState(EMPTY_PAGE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  // Charge la page existante
  const { data: loaded, isLoading } = useQuery({
    queryKey: ["admin-page", id],
    queryFn: async () => (await api.get(`/admin/pages/${id}`)).data,
    enabled: !!id,
  });

  // Liste des autres pages pour le sélecteur "parent"
  const { data: allPages = [] } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => (await api.get("/admin/pages")).data,
  });

  useEffect(() => {
    if (loaded) {
      setForm({ ...EMPTY_PAGE, ...loaded, seo: { ...EMPTY_SEO, ...(loaded.seo || {}) } });
      setSlugTouched(true);
    }
  }, [loaded]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSeo = (v) => setForm((f) => ({ ...f, seo: v }));

  const onTitleChange = (t) => {
    setForm((f) => ({
      ...f,
      title: t,
      slug: slugTouched ? f.slug : slugify(t),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const clean = { ...payload, slug: slugify(payload.slug || payload.title) };
      if (isNew) return (await api.post("/admin/pages", clean)).data;
      return (await api.put(`/admin/pages/${id}`, clean)).data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      qc.invalidateQueries({ queryKey: ["admin-page", data.id] });
      toast.success(isNew ? "Page créée." : "Modifications enregistrées.");
      if (isNew) nav(`/admin/pages/${data.id}`, { replace: true });
    },
    onError: (err) => toast.error(formatApiError(err.response?.data?.detail)),
  });

  const saveAs = async (status) => {
    const payload = { ...form, status };
    saveMutation.mutate(payload);
  };

  const doDelete = async () => {
    try {
      await api.delete(`/admin/pages/${id}`);
      toast.success("Page supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      nav("/admin/pages", { replace: true });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const parentOptions = useMemo(
    () => allPages.filter((p) => p.id !== id),
    [allPages, id]
  );

  if (id && isLoading) {
    return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0E7A3A]" /></div>;
  }

  const previewHref = form.slug ? `/p/${form.slug}` : null;
  const statusInfo = STATUS_META[form.status] || STATUS_META.draft;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/pages"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold">{isNew ? "Nouvelle page" : form.title || "Sans titre"}</h1>
            <Badge className={`${statusInfo.className} border-0 font-semibold`}>{statusInfo.label}</Badge>
          </div>
          {!isNew && (
            <p className="text-xs text-muted-foreground mt-1">
              {form.author_email && <>Par {form.author_email} · </>}
              Dernière modification : {form.updated_at ? new Date(form.updated_at).toLocaleString("fr-FR") : "—"}
            </p>
          )}
        </div>
        {previewHref && form.status === "published" && (
          <Button asChild variant="outline" size="sm"><Link to={previewHref} target="_blank"><ExternalLink className="h-4 w-4 mr-1" /> Voir sur le site</Link></Button>
        )}
        <Button variant="outline" onClick={() => saveAs("draft")} disabled={saveMutation.isPending} data-testid="page-save-draft-btn">
          <Save className="h-4 w-4 mr-1.5" /> Enregistrer brouillon
        </Button>
        <Button onClick={() => saveAs("published")} disabled={saveMutation.isPending} data-testid="page-publish-btn"
          className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
          Publier
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Colonne principale : onglets */}
        <Tabs defaultValue="content" className="min-w-0">
          <TabsList className="grid grid-cols-4 w-full max-w-md" data-testid="page-tabs">
            <TabsTrigger value="content" data-testid="tab-content"><FileText className="h-4 w-4 mr-1.5" /> Contenu</TabsTrigger>
            <TabsTrigger value="media" data-testid="tab-media"><ImageIcon className="h-4 w-4 mr-1.5" /> Média</TabsTrigger>
            <TabsTrigger value="seo" data-testid="tab-seo"><Search className="h-4 w-4 mr-1.5" /> SEO</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings"><Settings className="h-4 w-4 mr-1.5" /> Réglages</TabsTrigger>
          </TabsList>

          {/* CONTENU */}
          <TabsContent value="content" className="mt-6 space-y-5">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Titre de la page</Label>
              <Input id="title" value={form.title} onChange={(e) => onTitleChange(e.target.value)}
                data-testid="page-title" placeholder="Ex : À propos de STMP Agri" className="text-lg font-medium" />
            </div>
            <div>
              <Label htmlFor="slug" className="text-sm font-medium">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">/p/</span>
                <Input id="slug" value={form.slug}
                  onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
                  data-testid="page-slug" placeholder="genere-automatiquement" className="font-mono text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="summary" className="text-sm font-medium">Résumé (court, affiché en tête)</Label>
              <Textarea id="summary" rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)}
                data-testid="page-summary" placeholder="1 ou 2 phrases d'introduction" />
            </div>
            <div>
              <Label className="text-sm font-medium">Contenu</Label>
              <WysiwygEditor value={form.content_html} onChange={(v) => set("content_html", v)} testid="page-content" />
            </div>
          </TabsContent>

          {/* MEDIA */}
          <TabsContent value="media" className="mt-6 space-y-6">
            <div>
              <Label className="text-sm font-medium">Image de couverture</Label>
              <p className="text-xs text-muted-foreground mb-2">Utilisée en hero de la page publique.</p>
              <CoverImageField value={form.cover_image} onChange={(v) => set("cover_image", v)} testid="page-cover" />
            </div>
            <div>
              <Label className="text-sm font-medium">Galerie d'images</Label>
              <p className="text-xs text-muted-foreground mb-2">Ajoutez plusieurs images qui pourront être affichées en bas de page.</p>
              <GalleryField value={form.gallery} onChange={(v) => set("gallery", v)} testid="page-gallery" />
            </div>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="mt-6">
            <SeoPanel value={form.seo} onChange={setSeo} page={form} />
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card className="p-4 space-y-4 border-border">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Page parente</Label>
                  <Select value={form.parent_id || "none"} onValueChange={(v) => set("parent_id", v === "none" ? null : v)}>
                    <SelectTrigger data-testid="page-parent"><SelectValue placeholder="Aucune (page de premier niveau)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (page de premier niveau)</SelectItem>
                      {parentOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ordre d'affichage</Label>
                  <Input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value || "0", 10))}
                    data-testid="page-order" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <Input value={form.category} onChange={(e) => set("category", e.target.value)}
                    data-testid="page-category" placeholder="Ex : institutionnel" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Tags (séparés par virgule)</Label>
                  <Input value={(form.tags || []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                    data-testid="page-tags" placeholder="engrais, npk, conseils" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Afficher dans le menu principal</p>
                  <p className="text-xs text-muted-foreground">Si activé, la page apparaît dans le menu supérieur du site.</p>
                </div>
                <Switch checked={!!form.show_in_main_nav} onCheckedChange={(v) => set("show_in_main_nav", v)} data-testid="page-show-in-nav" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sidebar publication */}
        <aside className="space-y-4">
          <Card className="p-4 border-border">
            <h3 className="font-heading font-semibold text-sm mb-3">Publication</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Statut</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger data-testid="page-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date &amp; heure de publication</Label>
                <Input type="datetime-local"
                  value={toLocalDT(form.published_at)}
                  onChange={(e) => set("published_at", toIso(e.target.value))}
                  data-testid="page-published-at" />
                <p className="text-[11px] text-muted-foreground mt-1">Laissez vide pour utiliser la date actuelle lors de la publication.</p>
              </div>
            </div>
          </Card>

          {!isNew && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <h3 className="font-heading font-semibold text-sm mb-2 text-destructive">Zone dangereuse</h3>
              <p className="text-xs text-muted-foreground mb-3">Supprimer la page définitivement.</p>
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setAskDelete(true)} data-testid="page-delete-btn">
                <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer la page
              </Button>
            </Card>
          )}
        </aside>
      </div>

      <AlertDialog open={askDelete} onOpenChange={setAskDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette page ?</AlertDialogTitle>
            <AlertDialogDescription>
              «{form.title || "Sans titre"}» sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
