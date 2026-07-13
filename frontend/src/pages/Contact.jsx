import { useState } from "react";
import { Loader2, Phone, Smartphone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api, { formatApiError } from "@/lib/api";
import { COMPANY, IMAGES } from "@/lib/constants";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message);
      setForm(EMPTY);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const infos = [
    { icon: Phone, label: "Téléphone", value: COMPANY.phone, href: COMPANY.phoneHref },
    ...COMPANY.mobiles.map((m, i) => ({
      icon: Smartphone,
      label: i === 0 ? "Mobile" : "Mobile (2)",
      value: m.value,
      href: m.href,
    })),
    { icon: MessageCircle, label: "WhatsApp", value: COMPANY.whatsapp, href: COMPANY.whatsappHref },
    { icon: Mail, label: "E-mail", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { icon: MapPin, label: "Adresse", value: COMPANY.address },
  ];

  return (
    <>
      <PageHero
        crumb="Contact"
        title="Contactez-nous"
        subtitle="Une question, un besoin, un projet ? Notre équipe est à votre écoute pour vous accompagner."
        image={IMAGES.warehouse}
      />

      <section className="py-16">
        <div className="container-stmp grid lg:grid-cols-5 gap-10">
          <Reveal className="lg:col-span-3">
            <Card className="p-8 border-border rounded-2xl">
              <h2 className="font-heading text-2xl font-semibold">Envoyez-nous un message</h2>
              <form onSubmit={submit} className="mt-6 space-y-5" data-testid="contact-form">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input id="name" required value={form.name} onChange={set("name")} data-testid="contact-name" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" type="email" required value={form.email} onChange={set("email")} data-testid="contact-email" className="mt-1.5" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={form.phone} onChange={set("phone")} data-testid="contact-phone" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Objet</Label>
                    <Input id="subject" value={form.subject} onChange={set("subject")} data-testid="contact-subject" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" required rows={5} value={form.message} onChange={set("message")} data-testid="contact-message" className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} data-testid="contact-submit" className="bg-[#0E7A3A] hover:bg-[#0b632f] text-white">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Envoyer le message
                </Button>
              </form>
            </Card>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.1}>
            <div className="space-y-4">
              {infos.map((it) => (
                <Card key={it.label} className="p-5 border-border rounded-xl flex items-start gap-4">
                  <div className="h-11 w-11 grid place-items-center rounded-lg bg-[#0E7A3A]/10 text-[#0E7A3A] shrink-0">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{it.label}</div>
                    {it.href ? (
                      <a href={it.href} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[#0E7A3A]">{it.value}</a>
                    ) : (
                      <div className="font-medium">{it.value}</div>
                    )}
                  </div>
                </Card>
              ))}
              <Card className="p-5 border-border rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-[#0E7A3A]" />
                  <span className="font-heading font-semibold">Horaires d'ouverture</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {COMPANY.hours.map((h) => (
                    <li key={h.day} className="flex justify-between">
                      <span className="text-muted-foreground">{h.day}</span>
                      <span className="font-medium">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Reveal>
        </div>

        <div className="container-stmp mt-12">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Localisation STMP Agri"
                src={COMPANY.mapEmbed}
                data-testid="google-map"
                className="w-full h-[400px]"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
