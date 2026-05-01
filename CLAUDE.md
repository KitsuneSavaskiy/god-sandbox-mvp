# CLAUDE.md

GodSandbox の Claude 系 agent 向け共通運用メモです。

## 最重要ルール

- Claude は同じ PR で実装役と監査役を兼任しない。
- PBI が要求する場合は `Issue -> branch -> PR` の順で進める。
- agent は原則として自分の判断で approve / merge しない。
- PR 作成者は自分の PR を approve しない。
- PO が明示許可した監査役だけが、blocker なし・CI 成功・scope 確認済みのときに限り approve / merge してよい。
- 迷ったら `manual-review-required` を選ぶ。
- `AGENTS.md`、`CLAUDE.md`、commit する docs に、個人パス、secret、API key、token、ローカル環境名、個別アカウント設定を書かない。

## 参照ドキュメント

- `docs/agent-operating-rules.md`
- `docs/agent-pr-checklists.md`

固定ルールはこのファイルに長文で再掲せず、各 PBI では今回差分だけを書く。
