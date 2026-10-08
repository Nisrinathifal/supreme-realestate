"use client";

import { useFrame } from "@react-three/fiber";
import { type PerspectiveCamera, Vector3 } from "three";
import { sampleCamera } from "@/lib/supreme/cameraTimeline";
import type { SceneState } from "@/lib/supreme/sceneTimeline";

const v = { pos: new Vector3(), target: new Vector3() }; // scratch vectors, reused every frame

/**
 * The camera, from the scroll progress (lib/supreme/cameraTimeline): position and target on their paths, the field
 * of view, and a sideways view offset that frames the model on the side away from the stage text. Deterministic: the
 * same progress always gives the same view. Portrait screens (phones, tablets upright): the stage text sits under the
 * model, so the model is centred, a little above the middle (below the closing line at the end), and the field of view
 * opens up so the model spans the narrow width as it spans the wide one.
 */
const PORTRAIT = 1.25; // aspect under which the layout is portrait
const smooth = (t: number) => t * t * (3 - 2 * t);
export function CameraRig({ state }: { state: SceneState }) {
  useFrame(({ camera: cam, size }) => {
    const camera = cam as PerspectiveCamera;
    const { fov, shift } = sampleCamera(state.progress, v.pos, v.target);
    camera.position.copy(v.pos);
    camera.lookAt(v.target);
    const aspect = size.width / size.height;
    // at the open the title sits over the view: the model is framed a little lower until the title has lifted away
    const under = 1 - smooth(Math.min(1, state.progress / 0.06));
    if (aspect >= PORTRAIT) {
      camera.fov = fov;
      // render a window shifted against the model's side, so the model sits right (+) or left (−) of the centre
      camera.setViewOffset(size.width, size.height, -shift * size.width * 0.5 * (1 - under), -size.height * 0.14 * under, size.width, size.height);
    } else {
      const k = Math.pow(PORTRAIT / aspect, 0.9);
      camera.fov = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * k) * 180) / Math.PI;
      const end = smooth(Math.min(1, Math.max(0, (state.progress - 0.9) / 0.08)));
      camera.setViewOffset(size.width, size.height, 0, size.height * (0.12 - 0.2 * end - 0.1 * under), size.width, size.height);
    }
    camera.updateProjectionMatrix();
  });
  return null;
}
