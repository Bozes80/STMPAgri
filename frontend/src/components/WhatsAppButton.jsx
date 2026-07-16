import { MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { useSocials } from "@/hooks/useSocials";

export default function WhatsAppButton() {
  const { socials } = useSocials();
  // Cherche un réseau nommé "WhatsApp" (insensible à la casse), actif.
  const wa = socials.find((s) => (s.name || "").toLowerCase().includes("whatsapp"));
  const href = wa?.url || COMPANY.whatsappHref;
  if (!href) return null;

  const msg = encodeURIComponent(
    "Bonjour STMP Agri, je souhaite obtenir des informations.",
  );
  // N'ajoute ?text= que si l'URL supporte le paramètre (wa.me / api.whatsapp.com)
  const supportsText = /wa\.me|whatsapp\.com/i.test(href);
  const finalHref = supportsText
    ? `${href}${href.includes("?") ? "&" : "?"}text=${msg}`
    : href;

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-float-btn"
      aria-label="Discuter sur WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-110 hover:-translate-y-0.5"
    >
      <MessageCircle className="h-7 w-7" fill="white" />
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-40 animate-ping" />
    </a>
  );
}
