import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Character, DayPhase, Season } from "../../domain/types";

interface WorldViewportProps {
  characters: Character[];
  focusCharacterId: string;
  dayPhase: DayPhase;
  paused: boolean;
  season: Season;
}

const elementColors: Record<Character["element"], number> = {
  Wood: 0x5f9f63,
  Fire: 0xdd6b4d,
  Earth: 0xb68c52,
  Metal: 0x9cb0c3,
  Water: 0x4d7bcf,
};

export function WorldViewport({ characters, focusCharacterId, dayPhase, paused, season }: WorldViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const unitsRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const boardRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null>(null);

  const dayPhaseLabel = dayPhase === "morning" ? "朝" : dayPhase === "noon" ? "昼" : "晩";
  const seasonLabel =
    season === "spring" ? "春" : season === "summer" ? "夏" : season === "autumn" ? "秋" : "冬";

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101826);

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / Math.max(containerRef.current.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 11, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(6, 12, 5);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshStandardMaterial({ color: 0x1d3f32, roughness: 0.9, metalness: 0.05 }),
    );
    board.rotation.x = -Math.PI / 2;

    const grid = new THREE.GridHelper(14, 14, 0x2f6470, 0x1f3341);
    grid.position.y = 0.01;

    const units = new THREE.Group();

    scene.add(ambient, directional, board, grid, units);

    const renderScene = () => {
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!containerRef.current) {
        return;
      }

      const width = containerRef.current.clientWidth;
      const height = Math.max(containerRef.current.clientHeight, 1);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderScene();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    unitsRef.current = units;
    ambientLightRef.current = ambient;
    directionalLightRef.current = directional;
    boardRef.current = board;

    renderScene();

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material: THREE.Material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      containerRef.current?.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      unitsRef.current = null;
      ambientLightRef.current = null;
      directionalLightRef.current = null;
      boardRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const ambient = ambientLightRef.current;
    const directional = directionalLightRef.current;
    const board = boardRef.current;

    if (!renderer || !scene || !camera || !ambient || !directional || !board) {
      return;
    }

    const backgroundByPhase: Record<DayPhase, number> = {
      morning: 0x16263a,
      noon: 0x1d3552,
      evening: 0x281f31,
    };

    const ambientIntensityByPhase: Record<DayPhase, number> = {
      morning: 1.15,
      noon: 1.45,
      evening: 0.95,
    };

    const directionalColorByPhase: Record<DayPhase, number> = {
      morning: 0xf3e1bf,
      noon: 0xffffff,
      evening: 0xffc98f,
    };

    const boardColorBySeason: Record<Season, number> = {
      spring: 0x29553f,
      summer: 0x1f5f34,
      autumn: 0x5d4a2e,
      winter: 0x274a56,
    };

    scene.background = new THREE.Color(backgroundByPhase[dayPhase]);
    ambient.intensity = ambientIntensityByPhase[dayPhase];
    directional.intensity = dayPhase === "noon" ? 1.55 : 1.3;
    directional.color = new THREE.Color(directionalColorByPhase[dayPhase]);
    board.material.color = new THREE.Color(boardColorBySeason[season]);

    renderer.render(scene, camera);
  }, [dayPhase, season]);

  useEffect(() => {
    const units = unitsRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!units || !renderer || !scene || !camera) {
      return;
    }

    while (units.children.length > 0) {
      const child = units.children[0];
      units.remove(child);

      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material: THREE.Material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    for (const character of characters) {
      const color = character.alive ? elementColors[character.element] : 0x6b7280;
      const unit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, 1.2, 24),
        new THREE.MeshStandardMaterial({
          color,
          emissive: character.id === focusCharacterId ? 0x14213d : 0x000000,
          metalness: 0.15,
          roughness: 0.45,
        }),
      );
      unit.position.set(character.position.x, 0.62, character.position.z);
      units.add(unit);

      if (character.id === focusCharacterId) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.85, 0.06, 8, 24),
          new THREE.MeshStandardMaterial({
            color: paused ? 0xf6c453 : 0xffffff,
            emissive: paused ? 0xf6c453 : 0x9ca3af,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(character.position.x, 0.08, character.position.z);
        units.add(ring);
      }
    }

    renderer.render(scene, camera);
  }, [characters, focusCharacterId, paused]);

  return (
    <div className="viewport-root">
      <div className="viewport-root__canvas" ref={containerRef} />
      <div className="viewport-overlay">
        <div className="viewport-overlay__chip">
          <span className={paused ? "status-dot status-dot--paused" : "status-dot"} />
          {paused ? "重要イベントで停止中" : "箱庭時間が進行中"}
        </div>
        <div className="viewport-overlay__chip viewport-overlay__chip--center">
          {dayPhaseLabel} / {seasonLabel}
        </div>
        <div className="viewport-overlay__legend">
          <span>木</span>
          <span>火</span>
          <span>土</span>
          <span>金</span>
          <span>水</span>
        </div>
      </div>
    </div>
  );
}
