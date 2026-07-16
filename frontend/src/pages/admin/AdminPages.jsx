import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Pencil, Trash2, Eye, ExternalLink, ArrowUpDown, Loader2,
  ArchiveIcon, Send, FileText, CircleDot, Circle, MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

export default function AdminPages() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [toDelete, setToDelete] = useState(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => (await api.get("/admin/pages")).data,
  });

  const rows = useMemo(() => {
    let out = [...data];
    if (statusFilter !== "all") out = out.filter((p) => p.status === statusFilter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((p) =>
        p.title.toLowerCase().includes(needle) ||
        (p.slug || "").toLowerCase().includes(needle) ||
        (p.author_email || "").toLowerCase().includes(needle)
      );
    }
    out.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "fr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [data, q, statusFilter, sortKey, sortDir]);

  const changeSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const setStatus = async (page, status) => {
    try {
      await api.post(`/admin/pages/${page.id}/status?status=${status}`);
      toast.success(status === "published" ? "Page publiée." : status === "archived" ? "Page archivée." : "Page passée en brouillon.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/pages/${toDelete.id}`);
      toast.success("Page supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setToDelete(null);
    }
  };

  const SortHead = ({ k, children, className = "" }) => (
    <TableHead className={className}>
      <button onClick={() => changeSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-[#0E7A3A]" : "opacity-40"}`} />
      </button>
    </TableHead>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez, modifiez et publiez les pages du site.</p>
        </div>
        <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" data-testid="admin-pages-add-btn">
          <Link to="/admin/pages/nouveau"><Plus className="h-4 w-4 mr-1.5" /> Nouvelle page</Link>
        </Button>
      </div>

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

      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow><TableCell colSpan={7} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-sm" data-testid="admin-pages-empty">
                {data.length === 0 ? "Aucune page. Créez votre première page." : "Aucune page ne correspond aux filtres."}
              </TableCell></TableRow>
            ) : rows.map((p) => (
              <TableRow key={p.id} data-testid={`admin-pages-row-${p.id}`} className="hover:bg-muted/40">
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
                        {p.status !== "published" && (
                          <DropdownMenuItem onClick={() => setStatus(p, "published")}><Send className="h-4 w-4 mr-2 text-[#0E7A3A]" /> Publier</DropdownMenuItem>
                        )}
                        {p.status !== "draft" && (
                          <DropdownMenuItem onClick={() => setStatus(p, "draft")}><Circle className="h-4 w-4 mr-2" /> Repasser en brouillon</DropdownMenuItem>
                        )}
                        {p.status !== "archived" && (
                          <DropdownMenuItem onClick={() => setStatus(p, "archived")}><ArchiveIcon className="h-4 w-4 mr-2 text-amber-600" /> Archiver</DropdownMenuItem>
                        )}
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
            <AlertDialogAction onClick={doDelete} data-testid="admin-pages-delete-confirm" className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
