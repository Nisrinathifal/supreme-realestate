"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ComponentRef, useMemo, useRef } from "react";
import { DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { labelTexture, tokens, type Token } from "@/lib/supreme/materials";

export type V3 = [number, number, number];

type DashMaterial = { dashOffset: number; dashSize: number; gapSize: number; opacity: number };

/**
 * A line that draws itself on: Line2 dashed with one dash as long as the whole line, offset by the progress, so
 * 0 shows nothing and 1 the full line. `draw` and `fade` are read every frame from the scene state.
 */
export function DrawnLine({ points, tone = "--scene-graphite", width = 1.6, draw, fade }: { points: V3[]; tone?: Token; width?: number; draw: () => number; fade?: () => number }) {
  const ref = useRef<ComponentRef<typeof Line>>(null);
  const length = useMemo(() => {
    let l = 0;
    for (let i = 1; i < points.length; i++) l += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1], points[i][2] - points[i - 1][2]);
    return Math.max(l, 0.0001);
  }, [points]);
  useFrame(() => {
    const line = ref.current;
    if (!line) return;
    const p = Math.min(1, Math.max(0, draw()));
    const o = fade ? fade() : 1;
    line.visible = p > 0.002 && o > 0.01;
    const m = line.material as unknown as DashMaterial;
    m.dashSize = length;
    m.gapSize = length;
    m.dashOffset = length * (1 - p);
    m.opacity = o;
  });
  return <Line ref={ref} points={points} color={tokens()[tone]} lineWidth={width} dashed dashSize={length} gapSize={length} transparent depthWrite={false} />;
}

/** A drawn annotation ("+12.00"): text on a transparent plane, `size` units tall, facing +z unless rotated. */
export function Label({ text, position, rotation = [0, 0, 0], size = 0.5, tone = "--scene-graphite", show }: { text: string; position: V3; rotation?: V3; size?: number; tone?: Token; show: () => number }) {
  const ref = useRef<Mesh>(null);
  const { texture, aspect } = useMemo(() => labelTexture(text, tone), [text, tone]);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = Math.min(1, Math.max(0, show()));
    mesh.visible = o > 0.01;
    (mesh.material as MeshBasicMaterial).opacity = o;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <planeGeometry args={[size * aspect, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/** A dimension line with end ticks and a label in the middle, all drawn on together. */
export function Dimension({ from, to, label, tick = 0.35, normal = [0, 0, 1], labelOffset = [0, 0, 0], labelRotation, draw, fade, tone = "--scene-draw" }: { from: V3; to: V3; label: string; tick?: number; normal?: V3; labelOffset?: V3; labelRotation?: V3; draw: () => number; fade?: () => number; tone?: Token }) {
  const t = (p: V3): [V3, V3] => [
    [p[0] - normal[0] * tick, p[1] - normal[1] * tick, p[2] - normal[2] * tick],
    [p[0] + normal[0] * tick, p[1] + normal[1] * tick, p[2] + normal[2] * tick],
  ];
  const mid: V3 = [(from[0] + to[0]) / 2 + labelOffset[0], (from[1] + to[1]) / 2 + labelOffset[1], (from[2] + to[2]) / 2 + labelOffset[2]];
  const show = () => Math.max(0, draw() - 0.6) / 0.4 * (fade ? fade() : 1);
  return (
    <group>
      <DrawnLine points={[from, to]} draw={draw} fade={fade} tone={tone} />
      <DrawnLine points={t(from)} draw={() => draw() * 3} fade={fade} tone={tone} />
      <DrawnLine points={t(to)} draw={() => (draw() - 0.66) * 3} fade={fade} tone={tone} />
      <Label text={label} position={mid} rotation={labelRotation} size={0.6} tone={tone} show={show} />
    </group>
  );
}
