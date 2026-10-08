"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshToonMaterial } from "three";
import { HOUSE, UNIT, WINDOW } from "@/lib/supreme/buildingStates";
import { color, paperTexture, toonSteps } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { DrawnLine, Label, type V3 } from "./parts";

const { width: W, depth: D, wall: T } = HOUSE;
const C = UNIT.core / 2; // the core's half-width

/** A door swing: the leaf and its quarter arc, in plan (x, z), hinge at (hx, hz). */
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
 * The plan of a typical floor (03 redevelop), drawn on a sheet on the table to the left of the building: the outer
 * walls, the core between the two apartments, each apartment's bathroom and bedroom wall, the entrance doors, window
 * ticks and the two apartments' numbers; and the building's footprint on the site plan around it. Everything draws on
 * with the state; at the end only a trace stays.
 */
export function FloorPlan({ state }: { state: SceneState }) {
  const sheet = { x: -14.6, z: 1.8, w: 9, h: 10.6, rot: 0.1 };
  const k = 0.62; // plan scale on the sheet
  const p = (x: number, z: number): V3 => [x * k, 0, z * k];
  const draw = () => state.plan;
  const paper = useMemo(() => ({ map: paperTexture(), color: color("--bg") }), []);
  // the sheet leaves the desk at the end (state.sheets), before the canal row rises where it lay
  const sheetMat = useRef<MeshToonMaterial>(null);
  const sheetMesh = useRef<Group>(null);
  useFrame(() => {
    if (sheetMat.current) sheetMat.current.opacity = state.sheets;
    if (sheetMesh.current) sheetMesh.current.visible = state.sheets > 0.01;
  });

  const rect = (x0: number, z0: number, x1: number, z1: number): V3[] => [p(x0, z0), p(x1, z0), p(x1, z1), p(x0, z1), p(x0, z0)];
  const outer = rect(-W / 2, -D / 2, W / 2, D / 2);
  const inner = rect(-W / 2 + T, -D / 2 + T, W / 2 - T, D / 2 - T);
  const zi = D / 2 - T;
  // the apartments' party walls either side of the core, the shaft, and per apartment (mirrored) bathroom and bedroom wall
  const core: V3[][] = [
    [p(-C, -zi), p(-C, zi)],
    [p(C, -zi), p(C, zi)],
    rect(-C + 0.1, -zi, C - 0.1, -zi + 3.4),
  ];
  const perSide = (s: 1 | -1): V3[][] => {
    const x = (v: number) => s * v; // v measured outwards from the core
    return [
      rect(x(C), -2.05, x(C + 1.9), 0.25), // bathroom
      [p(x(C + 2.25), -2.4), p(x(W / 2 - T), -2.4)], // bedroom wall
    ];
  };
  const walls = [...core, ...perSide(-1), ...perSide(1)];
  const doors = [door(-C * k, 3.2 * k, 0.8 * k, Math.PI / 2), door(C * k, 3.2 * k, 0.8 * k, 0)]; // each entrance off the landing
  const ticks: V3[][] = WINDOW.columns.flatMap((x) => [
    [p(x - WINDOW.width / 2, D / 2 - T / 2), p(x + WINDOW.width / 2, D / 2 - T / 2)],
    [p(x - WINDOW.width / 2, -D / 2 + T / 2), p(x + WINDOW.width / 2, -D / 2 + T / 2)],
  ]);
  const grid: V3[][] = [-C - UNIT.width / 2, 0, C + UNIT.width / 2].map((x) => [p(x, -D / 2 - 0.9), p(x, D / 2 + 0.9)]);

  // on the site plan around the building: its footprint
  const foot: V3[] = [[-W / 2 - 0.25, 0, -D / 2 - 0.25], [W / 2 + 0.25, 0, -D / 2 - 0.25], [W / 2 + 0.25, 0, D / 2 + 0.25], [-W / 2 - 0.25, 0, D / 2 + 0.25], [-W / 2 - 0.25, 0, -D / 2 - 0.25]];

  const all = [outer, inner, ...walls, ...doors, ...ticks];
  const unitLabel = (s: 1 | -1) => p(s * (C + UNIT.width / 2), 1.6);
  return (
    <group name="plan">
      <group position={[sheet.x, 0.02, sheet.z]} rotation={[0, sheet.rot, 0]}>
        <mesh ref={sheetMesh} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[sheet.w, sheet.h]} />
          <meshToonMaterial ref={sheetMat} gradientMap={toonSteps()} map={paper.map} color={paper.color} transparent />
        </mesh>
        <group position={[0, 0.012, 0]}>
          {grid.map((g, i) => (
            <DrawnLine key={`g${i}`} points={g} tone="--scene-teal" draw={draw} fade={() => 0.45} width={0.6} />
          ))}
          {all.map((pts, i) => (
            <DrawnLine key={i} points={pts} draw={() => Math.min(1, Math.max(0, (state.plan - (i / all.length) * 0.5) / 0.5))} width={i < 2 ? 1.6 : 1} />
          ))}
          {/* the lines on the sheet go with it */}
          <Label text="03" position={unitLabel(-1)} rotation={[-Math.PI / 2, 0, 0]} size={0.6} tone="--scene-teal" show={() => Math.max(0, state.plan * 2 - 1)} />
          <Label text="04" position={unitLabel(1)} rotation={[-Math.PI / 2, 0, 0]} size={0.6} tone="--scene-teal" show={() => Math.max(0, state.plan * 2 - 1)} />
          <Label text="1e verdieping 1:100" position={[0, 0, sheet.h / 2 - 0.8]} rotation={[-Math.PI / 2, 0, 0]} size={0.36} show={() => state.plan} />
        </group>
      </group>
      <group position={[0, 0.03, 0]}>
        <DrawnLine points={foot} tone="--scene-teal" draw={draw} fade={() => 0.4 + 0.6 * state.overlays} width={1} />
      </group>
    </group>
  );
}
