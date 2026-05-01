# CLAUDE.md

GodSandbox の Claude 系 agent 向け共通運用メモです。

このファイルには、全agentで共有できる運用ルールだけを書きます。
個人PCのパス、ローカル環境名、個別アカウント設定、secret、API key、token は書かないでください。

---

## 基本方針

- PBI単位で作業する。
- Issue / branch / PR / label / scope を紐づける。
- PR本文には `Closes #<issue-number>` を入れる。
- 原則として `manual-review-required` label を付ける。
- scope外ファイルを変更しない。
- 実装役は自分でmergeしない。
- Product Owner が明示許可した監査役だけが、blockerなし・CI成功・scope確認済みの場合に限り approve / merge してよい。

---

## 書いてはいけない情報

- 個人PCの絶対パス
- ユーザー名やローカル環境名
- secret
- API key
- token
- private credential
- ローカル起動設定
- agent個別の一時メモ

個人用メモが必要な場合は、Git管理外のローカルファイルを使ってください。

---

## 参照ドキュメント

- `docs/agent-operating-rules.md`
- `docs/agent-pr-checklists.md`

PBI指示を作るときは、固定ルールを長文で再掲せず、上記ドキュメントを前提にして今回差分だけを書くことを推奨します。
