/**
 * The canal house of the About band's 3D model (SCENE-3D.md §2): its dimensions (≈ metres), the window grid, the
 * interior per floor and how far each part travels when the house is opened up. Pure data; the scene reads it.
 */
export const HOUSE = {
  width: 6,
  depth: 8,
  floors: 4,
  floorHeight: 3,
  wall: 0.3,
  slab: 0.22,
  gableSteps: 3, // steps of the stepped gable, each side
  gableHeight: 3.6,
} as const;

export const HEIGHT = HOUSE.floors * HOUSE.floorHeight; // eaves, 12

/** Three windows a floor on both façades; the ground floor's are taller (shop-front proportions of a canal house). */
export const WINDOW = { columns: [-1.9, 0, 1.9], width: 1.1, height: 1.9, groundHeight: 2.3, sill: 0.65 } as const;

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
  const neck = 0.9; // half-width of the gable's top
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

/** How far the parts move when the house is opened up (redevelop), at full extent. */
export const OPEN = {
  front: Math.PI / 2, // the front folds down onto the table, hinged at its foot (radians)
  back: 2.4, // backward (−z)
  sides: 1.7, // outward (±x)
  roof: 3.6, // up
  floorSpread: 0.95, // extra height per floor
} as const;

/** What each floor holds once designed (index = floor). */
export const INTERIOR: ("shop" | "kitchen" | "living" | "bedroom")[] = ["shop", "kitchen", "living", "bedroom"];
