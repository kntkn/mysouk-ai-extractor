# マイソクAI抽出システム

マイソクPDFをドラッグ&ドロップで投入すると、AIが物件情報を抽出し、Notionデータベースに美しい縦型ページを自動生成するWebアプリです。

## ✨ 主要機能

- **複数PDFの一括処理** - 1つのPDFに複数物件が含まれる場合も自動検出・分割
- **リアルタイム進捗表示** - 処理工程をステップバーとストリーミングログで可視化
- **AI抽出エンジン** - Claude 3.5 Sonnetで高精度な情報抽出
- **Notion自動連携** - 指定データベースに縦型レイアウトでページ作成
- **画像自動抽出・分類** - 間取り図、内装、外装写真を自動分類
- **検証UX** - confidence表示、根拠提示、要確認ハイライト
- **A4縦PDF生成** - Notionページと同じ内容でPDF出力

## 🚀 セットアップ

### 1. 環境変数設定

`.env.local` に以下を設定：

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Notion API
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

# App Configuration
APP_BASE_URL=http://localhost:3000
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 🔄 処理フロー

1. **受付** - PDF複数ファイルをドラッグ&ドロップ
2. **PDF解析** - ページ数、基本構造を分析
3. **物件検出/分割** - 1PDF内の複数物件を検出・分割
4. **抽出** - Claude APIで各物件の詳細情報を抽出
5. **正規化** - 数値変換、フォーマット統一
6. **画像抽出/分類** - 間取り図と写真の自動分類
7. **Notion反映** - データベースにページ作成
8. **完了** - 作成ページURLの表示

## 🛠️ 技術スタック

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude 3.5 Sonnet
- **Database**: Notion API
- **Storage**: Vercel Blob
- **PDF処理**: pdf-parse + pdf2pic
- **画像処理**: Sharp
- **PDF生成**: Playwright
- **Hosting**: Vercel

## 📁 プロジェクト構造

```
src/
├── app/              # Next.js App Router
├── components/       # React コンポーネント
├── lib/             # ライブラリとユーティリティ
├── types/           # TypeScript型定義
├── utils/           # ヘルパー関数
└── api/             # API エンドポイント
```
