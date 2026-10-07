"use client";

import { useFrame } from "@react-three/fiber";
import { type PerspectiveCamera, Vector3 } from "three";
import { sampleCamera } from "@/lib/supreme/cameraTimeline";
import type { SceneState } from "@/lib/supreme/sceneTimeline";

const v = { pos: new Vector3(), target: new Vector3() }; // scratch vectors, reused every frame

/**
 * The camera, from the scroll progress (lib/supreme/cameraTimeline): position and target on their paths, the field
 * of view, and a sideways view offset that frames the model on the side away from the stage text. Deterministic: the
 * same progress always gives the same view.
 */
export function CameraRig({ state }: { state: SceneState }) {
  useFrame(({ camera: cam, size }) => {
    const camera = cam as PerspectiveCamera;
    const { fov, shift } = sampleCamera(state.progress, v.pos, v.target);
    camera.position.copy(v.pos);
    camera.lookAt(v.target);
    camera.fov = fov;
    // render a window shifted against the model's side, so the model sits right (+) or left (−) of the centre
    camera.setViewOffset(size.width, size.height, -shift * size.width * 0.5, 0, size.width, size.height);
    camera.updateProjectionMatrix();
  });
  return null;
}
