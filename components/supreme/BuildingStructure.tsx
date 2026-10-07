"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { APARTMENTS, HEIGHT, HOUSE, UNIT } from "@/lib/supreme/buildingStates";
import { color, concreteTexture } from "@/lib/supreme/materials";
import type { SceneState } from "@/lib/supreme/sceneTimeline";
import { ApartmentUnit } from "./ApartmentUnit";
import { ExistingBuilding } from "./ExistingBuilding";
import { DrawnLine, type V3 } from "./parts";

const { floorHeight: FH, slab: S, floors: N } = HOUSE;
const CORE_D = 3.4; // the stair and lift shaft, at the back of the core
const CORE_Z = -UNIT.depth / 2 + CORE_D / 2;
const LANDING_D = UNIT.depth - CORE_D; // the landing in front of it, one per floor

/**
 * What the shell holds besides the homes (SCENE-3D.md §2): the shared core (stair and lift shaft, a landing on every
 * floor) that rises into view when the shell turns see-through, and stays as the spine the eight units separate
 * around. At the end the eight are drawn linked through it: a line up the core and, on every floor, out to both
 * apartments' numbers.
 */
export function BuildingStructure({ state }: { state: SceneState }) {
  const shaft = useRef<Group>(null);
  const landings = useRef<Group>(null);
  const m = useMemo(() => ({ map: concreteTexture(), color: color("--scene-concrete") }), []);

  useFrame(() => {
    const k = Math.max(0.0001, state.structure);
    if (shaft.current) {
      shaft.current.scale.y = k;
      shaft.current.visible = state.structure > 0.01;
    }
    if (landings.current) landings.current.visible = state.structure > 0.01;
  });

  const z = UNIT.depth / 2 + 0.12; // just in front of the units' fronts
  const spine: V3[] = [[0, 0.4, z], [0, HEIGHT - 0.4, z]];
  const reach = UNIT.core / 2 + UNIT.width / 2 - 0.25 - 0.7; // to just before each number
  const links: V3[][] = Array.from({ length: N }, (_, f) => {
    const y = f * FH + S + 1.5;
    return [
      [[0, y, z], [-reach, y, z]],
      [[0, y, z], [reach, y, z]],
    ] as V3[][];
  }).flat();

  return (
    <group>
      <group ref={shaft}>
        <mesh position={[0, (HEIGHT + 0.9) / 2, CORE_Z]} castShadow receiveShadow>
          <boxGeometry args={[UNIT.core - 0.1, HEIGHT + 0.9, CORE_D]} />
          <meshStandardMaterial map={m.map} color={m.color} roughness={0.95} />
        </mesh>
      </group>
      <group ref={landings}>
        {Array.from({ length: N }, (_, f) => (
          <mesh key={f} position={[0, f * FH + S / 2, CORE_Z + CORE_D / 2 + LANDING_D / 2]} castShadow receiveShadow>
            <boxGeometry args={[UNIT.core, S, LANDING_D]} />
            <meshStandardMaterial map={m.map} color={m.color} roughness={0.95} />
          </mesh>
        ))}
      </group>
      <DrawnLine points={spine} tone="--scene-teal" draw={() => state.connect} width={1.4} />
      {links.map((pts, i) => (
        <DrawnLine key={i} points={pts} tone="--scene-teal" draw={() => Math.min(1, Math.max(0, state.connect * 1.6 - 0.3 - Math.floor(i / 2) * 0.08))} width={1.4} />
      ))}
    </group>
  );
}

/**
 * The building of the About band (SCENE-3D.md §2): the existing shell, the shared structure and the eight apartments,
 * each its own object so each can be animated on its own.
 */
export function SupremeBuilding({ state }: { state: SceneState }) {
  return (
    <group>
      <ExistingBuilding state={state} />
      <BuildingStructure state={state} />
      {APARTMENTS.map((a) => (
        <ApartmentUnit key={a.index} apartment={a} state={state} />
      ))}
    </group>
  );
}
