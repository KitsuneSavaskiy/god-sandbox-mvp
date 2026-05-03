# TruffleHog scheduled secret sweep

PBI: `PBI-SECURITY-TRUFFLEHOG-SCHEDULED-SWEEP-001`

この文書は、TruffleHog による定期または手動の secret 履歴スキャン運用をまとめます。

## 目的

Git履歴に残った有効な secret 候補を検出します。

通常のPRごとに全履歴を重く検証するのではなく、週次の定期実行と手動実行で確認します。

## workflow

workflow: `.github/workflows/trufflehog-scheduled-sweep.yml`

実行タイミング:

- `workflow_dispatch`: 必要な時に手動実行します。
- `schedule`: 週1回の定期実行です。

このworkflowは `pull_request` では動かしません。

PRの通常CIを重くしすぎないためです。

## スキャン方針

workflowでは、リポジトリ全履歴を checkout してから TruffleHog を実行します。

目的は次のコマンド相当です。

```sh
trufflehog git file://. --only-verified
```

実際のworkflowでは、Docker上のリポジトリパスに合わせて `file:///repo` を使います。

`--only-verified` を使い、TruffleHog が検証できた secret 候補を主対象にします。

## ログに secret 実値を出さない

Actionsログには secret 実値を出しません。

workflowでは、TruffleHog のJSON出力を一時ファイルへ保存し、ログには中身を表示しません。

verified secret 候補が見つかった場合も、ログに出すのは件数と対応案内だけです。

PR本文、Issue、レビューコメントにも secret 実値を貼らないでください。

## verified secret が出た時の対応

1. ActionsログやPRに secret 実値を貼らない。
2. まず該当サービス側で secret を失効またはローテーションする。
3. 必要な担当者だけで、ローカルの安全な環境で再現確認する。
4. 共有する場合は、secret 実値ではなく、検出種別、影響範囲、対応状況だけを書く。
5. 露出範囲を確認し、必要なら履歴rewriteを別PBIとして判断する。
6. ローテーション後にworkflowを再実行し、verified finding が消えたことを確認する。

ローカルで再確認する場合も、出力ファイルをGit管理に入れないでください。

例:

```sh
trufflehog git file://. --only-verified --json > ../trufflehog-local-results.json
```

この結果ファイルをPR、Issue、チャットへ貼らないでください。

## 今回やらないこと

- 毎PRでの全履歴検証
- gitleaks導入
- GitHub Secret Scanning設定変更
- package変更
- アプリ実装変更
- 履歴rewrite

## 運用メモ

- verified secret は、検出後に失効またはローテーションするまで危険な可能性があります。
- 先にsecretを無効化し、その後に原因調査を進めます。
- 画像、ログ、スクリーンショットにも secret 実値を写さないでください。
- 誤検知に見える場合でも、secret実値を公開せずに確認します。
