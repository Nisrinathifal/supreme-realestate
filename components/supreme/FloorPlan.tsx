"use client";

import { useMemo } from "react";
import { HOUSE, WINDOW } from "@/lib/supreme/buildingStates";
import { color, paperTexture } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { DrawnLine, Label, type V3 } from "./parts";

const { width: W, depth: D, wall: T } = HOUSE;

/** A door swing: the leaf and its quarter arc, in plan (x, z), hinge at (hx, hz), opening towards (dx, dz). */
function door(hx: number, hz: number, r: number, start: number): V3[] {
  const pts: V3[] = [[hx, 0, hz]];
  for (let i = 0; i <= 10; i++) {
    const a = start + (i / 10) * (Math.PI / 2);
    pts.push([hx + Math.cos(a) * r, 0, hz + Math.sin(a) * r]);
  }
  pts.push([hx, 0, hz]);
  return pts;
}

/**
 * The floor plan of a typical upper floor (03 redevelop), drawn on a sheet on the table to the left of the house, and
 * the house's footprint with a quay line drawn on the site plan around it. Walls, the new partitions, door swings,
 * window ticks and a light grid draw on with the state; at the end only a trace of them stays.
 */
export function FloorPlan({ state }: { state: SceneState }) {
  const sheet = { x: -15.5, z: 4, w: 8.4, h: 10.6, rot: 0.1 };
  const k = 0.95; // plan scale on the sheet
  const p = (x: number, z: number): V3 => [x * k, 0, z * k];
  const draw = () => state.plan;
  const paper = useMemo(() => ({ map: paperTexture(), color: color("--bg") }), []);

  const outer: V3[] = [p(-W / 2, -D / 2), p(W / 2, -D / 2), p(W / 2, D / 2), p(-W / 2, D / 2), p(-W / 2, -D / 2)];
  const inner: V3[] = [p(-W / 2 + T, -D / 2 + T), p(W / 2 - T, -D / 2 + T), p(W / 2 - T, D / 2 - T), p(-W / 2 + T, D / 2 - T), p(-W / 2 + T, -D / 2 + T)];
  const walls: V3[][] = [
    [p(0.9, -D / 2 + T), p(0.9, -0.1)],
    [p(0.8, 0), p(W / 2 - T, 0)],
  ];
  const doors = [door(0.9 * k, -0.1 * k, 0.8 * k, Math.PI / 2), door(-W / 2 * k + T * k + 0.1, D / 2 * k - T * k, 0.8 * k, -Math.PI / 2)];
  const ticks: V3[][] = WINDOW.columns.flatMap((x) => [
    [p(x - WINDOW.width / 2, D / 2 - T / 2), p(x + WINDOW.width / 2, D / 2 - T / 2)],
    [p(x - WINDOW.width / 2, -D / 2 + T / 2), p(x + WINDOW.width / 2, -D / 2 + T / 2)],
  ]);
  const grid: V3[][] = [-2, 0, 2].map((x) => [p(x, -D / 2 - 0.8), p(x, D / 2 + 0.8)]);

  // on the site plan around the house: its footprint, the quay, the canal edge
  const foot: V3[] = [[-W / 2 - 0.25, 0, -D / 2 - 0.25], [W / 2 + 0.25, 0, -D / 2 - 0.25], [W / 2 + 0.25, 0, D / 2 + 0.25], [-W / 2 - 0.25, 0, D / 2 + 0.25], [-W / 2 - 0.25, 0, -D / 2 - 0.25]];
  const quay: V3[] = [[-24, 0, D / 2 + 4.2], [24, 0, D / 2 + 4.2]];

  const all = [outer, inner, ...walls, ...doors, ...ticks];
  return (
    <group>
      <group position={[sheet.x, 0.02, sheet.z]} rotation={[0, sheet.rot, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[sheet.w, sheet.h]} />
          <meshStandardMaterial map={paper.map} color={paper.color} roughness={1} />
        </mesh>
        <group position={[0, 0.012, 0]}>
          {grid.map((g, i) => (
            <DrawnLine key={`g${i}`} points={g} tone="--scene-teal" draw={draw} fade={() => 0.45} width={0.6} />
          ))}
          {all.map((pts, i) => (
            <DrawnLine key={i} points={pts} draw={() => Math.min(1, Math.max(0, (state.plan - (i / all.length) * 0.5) / 0.5))} width={i < 2 ? 1.6 : 1} />
          ))}
          <Label text="2e verdieping 1:50" position={[0, 0, sheet.h / 2 - 0.8]} rotation={[-Math.PI / 2, 0, 0]} size={0.36} show={() => state.plan} />
        </group>
      </group>
      <group position={[0, 0.03, 0]}>
        <DrawnLine points={foot} tone="--scene-teal" draw={draw} fade={() => 0.4 + 0.6 * state.overlays} width={1} />
        <DrawnLine points={quay} draw={() => Math.max(state.plan, 1 - state.overlays)} fade={() => 0.55} width={1.2} />
      </group>
    </group>
  );
}
