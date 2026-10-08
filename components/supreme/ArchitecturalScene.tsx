"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { type DirectionalLight, Fog, type HemisphereLight, NoToneMapping } from "three";
import { color, paperTexture, toonSteps } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { ArchitecturalDrawing } from "./ArchitecturalDrawing";
import { CameraRig } from "./CameraRig";
import { SupremeBuilding } from "./BuildingStructure";
import { FloorPlan } from "./FloorPlan";
import { Mascot } from "./Mascot";
import { MaterialSamples } from "./MaterialSamples";

/** The drawing's colour all round (background and fog); a sky light of the same colour, so everything the sun does not reach (the shaded
    sides, the cast shadows) is tinted teal, the coloured shadow of a two-tone drawn illustration (illoca's are cobalt);
    and one low sun of plain daylight that casts long, hard shadows and warms at delivery. */
function Atmosphere({ state }: { state: SceneState }) {
  const sun = useRef<DirectionalLight>(null);
  const sky = useRef<HemisphereLight>(null);
  const c = useMemo(() => ({ paper: color("--bg"), white: color("--bg"), warm: color("--window-light"), draw: color("--scene-teal") }), []);

  useFrame(() => {
    const w = state.warm;
    if (sun.current) {
      sun.current.color.lerpColors(c.white, c.warm, w * 0.55);
      sun.current.intensity = 3.4 + 0.3 * w;
    }
    if (sky.current) sky.current.intensity = 2.6 - 0.4 * w;
  });

  return (
    <>
      <hemisphereLight ref={sky} args={[c.draw, c.draw, 2.6]} />
      <directionalLight
        ref={sun}
        position={[-36, 20, 14]}
        intensity={3.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={4}
        shadow-camera-far={110}
        shadow-bias={-0.0006}
        shadow-normalBias={0.06}
      />
    </>
  );
}

/** The worktable in the drawing's colour, filling the frame to its edges (illoca's cobalt), and the Paper site-plan sheet the model stands on. */
function Table() {
  const t = useMemo(() => ({ map: paperTexture(), paper: color("--bg"), desk: color("--scene-draw") }), []);
  return (
    <group name="table">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[280, 220]} />
        <meshToonMaterial gradientMap={toonSteps()} map={t.map} color={t.desk} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.02]} position={[0, 0.01, 2.5]} receiveShadow>
        <planeGeometry args={[34, 26]} />
        <meshToonMaterial gradientMap={toonSteps()} map={t.map} color={t.paper} />
      </mesh>
    </group>
  );
}

/**
 * The About band's 3D model (SCENE-3D.md): one existing building on a developer's worktable that becomes eight homes,
 * with its drawings, plan and samples (procedural) and the mascot (the site's own art), driven by the scene state
 * (scroll). Rendered on demand (SupremeHero invalidates on scroll).
 */
export default function ArchitecturalScene({ state, lite = false, onReady }: { state: SceneState; lite?: boolean; onReady?: (invalidate: () => void) => void }) {
  return (
    <Canvas
      shadows="basic"
      dpr={lite ? [1, 1.25] : [1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: NoToneMapping }}
      camera={{ fov: 26, near: 1, far: 260, position: [30, 27, 40] }}
      aria-hidden="true"
      onCreated={({ scene, camera, invalidate }) => {
        // the drawing's colour everywhere (illoca: the picture fills its frame, no horizon): the far desk melts into it
        const desk = color("--scene-draw");
        scene.background = desk;
        scene.fog = new Fog(desk, 90, 200);
        onReady?.(invalidate); // frames are rendered on demand: the band asks for one whenever the scroll moves it
        if (process.env.NODE_ENV !== "production") Object.assign(window, { __supremeScene: scene, __supremeCamera: camera }); // for the per-asset checks (tests)
      }}
    >
      <Atmosphere state={state} />
      <Table />
      <FloorPlan state={state} />
      <SupremeBuilding state={state} lite={lite} />
      <ArchitecturalDrawing state={state} />
      <MaterialSamples state={state} />
      <Suspense fallback={null}>
        <Mascot state={state} />
      </Suspense>
      <CameraRig state={state} />
    </Canvas>
  );
}
