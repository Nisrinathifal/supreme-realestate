"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, EdgesGeometry, ExtrudeGeometry, type Group, type InstancedMesh, Object3D, Shape } from "three";
import { HOUSE } from "@/lib/supreme/buildingStates";
import { brickTexture, color, edgeMaterial, toon } from "@/lib/supreme/materials";
import { clamp01, type SceneState } from "@/lib/supreme/sceneTimeline";

type House = { w: number; floors: number; gable: "stepped" | "neck" | "bell"; tone: "brick" | "old" | "concrete" | "oak"; x: number };
const DEPTH = 8;
const GAP = 0.3;
const FH = HOUSE.floorHeight;

/** The neighbours, three a side, left to right, each its own width, height, gable and tone, so the row reads as a street. */
function layout(): House[] {
  const left: Omit<House, "x">[] = [
    { w: 5.6, floors: 4, gable: "neck", tone: "concrete" },
    { w: 6.4, floors: 3, gable: "stepped", tone: "old" },
    { w: 5.2, floors: 4, gable: "bell", tone: "brick" },
  ];
  const right: Omit<House, "x">[] = [
    { w: 6.0, floors: 3, gable: "bell", tone: "oak" },
    { w: 5.4, floors: 4, gable: "stepped", tone: "concrete" },
    { w: 6.6, floors: 3, gable: "neck", tone: "brick" },
  ];
  const out: House[] = [];
  let x = -HOUSE.width / 2 - GAP;
  for (const h of left) { out.push({ ...h, x: x - h.w / 2 }); x -= h.w + GAP; }
  x = HOUSE.width / 2 + GAP;
  for (const h of right) { out.push({ ...h, x: x + h.w / 2 }); x += h.w + GAP; }
  return out;
}

/** A façade with its gable, as a shape in its own plane (x, y), foot at 0. */
function facade(h: House) {
  const half = h.w / 2, top = h.floors * FH;
  const s = new Shape();
  s.moveTo(-half, 0);
  s.lineTo(half, 0);
  s.lineTo(half, top);
  if (h.gable === "stepped") {
    const steps = 3, stepW = (half - 0.8) / steps, stepH = 0.9;
    for (let i = 0; i < steps; i++) { s.lineTo(half - i * stepW, top + (i + 1) * stepH); s.lineTo(half - (i + 1) * stepW, top + (i + 1) * stepH); }
    s.lineTo(0.8, top + steps * stepH + 0.7); s.lineTo(-0.8, top + steps * stepH + 0.7);
    for (let i = steps - 1; i >= 0; i--) { s.lineTo(-half + (i + 1) * stepW, top + (i + 1) * stepH); s.lineTo(-half + i * stepW, top + (i + 1) * stepH); }
  } else if (h.gable === "neck") {
    s.lineTo(half, top + 0.6); s.lineTo(1.1, top + 0.6); s.lineTo(1.1, top + 2.6); s.lineTo(0.6, top + 3.1); s.lineTo(-0.6, top + 3.1); s.lineTo(-1.1, top + 2.6); s.lineTo(-1.1, top + 0.6); s.lineTo(-half, top + 0.6);
  } else {
    s.lineTo(half, top + 0.5); s.quadraticCurveTo(half - 0.4, top + 1.6, 1.4, top + 2.1); s.quadraticCurveTo(0, top + 3.4, -1.4, top + 2.1); s.quadraticCurveTo(-half + 0.4, top + 1.6, -half, top + 0.5);
  }
  s.lineTo(-half, 0);
  return s;
}

function makeKit() {
  const brick = brickTexture().clone();
  brick.repeat.set(0.6, 0.6);
  brick.needsUpdate = true;
  const tones = { brick: color("--scene-brick"), old: color("--scene-brick-old"), concrete: color("--scene-concrete"), oak: color("--scene-oak") };
  const houses = layout().map((h) => {
    const shape = facade(h);
    const body = new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false });
    body.translate(0, 0, -DEPTH + HOUSE.depth / 2); // the front in line with the building's front
    const windows: [number, number][] = [];
    const cols = h.w > 6 ? [-1.8, 0, 1.8] : [-1.3, 1.3];
    for (let f = 0; f < h.floors; f++) for (const cx of cols) windows.push([cx, f * FH + 1.75]);
    return { h, body, edges: new EdgesGeometry(body, 25), material: toon({ map: brick, color: tones[h.tone] }), windows };
  });
  const pane = new BoxGeometry(1.1, 1.7, 0.08);
  const glass = toon({ color: color("--scene-graphite"), emissive: color("--window-light"), emissiveIntensity: 0 });
  return { houses, pane, glass, roof: toon({ color: color("--scene-graphite") }), edge: edgeMaterial(), dummy: new Object3D() };
}
let kit: ReturnType<typeof makeKit> | null = null;
const getKit = () => (kit ??= makeKit());

/**
 * The canal row (owner, 2026-10-08): at the end the building stands among its neighbours, as on an Amsterdam canal.
 * Six houses, three a side, each with its own width, floors, gable (stepped, neck, bell) and brick tone, with drawn
 * edges and dark windows that warm with the building's light. They rise out of the desk one after another, from the
 * building outwards, with `state.row`.
 */
export function CanalRow({ state }: { state: SceneState }) {
  const groups = useRef<(Group | null)[]>([]);
  const panes = useRef<(InstancedMesh | null)[]>([]);
  const k = useMemo(getKit, []);

  useFrame(() => {
    const { houses, dummy, glass } = getKit();
    houses.forEach(({ h, windows }, i) => {
      const order = Math.floor(i % 3); // distance from the building, either side
      const t = clamp01(state.row * 1.6 - order * 0.3);
      const g = groups.current[i];
      if (g) { g.visible = t > 0.001; g.scale.y = Math.max(0.0001, t); }
      const p = panes.current[i];
      if (p && !p.userData.set) {
        windows.forEach(([x, y], j) => { dummy.position.set(x, y, HOUSE.depth / 2 + 0.03); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); p.setMatrixAt(j, dummy.matrix); });
        p.instanceMatrix.needsUpdate = true;
        p.userData.set = true;
      }
    });
    glass.emissiveIntensity = state.lights * (0.2 + 0.5 * state.warm) * 0.8;
  });

  return (
    <group name="row">
      {k.houses.map(({ h, body, edges, material, windows }, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} position={[h.x, 0, 0]} visible={false}>
          <mesh geometry={body} material={material} castShadow receiveShadow />
          <lineSegments geometry={edges} material={k.edge} />
          <instancedMesh ref={(el) => void (panes.current[i] = el)} args={[k.pane, k.glass, windows.length]} />
        </group>
      ))}
    </group>
  );
}
