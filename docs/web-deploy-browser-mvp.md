# Web公開URLで遊べるMVP方針

PBI-WEB-DEPLOY-BROWSER-MVP-001 対応ドキュメント

---

## この文書の目的

GodSandbox MVP は、最初から iOS ネイティブアプリとして出すのではなく、まず Web公開URL から遊べる形を目指す。

つまり、ユーザーは次のように遊べる。

```text
公開URLを開く
↓
iPhone Safari / Android Chrome / PCブラウザで遊ぶ
```

この段階では、App Store、TestFlight、Capacitor、PWA plugin は使わない。

まず「URLを開けば遊べる」状態を作り、MVPの体験確認を優先する。

---

## 結論

MVPの最初の公開経路は Web公開URL にする。

| 判断 | 方針 |
|---|---|
| iPhoneで遊ぶ方法 | Safari で公開URLを開く |
| Androidで遊ぶ方法 | Chrome で公開URLを開く |
| PCで遊ぶ方法 | Chrome / Edge / Firefox などで公開URLを開く |
| App Store審査 | この段階では不要 |
| TestFlight | この段階では不要 |
| Capacitor | 後続フェーズへ戻す |
| PWA plugin | 後続フェーズへ戻す |

非技術者には、まず次の一文で説明できる状態を目指す。

```text
このゲームは、まず普通のWebページとして公開します。
iPhoneでもAndroidでもPCでも、URLを開けば遊べます。
```

---

## なぜWeb公開を先にするのか

### Apple審査を待たずに試せる

iOSネイティブアプリとして配布する場合、App Store審査や TestFlight の準備が必要になる。

Web公開なら、まずURLを共有するだけで試せる。

### 修正が速い

MVPでは、UI、操作感、スマホ表示、キャラクター体験を何度も直す可能性が高い。

Web公開なら、修正後に再buildして再deployすればよい。

### iPhone / Android / PC を同じ入口にできる

Web公開なら、端末ごとに別の配布手順を用意しなくてもよい。

最初の体験確認では、これは大きな利点になる。

### native化の判断を後回しにできる

Webで十分に遊べるか確認してから、必要に応じて Capacitor / App Store / TestFlight に進む。

これにより、早すぎるnative化で手戻りするリスクを下げる。

---

## 基本手順

### 1. buildする

ローカルまたはホスティングサービス上で、次を実行する。

```bash
npm run build
```

Vite は production 用の静的ファイルを `dist/` に出力する。

### 2. `dist/` を静的ホスティングに載せる

`dist/` の中身を Web公開サービスへアップロード、または Git 連携で自動deployする。

### 3. 公開URLを開く

例:

```text
https://example.pages.dev/
https://example.vercel.app/
https://example.netlify.app/
https://<username>.github.io/<repo>/
```

### 4. 端末で確認する

- iPhone Safari で開く
- Android Chrome で開く
- PCブラウザで開く

この段階では、アプリをインストールしなくてもよい。

---

## Web公開サービス比較

| サービス | 向いている場面 | 良い点 | 注意点 |
|---|---|---|---|
| GitHub Pages | GitHubだけで最小公開したい | リポジトリと近い。静的サイト公開に向く | Vite の `base` 設定が必要になる場合がある |
| Cloudflare Pages | 無料枠で速く静的公開したい | Git連携で `npm run build` と `dist/` 公開がしやすい | Cloudflare アカウントとプロジェクト設定が必要 |
| Vercel | Preview URLを使いながら試したい | PRごとのpreview運用と相性がよい | 設定が増えるとVercel固有の運用に寄る |
| Netlify | 静的サイトを手早く公開したい | drag and drop やGit連携が分かりやすい | team / build設定の整理が必要になる場合がある |

### MVPでの見方

最初の目的は「きれいな運用」よりも「URLで遊べること」。

そのため、次の基準で選ぶ。

| 優先したいこと | 候補 |
|---|---|
| GitHubだけで閉じたい | GitHub Pages |
| 設定を簡単にして速く公開したい | Cloudflare Pages / Netlify |
| PR preview を使いたい | Vercel / Cloudflare Pages / Netlify |
| 独自ドメインや将来運用も見たい | Cloudflare Pages / Vercel / Netlify |

---

## GitHub Pagesを使う場合の注意

GitHub Pages で `https://<username>.github.io/<repo>/` のようにリポジトリ名つきURLへ公開する場合、Vite の `base` 設定が必要になることがある。

例:

```ts
export default defineConfig({
  base: "/god-sandbox-mvp/",
});
```

ただし、このPBIでは `vite.config.ts` を変更しない。

GitHub Pages を正式採用する場合は、後続PBIで `base` 設定の有無を確認する。

### 判断ポイント

| 公開先 | `base` 検討 |
|---|---|
| `https://<username>.github.io/` | 多くの場合 `/` のままでよい |
| `https://<username>.github.io/<repo>/` | `/<repo>/` が必要になる可能性が高い |
| Cloudflare Pages / Vercel / Netlify のルート公開 | 多くの場合 `/` のままでよい |

---

## iPhone / Android / PC での確認導線

### iPhone Safari

1. 公開URLを Safari で開く。
2. 画面が崩れないか確認する。
3. タップ操作ができるか確認する。
4. 必要なら Safari の共有メニューから「ホーム画面に追加」を使う。

「ホーム画面に追加」は任意導線です。

MVPでは必須にしない。

### Android Chrome

1. 公開URLを Chrome で開く。
2. 画面が崩れないか確認する。
3. タップ操作ができるか確認する。
4. 必要なら Chrome のメニューから「ホーム画面に追加」を使う。

### PCブラウザ

1. 公開URLを Chrome / Edge / Firefox で開く。
2. 既存のローカル起動時と同じ主要導線が通るか確認する。
3. スマホ幅の確認は DevTools のモバイル表示でも補助確認する。

---

## このPBIで公開対象にするもの

まずは GodSandbox 本体の Vite build 成果物を想定する。

```text
npm run build
↓
dist/
↓
静的ホスティングへ公開
```

### サンプルゲームの扱い

`sample-games/passport-paper-battle/` は、現時点では Vite の `dist/` に自動で含まれる前提ではない。

サンプルゲームも同じ公開URLに含めるかは、後続PBIで決める。

今回の文書では、サンプルゲームの移動、コピー、build設定変更は行わない。

---

## 今回やらないこと

- GitHub Actions追加
- package変更
- PWA plugin導入
- Capacitor導入
- iOS native project生成
- Android native project生成
- App Store申請
- TestFlight設定
- 実装変更
- 起動スクリプト変更
- Vite `base` 設定変更
- Web公開サービスへの実deploy

---

## native化は後続フェーズへ戻す

Web公開MVPで確認したあと、必要なら次へ進む。

| 後続フェーズ | 目的 |
|---|---|
| PWA readiness | ホーム画面追加やmanifestを整える |
| Capacitor native wrapper | Web成果物をnative shellに載せる |
| App Store / TestFlight | iOS配布へ進む |
| Android native | Androidアプリ配布へ進む |

native化は価値があるが、MVPの最初の検証には重い。

まずWebで遊べるURLを作り、体験価値とスマホ表示の課題を確認する。

---

## 後続PBI候補

| PBI | 目的 |
|---|---|
| `PBI-WEB-DEPLOY-SERVICE-SELECTION-001` | GitHub Pages / Cloudflare Pages / Vercel / Netlify のどれを採用するか決める |
| `PBI-WEB-DEPLOY-GITHUB-PAGES-001` | GitHub Pages で公開する場合の `base` と公開手順を実装する |
| `PBI-WEB-DEPLOY-CLOUDFLARE-PAGES-001` | Cloudflare Pages で公開する場合の設定を整理する |
| `PBI-WEB-DEPLOY-MOBILE-SMOKE-001` | 公開URLを iPhone Safari / Android Chrome / PC で確認する |
| `PBI-WEB-DEPLOY-SAMPLE-GAME-INCLUDE-001` | サンプルゲームを公開URLに含めるか決める |
| `PBI-PWA-HOME-SCREEN-001` | ホーム画面追加を任意導線として整える |
| `PBI-MOBILE-CAPACITOR-RETURN-POINT-001` | native化へ戻る条件を整理する |

---

## 参考

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Netlify: Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Cloudflare Pages: Framework guides](https://developers.cloudflare.com/pages/framework-guides/)
