import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Newspaper, Building2, Handshake, ShieldCheck,
  Mail, FileText, Send, Loader2, ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const CARDS = [
  { key: "products", label: "Produits", icon: Package, to: "/admin/produits", color: "#0E7A3A" },
  { key: "articles", label: "Actualités", icon: Newspaper, to: "/admin/articles", color: "#7FAE3C" },
  { key: "realisations", label: "Réalisations", icon: Building2, to: "/admin/realisations", color: "#0E7A3A" },
  { key: "partners", label: "Partenaires", icon: Handshake, to: "/admin/partenaires", color: "#7FAE3C" },
  { key: "certifications", label: "Certifications", icon: ShieldCheck, to: "/admin/certifications", color: "#0E7A3A" },
  { key: "newsletter", label: "Abonnés newsletter", icon: Send, to: "/admin/newsletter", color: "#7FAE3C" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/overview")).data,
  });

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl font-bold">
        Bonjour, {user?.name || "Administrateur"}
      </h1>
      <p className="text-muted-foreground mt-1">Vue d'ensemble de votre plateforme STMP Agri.</p>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            <Link to="/admin/devis">
              <Card data-testid="dash-card-quotes" className="p-6 border-border rounded-xl bg-[#0E7A3A] text-white hover:opacity-95 transition-opacity">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8" />
                  <ArrowUpRight className="h-5 w-5 opacity-70" />
                </div>
                <div className="mt-4 font-heading text-4xl font-bold">{data?.quotes ?? 0}</div>
                <div className="mt-1 text-white/80">Demandes de devis</div>
                {data?.quotes_new > 0 && (
                  <span className="mt-2 inline-block rounded-full bg-[#F2D400] text-[#1F2937] text-xs font-bold px-2.5 py-0.5">
                    {data.quotes_new} nouvelle(s)
                  </span>
                )}
              </Card>
            </Link>

            <Link to="/admin/contacts">
              <Card data-testid="dash-card-contacts" className="p-6 border-border rounded-xl hover:border-[#0E7A3A]/40 transition-colors h-full">
                <div className="flex items-center justify-between">
                  <Mail className="h-8 w-8 text-[#7FAE3C]" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-4 font-heading text-4xl font-bold text-[#0E7A3A] dark:text-[#A8D45A]">{data?.contacts ?? 0}</div>
                <div className="mt-1 text-muted-foreground">Messages de contact</div>
                {data?.contacts_unread > 0 && (
                  <span className="mt-2 inline-block rounded-full bg-[#F2D400] text-[#1F2937] text-xs font-bold px-2.5 py-0.5">
                    {data.contacts_unread} non lu(s)
                  </span>
                )}
              </Card>
            </Link>
          </div>

          <div className="mt-5 grid gap-5 grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <Link key={c.key} to={c.to}>
                <Card data-testid={`dash-card-${c.key}`} className="p-5 border-border rounded-xl hover:border-[#0E7A3A]/40 transition-colors h-full">
                  <c.icon className="h-6 w-6" style={{ color: c.color }} />
                  <div className="mt-3 font-heading text-3xl font-bold">{data?.[c.key] ?? 0}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
