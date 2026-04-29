# キャラクター発話生成アーキテクチャ

この資料は、箱庭キャラクターが自然言語で発話する機能を、特定の LLM provider に密結合させずに拡張するための設計ガイドです。

これは設計ドキュメントであり、実装ではありません。LLM 接続、mock provider、UI、API key 保存、REST API、Character Passport 実装、package 変更、CI 変更はこの PBI では行いません。

## 1. この資料の目的

- キャラクター発話生成の責務分離を決める。
- LLM provider への密結合を避ける。
- desktop / web / mobile に拡張できる構造にする。
- API key / secret handling / prompt / provider config の責務を分離する。
- 実 LLM 接続へ進む前に、docs-only で境界を固定する。

## 2. platform 用語定義

この資料では、`native` という語を単独では使いません。
`desktop native` と `mobile native` は secret handling の前提が違うため、必ず分けて扱います。

```text
web:
browser 上で動く Web アプリ。

desktop native:
OS の secure storage を使える desktop アプリ。

desktop node:
Node.js process と local file system を使える desktop / local 開発環境。

mobile native:
iOS / Android の native アプリ。

native:
曖昧なので、単独では設計判断に使わない。
```

MVP では、`mobile native` に標準 API key を保存しません。
`mobile native` の BYOK は禁止です。
例外的に mobile で direct 接続を検討する場合でも、backend が発行する短命 token に限定し、標準 API key とは別物として扱います。

## 3. レイヤー配置

```text
Domain:
Character, Personality, Faith, Growth, Ability, Skill, Status

Application:
GenerateCharacterUtterance
BuildUtteranceContext
BuildUtteranceRequest
UtterancePolicy
LlmProvider
LlmProviderConfigRepository

Infrastructure:
mockProvider
templateProvider
demoProvider
serverProxyProvider
userDirectProvider
provider-specific prompt serializer
desktopFileConfigRepository
desktopSecureConfigRepository
mobileSecureConfigRepository
webServerConfigRepository

Presentation:
発話表示
provider選択UI
発話要求操作

Composition Root:
concrete provider implementation の選択と配線
```

Domain はキャラクター、信仰度（Faith）、成長（Growth）、特殊能力（Ability）、技（Skill）、状態（Status）の意味を持ちます。
Application は発話生成ユースケース、policy、provider port、config repository port を持ちます。
Infrastructure は provider 実装、provider-specific serializer、config / secret の保存実装を持ちます。
Presentation は画面表示とユーザー操作だけを担当します。
Composition Root は、どの concrete provider implementation を Application の `LlmProvider` port に注入するかを決めます。

## 4. utteranceContext の配置

```text
utteranceContext は Domain に置かない。
Application の DTO または context builder として扱う。
```

理由:

```text
「LLMに何を渡すか」は use case 依存であり、Domain の責務ではない。
Domain は Character / Faith / Growth / Status などの意味を持つが、LLM向け文脈を知らない。
```

`utteranceContext` は、発話生成のために Application が一時的に作る provider-neutral DTO です。
Domain model と似た情報を含むことはありますが、Domain model そのものではありません。

## 5. BuildUtteranceContext / BuildUtteranceRequest / Prompt serialization の責務

`PromptBuilder` という名前は、Domain が prompt を持つように誤解されやすいため使いません。
責務は次の3段階に分けます。

```text
BuildUtteranceContext:
キャラ状態・Faith・Growth・Chaos・現在状況から、発話生成に必要な provider-neutral context DTO を作る。

BuildUtteranceRequest:
context DTO から、provider-neutral な utterance request / messages を作る。
この時点では OpenAI / Anthropic / free provider などの固有形式にはしない。

Provider-specific prompt serializer:
provider-neutral request を、各 provider が要求する形式へ変換する。
これは Infrastructure に置く。

Domain:
prompt / provider固有messages / token指定 / model指定を知らない。
```

禁止例:

```text
Application が OpenAI 固有の message format を直接組み立てる
Domain が prompt template を持つ
React UI が prompt を組み立てる
```

## 6. Provider Selection Policy

```text
UI は concrete provider implementation を直接選ばない。
concrete provider の選択と配線は composition root が行う。

Application は、必要に応じて provider kind / policy / user selection request を扱ってよい。
ただし、OpenAIProvider や AnthropicProvider などの具象実装を直接 new しない。
Presentation は選択要求を出すだけで、具体provider実装を知らない。
```

例:

```text
良い:
composition root が serverProxyProvider を LlmProvider port に注入する

悪い:
LoginScreen や WorldViewport が OpenAIProvider を直接 import する
```

provider selection は「どの provider を使いたいか」という user intent と、「実際にどの実装を注入するか」という composition の責務を分けます。

## 7. Provider config と secret の分離

```text
LLM provider 設定は LlmProviderConfigRepository port から取得する。
provider config と secret は分ける。
```

非秘密設定の例:

```text
- provider kind
- model preference
- max output length
- language preference
- generation mode
```

秘密情報の例:

```text
- API key
- refresh token
- user secret
```

重要:

```text
desktopFileConfigRepository は非秘密設定専用。
API key を JSON file に平文保存しない。
```

platform 別方針:

```text
desktop/node:
非秘密設定は local file config 可。
API key は desktopSecureConfigRepository など secure storage が使える場合のみ保存可。

desktop native:
userDirectProvider を許可してよい。
ただし API key は desktopSecureConfigRepository など OS secure storage にのみ保存する。
desktopFileConfigRepository や JSON file への secret 保存は禁止。

mobile native:
serverProxyProvider または backend 発行の短命 token のみ許可。
標準 API key 保存は禁止。
userDirectProvider は禁止。

web:
標準APIキーを保持しない。
backend proxy または server-side config を使う。
```

## 8. platform ごとの provider / credential 可否

| platform | allowed | forbidden | exception |
|---|---|---|---|
| web | `serverProxyProvider` | 標準 API key 保存、`userDirectProvider` | backend proxy 内の server-side config |
| mobile native | `serverProxyProvider`、backend 発行の短命 token | 標準 API key 保存、mobile BYOK、`userDirectProvider` | provider が短命 token を正式にサポートし、backend が scope / TTL を制御する場合のみ |
| desktop native | `serverProxyProvider`、`userDirectProvider` | JSON file への secret 保存 | OS secure storage が使える場合のみ user direct を許可 |
| desktop node | `serverProxyProvider`、開発用 `mockProvider` / `templateProvider` | file config への secret 保存 | local 開発で secure storage がない場合は user direct を使わない |
| demo / free | ユーザーが明示選択した `demoProvider` | 自動 fallback | デモ用途として明示された範囲のみ |

この表を優先します。
文章で判断が揺れる場合は、この allowed / forbidden / exception の表に従います。

## 9. Provider 種別

```text
mockProvider:
LLMなしで固定発話を返す。開発・オフラインfallback向け。

templateProvider:
キャラ状態を deterministic なテンプレートに埋め込む。外部通信なし。

demoProvider:
ユーザーが明示的に選ぶ無料またはデモ用途 provider。
自動fallback先にはしない。

serverProxyProvider:
API key を server 側で扱う provider。

userDirectProvider:
desktop native かつ platform-secure storage が使える場合のみ許可。
web / mobile native では禁止。
```

`templateProvider` と `demoProvider` の違い:

```text
templateProvider:
決定的。外部LLMを呼ばない。

demoProvider:
外部または無料LLMを使う可能性がある。ユーザーの明示選択が必要。
```

## 10. Free provider / fallback 方針

```text
無料LLM provider は自動fallbackにしない。
ユーザーが明示的に選んだ場合のみ使う。
```

禁止:

```text
primary provider が失敗したため、無断で別providerへ会話文脈やキャラ情報を送ること。
```

fallback は same-trust-tier 内だけに限定します。

```text
例:
templateProvider -> mockProvider は可
serverProxyProvider -> demoProvider への自動fallbackは禁止
userDirectProvider -> free provider への自動fallbackは禁止
```

## 11. Provider failure fallback と no-utterance の区別

```text
provider failure fallback:
provider失敗時に安全な定型文または無言状態を返す。

no-utterance:
発話すべきでない状況では生成を行わない。
これは失敗ではなく UtterancePolicy 上の通常判断である。
```

例:

```text
provider failure fallback:
Ryoは何かを言いかけたが、言葉にならなかった。

no-utterance:
その状況では発話を生成しない。UIには何も追加しない。
```

## 12. UtterancePolicy

```text
UtterancePolicy は Application に置く。
```

必ず決めること:

```text
- いつ生成するか
- 最大文字数
- 再生成条件
- キャッシュ条件
- 同一状況で再利用するか
- キャラごとの生成頻度上限
- provider失敗時のfallback
- no-utterance 判定
```

MVP 方針:

```text
生成してよい:
- イベント発生時
- 神の介入後
- 重要なtick境界
- ユーザーが明示的に要求した時

生成しない:
- 毎tick
- 全キャラ同時
- 画面に出ていないキャラ
```

発話生成は、世界の tick loop や EventModal の表示制御を直接変えてはいけません。
生成条件は UtterancePolicy に集約し、UI から個別に散らして判定しないようにします。

## 13. Data minimization

```text
BuildUtteranceContext は必要最小限の文脈だけを渡す。
```

送ってよいものの例:

```text
- キャラクター名
- 現在状態の短い要約
- Faith の要約
- Growth / Blessing / Trial / Chaos の必要最小限の要約
- 現在イベントの要約
```

避けるもの:

```text
- 不要な会話全文
- 長すぎる履歴
- API key
- user secret
- debug log
- 内部実装詳細
```

理由:

```text
文脈を送りすぎると、コスト・遅延・漏えいリスク・provider lock-in が増える。
```

## 14. Secret handling

```text
- Web / mobile に標準APIキーを置かない
- OpenAI / Anthropic 通常APIは server proxy 経由
- OpenAI Realtime 直結時のみ backend 発行の短命 token を使う
- Anthropic は server proxy 標準
- userDirectProvider は desktop native + platform-secure storage 前提
- mobile native では userDirectProvider を禁止する
- mobile native の例外は backend 発行の短命 token のみ
- API key / prompt全文 / user secret を通常ログに出さない
- secret漏えい時は revoke / rotate する
```

secret handling は provider 実装よりも外側の運用ルールでもあります。
API key や user secret は Presentation state、local JSON config、通常ログに置きません。
mobile native の secure storage は短命 token や platform token の保管には使えますが、標準 API key の永続保存には使いません。

## 15. Safety / logging

```text
- Chaos / Trial 由来の発話でも、過激すぎる表現は抑制する
- provider出力をそのまま信頼しすぎない
- 通常ログに prompt 全文を出さない
- 通常ログに provider response 全文を出さない
- 必要な場合でも debug mode と明示的なユーザー許可を前提にする
```

通常ログに残す場合は、provider 名、成功 / 失敗、所要時間、短い error code などに限定します。
キャラクター情報、prompt 全文、response 全文、API key、user secret は通常ログに出しません。

## 16. Character Passport との境界

```text
Character Passport:
外部ゲームへ渡す export contract

Utterance generation:
現在の箱庭状態から、その場の発話文脈を作る live context
```

禁止:

```text
Character Passport JSON を内部会話モデルの代わりにしない。
```

Character Passport は外部ゲーム連携のための versioned export contract です。
発話生成は、その場の世界状態から作る live context です。
両者は情報が重なることがありますが、保存先も責務も異なります。

## 17. Bayesian investment rule

```text
この機能は価値が高いが、不確実性も高い。
したがって docs -> mock/template -> limited UI -> real provider の順で投資する。
いきなり実LLM接続へ進まない。
```

PBI ごとの判断観点:

```text
- 期待価値
- 下振れ時の生存性
- 可逆性
- 維持コスト
- 情報の非対称
- provider のインセンティブ
```

この順序は、実 provider 接続前に「ゲームとして発話が楽しいか」「UI に必要か」「コストや遅延に見合うか」を検証するためのものです。

## 18. 今回見送るもの

```text
- 実LLM接続
- Mock provider実装
- Template provider実装
- provider設定UI
- API key保存実装
- moderation実装
- 発話履歴保存
- Character Passportとの統合
- REST API
- frontend UI
```

