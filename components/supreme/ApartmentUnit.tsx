"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { BoxGeometry, EdgesGeometry, type Group, LineBasicMaterial, type LineSegments, type Mesh, type PointLight } from "three";
import { type Apartment, HOUSE, UNIT, WINDOW } from "@/lib/supreme/buildingStates";
import { color, concreteTexture, edgeMaterial, type SceneMaterial, toon, woodTexture } from "@/lib/supreme/materials";
import { clamp01, staggered, type SceneState } from "@/lib/supreme/sceneTimeline";
import { frameGeometry } from "./ExistingBuilding";
import { Label } from "./parts";

const { floorHeight: FH, slab: S } = HOUSE;
const UW = UNIT.width;
const UD = UNIT.depth;
const H = FH - S; // room height
/** The two front windows of a unit, in its own (mirrored) plane: x from the unit's centre, + towards the core. */
const WINDOWS = [-1.1, 1.6];

type Kind = "white" | "ink" | "teal" | "oak";
type Item = { size: [number, number, number]; pos: [number, number, number]; kind: Kind };

/**
 * One apartment's rooms, in the unit's own space: origin at the centre of its floor slab's underside, +x towards the
 * core (right-hand units are mirrored), +z to the front. `rooms` form first (bathroom and kitchen volumes, the
 * bedroom wall), then the furniture as quiet silhouettes.
 */
const ROOMS: Item[] = [
  { size: [1.9, 2.4, 2.3], pos: [1.45, S + 1.2, -0.9], kind: "white" }, // bathroom
  { size: [2.9, 2.5, 0.1], pos: [-0.95, S + 1.25, -2.4], kind: "white" }, // bedroom wall
  { size: [0.62, 0.9, 2.6], pos: [2.09, S + 0.45, 1.75], kind: "white" }, // kitchen run
  { size: [0.66, 0.05, 2.65], pos: [2.09, S + 0.92, 1.75], kind: "ink" }, // worktop
  { size: [0.62, 2.2, 0.9], pos: [2.09, S + 1.1, 3.6], kind: "oak" }, // tall cupboards
  { size: [1.4, 0.9, 0.8], pos: [0.55, S + 0.45, 1.9], kind: "white" }, // island
];
const FURNITURE: Item[] = [
  { size: [0.9, 0.42, 2.2], pos: [-1.9, S + 0.21, 2.5], kind: "teal" }, // sofa
  { size: [0.22, 0.42, 2.2], pos: [-2.25, S + 0.6, 2.5], kind: "teal" },
  { size: [0.7, 0.3, 1.0], pos: [-0.95, S + 0.15, 2.5], kind: "oak" }, // low table
  { size: [1.4, 0.05, 0.85], pos: [-0.7, S + 0.75, 0.2], kind: "oak" }, // dining table
  { size: [1.6, 0.45, 2.0], pos: [-1.2, S + 0.23, -3.5], kind: "white" }, // bed
  { size: [1.6, 0.8, 0.1], pos: [-1.2, S + 0.6, -4.55], kind: "oak" },
  { size: [0.6, 2.1, 1.4], pos: [1.95, S + 1.05, -3.6], kind: "white" }, // wardrobe
];

/** The materials of one unit (each unit fades, lights and colours on its own) and the geometry they all share. */
function makeShared() {
  const box = new BoxGeometry(1, 1, 1);
  const volume = new BoxGeometry(UW - 0.04, H - 0.04, UD - 0.04);
  return { box, volume, edges: new EdgesGeometry(volume), pane: new BoxGeometry(1, 1, 0.02), frame: frameGeometry(), slab: toon({ map: concreteTexture(), color: color("--scene-concrete") }), slabEdges: new EdgesGeometry(new BoxGeometry(UW, S, UD)), edge: edgeMaterial() };
}
let shared: ReturnType<typeof makeShared> | null = null;
const getShared = () => (shared ??= makeShared());

function makeUnitKit() {
  const wood = woodTexture().clone();
  wood.repeat.set(1.4, 2.6);
  wood.needsUpdate = true;
  const ghost = color("--bg");
  const real: Record<Kind, ReturnType<typeof color>> = { white: color("--bg"), ink: color("--ink"), teal: color("--scene-teal"), oak: color("--scene-oak") };
  const warm = color("--window-light");
  // every surface of the home can take a little of its lamp's warmth (emissive), so the light reads by day too
  const item = (k: Kind) => toon({ color: ghost.clone(), map: k === "oak" ? wood : null, emissive: warm, emissiveIntensity: 0 });
  return {
    ghost,
    real,
    oak: color("--scene-oak"),
    volume: toon({ color: color("--bg"), transparent: true, opacity: 0, depthWrite: false }),
    edges: new LineBasicMaterial({ color: color("--scene-teal"), transparent: true, opacity: 0, depthWrite: false }),
    floor: toon({ map: wood, color: ghost.clone(), emissive: warm, emissiveIntensity: 0 }),
    items: { white: item("white"), ink: item("ink"), teal: item("teal"), oak: item("oak") } as Record<Kind, SceneMaterial>,
    frame: toon({ color: color("--bg") }),
    glass: toon({ color: color("--alt"), transparent: true, opacity: 0.16, emissive: color("--window-light"), emissiveIntensity: 0, depthWrite: false }),
    pendant: toon({ color: color("--bg"), emissive: color("--window-light"), emissiveIntensity: 0 }),
    warm,
  };
}
const unitKits = new Map<number, ReturnType<typeof makeUnitKit>>();
const getUnitKit = (i: number) => {
  let k = unitKits.get(i);
  if (!k) unitKits.set(i, (k = makeUnitKit()));
  return k;
};

/** Grows an item up from its floor (scale y), hidden while it has no height. */
function grow(mesh: Mesh | undefined, it: Item, k: number) {
  if (!mesh) return;
  mesh.visible = k > 0.01;
  mesh.scale.set(it.size[0], it.size[1] * k + 0.0001, it.size[2]);
  mesh.position.y = S + (it.pos[1] - S) * k;
}

/**
 * One of the eight apartments (SCENE-3D.md §2), the same component for all eight: a physical volume that stands in
 * the building, shows through the see-through shell as a ghost (potential), separates from the others and carries its
 * number (redevelop), then opens up into a finished home: oak floor, bathroom and kitchen volumes, a bedroom wall,
 * front windows, furniture silhouettes and a warm pendant light (homes), and finally returns to its place in the one
 * building (value). Position, opacity, scale, materials, light and reveal are all read from the scene state, each
 * unit a little after the one before (01 → 08).
 */
export function ApartmentUnit({ apartment, state, lite = false }: { apartment: Apartment; state: SceneState; lite?: boolean }) {
  const { index, side, base, apart, floor } = apartment;
  const root = useRef<Group>(null);
  const volume = useRef<Mesh>(null);
  const edges = useRef<LineSegments>(null);
  const floorPlane = useRef<Mesh>(null);
  const rooms = useRef<Mesh[]>([]);
  const furniture = useRef<Mesh[]>([]);
  const frames = useRef<Mesh[]>([]);
  const panes = useRef<Mesh[]>([]);
  const pendant = useRef<Mesh>(null);
  const lamp = useRef<PointLight>(null);

  const g = getShared();
  const u = getUnitKit(index);

  useFrame(() => {
    const s = state;
    const k = getUnitKit(index);
    // where it stands: in the building, or apart from the others
    if (root.current) root.current.position.set(base[0] + apart[0] * s.split, base[1] + apart[1] * s.split, base[2] + apart[2] * s.split);

    const home = staggered(s.homes, index);
    const inside = staggered(s.interior, index);
    const light = staggered(s.lights, index);

    // the volume: a ghost inside the see-through shell, a solid block once apart, dissolving as the home forms
    const solid = clamp01(s.split * 1.6);
    const op = s.units * (0.42 + 0.53 * solid) * (1 - 0.95 * home);
    k.volume.opacity = op;
    if (volume.current) volume.current.visible = op > 0.005;
    k.edges.opacity = s.structure * (0.85 - 0.45 * home) * (1 - 0.35 * s.warm);
    if (edges.current) edges.current.visible = k.edges.opacity > 0.005;

    // the home: floor first, then the rooms one after another, the windows, then furniture
    if (floorPlane.current) floorPlane.current.visible = home > 0.01;
    k.floor.color.lerpColors(k.ghost, k.oak, inside);
    ROOMS.forEach((it, j) => grow(rooms.current[j], it, clamp01(home * 1.8 - j * 0.12)));
    FURNITURE.forEach((it, j) => grow(furniture.current[j], it, clamp01(inside * 1.7 - j * 0.1)));
    frames.current.forEach((f, j) => {
      const w = clamp01(home * 1.6 - 0.4 - j * 0.15);
      f.visible = w > 0.01;
      f.scale.y = (floor === 0 ? WINDOW.groundHeight : WINDOW.height) * w + 0.0001;
    });
    panes.current.forEach((p, j) => {
      p.visible = frames.current[j]?.visible ?? false;
      p.scale.y = frames.current[j]?.scale.y ?? 0.0001;
    });
    // the pale design model takes its real colours with the furniture
    (Object.keys(k.items) as Kind[]).forEach((kind) => k.items[kind].color.lerpColors(k.ghost, k.real[kind], inside));

    // warm light
    const glow = light * (lite ? 0.18 + 0.16 * s.warm : 0.1 + 0.12 * s.warm); // without lamps (lite) the surfaces carry more of it
    k.floor.emissiveIntensity = glow;
    k.items.white.emissiveIntensity = glow;
    k.items.oak.emissiveIntensity = glow * 0.6;
    k.glass.emissiveIntensity = light * (0.35 + 0.5 * s.warm);
    k.pendant.emissiveIntensity = light * 1.6;
    if (pendant.current) pendant.current.visible = inside > 0.01;
    if (lamp.current) lamp.current.intensity = light * (3 + 4 * s.warm);
  });

  const wh = floor === 0 ? WINDOW.groundHeight : WINDOW.height;
  return (
    <group ref={root} position={base}>
      {/* the floor slab: part of the unit, so it travels with it */}
      <mesh position={[0, S / 2, 0]} material={g.slab} scale={[UW, S, UD]} geometry={g.box} castShadow receiveShadow />
      <lineSegments position={[0, S / 2, 0]} geometry={g.slabEdges} material={g.edge} />

      {/* the volume and its outline: the apartment as one physical block */}
      <mesh ref={volume} position={[0, S + H / 2, 0]} geometry={g.volume} material={u.volume} />
      <lineSegments ref={edges} position={[0, S + H / 2, 0]} geometry={g.edges} material={u.edges} />

      {/* the home, mirrored for the right-hand units so the kitchen and bathroom sit against the core */}
      <group scale={[-side, 1, 1]}>
        <mesh ref={floorPlane} position={[0, S + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={u.floor} receiveShadow>
          <planeGeometry args={[UW - 0.04, UD - 0.04]} />
        </mesh>
        {ROOMS.map((it, j) => (
          <mesh key={`r${j}`} ref={(el) => void (el && (rooms.current[j] = el))} geometry={g.box} material={u.items[it.kind]} position={it.pos} castShadow receiveShadow />
        ))}
        {FURNITURE.map((it, j) => (
          <mesh key={`f${j}`} ref={(el) => void (el && (furniture.current[j] = el))} geometry={g.box} material={u.items[it.kind]} position={it.pos} castShadow receiveShadow />
        ))}
        {WINDOWS.map((x, j) => (
          <group key={`w${j}`} position={[x, WINDOW.sill + wh / 2, UD / 2 - 0.06]}>
            <mesh ref={(el) => void (el && (frames.current[j] = el))} geometry={g.frame} material={u.frame} scale={[WINDOW.width, 0.0001, 1]} />
            <mesh ref={(el) => void (el && (panes.current[j] = el))} geometry={g.pane} material={u.glass} scale={[WINDOW.width, 0.0001, 1]} position={[0, 0, 0.03]} />
          </group>
        ))}
        <mesh ref={pendant} position={[-0.7, S + H - 0.65, 0.4]} material={u.pendant}>
          <sphereGeometry args={[0.15, 16, 12]} />
        </mesh>
        {lite ? null : <pointLight ref={lamp} position={[-0.7, S + H - 0.9, 0.6]} color={u.warm} intensity={0} distance={7.5} decay={1.6} />}
      </group>

      {/* its number, on the front between its two windows */}
      <Label text={String(index + 1).padStart(2, "0")} position={[-side * 0.25, S + 1.5, UD / 2 + 0.05]} size={0.72} show={() => state.numbers} />
    </group>
  );
}
