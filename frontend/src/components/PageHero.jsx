import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PageHero({ title, subtitle, image, crumb }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08160c]/94 via-[#0b1f10]/85 to-[#0b1f10]/62" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08160c]/75 via-transparent to-transparent" />
      </div>
      <div className="container-stmp relative z-10 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <nav className="flex items-center gap-1.5 text-sm text-white/80 mb-4">
            <Link to="/" className="hover:text-white">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#F2D400] font-semibold">{crumb}</span>
          </nav>
          <h1
            className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white max-w-3xl"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.65)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-4 text-lg text-white/90 max-w-2xl"
              style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}
            >
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
