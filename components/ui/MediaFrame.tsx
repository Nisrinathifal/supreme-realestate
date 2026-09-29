import type { ImageAsset, Ratio } from "@/content/media";
import type { Lang } from "@/content/routes";
import styles from "./MediaFrame.module.css";

type Props = {
  image: ImageAsset | null;
  ratio: Ratio;
  lang: Lang;
  radius?: "lg" | "xl" | "none";
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Marks a decorative frame (alt=""). */
  decorative?: boolean;
};

const ratioClass: Record<Ratio, string> = { "16/9": styles.r169, "4/5": styles.r45, "1/1": styles.r11, "21/9": styles.r219 };

/**
 * Media frame (DESIGN §9.3). Renders pipeline output (AVIF + WebP + JPEG fallback) with explicit
 * dimensions, or a neutral placeholder surface while the asset is missing. No captions.
 */
export function MediaFrame({ image, ratio, lang, radius = "lg", priority = false, sizes = "100vw", className, decorative = false }: Props) {
  const cls = [styles.frame, ratioClass[ratio], radius === "xl" ? styles.rxl : radius === "none" ? styles.rnone : "", className]
    .filter(Boolean)
    .join(" ");
  if (!image) {
    return <div className={`${cls} ${styles.empty}`} data-media-placeholder aria-hidden="true" />;
  }
  const base = `/media/${image.src}`;
  return (
    <div className={cls} data-media-frame>
      <picture>
        <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w, ${base}-1920.avif 1920w`} sizes={sizes} />
        <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w, ${base}-1920.webp 1920w`} sizes={sizes} />
        <img
          src={`${base}-1280.jpg`}
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
