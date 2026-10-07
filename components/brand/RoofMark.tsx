/**
 * The roof-S mark on its own: the same three paths as the site logo (public/brand/logo-lockup.svg, the roof and the
 * S under it), in currentColor. For places where the full lockup does not fit, such as a seal. Never boxed.
 */
export function RoofMark({ size = 32, className, decorative = false, title = "Supreme Real Estate" }: { size?: number; className?: string; decorative?: boolean; title?: string }) {
  return (
    <svg
      viewBox="0 0 200 228"
      width={(size * 200) / 228}
      height={size}
      className={className}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <path d="M100 0L200 57.74L200 91.74L100 34L0 91.74L0 57.74Z" />
      <path d="M100 56L200 113.74L200 147.74L100 90L72.62 105.81Q70.89 106.81 72.62 107.81L117.21 133.55Q125 138.05 125 147.05L125 163.05Q125 172.05 117.21 167.55L13.73 107.81Q12 106.81 13.73 105.81Z" />
      <path d="M0 121.88L117.21 189.55Q125 194.05 125 203.05L125 219.05Q125 228.05 117.21 223.55L0 155.88Z" />
    </svg>
  );
}
