import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Loader2, Layers, GripVertical, Eye, EyeOff, Trash2, ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/media";

function toTree(items) {
  const byId = Object.fromEntries(items.map((it) => [it.id, it]));
  const topLevel = items.filter((it) => !it.parent_id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out = [];
  for (const t of topLevel) {
    out.push({ item: t, depth: 0 });
    const kids = items.filter((it) => it.parent_id === t.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const k of kids) out.push({ item: k, depth: 1 });
  }
  // Rattachements orphelins éventuels
  for (const it of items) {
    if (it.parent_id && !byId[it.parent_id] && !out.find((o) => o.item.id === it.id)) {
      out.push({ item: it, depth: 0 });
    }
  }
  return out;
}

function ActivityRow({ node, onToggle, onDelete }) {
  const { item, depth } = node;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: 12 + depth * 32,
  };
  return (
    <div ref={setNodeRef} style={style}
      data-testid={`admin-activity-row-${item.id}`}
      className={`flex items-center gap-2 rounded-md border ${depth > 0 ? "border-dashed border-border/70 bg-muted/20" : "border-border bg-card"} hover:bg-muted/30 py-2 pr-2 transition-colors`}>
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        title="Déplacer"
        data-testid={`admin-activity-drag-${item.id}`}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-10 w-10 rounded-md bg-[#0E7A3A]/10 flex items-center justify-center overflow-hidden shrink-0">
        {item.icon_url ? (
          <img src={resolveImageUrl(item.icon_url)} alt="" className="h-5 w-5 object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <Layers className="h-4 w-4 text-[#0E7A3A]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {depth > 0 && <span className="text-muted-foreground text-xs">↳</span>}
          <span className="font-semibold text-sm truncate">{item.title}</span>
          {!item.is_active && <Badge variant="secondary" className="text-[10px] py-0 h-4">Masquée</Badge>}
          {depth === 0 && item.children_count > 0 && (
            <Badge className="text-[10px] py-0 h-4 bg-[#0E7A3A]/15 text-[#0E7A3A] border-0">
              {item.children_count} sous-rubrique{item.children_count > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate">/activites/{item.key}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => onToggle(item)}
          title={item.is_active ? "Masquer" : "Afficher"}
          data-testid={`admin-activity-toggle-${item.id}`}>
          {item.is_active ? <Eye className="h-4 w-4 text-[#0E7A3A]" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        <Button size="icon" variant="ghost" asChild
          title="Aperçu"
          data-testid={`admin-activity-preview-${item.id}`}>
          <Link to={`/activites/${item.key}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
        </Button>
        <Button size="icon" variant="ghost" asChild
          title="Modifier"
          data-testid={`admin-activity-edit-${item.id}`}>
          <Link to={`/admin/activites/${item.id}`}><Pencil className="h-4 w-4" /></Link>
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(item)}
          className="text-destructive hover:text-destructive"
          title="Supprimer"
          data-testid={`admin-activity-delete-${item.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminActivities() {
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => (await api.get("/admin/activities")).data || [],
  });

  const enriched = useMemo(() => {
    const counts = {};
    for (const a of data) if (a.parent_id) counts[a.parent_id] = (counts[a.parent_id] || 0) + 1;
    return data.map((a) => ({ ...a, children_count: counts[a.id] || 0 }));
  }, [data]);

  const tree = useMemo(() => toTree(enriched), [enriched]);
  const ids = tree.map((n) => n.item.id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const toggleActive = async (a) => {
    try {
      await api.patch(`/admin/activities/${a.id}`, { is_active: !a.is_active });
      qc.invalidateQueries({ queryKey: ["admin-activities"] });
      qc.invalidateQueries({ queryKey: ["public-activities"] });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/activities/${toDelete.id}`);
      toast.success("Activité supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-activities"] });
      qc.invalidateQueries({ queryKey: ["public-activities"] });
      setToDelete(null);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const onDragEnd = async (evt) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const activeItem = data.find((a) => a.id === active.id);
    const overItem = data.find((a) => a.id === over.id);
    if (!activeItem || !overItem) return;
    // Réordonne dans la même famille (parent_id) que l'élément survolé
    const newParent = overItem.parent_id || null;
    const siblings = data
      .filter((a) => (a.parent_id || null) === newParent)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const withoutActive = siblings.filter((a) => a.id !== active.id);
    const targetIdx = withoutActive.findIndex((a) => a.id === over.id);
    const finalOrder = [
      ...withoutActive.slice(0, targetIdx),
      { ...activeItem, parent_id: newParent },
      ...withoutActive.slice(targetIdx),
    ];
    const items = finalOrder.map((a, i) => ({ id: a.id, parent_id: newParent, order: i }));
    try {
      await api.post("/admin/activities/reorder", { items });
      qc.invalidateQueries({ queryKey: ["admin-activities"] });
      qc.invalidateQueries({ queryKey: ["public-activities"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div data-testid="admin-activities-page">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#0E7A3A]" /> Nos activités
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez, modifiez, réorganisez et hiérarchisez les activités affichées dans <code>/activites</code>.
          </p>
        </div>
        <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" data-testid="admin-activities-add-btn">
          <Link to="/admin/activites/nouveau"><Plus className="h-4 w-4 mr-1.5" /> Nouvelle activité</Link>
        </Button>
      </div>

      <Card className="p-4 border-border">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></div>
        ) : tree.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground" data-testid="admin-activities-empty">
            Aucune activité. Créez la première avec « Nouvelle activité ».
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Glissez une activité par sa poignée pour la réordonner au sein du même niveau. Utilisez « Modifier » pour changer sa hiérarchie (rubrique principale / sous-rubrique).
            </p>
            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5" data-testid="admin-activities-list">
                  {tree.map((node) => (
                    <ActivityRow key={node.item.id} node={node}
                      onToggle={toggleActive} onDelete={setToDelete} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent data-testid="admin-activities-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.title} » sera définitivement supprimée. Ses sous-rubriques éventuelles seront détachées (elles deviendront des rubriques principales).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-activities-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90"
              data-testid="admin-activities-delete-confirm">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
