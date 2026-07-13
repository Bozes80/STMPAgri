import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import api, { formatApiError } from "@/lib/api";

export default function CrudManager({
  title, description, queryKey, listUrl, mutateUrl, fields, columns, emptyItem, testid,
}) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => (await api.get(listUrl)).data,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormState(emptyItem);
    setOpen(true);
  };

  const openEdit = (item) => {
    const s = { ...emptyItem, ...item };
    fields.forEach((f) => {
      if (f.type === "list" && Array.isArray(s[f.name])) s[f.name] = s[f.name].join("\n");
    });
    setEditing(item);
    setFormState(s);
    setOpen(true);
  };

  const setField = (name, value) => setFormState((f) => ({ ...f, [name]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...formState };
      fields.forEach((f) => {
        if (f.type === "list")
          payload[f.name] = String(payload[f.name] || "")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
        if (f.type === "number") payload[f.name] = Number(payload[f.name]) || 0;
      });
      if (editing) await api.put(`${mutateUrl}/${editing.id}`, payload);
      else await api.post(mutateUrl, payload);
      toast.success(editing ? "Modification enregistrée." : "Élément ajouté avec succès.");
      qc.invalidateQueries({ queryKey });
      setOpen(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm("Confirmer la suppression de cet élément ?")) return;
    try {
      await api.delete(`${mutateUrl}/${item.id}`);
      toast.success("Élément supprimé.");
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button onClick={openCreate} data-testid={`${testid}-add-btn`} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter
        </Button>
      </div>

      <Card className="border-border">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-[#0E7A3A]" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground text-sm">Aucun élément. Cliquez sur « Ajouter » pour commencer.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.header}>{c.header}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} data-testid={`${testid}-row-${item.id}`}>
                    {columns.map((c) => (
                      <TableCell key={c.header}>{c.render(item)}</TableCell>
                    ))}
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)} data-testid={`${testid}-edit-${item.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(item)} data-testid={`${testid}-delete-${item.id}`} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid={`${testid}-dialog`}>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier" : "Ajouter"} — {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((f) => (
              <div key={f.name}>
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" || f.type === "list" ? (
                  <Textarea
                    id={f.name}
                    rows={f.rows || 4}
                    value={formState[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    data-testid={`${testid}-field-${f.name}`}
                    className="mt-1.5"
                  />
                ) : f.type === "select" ? (
                  <Select value={formState[f.name] ?? ""} onValueChange={(v) => setField(f.name, v)}>
                    <SelectTrigger className="mt-1.5" data-testid={`${testid}-field-${f.name}`}>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "checkbox" ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id={f.name}
                      checked={!!formState[f.name]}
                      onCheckedChange={(v) => setField(f.name, !!v)}
                      data-testid={`${testid}-field-${f.name}`}
                    />
                    <span className="text-sm text-muted-foreground">{f.hint || "Oui"}</span>
                  </div>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : "text"}
                    value={formState[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    data-testid={`${testid}-field-${f.name}`}
                    className="mt-1.5"
                  />
                )}
                {f.type === "list" && (
                  <p className="text-xs text-muted-foreground mt-1">Une entrée par ligne.</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving} data-testid={`${testid}-save-btn`} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
