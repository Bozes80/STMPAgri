import { LogoMark } from "@/components/Logo";

export function SectionHeading({ eyebrow, title, subtitle, align = "left", light = false }) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls} ${align === "center" ? "" : ""}`}>
      {eyebrow && (
        <div className={`flex items-center gap-2 mb-3 ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-px w-8 bg-[#F2D400]" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7FAE3C]">
            {eyebrow}
          </span>
        </div>
      )}
      <h2
        className={`font-heading text-3xl md:text-4xl font-semibold tracking-tight leading-tight ${
          light ? "text-white" : "text-[#1F2937] dark:text-white"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed ${light ? "text-white/80" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function MotifDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#7FAE3C]/50" />
      <LogoMark size={26} />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#7FAE3C]/50" />
    </div>
  );
}
