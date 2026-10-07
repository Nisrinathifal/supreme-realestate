"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { BoxGeometry, Color, ExtrudeGeometry, type Group, type InstancedMesh, type Mesh, MeshStandardMaterial, Object3D, type PointLight, Shape, Path } from "three";
import { gableOutline, HEIGHT, HOUSE, INTERIOR, OPEN, WINDOW, windowSlots } from "@/lib/supreme/buildingStates";
import { brickTexture, color, concreteTexture, woodTexture } from "@/lib/supreme/materials";
import { clamp01, type SceneState } from "@/lib/supreme/sceneTimeline";

const { width: W, depth: D, wall: T, floorHeight: FH, slab: S, floors: N } = HOUSE;
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
  const geo = new ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
  return geo;
}

/** A window frame of 1 × 1 (scaled per window): outer frame, a cross of mullions. */
function frameGeometry() {
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
  return new ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
}

type Item = { size: [number, number, number]; pos: [number, number, number]; kind: "oak" | "white" | "ink" | "teal"; group: "kitchen" | "furniture" };

/** The furniture of one floor (local to the floor's slab top, centred on the house). */
function furniture(kind: (typeof INTERIOR)[number]): Item[] {
  switch (kind) {
    case "kitchen":
      return [
        { size: [2.3, 0.9, 0.95], pos: [-0.6, 0.45, 0.6], kind: "white", group: "kitchen" },
        { size: [2.45, 0.06, 1.05], pos: [-0.6, 0.93, 0.6], kind: "ink", group: "kitchen" },
        { size: [4.2, 0.9, 0.62], pos: [-0.4, 0.45, -D / 2 + T + 0.36], kind: "white", group: "kitchen" },
        { size: [4.3, 0.05, 0.66], pos: [-0.4, 0.92, -D / 2 + T + 0.36], kind: "ink", group: "kitchen" },
        { size: [1.8, 0.05, 0.9], pos: [1.2, 0.75, 2.4], kind: "oak", group: "furniture" },
        { size: [0.1, 0.72, 0.1], pos: [0.4, 0.37, 2.0], kind: "ink", group: "furniture" },
        { size: [0.1, 0.72, 0.1], pos: [2.0, 0.37, 2.8], kind: "ink", group: "furniture" },
      ];
    case "living":
      return [
        { size: [2.4, 0.42, 0.95], pos: [-0.5, 0.21, -1.6], kind: "teal", group: "furniture" },
        { size: [2.4, 0.4, 0.22], pos: [-0.5, 0.6, -2.0], kind: "teal", group: "furniture" },
        { size: [1.1, 0.34, 0.7], pos: [-0.5, 0.17, -0.2], kind: "oak", group: "furniture" },
        { size: [3.0, 0.01, 2.2], pos: [-0.5, 0.01, -0.8], kind: "white", group: "furniture" },
        { size: [0.5, 1.6, 2.4], pos: [HALF - T - 0.3, 0.8, 1.6], kind: "oak", group: "furniture" },
      ];
    case "bedroom":
      return [
        { size: [1.9, 0.45, 2.1], pos: [-0.6, 0.23, -1.1], kind: "white", group: "furniture" },
        { size: [1.9, 0.8, 0.12], pos: [-0.6, 0.6, -2.2], kind: "oak", group: "furniture" },
        { size: [0.5, 0.45, 0.45], pos: [0.75, 0.23, -1.9], kind: "oak", group: "furniture" },
        { size: [1.6, 2.1, 0.6], pos: [1.6, 1.05, 2.6], kind: "white", group: "furniture" },
      ];
    default: // the ground floor: an open, lofty room
      return [
        { size: [3.2, 0.75, 1.0], pos: [-0.4, 0.38, 0.4], kind: "oak", group: "furniture" },
        { size: [0.12, 2.4, 3.0], pos: [-HALF + T + 0.12, 1.2, -1.6], kind: "white", group: "furniture" },
      ];
  }
}

/** Interior partitions of one floor (local), appear in redevelop. */
const partitions: { size: [number, number, number]; pos: [number, number, number] }[] = [
  { size: [0.12, FH - S, 3.2], pos: [0.9, (FH - S) / 2, -1.7] },
  { size: [2.2, FH - S, 0.12], pos: [1.9, (FH - S) / 2, 0.0] },
];

/**
 * The canal house (SCENE-3D.md §2): brick façades with the stepped gable and window openings, party walls, a roof,
 * five floor slabs, partitions, and an interior per floor. Every part is its own object and is moved and recoloured
 * from the scene state each frame: aged → opened up → designed → assembled → delivered.
 */
type HouseKit = ReturnType<typeof makeKit>;

/** Materials, geometry and scratch objects of the house: made once, outside React (they are mutated every frame). */
function makeKit() {
  const brickFace = brickTexture().clone();
  brickFace.repeat.set(0.5, 0.5);
  brickFace.needsUpdate = true;
  const brickSide = brickTexture().clone();
  brickSide.repeat.set(D / 2, (HEIGHT + 1) / 2);
  brickSide.needsUpdate = true;
  const wood = woodTexture().clone();
  wood.repeat.set(1.2, 1.2);
  wood.needsUpdate = true;
  const m = {
    brickOld: color("--scene-brick-old"),
    brick: color("--scene-brick"),
    ghost: color("--bg"),
    oak: color("--scene-oak"),
    ink: color("--ink"),
    teal: color("--scene-teal"),
    warm: color("--window-light"),
    facade: new MeshStandardMaterial({ map: brickFace, color: color("--scene-brick-old"), roughness: 0.92 }),
    side: new MeshStandardMaterial({ map: brickSide, color: color("--scene-brick-old"), roughness: 0.95 }),
    roof: new MeshStandardMaterial({ color: color("--scene-graphite"), roughness: 0.85 }),
    slab: new MeshStandardMaterial({ map: concreteTexture(), color: color("--scene-concrete"), roughness: 0.95 }),
    partition: new MeshStandardMaterial({ color: color("--bg"), roughness: 0.9, transparent: true, opacity: 0 }),
    oldPane: new MeshStandardMaterial({ color: color("--scene-graphite"), roughness: 0.4, metalness: 0.1, transparent: true }),
    frame: new MeshStandardMaterial({ color: color("--bg"), roughness: 0.6 }),
    glass: new MeshStandardMaterial({ color: color("--alt"), roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.38, emissive: color("--window-light"), emissiveIntensity: 0 }),
    floor: new MeshStandardMaterial({ map: wood, color: color("--bg"), roughness: 0.7, transparent: true, opacity: 0 }),
    pendant: new MeshStandardMaterial({ color: color("--bg"), emissive: color("--window-light"), emissiveIntensity: 0, transparent: true, opacity: 0 }),
  };
  // one material per interior item, so each can turn from the pale design model into its real colour
  const itemMaterials = INTERIOR.map((k) => furniture(k).map((it) => new MeshStandardMaterial({ map: it.kind === "oak" ? wood : null, color: m.ghost.clone(), roughness: it.kind === "ink" ? 0.5 : 0.75, transparent: true, opacity: 0 })));
  const roofShape = new Shape();
  roofShape.moveTo(-HALF, 0);
  roofShape.lineTo(HALF, 0);
  roofShape.lineTo(0, HOUSE.gableHeight * 0.82);
  roofShape.closePath();
  const geo = {
    front: facadeGeometry("front"),
    back: facadeGeometry("back"),
    frame: frameGeometry(),
    pane: new BoxGeometry(1, 1, 0.02),
    box: new BoxGeometry(1, 1, 1),
    roof: new ExtrudeGeometry(roofShape, { depth: D - 2 * T, bevelEnabled: false }),
  };
  return { m, itemMaterials, geo, slots: windowSlots(), dummy: new Object3D(), tmp: new Color() };
}
let kit: HouseKit | null = null;
const getKit = () => (kit ??= makeKit());
const faces = ["front", "back"] as const;

export function ExistingBuilding({ state }: { state: SceneState }) {
  const front = useRef<Group>(null);
  const back = useRef<Group>(null);
  const left = useRef<Mesh>(null);
  const right = useRef<Mesh>(null);
  const roof = useRef<Group>(null);
  const floors = useRef<(Group | null)[]>([]);
  const oldPanes = useRef<(InstancedMesh | null)[]>([]);
  const frames = useRef<(InstancedMesh | null)[]>([]);
  const glass = useRef<(InstancedMesh | null)[]>([]);
  const partitionsRef = useRef<Mesh[]>([]);
  const items = useRef<{ mesh: Mesh; item: Item; i: number }[]>([]);
  const pendants = useRef<Mesh[]>([]);
  const lamps = useRef<(PointLight | null)[]>([]);

  const { m, itemMaterials, geo, slots } = getKit();

  useFrame(() => {
    const { m, slots, dummy, tmp } = getKit();
    const s = state;
    const shell = s.openShell;
    // the shell opens: back, sides, roof, floors apart; the front comes off forward
    // the front folds down onto the table like the wall of a model, hinged at its foot, and stands up again at delivery
    if (front.current) {
      const a = s.openFront * OPEN.front;
      front.current.rotation.x = a;
      front.current.position.set(0, Math.sin(a) * T, D / 2 - T + (1 - Math.cos(a)) * T);
    }
    if (back.current) back.current.position.z = -D / 2 - shell * OPEN.back;
    if (left.current) left.current.position.x = -HALF + T / 2 - shell * OPEN.sides;
    if (right.current) right.current.position.x = HALF - T / 2 + shell * OPEN.sides;
    if (roof.current) roof.current.position.y = (N + 1) * 0 + shell * (OPEN.roof + N * OPEN.floorSpread);
    floors.current.forEach((g, f) => {
      if (g) g.position.y = f * FH + f * OPEN.floorSpread * shell;
    });

    // the brick: aged and greyed → cleaned
    tmp.lerpColors(m.brickOld, m.brick, s.clean);
    m.facade.color.copy(tmp);
    m.side.color.copy(tmp);

    // windows: the old ones go; the new ones are fitted one after another; glass glows warm at the end
    m.oldPane.opacity = s.oldWindows * 0.92;
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
        dummy.position.set(w.x, w.y, face === "front" ? T * 0.5 : T * 0.5);
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

    // partitions and the design model of the interior
    m.partition.opacity = s.interiorWalls * 0.95;
    partitionsRef.current.forEach((p) => (p.visible = s.interiorWalls > 0.01));
    m.floor.opacity = s.interior;
    tmp.lerpColors(m.ghost, m.oak, s.floorsReal);
    m.floor.color.copy(tmp);
    items.current.forEach(({ mesh, item, i }) => {
      const mat = mesh.material as MeshStandardMaterial;
      const grow = clamp01(s.interior * 1.5 - i * 0.07);
      mesh.visible = grow > 0.01;
      mesh.scale.set(item.size[0], item.size[1] * grow + 0.0001, item.size[2]);
      mesh.position.y = item.pos[1] * grow;
      mat.opacity = grow;
      const real = item.group === "kitchen" ? s.kitchenReal : s.floorsReal;
      const target = item.kind === "oak" ? m.oak : item.kind === "ink" ? m.ink : item.kind === "teal" ? m.teal : m.ghost;
      mat.color.lerpColors(m.ghost, target, real);
    });
    m.pendant.opacity = s.interior;
    m.pendant.emissiveIntensity = s.lights * 1.6;
    lamps.current.forEach((l) => {
      if (l) l.intensity = s.lights * (4 + 6 * s.warm);
    });
  });

  return (
    <group>
      {/* façades, each carrying its windows */}
      {faces.map((face, fi) => (
        <group key={face} ref={face === "front" ? front : back} position={[0, 0, face === "front" ? D / 2 - T : -D / 2]}>
          <mesh geometry={face === "front" ? geo.front : geo.back} material={m.facade} castShadow receiveShadow />
          <instancedMesh ref={(el) => void (frames.current[fi] = el)} args={[geo.frame, m.frame, slots.length / 2]} castShadow />
          <instancedMesh ref={(el) => void (glass.current[fi] = el)} args={[geo.pane, m.glass, slots.length / 2]} />
          <instancedMesh ref={(el) => void (oldPanes.current[fi] = el)} args={[geo.pane, m.oldPane, slots.length / 2]} />
        </group>
      ))}

      {/* party walls */}
      <mesh ref={left} position={[-HALF + T / 2, (HEIGHT + 1) / 2, 0]} material={m.side} castShadow receiveShadow>
        <boxGeometry args={[T, HEIGHT + 1, D - 2 * T]} />
      </mesh>
      <mesh ref={right} position={[HALF - T / 2, (HEIGHT + 1) / 2, 0]} material={m.side} castShadow receiveShadow>
        <boxGeometry args={[T, HEIGHT + 1, D - 2 * T]} />
      </mesh>

      {/* the roof: a ridge running back from the gable */}
      <group ref={roof}>
        <mesh position={[0, HEIGHT, -D / 2 + T]} geometry={geo.roof} material={m.roof} castShadow />
      </group>

      {/* floors: slab, partitions, interior, light */}
      {Array.from({ length: N + 1 }, (_, f) => (
        <group key={f} ref={(el) => void (floors.current[f] = el)}>
          <mesh position={[0, S / 2, 0]} material={m.slab} castShadow receiveShadow>
            <boxGeometry args={[W - 0.02, S, D - 0.02]} />
          </mesh>
          {f < N ? (
            <group position={[0, S, 0]}>
              <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow>
                <planeGeometry args={[W - 2 * T, D - 2 * T]} />
              </mesh>
              {f > 0
                ? partitions.map((p, k) => (
                    <mesh key={k} ref={(el) => void (el && (partitionsRef.current[f * 2 + k] = el))} position={p.pos} material={m.partition} castShadow>
                      <boxGeometry args={p.size} />
                    </mesh>
                  ))
                : null}
              {furniture(INTERIOR[f]).map((it, i) => (
                <mesh
                  key={i}
                  ref={(el) => void (el && (items.current[f * 10 + i] = { mesh: el, item: it, i }))}
                  geometry={geo.box}
                  material={itemMaterials[f][i]}
                  position={it.pos}
                  castShadow
                  receiveShadow
                />
              ))}
              <mesh ref={(el) => void (el && (pendants.current[f] = el))} position={[-0.6, FH - S - 0.7, 0.6]} material={m.pendant}>
                <sphereGeometry args={[0.16, 16, 12]} />
              </mesh>
              <pointLight ref={(el) => void (lamps.current[f] = el)} position={[-0.6, FH - S - 0.9, 0.6]} color={m.warm} intensity={0} distance={9} decay={1.6} />
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
}
