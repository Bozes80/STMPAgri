import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Upload, Loader2, Pencil, Trash2, Copy, ExternalLink,
  Image as ImageIcon, LayoutGrid, X, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";

const SECTIONS = [
  { value: "all",     label: "Toutes",    hint: "Vue globale" },
  { value: "header",  label: "Header",    hint: "Logo, bannières, éléments d'en-tête" },
  { value: "content", label: "Contenu",   hint: "Produits, articles, illustrations" },
  { value: "footer",  label: "Footer",    hint: "Partenaires, icônes, pied de page" },
];

const SEC_STYLES = {
  header:  "bg-[#0E7A3A]/10 text-[#0E7A3A] border-[#0E7A3A]/30",
  content: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  footer:  "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
};

const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / 1024 / 1024).toFixed(2)} Mo`;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

export default function AdminMedia() {
  const qc = useQueryClient();
  const [section, setSection] = useState("all");
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSection, setUploadSection] = useState("content");
  const [editing, setEditing] = useState(null);      // media object
  const [previewing, setPreviewing] = useState(null); // media object
  const [toDelete, setToDelete] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const fileRef = useRef(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["media", section, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (section && section !== "all") params.set("section", section);
      if (q.trim()) params.set("q", q.trim());
      const { data } = await api.get(`/admin/media?${params.toString()}`);
      return data || [];
    },
  });

  const { data: counts = { all: 0, header: 0, content: 0, footer: 0 } } = useQuery({
    queryKey: ["media-counts"],
    queryFn: async () => {
      const { data } = await api.get("/admin/media/counts");
      return data || { all: 0, header: 0, content: 0, footer: 0 };
    },
  });

  const filtered = data;

  const currentSection = useMemo(
    () => SECTIONS.find((s) => s.value === section),
    [section]
  );

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedCount = { ok: 0, ko: 0 };
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} : trop volumineux (max 10 Mo).`);
        uploadedCount.ko++;
        continue;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const sec = uploadSection || "content";
        const params = new URLSearchParams({ section: sec, title: file.name });
        await api.post(`/admin/media?${params.toString()}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedCount.ok++;
      } catch (err) {
        toast.error(`${file.name} : ${formatApiError(err.response?.data?.detail)}`);
        uploadedCount.ko++;
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (uploadedCount.ok) toast.success(`${uploadedCount.ok} image${uploadedCount.ok > 1 ? "s" : ""} téléversée${uploadedCount.ok > 1 ? "s" : ""}.`);
    qc.invalidateQueries({ queryKey: ["media"] });
    qc.invalidateQueries({ queryKey: ["media-counts"] });
  };

  const copyUrl = async (m) => {
    try {
      await navigator.clipboard.writeText(resolveImageUrl(m.url));
      toast.success("URL copiée dans le presse-papiers.");
    } catch {
      toast.error("Impossible de copier l'URL.");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api.patch(`/admin/media/${editing.id}`, {
        section: editing.section,
        alt: editing.alt,
        title: editing.title,
        tags: (editing._tagsInput || "").split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Média mis à jour.");
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-counts"] });
      setEditing(null);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const askDelete = async (m) => {
    setToDelete(m);
    setUsageInfo(null);
    try {
      const { data } = await api.get(`/admin/media/${m.id}`);
      setUsageInfo(data.usages || null);
    } catch { /* silently ignore */ }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/media/${toDelete.id}`);
      toast.success("Média supprimé.");
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-counts"] });
      setToDelete(null);
      setUsageInfo(null);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div data-testid="admin-media-page">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Médiathèque</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Téléversez, organisez et réutilisez toutes les images du site. Trois sections : Header, Contenu, Footer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1 bg-card">
            <Label className="text-[11px] uppercase text-muted-foreground">Section</Label>
            <Select value={uploadSection} onValueChange={setUploadSection}>
              <SelectTrigger className="h-8 w-32 text-xs" data-testid="admin-media-upload-section">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="content">Contenu</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="admin-media-upload-btn"
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
            {uploading ? "Téléversement…" : "Téléverser des images"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            data-testid="admin-media-file-input"
          />
        </div>
      </div>

      {/* Tabs sections + counts */}
      <Card className="p-3 mb-4 border-border" data-testid="admin-media-tabs-card">
        <Tabs value={section} onValueChange={setSection}>
          <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto p-1">
            {SECTIONS.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="data-[state=active]:bg-[#0E7A3A] data-[state=active]:text-white gap-2 px-3 py-1.5"
                data-testid={`admin-media-tab-${s.value}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {s.label}
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 h-4">
                  {counts[s.value] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {currentSection && currentSection.value !== "all" && (
          <p className="text-xs text-muted-foreground mt-2 px-1">{currentSection.hint}</p>
        )}
      </Card>

      {/* Search bar */}
      <Card className="p-3 mb-4 border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre, alt, nom de fichier ou tag…"
            className="pl-9"
            data-testid="admin-media-search"
          />
        </div>
      </Card>

      {/* Grid gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center border-dashed" data-testid="admin-media-empty">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {q ? "Aucun média ne correspond à votre recherche."
               : section !== "all" ? "Aucune image dans cette section pour l'instant."
               : "Aucun média. Téléversez votre première image ci-dessus."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="admin-media-grid">
          {filtered.map((m) => (
            <Card key={m.id} className="group relative overflow-hidden border-border hover:shadow-lg transition-shadow"
              data-testid={`admin-media-item-${m.id}`}>
              <button
                type="button"
                onClick={() => setPreviewing(m)}
                className="block relative aspect-square w-full bg-muted overflow-hidden"
                data-testid={`admin-media-preview-btn-${m.id}`}
                title={m.title || m.filename}
              >
                <img
                  src={resolveImageUrl(m.url)}
                  alt={m.alt || m.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${SEC_STYLES[m.section] || ""}`}>
                  {m.section}
                </span>
              </button>

              {/* Actions bar */}
              <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform bg-black/80 backdrop-blur-sm p-2 flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-white truncate">{m.title || m.filename}</div>
                  <div className="text-[10px] text-white/60">{fmtSize(m.size)}</div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"
                    onClick={(e) => { e.stopPropagation(); copyUrl(m); }}
                    title="Copier l'URL"
                    data-testid={`admin-media-copy-${m.id}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"
                    onClick={(e) => { e.stopPropagation(); setEditing({ ...m, _tagsInput: (m.tags || []).join(", ") }); }}
                    title="Modifier"
                    data-testid={`admin-media-edit-${m.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-red-500/40"
                    onClick={(e) => { e.stopPropagation(); askDelete(m); }}
                    title="Supprimer"
                    data-testid={`admin-media-delete-${m.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl" data-testid="admin-media-preview-dialog">
          {previewing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8 truncate">{previewing.title || previewing.filename}</DialogTitle>
                <DialogDescription>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide mr-2 ${SEC_STYLES[previewing.section] || ""}`}>{previewing.section}</span>
                  <span className="text-xs">{fmtSize(previewing.size)} · {fmtDate(previewing.created_at)}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 max-h-[60vh] flex items-center justify-center">
                <img src={resolveImageUrl(previewing.url)} alt={previewing.alt || previewing.title}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
              <div className="text-xs space-y-1">
                <div><span className="font-semibold">Alt : </span>{previewing.alt || <em className="text-muted-foreground">non défini</em>}</div>
                <div><span className="font-semibold">Tags : </span>{(previewing.tags || []).length ? (previewing.tags || []).join(", ") : <em className="text-muted-foreground">aucun</em>}</div>
                <div><span className="font-semibold">Fichier : </span><code className="text-[10px] font-mono">{previewing.filename}</code></div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => copyUrl(previewing)} data-testid="admin-media-preview-copy">
                  <Copy className="h-4 w-4 mr-1.5" /> Copier l'URL
                </Button>
                <Button variant="outline" onClick={() => window.open(resolveImageUrl(previewing.url), "_blank")} data-testid="admin-media-preview-open">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Ouvrir
                </Button>
                <Button onClick={() => { setEditing({ ...previewing, _tagsInput: (previewing.tags || []).join(", ") }); setPreviewing(null); }}
                  className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
                  data-testid="admin-media-preview-edit"
                >
                  <Pencil className="h-4 w-4 mr-1.5" /> Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg" data-testid="admin-media-edit-dialog">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier le média</DialogTitle>
                <DialogDescription>Ajustez la section, l'alt, le titre et les tags.</DialogDescription>
              </DialogHeader>
              <div className="rounded overflow-hidden aspect-video bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center max-h-40">
                <img src={resolveImageUrl(editing.url)} alt="" className="max-w-full max-h-40 object-contain" />
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-section">Section</Label>
                  <Select value={editing.section} onValueChange={(v) => setEditing({ ...editing, section: v })}>
                    <SelectTrigger id="edit-section" data-testid="admin-media-edit-section">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header (logo, bannière)</SelectItem>
                      <SelectItem value="content">Contenu (produits, articles)</SelectItem>
                      <SelectItem value="footer">Footer (partenaires, icônes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-title">Titre</Label>
                  <Input id="edit-title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    data-testid="admin-media-edit-title" />
                </div>
                <div>
                  <Label htmlFor="edit-alt">Texte alternatif (alt) <span className="text-xs text-muted-foreground">— important pour le SEO & l'accessibilité</span></Label>
                  <Textarea id="edit-alt" rows={2} value={editing.alt || ""} onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
                    data-testid="admin-media-edit-alt"
                    placeholder="Décrivez l'image en 1 phrase" />
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags <span className="text-xs text-muted-foreground">— séparés par des virgules</span></Label>
                  <Input id="edit-tags" value={editing._tagsInput ?? ""} onChange={(e) => setEditing({ ...editing, _tagsInput: e.target.value })}
                    data-testid="admin-media-edit-tags"
                    placeholder="logo, hero, partenaire…" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)} data-testid="admin-media-edit-cancel">Annuler</Button>
                <Button onClick={saveEdit} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" data-testid="admin-media-edit-save">
                  Enregistrer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent data-testid="admin-media-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>« {toDelete?.title || toDelete?.filename} » sera définitivement supprimé.</p>
                {usageInfo && usageInfo.total > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                    data-testid="admin-media-delete-warning"
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold mb-1">⚠️ Cette image est utilisée à {usageInfo.total} endroit{usageInfo.total > 1 ? "s" : ""} :</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {usageInfo.products > 0 && <li>{usageInfo.products} produit{usageInfo.products > 1 ? "s" : ""}</li>}
                        {usageInfo.articles > 0 && <li>{usageInfo.articles} article{usageInfo.articles > 1 ? "s" : ""}</li>}
                        {usageInfo.realisations > 0 && <li>{usageInfo.realisations} réalisation{usageInfo.realisations > 1 ? "s" : ""}</li>}
                        {usageInfo.partners > 0 && <li>{usageInfo.partners} partenaire{usageInfo.partners > 1 ? "s" : ""}</li>}
                        {usageInfo.pages > 0 && <li>{usageInfo.pages} page{usageInfo.pages > 1 ? "s" : ""}</li>}
                      </ul>
                      <div className="mt-2 font-medium">Ces endroits afficheront une image cassée après suppression.</div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-media-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90"
              data-testid="admin-media-delete-confirm">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
