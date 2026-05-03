import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { APOSTLE_GUIDE_SPRITE } from "../../assets/artPaths";
import "./TutorialGuideOverlay.css";

const TUTORIAL_DEFERRED_KEY = "godsandbox.tutorialGuideOverlayFoundation.deferred.v1";
const TUTORIAL_COMPLETED_KEY = "godsandbox.tutorialGuideOverlayFoundation.completed.v1";
const MOBILE_BUBBLE_BREAKPOINT = 860;
const TUTORIAL_APOSTLE_FRAME_INTERVAL_MS = 560;

export interface TutorialGuideStep {
  id: string;
  title: string;
  body: string;
  apostleLine: string;
  targetLabel: string;
  targetSelector?: string;
  highlightPadding?: number;
  scrollBlock?: ScrollLogicalPosition;
}

interface TutorialGuideOverlayProps {
  steps: TutorialGuideStep[];
  suspended?: boolean;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type TutorialSpriteFrame = {
  column: number;
  row: number;
};

function readStoredFlag(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStoredFlag(key: string, value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(key, "true");
      return;
    }

    window.localStorage.removeItem(key);
  } catch {
    // localStorage が使えない環境では、そのセッションだけの状態で続行します。
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTargetElement(step: TutorialGuideStep) {
  if (!step.targetSelector || typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(step.targetSelector);
}

function createSpotlightRect(rect: DOMRect, padding: number): SpotlightRect {
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  };
}

function createBubbleStyle(spotlightRect: SpotlightRect | null): CSSProperties {
  if (!spotlightRect || window.innerWidth <= MOBILE_BUBBLE_BREAKPOINT) {
    return {
      left: 12,
      right: 12,
      bottom: 12,
    };
  }

  const bubbleWidth = Math.min(360, window.innerWidth - 32);
  const bubbleHeight = 340;
  const canPlaceRight = spotlightRect.left + spotlightRect.width + bubbleWidth + 28 <= window.innerWidth;
  const left = canPlaceRight
    ? spotlightRect.left + spotlightRect.width + 18
    : clamp(spotlightRect.left, 16, window.innerWidth - bubbleWidth - 16);
  const preferredTop = spotlightRect.top + spotlightRect.height + 18;
  const top = preferredTop + bubbleHeight <= window.innerHeight
    ? preferredTop
    : clamp(spotlightRect.top - bubbleHeight - 18, 16, window.innerHeight - bubbleHeight - 16);

  return {
    top,
    left,
    width: bubbleWidth,
  };
}

export function TutorialGuideOverlay({ steps, suspended = false }: TutorialGuideOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isDeferred, setIsDeferred] = useState(readStoredFlag(TUTORIAL_DEFERRED_KEY));
  const [isCompleted, setIsCompleted] = useState(readStoredFlag(TUTORIAL_COMPLETED_KEY));
  const [isHiddenForSession, setIsHiddenForSession] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [bubbleStyle, setBubbleStyle] = useState<CSSProperties>({});
  const [isSpriteReady, setIsSpriteReady] = useState(false);
  const [apostleFrame, setApostleFrame] = useState<TutorialSpriteFrame>(APOSTLE_GUIDE_SPRITE.motions.idle[0]);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const isOpen = !isCompleted && !isDeferred && !isHiddenForSession;
  const activeStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const apostleMotion = stepIndex >= Math.max(1, steps.length - 2) ? "guidePoint" : "idle";

  useEffect(() => {
    return () => {
      if (highlightedElementRef.current) {
        delete highlightedElementRef.current.dataset.tutorialHighlighted;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCancelled = false;
    const spriteImage = new window.Image();

    spriteImage.onload = () => {
      if (!isCancelled) {
        setIsSpriteReady(true);
      }
    };

    spriteImage.onerror = () => {
      if (!isCancelled) {
        setIsSpriteReady(false);
      }
    };

    spriteImage.src = APOSTLE_GUIDE_SPRITE.sheet;

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || suspended || !isSpriteReady) {
      return;
    }

    const frames = APOSTLE_GUIDE_SPRITE.motions[apostleMotion];
    let frameIndex = 0;

    setApostleFrame(frames[frameIndex]);

    const intervalId = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      setApostleFrame(frames[frameIndex]);
    }, TUTORIAL_APOSTLE_FRAME_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [apostleMotion, isOpen, isSpriteReady, suspended]);

  useLayoutEffect(() => {
    if (!isOpen || suspended || !activeStep) {
      setSpotlightRect(null);
      return;
    }

    let frameId = 0;
    let timeoutId = 0;

    const updateHighlight = () => {
      const target = getTargetElement(activeStep);

      if (highlightedElementRef.current && highlightedElementRef.current !== target) {
        delete highlightedElementRef.current.dataset.tutorialHighlighted;
      }

      highlightedElementRef.current = target;

      if (!target) {
        setSpotlightRect(null);
        setBubbleStyle(createBubbleStyle(null));
        return;
      }

      target.dataset.tutorialHighlighted = "true";
      const rect = target.getBoundingClientRect();
      const nextSpotlightRect = createSpotlightRect(rect, activeStep.highlightPadding ?? 14);
      setSpotlightRect(nextSpotlightRect);
      setBubbleStyle(createBubbleStyle(nextSpotlightRect));
    };

    const target = getTargetElement(activeStep);
    if (target) {
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: activeStep.scrollBlock ?? (window.innerWidth <= MOBILE_BUBBLE_BREAKPOINT ? "center" : "nearest"),
        inline: "nearest",
      });
    }

    frameId = window.requestAnimationFrame(updateHighlight);
    timeoutId = window.setTimeout(updateHighlight, 320);

    const handleLayout = () => {
      window.requestAnimationFrame(updateHighlight);
    };

    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [activeStep, isOpen, suspended]);

  if (!activeStep) {
    return null;
  }

  const handleOpen = () => {
    setIsDeferred(false);
    setIsHiddenForSession(false);
    writeStoredFlag(TUTORIAL_DEFERRED_KEY, false);
  };

  const handleDefer = () => {
    setIsDeferred(true);
    setIsHiddenForSession(false);
    writeStoredFlag(TUTORIAL_DEFERRED_KEY, true);
  };

  const handleSkip = () => {
    setIsHiddenForSession(true);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    setIsDeferred(false);
    setIsHiddenForSession(false);
    writeStoredFlag(TUTORIAL_COMPLETED_KEY, true);
    writeStoredFlag(TUTORIAL_DEFERRED_KEY, false);
  };

  return (
    <>
      {!isCompleted && !isOpen && !suspended ? (
        <div className="tutorial-guide-overlay__launcher-row">
          <div className="tutorial-guide-overlay__launcher">
            <span className="tutorial-guide-overlay__launcher-text">
              {isDeferred ? "使徒ガイドはあとで見られるようにしています。" : "使徒ガイドを閉じています。"}
            </span>
            <button className="button button--ghost tutorial-guide-overlay__button" type="button" onClick={handleOpen}>
              使徒ガイドを開く
            </button>
          </div>
        </div>
      ) : null}

      {isOpen && !suspended ? (
        <div className="tutorial-guide-overlay" aria-live="polite">
          {spotlightRect ? (
            <div
              className="tutorial-guide-overlay__spotlight"
              aria-hidden="true"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
              }}
            />
          ) : (
            <div className="tutorial-guide-overlay__veil" aria-hidden="true" />
          )}

          <section
            className="tutorial-guide-overlay__bubble"
            style={bubbleStyle}
            role="dialog"
            aria-labelledby="tutorial-guide-overlay-title"
            aria-describedby="tutorial-guide-overlay-body"
          >
            <div className="tutorial-guide-overlay__header">
              <p className="tutorial-guide-overlay__eyebrow">使徒ガイド</p>
              <p className="tutorial-guide-overlay__progress">
                {stepIndex + 1} / {steps.length}
              </p>
            </div>

            <h2 id="tutorial-guide-overlay-title" className="tutorial-guide-overlay__title">
              {activeStep.title}
            </h2>

            <p id="tutorial-guide-overlay-body" className="tutorial-guide-overlay__body">
              {activeStep.body}
            </p>

            <div
              className={`tutorial-guide-overlay__apostle-card ${!isSpriteReady ? "tutorial-guide-overlay__apostle-card--text-only" : ""}`}
            >
              {isSpriteReady ? (
                <div className="tutorial-guide-overlay__apostle-sprite-shell" aria-hidden="true">
                  <div
                    className="tutorial-guide-overlay__apostle-sprite"
                    style={{
                      backgroundImage: `url(${APOSTLE_GUIDE_SPRITE.sheet})`,
                      backgroundPosition: `calc(var(--tutorial-apostle-frame-width) * ${-apostleFrame.column}) calc(var(--tutorial-apostle-frame-height) * ${-apostleFrame.row})`,
                      backgroundSize: `calc(var(--tutorial-apostle-frame-width) * ${APOSTLE_GUIDE_SPRITE.columns}) calc(var(--tutorial-apostle-frame-height) * ${APOSTLE_GUIDE_SPRITE.rows})`,
                    }}
                  />
                </div>
              ) : null}
              <p className="tutorial-guide-overlay__apostle">{activeStep.apostleLine}</p>
            </div>
            <p className="tutorial-guide-overlay__target">
              <strong>見る場所:</strong> {activeStep.targetLabel}
            </p>

            {!spotlightRect ? (
              <p className="tutorial-guide-overlay__missing">
                この場所はまだ準備中です。後続 PBI で対象が増えても、同じ仕組みで差し替えできます。
              </p>
            ) : null}

            <div className="tutorial-guide-overlay__actions">
              <button
                className="button button--ghost tutorial-guide-overlay__button tutorial-guide-overlay__button--secondary"
                type="button"
                onClick={handleDefer}
              >
                あとで見る
              </button>

              <button
                className="button button--ghost tutorial-guide-overlay__button tutorial-guide-overlay__button--secondary"
                type="button"
                onClick={handleSkip}
              >
                スキップ
              </button>

              <div className="tutorial-guide-overlay__nav">
                <button
                  className="button button--ghost tutorial-guide-overlay__button tutorial-guide-overlay__button--secondary"
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                >
                  戻る
                </button>
                <button
                  className="button tutorial-guide-overlay__button"
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      handleComplete();
                      return;
                    }

                    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                  }}
                >
                  {isLastStep ? "完了" : "次へ"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
