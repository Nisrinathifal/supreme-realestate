import { Columns } from "@/components/brand/Columns";
import { shelfIcons, shelfImage } from "@/content/media";
import { getCopy } from "@/content/copy";
import type { ShelfIcon } from "@/content/copy.types";
import type { Lang } from "@/content/routes";
import { ShelfMotion } from "./ShelfMotion";
import styles from "./Shelf.module.css";

/** A transparent image (icon or cut-out): AVIF/WebP with a PNG fallback from the pipeline. */
function Alpha({ src, alt, size, ratio = 1, className }: { src: string; alt: string; size: number; ratio?: number; className?: string }) {
  const base = `/media/${src}`;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w`} sizes={`${size}px`} />
      <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w`} sizes={`${size}px`} />
      <img src={`${base}-640.png`} alt={alt} width={size} height={Math.round(size / ratio)} loading="lazy" decoding="async" />
    </picture>
  );
}

/**
 * Shelf section (concept 2026-09-30): one statement with four inline icons above a shelf. On scroll the icons
 * leave the sentence and settle into their compartments (ShelfMotion). Without JavaScript and under reduced
 * motion the page shows the end state: the sentence with its icons and the filled shelf.
 */
export function Shelf({ lang }: { lang: Lang }) {
  const c = getCopy(lang);
  const order: ShelfIcon[] = [];
  return (
    <section id="about" className={styles.shelf} data-shelf aria-labelledby="shelf-title">
      <Columns tone="paper" className={styles.columns} data-shelf-columns="" />
      <ShelfMotion>
        <div className={`container ${styles.inner}`}>
          <div className={styles.stage}>
            <p id="shelf-title" className={styles.statement} data-shelf-statement>
              {c.shelf.parts.map((part, i) => {
                if (typeof part === "string") return <span key={i}>{part} </span>;
                order.push(part.icon);
                const icon = shelfIcons[part.icon];
                return (
                  <span key={i} className={styles.slot} data-shelf-icon={part.icon}>
                    <Alpha src={icon.src} alt={icon.alt[lang]} size={64} className={styles.icon} />
                  </span>
                );
              })}
            </p>
          </div>

          <div className={styles.rack} data-shelf-rack style={{ aspectRatio: `${shelfImage.width} / ${shelfImage.height}` }}>
            {/* its own ratio, so the page does not shrink when it loads (that moved every pin below it) */}
            <Alpha src={shelfImage.src} alt={shelfImage.alt[lang]} size={960} ratio={shelfImage.width / shelfImage.height} className={styles.rackImage} />
            {order.map((key) => {
              const icon = shelfIcons[key];
              return (
                <span
                  key={key}
                  className={styles.target}
                  data-shelf-target={key}
                  style={{ left: `${icon.slot.x}%`, top: `${icon.slot.y}%`, width: `${icon.slot.w}%` }}
                >
                  <Alpha src={icon.src} alt="" size={128} className={styles.icon} />
                </span>
              );
            })}
          </div>
        </div>
      </ShelfMotion>
    </section>
  );
}
