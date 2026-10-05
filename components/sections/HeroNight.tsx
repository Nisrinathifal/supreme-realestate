import { MediaFrame } from "@/components/ui/MediaFrame";
import type { ImageAsset, VideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { HeroNightFilm } from "./HeroNightFilm";
import styles from "./Hero.module.css";

/**
 * Night over the day film: first the night film (same view after dark, a boat passing) carries the dusk, then the
 * night still comes up over it and the view holds. Both unseen until the scroll timeline exists
 * (components/windows/HeroScroll): the film is client-only and the still is hidden outright, lifted with its opacity
 * already at 0. Without JavaScript, and under reduced motion, the day view is all there is.
 */
export function HeroNight({ film, image, lang }: { film: VideoAsset; image: ImageAsset; lang: Lang }) {
  return (
    <>
      <HeroNightFilm film={film} />
      <div className={styles.night} data-hero-night hidden>
        <MediaFrame image={image} ratio="fill" lang={lang} radius="none" sizes="100vw" decorative />
      </div>
    </>
  );
}
