import { useEffect, useState } from "react";
import type { Character, JudgementResult, WorldEvent } from "../../domain/types";
import "./FirstActionGuide.css";

const TUTORIAL_DISMISSED_KEY = "godsandbox.apostleTutorialGuide.dismissed.v1";

function readTutorialDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(TUTORIAL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeTutorialDismissed() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TUTORIAL_DISMISSED_KEY, "true");
  } catch {
    // 保存できない環境でも案内自体は使えるため、次回再表示だけ許容します。
  }
}

interface FirstActionGuideProps {
  activeEvent: WorldEvent | null;
  characters: Character[];
  focusedCharacter?: Character;
  hasLivingCharacters: boolean;
  latestJudgement: JudgementResult | null;
  phase: "observing" | "event";
  tick: number;
  timeControl: "stopped" | "slow" | "normal";
  onSelectCharacter: (characterId: string) => void;
  onStartBlessTutorial: () => void;
  onStepTick: () => void;
}

export function FirstActionGuide({
  activeEvent,
  characters,
  focusedCharacter,
  hasLivingCharacters,
  latestJudgement,
  phase,
  tick,
  timeControl,
  onSelectCharacter,
  onStartBlessTutorial,
  onStepTick,
}: FirstActionGuideProps) {
  const isEventOpen = phase === "event";
  const livingCharacters = characters.filter((character) => character.alive);
  const blessSucceeded = hasBlessSuccess(latestJudgement);
  const tutorialBlessEvent = activeEvent?.tutorialKind === "firstBless";
  const canStep = hasLivingCharacters && !isEventOpen;
  const canStartBlessTutorial = hasLivingCharacters && !isEventOpen && !blessSucceeded;
  const guide = getGuideState({
    blessSucceeded,
    focusedCharacterName: focusedCharacter?.name,
    hasLivingCharacters,
    isEventOpen,
    tick,
    timeControl,
    tutorialBlessEvent,
  });
  const [isTutorialDismissed, setIsTutorialDismissed] = useState(readTutorialDismissed);

  useEffect(() => {
    if (!isTutorialDismissed) {
      return;
    }

    writeTutorialDismissed();
  }, [isTutorialDismissed]);

  return (
    <section className="first-action-guide" aria-labelledby="first-action-guide-title">
      <div className="first-action-guide__copy">
        <p className="first-action-guide__eyebrow">使徒の案内</p>
        <h2 id="first-action-guide-title">ここはAIキャラが暮らす箱庭です</h2>
        <p>
          神様として世界を見守り、変化が起きたらキャラにどう関わるかを選びます。
        </p>
        {canStartBlessTutorial ? (
          <section className="first-action-guide__selector" aria-label="代表キャラを選ぶ">
            <div className="first-action-guide__selector-header">
              <span className="first-action-guide__step-chip">1. 代表キャラを選ぶ</span>
              <span className="first-action-guide__step-chip">2. Bless で助ける</span>
              <span className="first-action-guide__step-chip">3. 良い変化を見る</span>
            </div>
            <p className="first-action-guide__selector-copy">
              まずは 1 人だけ選んで見守ります。選んだキャラは箱庭で光り、視点もその子を追います。
            </p>
            <div className="first-action-guide__character-list">
              {livingCharacters.map((character) => (
                <button
                  key={character.id}
                  className={[
                    "first-action-guide__character-button",
                    focusedCharacter?.id === character.id ? "first-action-guide__character-button--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  onClick={() => onSelectCharacter(character.id)}
                >
                  <span className="first-action-guide__character-name">{character.name}</span>
                  <span className="first-action-guide__character-meta">
                    {character.role} / {character.element} / 残寿命 {character.lifespanRemaining}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {!isTutorialDismissed ? (
          <div className="first-action-guide__apostle" role="note" aria-label="使徒からの短い案内">
            <span className="first-action-guide__apostle-mark" aria-hidden="true">
              使徒
            </span>
            <p>{guide.apostleLine}</p>
            <button
              className="first-action-guide__dismiss"
              type="button"
              onClick={() => setIsTutorialDismissed(true)}
            >
              あとで見る
            </button>
          </div>
        ) : null}
      </div>

      <div className="first-action-guide__action-card first-action-guide__action-card--highlight" aria-label="次にすること">
        <span className="first-action-guide__status">{guide.status}</span>
        {canStartBlessTutorial ? (
          <>
            {focusedCharacter ? (
              <div className="first-action-guide__selected-card" aria-label="選択中の代表キャラ">
                <strong>{focusedCharacter.name} を助けてみましょう</strong>
                <span>
                  {focusedCharacter.bloodlineName} / {focusedCharacter.role} / {focusedCharacter.element}
                </span>
                <span>箱庭では光る輪で追いかけます。まずは Bless を選んで、良い変化を見てみます。</span>
              </div>
            ) : null}
            <button
              className="first-action-guide__cta"
              type="button"
              disabled={!focusedCharacter}
              onClick={onStartBlessTutorial}
            >
              {guide.ctaLabel}
            </button>
          </>
        ) : isEventOpen ? (
          <div className="first-action-guide__cta first-action-guide__cta--notice">
            {guide.ctaLabel}
          </div>
        ) : (
          <button className="first-action-guide__cta" type="button" disabled={!canStep} onClick={onStepTick}>
            {guide.ctaLabel}
          </button>
        )}
        <p className="first-action-guide__hint">{guide.hint}</p>
        {blessSucceeded && focusedCharacter ? (
          <p className="first-action-guide__success-note">
            {focusedCharacter.name} には良い変化が起きました。残寿命や加護の変化を見ながら、もう少し見守れます。
          </p>
        ) : tutorialBlessEvent ? (
          <p className="first-action-guide__success-note">
            いま開いている出来事カードで Bless を押すと、初回の成功体験として良い変化を確認できます。
          </p>
        ) : null}
      </div>
    </section>
  );
}

function hasBlessSuccess(judgement: JudgementResult | null) {
  return (
    judgement?.action === "bless" &&
    (judgement.rank === "success" || judgement.rank === "greatSuccess" || judgement.rank === "critical")
  );
}

function getGuideState({
  blessSucceeded,
  focusedCharacterName,
  hasLivingCharacters,
  isEventOpen,
  tick,
  timeControl,
  tutorialBlessEvent,
}: {
  blessSucceeded: boolean;
  focusedCharacterName?: string;
  hasLivingCharacters: boolean;
  isEventOpen: boolean;
  tick: number;
  timeControl: "stopped" | "slow" | "normal";
  tutorialBlessEvent: boolean;
}) {
  if (!hasLivingCharacters) {
    return {
      status: "現在地: キャラを準備中",
      ctaLabel: "キャラを準備中",
      hint: "キャラクターが現れたら、ここから観察を始められます。",
      apostleLine: "まずは箱庭にキャラが現れるのを待ちましょう。準備ができたら、次の一手を案内します。",
    };
  }

  if (tutorialBlessEvent) {
    return {
      status: "現在地: Bless を選ぶ場面",
      ctaLabel: "開いた出来事カードで Bless を選ぶ",
      hint: "今回は Bless で良い変化が起きるように整えています。下の出来事カードを読んで、そのまま Bless を押せば大丈夫です。",
      apostleLine: focusedCharacterName
        ? `${focusedCharacterName} を助ける場を整えました。ここでは Bless を選べば、良い方向へ動く感覚をつかめます。`
        : "助ける場を整えました。ここでは Bless を選べば、良い方向へ動く感覚をつかめます。",
    };
  }

  if (isEventOpen) {
    return {
      status: "現在地: 出来事が発生中",
      ctaLabel: "起きた出来事を見る",
      hint: "表示中の出来事カードで、キャラにどう関わるかを選びましょう。",
      apostleLine: "出来事が起きました。カードを見て、このキャラにどう関わるか選びましょう。",
    };
  }

  if (blessSucceeded) {
    return {
      status: "現在地: Bless の成功を確認済み",
      ctaLabel: timeControl === "stopped" ? "少し時間を進める" : "もう少し見守る",
      hint: "助けたあとの変化を追う時間です。箱庭を少し進めて、次の出来事を見てみましょう。",
      apostleLine: focusedCharacterName
        ? `${focusedCharacterName} には良い変化が起きました。次は少し見守って、その余韻を確かめましょう。`
        : "良い変化が起きました。次は少し見守って、その余韻を確かめましょう。",
    };
  }

  if (tick === 0) {
    return {
      status: "現在地: 代表キャラを選ぶ",
      ctaLabel: focusedCharacterName ? `${focusedCharacterName} を Bless で助ける` : "Bless で助けてみる",
      hint: "選んだキャラは箱庭で光ります。まずは 1 人を助けて、Bless で良い変化が起きる流れを見てみましょう。",
      apostleLine: focusedCharacterName
        ? `まずは ${focusedCharacterName} を代表キャラにしてみましょう。この子を助けると、箱庭での最初の成功体験をつかめます。`
        : "最初は 1 人だけ選べば大丈夫です。選んだキャラを Bless で助けて、最初の成功体験へ進みましょう。",
    };
  }

  if (timeControl === "stopped") {
    return {
      status: "現在地: 代表キャラを助ける準備",
      ctaLabel: focusedCharacterName ? `${focusedCharacterName} を Bless で助ける` : "Bless で助けてみる",
      hint: "見守るだけでなく、最初は助ける体験から入ると遊び方がつかみやすくなります。",
      apostleLine: focusedCharacterName
        ? `${focusedCharacterName} を選べています。次は Bless で助けて、良い変化をひとつ見てみましょう。`
        : "次は Bless で助ける体験へ進みましょう。",
    };
  }

  return {
    status: "現在地: 観察中",
    ctaLabel: focusedCharacterName ? `${focusedCharacterName} を Bless で助ける` : "Bless で助けてみる",
    hint: "いまからでも代表キャラを助ける導線へ戻れます。良い変化を見たあとで、観察の流れを続けられます。",
    apostleLine: focusedCharacterName
      ? `いまは ${focusedCharacterName} を追えています。最初の Bless 成功を見てからでも、世界の流れは十分つかめます。`
      : "最初の Bless 成功を見てからでも、世界の流れは十分つかめます。",
  };
}
