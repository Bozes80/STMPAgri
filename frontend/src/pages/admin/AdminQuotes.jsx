import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/ArticleCard";
import api, { formatApiError } from "@/lib/api";

const STATUSES = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "traite", label: "Traité" },
  { value: "clos", label: "Clos" },
];

const statusColor = {
  nouveau: "bg-[#F2D400] text-[#1F2937]",
  en_cours: "bg-[#7FAE3C] text-white",
  traite: "bg-[#0E7A3A] text-white",
  clos: "bg-muted text-muted-foreground",
};

export default function AdminQuotes() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => (await api.get("/admin/quotes")).data,
  });

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/quotes/${id}`, { status });
      toast.success("Statut mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin-quotes"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const remove = async (q) => {
    if (!window.confirm("Supprimer cette demande ?")) return;
    try {
      await api.delete(`/admin/quotes/${q.id}`);
      toast.success("Demande supprimée.");
      qc.invalidateQueries({ queryKey: ["admin-quotes"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Demandes de devis</h1>
      <p className="text-sm text-muted-foreground mt-1">Suivez et qualifiez les demandes de devis reçues.</p>

      <Card className="mt-6 border-border">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0E7A3A]" /></div>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground text-sm">Aucune demande de devis pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Société</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((q) => (
                  <TableRow key={q.id} data-testid={`quote-row-${q.id}`}>
                    <TableCell className="font-medium">{q.prenom} {q.nom}</TableCell>
                    <TableCell>{q.societe || "—"}</TableCell>
                    <TableCell>{q.secteur || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(q.created_at)}</TableCell>
                    <TableCell>
                      <Select value={q.status || "nouveau"} onValueChange={(v) => updateStatus(q.id, v)}>
                        <SelectTrigger className="h-8 w-[130px]" data-testid={`quote-status-${q.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => setSelected(q)} data-testid={`quote-view-${q.id}`}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(q)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="quote-detail-dialog">
          <DialogHeader>
            <DialogTitle>Demande de {selected?.prenom} {selected?.nom}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2.5 text-sm">
              <Row label="Société" value={selected.societe} />
              <Row label="Fonction" value={selected.fonction} />
              <Row label="Téléphone" value={selected.telephone} />
              <Row label="Email" value={selected.email} />
              <Row label="Secteur" value={selected.secteur} />
              <div>
                <span className="text-muted-foreground">Objet(s) : </span>
                <span className="flex flex-wrap gap-1.5 mt-1">
                  {(selected.objets || []).map((o) => <Badge key={o} variant="secondary">{o}</Badge>)}
                </span>
              </div>
              <Row label="Quantité" value={selected.quantite} />
              <Row label="Livraison" value={[selected.adresse, selected.ville, selected.pays].filter(Boolean).join(", ")} />
              <Row label="Date souhaitée" value={selected.date_souhaitee} />
              {selected.details && (
                <div>
                  <span className="text-muted-foreground">Détails :</span>
                  <div className="mt-1 rounded-lg bg-muted p-3 whitespace-pre-wrap leading-relaxed">{selected.details}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <p><span className="text-muted-foreground">{label} : </span><span className="font-medium">{value}</span></p>
  );
}
