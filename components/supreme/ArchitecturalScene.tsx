"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ACESFilmicToneMapping, type DirectionalLight, Fog, type HemisphereLight } from "three";
import { color, paperTexture } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { ArchitecturalDrawing } from "./ArchitecturalDrawing";
import { CameraRig } from "./CameraRig";
import { ExistingBuilding } from "./ExistingBuilding";
import { FloorPlan } from "./FloorPlan";
import { MaterialSamples } from "./MaterialSamples";

/** Paper ground and fog in the page's own Paper, a soft sky light and one sun that warms at delivery. */
function Atmosphere({ state }: { state: SceneState }) {
  const sun = useRef<DirectionalLight>(null);
  const sky = useRef<HemisphereLight>(null);
  const c = useMemo(() => ({ paper: color("--bg"), white: color("--bg"), warm: color("--window-light"), stone: color("--alt"), ground: color("--scene-concrete") }), []);

  useFrame(() => {
    const w = state.warm;
    if (sun.current) {
      sun.current.color.lerpColors(c.white, c.warm, w * 0.55);
      sun.current.intensity = 2.5 + 0.3 * w;
    }
    if (sky.current) sky.current.intensity = 1.35 - 0.25 * w;
  });

  return (
    <>
      <hemisphereLight ref={sky} args={[c.white, c.ground, 1.35]} />
      <directionalLight
        ref={sun}
        position={[-26, 42, 28]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={10}
        shadow-camera-far={110}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

/** The worktable: a large sheet of paper, and the site plan sheet the model stands on. */
function Table() {
  const t = useMemo(() => ({ map: paperTexture(), paper: color("--bg"), stone: color("--alt") }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[280, 220]} />
        <meshStandardMaterial map={t.map} color={t.stone} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.02]} position={[0, 0.01, 2.5]} receiveShadow>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial map={t.map} color={t.paper} roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * The About band's 3D model (SCENE-3D.md): a canal house on a developer's worktable, with its drawings, plan and
 * samples, all procedural, driven by the scene state (scroll). Rendered only while `active` (the band on screen).
 */
export default function ArchitecturalScene({ state, active }: { state: SceneState; active: boolean }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.02 }}
      camera={{ fov: 26, near: 1, far: 260, position: [30, 27, 40] }}
      aria-hidden="true"
      onCreated={({ scene }) => {
        // the page's own Paper as the ground colour, fading the far table into it
        const paper = color("--bg");
        scene.background = paper;
        scene.fog = new Fog(paper, 70, 175);
      }}
    >
      <Atmosphere state={state} />
      <Table />
      <FloorPlan state={state} />
      <ExistingBuilding state={state} />
      <ArchitecturalDrawing state={state} />
      <MaterialSamples state={state} />
      <CameraRig state={state} />
    </Canvas>
  );
}
