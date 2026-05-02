# AI並行開発の固定運用ルール

PBI-OPS-AGENT-INSTRUCTION-TEMPLATE-001 対応ドキュメント

## 目的

GodSandbox の AI 並行開発で、毎回の長文指示を短くしながら、scope 管理、監査精度、CI 確認の安全性を維持する。

この文書には固定ルールだけを書く。各 PBI の指示では、この文書を前提にして今回差分だけを明記する。

## 固定運用ルール

- ゲーム方針正本は `docs/game-plan.md` を参照する。
- PBI 単位で作業する。
- PBI ごとに Issue、branch、PR、label、scope を紐づける。
- PBI で要求された場合は、作業前に Issue を作る。
- `main` へ直接 push しない。
- 現在の checkout と宣言された file scope を越えて変更しない。越える必要が出たら、PO またはオーナー確認を先に取る。
- 複数 PBI を 1 つの PR に混ぜない。
- 未追跡のローカル補助ファイルを、PBI 成果物として混ぜない。
- policy、agent instruction、workflow、permission、secret、billing、dependency、protected path に触れる変更は `manual-review-required` を使う。迷った場合も同じ。
- `AGENTS.md`、`CLAUDE.md`、commit する docs には、個人パス、secret、API key、token、ローカル環境名、個別アカウント設定を書かない。
- UI 変更は build 成功だけで完了にしない。可能な範囲でブラウザ確認を行い、結果または未実施理由を PR 本文に書く。
- アート生成プロンプトを Git 管理する場合は `docs/art-prompts/` に置き、PO の個人画像、個人設定、secret、ローカルパスを含めない。
- `.logs/` は勝手に追加しない。ログや補助メモは原則 Git 管理外に置き、PR に入れる場合は PBI scope として明示する。
- 途中で止まるときは Current State Memo を残し、次の agent が履歴を掘らずに現在地を把握できるようにする。

## merge権限ルール

原則:

- agent は自分の判断で approve / merge しない。
- PR 作成者は自分の PR を approve しない。
- 同じ PR で実装役と監査役を兼任しない。
- 最終判断は Product Owner が持つ。

例外:

- Product Owner が事前に明示許可した監査役だけが approve / merge してよい。
- ただし、次の条件をすべて満たす場合に限る。
  - blocker がない
  - required CI が成功している
  - changed files が宣言 scope 内に閉じている
  - PR 本文に対象 PBI、対応 Issue、`Closes #...`、確認結果がある
  - 必要な label が付いている
  - 必要な review comment が解消済み、または PO が明示的に許可している

不明点がある場合は merge しない。blocker または確認事項として報告する。

## レーン境界表

| レーン | 主担当 | 主な責務 | 触ってよい範囲 | approve | merge |
| --- | --- | --- | --- | --- | --- |
| CodexA | 実装レーン | PBI 指定の実装、修正、補助変更 | PBI で許可された code / script / sample | No | No |
| CodexB | docs / ops レーン | docs、設計メモ、限定的な補助変更 | PBI で許可された docs と限定ファイル | No | No |
| ClaudeA | docs / 設計 / 監査補助レーン | docs 整備、設計整理、監査補助 | PBI で許可された docs | No | No |
| 監査役 | Claude 監査役または review-only agent | diff、scope、CI、label、review comment の確認 | 監査対象の Issue / PR / CI 情報。実装変更は PO 再指示がある場合のみ | Yes, if PO-authorized | Yes, if PO-authorized |
| Human owner / PO | プロジェクトオーナー | 例外判断、最終承認、merge 判断 | 制約なし | Yes | Yes |

実際の PBI 指示で上表より狭い範囲が指定された場合は、PBI 指示を優先する。

## AGENTS.md / CLAUDE.md の記載方針

書いてよいもの:

- 全 agent 共通の運用ルール
- レーン境界の考え方
- Issue / PR / label / merge の共通方針
- secret を書かない方針
- 個人パスを書かない方針

書いてはいけないもの:

- 個人 PC の絶対パス
- ユーザー名
- ローカル環境名
- 個別アカウント設定
- secret
- API key
- token
- private credential
- ローカル起動専用の一時メモ

ローカル固有のメモは Git 管理外のファイルに置く。

## PBI差分指示テンプレ

```md
PBI:
<PBI-ID>

目的:
<今回変えることと成功条件>

担当レーン:
<CodexA / CodexB / ClaudeA / 監査役 など>

Required before work:
- Issue: <required / optional / #number>
- branch: <branch-name>
- PR route: <agent-routine | manual-review-required>

変更してよいファイル:
- <path>

絶対触らないファイル:
- <path or glob>

今回やること:
- <今回差分>

今回やらないこと:
- <非対象>

受け入れ条件:
- <done criteria>

確認コマンド:
- `git diff --name-only origin/main...HEAD`
- `git diff --check origin/main...HEAD`
- `npm run typecheck`
- `npm run build`
- <必要に応じて追加>

PR本文に必ず書くこと:
- 対象PBI
- 対応Issue
- `Closes #<issue-number>`
- branch
- changed files
- 今回やったこと
- 今回やらないこと
- scope外変更がないこと
- 確認コマンドと結果
- 監査役に見てほしい点

merge権限:
- 原則: agent は勝手に approve / merge しない
- 例外: PO が明示許可した監査役のみ、blocker なし・CI 成功・scope 確認済みのときに限り approve / merge 可

merge順 / 依存:
- <必要なら記入>
```

## Current State Memo テンプレ

```md
## Current State Memo

- PBI:
- Issue:
- Branch:
- PR:
- Role:
- Declared scope:
- Files changed:
- Completed:
- Checks run:
- Checks pending:
- Blockers / risks:
- Next recommended action:
```

## 指示を短くする書き方

固定ルールはこの文書へ寄せる。各 PBI では次だけを目立たせる。

- 成功条件
- 変更してよいファイル
- 絶対触らないファイル
- 今回だけの判断
- merge順や依存
