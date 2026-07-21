import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home, Save, Loader2, Users, Globe2, Award, CalendarClock, ExternalLink, Layers,
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

export default function AdminHome() {
  const qc = useQueryClient();
  const [hero, setHero] = useState({ title: "", subtitle: "", background_image: "" });
  const [about, setAbout] = useState({ eyebrow: "", title: "", text: "", image: "" });
  const [stats, setStats] = useState({ partners: 0, countries: 0, clients: 0, years: 0 });
  const [savingHero, setSavingHero] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingStats, setSavingStats] = useState(false);

  const { data: home, isLoading: loadingHome } = useQuery({
    queryKey: ["admin-home"],
    queryFn: async () => (await api.get("/home")).data,
  });
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/stats")).data,
  });

  useEffect(() => {
    if (home) {
      setHero({ ...home.hero });
      setAbout({ ...home.about });
    }
  }, [home]);
  useEffect(() => {
    if (statsData) setStats({ ...statsData });
  }, [statsData]);

  const saveHero = async () => {
    setSavingHero(true);
    try {
      await api.patch("/admin/home", { hero });
      toast.success("Hero mis à jour. La page d'accueil est actualisée.");
      qc.invalidateQueries({ queryKey: ["admin-home"] });
      qc.invalidateQueries({ queryKey: ["public-home"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSavingHero(false); }
  };
  const saveAbout = async () => {
    setSavingAbout(true);
    try {
      await api.patch("/admin/home", { about });
      toast.success("Section « À propos » mise à jour.");
      qc.invalidateQueries({ queryKey: ["admin-home"] });
      qc.invalidateQueries({ queryKey: ["public-home"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSavingAbout(false); }
  };
  const saveStats = async () => {
    setSavingStats(true);
    try {
      await api.patch("/admin/stats", stats);
      toast.success("Chiffres clés mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSavingStats(false); }
  };

  if (loadingHome || loadingStats) {
    return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block text-[#0E7A3A]" /></div>;
  }

  return (
    <div data-testid="admin-home-page" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6 text-[#0E7A3A]" /> Page d'accueil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modifiez le contenu de la page d'accueil. Les changements sont visibles instantanément sur le site.
          </p>
        </div>
        <Button variant="outline" asChild data-testid="admin-home-preview">
          <Link to="/" target="_blank">
            <ExternalLink className="h-4 w-4 mr-1.5" /> Voir la page d'accueil
          </Link>
        </Button>
      </div>

      {/* HERO */}
      <Card className="p-5 border-border" data-testid="admin-home-hero-card">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-lg">1. Section Héros</h2>
            <p className="text-xs text-muted-foreground">La grande bannière en haut du site avec titre accrocheur et image de fond.</p>
          </div>
          <Button onClick={saveHero} disabled={savingHero} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-home-hero-save">
            {savingHero ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div>
              <Label htmlFor="hero-title">Titre principal</Label>
              <Textarea id="hero-title" rows={2} value={hero.title || ""}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="Ex : Des solutions intégrées pour l'agriculture..."
                data-testid="admin-home-hero-title" />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Sous-titre</Label>
              <Textarea id="hero-subtitle" rows={4} value={hero.subtitle || ""}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                placeholder="Description courte affichée sous le titre"
                data-testid="admin-home-hero-subtitle" />
            </div>
          </div>
          <div>
            <Label>Image de fond</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Recommandé : 1920×1080 min. Laissez vide pour utiliser l'image par défaut.
            </p>
            <CoverImageField
              value={hero.background_image || ""}
              onChange={(v) => setHero({ ...hero, background_image: v })}
              testid="admin-home-hero-image"
              aspect="video"
            />
          </div>
        </div>
      </Card>

      {/* ABOUT */}
      <Card className="p-5 border-border" data-testid="admin-home-about-card">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-lg">2. Section « À propos »</h2>
            <p className="text-xs text-muted-foreground">Le bloc de présentation de STMP Agri, affiché entre les métiers et les activités.</p>
          </div>
          <Button onClick={saveAbout} disabled={savingAbout} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-home-about-save">
            {savingAbout ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div>
                <Label htmlFor="about-eyebrow">Étiquette</Label>
                <Input id="about-eyebrow" value={about.eyebrow || ""}
                  onChange={(e) => setAbout({ ...about, eyebrow: e.target.value })}
                  placeholder="À propos"
                  data-testid="admin-home-about-eyebrow" />
              </div>
              <div>
                <Label htmlFor="about-title">Titre de la section</Label>
                <Input id="about-title" value={about.title || ""}
                  onChange={(e) => setAbout({ ...about, title: e.target.value })}
                  placeholder="STMP Agri, un partenaire ivoirien de confiance"
                  data-testid="admin-home-about-title" />
              </div>
            </div>
            <div>
              <Label htmlFor="about-text">Texte de présentation</Label>
              <Textarea id="about-text" rows={8} value={about.text || ""}
                onChange={(e) => setAbout({ ...about, text: e.target.value })}
                placeholder="Utilisez des sauts de ligne pour séparer les paragraphes."
                data-testid="admin-home-about-text" />
              <p className="text-[11px] text-muted-foreground mt-1">Astuce : chaque saut de ligne crée un nouveau paragraphe.</p>
            </div>
          </div>
          <div>
            <Label>Image d'illustration (optionnel)</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Affichée à côté du texte sur les grands écrans.</p>
            <CoverImageField
              value={about.image || ""}
              onChange={(v) => setAbout({ ...about, image: v })}
              testid="admin-home-about-image"
              aspect="video"
            />
          </div>
        </div>
      </Card>

      {/* STATS */}
      <Card className="p-5 border-border" data-testid="admin-home-stats-card">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-lg">3. Chiffres clés</h2>
            <p className="text-xs text-muted-foreground">Les 4 statistiques affichées sur la page d'accueil.</p>
          </div>
          <Button onClick={saveStats} disabled={savingStats} className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
            data-testid="admin-home-stats-save">
            {savingStats ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Enregistrer
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: "partners",  label: "Partenaires de confiance", icon: Users, suffix: "+" },
            { key: "countries", label: "Pays couverts",            icon: Globe2, suffix: "" },
            { key: "clients",   label: "Clients accompagnés",       icon: Award,  suffix: "+" },
            { key: "years",     label: "Années d'expérience",       icon: CalendarClock, suffix: " ans" },
          ].map((it) => (
            <div key={it.key} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <it.icon className="h-4 w-4 text-[#7FAE3C]" /> {it.label}
              </div>
              <div className="flex items-baseline gap-1">
                <Input
                  type="number" min="0" step="1"
                  value={stats[it.key] ?? 0}
                  onChange={(e) => setStats({ ...stats, [it.key]: e.target.value === "" ? 0 : Number(e.target.value) })}
                  className="text-2xl font-heading font-bold text-[#0E7A3A] dark:text-[#A8D45A] h-11 px-2"
                  data-testid={`admin-home-stat-${it.key}`}
                />
                <span className="text-lg text-muted-foreground">{it.suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
