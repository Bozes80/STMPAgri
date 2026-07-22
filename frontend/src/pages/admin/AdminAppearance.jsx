import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Palette, Save, Loader2, LayoutTemplate, PanelBottomClose, ExternalLink,
  Phone, Smartphone, Mail, Clock, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api, { formatApiError } from "@/lib/api";
import CoverImageField from "@/components/admin/CoverImageField";

const DEFAULT_HEADER = { logo_url: "", background_image: "", background_color: "" };
const DEFAULT_FOOTER = {
  logo_url: "", background_image: "", background_color: "#111C15",
  address: "", phone_fixed: "", phone_mobile: "", email: "", hours: "",
};

function ColorPicker({ value, onChange, testid, placeholder = "#111C15" }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#111C15"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 rounded-md border border-border cursor-pointer p-1 bg-background"
        data-testid={`${testid}-swatch`}
      />
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-sm"
        data-testid={`${testid}-hex`}
      />
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}
          className="text-destructive hover:text-destructive"
          data-testid={`${testid}-clear`}>
          Retirer
        </Button>
      )}
    </div>
  );
}

export default function AdminAppearance() {
  const qc = useQueryClient();
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => (await api.get("/site-settings")).data,
  });

  useEffect(() => {
    if (data) {
      setHeader({ ...DEFAULT_HEADER, ...data.header });
      setFooter({ ...DEFAULT_FOOTER, ...data.footer });
    }
  }, [data]);

  const saveHeader = async () => {
    setSavingHeader(true);
    try {
      await api.patch("/admin/site-settings", { header });
      toast.success("Header mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      qc.invalidateQueries({ queryKey: ["public-site-settings"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSavingHeader(false); }
  };
  const saveFooter = async () => {
    setSavingFooter(true);
    try {
      await api.patch("/admin/site-settings", { footer });
      toast.success("Footer mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      qc.invalidateQueries({ queryKey: ["public-site-settings"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSavingFooter(false); }
  };

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></div>;
  }

  return (
    <div data-testid="admin-appearance-page" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-[#0E7A3A]" /> Apparence — Header & Footer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez les couleurs, images et logos du header et du footer, ainsi que les coordonnées affichées en pied de page.
          </p>
        </div>
        <Button variant="outline" asChild data-testid="admin-appearance-preview">
          <Link to="/" target="_blank"><ExternalLink className="h-4 w-4 mr-1.5" /> Voir le site</Link>
        </Button>
      </div>

      {/* HEADER */}
      <Card className="p-5 border-border" data-testid="admin-appearance-header-card">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-[#0E7A3A]" /> Header
            </h2>
            <p className="text-xs text-muted-foreground">Barre de navigation en haut du site.</p>
          </div>
          <Button onClick={saveHeader} disabled={savingHeader} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-appearance-header-save">
            {savingHeader ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <Label>Logo</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Image carrée recommandée (128×128 min). Laissez vide pour le logo par défaut.</p>
            <CoverImageField
              value={header.logo_url}
              onChange={(v) => setHeader({ ...header, logo_url: v })}
              testid="admin-appearance-header-logo"
              aspect="square"
            />
          </div>
          <div>
            <Label>Image de fond</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Image affichée en fond de la barre. Optionnelle.</p>
            <CoverImageField
              value={header.background_image}
              onChange={(v) => setHeader({ ...header, background_image: v })}
              testid="admin-appearance-header-bg"
              aspect="video"
            />
          </div>
          <div>
            <Label>Couleur de fond</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Format hexadécimal (ex : <code>#0E7A3A</code>). Vide = transparent glassy par défaut.</p>
            <ColorPicker
              value={header.background_color}
              onChange={(v) => setHeader({ ...header, background_color: v })}
              testid="admin-appearance-header-color"
            />
          </div>
        </div>
      </Card>

      {/* FOOTER */}
      <Card className="p-5 border-border" data-testid="admin-appearance-footer-card">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <PanelBottomClose className="h-5 w-5 text-[#0E7A3A]" /> Footer
            </h2>
            <p className="text-xs text-muted-foreground">Pied de page (logo, coordonnées, couleur).</p>
          </div>
          <Button onClick={saveFooter} disabled={savingFooter} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-appearance-footer-save">
            {savingFooter ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <Label>Logo</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Version blanche recommandée sur fond sombre.</p>
            <CoverImageField
              value={footer.logo_url}
              onChange={(v) => setFooter({ ...footer, logo_url: v })}
              testid="admin-appearance-footer-logo"
              aspect="square"
            />
          </div>
          <div>
            <Label>Image de fond</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Motif ou photo en fond du footer. Optionnelle.</p>
            <CoverImageField
              value={footer.background_image}
              onChange={(v) => setFooter({ ...footer, background_image: v })}
              testid="admin-appearance-footer-bg"
              aspect="video"
            />
          </div>
          <div>
            <Label>Couleur de fond</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Défaut : <code>#111C15</code> (vert forêt profond).</p>
            <ColorPicker
              value={footer.background_color}
              onChange={(v) => setFooter({ ...footer, background_color: v })}
              testid="admin-appearance-footer-color"
              placeholder="#111C15"
            />
          </div>
        </div>

        {/* Coordonnées */}
        <div className="mt-6 pt-5 border-t border-border">
          <h3 className="font-heading font-semibold text-sm mb-3">Coordonnées affichées dans le footer</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="footer-address" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Adresse physique</Label>
              <Textarea id="footer-address" rows={2} value={footer.address || ""}
                onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                placeholder="Treichville, Avenue 21, Rue 12 - Abidjan, Côte d'Ivoire"
                data-testid="admin-appearance-footer-address" />
            </div>
            <div>
              <Label htmlFor="footer-phone-fixed" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Téléphone fixe</Label>
              <Input id="footer-phone-fixed" value={footer.phone_fixed || ""}
                onChange={(e) => setFooter({ ...footer, phone_fixed: e.target.value })}
                placeholder="+225 27 21 34 26 74"
                data-testid="admin-appearance-footer-phone-fixed" />
            </div>
            <div>
              <Label htmlFor="footer-phone-mobile" className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Mobile</Label>
              <Input id="footer-phone-mobile" value={footer.phone_mobile || ""}
                onChange={(e) => setFooter({ ...footer, phone_mobile: e.target.value })}
                placeholder="+225 07 07 07 07 07"
                data-testid="admin-appearance-footer-phone-mobile" />
            </div>
            <div>
              <Label htmlFor="footer-email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input id="footer-email" type="email" value={footer.email || ""}
                onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                placeholder="contact@stmpagri.ci"
                data-testid="admin-appearance-footer-email" />
            </div>
            <div>
              <Label htmlFor="footer-hours" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Heures d'ouverture</Label>
              <Input id="footer-hours" value={footer.hours || ""}
                onChange={(e) => setFooter({ ...footer, hours: e.target.value })}
                placeholder="Lun–Ven : 08h–18h"
                data-testid="admin-appearance-footer-hours" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
