/** Where a film has a phone cut (≤980px) and/or an HEVC encode beside its H.264 one. */
type Film = { mp4: string | null; mp4Mobile: string | null; webm?: string | null; hevc?: string; hevcMobile?: string };

let hevc: boolean | null = null;
/** HEVC (hvc1, Main) decodes here: Safari, and Chrome/Edge where the platform has a decoder; Firefox mostly not. */
function canHevc() {
  if (hevc === null) {
    const v = document.createElement("video");
    hevc = v.canPlayType('video/mp4; codecs="hvc1.1.6.L123.B0"') === "probably";
  }
  return hevc;
}

/**
 * The one file a film plays from on this screen and browser, chosen once (a <source media> pair would make the
 * browser reload and reset at a breakpoint): the phone cut on small screens, HEVC where it decodes (about half the
 * bytes at the same look), else H.264 (or WebM).
 */
export function filmSource(f: Film): string | null {
  const mobile = window.matchMedia("(max-width: 980px)").matches;
  if (canHevc()) {
    const h = (mobile && f.hevcMobile) || f.hevc;
    if (h) return h;
  }
  return (mobile && f.mp4Mobile) || f.mp4 || f.webm || null;
}
