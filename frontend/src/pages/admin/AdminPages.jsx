import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Trash2, Eye, ArrowUpDown, Loader2, ArchiveIcon,
  Send, Circle, MoreVertical, LayoutList, ListTree, GripVertical, X,
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
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { formatApiError } from "@/lib/api";

const STATUS = {
  draft:     { label: "Brouillon", className: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200" },
  published: { label: "Publié",    className: "bg-[#0E7A3A]/15 text-[#0E7A3A] dark:text-[#A8D45A]" },
  archived:  { label: "Archivé",   className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

/** Aplatit la liste des pages en arbre (parent → enfants), retourne [{page, depth}]. */
function toTree(pages) {
  const byId = Object.fromEntries(pages.map((p) => [p.id, p]));
  const roots = pages
    .filter((p) => !p.parent_id || !byId[p.parent_id])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "fr"));
  const out = [];
  const walk = (n, depth) => {
    out.push({ page: n, depth });
    const kids = pages.filter((p) => p.parent_id === n.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "fr"));
    for (const k of kids) walk(k, depth + 1);
  };
  for (const r of roots) walk(r, 0);
  return out;
}

/** Ligne triable pour la vue arborescence. */
function TreeRow({ page, depth, onEdit, onDelete, onSetStatus, onReparent, allPages }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: 12 + depth * 24,
  };
  const parentOpts = allPages.filter((p) => p.id !== page.id);

  return (
    <div ref={setNodeRef} style={style}
      data-testid={`admin-pages-tree-row-${page.id}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card hover:bg-muted/30 py-2 pr-2 transition-colors">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1" title="Déplacer">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{page.title}</span>
          <Badge className={`${STATUS[page.status]?.className} border-0 text-[10px] py-0 h-4`}>{STATUS[page.status]?.label}</Badge>
        </div>
        <span className="text-xs text-muted-foreground font-mono block truncate">/p/{page.slug}</span>
      </div>
      <div className="hidden md:block w-48">
        <Select value={page.parent_id || "none"} onValueChange={(v) => onReparent(page, v === "none" ? null : v)}>
          <SelectTrigger className="h-8 text-xs" data-testid={`admin-pages-reparent-${page.id}`}><SelectValue placeholder="Parent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Aucun parent —</SelectItem>
            {parentOpts.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => onEdit(page)}><Pencil className="h-4 w-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {page.status !== "published" && <DropdownMenuItem onClick={() => onSetStatus(page, "published")}><Send className="h-4 w-4 mr-2 text-[#0E7A3A]" /> Publier</DropdownMenuItem>}
            {page.status !== "draft" && <DropdownMenuItem onClick={() => onSetStatus(page, "draft")}><Circle className="h-4 w-4 mr-2" /> Brouillon</DropdownMenuItem>}
            {page.status !== "archived" && <DropdownMenuItem onClick={() => onSetStatus(page, "archived")}><ArchiveIcon className="h-4 w-4 mr-2 text-amber-600" /> Archiver</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(page)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function AdminPages() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [toDelete, setToDelete] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkAsk, setBulkAsk] = useState(false);
  const [view, setView] = useState("table"); // "table" | "tree"

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => (await api.get("/admin/pages")).data,
  });

  const filteredForTable = useMemo(() => {
    let out = [...data];
    if (statusFilter !== "all") out = out.filter((p) => p.status === statusFilter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((p) =>
        p.title.toLowerCase().includes(needle) ||
        (p.slug || "").toLowerCase().includes(needle) ||
        (p.author_email || "").toLowerCase().includes(needle));
    }
    out.sort((a, b) => {
      const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "fr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [data, q, statusFilter, sortKey, sortDir]);

  const treeRows = useMemo(() => toTree(data), [data]);

  const dataLen = data.length;
  useEffect(() => { setSelected(new Set()); }, [dataLen]);

  const changeSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const setStatus = async (page, status) => {
    try {
      await api.post(`/admin/pages/${page.id}/status?status=${status}`);
      toast.success(status === "published" ? "Page publiée." : status === "archived" ? "Page archivée." : "Page passée en brouillon.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/pages/${toDelete.id}`);
      toast.success("Page supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setToDelete(null); }
  };

  const bulkDelete = async () => {
    try {
      const ids = Array.from(selected);
      const { data: res } = await api.post("/admin/pages/bulk-delete", { ids });
      toast.success(`${res.deleted} page${res.deleted > 1 ? "s" : ""} supprimée${res.deleted > 1 ? "s" : ""}.`);
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      setSelected(new Set());
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setBulkAsk(false); }
  };

  const toggleSel = (id) => setSelected((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleSelAll = () => {
    if (selected.size === filteredForTable.length) setSelected(new Set());
    else setSelected(new Set(filteredForTable.map((p) => p.id)));
  };

  const reparent = async (page, newParentId) => {
    try {
      await api.post("/admin/pages/reorder", { items: [{ id: page.id, parent_id: newParentId, order: page.order ?? 0 }] });
      toast.success("Hiérarchie mise à jour.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const treeIds = treeRows.map((r) => r.page.id);

  const onTreeDragEnd = async (evt) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const activePage = data.find((p) => p.id === active.id);
    const overPage = data.find((p) => p.id === over.id);
    if (!activePage || !overPage) return;
    // Réordonner uniquement au sein du même parent que l'élément over
    const newParent = overPage.parent_id || null;
    const siblings = data
      .filter((p) => (p.parent_id || null) === newParent)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const withoutActive = siblings.filter((p) => p.id !== active.id);
    const targetIdx = withoutActive.findIndex((p) => p.id === over.id);
    const finalOrder = [
      ...withoutActive.slice(0, targetIdx),
      { ...activePage, parent_id: newParent },
      ...withoutActive.slice(targetIdx),
    ];
    const items = finalOrder.map((p, i) => ({ id: p.id, parent_id: newParent, order: i }));
    try {
      await api.post("/admin/pages/reorder", { items });
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const SortHead = ({ k, children }) => (
    <TableHead>
      <button onClick={() => changeSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-[#0E7A3A]" : "opacity-40"}`} />
      </button>
    </TableHead>
  );

  const allSelected = filteredForTable.length > 0 && selected.size === filteredForTable.length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez, modifiez et publiez les pages du site.</p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <Button variant={view === "table" ? "default" : "ghost"} size="sm" onClick={() => setView("table")}
              data-testid="admin-pages-view-table" className={view === "table" ? "bg-[#0E7A3A] hover:bg-[#0b632f] text-white" : ""}>
              <LayoutList className="h-4 w-4 mr-1.5" /> Table
            </Button>
            <Button variant={view === "tree" ? "default" : "ghost"} size="sm" onClick={() => setView("tree")}
              data-testid="admin-pages-view-tree" className={view === "tree" ? "bg-[#0E7A3A] hover:bg-[#0b632f] text-white" : ""}>
              <ListTree className="h-4 w-4 mr-1.5" /> Arborescence
            </Button>
          </div>
          <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" data-testid="admin-pages-add-btn">
            <Link to="/admin/pages/nouveau"><Plus className="h-4 w-4 mr-1.5" /> Nouvelle page</Link>
          </Button>
        </div>
      </div>

      {view === "table" && (
        <>
          <Card className="p-4 mb-4 border-border">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)}
                  data-testid="admin-pages-search"
                  placeholder="Rechercher par titre, slug ou auteur…" className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="admin-pages-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {selected.size > 0 && (
            <Card data-testid="admin-pages-bulk-bar" className="p-3 mb-4 border-[#0E7A3A]/30 bg-[#0E7A3A]/5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{selected.size} page{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} data-testid="admin-pages-bulk-cancel">
                  <X className="h-3.5 w-3.5 mr-1" /> Annuler
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkAsk(true)} data-testid="admin-pages-bulk-delete">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer la sélection
                </Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelAll} data-testid="admin-pages-select-all" aria-label="Tout sélectionner" />
                  </TableHead>
                  <SortHead k="title">Titre</SortHead>
                  <SortHead k="slug">Slug</SortHead>
                  <SortHead k="status">Statut</SortHead>
                  <SortHead k="author_email">Auteur</SortHead>
                  <SortHead k="updated_at">Dernière modif.</SortHead>
                  <SortHead k="published_at">Publiée le</SortHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></TableCell></TableRow>
                ) : filteredForTable.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-sm" data-testid="admin-pages-empty">
                    {data.length === 0 ? "Aucune page. Créez votre première page." : "Aucune page ne correspond aux filtres."}
                  </TableCell></TableRow>
                ) : filteredForTable.map((p) => (
                  <TableRow key={p.id} data-testid={`admin-pages-row-${p.id}`} className={`hover:bg-muted/40 ${selected.has(p.id) ? "bg-[#0E7A3A]/5" : ""}`}>
                    <TableCell>
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSel(p.id)}
                        data-testid={`admin-pages-select-${p.id}`} aria-label={`Sélectionner ${p.title}`} />
                    </TableCell>
                    <TableCell><span className="font-medium">{p.title}</span></TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">/p/{p.slug}</TableCell>
                    <TableCell><Badge className={`${STATUS[p.status]?.className} border-0 font-semibold`}>{STATUS[p.status]?.label || p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{p.author_email || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(p.updated_at)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(p.published_at)}</TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="inline-flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => nav(`/admin/pages/${p.id}`)} data-testid={`admin-pages-edit-${p.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" asChild data-testid={`admin-pages-preview-${p.id}`}>
                          <Link to={`/p/${p.slug}`} target="_blank" title="Aperçu"><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" data-testid={`admin-pages-menu-${p.id}`}><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status !== "published" && (<DropdownMenuItem onClick={() => setStatus(p, "published")}><Send className="h-4 w-4 mr-2 text-[#0E7A3A]" /> Publier</DropdownMenuItem>)}
                            {p.status !== "draft" && (<DropdownMenuItem onClick={() => setStatus(p, "draft")}><Circle className="h-4 w-4 mr-2" /> Repasser en brouillon</DropdownMenuItem>)}
                            {p.status !== "archived" && (<DropdownMenuItem onClick={() => setStatus(p, "archived")}><ArchiveIcon className="h-4 w-4 mr-2 text-amber-600" /> Archiver</DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(p)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {view === "tree" && (
        <Card className="p-4 border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Faites glisser une page par sa poignée pour la réordonner. Utilisez le sélecteur « Parent » pour la déplacer sous une autre page.
          </p>
          {treeRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground" data-testid="admin-pages-tree-empty">Aucune page.</div>
          ) : (
            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} collisionDetection={closestCenter} onDragEnd={onTreeDragEnd}>
              <SortableContext items={treeIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5" data-testid="admin-pages-tree">
                  {treeRows.map(({ page, depth }) => (
                    <TreeRow
                      key={page.id}
                      page={page}
                      depth={depth}
                      allPages={data}
                      onEdit={(p) => nav(`/admin/pages/${p.id}`)}
                      onDelete={(p) => setToDelete(p)}
                      onSetStatus={setStatus}
                      onReparent={reparent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </Card>
      )}

      {/* Single delete */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette page ?</AlertDialogTitle>
            <AlertDialogDescription>
              «{toDelete?.title}» sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-pages-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} data-testid="admin-pages-delete-confirm" className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkAsk} onOpenChange={setBulkAsk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selected.size} page{selected.size > 1 ? "s" : ""} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les pages sélectionnées seront définitivement supprimées. Les sous-pages orphelines remonteront au niveau racine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-pages-bulk-delete-cancel">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} data-testid="admin-pages-bulk-delete-confirm" className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
