"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CodebaseStoryScene, VisualActorSpec } from "@/lib/types/analysis";

function colorForScene(scene: CodebaseStoryScene) {
  if (scene.animationType === "problem-solution") return "#df6f31";
  if (scene.animationType === "database-pulse") return "#38d5bd";
  if (scene.animationType === "api-tunnel" || scene.animationType === "data-travel") return "#5b7cfa";
  if (scene.animationType === "ending") return "#18a46f";
  return "#0f9f8e";
}

function fallbackActors(scene: CodebaseStoryScene): VisualActorSpec[] {
  const sceneColor = colorForScene(scene);

  return [
    {
      id: "hero",
      label: "Person",
      kind: "person",
      role: scene.whatUserDoes,
      color: "#df6f31",
      iconHint: "user"
    },
    {
      id: "app",
      label: "App",
      kind: "app",
      role: scene.whatAppDoesBehindScenes,
      color: sceneColor,
      iconHint: "app"
    },
    {
      id: "result",
      label: "Result",
      kind: "result",
      role: scene.narration,
      color: "#18a46f",
      iconHint: "result"
    }
  ];
}

function geometryForActor(actor: VisualActorSpec) {
  if (actor.kind === "person") return new THREE.CapsuleGeometry(0.26, 0.7, 8, 24);
  if (actor.kind === "screen" || actor.kind === "app") return new THREE.BoxGeometry(0.72, 0.48, 0.08);
  if (actor.kind === "database") return new THREE.CylinderGeometry(0.32, 0.32, 0.58, 32);
  if (actor.kind === "api" || actor.kind === "service") return new THREE.OctahedronGeometry(0.34, 0);
  return new THREE.IcosahedronGeometry(0.35, 1);
}

function actorPosition(index: number, total: number) {
  if (total <= 1) return new THREE.Vector3(0, 0.45, 0);
  const progress = index / (total - 1);
  const x = -3 + progress * 6;
  const y = 0.45 + Math.sin(progress * Math.PI) * 0.95;
  const z = Math.cos(progress * Math.PI * 2) * 0.22;
  return new THREE.Vector3(x, y, z);
}

export function StoryThreeStage({
  scene
}: {
  scene: CodebaseStoryScene;
  worldMotifs: string[];
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const actors = useMemo(() => scene.visualSpec?.actors?.length ? scene.visualSpec.actors : fallbackActors(scene), [scene]);
  const motions = useMemo(() => scene.visualSpec?.motions ?? [], [scene.visualSpec?.motions]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    const width = Math.max(320, mount.clientWidth);
    const height = Math.max(320, mount.clientHeight);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const clock = new THREE.Clock();
    const group = new THREE.Group();
    const actorPositions = new Map<string, THREE.Vector3>();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    camera.position.set(0, 1.45, scene.visualSpec?.camera === "focused" ? 6.6 : 8);
    threeScene.add(camera);
    threeScene.add(group);
    threeScene.add(new THREE.AmbientLight(0xffffff, 1.65));

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 5, 4);
    threeScene.add(key);

    const actorMeshes = actors.map((actor, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(actor.color),
        roughness: 0.42,
        metalness: actor.kind === "result" ? 0.28 : 0.1
      });
      const mesh = new THREE.Mesh(geometryForActor(actor), material);
      const position = actorPosition(index, actors.length);
      mesh.position.copy(position);
      actorPositions.set(actor.id, position);
      group.add(mesh);
      return mesh;
    });

    const pathPoints = actors.map((actor) => actorPositions.get(actor.id)).filter((point): point is THREE.Vector3 => Boolean(point));
    const path =
      pathPoints.length > 1
        ? new THREE.CatmullRomCurve3(pathPoints)
        : new THREE.CatmullRomCurve3([new THREE.Vector3(-1, 0.45, 0), new THREE.Vector3(1, 0.45, 0)]);
    const pathMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorForScene(scene)),
      transparent: true,
      opacity: 0.48
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 90, 0.035, 12, false), pathMaterial);
    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 20),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(colorForScene(scene)), roughness: 0.35 })
    );

    group.add(tube, packet);

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = Math.max(320, mount.clientWidth);
      const nextHeight = Math.max(320, mount.clientHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resizeObserver.observe(mount);

    let frameId = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      const motion = motions.length ? motions[Math.floor(elapsed / 1.6) % motions.length] : null;
      const from = motion ? actorPositions.get(motion.from) : null;
      const to = motion ? actorPositions.get(motion.to) : null;

      if (from && to) {
        packet.position.copy(from.clone().lerp(to, (elapsed * 0.62) % 1));
      } else {
        packet.position.copy(path.getPoint((elapsed * 0.18) % 1));
      }

      actorMeshes.forEach((mesh, index) => {
        mesh.rotation.y = elapsed * (0.25 + index * 0.03);
        mesh.position.y = (actorPositions.get(actors[index].id)?.y ?? 0.45) + Math.sin(elapsed * 1.6 + index) * 0.045;
      });
      renderer.render(threeScene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      threeScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [actors, motions, scene]);

  return (
    <div className="relative min-h-80 overflow-hidden rounded-lg border border-border bg-card">
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap gap-1.5">
        {actors.slice(0, 5).map((actor) => (
          <span
            key={actor.id}
            className="rounded-md border border-border bg-background/90 px-2 py-1 text-xs font-bold backdrop-blur"
            style={{ color: actor.color }}
          >
            {actor.label}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md border border-border bg-background/90 p-3 backdrop-blur">
        <p className="text-xs font-bold uppercase text-muted-foreground">
          {scene.visualSpec?.setting ?? "Animated scene"}
        </p>
        <p className="mt-1 text-sm font-black">{scene.visualSpec?.purpose ?? scene.title}</p>
      </div>
    </div>
  );
}
