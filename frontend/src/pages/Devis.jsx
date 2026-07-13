import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle2, RotateCcw, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import api, { formatApiError } from "@/lib/api";
import { SECTEURS, OBJETS_DEMANDE, IMAGES } from "@/lib/constants";

const EMPTY = {
  nom: "", prenom: "", societe: "", fonction: "", telephone: "", email: "",
  secteur: "", objets: [], details: "", quantite: "",
  pays: "", ville: "", adresse: "", consent: false,
};

function SectionTitle({ n, children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-8 w-8 grid place-items-center rounded-full bg-[#0E7A3A] text-white text-sm font-bold shrink-0">
        {n}
      </span>
      <h3 className="font-heading font-semibold text-lg">{children}</h3>
    </div>
  );
}

export default function Devis() {
  const [form, setForm] = useState(EMPTY);
  const [date, setDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleObjet = (value) => {
    setForm((f) => ({
      ...f,
      objets: f.objets.includes(value)
        ? f.objets.filter((o) => o !== value)
        : [...f.objets, value],
    }));
  };

  const reset = () => {
    setForm(EMPTY);
    setDate(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent) {
      toast.error("Veuillez accepter le traitement de vos données pour continuer.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        date_souhaitee: date ? format(date, "yyyy-MM-dd") : null,
      };
      const { data } = await api.post("/quote", payload);
      setSuccess(data.message);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container-stmp py-24 md:py-32">
        <Reveal>
          <Card className="max-w-2xl mx-auto p-10 text-center border-border rounded-2xl" data-testid="quote-success">
            <div className="h-16 w-16 mx-auto grid place-items-center rounded-full bg-[#0E7A3A]/10">
              <CheckCircle2 className="h-9 w-9 text-[#0E7A3A]" />
            </div>
            <h1 className="mt-6 font-heading text-2xl md:text-3xl font-semibold">Merci pour votre demande de devis</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{success}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
                <Link to="/">Retour à l'accueil</Link>
              </Button>
              <Button variant="outline" onClick={() => setSuccess(null)} data-testid="quote-new-btn">
                Nouvelle demande
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <>
      <PageHero
        crumb="Demande de devis"
        title="Demande de devis en ligne"
        subtitle="Décrivez précisément votre besoin. Un conseiller STMP Agri vous proposera une offre adaptée dans les plus brefs délais."
        image={IMAGES.truck}
      />

      <section className="py-16">
        <div className="container-stmp max-w-4xl">
          <form onSubmit={submit} data-testid="quote-form" className="space-y-6">
            {/* 1. Informations personnelles */}
            <Card className="p-8 border-border rounded-2xl">
              <SectionTitle n={1}>Informations personnelles</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input id="nom" required value={form.nom} onChange={set("nom")} data-testid="quote-nom" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" value={form.prenom} onChange={set("prenom")} data-testid="quote-prenom" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="societe">Société</Label>
                  <Input id="societe" value={form.societe} onChange={set("societe")} data-testid="quote-societe" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="fonction">Fonction</Label>
                  <Input id="fonction" value={form.fonction} onChange={set("fonction")} data-testid="quote-fonction" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <Input id="telephone" required value={form.telephone} onChange={set("telephone")} data-testid="quote-telephone" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="qemail">Email *</Label>
                  <Input id="qemail" type="email" required value={form.email} onChange={set("email")} data-testid="quote-email" className="mt-1.5" />
                </div>
              </div>
            </Card>

            {/* 2. Secteur + Objet */}
            <Card className="p-8 border-border rounded-2xl">
              <SectionTitle n={2}>Secteur & objet de la demande</SectionTitle>
              <div className="mb-6">
                <Label>Secteur d'activité</Label>
                <Select value={form.secteur} onValueChange={(v) => setForm((f) => ({ ...f, secteur: v }))}>
                  <SelectTrigger className="mt-1.5" data-testid="quote-secteur">
                    <SelectValue placeholder="Sélectionnez votre secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEURS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-3 block">Objet de la demande</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {OBJETS_DEMANDE.map((o) => (
                    <label
                      key={o}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-[#0E7A3A]/40 transition-colors"
                    >
                      <Checkbox
                        checked={form.objets.includes(o)}
                        onCheckedChange={() => toggleObjet(o)}
                        data-testid={`quote-objet-${o.toLowerCase().replace(/\s|é/g, "-")}`}
                      />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            {/* 3. Détails + quantité */}
            <Card className="p-8 border-border rounded-2xl">
              <SectionTitle n={3}>Détails de la demande</SectionTitle>
              <div>
                <Label htmlFor="details">Décrivez précisément votre besoin</Label>
                <Textarea id="details" rows={5} value={form.details} onChange={set("details")} data-testid="quote-details" className="mt-1.5" placeholder="Produits, spécifications, contexte du projet…" />
              </div>
              <div className="mt-5 sm:max-w-xs">
                <Label htmlFor="quantite">Quantité</Label>
                <Input id="quantite" type="number" min="0" value={form.quantite} onChange={set("quantite")} data-testid="quote-quantite" className="mt-1.5" placeholder="Ex : 500" />
              </div>
            </Card>

            {/* 4. Livraison + date */}
            <Card className="p-8 border-border rounded-2xl">
              <SectionTitle n={4}>Lieu & date de livraison</SectionTitle>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <Label htmlFor="pays">Pays</Label>
                  <Input id="pays" value={form.pays} onChange={set("pays")} data-testid="quote-pays" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input id="ville" value={form.ville} onChange={set("ville")} data-testid="quote-ville" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input id="adresse" value={form.adresse} onChange={set("adresse")} data-testid="quote-adresse" className="mt-1.5" />
                </div>
              </div>
              <div className="mt-5">
                <Label className="block mb-1.5">Date souhaitée</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="quote-date-trigger"
                      className={cn("w-full sm:w-72 justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} />
                  </PopoverContent>
                </Popover>
              </div>
            </Card>

            {/* 5. Consentement */}
            <Card className="p-8 border-border rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.consent}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, consent: !!v }))}
                  data-testid="quote-consent"
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground/80 leading-relaxed">
                  J'accepte que STMP Agri utilise mes informations pour traiter ma demande. *
                </span>
              </label>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="submit" size="lg" disabled={loading} data-testid="quote-submit" className="bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]">
                  {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                  Envoyer la demande
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={reset} data-testid="quote-reset">
                  <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </section>
    </>
  );
}
