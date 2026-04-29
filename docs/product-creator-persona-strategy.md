# AIゲーム開発者・Passport consumer向けペルソナ戦略

この資料は、GodSandbox の主ターゲット、LLM 利用方針、Character Passport の位置づけ、今後の PBI 優先度を揃えるための戦略メモです。

これは実装ではありません。コード、UI、server、provider、API key 保存、package、CI workflow はこの PBI では変更しません。

## 結論

GodSandbox は、一般消費者向けの基本無料ゲームを主戦場にしません。

主ターゲットは、AI に興味があり、自分で後続ゲームやPassport consumerを作りたい技術寄りユーザーに置きます。

GodSandbox は完成品ゲームとして大市場で戦うより、AI キャラクターを育て、Character Passport として外へ出し、自作ゲーム、後続ゲーム、タクティクス戦闘、外部ツールへ接続するための箱庭・安定JSONインターフェース・実験場として育てます。

## 事実

- PR #52 で Character Passport export adapter は Domain 契約へ寄せられた。
- PR #53 で実 LLM 接続なしの mock / template 発話 preview が追加された。
- 現時点の実装は、完成品ゲームの長期ライブ運営より、Domain、Application、Adapter、export contract を段階的に固める流れに寄っている。
- Character Passport は、ゲーム内保存データだけでなく、外部へキャラクターを渡す契約として設計され始めている。

## 判断

- 一般消費者向け基本無料ゲームを主戦場にしない。
- ガチャ RPG、育成シミュレーション、ライブ運営ゲーム、IP ゲームと同じ土俵で戦わない。
- 日本のゲーム市場拡大に大きく依存する戦略は避ける。
- LLM 発話コストを運営側が無料で広く負担するモデルは、現時点の GodSandbox では主軸にしない。
- desktop / developer local first を優先し、mobile first の優先度は下げる。
- 無料 LLM 体験より、ユーザー持ち込み AI と安全な接続設計を重視する。

## 仮説

- AI キャラクターを自分で作り、育て、外部へ持ち出したい技術寄りユーザーは、完成品ゲームよりも「いじれる道具」や「拡張できる環境」に価値を感じる。
- Character Passport が安定JSONインターフェースになるほど、後続ゲーム、Passport consumer、自作ツールへの接続価値が上がる。
- BYOK / BYOM を安全に扱える設計を先に固定すれば、運営側が無料 LLM コストを抱え込まずに、AI 体験を広げられる。
- 小さな sample workflow を増やすほうが、大規模な完成品ゲームを急ぐよりも学習効率が高い。

## 旧ターゲットを主戦場にしない理由

基本無料ゲーム市場は競合が多いと判断します。
この判断は、市場規模の新規数値ではなく、一般的にガチャ RPG、育成シミュレーション、ライブ運営ゲーム、IP ゲームが強い運用力、継続コンテンツ、広告、決済、コミュニティ運営を要求することを前提にしたプロダクト判断です。

GodSandbox がいきなりその土俵へ入ると、AI キャラクター、Character Passport、外部連携という固有の強みより、無料体験量、課金設計、イベント更新頻度で比較されやすくなります。

また、LLM 発話を運営側が無料で負担する形は、利用量が増えたときにコストが読みづらくなります。
そのため、GodSandbox の主軸は「運営が無料 LLM を配るゲーム」ではなく、「ユーザーが自分の AI 契約、API key、ローカル LLM を安全に接続できる箱庭」に寄せます。

## 新ペルソナ

主な読者像は次の通りです。

- AI に興味がある。
- 自分で後続ゲームやPassport consumerを作りたい。
- PC ゲームやサンドボックスゲームに親和性がある。
- ChatGPT、Claude、Gemini、ローカル LLM などに関心がある。
- 完成品ゲームを遊ぶだけでなく、データ、ルール、キャラクター、連携先をいじりたい。
- API、JSON、ローカル実行、Passport consumer、sample integration、export workflow に抵抗が少ない。
- 小さな sample から自分の遊びや実験を作ることに価値を感じる。

このペルソナは一般消費者を排除するものではありません。
ただし、設計優先度を決めるときは、まず技術寄りユーザーが理解し、試し、拡張できることを優先します。

## 価値提案

GodSandbox は、AI キャラクターを箱庭で育てる場です。

育ったキャラクターは Character Passport として外へ出せます。
Character Passport は、自作ゲーム、後続ゲーム、タクティクス戦闘、外部ツールへキャラクターを渡すための安定JSONインターフェースです。

LLM 発話は、運営側が無料で無制限に提供する前提ではなく、ユーザーが契約している AI、ユーザー自身の API key、またはローカル LLM を使える方向へ寄せます。

この価値提案では、GodSandbox 自体は「全部入りの完成品」ではありません。
むしろ、AI キャラクター、成長、Faith、Skill、Ability、安定JSONインターフェース、sample workflow を組み合わせるための開発者向け sandbox です。

## BYOK / BYOM

BYOK は Bring Your Own Key の略です。
ユーザーが自分の API key を持ち込み、自分の契約している AI provider を使う方針を指します。

BYOM は Bring Your Own Model の略です。
ユーザーが自分のローカル LLM や自前モデルを使う方針を指します。

どちらも secret handling の安全方針に従います。
API key や user secret を平文保存したり、localStorage に保存したり、通常ログへ出したりしません。
provider 設定 UI や credential 保存は、別 PBI で platform 別の allowed / forbidden / exception を固定してから扱います。

## Character Passport の位置づけ

Character Passport はゲーム内保存データだけではありません。

後続ゲーム、Passport consumer、自作ツールへキャラクターを渡すための安定JSONインターフェースです。
キャラクターの性格、成長、Faith、Skill、Ability などを外部利用可能にする接続点です。

一方で、Character Passport は AI 会話モデルの内部履歴そのものではありません。
prompt 全文、会話履歴、API key、user secret を保存する場所でもありません。

Character Passport は、外部利用に必要なキャラクター概念を安定して渡すための最小の安定JSONインターフェースとして扱います。
後続ゲームは必要なパラメータだけを読み、不要なパラメータはスキップできます。また、受け取ったパラメータ名や意味を自分のゲーム内で自由に再解釈できます。
ただし、後続ゲーム開発者は育成ゲーム側のパラメータや育成イベントを追加しません。パラメータと育成イベントは、GodSandbox 側で定義済みの有限集合として扱います。
そのため、Domain canonical 定義、export adapter、contract smoke は優先度が高い領域です。

## 優先度への影響

mobile first の優先度は下げます。
理由は、BYOK / BYOM、ローカル LLM、Passport consumer、sample integration、file export、developer workflow は desktop / developer local のほうが先に試しやすいためです。

desktop / developer local first を優先します。
ローカル実行、ファイル出力、sample workflow、外部ツール連携を先に固めることで、技術寄りユーザーが自分の環境で試せる状態を作ります。

Passport consumer / sample integration / export / sample workflow を重視します。
GodSandbox の価値は、単体ゲームとして閉じるより、AI キャラクターを外へ運べることにあります。

無料 LLM 体験より、ユーザー持ち込み AI と安全な接続設計を重視します。
ただし、mock / template / sample は継続して有効です。
実 provider に進む前の学習コストを下げるためです。

## 今後の PBI 優先度

優先度を上げる候補:

- `PBI-LLM-BYOK-BYOM-POLICY-001`
- `PBI-MODDING-EXTENSION-POINTS-001`
- `PBI-SAMPLE-CREATOR-WORKFLOW-001`
- `PBI-PASSPORT-EXPORT-CONTRACT-001`
- `PBI-LLM-UTTERANCE-APP-USECASE-001`

優先度を下げる候補:

- mobile first の体験最適化
- 一般消費者向けの課金導線
- 大規模ライブ運営前提のイベント設計
- 運営側が無料 LLM コストを広く負担する設計

## ベイジアン判断

### Hypothesis

GodSandbox を AIゲーム開発者 / Passport consumer開発者 / 技術寄りユーザー向けの sandbox として位置づけると、Character Passport、BYOK / BYOM、sample integration、sample workflow の投資判断が一貫しやすくなる。

### Expected value

- 後続 PBI の優先順位が揃う。
- LLM コスト方針の誤実装を避けやすくなる。
- Character Passport を外部連携の安定JSONインターフェースとして育てやすくなる。
- 技術寄りユーザーが試せる sample workflow へ投資しやすくなる。

### Downside

- 一般消費者向けゲームとしての魅力づくりが後回しになる。
- 文書だけで方針を固定したつもりになり、実装や sample が追いつかないリスクがある。
- 技術寄りユーザーの実需要を過大評価する可能性がある。

### Reversibility

docs-only のため可逆性は高い。
ただし、後続 PBI の優先度に影響するため、観測結果と合わない場合は早めに follow-up docs で修正する。

### Cost

今回のコストは文書作成とレビューに限定する。
実 provider 接続、secret handling、外部API、UI、mobile 対応には投資しない。

### Evidence

- PR #52 により Character Passport export adapter が Domain 契約へ寄った。
- PR #53 により実 LLM 接続なしで発話体験の preview が可能になった。
- 既存 docs は Clean Architecture、Character Passport、Bayesian PBI 判断を重視している。
- ユーザー指示として、主ターゲットを技術寄りユーザーへ再定義する方針が示されている。

### Investment limit

この PBI では `docs/product-creator-persona-strategy.md` の新規作成だけを行う。
コード、schema、provider、UI、server、package、CI は変更しない。

### Stop condition

- 市場規模や外部事実の断定が必要になったら止める。
- BYOK / BYOM の安全方針が実装判断に入り始めたら、別 PBI に切る。
- Character Passport schema 変更が必要になったら、別 PBI に切る。

## 次PBI候補

### PBI-LLM-BYOK-BYOM-POLICY-001

BYOK / BYOM の allowed / forbidden / exception を platform 別に固定する。
API key、local LLM、server proxy、desktop local、mobile native の扱いを分ける。

### PBI-PASSPORT-CONSUMER-CONTRACT-001

後続ゲーム、Passport consumer、external tool が GodSandbox のどの安定JSONインターフェースを読むかを整理する。
いきなり外部API実装には進まず、読み取り境界とスキップ可能なパラメータの文書化から始める。

### PBI-SAMPLE-CREATOR-WORKFLOW-001

技術寄りユーザーが、AI キャラを育て、Passport を export し、外部サンプルへ渡す最小 workflow を確認できるようにする。

### PBI-PASSPORT-EXPORT-CONTRACT-001

Character Passport の Domain canonical 定義と server export contract の drift を防ぐ。
外部連携 contract の安定性を上げる。

### PBI-LLM-UTTERANCE-APP-USECASE-001

LLM 発話を UI や provider 実装から切り離し、Application use case として扱う。
BYOK / BYOM 方針と衝突しない境界を作る。

## 今回やらないこと

- 競合市場調査の詳細化
- 外部統計の網羅的調査
- コード実装
- BYOK / BYOM 実装
- provider 設定 UI
- API key 保存実装
- 外部API実装
- Character Passport schema 変更
- package 変更
- CI 変更
