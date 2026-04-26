import { FormEvent, useState } from "react";

interface LoginScreenProps {
  onLogin: (name: string) => boolean;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = onLogin(input);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="eyebrow">god sandbox mvp</p>
        <h1 className="login-card__title">箱庭の神</h1>
        <p className="login-card__description">
          あなたはこの小さな世界を見守る神です。<br />
          名前を入力して、箱庭に降臨してください。
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className={`login-form__input${error ? " login-form__input--error" : ""}`}
            type="text"
            maxLength={32}
            placeholder="神の名を入力..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            autoFocus
          />
          {error && (
            <p className="login-form__error">名前を入力してください</p>
          )}
          <button className="button login-form__submit" type="submit">
            はじめる
          </button>
        </form>
      </div>
    </div>
  );
}
