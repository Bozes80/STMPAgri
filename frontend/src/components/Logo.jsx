import logoStmp from "@/assets/logo-stmp.png";

export function LogoMark({ size = 40, className = "" }) {
  return (
    <img
      src={logoStmp}
      alt="STMP Agri"
      width={size}
      height={size}
      className={className}
      style={{ height: size, width: size, objectFit: "contain" }}
    />
  );
}

export default function Logo({ inverted = false, showTagline = false, size = 40 }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="stmp-logo">
      <LogoMark size={size} />
      <div className="leading-none">
        <div className="font-heading font-extrabold tracking-tight text-[1.35rem]">
          <span className={inverted ? "text-white" : "text-[#0E7A3A] dark:text-white"}>
            STMP
          </span>{" "}
          <span className="text-[#7FAE3C]">Agri</span>
        </div>
        {showTagline && (
          <div
            className={`text-[10px] uppercase tracking-[0.18em] mt-0.5 ${
              inverted ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            Nourrir nos terres
          </div>
        )}
      </div>
    </div>
  );
}
