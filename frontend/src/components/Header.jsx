import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SearchDialog from "@/components/SearchDialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/lib/constants";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border glass-header bg-background/80">
      <div className="container-stmp flex items-center justify-between h-16 md:h-20">
        <Link to="/" aria-label="Accueil STMP Agri" data-testid="header-home-link">
          <Logo size={40} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" data-testid="main-nav">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s|é|è/g, "-")}`}
              className="px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors hover:text-[#0E7A3A] dark:hover:text-[#A8D45A] hover:bg-[#0E7A3A]/5"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Recherche"
            data-testid="search-open-btn"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <Button
            asChild
            data-testid="header-quote-cta"
            className="hidden md:inline-flex bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]"
          >
            <Link to="/devis">Demander un devis</Link>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" data-testid="mobile-menu-btn">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mb-8 mt-2">
                <Logo size={38} />
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <Link
                      to={l.to}
                      className="px-3 py-3 text-base font-medium rounded-md hover:bg-[#0E7A3A]/5 hover:text-[#0E7A3A]"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
                <Button
                  data-testid="mobile-quote-cta"
                  className="mt-4 bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/devis");
                  }}
                >
                  Demander un devis
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
