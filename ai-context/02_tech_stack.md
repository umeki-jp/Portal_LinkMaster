# 02_tech_stack.md (技術の地図)

## 言語・フレームワーク
- **Frontend**: React (Vite), JavaScript (ES6+) [cite: 2025-07-22]
- **Styling**: CSS3 (Vanilla CSS / Module CSS) [cite: 2025-07-22]
- **State Management**: React Context API (SettingsContext, AuthContext) [cite: 2026-04-10]

## インフラ・プラットフォーム
- **Hosting**: Vercel (Frontend) [cite: 2026-01-27]
- **Database / Auth**: Supabase (PostgreSQL) [cite: 2026-01-27]
- **Local Storage**: Browser LocalStorage (ブラウザ版データ保持用) [cite: 2025-07-22]

## 主要ライブラリ
- **@supabase/supabase-js**: クラウド同期・認証用 [cite: 2026-04-10]
- **React Router**: 画面遷移管理（必要に応じて）
- **Lucide React**: アイコンコンポーネント

## 特記事項
- **Hybrid Data Logic**: ログイン時は Supabase、未ログイン時は LocalStorage を優先。両データ間のインポート/エクスポート・上書きコピー機能を搭載。 [cite: 2025-07-22]