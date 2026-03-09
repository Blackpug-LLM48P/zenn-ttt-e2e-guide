# TTT & TTT-E2E スターターテンプレート

Zenn有料記事「**【2026決定版】TTT & TTT-E2E 日本語最深解説**」の付属テンプレートです。

## 構成

```
ttt-e2e-template/
├── src/
│   └── example.ts          # サンプル実装
├── tests/
│   ├── unit/
│   │   └── example.test.ts # ユニットテスト（Jest）
│   └── e2e/
│       └── example.spec.ts # E2Eテスト（Playwright）
├── jest.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## セットアップ

```bash
npm install
```

## テスト実行

### ユニットテスト（Jest）

```bash
npm test
```

### カバレッジ付きユニットテスト

```bash
npm run test:coverage
```

### E2Eテスト（Playwright）

```bash
# ブラウザドライバーのインストール（初回のみ）
npx playwright install

# E2Eテスト実行
npm run test:e2e
```

## カスタマイズ

1. `src/` 配下に実装コードを追加
2. `tests/unit/` 配下にユニットテストを追加
3. `tests/e2e/` 配下にE2Eテストを追加
4. `playwright.config.ts` の `baseURL` をアプリのURLに変更
