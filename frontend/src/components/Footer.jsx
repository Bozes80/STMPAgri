import { Link } from "react-router-dom";
import { Facebook, Linkedin, Instagram, Twitter, MapPin, Phone, Smartphone, Mail, Clock } from "lucide-react";
import Logo from "@/components/Logo";
import Newsletter from "@/components/Newsletter";
import { COMPANY, NAV_LINKS, SERVICES } from "@/lib/constants";

const socials = [
  { icon: Facebook, href: COMPANY.social.facebook, label: "Facebook" },
  { icon: Linkedin, href: COMPANY.social.linkedin, label: "LinkedIn" },
  { icon: Instagram, href: COMPANY.social.instagram, label: "Instagram" },
  { icon: Twitter, href: COMPANY.social.twitter, label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111C15] text-white/80" data-testid="site-footer">
      <div className="container-stmp py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted size={44} />
          <p className="mt-5 text-sm leading-relaxed text-white/70 max-w-xs">
            {COMPANY.fullName}. Des solutions intégrées pour l'agriculture, la logistique et le commerce international.
          </p>
          <p className="mt-4 font-heading text-[#F2D400] italic">« {COMPANY.slogan} »</p>
          <div className="mt-6 flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                data-testid={`footer-social-${s.label.toLowerCase()}`}
                className="h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-[#0E7A3A] transition-colors"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Navigation</h4>
          <ul className="space-y-3 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-[#A8D45A] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Nos métiers</h4>
          <ul className="space-y-3 text-sm">
            {SERVICES.map((s) => (
              <li key={s.key} className="text-white/70">
                {s.title}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-white mb-5">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <span>{COMPANY.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <a href={COMPANY.phoneHref} className="hover:text-[#A8D45A]">{COMPANY.phone}</a>
            </li>
            <li className="flex gap-3">
              <Smartphone className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <span>
                {COMPANY.mobiles.map((m, i) => (
                  <span key={m.href}>
                    {i > 0 && " / "}
                    <a href={m.href} className="hover:text-[#A8D45A]">{m.value}</a>
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-[#A8D45A]">{COMPANY.email}</a>
            </li>
            <li className="flex gap-3">
              <Clock className="h-4 w-4 text-[#A8D45A] shrink-0 mt-0.5" />
              <span>Lun–Ven : 08h–18h</span>
            </li>
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
