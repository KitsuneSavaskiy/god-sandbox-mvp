# GitHub Secret Scanning / Push Protection setup

## 目的

この文書は、`KitsuneSavaskiy/god-sandbox-mvp` で GitHub 標準の Secret Scanning と Push Protection を確認・有効化・運用するための手順を整理したものです。

- GitHub の設定を勝手に変えず、PO または管理者が管理画面で確認できる状態を作る
- alert が出た後の運用を決める
- false positive と本物の secret leak を同じ手順で曖昧に扱わない

secret の実値、token 文字列、個人パス、API key 実値はこの文書に書きません。

## 前提

- 対象 repository: `KitsuneSavaskiy/god-sandbox-mvp`
- 2026-05-03 時点の read-only API 確認では、この repository は `public` です
- GitHub の read-only API では `security_and_analysis` が返らなかったため、最終確認は GitHub 管理画面で行います

## まず確認すること

### 1. repository visibility

最初に、この repository が `public` か `private/internal` かを確認します。

- public repository:
  - Secret Scanning は GitHub.com 上で自動実行される無料範囲があります
  - Push Protection for users は GitHub.com で既定有効です
  - repository 単位の Push Protection を有効にすると、bypass 時の alert を残せます
- private / internal repository:
  - GitHub Secret Protection の契約条件を先に確認します

### 2. 管理画面の場所

GitHub の UI 名称は時期により少し変わりますが、基本は次のどちらかです。

1. repository を開く
2. `Settings`
3. `Advanced Security` または `Security and analysis`
4. `Secret Protection` セクションを見る

ここで、次の項目を確認します。

- `Secret scanning` が有効か
- `Push protection` が有効か
- 必要なら `Validity checks` が有効か
- 必要なら `Extended metadata` が有効か

## PO / 管理者向けチェックリスト

### Secret Scanning

- `Secret scanning` が有効になっている
- `Security and quality` タブから `Secret scanning` alert 一覧へ入れる
- public repository の場合、無料対象として有効に見える
- alert 一覧に `Default alerts` と `Generic alerts` の区別があることを理解している

補足:

- `Generic alerts` は private key や generic secret を含むため、通常 alert より false positive が多くなりやすいです

### Push Protection

- `Push protection` が有効になっている
- repository 単位で有効な場合、bypass が起きたときに alert が残ることを理解している
- public repository では user 単位の Push Protection も既定有効であることを理解している
- `Push protection for users` だけでは repository 側 alert が残らないことを理解している

補足:

- この repo では audit trail を残したいので、public repo でも repository 側 Push Protection の確認を推奨します

## 有効化手順

### Secret Scanning の確認 / 有効化

1. repository を開く
2. `Settings`
3. `Advanced Security` または `Security and analysis`
4. `Secret Protection` セクションを開く
5. `Secret scanning` が `Enable` なら有効化する
6. `Enabled` 表示になっていることを確認する

### Push Protection の確認 / 有効化

1. 上と同じ `Secret Protection` セクションを開く
2. `Push protection` が `Enable` なら有効化する
3. `Enabled` 表示になっていることを確認する

注意:

- public repo では user ベースの Push Protection が既定有効でも、repository 側の Push Protection が無効なことがあります
- 監査と運用のためには repository 側の状態を明示的に確認します

## 通知先の決め方

### どこに alert が出るか

alert の基本表示先は repository の `Security and quality` タブです。

確認手順:

1. repository を開く
2. `Security and quality`
3. 左 sidebar の `Secret scanning`

### 誰に通知されるか

GitHub Docs ベースでは、incremental scan で新しい secret が見つかったとき、次の対象者に通知が飛びます。

- repository administrators
- security managers
- read/write 可能な custom role ユーザー
- repository 管理対象でもある organization / enterprise owners
- commit authors

運用ルール:

- この repo の一次通知先は PO または repository admin を基準にする
- 組織管理で運用する場合は security manager も通知対象に含める
- commit author への通知は補助線であり、最終判断者を兼ねさせない

### email 通知の確認

次を確認します。

1. repository の `Watch` が `All Activity` または `Custom > Security alerts` になっている
2. GitHub personal settings の `Notifications`
3. `Subscriptions > Watching`
4. `Email` が有効

運用メモ:

- alert を見落としたくない担当者は、repo watch と email 通知を両方有効にします
- historical scan では、scan 完了通知の対象が incremental scan と少し異なります

## false positive の扱い

### 原則

false positive かどうか分からない段階では、先に「本物の secret かもしれない」として扱います。

### 判定手順

1. alert 対象文字列を確認する
2. 実際の credential / token / key として使えるものか確認する
3. テスト値、placeholder、無効文字列なら false positive 候補として扱う
4. generic alert か default alert かも確認する

### false positive だった場合

- コード上でより誤検知されにくい placeholder へ置き換えられるなら先に置き換える
- alert を閉じる場合は `Close as` の理由を選び、コメント欄に根拠を残す
- コメントには実 secret を貼らず、次のような説明だけを書く
  - `test fixture の固定文字列であり、実 credential ではない`
  - `placeholder へ置換済み`
  - `provider 側で無効な値であることを確認済み`

### Push Protection で block された場合

- 原則として bypass を常態化しない
- demo / fixture / placeholder でも、可能ならまず文字列を修正する
- どうしても bypass が必要なら、理由を残せる repository 側 Push Protection 前提で行う

## secret 検出時の rotation 手順

### 優先順位

1. 漏えいした secret を有効なものとして扱う
2. provider 側で revoke / rotate する
3. 依存サービスの設定を新 secret に差し替える
4. 不正利用ログを確認する
5. repository 上の該当箇所を削除または置換する
6. 必要なら履歴対策を別 PBI で判断する
7. GitHub 上の alert を手動で close する

### 実務メモ

- GitHub Docs でも、commit 済み secret は compromise 済みとして扱う前提です
- token をファイルから消しただけでは alert は自動 close されません
- close 前に rotation が終わっていることを確認します

### コメントに残す最低限

- `rotation 完了`
- `利用サービス差し替え完了`
- `不正利用ログ確認済み`
- `alert close 実施`

secret 実値や provider の管理画面 URL は書きません。

## 事故対応の最小フロー

### A. push 時に block された

1. push を中断
2. 文字列を見直す
3. 本物なら revoke / rotate を先に検討
4. 修正後に再 push
5. bypass した場合は alert 発生を追跡

### B. alert が repository に出た

1. `Security and quality > Secret scanning` を開く
2. alert 種別を確認する
3. 実 secret か false positive かを判定する
4. 実 secret なら rotation 手順へ進む
5. false positive なら理由コメント付きで close する

## この repo で最低限やっておきたい確認

- repository visibility が `public` であること
- `Settings > Advanced Security` で `Secret scanning` の状態確認
- 同画面で `Push protection` の状態確認
- `Security and quality > Secret scanning` が見えること
- PO または admin の GitHub account が `Security alerts` を受け取れること
- bypass が発生したら誰が見るか決まっていること
- false positive を close する際のコメント書式が決まっていること
- 実 secret 検出時の revoke / rotate 担当が決まっていること

## 運用判断

- Web 公開 MVP を続ける以上、public repo 前提の secret 対策は先に固める価値があります
- user ベース Push Protection だけで安心せず、repository 側 Push Protection と alert 運用をセットで確認します
- false positive を雑に bypass / close すると audit 性が落ちるため、コメント運用まで含めて決めておきます

## 参考リンク

- GitHub Docs: [About secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning)
- GitHub Docs: [Enabling secret scanning for your repository](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-your-repository)
- GitHub Docs: [About push protection](https://docs.github.com/en/code-security/concepts/secret-security/about-push-protection)
- GitHub Docs: [Enabling push protection for your repository](https://docs.github.com/en/code-security/secret-scanning/enabling-secret-scanning-features/enabling-push-protection-for-your-repository)
- GitHub Docs: [About secret scanning alerts](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/about-alerts)
- GitHub Docs: [Monitoring alerts from secret scanning](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/monitoring-alerts)
- GitHub Docs: [Resolving alerts from secret scanning](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts)
