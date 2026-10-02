import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";

type Props = { image: ImageAsset; lang: Lang; /** Rendered width hint for `sizes`, in px. */ size: number; className?: string; decorative?: boolean; priority?: boolean };

/**
 * Transparent image from the pipeline (cut-out, mascot, icon): AVIF and WebP with the PNG fallback, 640 and 1280
 * widths. Explicit dimensions from the asset so nothing shifts while it loads.
 */
export function AlphaImage({ image, lang, size, className, decorative = false, priority = false }: Props) {
  const base = `/media/${image.src}`;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w`} sizes={`${size}px`} />
      <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w`} sizes={`${size}px`} />
      <img
        src={`${base}-1280.png`}
        alt={decorative ? "" : image.alt[lang]}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
