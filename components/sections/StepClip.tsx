"use client";

import { useEffect, useRef, useState } from "react";
import type { AlphaVideoAsset } from "@/content/media";
import type { Lang } from "@/content/routes";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { prefersReducedMotion, saveData } from "@/lib/motion";
import styles from "./Steps.module.css";

/**
 * Looping illustration inside a step panel, with a transparent ground. The still (keyed PNG) is the base; on top a
 * canvas composites the stacked clip (colour over its matte) with a small WebGL program, playing only while the
 * panel is on screen. Without JavaScript, WebGL, reduced motion or Save-Data only the still shows.
 */
export function StepClip({ clip, lang }: { clip: AlphaVideoAsset; lang: Lang }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrap.current, canvas = canvasRef.current;
    if (!el || !canvas || prefersReducedMotion() || saveData()) return;
    // The canvas keeps its one context across remounts (never dropped: a lost context cannot compile shaders)
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl || gl.isContextLost()) return;

    // The source video sits in the document (hidden) so every browser keeps decoding it for the canvas
    const video = document.createElement("video");
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto";
    video.setAttribute("aria-hidden", "true"); video.tabIndex = -1; video.className = styles.clipSource;
    video.src = (window.matchMedia("(max-width: 980px)").matches && clip.mp4Mobile) || clip.mp4;
    el.appendChild(video);

    // Full-screen quad; the fragment reads the colour from the top half and the alpha from the matte below the gap
    const vs = "attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
    const fs =
      "precision mediump float;uniform sampler2D t;uniform float h,o;varying vec2 v;" +
      "void main(){vec3 c=texture2D(t,vec2(v.x,v.y*h)).rgb;float a=clamp((texture2D(t,vec2(v.x,o+v.y*h)).r-.02)/.96,0.,1.);gl_FragColor=vec4(c*a,a);}";
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const uH = gl.getUniformLocation(prog, "h"), uO = gl.getUniformLocation(prog, "o");

    let visible = false, drawnOnce = false, raf = 0, sized = false, lastT = -1;
    const size = () => {
      // one frame = (file height − gap) / 2 in the file's own scale (the phone file is smaller, the gap is not)
      const frameH = (video.videoHeight - clip.gap) / 2;
      canvas.width = video.videoWidth; canvas.height = Math.round(frameH);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uH, frameH / video.videoHeight);
      gl.uniform1f(uO, (video.videoHeight - frameH) / video.videoHeight);
      sized = true;
    };
    const draw = () => {
      if (video.readyState < 2 || video.currentTime === lastT) return;
      lastT = video.currentTime;
      if (!sized) size();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!drawnOnce) { drawnOnce = true; setReady(true); }
    };
    const tick = () => {
      if (!visible) return;
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => { video.play().catch(() => undefined); cancelAnimationFrame(raf); tick(); };
    const stop = () => { video.pause(); cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => { io.disconnect(); visible = false; stop(); video.removeAttribute("src"); video.load(); video.remove(); };
  }, [clip.mp4, clip.mp4Mobile, clip.width, clip.gap]);

  return (
    <div ref={wrap} className={styles.clip} style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
      <MediaFrame image={clip.poster} ratio="fill" lang={lang} radius="none" sizes="(max-width: 980px) 90vw, 520px" />
      <canvas ref={canvasRef} width={clip.width} height={clip.height} className={styles.clipAnim} data-ready={ready ? "true" : "false"} aria-hidden="true" />
    </div>
  );
}
