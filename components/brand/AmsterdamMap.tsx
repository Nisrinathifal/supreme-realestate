import styles from "./AmsterdamMap.module.css";

/**
 * Abstract city map for the dark map band: the Amsterdam canal ring as concentric arcs with radial
 * streets and the IJ as a band at the top. Decorative, city-level only; no property locations (PRD §6).
 */
export function AmsterdamMap() {
  const arcs = [180, 240, 300, 360, 420, 480, 560, 660];
  const radials = Array.from({ length: 17 }).map((_, i) => -80 + i * 10);
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={styles.map} aria-hidden="true" focusable="false" data-map>
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        {/* IJ */}
        <path d="M-50,110 C300,60 700,150 1100,90 S1500,120 1700,80" strokeWidth="46" opacity=".18" />
        <path d="M-50,110 C300,60 700,150 1100,90 S1500,120 1700,80" strokeWidth="2" opacity=".35" />
        {/* canal ring */}
        {arcs.map((r, i) => (
          <path key={r} d={`M ${800 - r},170 A ${r} ${r} 0 0 0 ${800 + r},170`} strokeWidth={i % 2 === 0 ? 3 : 1.5} opacity={i % 2 === 0 ? 0.42 : 0.26} />
        ))}
        {/* radial streets */}
        {radials.map((deg) => {
          const a = ((deg + 180) * Math.PI) / 180;
          const x1 = 800 + Math.cos(a) * 150;
          const y1 = 170 - Math.sin(a) * 150;
          const x2 = 800 + Math.cos(a) * 720;
          const y2 = 170 - Math.sin(a) * 720;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" opacity=".22" />;
        })}
        {/* outer grid, 19th-century belt */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={560 + i * 44} x2="1600" y2={520 + i * 44} strokeWidth="1" opacity=".14" />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 130 - 100} y1="900" x2={i * 130 + 60} y2="480" strokeWidth="1" opacity=".12" />
        ))}
      </g>
    </svg>
  );
}
