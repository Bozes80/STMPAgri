import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Newspaper, Building2, ShieldCheck,
  Handshake, Mail, FileText, Send, LogOut, ExternalLink, Menu, X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/articles", label: "Actualités", icon: Newspaper },
  { to: "/admin/realisations", label: "Réalisations", icon: Building2 },
  { to: "/admin/partenaires", label: "Partenaires", icon: Handshake },
  { to: "/admin/certifications", label: "Certifications", icon: ShieldCheck },
  { to: "/admin/contacts", label: "Messages", icon: Mail },
  { to: "/admin/devis", label: "Demandes de devis", icon: FileText },
  { to: "/admin/newsletter", label: "Newsletter", icon: Send },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const SidebarContent = () => (
    <>
      <div className="px-5 py-6">
        <Logo inverted size={38} />
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setMobileOpen(false)}
            data-testid={`admin-nav-${n.label.toLowerCase().replace(/\s|é/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0E7A3A] text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" /> Voir le site
        </Link>
        <button
          onClick={handleLogout}
          data-testid="admin-logout-btn"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#111C15] fixed inset-y-0 left-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-[#111C15]">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/70">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#111C15] px-4 py-3">
          <Logo inverted size={34} />
          <Button size="icon" variant="ghost" className="text-white" onClick={() => setMobileOpen(true)} data-testid="admin-mobile-menu">
            <Menu className="h-6 w-6" />
          </Button>
        </header>
        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
