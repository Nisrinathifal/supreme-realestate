"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { use, useEffect, useRef } from "react";
import { type Group, type Mesh, type MeshBasicMaterial, SRGBColorSpace, type Texture, TextureLoader } from "three";
import { contactShadowTexture } from "@/lib/supreme/materials";
import { clamp01, type SceneState } from "@/lib/supreme/sceneTimeline";

/**
 * The poses, one per stage, from the site's own mascot art (content/media.ts `mascots`, transparent cut-outs):
 * discover (the idea), analyse (the plan), transform (the drill), finish (the roller), complete (the full toolbox).
 */
const POSES = ["mascot-bulb-01", "mascot-plan-01", "mascot-drill-01", "mascot-roller-01", "mascot-tools-01"] as const;
/** Where it stands at each stage (x, z on the table), right of the building, clear of the folded front and sheets. */
const SPOTS: [number, number][] = [
  [9.6, 8.4], // 01 at the front corner, looking the building over
  [13.6, 6.2], // 02 on the elevation sheet
  [11.2, 5.8], // 03 beside the separated units
  [10.2, 7.4], // 04 by the homes
  [9.2, 8.6], // 05 beside the finished building
];
const ENTRY: [number, number] = [22, 14]; // walks in from the table's edge
const SIZE = 5; // the cut-out's square, in metres: the figure about a storey tall, well under the building
const FOOT = 41 / 640; // the art's transparent margin under the feet

let posesPromise: Promise<Texture[]> | null = null;
const loadPoses = () =>
  (posesPromise ??= Promise.all(
    POSES.map((p) =>
      new TextureLoader().loadAsync(`/media/${p}-640.webp`).then((t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      }),
    ),
  ));

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The Supreme mascot as a small companion on the worktable (the user's brief, 2026-10-07): the existing art as
 * upright cut-outs that always face the camera, with a soft contact shadow. It walks in, then from spot to spot with
 * the stages (scroll-driven, so it is exactly where the story is), changing pose halfway with a small step; at the end
 * a quiet hop of satisfaction. Kept small and to the side: the building is the hero.
 */
export function Mascot({ state }: { state: SceneState }) {
  const textures = use(loadPoses());
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const planes = useRef<(Mesh | null)[]>([]);
  const shadow = useRef<Mesh>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => invalidate(), [invalidate]); // a frame once the art has arrived

  useFrame(({ camera }) => {
    const g = root.current;
    if (!g) return;
    const n = SPOTS.length - 1;
    const w = Math.min(n, Math.max(0, state.walk));
    const i = Math.min(n - 1, Math.floor(w));
    const f = w - i; // 0 at a spot, 1 at the next
    const e = state.enter;
    // position: walking in from the edge, then between spots
    const [ax, az] = SPOTS[i];
    const [bx, bz] = SPOTS[i + 1];
    let x = ax + (bx - ax) * f;
    let z = az + (bz - az) * f;
    x = ENTRY[0] + (x - ENTRY[0]) * e;
    z = ENTRY[1] + (z - ENTRY[1]) * e;
    g.position.set(x, 0, z);
    // upright, facing the camera
    g.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);

    // a small step while it moves (never at rest), and a quiet hop when the eight are linked at the end
    const moving = Math.sin(Math.PI * f) + Math.sin(Math.PI * clamp01(e)) * (e < 1 ? 1 : 0);
    const steps = Math.abs(Math.sin(Math.PI * (f + e) * 3));
    const hop = Math.sin(Math.PI * clamp01((state.connect - 0.4) / 0.5)) * 0.35;
    if (body.current) {
      body.current.position.y = moving * steps * 0.16 + hop;
      body.current.rotation.z = moving * Math.sin(Math.PI * (f + e) * 3) * 0.035;
    }

    // the pose changes halfway between spots
    const swap = smooth(clamp01((f - 0.38) / 0.24));
    planes.current.forEach((p, k) => {
      if (!p) return;
      const o = (k === i ? 1 - swap : k === i + 1 ? swap : 0) * e;
      p.visible = o > 0.01;
      (p.material as MeshBasicMaterial).opacity = o;
    });
    if (shadow.current) {
      (shadow.current.material as MeshBasicMaterial).opacity = 0.32 * e;
      const lift = 1 - Math.min(0.25, (body.current?.position.y ?? 0) * 0.5);
      shadow.current.scale.set(2.3 * lift, 1.1 * lift, 1);
    }
  });

  return (
    <group ref={root} position={[ENTRY[0], 0, ENTRY[1]]} name="mascot">
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={contactShadowTexture()} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={body}>
        {textures.map((t, k) => (
          <mesh key={POSES[k]} ref={(el) => void (planes.current[k] = el)} position={[0, SIZE * (0.5 - FOOT), 0]} visible={false} renderOrder={2}>
            <planeGeometry args={[SIZE, SIZE]} />
            <meshBasicMaterial map={t} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
