# ベイジアンPBI判断フレームワーク

この資料は、GodSandbox プロジェクトで PBI を選ぶときに、仮説、期待価値、不確実性、投資上限、撤退条件、観測指標を揃えるための運用ガイドです。

これはプロセス文書であり、実装ではありません。PBI 管理ツール、GitHub Actions、Issue template、PR template、package、コードはこの PBI では変更しません。

## 目的

- PBI ごとの判断軸を揃える。
- 期待値が高く、可逆性が高く、コストが小さい作業を優先しやすくする。
- 不確実性が高い領域で、いきなり大きな実装へ進まないようにする。
- 監査で見つかった blocker を学習として次の PBI 選定に戻す。
- docs-only でも、後続実装を誤らせる設計文書を放置しない。

## PBI 判断テンプレート

新しい PBI を選ぶ前に、最低限次の8項目を埋めます。

```text
Hypothesis:
このPBIで何が良くなると仮定しているか。

Expected value:
成功した場合に得られる価値。

Downside:
失敗した場合の損失、混乱、セキュリティリスク、手戻り。

Reversibility:
後から戻せるか。戻すコストは小さいか。

Cost:
実装、レビュー、運用、保守にかかるコスト。

Evidence:
判断材料となる事実、監査結果、ユーザー観測、既存コード。

Investment limit:
このPBIでどこまで投資し、どこから先は別PBIに切るか。

Stop condition:
どの条件になったら止めるか、撤退するか、再設計へ戻すか。
```

## 8項目の説明

### Hypothesis

仮説は「なぜ今これをやるのか」を短く表します。
例: 「platform 別の secret 方針を表で固定すれば、LLM provider 実装時の誤判断を減らせる」。

### Expected value

期待価値は、成功時に得られる前進です。
ユーザー体験、設計安全性、レビュー効率、将来の実装速度、セキュリティ事故の予防などを含みます。

### Downside

下振れ時の影響を明示します。
たとえば、誤った設計文書を merge すると、後続の実装者が安全でない方針を正として読んでしまいます。

### Reversibility

可逆性は「小さく試して戻せるか」です。
docs-only や mock / template は比較的戻しやすく、real provider 接続や storage / credential 実装は戻しにくい傾向があります。

### Cost

コストは実装時間だけではありません。
レビュー、監査、CI、運用、秘密情報管理、将来の移行コストも含みます。

### Evidence

証拠は、推測と事実を分けるために使います。
ユーザー観測、runtime error、監査コメント、既存コード、CI 結果、過去の失敗を具体的に書きます。

### Investment limit

投資上限は、スコープの広がりを止めるための線です。
例: 「今回は docs-only。mock provider 実装、UI、real provider 接続には進まない」。

### Stop condition

撤退条件は、作業を安全に止めるための条件です。
例: 「secret handling の方針が一意に決まらない場合、実装に進まず設計 PBI に戻す」。

## 判断基準

優先度が高い PBI は、次の条件を多く満たします。

- 期待値が高い。
- 可逆性が高い。
- コストが小さい。
- 後続 PBI の誤実装を減らす。
- blocker や重大な不確実性を小さく閉じられる。
- 同時進行しても他 PBI とファイル競合しない。
- 監査で見つかった学びをすぐ運用へ戻せる。

不確実性が高いものは、次の順に投資します。

```text
docs -> mock/template -> limited UI -> real provider
```

いきなり real provider、保存、認証、外部連携へ進まないことを原則にします。

## PBI 種別ごとの扱い

### docs-only

設計、用語、責務、判断境界を固定する PBI です。
可逆性は高いですが、設計凍結に近い文書は後続実装へ強く影響します。
そのため「読める」だけでなく「一意に実装判断できる」ことを完了条件にします。

### mock/template

実 provider や本番処理を使わず、体験価値やインターフェースを確認する PBI です。
外部依存や secret を増やさずに学習できるため、不確実性が高い機能の次段階として有効です。

### limited UI

限定された画面や操作で体験を確認する PBI です。
本格実装前に、ユーザーが意味を理解できるか、操作したくなるかを検証します。
ただし UI から Domain / Adapter へ直接依存を広げないようにします。

### real provider

実 LLM provider、外部 API、課金や遅延を伴う処理を使う PBI です。
secret handling、fallback、data minimization、logging、provider policy が固定されてから進めます。

### storage / secret / credential

保存、API key、token、credential を扱う PBI です。
セキュリティと運用リスクが高いため、allowed / forbidden / exception の表を必須にします。
`manual-review-required` を優先します。

### schema / data export

Character Passport や外部ゲーム連携の schema を扱う PBI です。
Domain concept と DTO / schema を混同しないようにします。
versioning、validation、path safety、後方互換性を確認します。

### UX validation

観察体験、介入体験、発話体験などを検証する PBI です。
体験の価値を測ることが目的であり、永続化や provider 接続へ勝手に広げません。

## 今回のスプリントからの固定ルール

### secret / provider / storage は表で固定する

secret / credential / provider / storage を扱う設計文書では、platform 別の `allowed / forbidden / exception` 表を必須にします。

文章だけで「原則禁止」「条件付き許可」と書くと、実装者ごとに解釈が分かれます。
表で固定し、文章で判断が揺れた場合は表を優先します。

### native を単独で使わない

`native` という語は単独で使いません。
必要なら `desktop native` と `mobile native` に分けます。

特に API key、secure storage、userDirectProvider、short-lived token の扱いでは、desktop と mobile を混ぜてはいけません。

### P1 blocker は merge 後でも follow-up FIX を最優先にする

監査で P1 blocker が出た設計文書は、merge 済みでも follow-up FIX PBI を最優先候補にします。

これは過去の判断を責めるためではありません。
最新の事実から判断を更新し、後続実装の誤りを防ぐためです。

### docs-only でも一意に実装判断できることを完了条件にする

docs-only PBI は軽く見えますが、設計凍結に近い文書は後続コードの前提になります。
そのため、完了条件は「説明がある」ではなく「実装者が一意に判断できる」です。

## 使い方

### PBI 作成前

- Hypothesis / Expected value / Downside を書く。
- 不確実性が高い場合は、docs から始めるべきか確認する。
- 既存 PBI とファイル競合しないか確認する。

### 実装前

- Investment limit と Stop condition を確認する。
- 今回やらないことを明示する。
- tracked 変更があれば、新規作業に入らず報告する。

### PR 作成時

- PBI の範囲だけが入っているか確認する。
- protected path や package 変更があれば `manual-review-required` を選ぶ。
- docs-only でも、設計判断が一意かを PR 本文で説明する。

### 監査時

- 自己申告ではなく実 diff を見る。
- 文章の矛盾、曖昧語、allowed / forbidden / exception の欠落を見る。
- blocker がある場合は、merge 済みでも follow-up PBI として明示する。

### merge 後の学習更新時

- 何が見落としだったかを責めずに整理する。
- 次回から固定ルールにするべきことを抽出する。
- 通常 PBI より先に解消すべき follow-up があるか判断する。

## 今回やらないこと

- PBI管理ツール実装
- GitHub Actions変更
- Issue template変更
- PR template変更
- package変更
- コード変更
- 既存docsの大幅改修

