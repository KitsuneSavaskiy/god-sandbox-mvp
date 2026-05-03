import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { APOSTLE_GUIDE_SPRITE } from "../../assets/artPaths";
import "./TutorialGuideOverlay.css";

const TUTORIAL_DEFERRED_KEY = "godsandbox.tutorialGuideOverlayInteractionLock.deferred.v1";
const TUTORIAL_COMPLETED_KEY = "godsandbox.tutorialGuideOverlayInteractionLock.completed.v1";
const MOBILE_BUBBLE_BREAKPOINT = 860;
const MOBILE_LAYOUT_BREAKPOINT = 640;
const TUTORIAL_APOSTLE_FRAME_INTERVAL_MS = 560;
const TUTORIAL_TARGET_ADVANCE_DELAY_MS = 140;

export interface TutorialGuideStep {
  id: string;
  title: string;
  body: string;
  apostleLine: string;
  targetLabel: string;
  targetAnchor?: string;
  highlightPadding?: number;
  scrollBlock?: ScrollLogicalPosition;
  advanceMode?: "manual" | "targetClick";
  completeOnTargetClick?: boolean;
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

interface GuideLayout {
  bubbleStyle: CSSProperties;
  spriteStyle: CSSProperties;
  compact: boolean;
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
  if (!step.targetAnchor || typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(`[data-tutorial-anchor="${step.targetAnchor}"]`);
}

function createSpotlightRect(rect: DOMRect, padding: number): SpotlightRect {
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  };
}

function createGuideLayout(spotlightRect: SpotlightRect | null): GuideLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const compact = viewportWidth <= MOBILE_BUBBLE_BREAKPOINT;
  const spriteSize = viewportWidth <= MOBILE_LAYOUT_BREAKPOINT ? 80 : 104;

  if (!spotlightRect) {
    return {
      bubbleStyle: compact
        ? {
            left: 12,
            right: 12,
            bottom: 12,
          }
        : {
            right: 16,
            bottom: 16,
            width: Math.min(360, viewportWidth - 32),
          },
      spriteStyle: compact
        ? {
            left: 16,
            bottom: viewportWidth <= MOBILE_LAYOUT_BREAKPOINT ? 288 : 316,
          }
        : {
            right: 312,
            bottom: 20,
          },
      compact,
    };
  }

  if (compact) {
    const targetLowerHalf = spotlightRect.top + spotlightRect.height / 2 > viewportHeight * 0.5;
    const bubbleStyle: CSSProperties = targetLowerHalf
      ? {
          top: 12,
          left: 12,
          right: 12,
        }
      : {
          left: 12,
          right: 12,
          bottom: 12,
        };
    const spriteTop = targetLowerHalf
      ? clamp(spotlightRect.top + spotlightRect.height + 10, 12, viewportHeight - spriteSize - 116)
      : clamp(spotlightRect.top - spriteSize - 12, 12, viewportHeight - spriteSize - 12);

    return {
      bubbleStyle,
      spriteStyle: {
        left: clamp(spotlightRect.left + spotlightRect.width - spriteSize * 0.66, 12, viewportWidth - spriteSize - 12),
        top: spriteTop,
      },
      compact,
    };
  }

  const bubbleWidth = Math.min(360, viewportWidth - 32);
  const bubbleHeight = 348;
  const canPlaceRight = spotlightRect.left + spotlightRect.width + bubbleWidth + 28 <= viewportWidth;
  const canPlaceLeft = spotlightRect.left - bubbleWidth - 28 >= 0;
  const useRight = canPlaceRight || !canPlaceLeft;
  const left = useRight
    ? spotlightRect.left + spotlightRect.width + 18
    : clamp(spotlightRect.left - bubbleWidth - 18, 16, viewportWidth - bubbleWidth - 16);
  const preferredTop = spotlightRect.top + spotlightRect.height + 18;
  const top = preferredTop + bubbleHeight <= viewportHeight
    ? preferredTop
    : clamp(spotlightRect.top - bubbleHeight - 18, 16, viewportHeight - bubbleHeight - 16);

  return {
    bubbleStyle: {
      top,
      left,
      width: bubbleWidth,
    },
    spriteStyle: {
      left: useRight
        ? clamp(left - spriteSize * 0.46, 12, viewportWidth - spriteSize - 12)
        : clamp(left + bubbleWidth - spriteSize * 0.5, 12, viewportWidth - spriteSize - 12),
      top: clamp(top - spriteSize * 0.54, 12, viewportHeight - spriteSize - 12),
    },
    compact,
  };
}

export function TutorialGuideOverlay({ steps, suspended = false }: TutorialGuideOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isDeferred, setIsDeferred] = useState(readStoredFlag(TUTORIAL_DEFERRED_KEY));
  const [isCompleted, setIsCompleted] = useState(readStoredFlag(TUTORIAL_COMPLETED_KEY));
  const [isHiddenForSession, setIsHiddenForSession] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [bubbleStyle, setBubbleStyle] = useState<CSSProperties>({});
  const [spriteStyle, setSpriteStyle] = useState<CSSProperties>({});
  const [isSpriteReady, setIsSpriteReady] = useState(false);
  const [apostleFrame, setApostleFrame] = useState<TutorialSpriteFrame>(APOSTLE_GUIDE_SPRITE.motions.idle[0]);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLDivElement | null>(null);
  const targetAdvanceTimeoutRef = useRef<number | null>(null);
  const isOpen = !isCompleted && !isDeferred && !isHiddenForSession;
  const activeStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const apostleMotion = stepIndex >= Math.max(1, steps.length - 2) ? "guidePoint" : "idle";
  const advanceMode = activeStep.advanceMode ?? "manual";
  const isTargetInteractionStep = advanceMode === "targetClick";
  const targetProgressLabel = useMemo(() => {
    if (advanceMode !== "targetClick") {
      return isLastStep ? "完了" : "次へ";
    }

    return activeStep.completeOnTargetClick ? "対象を押すと完了" : "対象を押すと進む";
  }, [activeStep.completeOnTargetClick, advanceMode, isLastStep]);

  const advanceFromTarget = () => {
    if (activeStep.completeOnTargetClick || isLastStep) {
      handleComplete();
      return;
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  useEffect(() => {
    return () => {
      if (highlightedElementRef.current) {
        delete highlightedElementRef.current.dataset.tutorialHighlighted;
      }

      if (targetAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(targetAdvanceTimeoutRef.current);
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
      setSpriteStyle({});
      return;
    }

    let frameId = 0;
    let timeoutId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateHighlight = () => {
      const target = getTargetElement(activeStep);

      if (highlightedElementRef.current && highlightedElementRef.current !== target) {
        delete highlightedElementRef.current.dataset.tutorialHighlighted;
      }

      highlightedElementRef.current = target;

      if (!target) {
        setSpotlightRect(null);
        const layout = createGuideLayout(null);
        setBubbleStyle(layout.bubbleStyle);
        setSpriteStyle(layout.spriteStyle);
        return;
      }

      target.dataset.tutorialHighlighted = "true";
      const rect = target.getBoundingClientRect();
      const nextSpotlightRect = createSpotlightRect(rect, activeStep.highlightPadding ?? 14);
      const layout = createGuideLayout(nextSpotlightRect);
      setSpotlightRect(nextSpotlightRect);
      setBubbleStyle(layout.bubbleStyle);
      setSpriteStyle(layout.spriteStyle);
    };

    const target = getTargetElement(activeStep);
    if (target) {
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: activeStep.scrollBlock ?? (window.innerWidth <= MOBILE_BUBBLE_BREAKPOINT ? "center" : "nearest"),
        inline: "nearest",
      });

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          window.requestAnimationFrame(updateHighlight);
        });
        resizeObserver.observe(target);
      }
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
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [activeStep, isOpen, suspended]);

  useEffect(() => {
    if (!isOpen || suspended || !isTargetInteractionStep) {
      return;
    }

    const target = getTargetElement(activeStep);
    if (!target) {
      return;
    }

    const handleTargetActivation = () => {
      if (targetAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(targetAdvanceTimeoutRef.current);
      }

      targetAdvanceTimeoutRef.current = window.setTimeout(() => {
        advanceFromTarget();
      }, TUTORIAL_TARGET_ADVANCE_DELAY_MS);
    };

    target.addEventListener("click", handleTargetActivation);

    return () => {
      target.removeEventListener("click", handleTargetActivation);
      if (targetAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(targetAdvanceTimeoutRef.current);
        targetAdvanceTimeoutRef.current = null;
      }
    };
  }, [activeStep, isOpen, isTargetInteractionStep, suspended]);

  useEffect(() => {
    if (!isOpen || suspended || typeof document === "undefined") {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const isAllowedNode = (eventTarget: EventTarget | null) => {
      const targetNode = eventTarget instanceof Node ? eventTarget : null;
      if (!targetNode) {
        return false;
      }

      if (bubbleRef.current?.contains(targetNode) || launcherRef.current?.contains(targetNode)) {
        return true;
      }

      if (highlightedElementRef.current?.contains(targetNode)) {
        return true;
      }

      return false;
    };

    const preventOutsideInteraction = (event: Event) => {
      if (isAllowedNode(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) {
        event.stopImmediatePropagation();
      }
    };

    const preventBackgroundScroll = (event: Event) => {
      if (bubbleRef.current?.contains(event.target as Node)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) {
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("pointerdown", preventOutsideInteraction, true);
    document.addEventListener("click", preventOutsideInteraction, true);
    document.addEventListener("touchstart", preventOutsideInteraction, { capture: true, passive: false });
    document.addEventListener("wheel", preventBackgroundScroll, { capture: true, passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { capture: true, passive: false });

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("pointerdown", preventOutsideInteraction, true);
      document.removeEventListener("click", preventOutsideInteraction, true);
      document.removeEventListener("touchstart", preventOutsideInteraction, true);
      document.removeEventListener("wheel", preventBackgroundScroll, true);
      document.removeEventListener("touchmove", preventBackgroundScroll, true);
    };
  }, [isOpen, suspended]);

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
        <div className="tutorial-guide-overlay__launcher-row" ref={launcherRef}>
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

          {isSpriteReady ? (
            <div className="tutorial-guide-overlay__sprite-guide" aria-hidden="true" style={spriteStyle}>
              <div className="tutorial-guide-overlay__apostle-sprite-shell">
                <div
                  className="tutorial-guide-overlay__apostle-sprite"
                  style={{
                    backgroundImage: `url(${APOSTLE_GUIDE_SPRITE.sheet})`,
                    backgroundPosition: `calc(var(--tutorial-apostle-frame-width) * ${-apostleFrame.column}) calc(var(--tutorial-apostle-frame-height) * ${-apostleFrame.row})`,
                    backgroundSize: `calc(var(--tutorial-apostle-frame-width) * ${APOSTLE_GUIDE_SPRITE.columns}) calc(var(--tutorial-apostle-frame-height) * ${APOSTLE_GUIDE_SPRITE.rows})`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <section
            ref={bubbleRef}
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
              <p className="tutorial-guide-overlay__apostle">{activeStep.apostleLine}</p>
            </div>
            <p className="tutorial-guide-overlay__target">
              <strong>見る場所:</strong> {activeStep.targetLabel}
            </p>

            {isTargetInteractionStep ? (
              <p className="tutorial-guide-overlay__target-lock">
                光っている対象だけが押せます。{activeStep.completeOnTargetClick ? "この操作で案内は完了します。" : "押すと次へ進みます。"}
              </p>
            ) : null}

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
                  disabled={isTargetInteractionStep}
                  onClick={() => {
                    if (isTargetInteractionStep) {
                      return;
                    }

                    if (isLastStep) {
                      handleComplete();
                      return;
                    }

                    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                  }}
                >
                  {targetProgressLabel}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
