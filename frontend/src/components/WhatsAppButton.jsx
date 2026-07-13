import { MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export default function WhatsAppButton() {
  const msg = encodeURIComponent(
    "Bonjour STMP Agri, je souhaite obtenir des informations.",
  );
  return (
    <a
      href={`${COMPANY.whatsappHref}?text=${msg}`}
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
