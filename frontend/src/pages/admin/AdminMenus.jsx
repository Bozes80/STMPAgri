import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { formatApiError } from "@/lib/api";
import SortableMenuItem from "@/components/admin/SortableMenuItem";
import MenuItemDialog from "@/components/admin/MenuItemDialog";

const LOCATIONS = [
  { key: "main",   label: "Menu principal", description: "Menu supérieur du site." },
  { key: "footer", label: "Menu pied de page", description: "Menu affiché dans le footer." },
];

function newId() {
  return "it_" + Math.random().toString(36).slice(2, 10);
}

/**
 * Aplatit les items en tree : renvoie [{item, depth}] dans l'ordre d'affichage.
 * On garde l'ordre plat pour dnd-kit (sortable liste), mais on affiche l'indent.
 */
function flatten(items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const roots = items.filter((i) => !i.parent_id || !byId[i.parent_id])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out = [];
  const walk = (node, depth) => {
    out.push({ item: node, depth });
    const children = items.filter((i) => i.parent_id === node.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const c of children) walk(c, depth + 1);
  };
  for (const r of roots) walk(r, 0);
  return out;
}

function MenuTab({ location }) {
  const qc = useQueryClient();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-menu", location],
    queryFn: async () => (await api.get(`/admin/menus/${location}`)).data,
  });

  useEffect(() => {
    if (data) {
      setItems(data.items || []);
      setName(data.name || "");
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => (await api.put(`/admin/menus/${location}`, { name, items })).data,
    onSuccess: () => {
      toast.success("Menu enregistré.");
      qc.invalidateQueries({ queryKey: ["admin-menu", location] });
      qc.invalidateQueries({ queryKey: ["public-menu", location] });
      setDirty(false);
    },
    onError: (e) => toast.error(formatApiError(e.response?.data?.detail)),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const flat = useMemo(() => flatten(items), [items]);
  const ids = flat.map((r) => r.item.id);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reorderedFlat = arrayMove(flat, oldIdx, newIdx);
    // Recalcule order par item (au sein du même parent) selon nouvel ordre plat
    const byParent = {};
    for (const row of reorderedFlat) {
      const pid = row.item.parent_id || "root";
      byParent[pid] = (byParent[pid] || 0);
      row.item.order = byParent[pid]++;
    }
    setItems(reorderedFlat.map((r) => r.item));
    setDirty(true);
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (it) => { setEditing(it); setDialogOpen(true); };
  const remove = (it) => {
    setItems((prev) => prev.filter((x) => x.id !== it.id).map((x) =>
      x.parent_id === it.id ? { ...x, parent_id: null } : x));
    setDirty(true);
  };
  const saveItem = (data) => {
    if (editing?.id) {
      setItems((prev) => prev.map((x) => x.id === editing.id ? { ...x, ...data } : x));
    } else {
      const maxOrder = items.filter((x) => (x.parent_id || null) === (data.parent_id || null))
        .reduce((m, x) => Math.max(m, x.order ?? 0), -1);
      setItems((prev) => [...prev, { ...data, id: newId(), order: maxOrder + 1 }]);
    }
    setDirty(true);
  };

  if (isLoading) return <div className="py-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0E7A3A]" /></div>;

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div>
            <Label className="text-sm">Nom du menu</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }}
              data-testid={`menu-${location}-name`} placeholder="Ex : Menu principal" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openNew} data-testid={`menu-${location}-add-item-btn`}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un élément
            </Button>
            <Button className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
              disabled={!dirty || save.isPending}
              onClick={() => save.mutate()} data-testid={`menu-${location}-save-btn`}>
              {save.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-border">
        <p className="text-xs text-muted-foreground mb-3">
          Faites glisser un élément par sa poignée pour le réordonner. Utilisez le champ « Parent » lors de l'édition pour créer une hiérarchie.
        </p>
        {flat.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aucun élément. Cliquez sur « Ajouter un élément » pour commencer.
          </div>
        ) : (
          <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5" data-testid={`menu-${location}-items`}>
                {flat.map(({ item, depth }) => (
                  <SortableMenuItem key={item.id} item={item} depth={depth} onEdit={openEdit} onDelete={remove} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        otherItems={items}
        onSave={saveItem}
      />
    </div>
  );
}

export default function AdminMenus() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Menus</h1>
        <p className="text-sm text-muted-foreground mt-1">Composez le menu principal et le menu du pied de page.</p>
      </div>

      <Tabs defaultValue="main">
        <TabsList data-testid="menus-tabs">
          {LOCATIONS.map((l) => (
            <TabsTrigger key={l.key} value={l.key} data-testid={`menus-tab-${l.key}`}>{l.label}</TabsTrigger>
          ))}
        </TabsList>
        {LOCATIONS.map((l) => (
          <TabsContent key={l.key} value={l.key} className="mt-6">
            <MenuTab location={l.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
