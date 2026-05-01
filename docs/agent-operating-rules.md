# AI並行開発の固定運用ルール

PBI-OPS-AGENT-INSTRUCTION-TEMPLATE-001 対応ドキュメント

---

## 目的

GodSandbox のAI並行開発で、毎回の長文指示を短くしながら、scope管理・監査精度・CI確認の安全性を維持する。

この文書は固定運用ルールをまとめる。各PBIの指示では、ここに書かれた共通ルールを繰り返さず、今回差分だけを書く。

---

## 固定運用ルール

- PBI単位で作業する。
- PBIごとに GitHub Issue / branch / PR / label / scope を分ける。
- 作業前に GitHub Issue を作る。
- PR本文には `Closes #<issue-number>` を入れる。
- PRには原則 `manual-review-required` label を付ける。
- routine扱いが明確なdocs-onlyでも、判断に迷う場合は `manual-review-required` を選ぶ。
- scope外ファイルを変更しない。
- 複数PBIを1つのPRに混ぜない。
- 未追跡のローカル補助ファイルをcommitしない。
- package / CI / secret / native project 変更は、PBIで明示許可がない限り禁止する。
- PR前に changed files と確認コマンド結果をPR本文へ書く。

---

## merge権限ルール

原則:

- 実装役agentは自分でmergeしない。
- 監査役は実diff、scope、CI、Issue/PR整合を確認する。
- Product Owner が最終merge判断を持つ。

例外:

- Product Owner が事前に明示許可した監査役は approve / merge してよい。
- ただし、次の条件をすべて満たす場合に限る。
  - blocker がない
  - CI が成功している
  - changed files がscope内に閉じている
  - PR本文に対象PBI、Issue、`Closes #...`、確認結果がある
  - 必要なlabelが付いている
  - merge順の依存が解消されている

不明点がある場合はmergeしない。
「たぶん大丈夫」でmergeせず、blockerまたは確認事項として報告する。

---

## レーン境界

| レーン | 主担当 | 触ってよい代表範囲 | 原則触らない範囲 |
|---|---|---|---|
| CodexA | 実装・修正の一部レーン | PBIで指定されたコード、script、sampleなど | 他レーン指定ファイル、scope外docs、package、CI |
| CodexB | docs / 設計 / 補助実装レーン | PBIで指定されたdocsまたは限定ファイル | Claude担当docs、CodexA担当ファイル、package、CI |
| ClaudeA | docs / 設計 / 監査補助レーン | PBIで指定されたdocs | Codex担当ファイル、scope外コード |
| 監査役 | 実diff監査 | GitHub Issue、PR、diff、CI、label、review comment | scope外実装、勝手な修正 |
| ChatGPT / オーケストレーター | PBI分解・優先順位・レーン設計 | 指示文、判断整理、次アクション設計 | repo内ファイルの直接編集 |

実際のPBI指示で上表より狭い範囲が指定された場合は、PBI指示を優先する。

---

## AGENTS.md / CLAUDE.md に書く情報

書いてよいもの:

- 全agent共通の運用ルール
- レーン境界の考え方
- Issue / PR / label / merge の共通方針
- secret を書かない方針
- 個人パスを書かない方針

書いてはいけないもの:

- 個人PCの絶対パス
- ユーザー名
- ローカル環境名
- 個別アカウント設定
- secret
- API key
- token
- private credential
- ローカル起動専用の一時メモ

ローカル固有のメモは Git 管理外のファイルに置く。

---

## PBI指示テンプレ

```md
PBI:

目的:

担当レーン:

変更してよいファイル:
-

絶対触らないファイル:
-

今回やること:
1.

今回やらないこと:
-

受け入れ条件:
-

確認コマンド:
- `git diff --name-only origin/main...HEAD`
- `git diff --check origin/main...HEAD`
- `npm run typecheck`
- `npm run build`

PR本文に必ず書くこと:
- 対象PBI
- 対応Issue
- `Closes #<issue-number>`
- branch
- 変更ファイル
- 今回やったこと
- 今回やらないこと
- scope外変更がないこと
- 確認コマンドと結果
- 監査役に見てほしい点

merge順 / 依存:
-
```

---

## Current State Memo テンプレ

```md
## Current State Memo

active PR:
-

active issue:
-

recently merged:
-

duplicate候補:
-

close候補:
-

next recommended action:
-
```

このメモは、次のagentが履歴を掘らずに現在地を理解するために使う。

---

## 指示を短くする書き方

固定ルールはこの文書へ寄せる。
各PBIでは次だけを目立たせる。

- 成功条件
- 変更してよいファイル
- 絶対触らないファイル
- 今回だけの判断
- merge順や依存

長い禁止リストを毎回貼るより、今回だけ危険な境界を短く明記する。
