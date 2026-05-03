import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { WORLD_BACKGROUNDS } from "../../assets/artPaths";
import type { Character, DayPhase, Season } from "../../domain/types";
import "./WorldViewportGuide.css";

interface WorldViewportProps {
  characters: Character[];
  focusCharacterId: string;
  dayPhase: DayPhase;
  paused: boolean;
  season: Season;
  tick: number;
}

function chaosOmen(tick: number, paused: boolean): string {
  if (paused) return "Something stirs in the world.";
  if (tick < 5) return "The world is calm.";
  if (tick < 12) return "A faint unease drifts through the void.";
  return "A faint distortion trembles at the edge of the world.";
}

const elementColors: Record<Character["element"], number> = {
  Wood: 0x5f9f63,
  Fire: 0xdd6b4d,
  Earth: 0xb68c52,
  Metal: 0x9cb0c3,
  Water: 0x4d7bcf,
};

const BOARD_BOUNDS = {
  minX: -6.2,
  maxX: 6.2,
  minZ: -4.2,
  maxZ: 4.2,
};

const CAMERA_HEIGHT = 11;
const CAMERA_DISTANCE = 8;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.8;
const FALLBACK_VIEWPORT_SIZE = 1;
const WORLD_BACKGROUND_PHASES = ["morning", "noon", "evening", "night"] as const;

type WorldBackgroundPhase = (typeof WORLD_BACKGROUND_PHASES)[number];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampCenter(center: { x: number; z: number }) {
  return {
    x: clamp(center.x, BOARD_BOUNDS.minX, BOARD_BOUNDS.maxX),
    z: clamp(center.z, BOARD_BOUNDS.minZ, BOARD_BOUNDS.maxZ),
  };
}

function getViewportSize(container: HTMLDivElement | null) {
  const width = container?.clientWidth ?? 0;
  const height = container?.clientHeight ?? 0;

  return {
    width: Math.max(width, FALLBACK_VIEWPORT_SIZE),
    height: Math.max(height, FALLBACK_VIEWPORT_SIZE),
    valid: width > 0 && height > 0,
  };
}

function getFocusTarget(characters: Character[], focusCharacterId: string) {
  return (
    characters.find((character) => character.id === focusCharacterId && character.alive) ??
    characters.find((character) => character.alive) ??
    null
  );
}

function getWorldBackgroundPhase(dayPhase: DayPhase, tick: number): WorldBackgroundPhase {
  // Domain does not have a night phase yet. Keep the visible background aligned
  // with the domain phase, and only use night as a late-evening presentation variant.
  if (dayPhase === "evening" && tick % 6 >= 5) {
    return "night";
  }

  return dayPhase;
}

function applyCameraPose(camera: THREE.PerspectiveCamera, center: { x: number; z: number }, zoom: number) {
  camera.position.set(center.x, CAMERA_HEIGHT, center.z + CAMERA_DISTANCE);
  camera.zoom = zoom;
  camera.lookAt(center.x, 0, center.z);
  camera.updateProjectionMatrix();
}

export function WorldViewport({ characters, focusCharacterId, dayPhase, paused, season, tick }: WorldViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const unitsRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const boardRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null>(null);
  const dragStateRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [cameraMode, setCameraMode] = useState<"follow" | "free">("follow");
  const [cameraCenter, setCameraCenter] = useState({ x: 0, z: 0 });
  const [cameraZoom, setCameraZoom] = useState(1);
  const backgroundPhase = getWorldBackgroundPhase(dayPhase, tick);
  const backgroundPath = WORLD_BACKGROUNDS[season][backgroundPhase];
  const [backgroundLoadFailed, setBackgroundLoadFailed] = useState(false);

  const focusTarget = getFocusTarget(characters, focusCharacterId);
  const omen = chaosOmen(tick, paused);
  const totalCharacters = characters.length;
  const livingCount = characters.filter((character) => character.alive).length;
  const noteworthyCount = characters.filter(
    (character) => character.warningIssued || character.notable.length > 0,
  ).length;
  const focusLabel = focusTarget?.name ?? "対象なし";
  const guideSummary = paused
    ? "ここが箱庭です。いまは大事な出来事で時間が止まり、次の判断を待っています。"
    : "ここが箱庭です。キャラが自動で暮らし、季節や出来事で少しずつ変化します。";
  const nextAction = paused ? "次: 起きた出来事を読み、介入するか考える" : "次: 箱庭をドラッグして見回す";
  const dayPhaseLabel =
    backgroundPhase === "morning"
      ? "朝"
      : backgroundPhase === "noon"
        ? "昼"
        : backgroundPhase === "evening"
          ? "夕"
          : "夜";
  const seasonLabel =
    season === "spring" ? "春" : season === "summer" ? "夏" : season === "autumn" ? "秋" : "冬";
  const showViewportGuide = !paused;

  useEffect(() => {
    setBackgroundLoadFailed(false);
  }, [backgroundPath]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const initialViewport = getViewportSize(containerRef.current);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      initialViewport.width / initialViewport.height,
      0.1,
      100,
    );
    applyCameraPose(camera, cameraCenter, cameraZoom);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(initialViewport.width, initialViewport.height);
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
      const viewport = getViewportSize(containerRef.current);
      if (!viewport.valid) {
        return;
      }

      camera.aspect = viewport.width / viewport.height;
      camera.updateProjectionMatrix();
      renderer.setSize(viewport.width, viewport.height);
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
    if (cameraMode !== "follow") {
      return;
    }

    const nextCenter = focusTarget ? clampCenter(focusTarget.position) : { x: 0, z: 0 };
    setCameraCenter((current) =>
      current.x === nextCenter.x && current.z === nextCenter.z ? current : nextCenter,
    );
  }, [cameraMode, focusTarget]);

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

    ambient.intensity = ambientIntensityByPhase[dayPhase];
    directional.intensity = dayPhase === "noon" ? 1.55 : 1.3;
    directional.color = new THREE.Color(directionalColorByPhase[dayPhase]);
    board.material.color = new THREE.Color(boardColorBySeason[season]);

    renderer.render(scene, camera);
  }, [dayPhase, season]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) {
      return;
    }

    applyCameraPose(camera, cameraCenter, cameraZoom);
    renderer.render(scene, camera);
  }, [cameraCenter, cameraZoom]);

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

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".viewport-overlay__controls, .world-viewport-guide")) {
      return;
    }
    event.preventDefault();
    dragStateRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    dragStateRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setCameraMode("free");
    setCameraCenter((current) =>
      clampCenter({
        x: current.x - deltaX * (0.025 / cameraZoom),
        z: current.z + deltaY * (0.025 / cameraZoom),
      }),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResetFocus = () => {
    setCameraMode("follow");
    setCameraCenter(focusTarget ? clampCenter(focusTarget.position) : { x: 0, z: 0 });
  };

  return (
    <div
      className="viewport-root world-viewport world-viewport--guided"
      data-tutorial-anchor="sandbox-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {!backgroundLoadFailed && (
        <img
          aria-hidden="true"
          className="world-viewport__background"
          src={backgroundPath}
          alt=""
          loading="eager"
          onError={() => setBackgroundLoadFailed(true)}
        />
      )}
      <div className="viewport-root__canvas" ref={containerRef} />
      <div className="viewport-overlay">
        <div className="viewport-overlay__chip">
          <span className={paused ? "status-dot status-dot--paused" : "status-dot"} />
          {paused ? "重要イベントで停止中" : "箱庭時間が進行中"}
        </div>
        <div className="viewport-overlay__chip viewport-overlay__chip--focus">
          追跡中: {focusLabel}
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
        {showViewportGuide ? (
          <>
            <details className="world-viewport-guide" aria-label="箱庭ガイド">
              <summary className="world-viewport-guide__bar">
                <span className="world-viewport-guide__eyebrow">Sandbox Guide</span>
                <span className="world-viewport-guide__chip">ここが箱庭</span>
                <span className="world-viewport-guide__chip">ドラッグで見回す</span>
                <span className="world-viewport-guide__chip">光る人物を追う</span>
                <span className="world-viewport-guide__expand">詳しく見る</span>
              </summary>
              <div className="world-viewport-guide__panel">
                <h2 className="world-viewport-guide__title">箱庭の見方</h2>
                <p className="world-viewport-guide__text">{guideSummary}</p>
                <div className="world-viewport-guide__mini-stats" aria-label="箱庭の現在地">
                  <span>全員 {totalCharacters}</span>
                  <span>生存 {livingCount}</span>
                  <span>変化 {noteworthyCount}</span>
                </div>
                <p className="world-viewport-guide__focus">いま見る: {focusLabel}</p>
                <div className="world-viewport-guide__cta">{nextAction}</div>
                <p className="world-viewport-guide__state">今の気配: {omen}</p>
              </div>
            </details>
            <div className="viewport-overlay__controls">
              <div className="viewport-overlay__chip viewport-overlay__chip--controls">
                視点 {cameraMode === "follow" ? `自動追従 / ${focusTarget?.name ?? "対象なし"}` : "自由視点"}
              </div>
              <div className="viewport-controls">
                <button
                  className="button button--ghost viewport-controls__button"
                  type="button"
                  onClick={() => setCameraZoom((current) => clamp(current - 0.15, MIN_ZOOM, MAX_ZOOM))}
                >
                  -
                </button>
                <button
                  className="button button--ghost viewport-controls__button"
                  type="button"
                  onClick={() => setCameraZoom((current) => clamp(current + 0.15, MIN_ZOOM, MAX_ZOOM))}
                >
                  +
                </button>
                <button className="button button--ghost viewport-controls__button" type="button" onClick={handleResetFocus}>
                  フォーカスに戻る
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
