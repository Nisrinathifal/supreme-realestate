"use client";

import { useMemo } from "react";
import { gableOutline, HEIGHT, HOUSE, WINDOW, windowSlots } from "@/lib/supreme/buildingStates";
import { paperTexture, toonSteps } from "@/lib/supreme/materials";
import { color } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { Dimension, DrawnLine, Label, type V3 } from "./parts";

const { width: W, depth: D, floorHeight: FH, floors: N } = HOUSE;
const HALF = W / 2;

/** Drawn-on progress for one line among many: each starts a little after the one before. */
const stagger = (get: () => number, i: number, n: number, spread = 0.5) => () => Math.min(1, Math.max(0, (get() - (i / n) * spread) / (1 - spread)));

/**
 * The analysis of the existing building (02 potential), in two places: around the building itself (its outline, a line at
 * every floor level, the heights and the width dimensioned, the axis) and on an elevation sheet on the table (the
 * façade drawn in lines, its windows, a height dimension). Everything draws on with the state and fades with the
 * overlays at delivery.
 */
export function ArchitecturalDrawing({ state }: { state: SceneState }) {
  const fade = () => state.overlays;
  const zf = D / 2 + 0.6; // just in front of the façade
  const gable = useMemo(() => gableOutline(), []);

  // around the house
  const levels = useMemo(() => Array.from({ length: N + 1 }, (_, f) => f * FH), []);
  const outline: V3[] = useMemo(() => [[-HALF, 0, zf], ...gable.map(([x, y]) => [x, y, zf] as V3), [HALF, 0, zf], [-HALF, 0, zf]], [gable, zf]);

  // the elevation sheet: the façade at 1:2 on a sheet lying on the table to the right of the house
  const sheet = { x: 16.2, z: 3.2, w: 7.2, h: 10, rot: -0.12 };
  const k = 0.42; // drawing scale
  const oy = -sheet.h / 2 + 1.2; // façade foot on the sheet
  const toSheet = (x: number, y: number): V3 => [x * k, 0, -(oy + y * k)];
  const elevation: V3[] = useMemo(() => [toSheet(-HALF, 0), ...gable.map(([x, y]) => toSheet(x, y)), toSheet(HALF, 0), toSheet(-HALF, 0)], [gable]); // eslint-disable-line react-hooks/exhaustive-deps
  const windows = useMemo(
    () =>
      windowSlots()
        .filter((s) => s.face === "front")
        .map((s) => {
          const x0 = s.x - WINDOW.width / 2, x1 = s.x + WINDOW.width / 2, y0 = s.y - s.h / 2, y1 = s.y + s.h / 2;
          return [toSheet(x0, y0), toSheet(x1, y0), toSheet(x1, y1), toSheet(x0, y1), toSheet(x0, y0)];
        }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const paper = useMemo(() => ({ map: paperTexture(), color: color("--bg") }), []);

  return (
    <group>
      {/* around the house */}
      <DrawnLine points={outline} tone="--scene-teal" draw={() => state.lines} fade={fade} width={2.2} />
      {levels.map((y, i) => (
        <DrawnLine key={y} points={[[-HALF - 1.2, y, zf], [HALF + 1.2, y, zf]]} tone="--scene-teal" draw={stagger(() => state.lines, i, levels.length)} fade={fade} />
      ))}
      {levels.slice(1).map((y, i) => (
        <Label key={y} text={`+${y.toFixed(2)}`} position={[-HALF - 2.6, y + 0.05, zf]} size={0.6} tone="--scene-teal" show={() => Math.max(0, state.dims * 1.3 - i * 0.15) * fade()} />
      ))}
      <Dimension from={[HALF + 1.6, 0, zf]} to={[HALF + 1.6, HEIGHT, zf]} label={`${HEIGHT.toFixed(2)}`} normal={[1, 0, 0]} labelOffset={[0.9, 0, 0]} draw={() => state.dims} fade={fade} />
      <Dimension from={[-HALF, -0.01, zf + 1.4]} to={[HALF, -0.01, zf + 1.4]} label={`${W.toFixed(2)}`} normal={[0, 0, 1]} labelOffset={[0, 0.02, 0.7]} labelRotation={[-Math.PI / 2, 0, 0]} draw={() => state.dims} fade={fade} />
      <Dimension from={[HALF + 1.4, -0.01, -D / 2]} to={[HALF + 1.4, -0.01, D / 2]} label={`${D.toFixed(2)}`} normal={[1, 0, 0]} labelOffset={[0.8, 0.02, 0]} labelRotation={[-Math.PI / 2, 0, -Math.PI / 2]} draw={() => state.dims} fade={fade} />
      <DrawnLine points={[[0, 0, zf], [0, HEIGHT + HOUSE.gableHeight + 1.2, zf]]} tone="--scene-teal" draw={() => state.lines} fade={() => fade() * 0.6} />

      {/* the elevation sheet */}
      <group position={[sheet.x, 0.02, sheet.z]} rotation={[0, sheet.rot, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[sheet.w, sheet.h]} />
          <meshToonMaterial gradientMap={toonSteps()} map={paper.map} color={paper.color} />
        </mesh>
        <group position={[0, 0.012, 0]}>
          <DrawnLine points={elevation} draw={() => state.elevation} width={1.2} />
          {windows.map((w, i) => (
            <DrawnLine key={i} points={w} draw={stagger(() => state.elevation, i, windows.length, 0.6)} width={0.9} />
          ))}
          {levels.map((y, i) => (
            <DrawnLine key={y} points={[toSheet(-HALF - 0.6, y), toSheet(HALF + 0.6, y)]} draw={stagger(() => state.elevation, i, levels.length)} width={0.6} fade={() => 0.5} />
          ))}
          <Label text="Voorgevel 1:100" position={[0, 0, sheet.h / 2 - 0.8]} rotation={[-Math.PI / 2, 0, 0]} size={0.36} show={() => state.elevation} />
        </group>
      </group>
    </group>
  );
}
