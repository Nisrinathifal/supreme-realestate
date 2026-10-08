"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { BoxGeometry, Color, EdgesGeometry, ExtrudeGeometry, type Group, type InstancedMesh, type Mesh, Object3D, Path, Shape } from "three";
import { gableOutline, HEIGHT, HOUSE, OPEN, WINDOW, windowSlots } from "@/lib/supreme/buildingStates";
import { brickTexture, color, concreteTexture, edgeMaterial, type SceneMaterial, toon } from "@/lib/supreme/materials";
import { clamp01, type SceneState } from "@/lib/supreme/sceneTimeline";

const { width: W, depth: D, wall: T, slab: S } = HOUSE;
const HALF = W / 2;

/** A façade: the wall up to the eaves plus the stepped gable, with the window openings cut out. */
function facadeGeometry(face: "front" | "back") {
  const shape = new Shape();
  shape.moveTo(-HALF, 0);
  shape.lineTo(HALF, 0);
  const g = gableOutline();
  for (let i = g.length - 1; i >= 0; i--) shape.lineTo(g[i][0], g[i][1]);
  shape.closePath();
  for (const w of windowSlots().filter((s) => s.face === face)) {
    const hole = new Path();
    hole.moveTo(w.x - WINDOW.width / 2, w.y - w.h / 2);
    hole.lineTo(w.x + WINDOW.width / 2, w.y - w.h / 2);
    hole.lineTo(w.x + WINDOW.width / 2, w.y + w.h / 2);
    hole.lineTo(w.x - WINDOW.width / 2, w.y + w.h / 2);
    hole.closePath();
    shape.holes.push(hole);
  }
  return new ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
}

/** A window frame of 1 × 1 (scaled per window): outer frame, a cross of mullions. Shared with the apartments. */
let frame: ExtrudeGeometry | null = null;
export function frameGeometry() {
  if (frame) return frame;
  const f = 0.09;
  const shape = new Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(-0.5, 0.5);
  shape.closePath();
  const panes: [number, number, number, number][] = [
    [-0.5 + f, -0.5 + f, -0.025, 0.1 - f / 2],
    [0.025, -0.5 + f, 0.5 - f, 0.1 - f / 2],
    [-0.5 + f, 0.1 + f / 2, -0.025, 0.5 - f],
    [0.025, 0.1 + f / 2, 0.5 - f, 0.5 - f],
  ];
  for (const [x0, y0, x1, y1] of panes) {
    const h = new Path();
    h.moveTo(x0, y0);
    h.lineTo(x1, y0);
    h.lineTo(x1, y1);
    h.lineTo(x0, y1);
    h.closePath();
    shape.holes.push(h);
  }
  return (frame = new ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }));
}

/** Materials, geometry and scratch objects of the shell: made once, outside React (they are mutated every frame). */
function makeKit() {
  const brickFace = brickTexture().clone();
  brickFace.repeat.set(0.5, 0.5);
  brickFace.needsUpdate = true;
  const brickSide = brickTexture().clone();
  brickSide.repeat.set(D / 2, (HEIGHT + 1) / 2);
  brickSide.needsUpdate = true;
  const m = {
    brickOld: color("--scene-brick-old"),
    brick: color("--scene-brick"),
    facade: toon({ map: brickFace, color: color("--scene-brick-old"), transparent: true }),
    side: toon({ map: brickSide, color: color("--scene-brick-old"), transparent: true }),
    roof: toon({ color: color("--scene-draw"), transparent: true }),
    slab: toon({ map: concreteTexture(), color: color("--scene-concrete"), transparent: true }),
    oldPane: toon({ color: color("--scene-graphite"), transparent: true }),
    frame: toon({ color: color("--bg") }),
    glass: toon({ color: color("--alt"), transparent: true, opacity: 0.38, emissive: color("--window-light"), emissiveIntensity: 0 }),
    edge: edgeMaterial(),
  };
  const roofShape = new Shape();
  roofShape.moveTo(-HALF, 0);
  roofShape.lineTo(HALF, 0);
  roofShape.lineTo(0, HOUSE.gableHeight * 0.8);
  roofShape.closePath();
  const front = facadeGeometry("front"), back = facadeGeometry("back");
  const side = new BoxGeometry(T, HEIGHT + 1, D - 2 * T);
  const roof = new ExtrudeGeometry(roofShape, { depth: D - 2 * T, bevelEnabled: false });
  const roofSlab = new BoxGeometry(W - 2 * T - 0.02, S, D - 2 * T - 0.02);
  const geo = {
    front,
    back,
    frame: frameGeometry(),
    pane: new BoxGeometry(1, 1, 0.02),
    side,
    roof,
    roofSlab,
    // the drawn edges of every part (illoca: a drawn model)
    edges: { front: new EdgesGeometry(front, 20), back: new EdgesGeometry(back, 20), side: new EdgesGeometry(side), roof: new EdgesGeometry(roof), roofSlab: new EdgesGeometry(roofSlab) },
  };
  return { m, geo, slots: windowSlots(), dummy: new Object3D(), tmp: new Color() };
}
let kit: ReturnType<typeof makeKit> | null = null;
const getKit = () => (kit ??= makeKit());
const faces = ["front", "back"] as const;

/** See-through without sorting trouble: a material stops writing depth once it is no longer opaque. */
function fade(mat: SceneMaterial, opacity: number) {
  mat.opacity = opacity;
  mat.depthWrite = opacity > 0.98;
}

/**
 * The existing building's shell (SCENE-3D.md §2): brick façades with the stepped gable and window openings, party
 * walls, the roof and its slab. What it holds (the core, the eight apartments) is BuildingStructure and
 * ApartmentUnit. Every part is its own object, moved and recoloured from the scene state each frame: aged → see-through
 * (potential) → opened up, the front folded down (redevelop) → closed again around the homes, cleaned, new windows.
 */
export function ExistingBuilding({ state }: { state: SceneState }) {
  const front = useRef<Group>(null);
  const back = useRef<Group>(null);
  const left = useRef<Mesh>(null);
  const right = useRef<Mesh>(null);
  const roof = useRef<Group>(null);
  const oldPanes = useRef<(InstancedMesh | null)[]>([]);
  const frames = useRef<(InstancedMesh | null)[]>([]);
  const glass = useRef<(InstancedMesh | null)[]>([]);

  const { m, geo, slots } = getKit();

  useFrame(() => {
    const { m, slots, dummy, tmp } = getKit();
    const s = state;
    const shell = s.openShell;
    // the front folds down onto the table like the wall of a model, hinged at its foot
    if (front.current) {
      const a = s.openFront * OPEN.front;
      front.current.rotation.x = a;
      front.current.position.set(0, Math.sin(a) * T, D / 2 - T + (1 - Math.cos(a)) * T);
    }
    if (back.current) back.current.position.z = -D / 2 - shell * OPEN.back;
    if (left.current) left.current.position.x = -HALF + T / 2 - shell * OPEN.sides;
    if (right.current) right.current.position.x = HALF - T / 2 + shell * OPEN.sides;
    if (roof.current) roof.current.position.y = shell * OPEN.roof;

    // potential: the shell turns see-through, so the floors and the eight units show inside
    const solid = 1 - 0.74 * s.xray;
    fade(m.facade, solid);
    fade(m.side, solid);
    fade(m.roof, 1 - 0.8 * s.xray);
    fade(m.slab, 1 - 0.8 * s.xray);
    m.edge.opacity = 0.55 - 0.35 * s.xray;

    // the brick: aged and greyed → cleaned
    tmp.lerpColors(m.brickOld, m.brick, s.clean);
    m.facade.color.copy(tmp);
    m.side.color.copy(tmp);

    // windows: the old ones go; the new ones are fitted one after another; glass glows warm at the end
    m.oldPane.opacity = s.oldWindows * 0.92 * (1 - 0.85 * s.xray);
    faces.forEach((face, fi) => {
      const list = slots.filter((w) => w.face === face);
      const fr = frames.current[fi];
      const gl = glass.current[fi];
      const op = oldPanes.current[fi];
      list.forEach((w, i) => {
        const k = clamp01(s.newWindows * 1.6 - (i / list.length) * 0.6);
        dummy.position.set(w.x, w.y, face === "front" ? T + 0.01 : -0.01);
        dummy.rotation.set(0, face === "front" ? 0 : Math.PI, 0);
        dummy.scale.set(WINDOW.width * (0.6 + 0.4 * k), w.h * k + 0.0001, 1);
        dummy.updateMatrix();
        fr?.setMatrixAt(i, dummy.matrix);
        dummy.position.set(w.x, w.y, T * 0.5);
        dummy.scale.set(WINDOW.width, w.h * k + 0.0001, 1);
        dummy.updateMatrix();
        gl?.setMatrixAt(i, dummy.matrix);
        dummy.scale.set(WINDOW.width, w.h, 1);
        dummy.updateMatrix();
        op?.setMatrixAt(i, dummy.matrix);
      });
      if (fr) fr.instanceMatrix.needsUpdate = true;
      if (gl) gl.instanceMatrix.needsUpdate = true;
      if (op) {
        op.instanceMatrix.needsUpdate = true;
        op.visible = s.oldWindows > 0.01;
      }
    });
    m.glass.emissiveIntensity = s.lights * (0.25 + 0.55 * s.warm);
  });

  return (
    <group name="shell">
      {/* façades, each carrying its windows */}
      {faces.map((face, fi) => (
        <group key={face} ref={face === "front" ? front : back} position={[0, 0, face === "front" ? D / 2 - T : -D / 2]}>
          <mesh geometry={face === "front" ? geo.front : geo.back} material={m.facade} castShadow receiveShadow />
          <lineSegments geometry={face === "front" ? geo.edges.front : geo.edges.back} material={m.edge} />
          <instancedMesh ref={(el) => void (frames.current[fi] = el)} args={[geo.frame, m.frame, slots.length / 2]} castShadow />
          <instancedMesh ref={(el) => void (glass.current[fi] = el)} args={[geo.pane, m.glass, slots.length / 2]} />
          <instancedMesh ref={(el) => void (oldPanes.current[fi] = el)} args={[geo.pane, m.oldPane, slots.length / 2]} />
        </group>
      ))}

      {/* party walls */}
      <mesh ref={left} position={[-HALF + T / 2, (HEIGHT + 1) / 2, 0]} geometry={geo.side} material={m.side} castShadow receiveShadow>
        <lineSegments geometry={geo.edges.side} material={m.edge} />
      </mesh>
      <mesh ref={right} position={[HALF - T / 2, (HEIGHT + 1) / 2, 0]} geometry={geo.side} material={m.side} castShadow receiveShadow>
        <lineSegments geometry={geo.edges.side} material={m.edge} />
      </mesh>

      {/* the roof: its slab, and a ridge running back from the gable */}
      <group ref={roof}>
        <mesh position={[0, HEIGHT + S / 2, 0]} geometry={geo.roofSlab} material={m.slab} castShadow receiveShadow>
          <lineSegments geometry={geo.edges.roofSlab} material={m.edge} />
        </mesh>
        <mesh position={[0, HEIGHT + S, -D / 2 + T]} geometry={geo.roof} material={m.roof} castShadow>
          <lineSegments geometry={geo.edges.roof} material={m.edge} />
        </mesh>
      </group>
    </group>
  );
}
