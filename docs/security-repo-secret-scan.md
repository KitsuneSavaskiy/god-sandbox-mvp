# Repository secret scan record

## 目的

この文書は、GodSandbox の Git 管理対象と Git 履歴に secret / API key / token / 個人パス / 本番データが混入していないかを確認した記録です。

検出結果に secret 実値は書きません。問題が見つかった場合も、値そのものではなく「無効化・再発行が必要」とだけ記録します。

## 実施日

2026-05-02

## 対象

- repository: `KitsuneSavaskiy/god-sandbox-mvp`
- base: `origin/main`
- branch: `sec/pbi-sec-repo-secret-scan-001`
- Issue: `#171`

## 実行した確認

### gitleaks

使用した version:

```text
gitleaks 8.30.1
```

履歴 scan:

```text
gitleaks git . --redact=100 --report-format json --exit-code 0
```

結果:

```text
219 commits scanned
findings: 0
```

現在ファイル scan:

```text
gitleaks dir . --redact=100 --report-format json --exit-code 0
```

結果:

```text
findings: 0
```

### TruffleHog

使用した version:

```text
trufflehog 3.95.2
```

確認内容:

```text
git scan と filesystem scan を --no-verification で補助実行
```

結果:

```text
finding output lines: 0
```

補足:

この環境では TruffleHog の process exit code が 1 でしたが、標準出力と標準エラーに finding / diagnostic は出ませんでした。そのため、今回の確定判定は gitleaks の履歴 scan と現在ファイル scan を正として扱います。

## 手動確認

### .env の Git 管理状態

確認:

```text
tracked .env files: 0
```

`.gitignore` には以下の方針があります。

```text
.env
.env.*
!.env.example
```

今回、secret 実値を含まない `.env.example` を追加しました。

### 個人パス

検索観点:

```text
C:\Users\
OneDrive
Documents\Codex
Desktop\Codex
```

結果:

```text
実在の個人PCパスとして扱うべき tracked 文字列は見つかりませんでした。
```

補足:

`.github/CODEOWNERS` の GitHub account 表記と、`docs/startup-troubleshooting.md` の `C:\Users\your-name\...` という説明用 placeholder は検出対象に出ましたが、どちらも個人PCパスや secret 実値ではありません。

### secret 関連語

`secret` / `token` / `API key` / `password` などの語は、運用ルールや安全方針の説明文に含まれています。gitleaks の findings は 0 件であり、今回の scan では secret 実値として扱う検出はありませんでした。

## .gitignore 更新

今回、ローカル補助ファイルを誤って commit しにくくするため、以下を除外対象に追加しました。

```text
.claude/
*.local.md
*.log
*.err.log
*.out.log
.local-backup-*/
node_modules.*-backup/
```

## 判断

今回の確認では、Git 管理対象と Git 履歴に secret / API key / token / 本番データの混入は確認されませんでした。

ただし、secret scan は完全保証ではありません。今後、secret / API key / token / 個人パスを見つけた場合は、値を PR や docs に書かず、以下の対応に分けて扱います。

- secret / token / API key: 無効化・再発行が必要
- 個人パス: 汎用 placeholder へ置換が必要
- 本番データ: Git 管理対象から除外し、必要なら履歴書き換えを別 PBI として判断

## 今回やらなかったこと

- secret 実値の記録
- package 変更
- CI workflow 変更
- GitHub Actions 追加
- 履歴書き換え
- secret の無効化・再発行作業
