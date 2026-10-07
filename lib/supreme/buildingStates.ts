/**
 * The building of the About band's 3D model (SCENE-3D.md §2): one existing, double-fronted Dutch building whose four
 * floors hold eight apartments, two a floor either side of a shared core. Its dimensions (≈ metres), the window grid,
 * the eight units and how far each part travels when the building is opened up. Pure data; the scene reads it.
 */
export const HOUSE = {
  width: 12,
  depth: 10,
  floors: 4,
  floorHeight: 3,
  wall: 0.3,
  slab: 0.22,
  gableSteps: 4, // steps of the stepped gable, each side
  gableHeight: 4.4,
} as const;

export const HEIGHT = HOUSE.floors * HOUSE.floorHeight; // eaves, 12

/** Four windows a floor on both façades, two for each apartment behind them; the ground floor's are a little taller. */
export const WINDOW = { columns: [-4.4, -1.7, 1.7, 4.4], width: 1.3, height: 1.9, groundHeight: 2.1, sill: 0.65 } as const;

export type WindowSlot = { x: number; y: number; h: number; face: "front" | "back" };

export function windowSlots(): WindowSlot[] {
  const slots: WindowSlot[] = [];
  for (const face of ["front", "back"] as const) {
    for (let f = 0; f < HOUSE.floors; f++) {
      const h = f === 0 ? WINDOW.groundHeight : WINDOW.height;
      const y = f * HOUSE.floorHeight + WINDOW.sill + h / 2;
      for (const x of WINDOW.columns) slots.push({ x, y, h, face });
    }
  }
  return slots;
}

/** The stepped gable's outline above the eaves, left to right (x, y), on the façade's own plane. */
export function gableOutline(): [number, number][] {
  const { width, gableSteps, gableHeight } = HOUSE;
  const half = width / 2;
  const top = HEIGHT + gableHeight;
  const neck = 1.4; // half-width of the gable's top
  const stepW = (half - neck) / gableSteps;
  const stepH = gableHeight / (gableSteps + 1);
  const pts: [number, number][] = [[-half, HEIGHT]];
  // up the left side, one step at a time: up, then in
  for (let i = 0; i < gableSteps; i++) {
    const y = HEIGHT + (i + 1) * stepH;
    pts.push([-half + i * stepW, y], [-half + (i + 1) * stepW, y]);
  }
  pts.push([-neck, top], [neck, top]);
  // and down the right side: out, then down
  for (let i = gableSteps - 1; i >= 0; i--) {
    const y = HEIGHT + (i + 1) * stepH;
    pts.push([half - (i + 1) * stepW, y], [half - i * stepW, y]);
  }
  pts.push([half, HEIGHT]);
  return pts;
}

/** One apartment: the space between the party wall and the core, floor to floor, front to back. */
export const UNIT = {
  width: 4.8,
  depth: HOUSE.depth - 2 * HOUSE.wall, // 9.4
  core: 1.8, // the shared stair and lift between the two apartments of a floor
} as const;

export type Apartment = {
  /** 0–7; shown as 01–08. */
  index: number;
  floor: number;
  /** −1 left of the core, +1 right of it. */
  side: -1 | 1;
  /** Where the unit stands in the building (its floor's centre, at slab level). */
  base: [number, number, number];
  /** Where it travels when the eight separate (added to base, times the split). */
  apart: [number, number, number];
};

export const APARTMENTS: Apartment[] = Array.from({ length: HOUSE.floors * 2 }, (_, index) => {
  const floor = Math.floor(index / 2);
  const side = index % 2 === 0 ? -1 : 1;
  const x = side * (UNIT.core / 2 + UNIT.width / 2);
  return {
    index,
    floor,
    side,
    base: [x, floor * HOUSE.floorHeight, 0],
    // out to the side, up a little more for every floor, and staggered front/back, so each reads as its own volume
    apart: [side * 2.3, floor * 1.3 + 0.2, (floor + (side > 0 ? 1 : 0)) % 2 === 0 ? 0.8 : -0.5],
  } satisfies Apartment;
});

/** How far the shell travels when the building is opened up, at full extent. */
export const OPEN = {
  front: Math.PI / 2, // the front folds down onto the table, hinged at its foot (radians)
  back: 3.2, // backward (−z)
  sides: 2.9, // outward (±x), clear of the separated units
  roof: 1.4 + HOUSE.floors * 1.3, // up, just clear of the separated top floor
} as const;
