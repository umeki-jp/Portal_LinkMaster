# 05_project_log.md (今の状態)

## TODOリスト
- [ ] 拡張機能の実装（具体的な依頼・仕様確定後に着手）
- [ ] 運用開始後のユーザーフィードバック収集

### 脆弱性・改善TODO（2026-04-11 追加）

#### 重大
- [x] `javascript:` / `data:` などの危険なURLスキームが、JSONインポート・localStorage・クラウド読込経由では未検証のまま `href` に描画される。保存時だけでなく、読込時と描画時にも `http://` / `https://` のみ許可する共通バリデーションを導入する。 (`src/components/LinkCard.jsx`, `src/components/modals/LinkFormModal.jsx`, `src/components/modals/MenuModal.jsx`, `src/App.jsx`) [done: 2026-04-11]

#### 大
- [x] `localStorage` と設定値の `JSON.parse` が無防備で、保存データが1件でも破損すると初期表示時点でアプリ全体が起動不能になりうる。安全なパーサー、破損検知、復旧導線（初期化・退避・通知）を追加する。 (`src/App.jsx`, `src/contexts/SettingsContext.jsx`) [done: 2026-04-11]
- [x] `AuthContext` の初期セッション取得失敗時に `loading` が解除されず、アプリ全体が描画待ちのまま固まる可能性がある。`try/catch/finally` で認証初期化失敗を明示的に処理する。 (`src/contexts/AuthContext.jsx`) [done: 2026-04-11]
- [x] `deleteGroup` と `setMainGroup` のクラウド更新が複数クエリの逐次実行で非原子的になっており、通信断や同時操作でデータ不整合を起こしうる。DB制約・CASCADE・RPC化で1操作にまとめる。 (`src/lib/db.js`) [done: 2026-04-11]

#### 中
- [x] JSONインポートがスキーマ・型・件数・文字列長の検証なしで state に反映されるため、表示崩れ・実行時例外・過大データによるブラウザ負荷増大を招きうる。インポート前の正規化、件数上限、必須項目チェックを追加する。 (`src/components/modals/MenuModal.jsx`, `src/App.jsx`) [done: 2026-04-11]
- [x] Supabase の環境変数未設定時でもクライアント生成を進めてしまい、障害原因が実行時まで見えにくい。起動時ガードを追加して設定不足を即時検知できるようにする。 (`src/lib/supabase.js`) [done: 2026-04-11]

#### 小
- [x] クラウド更新の一部が楽観更新または fire-and-forget で、保存失敗時に画面表示とSupabase上の実データが静かに乖離する。失敗時のロールバック、再読込同期、ユーザー通知を追加する。 (`src/App.jsx`) [done: 2026-04-11]
- [x] 配備時の CSP / `frame-ancestors` / `Referrer-Policy` などのセキュリティヘッダー方針がリポジトリ上で管理されていない。静的ホスティング設定にセキュリティヘッダーを明示し、外部リンクとOAuth利用に合わせて最小権限化する。 (`index.html`, ホスティング設定未整備) [done: 2026-04-11]
- [x] 法務リンクの `target="_app"` が意図しない同一タブ遷移を起こしうるため、`_blank` に統一して `noopener noreferrer` を有効にする。 (`src/components/modals/MenuModal.jsx`) [done: 2026-04-11]

## 既知の不具合
- [ ] 過去に利用していたブラウザにおいて、localStorage に「グループ1」という古いダミーデータが残り続ける現象（手動削除またはリセットが必要） [cite: 2025-07-22]

## 開発ログ
- **2026-04-09**:
    - クラウド版の全機能実装を完了。
    - UIの最終調整および多言語対応ガイドの反映を完了。 [cite: 2025-07-22]
- **2026-04-10**:
    - DBカラム名の不整合（キャメル/スネーク混在）による保存エラーを修正。
    - プロジェクト管理用 `ai-context/` フォルダを導入し、AIとの協調体制を整備。 [cite: 2025-07-22]
