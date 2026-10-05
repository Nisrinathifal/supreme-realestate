import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import styles from "./Hero.module.css";

/**
 * The night still over the day film: the same view after dark, windows lit. Hidden outright until the scroll
 * timeline exists (components/windows/HeroScroll lifts `hidden` with its opacity already at 0 and scrubs it up), so
 * without JavaScript, and under reduced motion, the day view is all there is.
 */
export function HeroNight({ image, lang }: { image: ImageAsset; lang: Lang }) {
  return (
    <div className={styles.night} data-hero-night hidden>
      <MediaFrame image={image} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative />
    </div>
  );
}
