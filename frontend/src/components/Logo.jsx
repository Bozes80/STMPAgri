export function LogoMark({ size = 40, className = "" }) {
  const rays = Array.from({ length: 8 }).map((_, i) => {
    const angle = (Math.PI / 8) * i;
    const cx = 24;
    const cy = 15;
    const r1 = 8.5;
    const r2 = 11.5;
    const x1 = cx + Math.cos(Math.PI + angle) * r1;
    const y1 = cy + Math.sin(Math.PI + angle) * r1;
    const x2 = cx + Math.cos(Math.PI + angle) * r2;
    const y2 = cy + Math.sin(Math.PI + angle) * r2;
    return { x1, y1, x2, y2, key: i };
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* sun */}
      <circle cx="24" cy="15" r="6.5" fill="#F2D400" />
      {rays.map((r) => (
        <line
          key={r.key}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="#F2D400"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
      {/* farm plots / furrows */}
      <path d="M2 38 C 14 29, 34 29, 46 38" fill="none" stroke="#0E7A3A" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M4 43 C 15 35, 33 35, 44 43" fill="none" stroke="#7FAE3C" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M7 47.5 C 16 41, 32 41, 41 47.5" fill="none" stroke="#A8D45A" strokeWidth="3" strokeLinecap="round" />
    </svg>
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
