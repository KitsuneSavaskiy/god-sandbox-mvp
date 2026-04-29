# ユーザー持ち込みAI / API key / ローカルLLM方針

## この資料の目的

この資料は、GodSandbox で実LLMを使う場合の基本方針を固定するための文書です。

GodSandbox は、運営側が無料LLMコストを負担し続ける前提ではなく、ユーザー自身のAI契約、API key、またはローカルLLMを使う方向を主軸にします。

この資料は設計方針です。API key保存実装、secure storage実装、provider設定UI、実LLM接続、ローカルLLM接続、server proxy本実装は行いません。

## 用語定義

### BYOK

BYOK は Bring Your Own Key の略です。

GodSandbox では、ユーザーが自分で契約しているLLM providerのAPI keyを使う方針を指します。

BYOK は「運営が共通API keyを配布する」ことではありません。ユーザーのAPI keyを扱う場合は、platformごとの保存可否、送信先、ログ出力、失効時対応を明確にする必要があります。

### BYOM

BYOM は Bring Your Own Model の略です。

GodSandbox では、ユーザーが自分のローカルLLM、自己ホストmodel、または自分で管理する推論endpointを使う方針を指します。

BYOM は、外部providerのAPI keyを必ず使う方針ではありません。local endpoint や self-hosted endpoint を使う可能性を含みます。

### desktop native

desktop native は、ユーザーのPC上で動くnative desktop環境を指します。

OS secure storage を利用できる場合に限り、BYOKを許可する余地があります。

### desktop node

desktop node は、ユーザーのPC上でNode.jsプロセスとして動くローカル開発・ローカル実行環境を指します。

GodSandbox の local data folder やローカルexport処理は、この環境で扱うことがあります。ただし、file config にsecretを平文保存してよいという意味ではありません。

### web

web は、ブラウザ上で動くクライアント環境を指します。

web client に標準API keyを保存してはいけません。通常の外部LLM API利用は、server proxy または短命tokenのような境界を通す必要があります。

### mobile native

mobile native は、iOS / Android などのnative mobile app環境を指します。

MVPでは、mobile native に標準API keyを保存しません。通常の外部LLM API利用は server proxy を基本とし、例外は server-issued short-lived token に限定します。

## 基本方針

GodSandbox のLLM利用は、次の順で安全性を優先します。

1. mock/template で外部通信なしに体験を検証する。
2. ユーザーが明示的に選んだAI接続だけを使う。
3. 標準API keyをweb / mobileに置かない。
4. secretをfile configや通常ログへ出さない。
5. free provider を自動fallbackにしない。
6. BYOK / BYOM は、platformごとの境界が明確になってから接続する。

## platform別 provider 方針

| platform | serverProxyProvider | userDirectProvider | localModelProvider | templateProvider | mockProvider | free / demo provider |
| --- | --- | --- | --- | --- | --- | --- |
| desktop native | allowed | exception | allowed | allowed | allowed | exception |
| desktop node | allowed | exception | allowed | allowed | allowed | exception |
| web | allowed | forbidden | forbidden | allowed | allowed | exception |
| mobile native | allowed | forbidden | exception | allowed | allowed | exception |

### provider 方針の補足

- `serverProxyProvider` は、通常の外部LLM API利用でsecretをclientへ置かないための基本経路です。
- `userDirectProvider` は、desktop native / desktop node でOS secure storage等の安全な保存境界がある場合だけ例外的に検討します。
- `localModelProvider` は、ユーザーが明示的に指定したlocal endpointや自己ホストmodelへ接続する将来候補です。
- `templateProvider` と `mockProvider` は外部通信を行わないため、開発・確認用途で許可します。
- free / demo provider は、ユーザーが明示的に選んだ場合のみ例外的に許可します。自動fallback先にはしません。

## platform別 credential / storage 方針

| platform | 標準provider API key | OS secure storage | server-side secret storage | file-based config | local endpoint | server-issued short-lived token |
| --- | --- | --- | --- | --- | --- | --- |
| desktop native | exception | allowed | allowed | forbidden for secrets | allowed | allowed |
| desktop node | exception | exception | allowed | forbidden for secrets | allowed | allowed |
| web | forbidden | forbidden | allowed | forbidden for secrets | forbidden | exception |
| mobile native | forbidden | allowed for app secrets only | allowed | forbidden for secrets | exception | exception |

### credential 方針の補足

- 標準provider API key は、OpenAI / Anthropic / Gemini などの通常API keyを指します。
- `file-based config` は非秘密設定だけに使います。API key、refresh token、user secret を保存してはいけません。
- `server-issued short-lived token` は、serverが短時間だけ使えるcredentialを発行する方式です。標準API keyを端末へ保存する代替ではありません。
- `local endpoint` は、ユーザーが自分で管理するローカルLLMや自己ホストmodelの接続先です。接続先URL自体も、ユーザーが明示的に設定する必要があります。

## allowed / forbidden / exception の意味

### allowed

allowed は、MVPまたは近い将来の設計として許可してよい方針です。

ただし、allowed であっても、ユーザーへの明示、ログ抑制、送信先表示、設定削除手段は必要です。

### forbidden

forbidden は、MVPで禁止する方針です。

特に web / mobile native に標準API keyを保存すること、secretをfile configへ平文保存すること、free providerへ自動fallbackすることは禁止します。

### exception

exception は、条件を満たす場合にだけ許可できる方針です。

例外を実装する場合は、platform、provider、credential type、有効期限、保存場所、削除方法、ログ方針を文書化してから実装します。

## ユーザー持ち込みAIの責任境界

BYOK / BYOM では、ユーザーとGodSandboxの責任境界を明確にします。

### ユーザーの責任

- 自分のAI契約やAPI keyの利用料金を理解する。
- 自分で設定したlocal endpointや自己ホストmodelの稼働状態を管理する。
- providerの利用規約や制限を理解する。
- 必要に応じてAPI keyを失効、再発行、削除する。

### GodSandbox の責任

- API keyやsecretを通常ログに出さない。
- prompt全文やprovider response全文を通常ログに出さない。
- 送信先providerやlocal endpointをユーザーが確認できるようにする。
- free providerやdemo providerへ無断でfallbackしない。
- secret保存が必要な場合は、安全なstorage方針を実装前に固定する。
- 設定削除や接続解除の導線を設計する。

## free provider の自動fallback禁止

GodSandbox は、primary provider が失敗した場合に、ユーザーの会話文脈やキャラクター情報を無断で別providerへ送ってはいけません。

特に次は禁止です。

- serverProxyProvider が失敗したため、free providerへ自動fallbackする。
- userDirectProvider が失敗したため、demo providerへ自動fallbackする。
- localModelProvider が応答しないため、外部providerへ自動fallbackする。

許可できるfallbackは、同じtrust tier内の安全な範囲に限ります。

例:

- templateProvider から mockProvider へのfallbackは許可できる。
- 実LLM provider から外部free providerへのfallbackは禁止する。

## local endpoint 方針

local endpoint は、ユーザーが自分のPCや自分のネットワーク内で動かすローカルLLMまたは自己ホストmodelの接続先です。

MVPでは local endpoint 接続は実装しません。将来実装する場合は、次の条件を満たす必要があります。

- ユーザーが明示的にendpointを設定する。
- 接続先URLをUIで確認できる。
- 外部送信かローカル送信かを区別できる。
- prompt全文を通常ログに出さない。
- 接続失敗時に無断で外部providerへfallbackしない。
- LAN内endpointやlocalhost endpointの扱いを文書化する。

## short-lived token 方針

short-lived token は、serverが短時間だけ使えるcredentialを発行する方式です。

web / mobile native では、標準API keyをclientへ置かない代わりに、short-lived tokenを例外的に使う余地があります。

ただし、次を満たす必要があります。

- tokenの有効期限が短い。
- tokenの利用範囲が限定されている。
- tokenは通常ログに出さない。
- token失効時の挙動が明確である。
- 標準API keyそのものをclientへ渡さない。

## prompt / secret / log 方針

通常ログに出してはいけないものは次の通りです。

- API key
- refresh token
- user secret
- prompt全文
- provider response全文
- local endpoint に含まれるsecret
- debug logに混ざったcredential

debug mode で詳細ログが必要な場合でも、明示的なユーザー許可とredaction方針を先に決めます。

## 実装前のチェックリスト

実LLMやBYOK / BYOMへ進むPBIでは、実装前に次を確認します。

- 対象platformはどれか。
- providerは何か。
- credential typeは何か。
- secret保存が必要か。
- 保存する場合、保存場所はどこか。
- promptやキャラクター情報の送信先はどこか。
- ユーザーに送信先を表示するか。
- fallback先は同じtrust tier内か。
- 通常ログにsecretやprompt全文が出ないか。
- 設定削除やkey失効時の扱いは決まっているか。

## 今回まだ実装しないこと

このPBIでは、次は実装しません。

- API key保存実装
- secure storage実装
- provider設定UI
- OpenAI / Anthropic / Gemini 接続実装
- ローカルLLM接続実装
- server proxy本実装
- package変更
- CI変更

## 次PBI候補

- PBI-LLM-BYOK-CONFIG-DESIGN-001
- PBI-LLM-LOCAL-ENDPOINT-POLICY-001
- PBI-LLM-PROVIDER-SETTINGS-UI-001
- PBI-LLM-SERVER-PROXY-CONTRACT-001
- PBI-LLM-SECRET-REDATION-GUARD-001

## 判断メモ

この文書は、実LLM接続の価値を否定するものではありません。

むしろ、ユーザー持ち込みAIを主軸にするために、secret、credential、local endpoint、platformの境界を先に固定し、後続PBIの安全な実装余地を作るためのものです。
