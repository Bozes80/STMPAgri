import { Link } from "react-router-dom";
import { MapPin, Phone, Smartphone, Mail, Clock } from "lucide-react";
import Logo from "@/components/Logo";
import Newsletter from "@/components/Newsletter";
import { COMPANY, SERVICES } from "@/lib/constants";
import { useMenu } from "@/hooks/useMenu";
import { useSocials } from "@/hooks/useSocials";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolveImageUrl } from "@/lib/media";

export default function Footer() {
  const { items: footerItems } = useMenu("footer");
  const { socials } = useSocials();
  const { settings } = useSiteSettings();
  const f = settings?.footer || {};
  const bgColor = f.background_color || "#111C15";
  const hasBgImage = !!f.background_image;
  const footerStyle = {
    backgroundColor: bgColor,
    ...(hasBgImage ? {
      backgroundImage: `linear-gradient(${bgColor}CC, ${bgColor}EE), url(${resolveImageUrl(f.background_image)})`,
      backgroundSize: "cover", backgroundPosition: "center",
    } : {}),
  };
  return (
    <footer className="text-white/80" style={footerStyle} data-testid="site-footer">
      <div className="container-stmp py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted size={44} src={f.logo_url} />
          <p className="mt-5 text-sm leading-relaxed text-white/70 max-w-xs">
            {COMPANY.fullName}. Des solutions intégrées pour l'agriculture, la logistique et le commerce international.
          </p>
          <p className="mt-4 font-heading text-[#F2D400] italic">« {COMPANY.slogan} »</p>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3" data-testid="footer-socials">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  data-testid={`footer-social-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-[#0E7A3A] transition-colors overflow-hidden"
                  title={s.name}
                >
                  {s.icon_url ? (
                    <img
                      src={resolveImageUrl(s.icon_url)}
                      alt={s.name}
                      className="h-4 w-4 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-[10px] font-bold uppercase">{s.name.slice(0, 2)}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Navigation</h4>
          <ul className="space-y-3 text-sm" data-testid="footer-nav">
            {footerItems.filter((l) => !l.parent_id).map((l) => (
              <li key={l.id}>
                {/^https?:\/\//i.test(l.url || "") ? (
                  <a href={l.url} target={l.target || "_self"} rel="noreferrer"
                    className="hover:text-[#A8D45A] transition-colors">{l.label}</a>
                ) : (
                  <Link to={l.url || "/"} target={l.target || "_self"}
                    className="hover:text-[#A8D45A] transition-colors">{l.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Nos métiers</h4>
          <ul className="space-y-3 text-sm">
            {SERVICES.map((s) => (
              <li key={s.key}>
                <Link to={`/metiers/${s.key}`} className="text-white/70 hover:text-[#A8D45A] transition-colors">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3" data-testid="footer-address">
              <MapPin className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <span>{f.address || COMPANY.address}</span>
            </li>
            {(f.phone_fixed || COMPANY.phone) && (
              <li className="flex gap-3" data-testid="footer-phone-fixed">
                <Phone className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
                <a href={`tel:${(f.phone_fixed || COMPANY.phone).replace(/\s+/g, "")}`}
                  className="hover:text-[#A8D45A]">{f.phone_fixed || COMPANY.phone}</a>
              </li>
            )}
            {f.phone_mobile && (
              <li className="flex gap-3" data-testid="footer-phone-mobile">
                <Smartphone className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
                <a href={`tel:${f.phone_mobile.replace(/\s+/g, "")}`}
                  className="hover:text-[#A8D45A]">{f.phone_mobile}</a>
              </li>
            )}
            <li className="flex gap-3" data-testid="footer-email">
              <Mail className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <a href={`mailto:${f.email || COMPANY.email}`} className="hover:text-[#A8D45A]">{f.email || COMPANY.email}</a>
            </li>
            {(f.hours || "Lun–Ven : 08h–18h") && (
              <li className="flex gap-3" data-testid="footer-hours">
                <Clock className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
                <span>{f.hours || "Lun–Ven : 08h–18h"}</span>
              </li>
            )}
          </ul>
          <div className="mt-6">
            <p className="text-sm font-medium text-white mb-2">Newsletter</p>
            <Newsletter />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-stmp py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Tous droits réservés.</p>
          <Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-[#A8D45A]">
            Espace administrateur
          </Link>
        </div>
      </div>
    </footer>
  );
}
