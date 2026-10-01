import type { ImageAsset, Ratio } from "@/content/media";
import type { Lang } from "@/content/routes";
import styles from "./MediaFrame.module.css";

type Props = {
  image: ImageAsset | null;
  ratio: Ratio | "fill";
  lang: Lang;
  radius?: "lg" | "xl" | "pill" | "none";
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Marks a decorative frame (alt=""). */
  decorative?: boolean;
};

const ratioClass: Record<Ratio | "fill", string> = { "16/9": styles.r169, "4/5": styles.r45, "1/1": styles.r11, "21/9": styles.r219, fill: styles.fill };

/**
 * Media frame (DESIGN §9.3). Renders pipeline output (AVIF + WebP + JPEG fallback) with explicit
 * dimensions, or a neutral placeholder surface while the asset is missing. No captions.
 */
export function MediaFrame({ image, ratio, lang, radius = "lg", priority = false, sizes = "100vw", className, decorative = false }: Props) {
  const cls = [styles.frame, ratioClass[ratio], radius === "xl" ? styles.rxl : radius === "pill" ? styles.rpill : radius === "none" ? styles.rnone : "", className]
    .filter(Boolean)
    .join(" ");
  if (!image) {
    return (
      <div className={cls} data-media-placeholder aria-hidden="true">
        <div className={`${styles.inner} ${styles.empty}`} data-media-inner />
      </div>
    );
  }
  const base = `/media/${image.src}`;
  const fallback = image.alpha ? "png" : "jpg";
  return (
    <div className={[cls, image.alpha ? styles.alpha : ""].filter(Boolean).join(" ")} data-media-frame>
      <picture className={styles.inner} data-media-inner>
        <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w, ${base}-1920.avif 1920w`} sizes={sizes} />
        <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w, ${base}-1920.webp 1920w`} sizes={sizes} />
        <img
          src={`${base}-1280.${fallback}`}
          width={image.width}
          height={image.height}
          alt={decorative ? "" : image.alt[lang]}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          className={styles.img}
        />
      </picture>
    </div>
  );
}
