"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Color, Group, Texture } from "three";
import { HOUSE } from "@/lib/supreme/buildingStates";
import { brickTexture, color, concreteTexture, documentTexture, rulerTexture, toonSteps, woodTexture } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";

/** Three street trees beside the building: trunk and a low-poly crown; they grow in at delivery. */
const TREES: [number, number, number][] = [
  [-10.8, 0, HOUSE.depth / 2 + 4.6],
  [-8.8, 0, HOUSE.depth / 2 + 5.9],
  [14.6, 0, HOUSE.depth / 2 + 6.4],
]; // on the quay beside the building, clear of the front when it is folded down and of the mascot's spots

/**
 * The developer's desk around the model: material samples (brick, oak, concrete, teal), a pencil, a ruler and a stack
 * of documents behind the building (in frame from both sides), and the street trees. Static, except the trees, which grow to
 * full size at delivery.
 */
export function MaterialSamples({ state }: { state: SceneState }) {
  const trees = useRef<(Group | null)[]>([]);
  const t = useMemo(
    () => ({
      brick: brickTexture(),
      oak: woodTexture(),
      concrete: concreteTexture(),
      ruler: rulerTexture(),
      docs: [documentTexture(3), documentTexture(5), documentTexture(9)],
      c: {
        brick: color("--scene-brick"),
        oak: color("--scene-oak"),
        concrete: color("--scene-concrete"),
        teal: color("--scene-teal"),
        ink: color("--ink"),
        paper: color("--bg"),
        leaf: color("--scene-teal"),
        graphite: color("--scene-graphite"),
      },
    }),
    [],
  );

  useFrame(() => {
    trees.current.forEach((g, i) => {
      if (!g) return;
      const k = Math.min(1, Math.max(0, state.trees * 1.2 - i * 0.08));
      g.scale.setScalar(0.35 + 0.65 * k);
    });
  });

  const samples: { pos: [number, number, number]; map: Texture | null; col: Color }[] = [
    // on the desk behind the building, to the right: in frame from the front-right and the front-left alike
    { pos: [6.6, 0, -10.6], map: t.brick, col: t.c.brick },
    { pos: [8.5, 0, -10.9], map: t.oak, col: t.c.oak },
    { pos: [10.4, 0, -10.7], map: t.concrete, col: t.c.concrete },
    { pos: [12.3, 0, -11.0], map: null, col: t.c.teal },
  ];

  return (
    <group name="desk">
      {samples.map((s, i) => (
        <mesh key={i} name={`sample-${i + 1}`} position={[s.pos[0], 0.07, s.pos[2]]} rotation={[0, (i - 1.5) * 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.14, 1.6]} />
          <meshToonMaterial gradientMap={toonSteps()} map={s.map} color={s.col} />
        </mesh>
      ))}

      {/* pencil: graphite hexagon body, sharpened tip */}
      <group name="pencil" position={[9.6, 0.13, -8.0]} rotation={[0, 0.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 5.2, 6]} />
          <meshToonMaterial gradientMap={toonSteps()} color={t.c.graphite} />
        </mesh>
        <mesh position={[2.85, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.13, 0.5, 6]} />
          <meshToonMaterial gradientMap={toonSteps()} color={t.c.oak} />
        </mesh>
      </group>

      {/* ruler */}
      <mesh name="ruler" position={[-12.5, 0.04, -11.2]} rotation={[0, -0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 0.08, 1.1]} />
        <meshToonMaterial gradientMap={toonSteps()} map={t.ruler} />
      </mesh>

      {/* a stack of property documents */}
      {t.docs.map((map, i) => (
        <mesh key={i} name={`document-${i + 1}`} position={[-14 + i * 0.25, 0.03 + i * 0.012, -7 - i * 0.2]} rotation={[-Math.PI / 2, 0, 0.12 - i * 0.09]} receiveShadow castShadow>
          <planeGeometry args={[6, 7.8]} />
          <meshToonMaterial gradientMap={toonSteps()} map={map} />
        </mesh>
      ))}

      {/* street trees */}
      {TREES.map((p, i) => (
        <group key={i} name={`tree-${i + 1}`} position={p} ref={(el) => void (trees.current[i] = el)}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 2.2, 6]} />
            <meshToonMaterial gradientMap={toonSteps()} color={t.c.graphite} />
          </mesh>
          <mesh position={[0, 3.1, 0]} castShadow>
            <icosahedronGeometry args={[1.45, 1]} />
            <meshToonMaterial gradientMap={toonSteps()} color={t.c.leaf} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
