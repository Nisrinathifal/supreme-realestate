# Procedural 3D scene: the About band (2026-10-07)

Replaces the photo frame of the homepage About band ("Van oud naar waardevol") with a real-time, procedural 3D
architectural model on a worktable. No external models, images or fonts: geometry, textures and labels are generated
in code. Owner choices: `three` + `@react-three/fiber` + `@react-three/drei`; it lives in the About band.

## 1. Reference analysis (illoca.unseen.co, "Design at the speed of thought")

| Beat | What happens | What we take |
|---|---|---|
| Open | Large title over a wide illustrated scene | Title over the scene, the scene starts wide |
| Push | The scene fills the view, the camera moves in on the desk | One pinned viewport, scroll drives a continuous camera |
| Chapters | The frame docks right/left by turns, a numbered chapter beside it | Stage text alternates sides; the model is framed to the other side (view offset) |
| Transform | Sketch → massing → plans → refinement → façades, one object evolving | One building that evolves through six states, no cuts |
| Exit | The scene fills the view and turns into the next band | Darkens into the letter band |

Calm, slow, architectural-model photography: high camera, long lens, soft light, physical objects on paper.

## 2. Scene breakdown (world units ≈ metres)

| Object | Geometry | Material | Changes over the timeline |
|---|---|---|---|
| Worktable | Plane 60 × 40 | Paper (canvas noise) | — |
| Canal house | 6 w × 8 d, 4 floors × 3 m, stepped gable | Brick (canvas), concrete slabs | All six states |
| ↳ front / back façade | Extruded shape with window holes | Brick | Ages → cleans; the front folds down onto the table (hinged at its foot), the back slides out |
| ↳ party walls (2) | Boxes | Brick | Slide out, slide back |
| ↳ gable + roof | Extruded stepped gable + two roof planes | Brick, charcoal | Lifts off, returns |
| ↳ floor slabs (5) | Boxes | Concrete | Separate vertically, return |
| ↳ windows | Instanced frames + glass | Off-white frames, glass | Old fade out; new ones install |
| ↳ interior walls | Thin boxes per floor | Warm white | Appear in redevelop |
| ↳ interior | Oak floor planes, kitchen island, sofa, table, bed blocks, pendants | Wood, warm white, charcoal, teal | Appear in design, assemble in realisation |
| Floor plan | Line work under the house (walls, doors, grid) | Graphite lines | Draws on in redevelop |
| Elevation drawing | Sheet with the façade in lines, dimension lines | Paper, graphite | Draws on in potential |
| Analysis lines | 3D lines around the house: outline, floor levels, dimensions with ticks | Teal lines | Draw on in potential, fade in delivery |
| Labels | Canvas-text planes ("+12.00", "Ground floor") | Graphite on transparent | With the lines |
| Desk objects | Pencil (cylinder + cone), ruler (box + tick texture), stacked documents, site plan, material samples (brick, oak, concrete, teal), trees (cylinder + icosahedron) | As named | Static; trees grow in delivery |

## 3. Transformation timeline (scroll progress 0 → 1)

| Progress | State | Building | Overlays | Camera |
|---|---|---|---|---|
| 0.00 | 01 Existing property | Aged brick, dark old windows | none | Wide, high, three-quarter |
| 0.20 | 02 Potential | unchanged | Analysis lines, dimensions, elevation sheet draw on | Pushes in, slight orbit |
| 0.40 | 03 Redevelop | Front folds down, back and sides slide out, roof lifts, floors separate, old windows go, interior walls appear | Floor plan draws on | Orbits to the open side |
| 0.60 | 04 Design | Oak floors, kitchen, furniture, pendants appear inside | Lines stay | Pushes in on the floors |
| 0.80 | 05 Realisation | Assembles: walls → windows → floors → kitchen → lights; brick cleans (the front stays down, so the interior shows) | Lines fade | Rises, settles |
| 1.00 | 06 Delivery | The front stands up again; complete, clean, warm light, trees grown | Most overlays gone | Pulls back wide |

All tweens are deterministic (one GSAP timeline over a plain state object, scrubbed by ScrollTrigger; Lenis smooths
the scroll). The camera is sampled from a Catmull-Rom path through six keyframes at the same progress.

## 4. Architecture

- `components/supreme/` — `SupremeHero` (the band: pin, text, fallback, lazy scene), `ArchitecturalScene` (canvas,
  lights, table), `ExistingBuilding`, `FloorPlan`, `ArchitecturalDrawing`, `MaterialSamples`, `TransformationTimeline`
  (the stage text), `CameraRig`.
- `lib/supreme/` — `sceneTimeline.ts` (state object + timeline), `cameraTimeline.ts` (keyframes + sampling),
  `buildingStates.ts` (dimensions, offsets), `materials.ts` (colours from the CSS tokens, procedural textures).
- Colours come from `styles/tokens.css` (read at runtime), including four scene tokens (brick, oak, teal, concrete).

## 5. Performance and fallback

Low-poly geometry, instanced windows, canvas textures ≤ 512 px, one shadow-casting light (1024 map), dpr ≤ 1.75,
render loop only while the band is on screen. The scene module is loaded only on wide screens with motion and WebGL;
phones, reduced motion, no WebGL and no JS get a procedural SVG elevation of the house and the six stages as text.

## 6. Verified (2026-10-07)

1440 × 900, Chrome on Apple M5 (ANGLE Metal): 60 fps while wheel-scrolling the band (p95 16.7 ms, no frame over 33 ms),
no console errors. 390 px and reduced motion: the SVG elevation and the stages as a list, no canvas loaded.
