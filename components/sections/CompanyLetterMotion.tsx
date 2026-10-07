"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ease, gsap, MQ, setupGsap } from "@/lib/motion";

/**
 * The letter band's choreography (after the reference's "open letter"). Arrival: the band comes up with its title,
 * the four icons settle in around, and the envelope rises to the foot of the view with the letter's top edge showing
 * inside it. Pinned: the letter slides up out of the envelope to the reading position, over the title, while the
 * envelope drops away and the icons drift up at their own pace; a letter taller than the view then reads on upwards.
 * Same on every width. Start states are set here; reduced motion and no-JS keep the static title and letter.
 */
export function CompanyLetterMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      setupGsap();
      const root = scope.current!;
      const section = root.closest<HTMLElement>("[data-letter]");
      const q = gsap.utils.selector(root);
      const stage = q<HTMLElement>("[data-letter-stage]")[0];
      const packet = q<HTMLElement>("[data-letter-packet]")[0];
      const letter = q<HTMLElement>("[data-letter-paper]")[0];
      const envelope = q<HTMLElement>("[data-letter-envelope]")[0];
      const pocket = q<HTMLElement>("[data-letter-pocket]")[0];
      const head = q<HTMLElement>("[data-letter-head]")[0];
      const icons = q<HTMLElement>("[data-letter-icon]");
      if (!section || !stage || !packet || !letter || !envelope || !pocket || !head) return;
      const mm = gsap.matchMedia();

      mm.add(MQ.full, () => {
        section.setAttribute("data-live", "");
        // Offsets ignore transforms, so these hold at any point of the timeline
        const inside = () => envelope.offsetTop + envelope.offsetHeight * 0.06 - letter.offsetTop; // its top edge just inside the back
        const overflow = () => Math.max(0, letter.offsetHeight - (stage.clientHeight - letter.offsetTop - 24));

        gsap.set(letter, { y: inside });

        // Arrival, as the band comes up
        const arrive = gsap
          .timeline({ scrollTrigger: { trigger: section, start: "top 85%", end: "top top", scrub: 0.8, invalidateOnRefresh: true } })
          .fromTo(packet, { y: () => window.innerHeight * 0.45 }, { y: 0, duration: 1, ease: ease.out }, 0)
          .fromTo(head, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: ease.out }, 0.1)
          .fromTo(icons, { y: 90, scale: 0.7, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: ease.out, stagger: 0.08 }, 0.15);

        // Pinned: out of the envelope, then the envelope drops away; a long letter reads on
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.5 + overflow() * 1.2}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(letter, { y: 0, duration: 1, ease: "power2.inOut" }, 0)
          .to(head, { opacity: 0.3, scale: 0.96, duration: 0.8, ease: "none" }, 0.2)
          .to([envelope, pocket], { y: () => envelope.offsetHeight * 1.2, duration: 0.7, ease: "power2.in" }, 0.55);
        icons.forEach((icon, i) => {
          tl.to(icon, { y: -60 - i * 28, rotate: i % 2 ? 6 : -6, duration: 1.4, ease: "none" }, 0);
        });
        tl.to(letter, { y: () => -overflow(), duration: 0.6, ease: "none" }, 1.05).to({}, { duration: 0.25 }); // the pin's length grows with the overflow

        return () => {
          arrive.scrollTrigger?.kill();
          arrive.kill();
          tl.scrollTrigger?.kill();
          tl.kill();
          section.removeAttribute("data-live");
          gsap.set([packet, letter, envelope, pocket, head, ...icons], { clearProps: "transform,opacity" });
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-letter-motion>
      {children}
    </div>
  );
}
