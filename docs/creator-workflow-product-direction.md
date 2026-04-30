# AIキャラクター制作サンドボックスとしての作品方向性とクリエイターワークフロー

## この資料の目的

この資料は、GodSandbox を「AIキャラクター制作サンドボックス」として育てるための作品方向性と、クリエイター向けワークフローを固定するための文書です。

ここでは、一般消費者向けの完成品ゲームとしての方向ではなく、AIに興味があり、自分で後続ゲームやPassport consumerを作りたい技術寄りユーザーに向けた作品体験を整理します。

この資料は実装ではありません。コード、UI、API、provider接続、Character Passport schema は変更しません。

## 事実、判断、仮説

### 事実

- GodSandbox には、箱庭を観察し、神の介入でキャラクターの変化を見届ける最小体験がある。
- Character Passport は、箱庭で育てたキャラクターを外部ゲームやツールへ渡す契約として検討されている。
- mockProvider / templateProvider は、実LLMを呼ばずに発話体験を検証するための土台として追加されている。
- LLM provider、API key、secret handling については、安全な境界設計を優先する方針がある。

### 判断

- GodSandbox は、完成品ゲームを消費する場ではなく、AIキャラクターを作り、観測し、育て、外へ出すための実験場として育てる。
- LLM発話のコストは、原則として運営側が無料で負担し続ける前提にしない。
- 実LLMは、ユーザーが契約しているAI、ユーザー自身のAPI key、またはローカルLLMを使う方向を主軸にする。
- Character Passport は、後続ゲーム、Passport consumer、自作ツールとの接続点として扱う。

### 仮説

- AIキャラクターを自分で作り、後続ゲームやPassport consumerで読み込みたい技術寄りユーザーは、完成品ゲームの消費者よりもGodSandboxの価値を理解しやすい。
- サンプルキャラ、サンプルexport、サンプル外部ゲームがあると、後続ゲーム開発者は接続方法を理解しやすい。
- mock/template から始め、BYOK / BYOM やローカルLLMへ段階的に進める方が、コスト、秘密情報、provider lock-in のリスクを下げやすい。

## 作品の方向性

GodSandbox は、AIキャラクターを作るための箱庭です。

主な流れは次の通りです。

1. AIキャラクターを作る。
2. 箱庭で観測する。
3. 会話、加護、試練、カオスで変化させる。
4. Character Passport として外へ出す。
5. 後続ゲーム、Passport consumer、自作ツールへ接続する。

ここでいう「外へ出す」とは、キャラクターの人格、信仰度、成長、スキル、能力、履歴を、後続ゲームやツールが読み取れる安定JSONインターフェースとして出力することです。

## GodSandbox が目指す体験

GodSandbox が目指すのは、完成品ゲームを消費する体験ではありません。

目指すのは、次のような制作と観測の体験です。

- AIキャラを作って試す。
- 神視点でキャラを見守る。
- キャラが会話や出来事を通じて変化する。
- 育てたキャラを外に持ち出す。
- 自分のAI providerやローカルLLMをつないで試す。

プレイヤーは単なる消費者ではなく、キャラクター制作者、Passport consumer開発者、実験者に近い立場です。

## クリエイターワークフロー

想定する基本ワークフローは次の通りです。

1. キャラを作る。
2. Personality / Faith / Growth / Skill / Ability を設定する。
3. 箱庭でイベントを起こす。
4. LLMまたはmock/templateで発話を見る。
5. 成長結果を確認する。
6. Character Passport をexportする。
7. 後続ゲームやPassport consumerに渡す。
8. 必要なら再調整する。

この流れでは、箱庭は「遊び切る場所」ではなく、キャラクターの反応と変化を観測する場所です。

## 現在できていること

現時点での到達点は、次の範囲です。

- 箱庭の観察と介入の最小ループがある。
- Bless / Test / Watch の基本的な介入体験がある。
- mockProvider / templateProvider による実LLMなしの発話確認がある。
- Character Passport の方向性とローカルexportの土台がある。
- 五行、成長、能力、発話生成、clean architecture の設計文書がある。

## 次に作ること

次に優先する候補は、クリエイターが一連の流れを試せる最小導線です。

- キャラ作成の最小入力。
- Personality / Faith / Growth / Skill / Ability の見える化。
- mock/template 発話と箱庭イベントの接続強化。
- Character Passport のサンプルexport。
- 後続ゲームまたはPassport consumerの sample integration。

## まだ作らないこと

次のものは、現時点ではまだ作りません。

- 実LLM接続。
- provider設定UI。
- API key保存。
- BYOK / BYOM の本実装。
- Passport consumer 向けの読み取りガイド。
- sample external game 本体。
- mobile対応。
- 大量コンテンツ更新を前提にした運営機能。

## 作品の非目標

GodSandbox は、次の方向へ寄せすぎないようにします。

- ガチャRPGにしない。
- ライブ運営ゲームを主戦場にしない。
- AI恋人アプリに寄せすぎない。
- 無料LLMチャットアプリにしない。
- mobile firstにしない。
- 大量コンテンツ更新前提にしない。

これらを完全に否定するわけではありません。ただし、MVPの中心価値ではありません。

## Passport consumer / sample integration / export の方向性

外部接続の中心は Character Passport です。

重視する方針は次の通りです。

- 後続ゲーム開発者が読みやすい安定JSONインターフェースを重視する。
- サンプルキャラを用意する。
- サンプルexportを用意する。
- サンプル外部ゲームまたは Passport consumer を用意する。
- 後続ゲームは必要なパラメータだけ読み、不要なパラメータはスキップできる構造を重視する。
- 後続ゲームは、受け取ったパラメータ名や意味を自分のゲーム内で自由に再解釈できる。

後続ゲームやPassport consumerは、GodSandboxの内部状態を直接知る必要はありません。Character Passport という安定JSONインターフェースを通じて、必要な情報だけを読む方針にします。

一方で、後続ゲーム開発者は育成ゲーム側のパラメータや育成イベントを追加しません。パラメータと育成イベントは、GodSandbox 側で定義済みの有限集合として扱います。

## LLM利用の方向性

LLM利用は、次のように段階的に扱います。

- mock/template は開発・確認用。
- 実LLMはユーザー持ち込みAIを基本方針とする。
- BYOK / BYOM を将来の接続方針に含める。
- free provider の自動fallbackは禁止する。
- API key / secret handling は安全設計を優先する。
- prompt全文やsecretを通常ログに出さない。

BYOK は、ユーザーが自分のAPI keyを使う方針です。BYOM は、ユーザーが自分のmodelやローカルLLMを使う方針です。

ただし、BYOK / BYOM はすぐに実装しません。まずは mock/template と設計文書で、発話生成の責務境界を固めます。

## MVP体験の定義

MVPで目指す体験は、次の範囲です。

1. まずは1人のキャラを作れる。
2. mock/template発話を見られる。
3. 成長・Faith・Skill / Ability が見える。
4. Character Passport として出せる。
5. 外部で読み込めるサンプルがある。

このMVPでは、まだ実LLM接続を必須にしません。キャラクター制作とexportの流れを、低コストで検証できることを優先します。

## 段階ロードマップ

段階的な進め方は次の通りです。

1. docs
2. mock/template
3. local creator workflow
4. Character Passport export
5. sample external game
6. BYOK/BYOM provider
7. Passport consumer / sample integration

この順序は、実LLMや外部連携へ急がず、可逆性の高い検証から進めるためのものです。

## 次PBI候補

次に検討するPBI候補は次の通りです。

- PBI-SAMPLE-CREATOR-WORKFLOW-001
- PBI-PASSPORT-CONSUMER-SAMPLE-INTEGRATION-001
- PBI-PASSPORT-EXAMPLE-CONSUMER-001
- PBI-LLM-BYOK-BYOM-POLICY-001
- PBI-LLM-UTTERANCE-APP-USECASE-001

## 判断メモ

この文書では、市場規模や外部事実を新規に断定しません。

ここで固定しているのは、GodSandboxがどの方向へ投資するかというプロジェクト内の判断です。外部市場の大きさや需要の強さは、今後のユーザー観察、サンプル配布、実験結果によって検証します。
