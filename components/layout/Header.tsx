import { Lockup } from "@/components/brand/Lockup";
import { pathFor, type Lang } from "@/content/routes";
import styles from "./Header.module.css";

export type HeaderStrings = { home: string; wordmark: string };

type Props = { lang: Lang; strings: HeaderStrings };

/**
 * Header after the 2026-09-30 concept: only the lockup, centred on the viewport. Fixed over the hero;
 * without JavaScript it sits absolutely at the top. Navigation and the language switch return when
 * that step of the concept is designed.
 */
export function Header({ lang, strings }: Props) {
  return (
    <header className={styles.header} data-header>
      <div className={`container ${styles.bar}`}>
        <Lockup href={pathFor("home", lang)} ariaLabel={strings.home} className={styles.lockup} height={44} />
      </div>
    </header>
  );
}
