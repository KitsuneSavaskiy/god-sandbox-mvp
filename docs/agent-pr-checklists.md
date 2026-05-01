# PR作成・監査チェックリスト

PBI-OPS-AGENT-INSTRUCTION-TEMPLATE-001 対応ドキュメント

---

## 目的

PR作成前と監査時の確認を固定化し、scope混入、CI未確認、古いbranchのままのmerge、Issue/PR不整合を防ぐ。

---

## PR preflight checklist

PR作成前に確認する。

### 1. branchとmain追従

```bash
git fetch origin
git branch --show-current
git status --short
```

- tracked変更がある状態で別PBIを始めない。
- 未追跡ファイルをPBI成果物に混ぜない。
- 必要なら専用worktreeを作る。

```bash
git worktree add -b <branch-name> ../<worktree-name> origin/main
```

### 2. changed files

```bash
git diff --name-only origin/main...HEAD
```

確認すること:

- 変更ファイルがPBI scope内だけか
- 他レーン担当ファイルが混ざっていないか
- package / CI / secret / native project が無許可で混ざっていないか
- READMEやdocsが対象外なのに混ざっていないか

### 3. whitespace

```bash
git diff --check origin/main...HEAD
```

trailing whitespace や conflict marker がないことを確認する。

### 4. 指定確認コマンド

PBIで指定されたコマンドを実行する。

基本:

```bash
npm run typecheck
npm run build
```

必要に応じて:

```bash
npm run test:domain
npm run passport:smoke
node --check <file>
```

実行できない場合は、理由をPR本文に書く。

### 5. PR本文

PR本文に必ず書く。

- 対象PBI
- 対応Issue
- `Closes #<issue-number>`
- branch
- 変更ファイル
- 今回やったこと
- 今回やらないこと
- scope外変更がないこと
- 確認コマンドと結果
- smoke対象有無
- 監査役に見てほしい点
- merge順や依存がある場合の注意

### 6. label

- 原則 `manual-review-required`
- routineが明確なdocs-onlyのみ `agent-routine` を検討してよい
- protected path、設計影響、package、CI、secret、agent-control を含む場合は必ず `manual-review-required`

---

## PR audit checklist

監査役は自己申告ではなく、Issueと実diffから確認する。
監査では GitHub上の PR diff / changed files を正本にする。
ローカル working tree の汚れや未追跡ファイルを監査対象に混ぜない。
ローカルで再現確認する場合は、対象PR branchを clean worktree に取得して確認する。
`git diff --name-only origin/main...HEAD` は、実装者preflightまたは clean PR branch 上の補助確認として扱う。

### 1. 紐づけ

- Issue があるか
- PR本文に `Closes #...` があるか
- IssueからPRへ辿れるか
- PBI名、branch、PR内容が一致しているか
- label が正しいか

### 2. changed files

正本:

- GitHub PR の Files changed
- GitHub API / `gh pr diff --name-only`

補助確認:

```bash
git diff --name-only origin/main...HEAD
```

確認すること:

- changed files がscope内か
- 禁止ファイルが混ざっていないか
- 他レーン担当ファイルが混ざっていないか
- 未追跡補助ファイル由来の成果物が混ざっていないか

### 3. 受け入れ条件

- PBIの受け入れ条件を満たしているか
- 今回やらないことに踏み込んでいないか
- docs-onlyならコード変更がないか
- code PBIなら必要な最小実装に閉じているか

### 4. 確認結果

- GitHub `build` が成功しているか
- GitHub `guard` が成功しているか
- PBI指定コマンドがPR本文に書かれているか
- 実行不能なコマンドの理由が妥当か
- BEHIND / DIRTY / conflict がないか

### 5. 判定

blocker:

- scope外ファイル混入
- Issue/PR不整合
- `Closes #...` なし
- required label なし
- CI失敗
- merge順依存の未解消
- security / secret / package / CI の無許可変更
- PBI目的と違う実装

comment:

- mergeは可能だが、後続で改善したい点
- 文言の補足
- follow-up PBI候補
- 読みやすさや導線の改善

approve:

- blockerなし
- CI成功
- changed filesがscope内
- PR本文が十分
- merge順依存がない、または解消済み

---

## merge前チェック

承認後でもmerge前に確認する。

- branch が base より behind ではないか
- `mergeStateStatus` が CLEAN または merge可能か
- CIが最新commitで成功しているか
- required label が残っているか
- 依存PRのmerge順が守られているか

実装役は自分でmergeしない。
Product Owner が明示許可した監査役だけが、条件を満たす場合に限り approve / merge できる。

---

## 監査コメントテンプレ

```md
結論:

対象PBI:
対象Issue:
対象PR:
branch:

変更ファイル:

確認済み:
- Issue / PR / Closes:
- label:
- changed files:
- scope:
- CI:
- 確認コマンド:

blocker:
- なし / あり

comment:
-

merge可否:
- 可 / 修正後可 / 不可
```
