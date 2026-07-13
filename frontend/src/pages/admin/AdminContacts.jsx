import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/ArticleCard";
import api, { formatApiError } from "@/lib/api";

export default function AdminContacts() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => (await api.get("/admin/contacts")).data,
  });

  const view = async (c) => {
    setSelected(c);
    if (!c.read) {
      try {
        await api.patch(`/admin/contacts/${c.id}`);
        qc.invalidateQueries({ queryKey: ["admin-contacts"] });
        qc.invalidateQueries({ queryKey: ["admin-overview"] });
      } catch (e) { /* ignore */ }
    }
  };

  const remove = async (c) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await api.delete(`/admin/contacts/${c.id}`);
      toast.success("Message supprimé.");
      qc.invalidateQueries({ queryKey: ["admin-contacts"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Messages de contact</h1>
      <p className="text-sm text-muted-foreground mt-1">Consultez les messages envoyés via le formulaire de contact.</p>

      <Card className="mt-6 border-border">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#0E7A3A]" /></div>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground text-sm">Aucun message pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.id} data-testid={`contact-row-${c.id}`}>
                    <TableCell>
                      {c.read ? <Badge variant="outline">Lu</Badge> : <Badge className="bg-[#F2D400] text-[#1F2937] hover:bg-[#F2D400]">Nouveau</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{c.subject || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => view(c)} data-testid={`contact-view-${c.id}`}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg" data-testid="contact-detail-dialog">
          <DialogHeader>
            <DialogTitle>Message de {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Email : </span><a href={`mailto:${selected.email}`} className="text-[#0E7A3A] font-medium">{selected.email}</a></p>
              {selected.phone && <p><span className="text-muted-foreground">Téléphone : </span>{selected.phone}</p>}
              {selected.subject && <p><span className="text-muted-foreground">Objet : </span>{selected.subject}</p>}
              <div className="rounded-lg bg-muted p-4 whitespace-pre-wrap leading-relaxed">{selected.message}</div>
              <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
                <a href={`mailto:${selected.email}`}><Mail className="h-4 w-4 mr-2" /> Répondre par email</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
