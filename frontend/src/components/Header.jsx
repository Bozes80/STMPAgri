import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ChevronDown, MoreHorizontal } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SearchDialog from "@/components/SearchDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  NAV_LINKS_PRIMARY,
  NAV_LINKS_SECONDARY,
  ACTIVITES,
} from "@/lib/constants";

function toTestId(label) {
  return label.toLowerCase().replace(/\s|é|è|à/g, "-").replace(/[^a-z0-9-]/g, "");
}

const linkClass =
  "px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors hover:text-[#0E7A3A] dark:hover:text-[#A8D45A] hover:bg-[#0E7A3A]/5";

function DesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-1" data-testid="main-nav">
      {NAV_LINKS_PRIMARY.map((l) => {
        if (l.label === "Nos activités") {
          return (
            <DropdownMenu key={l.to}>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="nav-activites"
                  className={`${linkClass} inline-flex items-center gap-1`}
                >
                  {l.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Nos 5 activités</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/activites" data-testid="nav-activites-all" className="cursor-pointer font-medium">
                    Voir toutes les activités
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {ACTIVITES.map((a) => (
                  <DropdownMenuItem key={a.key} asChild>
                    <Link
                      to={`/activites/${a.key}`}
                      data-testid={`nav-activite-${a.key}`}
                      className="cursor-pointer"
                    >
                      {a.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        return (
          <Link
            key={l.to}
            to={l.to}
            data-testid={`nav-${toTestId(l.label)}`}
            className={linkClass}
          >
            {l.label}
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Plus"
            data-testid="nav-plus"
            className={`${linkClass} inline-flex items-center gap-1 text-foreground/60`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden xl:inline text-xs">Plus</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {NAV_LINKS_SECONDARY.map((l) => (
            <DropdownMenuItem key={l.to} asChild>
              <Link
                to={l.to}
                data-testid={`nav-plus-${toTestId(l.label)}`}
                className="cursor-pointer"
              >
                {l.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

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

        <DesktopNav />

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
            <SheetContent side="right" className="w-[300px] sm:w-[360px] overflow-y-auto">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mb-8 mt-2">
                <Logo size={38} />
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS_PRIMARY.map((l) => {
                  if (l.label === "Nos activités") {
                    return (
                      <div key={l.to} className="py-1">
                        <SheetClose asChild>
                          <Link
                            to="/activites"
                            className="px-3 py-3 text-base font-medium rounded-md hover:bg-[#0E7A3A]/5 hover:text-[#0E7A3A] block"
                          >
                            {l.label}
                          </Link>
                        </SheetClose>
                        <div className="ml-3 border-l border-border pl-3 mt-1 space-y-0.5">
                          {ACTIVITES.map((a) => (
                            <SheetClose asChild key={a.key}>
                              <Link
                                to={`/activites/${a.key}`}
                                className="px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-[#0E7A3A]/5 hover:text-[#0E7A3A] block"
                              >
                                {a.title}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <SheetClose asChild key={l.to}>
                      <Link
                        to={l.to}
                        className="px-3 py-3 text-base font-medium rounded-md hover:bg-[#0E7A3A]/5 hover:text-[#0E7A3A]"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  );
                })}

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="px-3 text-xs uppercase tracking-widest text-muted-foreground mb-1">Plus</p>
                  {NAV_LINKS_SECONDARY.map((l) => (
                    <SheetClose asChild key={l.to}>
                      <Link
                        to={l.to}
                        className="px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-[#0E7A3A]/5 hover:text-[#0E7A3A] block"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <Button
                  data-testid="mobile-quote-cta"
                  className="mt-6 bg-[#F2D400] text-[#1F2937] font-bold hover:bg-[#d9be00]"
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
