import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const EMPTY = { label: "", url: "", target: "_self", icon: "", parent_id: null };

const SUGGESTED_URLS = [
  { label: "— Pages internes —", value: "__" },
  { value: "/", label: "Accueil (/)" },
  { value: "/activites", label: "Nos activités (/activites)" },
  { value: "/produits", label: "Nos produits (/produits)" },
  { value: "/realisations", label: "Nos réalisations (/realisations)" },
  { value: "/actualites", label: "Actualités (/actualites)" },
  { value: "/partenaires", label: "Partenaires (/partenaires)" },
  { value: "/certifications", label: "Certifications (/certifications)" },
  { value: "/rse", label: "RSE (/rse)" },
  { value: "/contact", label: "Contact (/contact)" },
  { value: "/devis", label: "Demande de devis (/devis)" },
  { value: "/#metiers", label: "Section Nos métiers (/#metiers)" },
];

export default function MenuItemDialog({ open, onOpenChange, initial, otherItems, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [open, initial]);

  // Empêcher un item d'être son propre parent (ou celui d'un descendant)
  const disallowed = new Set();
  if (initial?.id) {
    disallowed.add(initial.id);
    const collect = (pid) => {
      for (const it of otherItems || []) if (it.parent_id === pid) { disallowed.add(it.id); collect(it.id); }
    };
    collect(initial.id);
  }
  const parentOptions = (otherItems || []).filter((i) => !disallowed.has(i.id));

  const submit = () => {
    if (!form.label.trim()) return;
    onSave({ ...form, parent_id: form.parent_id || null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="menu-item-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'élément" : "Nouvel élément"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Libellé</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              data-testid="menu-item-label" placeholder="Ex : Nos produits" />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              data-testid="menu-item-url" placeholder="/produits ou https://..." />
            <div className="mt-1.5">
              <Select value="" onValueChange={(v) => v && v !== "__" && setForm({ ...form, url: v })}>
                <SelectTrigger className="h-8 text-xs" data-testid="menu-item-suggested-url"><SelectValue placeholder="Choisir une page interne…" /></SelectTrigger>
                <SelectContent>
                  {SUGGESTED_URLS.map((s) => (
                    <SelectItem key={s.value} value={s.value} disabled={s.value === "__"}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ouverture</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger data-testid="menu-item-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Même onglet</SelectItem>
                  <SelectItem value="_blank">Nouvel onglet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent</Label>
              <Select value={form.parent_id || "none"} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? null : v })}>
                <SelectTrigger data-testid="menu-item-parent"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (niveau principal)</SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white" onClick={submit}
            data-testid="menu-item-save-btn">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
