import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Pencil, Trash2, Loader2, GripVertical, ExternalLink,
  Share2, Eye, EyeOff, LibraryBig, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";

const EMPTY_FORM = { name: "", url: "", icon_url: "", is_active: true };

function SocialRow({ social, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: social.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} data-testid={`admin-social-row-${social.id}`}
      className="flex items-center gap-3 rounded-md border border-border bg-card hover:bg-muted/30 p-3 transition-colors">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1" title="Déplacer"
        data-testid={`admin-social-drag-${social.id}`}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-10 w-10 shrink-0 rounded-full bg-[#111C15] flex items-center justify-center overflow-hidden">
        {social.icon_url ? (
          <img src={resolveImageUrl(social.icon_url)} alt={social.name}
            className="h-5 w-5 object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <span className="text-[10px] text-white/70 font-bold uppercase">{social.name.slice(0, 2)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{social.name}</span>
          {!social.is_active && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4">Inactif</Badge>
          )}
        </div>
        <a href={social.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground font-mono hover:text-[#0E7A3A] flex items-center gap-1 truncate">
          <ExternalLink className="h-3 w-3 shrink-0" /> {social.url}
        </a>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => onToggle(social)}
          title={social.is_active ? "Désactiver" : "Activer"}
          data-testid={`admin-social-toggle-${social.id}`}>
          {social.is_active ? <Eye className="h-4 w-4 text-[#0E7A3A]" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onEdit(social)} data-testid={`admin-social-edit-${social.id}`}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(social)} data-testid={`admin-social-delete-${social.id}`}
          className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminSocials() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-socials"],
    queryFn: async () => (await api.get("/admin/socials")).data || [],
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = data.map((s) => s.id);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, url: s.url, icon_url: s.icon_url || "", is_active: !!s.is_active });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Le nom est requis.");
    if (!form.url.trim()) return toast.error("L'URL est requise.");
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/socials/${editing.id}`, form);
        toast.success("Réseau mis à jour.");
      } else {
        await api.post("/admin/socials", form);
        toast.success("Réseau ajouté.");
      }
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      qc.invalidateQueries({ queryKey: ["public-socials"] });
      setDialogOpen(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.patch(`/admin/socials/${s.id}`, { is_active: !s.is_active });
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      qc.invalidateQueries({ queryKey: ["public-socials"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/socials/${toDelete.id}`);
      toast.success("Réseau supprimé.");
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      qc.invalidateQueries({ queryKey: ["public-socials"] });
      setToDelete(null);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const onDragEnd = async (evt) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const oldIdx = data.findIndex((s) => s.id === active.id);
    const newIdx = data.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(data, oldIdx, newIdx);
    // Optimistic update
    qc.setQueryData(["admin-socials"], reordered.map((s, i) => ({ ...s, order: i })));
    try {
      await api.post("/admin/socials/reorder", { ids: reordered.map((s) => s.id) });
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
      qc.invalidateQueries({ queryKey: ["public-socials"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
      qc.invalidateQueries({ queryKey: ["admin-socials"] });
    }
  };

  return (
    <div data-testid="admin-socials-page">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-[#0E7A3A]" /> Réseaux sociaux
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez, modifiez et réorganisez les réseaux affichés dans le footer du site.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" data-testid="admin-socials-add-btn">
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter un réseau
        </Button>
      </div>

      <Card className="p-4 border-border">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground" data-testid="admin-socials-empty">
            Aucun réseau. Cliquez sur « Ajouter un réseau » pour commencer.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Glissez-déposez pour réorganiser l'ordre d'affichage dans le footer.
            </p>
            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="space-y-2" data-testid="admin-socials-list">
                  {data.map((s) => (
                    <SocialRow key={s.id} social={s}
                      onEdit={openEdit}
                      onDelete={setToDelete}
                      onToggle={toggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="admin-socials-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le réseau" : "Ajouter un réseau"}</DialogTitle>
            <DialogDescription>Nom, URL et icône (image) du réseau social.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="social-name">Nom du réseau *</Label>
              <Input id="social-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Facebook, Instagram, LinkedIn, WhatsApp…"
                data-testid="admin-socials-name" />
            </div>
            <div>
              <Label htmlFor="social-url">URL *</Label>
              <Input id="social-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://facebook.com/votre-page"
                data-testid="admin-socials-url" />
              <p className="text-[11px] text-muted-foreground mt-1">
                Doit commencer par <code>https://</code> (ou <code>mailto:</code> / <code>tel:</code>).
              </p>
            </div>
            <div>
              <Label>Icône</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 rounded-full bg-[#111C15] flex items-center justify-center overflow-hidden border border-border">
                  {form.icon_url ? (
                    <img src={resolveImageUrl(form.icon_url)} alt="" className="h-7 w-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <span className="text-xs text-white/50">?</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                    placeholder="URL de l'icône ou choisir depuis la médiathèque"
                    className="text-xs" data-testid="admin-socials-icon-url" />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}
                      data-testid="admin-socials-icon-library-btn">
                      <LibraryBig className="h-3.5 w-3.5 mr-1" /> Médiathèque
                    </Button>
                    {form.icon_url && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, icon_url: "" })}
                        className="text-destructive hover:text-destructive" data-testid="admin-socials-icon-clear">
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Recommandé : PNG/SVG monochrome blanc, 64×64px min. Astuce : classez-les dans la section <strong>Footer</strong> de la médiathèque.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="social-active" className="cursor-pointer">Actif</Label>
                <p className="text-xs text-muted-foreground">Si désactivé, ce réseau n'est pas affiché dans le footer public.</p>
              </div>
              <Switch id="social-active" checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                data-testid="admin-socials-active-toggle" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="admin-socials-cancel">Annuler</Button>
            <Button onClick={save} disabled={saving} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
              data-testid="admin-socials-save">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setForm((f) => ({ ...f, icon_url: url }))}
        defaultSection="footer"
        testid="admin-socials-picker"
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent data-testid="admin-socials-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce réseau ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » sera définitivement retiré du footer. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-socials-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90"
              data-testid="admin-socials-delete-confirm">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
