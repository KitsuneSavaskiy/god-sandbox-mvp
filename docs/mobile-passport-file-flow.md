# モバイル Passport ファイルフロー設計

PBI-MOBILE-PASSPORT-FILE-FLOW-001 対応ドキュメント

---

## 概要

GodSandbox で育成した Character Passport JSON を、iOS / Android / モバイルWeb 環境でどう受け渡すかを整理する。

このドキュメントは実装を伴わない。導線の選択肢・制約・推奨順・後続PBI候補を明文化し、実装フェーズ着手前の判断材料とすることが目的。

---

## 現在のPC向けPassport連携フロー

### フロー全体像

```
育成ゲーム（GodSandbox本体）
  ↓
Character Passport を JSON で書き出す
  ↓
ブラウザの「ダウンロード」でローカルに保存
  ↓
サンプルゲーム（Passport Paper Battle）を別タブで開く
  ↓
「キャラ情報JSONを選ぶ」ボタンでファイル選択UI を使う
  ↓
JSON を読み込み、displayName / portraitImage / summary / tags を表示に反映する
  ↓
HP や攻撃力などの戦闘数値はサンプルゲーム側の世界ルールで独自に決める
```

### PassportExportPanel の書き出し手段（PC）

`src/presentation/passport/PassportExportPanel.tsx` は現在2つの書き出し手段を提供している。

| 手段 | 実装状況 | 説明 |
|---|---|---|
| クリップボードへコピー | 実装済み | `navigator.clipboard.writeText()` / フォールバックとして `execCommand("copy")` |
| JSON ファイルとしてダウンロード | 実装済み | `Blob` + `<a download>` でブラウザのダウンロード機能を使う。ファイル名は `{characterId}.passport.json` |

### サンプルゲームのファイル読み込み

`sample-games/passport-paper-battle/index.html` のファイル入力:

```html
<label class="file-load__button" for="passportFile">キャラ情報JSONを選ぶ</label>
<input id="passportFile" type="file" accept="application/json,.json" />
```

`main.js` での読み取り項目:

| フィールド | 用途 |
|---|---|
| `displayName` | キャラクター名の表示（必須） |
| `portraitImage` | 肖像画パスの解決と表示 |
| `summary` | 紹介文の表示 |
| `tags` | タグ一覧の表示 |

HP や攻撃力はサンプルゲーム側が固定値で割り当てる。Passport の数値が戦闘に直接影響しない設計になっている。

### 現在の動作確認済み環境

- PC ブラウザ（Chrome / Firefox / Edge）
- GodSandbox 本体は Vite dev server 起動前提
- サンプルゲームは repo root から HTTP server で開く前提
- ファイルダウンロード先はブラウザのデフォルトダウンロードフォルダ

---

## モバイルWebでのファイル選択課題

### iOS Safari

| 課題 | 説明 |
|---|---|
| ファイル選択UIがシステム依存 | 「ファイルを選択」ダイアログは iOS のシステムUI。Files アプリ（iCloud Drive）/ オンデマンドダウンロード / サードパーティアプリの順に表示される |
| ダウンロード先が分かりにくい | GodSandbox から JSON をダウンロードした場合、デフォルトで Files アプリの「ダウンロード」フォルダに入る。ユーザーが場所を意識する必要がある |
| `accept="application/json,.json"` の限界 | `accept` 属性はフィルタとして機能するが、Files アプリの表示が「全ファイル」になることがある。JSON ファイルの識別がOSバージョン依存 |
| JSON ファイルを探す UX | JSON は一般ユーザーが日常的に扱わない形式。Files アプリの中から `.json` を探させるのは難しい |
| 同一ブラウザセッション間の共有 | iOS Safari では同一ブラウザの別タブ間でも localStorage は共有されるが、そのままではサンプルゲームが育成ゲームの localStorage を参照できない（オリジンが同じ場合のみ例外） |

### Android Chrome

| 課題 | 説明 |
|---|---|
| ファイル選択UIの多様性 | Android のファイルマネージャはメーカー・バージョン依存。Google Files / Samsung My Files など複数のアプリが候補として表示される |
| ダウンロード先 | Chrome のデフォルトダウンロード先は「ダウンロード」フォルダ。ファイルマネージャからアクセスできるが、ユーザーが場所を知っている必要がある |
| `accept` 属性のフィルタ精度 | Android では `accept="application/json,.json"` が機能する端末と、全ファイルが表示される端末が混在する |
| JSON ファイルのアイコン識別 | `.json` ファイルのアイコンがメーカー・ファイルマネージャによって異なる。テキストファイルとして扱われることがある |

### 共通課題

| 課題 | 内容 |
|---|---|
| JSONファイルを探す難しさ | 「ダウンロードした JSON を Files アプリから探して選択する」という操作フローは、モバイルに慣れていないユーザーには難しい |
| accept 属性の限界 | `application/json,.json` を指定しても、OSやブラウザのバージョン次第で全ファイルが表示される。絞り込みが保証されない |
| download + file picker の分断 | 育成ゲームでダウンロードしたファイルを、別アプリ（サンプルゲーム）で選び直す操作が必要。PCよりも手順が多い |

---

## 代替導線の比較

以下はモバイルでの Passport 連携の選択肢を整理したものです。今回はいずれも実装しません。

### 比較表

| 導線 | 概要 | モバイルWeb対応 | Capacitor要否 | 実装コスト | 主な制約 |
|---|---|---|---|---|---|
| ファイル選択（現行） | `<input type="file">` でJSONを選ぶ | △（OS依存） | 不要 | 実装済み | JSONを見つけるUXが難しい |
| クリップボード貼り付け | JSON文字列をコピー→貼り付けで渡す | △（API制限あり） | 不要 | 低 | クリップボードAPIはブラウザの権限確認が必要。手順がやや多い |
| Web Share API / 共有シート | OSの共有シートでJSONを渡す | ○（iOS/Android対応） | 不要 | 中 | Web Share API の `files` 対応はブラウザ依存。受信側の対応が別途必要 |
| QRコード | JSON（またはURL）をQRにエンコードして読み取る | △ | 不要 | 中〜高 | Passportのデータ量次第でQR容量に収まらない可能性がある。QRライブラリが必要 |
| URLパラメータ | PassportのJSONをURLにエンコードして渡す | ○ | 不要 | 低〜中 | URLの長さ制限（ブラウザ依存で2KB〜8KB）。大きなPassportは非現実的。URLに個人情報が含まれるリスク |
| Deep Link | カスタムURLスキームやUniversal Linkでアプリを起動しながらPassportを渡す | △（PWA限定） | Phase 2以降で必要 | 高 | Capacitor導入後のPhase 2以降が前提。Web Share Target API が使えるPWAでも部分対応可能 |
| localStorage / IndexedDB | 同一オリジン内でJSONを共有する | ○（同一オリジンのみ） | 不要 | 中 | 育成ゲームとサンプルゲームが同一オリジン（サブパス）に配置されている場合のみ有効 |
| Capacitor Filesystem | Capacitor APIでネイティブファイルシステムを読み書きする | ✗（native app専用） | Phase 2以降で必要 | 高 | Capacitor導入後のPhase 2以降が前提 |
| Capacitor Share | Capacitor APIでOSの共有シートを呼び出す | ✗（native app専用） | Phase 2以降で必要 | 中 | Capacitor導入後のPhase 2以降が前提。書き出し側で使う |

### 各導線の補足

#### ファイル選択（現行）

PCでは問題ない。モバイルでは「JSONをダウンロード → Files/ファイルマネージャから探して選ぶ」という手順が必要で、ユーザーが途中で詰まる可能性がある。

`accept` 属性の説明文とスクリーンショット例をUI上に加えるだけでも離脱率を下げられる可能性がある。

#### クリップボード貼り付け

育成ゲームには「クリップボードへコピー」機能が実装済み。サンプルゲーム側に「JSONを貼り付ける」テキストエリアと読み込みボタンを追加するだけで完結する。

`navigator.clipboard.readText()` はブラウザの権限確認が必要だが、ユーザーが手動でテキストを貼り付ければ権限確認なしに動作する。ファイルシステムへの依存が完全になくなるため、モバイルUXを大きく改善できる可能性がある。

Phase 0 follow-up として最も優先度が高い。

#### Web Share API / 共有シート

ファイルをOSの共有シートで渡す `navigator.share({ files: [jsonFile] })` は、iOS Safari 15.1+ / Android Chrome 89+ で対応している。受信側で Web Share Target API を実装する必要があり、Service Worker が必要になる。MVP段階では実装コストに見合わない可能性がある。

#### QRコード

Passport JSONのデータ量（現在のMinimal Passportは数百バイト程度）であればQR Version 40でも収まる可能性はある。ただし、将来 Passport の項目が増えた場合に制約になる。端末のカメラ起動権限が必要。

#### URLパラメータ

Minimal Passport（`displayName` / `summary` / `tags` 程度）であれば、Base64エンコードしても1〜2KB以内に収まる可能性がある。ただし、URLに個人情報（キャラクター名など）が含まれるリスクと、URLの長さ制限がある。QRコードと組み合わせると有効な導線になる。

#### localStorage / IndexedDB（同一オリジン内）

育成ゲームとサンプルゲームが同一オリジン・同一サーバー（例: `http://localhost:5173/` と `http://localhost:5173/sample-games/passport-paper-battle/`）で提供されている場合、localStorage を介してPassportを直接渡せる。現在のサンプルゲームは静的ファイルとして Vite dev server の外から提供される構成のため、オリジンが異なる可能性がある。Phase 1以降でサンプルゲームを `dist/` パイプラインに統合した場合に有効になる。

---

## MVPでの推奨フェーズ

### Phase 0: ファイル選択を維持しつつ説明を改善する（現行の改善）

**今すぐできること。実装コスト低。**

- ファイル選択UIの近くに「JSONの見つけ方」の説明を追加する
- iOS: 「ダウンロードフォルダ → Files アプリから選んでください」
- Android: 「ダウンロードフォルダ → ファイルマネージャから選んでください」
- エラーメッセージを具体化する（「JSONが見つからない場合は…」など）

変更対象: `sample-games/passport-paper-battle/index.html` または `style.css`

注意: レーンAが `sample-games/passport-paper-battle/**` を担当しているため、この変更はレーンAとの調整後に実施する。

### Phase 0 follow-up: JSON貼り付け入力を検討する

**実装コスト低〜中。モバイルUX改善効果が高い。**

- サンプルゲームにJSON直接貼り付けフォームを追加する
- 育成ゲームの「クリップボードへコピー」→ サンプルゲームの「貼り付け」という流れが完結する
- ファイルシステムへの依存がなくなる
- テキストエリア + 読み込みボタン程度のシンプルな実装で足りる

変更対象: `sample-games/passport-paper-battle/index.html` / `main.js`

注意: レーンAとの調整が必要。別PBIとして切り出す。

### Phase 1: PWAでもファイル選択が成立するか確認する

**PWA manifest 追加後（`PBI-MOBILE-PWA-MANIFEST-001` 完了後）に実施。**

- ホーム画面から起動した場合のファイル選択UIを実機で確認する
- PWA モードでも `<input type="file">` が動作するかを確認する
- Storage / Files アプリとの連携がスタンドアロン起動でも機能するかを確認する
- ファイル選択が機能しない場合の代替導線（貼り付け）が必要になるか判断する

### Phase 2: Capacitor Share / Deep Link を検討する

**Capacitor 導入後（`PBI-MOBILE-CAPACITOR-SCAFFOLD-001` 完了後）に実施。**

- 育成ゲーム側の書き出しに `@capacitor/share` を使う
  - OSの共有シートでJSONを他アプリへ渡せる
  - 受信側のサンプルゲームが同一アプリ内であれば、直接受け取れる
- Deep Link（Universal Links / App Links）でPassportを受け取る設計を検討する
  - カスタムURLスキームにPassport JSONを乗せる案
  - URLの長さ制限に注意

変更対象: package.json（protected path → `manual-review-required`）

### Phase 3: Filesystem / Preferences を検討する

**Phase 2 が安定した後に実施。**

- `@capacitor/filesystem` でネイティブファイルシステムへ書き出す
- `@capacitor/preferences` で Passport の最終エクスポートを保持する
- localStorage の代替として長期保存の信頼性を高める

---

## 後続PBI候補

| PBI ID | 概要 | フェーズ | 着手条件 |
|---|---|---|---|
| `PBI-MOBILE-PASSPORT-FILE-PICKER-SMOKE-001` | iOS / Android 実機でファイル選択UIが動作するか確認する | Phase 0 | Phase 0 モバイルWeb readiness 完了後 |
| `PBI-MOBILE-PASSPORT-PASTE-FLOW-001` | サンプルゲームにJSON貼り付けフォームを追加する | Phase 0 follow-up | レーンAとの調整後。sample-games 変更のため `agent-routine` で可 |
| `PBI-MOBILE-PASSPORT-PWA-FILE-SMOKE-001` | PWAモードでファイル選択UIが動作するか実機確認する | Phase 1 | `PBI-MOBILE-PWA-MANIFEST-001` 完了後 |
| `PBI-MOBILE-PASSPORT-SHARE-FLOW-001` | Capacitor Share で育成ゲームから Passport を書き出す | Phase 2 | `PBI-MOBILE-CAPACITOR-SCAFFOLD-001` 完了後 |
| `PBI-MOBILE-PASSPORT-DEEPLINK-FLOW-001` | Deep Link で Passport をアプリ間受け渡しする設計を実装する | Phase 2 | `PBI-MOBILE-CAPACITOR-SCAFFOLD-001` 完了後 |
| `PBI-MOBILE-PASSPORT-QR-FLOW-001` | QRコード経由でPassportを渡す | Phase 2〜3 | Passportの最大サイズ確定後。QRライブラリ導入が必要（manual-review-required） |
| `PBI-MOBILE-PASSPORT-LOCALSTORAGE-SHARE-001` | 同一オリジン配置時にlocalStorageでPassportを共有する | Phase 1〜2 | sample-games を dist/ パイプラインに統合後 |

---

## 今回やらないこと

- `sample-games/passport-paper-battle/**` の変更
- `src/**` の変更
- `server/**` の変更
- `package.json` / `package-lock.json` の変更
- Capacitor 導入
- PWA manifest 追加
- QRコード実装
- Deep Link 実装
- Web Share API 実装
- Clipboard API 実装（育成ゲーム側は実装済みのため）
- サンプルゲームへの貼り付けフォーム追加（後続PBIで扱う）
- ファイル選択UIのUX改善（レーンAと調整後に後続PBIで扱う）
- Character Passport schema の変更
- README の変更
- PR #107 の P1 finding（android/ios native project管理方針）への対応

---

## 関連ドキュメント

- [モバイル移植方針](mobile-porting-strategy.md)
- [Character Passport 安定公開インターフェース方針](character-passport-stable-interface.md)
- [Character Passport 外部ゲームIF仕様 自由度監査](character-passport-external-game-if-audit.md)
