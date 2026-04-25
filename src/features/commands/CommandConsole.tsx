import { FormEvent, useState } from "react";
import type { LogEntry } from "../../domain/types";

interface CommandConsoleProps {
  disabled: boolean;
  logs: LogEntry[];
  onSubmit: (input: string) => void;
}

export function CommandConsole({ disabled, logs, onSubmit }: CommandConsoleProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onSubmit(input);
    setInput("");
  };

  return (
    <section className="panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">command</p>
          <h2>神託入力</h2>
        </div>
        <span className="command-hint">
          例: <code>watch Aki</code> / <code>bless</code> / <code>test Ren</code>
        </span>
      </div>

      <form className="command-form" onSubmit={handleSubmit}>
        <input
          disabled={disabled}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={disabled ? "イベント中はモーダルから介入してください" : "watch / bless / test + 対象名"}
        />
        <button className="button" type="submit" disabled={disabled}>
          送る
        </button>
      </form>

      <div className="subpanel">
        <h3>最近のログ</h3>
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id} className={`log-list__item log-list__item--${log.tone}`}>
              {log.message}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
