import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Loader2, Save, Trash2, Plus, GripVertical, X,
  ImageIcon, LayoutList, Sparkles, Layers, Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";
import CoverImageField from "@/components/admin/CoverImageField";
import GalleryField from "@/components/admin/GalleryField";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import { useCategories } from "@/hooks/useCategories";

const EMPTY = {
  title: "", tagline: "", icon_url: "", image: "", gallery: [],
  teaser: "", intro: "", features: [], related_category: "",
  parent_id: "", is_active: true, order: 0,
};

/** Ligne d'une feature (bullet point) — triable via drag & drop. */
function FeatureRow({ id, value, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}
      data-testid={`activity-feature-row-${id}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1" title="Déplacer">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Une caractéristique / point-clé"
        className="flex-1"
        data-testid={`activity-feature-input-${id}`} />
      <Button size="icon" variant="ghost" onClick={onRemove}
        className="text-destructive hover:text-destructive"
        data-testid={`activity-feature-remove-${id}`}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ActivityEditor() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isNew = !id || id === "nouveau";
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState(EMPTY);
  const [features, setFeatures] = useState([]); // [{id, value}]
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  const { data: allActivities = [], isLoading: loadingAll } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => (await api.get("/admin/activities")).data || [],
  });

  const { data: currentDoc, isLoading: loadingDoc } = useQuery({
    queryKey: ["admin-activity", id],
    queryFn: async () => (await api.get(`/admin/activities/${id}`)).data,
    enabled: !isNew,
  });

  const { categories } = useCategories();

  useEffect(() => {
    if (currentDoc) {
      setForm({
        ...EMPTY,
        ...currentDoc,
        parent_id: currentDoc.parent_id || "",
        related_category: currentDoc.related_category || "",
      });
      setFeatures(
        (currentDoc.features || []).map((v) => ({ id: crypto.randomUUID(), value: v }))
      );
    } else if (isNew) {
      setForm(EMPTY);
      setFeatures([]);
    }
  }, [currentDoc, isNew]);

  // Parents disponibles : toutes les activités top-level actives, sauf soi-même
  const parentOptions = useMemo(
    () => allActivities.filter((a) => !a.parent_id && a.id !== id),
    [allActivities, id]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const featIds = features.map((f) => f.id);

  const addFeature = () => setFeatures((f) => [...f, { id: crypto.randomUUID(), value: "" }]);
  const removeFeature = (fid) => setFeatures((f) => f.filter((x) => x.id !== fid));
  const updateFeature = (fid, val) => setFeatures((f) => f.map((x) => (x.id === fid ? { ...x, value: val } : x)));
  const onFeatDragEnd = (evt) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const oldIdx = features.findIndex((x) => x.id === active.id);
    const newIdx = features.findIndex((x) => x.id === over.id);
    setFeatures(arrayMove(features, oldIdx, newIdx));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    tagline: form.tagline,
    icon_url: form.icon_url,
    image: form.image,
    gallery: form.gallery || [],
    teaser: form.teaser,
    intro: form.intro,
    features: features.map((f) => f.value).filter((v) => v.trim()),
    related_category: form.related_category || null,
    parent_id: form.parent_id || null,
    is_active: !!form.is_active,
    order: form.order || 0,
  });

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      setTab("general");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const { data } = await api.post("/admin/activities", buildPayload());
        toast.success("Activité créée.");
        qc.invalidateQueries({ queryKey: ["admin-activities"] });
        qc.invalidateQueries({ queryKey: ["public-activities"] });
        nav(`/admin/activites/${data.id}`, { replace: true });
      } else {
        await api.patch(`/admin/activities/${id}`, buildPayload());
        toast.success("Activité mise à jour.");
        qc.invalidateQueries({ queryKey: ["admin-activities"] });
        qc.invalidateQueries({ queryKey: ["public-activities"] });
        qc.invalidateQueries({ queryKey: ["admin-activity", id] });
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/admin/activities/${id}`);
      toast.success("Activité supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-activities"] });
      qc.invalidateQueries({ queryKey: ["public-activities"] });
      nav("/admin/activites");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  if (!isNew && loadingDoc) {
    return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></div>;
  }

  return (
    <div data-testid="admin-activity-editor">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="mb-2" data-testid="admin-activity-back">
            <Link to="/admin/activites"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour à la liste</Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold truncate">
            {isNew ? "Nouvelle activité" : (form.title || "Activité")}
          </h1>
          {!isNew && form.key && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              URL publique : <code className="bg-muted px-1 rounded">/activites/{form.key}</code>
              <span className="ml-2 italic">— slug figé après création</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <Button variant="outline" onClick={() => setAskDelete(true)}
              className="text-destructive hover:text-destructive"
              data-testid="admin-activity-delete-btn">
              <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
            </Button>
          )}
          <Button onClick={save} disabled={saving}
            className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-activity-save-btn">
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {isNew ? "Créer l'activité" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4" data-testid="admin-activity-tabs">
          <TabsTrigger value="general" data-testid="admin-activity-tab-general">
            <Settings className="h-4 w-4 mr-1.5" /> Général
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="admin-activity-tab-content">
            <Sparkles className="h-4 w-4 mr-1.5" /> Contenu
          </TabsTrigger>
          <TabsTrigger value="media" data-testid="admin-activity-tab-media">
            <ImageIcon className="h-4 w-4 mr-1.5" /> Médias
          </TabsTrigger>
        </TabsList>

        {/* GÉNÉRAL */}
        <TabsContent value="general">
          <Card className="p-5 space-y-4 border-border">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="act-title">Titre *</Label>
                <Input id="act-title" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex : Achat et vente d'engrais"
                  data-testid="admin-activity-title" />
              </div>
              <div>
                <Label htmlFor="act-tagline">Sous-titre / Tagline</Label>
                <Input id="act-tagline" value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Une phrase punchy"
                  data-testid="admin-activity-tagline" />
              </div>
              <div>
                <Label htmlFor="act-parent">Hiérarchie</Label>
                <Select value={form.parent_id || "none"}
                  onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
                  <SelectTrigger id="act-parent" data-testid="admin-activity-parent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Rubrique principale —</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>Sous-rubrique de : {p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Une rubrique principale peut avoir plusieurs sous-rubriques. Une sous-rubrique ne peut pas en contenir d'autres.
                </p>
              </div>
              <div>
                <Label htmlFor="act-category">Catégorie de produits liée (optionnel)</Label>
                <Select value={form.related_category || "none"}
                  onValueChange={(v) => setForm({ ...form, related_category: v === "none" ? "" : v })}>
                  <SelectTrigger id="act-category" data-testid="admin-activity-related-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucune —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si défini, la fiche activité affichera un CTA « Voir les produits {form.related_category ? `« ${form.related_category} »` : "…"} ».
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="act-active" className="cursor-pointer">Activité active</Label>
                <p className="text-xs text-muted-foreground">Si désactivée, l'activité est masquée du site public.</p>
              </div>
              <Switch id="act-active" checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                data-testid="admin-activity-active" />
            </div>
          </Card>
        </TabsContent>

        {/* CONTENU */}
        <TabsContent value="content">
          <Card className="p-5 space-y-4 border-border">
            <div>
              <Label htmlFor="act-teaser">Résumé (teaser) <span className="text-xs text-muted-foreground">— affiché dans la liste /activites</span></Label>
              <Textarea id="act-teaser" rows={3} value={form.teaser}
                onChange={(e) => setForm({ ...form, teaser: e.target.value })}
                placeholder="2-3 phrases décrivant l'activité"
                data-testid="admin-activity-teaser" />
            </div>
            <div>
              <Label htmlFor="act-intro">Introduction détaillée <span className="text-xs text-muted-foreground">— affichée en haut de la page /activites/:key</span></Label>
              <Textarea id="act-intro" rows={6} value={form.intro}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
                placeholder="Description complète. Utilisez des sauts de ligne pour séparer les paragraphes."
                data-testid="admin-activity-intro" />
            </div>
            <div>
              <Label>Ce que nous vous apportons <span className="text-xs text-muted-foreground">— liste triable, 5 points recommandés</span></Label>
              <div className="mt-2 space-y-2">
                {features.length === 0 && (
                  <p className="text-xs text-muted-foreground italic" data-testid="admin-activity-features-empty">Aucun point pour le moment. Ajoutez-en un ci-dessous.</p>
                )}
                <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} collisionDetection={closestCenter} onDragEnd={onFeatDragEnd}>
                  <SortableContext items={featIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5" data-testid="admin-activity-features-list">
                      {features.map((f) => (
                        <FeatureRow key={f.id} id={f.id} value={f.value}
                          onChange={(v) => updateFeature(f.id, v)}
                          onRemove={() => removeFeature(f.id)} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button variant="outline" size="sm" onClick={addFeature} data-testid="admin-activity-features-add">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un point
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* MÉDIAS */}
        <TabsContent value="media">
          <Card className="p-5 space-y-6 border-border">
            <div>
              <Label>Icône de l'activité <span className="text-xs text-muted-foreground">— utilisée dans les cartes et dropdowns</span></Label>
              <div className="mt-2 flex items-start gap-3">
                <div className="h-16 w-16 rounded-lg bg-[#0E7A3A]/10 flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {form.icon_url ? (
                    <img src={resolveImageUrl(form.icon_url)} alt="" className="h-8 w-8 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Input value={form.icon_url}
                    onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                    placeholder="URL de l'icône ou choisir depuis la médiathèque"
                    className="text-xs"
                    data-testid="admin-activity-icon-url" />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setIconPickerOpen(true)}
                      data-testid="admin-activity-icon-library-btn">
                      <LayoutList className="h-3.5 w-3.5 mr-1" /> Médiathèque
                    </Button>
                    {form.icon_url && (
                      <Button type="button" size="sm" variant="ghost"
                        onClick={() => setForm({ ...form, icon_url: "" })}
                        className="text-destructive hover:text-destructive"
                        data-testid="admin-activity-icon-clear">
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Recommandé : PNG/SVG monochrome, 64×64 min. Classez-les dans la section <strong>Contenu</strong> de la médiathèque.
              </p>
            </div>

            <div>
              <Label>Image principale (hero) <span className="text-xs text-muted-foreground">— affichée en bannière</span></Label>
              <div className="mt-2">
                <CoverImageField
                  value={form.image}
                  onChange={(v) => setForm({ ...form, image: v })}
                  testid="admin-activity-image"
                  aspect="video"
                />
              </div>
            </div>

            <div>
              <Label>Galerie <span className="text-xs text-muted-foreground">— images additionnelles</span></Label>
              <div className="mt-2">
                <GalleryField
                  value={form.gallery || []}
                  onChange={(v) => setForm({ ...form, gallery: v })}
                  testid="admin-activity-gallery"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Icon picker (section content) */}
      <MediaPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        onSelect={(url) => setForm((f) => ({ ...f, icon_url: url }))}
        defaultSection="content"
        testid="admin-activity-icon-picker"
      />

      {/* Delete confirmation */}
      <AlertDialog open={askDelete} onOpenChange={setAskDelete}>
        <AlertDialogContent data-testid="admin-activity-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {form.title} » sera définitivement supprimée. Ses sous-rubriques éventuelles seront détachées (elles deviendront des rubriques principales).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-activity-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90"
              data-testid="admin-activity-delete-confirm">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
