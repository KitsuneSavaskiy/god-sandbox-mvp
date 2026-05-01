import { useEffect, useRef, useState } from "react";
import "./LoginOpeningMovie.css";

const LOGIN_OPENING_MOVIE_SRC = "/videos/login-opening.mp4";

interface LoginOpeningMovieProps {
  userName: string;
  onComplete: () => void;
}

export function LoginOpeningMovie({ userName, onComplete }: LoginOpeningMovieProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadFailed) {
      return;
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => setPlaybackBlocked(true));
    }
  }, [loadFailed]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.currentTime = 0;
    video.play()
      .then(() => setPlaybackBlocked(false))
      .catch(() => setPlaybackBlocked(true));
  };

  return (
    <main className="login-opening" aria-labelledby="login-opening-title">
      <section className="login-opening__card">
        <div className="login-opening__copy">
          <p className="login-opening__eyebrow">opening rite</p>
          <h1 id="login-opening-title">ようこそ、{userName}神</h1>
          <p>
            箱庭へ降りる前に、この世界のはじまりを少しだけ見届けましょう。
            ムービーが終わると、そのまま観察画面へ進みます。
          </p>
        </div>

        <div className="login-opening__movie-frame">
          {loadFailed ? (
            <div className="login-opening__fallback" role="status">
              <span>ムービーを準備中です</span>
              <p>
                `public/videos/login-opening.mp4` を配置すると、ログイン直後に10秒の
                ショートムービーが再生されます。
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="login-opening__movie"
              src={LOGIN_OPENING_MOVIE_SRC}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={onComplete}
              onError={() => setLoadFailed(true)}
            />
          )}
        </div>

        <div className="login-opening__actions">
          {playbackBlocked && !loadFailed && (
            <button className="button button--ghost" type="button" onClick={handleReplay}>
              ムービーを再生
            </button>
          )}
          <button className="button login-opening__skip" type="button" onClick={onComplete}>
            箱庭へ入る
          </button>
        </div>
      </section>
    </main>
  );
}
