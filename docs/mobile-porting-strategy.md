# モバイル移植方針

PBI-MOBILE-PORTING-STRATEGY-001 対応ドキュメント

---

## 概要

GodSandbox MVP および Passport Paper Battle サンプルゲームを、将来的に iOS / Android でも稼働できるようにするための移植方針・段階ロードマップ・技術制約を整理する。

このドキュメントは実装を伴わない。設計判断の根拠を明文化し、各フェーズ着手前に参照できるようにすることが目的。

### MVP方針

このドキュメントでの最初のMVPは、App Store / Google Play 配布ではなく、Web公開URLを iOS Safari / Android Chrome から開いて遊べる状態を指す。

- iOS MVP: Apple の App Store 審査を前提にせず、Safari で公開URLを開いて操作できることを優先する。
- Android MVP: Google Play 配布を前提にせず、Chrome で公開URLを開いて操作できることを優先する。
- ホーム画面追加は便利な任意導線として扱う。最初の必須条件にはしない。
- App Store / TestFlight / Capacitor / native project は、ストア配布やネイティブ機能が必要になった後続フェーズで扱う。

この方針により、まず Web/shared の実装価値を最大化し、ネイティブ配布の審査・証明書・ストア運用コストは後から判断する。

---

## 現行構成の整理

### 技術スタック

| 項目 | 現状 |
|---|---|
| フレームワーク | Vite 6.2 + React 19 + TypeScript 5.8 |
| 3Dレンダリング | Three.js 0.175 |
| サンプルゲーム | 静的 HTML / CSS / ES Module JS（バンドラーなし） |
| 永続化 | localStorage のみ |
| ビルド成果物 | `dist/` 以下の静的ファイル |
| PWAプラグイン | 未導入（`vite-plugin-pwa` なし） |
| Capacitor | 未導入 |

### viewport の現状

| ファイル | viewport meta | 状況 |
|---|---|---|
| `index.html`（本体） | `width=device-width, initial-scale=1.0` | 設定済み ✓ |
| `sample-games/passport-paper-battle/index.html` | `width=device-width, initial-scale=1.0` | 設定済み ✓ |

基本的な viewport 設定は両方に存在する。`manifest.json` とアイコンは未設定。

### ビルド成果物の構成

```
dist/               ← Vite build成果物（本体）
sample-games/       ← 静的HTMLゲーム（Viteのbuildに含まれない）
  passport-paper-battle/
    index.html
    main.js
    style.css
    sample-passport.json
```

サンプルゲームは Vite のビルドパイプラインに含まれていない。Capacitor に載せる場合は、サンプルゲームをどう扱うか（`dist/` に含めるか、別ルートとして扱うか）を Phase 2 着手前に決める必要がある。

---

## 移植フェーズ一覧

| フェーズ | 名称 | 主目的 | native app化 |
|---|---|---|---|
| Phase 0 | Mobile Web readiness + 公開URL確認 | 公開URLを iOS Safari / Android Chrome で開いて表示・操作できる | なし |
| Phase 1 | PWA readiness | 任意でスマホのホーム画面から起動できる | なし |
| Phase 2 | Capacitor native wrapper | App Store / Google Play 配布やネイティブ機能追加を可能にする | あり |
| Phase 3 | Native device features | ネイティブ機能を追加する | あり |

フェーズ間の依存:

```
Phase 0（必須）→ Phase 1 → Phase 2 → Phase 3（任意）
```

Phase 0 なしで Phase 2 へ移行した場合、スマホ表示の問題がネイティブビルド後に初めて発覚し、修正コストが大きくなる。

---

## Phase 0: Mobile Web readiness + 公開URL確認

### 目的

ブラウザ上でスマホ表示・タッチ操作・画面幅・縦長表示に耐えられるようにする。native app 化はしない。

Phase 0 の完了条件は、ローカル開発環境だけではなく、GitHub Pages / Cloudflare Pages / Vercel / Netlify などのWeb公開URLから iOS Safari / Android Chrome で起動・操作できることを確認すること。

この段階では Apple の App Store 審査は不要。iPhone利用者には Safari で公開URLを開く導線を案内する。Android利用者には Chrome で公開URLを開く導線を案内する。

ホーム画面追加は「アプリのように開きたい人向け」の任意導線とし、MVPの必須条件にはしない。

### 対象

- 育成ゲーム本体（`src/` 以下）
- Passport Paper Battle（`sample-games/passport-paper-battle/`）
- Character Passport の export / import 導線

### サンプルゲームの具体的な課題

コードレビューで判明した具体的な問題を以下に示す。

#### 1. 10×5 盤面のスマホ表示

`style.css`:
```css
.board {
  grid-template-columns: repeat(10, minmax(48px, 1fr));
}
```

10列 × 最小48px = **最低480px** の横幅が必要。  
iPhone SE（375px）など狭いスマホでは盤面が画面幅を超える。

`@media (max-width: 860px)` で `overflow-x: auto` は設定済み。ただし横スクロールは操作性が低い。

対応候補:
- セルサイズを画面幅に合わせてさらに縮小する
- 5×10 の縦長レイアウトに切り替える（portrait向け）
- 盤面を2段に分割する（1〜5列目、6〜10列目）
- ピンチズームで拡大できるようにする

#### 2. セルのタップターゲット

`style.css`:
```css
.cell {
  min-height: 86px; /* PC */
}
/* 860px以下 */
.cell {
  min-width: 48px;
  min-height: 74px;
}
```

高さは74px以上で問題ないが、幅が画面幅によっては48px以下に縮む可能性がある。  
推奨最小タップターゲットは44px（Apple HIG基準）。盤面が縮んだ時の実測確認が必要。

#### 3. 画像パス問題

`main.js`:
```js
function resolveSampleImagePath(src) {
  if (src?.startsWith("/art/")) {
    return `../../public${src}`;
  }
  return src;
}
```

これは dev server 向けの相対パス変換。以下の環境では動作しない可能性がある:

| 環境 | 状況 |
|---|---|
| Vite dev server | `../../public/art/...` として解決される（動作する） |
| `dist/` ビルド後 | `dist/` に `/art/` ファイルが含まれていれば `/art/...` で直接解決 |
| `file://` プロトコル | 相対パスが機能しない場合がある |
| Capacitor native shell | WebView の base URL が `capacitor://` のため `/art/...` が正しく解決されない可能性がある |

Phase 2 着手前に、サンプルゲームを `dist/` ビルドパイプラインに含める、または Capacitor の設定で WebView の base URL を統一する対応が必要。

#### 4. `fetch("./sample-passport.json")` の扱い

`main.js`:
```js
const response = await fetch("./sample-passport.json", { cache: "no-store" });
```

HTTP サーバーが必要。以下の環境では失敗する:

- `file://` から直接開いた場合（CORS エラー）
- Capacitor の `file://` モード（デフォルトは `capacitor://` なので通常は問題ないが要確認）

フォールバック実装済みのため致命的ではないが、初期ロードでエラーログが出る点は Phase 2 着手前に解消する。

#### 5. ファイル選択 UI のスマホ挙動

`index.html`:
```html
<label class="file-load__button" for="passportFile">キャラ情報JSONを選ぶ</label>
<input id="passportFile" type="file" accept="application/json,.json" />
```

`<input type="file">` はスマホブラウザでも動作する。ただし:

- iOS Safari: ファイルアプリ / iCloud Drive / Files アプリから選択するUIになる
- Android Chrome: ストレージアプリ / ファイルマネージャから選択
- JSON ファイルの保存先と探し方をユーザーが理解できるかが UX 課題

#### 6. チュートリアルパネルと縦長表示

`.passport-panel`（サイドバー）と `.battle-panel`（本体）は `@media (max-width: 860px)` で縦並びに切り替わる。  
パスポートパネルが先に表示され、その下に盤面が来る。スマホ縦持ちでは盤面までスクロールが必要になる。

初回操作までのスクロール量を減らす導線設計の検討が必要。

### 育成ゲーム本体（Three.js）の課題

| 項目 | 懸念 |
|---|---|
| Three.js パフォーマンス | スマホGPUはデスクトップより弱い。MVP段階では描画負荷を抑えた実装を優先する |
| canvas の touch操作 | Three.js の OrbitControls はタッチ操作に対応しているが、動作確認が必要 |
| UI パネルの縦長表示 | アポストル解釈パネル・コマンド入力・イベントモーダルなどの縦方向配置を確認する |

---

## Phase 1: PWA readiness

### 目的

スマホのホーム画面に追加し、アプリのように起動できるようにする。

Phase 1 は Web公開URLで遊べる Phase 0 が成立した後の改善フェーズ。ホーム画面追加は便利だが、App Store / Google Play 配布や native app 化とは別物として扱う。

### 主な検討対象

| 項目 | 内容 | MVP優先度 |
|---|---|---|
| `manifest.json` | アプリ名・アイコン・テーマカラー・display モードを定義する | 高 |
| アイコン | 192px / 512px の PNG を用意する | 高 |
| `<meta name="theme-color">` | ステータスバー色を統一する | 中 |
| install prompt | 「ホーム画面に追加」を促す UX | 低 |
| Service Worker | オフライン対応・キャッシュ戦略 | 後回し |

### Service Worker についての判断

MVP では Service Worker を導入しない。

- localStorage ベースのゲームはオフライン化の恩恵が少ない
- Service Worker のバグはキャッシュ起因のデバッグが難しい
- `vite-plugin-pwa` を使えば後から追加可能なため、先行導入のリスクが価値を上回る

### 推奨ライブラリ

```
vite-plugin-pwa
```

Vite に統合されており、manifest と Service Worker のひな型を自動生成できる。  
`package.json` は protected path のため、導入時は `manual-review-required` 扱いとする。

---

## Phase 2: Capacitor native wrapper

### Capacitor を採用する理由

| 比較項目 | Capacitor | React Native |
|---|---|---|
| 既存コードの流用 | Vite+React のビルド成果物をそのまま使える | JSX/コンポーネントを React Native APIに書き換えが必要 |
| Three.js との相性 | WebView 内でそのまま動作 | react-native-three 等の追加レイヤーが必要 |
| 静的HTMLサンプルの扱い | WebView 内でそのまま動作 | React Native に移植が必要 |
| 学習コスト | Webスキルのまま扱える | React Native 独自APIを学ぶ必要がある |
| 採用推奨タイミング | Web→Native化の最初のステップとして適切 | Web成果物がない新規アプリから始める場合 |

**結論: React Native へ今すぐ移行しない。ストア配布やネイティブ機能が必要になった時点で Capacitor を採用する。**

Phase 0 のMVPは Web公開URLで提供するため、App Store 審査や Google Play 審査を必要としない。App Store / TestFlight / Google Play で配布する段階に進む場合は、審査・署名・証明書・ストア運用を含めて Phase 2 で扱う。

PWA だけでは App Store / Google Play へのネイティブアプリ配布ができないため、ストア配布が必要になった時点で Capacitor を導入する。

### 主な導入対象

| パッケージ / ファイル | 役割 |
|---|---|
| `@capacitor/core` | Capacitor ランタイム本体 |
| `@capacitor/cli` | ビルド・同期コマンド群 |
| `@capacitor/android` | Android プロジェクト生成 |
| `@capacitor/ios` | iOS プロジェクト生成 |
| `capacitor.config.ts` | webDir・appId などを定義する設定ファイル |
| `android/` | Android ネイティブプロジェクト（自動生成） |
| `ios/` | iOS ネイティブプロジェクト（自動生成） |

Capacitor v8 の最小対応: iOS 15.0、Android 7.0（API 24）。  
推奨開発環境: Node 22、Xcode 26.0、Android Studio 2025.2.1。

### Git 管理方針

| 対象 | 方針 | 理由 |
|---|---|---|
| `android/` / `ios/` | 現時点では未決。Capacitor scaffold PBI で判断する | 自動生成部分と手動変更部分が混在し得るため、先に「原則ignore」と固定しない |
| `capacitor.config.ts` | 管理対象に含める | appId・webDir などチームで共有が必要な設定値 |
| Xcode / Android Studio 固有の変更 | 手動で管理 | 自動生成外の変更は再生成で失われる可能性がある |

`android/` / `ios/` を commit 管理するか、`.gitignore` で除外して再生成前提にするかは、`PBI-MOBILE-CAPACITOR-SCAFFOLD-001` で再判断する。CI/CD でネイティブビルドを自動化する場合も、その時点で管理方針を決める。

### サンプルゲームの扱い（Phase 2 の前提課題）

Capacitor の `webDir` は `dist/` を指定する想定。サンプルゲームを Capacitor に含めるには:

**選択肢 A: `public/sample-games/` に移動し、Vite build で `dist/` に含める**
- 画像パス問題も統一的に解決できる
- Vite のビルドパイプラインにサンプルゲームを組み込む形になる

**選択肢 B: 別の native shell（別 Capacitor プロジェクト）に分ける**
- 本体とサンプルゲームを独立して配布できる
- 管理コストが増える

**選択肢 C: 本体の別ルート（`/sample-games/`）として配信する**
- Vite の `publicDir` や手動 copy で `dist/sample-games/` に配置する
- サンプルゲームが `index.html` 起点のため、ルーティング設定が必要になる場合がある

Phase 2 着手前にこの選択をする必要がある。

### localStorage の挙動

Capacitor では WebView 内で localStorage がそのまま動作する。ただし:

- iOS Safari は「ストレージの削除」設定でデータが消える可能性がある
- 長期保存が必要なデータは Phase 3 で `@capacitor/preferences` または SQLite プラグインへの移行を検討する

---

## Phase 3: Native device features（将来検討）

現時点では実装しない。必要になった機能から個別に追加する。

| 機能 | Capacitor プラグイン候補 |
|---|---|
| ローカルファイル read/write | `@capacitor/filesystem` |
| Passport JSON の共有 | `@capacitor/share` |
| ローカル通知 | `@capacitor/local-notifications` |
| 触感フィードバック | `@capacitor/haptics` |
| ディープリンク | `@capacitor/app` |
| 永続ストレージ強化 | `@capacitor/preferences` |
| カメラ | `@capacitor/camera` |

---

## Character Passport のモバイルファイル読み込み課題

育成ゲームからサンプルゲームへの Passport JSON 連携は、現在ファイルベース（JSON ダウンロード → ファイル選択）。モバイルでの想定フロー:

### 現在のPC想定フロー

```
育成ゲーム → JSON export → ファイルシステム保存 → ブラウザのファイル選択 → サンプルゲームへ読み込み
```

### モバイルでの課題

| 課題 | 内容 |
|---|---|
| JSON の保存先 | iOS はデフォルトで「ファイル」アプリ（iCloud Drive）か「ダウンロード」フォルダ。ユーザーが場所を意識する必要がある |
| ファイル選択UI | iOS Safari では「ファイルを選択」ダイアログがシステムUIになる。`application/json` フィルタは機能するが、JSON が正しく表示されるかはOS依存 |
| URLスキーム連携 | Phase 2 以降で Deep Link を活用し、育成ゲームからサンプルゲームへ URL スキームでキャラデータを渡す設計も検討できる |
| クリップボード経由 | ファイルではなく JSON 文字列をクリップボード経由で渡す方式も考えられる（Phase 3 の範囲） |

Phase 0・1 の段階では「ファイル選択 UI がモバイルでも動作すること」を確認することが優先。

---

## WSL / Windows / Mac / Xcode / Android Studio の制約

Claude の現行実行環境は WSL（Linux on Windows）。作業可否を明確にする。

### WSL / Windows でできること

| 作業 | 可否 |
|---|---|
| Vite dev server 起動・ビルド | 可 |
| TypeScript 型チェック | 可 |
| Capacitor CLI インストール・設定 | 可 |
| `npx cap sync`（ビルド成果物の同期） | 可 |
| `capacitor.config.ts` 作成 | 可 |
| Android Studio インストール（Windows側） | 可 |
| Android エミュレータ起動（Windows側） | 可 |
| Android デバッグビルド作成 | 可（Android Studio 必要） |
| docs / 設計作業全般 | 可 |

### Windows 側で必要になる作業

| 作業 | 必要ツール |
|---|---|
| Android ビルド | Android Studio 2025.2.1+（Windows インストール） |
| Android エミュレータ | Android Studio の AVD Manager |
| Android 実機デバッグ | Android Studio + USB デバッグ or Wi-Fi デバッグ |

### Mac / Xcode が必須になる作業

| 作業 | 必要ツール |
|---|---|
| iOS ビルド | macOS + Xcode 26.0+ |
| iOS シミュレータ | Xcode 付属 Simulator（macOS のみ） |
| iOS 実機デバッグ | Xcode + Apple Developer アカウント |
| App Store 申請 | macOS + Xcode + Apple Developer Program |
| iOS 向け証明書・プロビジョニング | macOS Keychain + Xcode |

**iOS 実機ビルドおよび App Store 申請は、現在の WSL / Windows 環境では実施できない。**  
Phase 2 の iOS 対応着手前に、macOS 利用可能な環境を別途用意する必要がある。

### CI/CD でのネイティブビルド（将来）

将来的に自動化する場合の候補:

| 対象 | サービス候補 |
|---|---|
| Android ビルド自動化 | GitHub Actions（Linux runner + Android SDK） |
| iOS ビルド自動化 | GitHub Actions（macOS runner）/ Codemagic / Bitrise |

macOS runner は GitHub Actions の有料プランで使用可能。無料範囲での iOS CI は困難。

---

## 後続PBI候補

以下の順で実施することを推奨する。

```
PBI-MOBILE-WEB-READINESS-001
  スマホ幅・タッチ操作・viewport・縦長表示を育成ゲーム本体で整える
  PR #101 マージ後に対応

PBI-WEB-DEPLOY-BROWSER-MVP-001
  Web公開URLで iOS Safari / Android Chrome からMVPを開ける導線を作る
  Phase 0 の中核。App Store / Google Play 配布は対象外

PBI-MOBILE-SAMPLE-BATTLE-RESPONSIVE-001
  Passport Paper Battle の 10×5 盤面をスマホで扱いやすくする
  PR #101 マージ後に対応

PBI-MOBILE-PWA-MANIFEST-001
  manifest.json / icon / install 導線を追加する
  package.json 変更を伴う → manual-review-required

PBI-MOBILE-CAPACITOR-SCAFFOLD-001
  @capacitor/* 導入、capacitor.config 作成、native project 初期化
  package.json 変更を伴う → manual-review-required
  Phase 0・1 完了が前提

PBI-MOBILE-ANDROID-SMOKE-001
  Android エミュレータ / 実機で起動確認
  Windows + Android Studio が必要

PBI-MOBILE-IOS-SMOKE-001
  iOS シミュレータ / 実機で起動確認
  macOS + Xcode が必要

PBI-MOBILE-PASSPORT-FILE-FLOW-001
  モバイルでの Passport JSON export / import 動線を確認・改善する
```

### PBI 着手条件サマリー

| PBI | 着手条件 |
|---|---|
| WEB-READINESS | PR #101 マージ後 |
| WEB-DEPLOY-BROWSER-MVP | WEB-READINESS の最低限確認後。公開URLでスマホ実機確認する |
| SAMPLE-BATTLE-RESPONSIVE | PR #101 マージ後 |
| PWA-MANIFEST | manual-review-required; Phase 0 完了後 |
| CAPACITOR-SCAFFOLD | manual-review-required; Phase 0・1 完了後 |
| ANDROID-SMOKE | CAPACITOR-SCAFFOLD 完了後; Android Studio 必要 |
| IOS-SMOKE | CAPACITOR-SCAFFOLD 完了後; macOS + Xcode 必要 |
| PASSPORT-FILE-FLOW | Phase 0 完了後 |

---

## 今回やらないこと

このPBIのスコープ外を明示する。

- `package.json` / `package-lock.json` の変更
- `@capacitor/*` のインストール
- `android/` / `ios/` ネイティブプロジェクトの生成
- `android/` / `ios/` の commit 管理方針確定
- ネイティブビルドの実行
- Android Studio / Xcode の操作
- `sample-games/passport-paper-battle/**` の変更（PR #101 と競合するため）
- `src/**` の変更
- `server/**` の変更
- manifest / Service Worker / アイコンの実装
- React Native / Expo への移行
- App Store / Google Play の配布設計
- 署名・プロビジョニングの設定
- シークレット・認証情報の管理

---

## 主なリスクと対応方針

| リスク | 対応 |
|---|---|
| Three.js スマホパフォーマンス | Phase 0 で DevTools モバイルエミュレーションまたは実機で早期確認 |
| 10×5 盤面の横スクロール UX | Phase 0 で盤面の縦長レイアウト対応を検討 |
| Web公開URLなしでモバイル確認がローカル依存になる | Phase 0 で公開URL確認PBIを用意し、Safari / Chrome から実機確認する |
| `/art/` 画像パスの Capacitor 非互換 | Phase 2 着手前にサンプルゲームを `dist/` パイプラインに統合 |
| `fetch()` が `file://` で失敗する | フォールバック実装済みだが、Phase 2 着手前に HTTP ベースに統一 |
| iOS ビルドに macOS が必要 | Phase 2 着手前に macOS 利用可能な環境を確保する |
| `package.json` が protected path | Capacitor / vite-plugin-pwa 導入時は `manual-review-required` で PR を立てる |
| PR #101 との競合 | Phase 0 の `sample-games/passport-paper-battle/` 変更は PR #101 マージ後に行う |
