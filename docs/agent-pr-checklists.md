# PR作成・監査チェックリスト

PBI-OPS-AGENT-INSTRUCTION-TEMPLATE-001 対応ドキュメント

## Route Reminder

- `agent-routine` は、小規模、可逆、低リスクで、policy、agent instruction、workflow、permission、secret、billing、dependency、protected path に触れない変更に限る。
- docs-only でも、運用ルールや protected path に触れる場合は `manual-review-required` を使う。
- 原則として agent は自分の判断で merge しない。
- 例外として、PO が明示許可した監査役だけが、blocker なし・CI 成功・scope 確認済みの場合に限り approve / merge してよい。

## PR preflight checklist

### 1. branch と作業ツリー

```bash
git branch --show-current
git status --short
```

- [ ] branch 名が active PBI と一致している。
- [ ] tracked / untracked の不要ファイルを別 PBI 成果物として混ぜていない。
- [ ] 別レーンの着手中ファイルを巻き込んでいない。

### 2. changed files

```bash
git diff --name-only origin/main...HEAD
```

- [ ] changed files が PBI の許可ファイルに閉じている。
- [ ] 禁止ファイル、scope 外ファイル、他レーン担当ファイルが混ざっていない。
- [ ] package、CI、secret、native project 変更が無許可で混ざっていない。

### 3. whitespace と conflict

```bash
git diff --check origin/main...HEAD
```

- [ ] trailing whitespace と conflict marker がない。

### 4. required verification

```bash
npm run typecheck
npm run build
```

- [ ] PBI 指定コマンドを実行した。
- [ ] 実行できなかったコマンドがある場合、理由を PR 本文に明記した。
- [ ] pass / fail を PR 本文に正直に記録した。

### 5. PR本文と label

- [ ] 対応 Issue がある。
- [ ] PR 本文に `Closes #<issue-number>` がある。
- [ ] PR 本文に branch、changed files、今回やったこと、今回やらないこと、scope 外変更がないこと、確認コマンド結果、監査役に見てほしい点がある。
- [ ] label が `agent-routine` または `manual-review-required` のどちらかで、実際の risk と一致している。
- [ ] `AGENTS.md`、`CLAUDE.md`、commit する docs に個人パス、secret、API key、token、ローカル環境名、個別アカウント設定が入っていない。
- [ ] `AGENTS.md` / `CLAUDE.md` は参照導線と最重要ルール中心で、詳細は `docs/` に寄せている。

## PR audit checklist

### 1. role と紐づけ

監査役は自己申告ではなく、Issue と実 diff から確認する。
監査では GitHub 上の PR diff / changed files を正本にする。
ローカル working tree の汚れや未追跡ファイルを監査対象に混ぜない。
ローカルで再現確認する場合は、対象 PR branch を clean worktree に取得して確認する。
`git diff --name-only origin/main...HEAD` は、実装者 preflight または clean PR branch 上の補助確認として扱う。

- [ ] 監査役は PR 作成者本人ではない。
- [ ] 同じ PR で実装役と監査役を兼任していない。
- [ ] Issue、branch、PR、label、PBI 名が整合している。
- [ ] `Closes #...` が正しい Issue を指している。

### 2. diff と scope

正本:

- GitHub PR の Files changed
- GitHub API / `gh pr diff --name-only`

補助確認:

```bash
git diff --name-only origin/main...HEAD
```

- [ ] changed files が宣言 scope 内に閉じている。
- [ ] 禁止ファイルや未説明の変更が混ざっていない。
- [ ] docs-only PBI なら実装変更がない。

### 3. checks と CI

```bash
git diff --check origin/main...HEAD
```

- [ ] `git diff --check` が clean。
- [ ] PBI 指定コマンドの結果が PR 本文と整合している。
- [ ] required CI が最新 commit で green。
- [ ] 実行不能なコマンドの理由が妥当で、PO の判断材料として十分。

### 4. blocker 判定

- [ ] blocker がない。
- [ ] hidden scope expansion がない。
- [ ] review comment の未解消事項がない、または PO が明示的に許可している。
- [ ] merge 順依存がある場合、その前提が解消されている。

### 5. approve / merge 判定

- [ ] approve する理由を、scope、CI、risk の観点で説明できる。
- [ ] merge を検討する場合、PO の明示許可がある。
- [ ] merge を検討する場合、`docs/agent-operating-rules.md` の merge権限ルールをすべて満たしている。
