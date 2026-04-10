# AI Development Guide (README_AI.md)

このプロジェクトを扱うすべてのAIは、`ai-context/` 内の定義ファイルを最優先で参照せよ。

## 1. コンテキスト構成
以下のファイルに全ての正解が集約されている。推論を始める前に必ず読み込め。
- `01_identity.md`: 思想・目的
- `02_tech_stack.md`: 技術スタック
- `03_db_schema.md`: データベース定義（★唯一の正解）
- `04_dev_rules.md`: 実装・禁止ルール
- `05_project_log.md`: 進捗・備忘録
- `06_prompt_dictionary.md`: タスク別指示テンプレート

## 2. 運用上の注意
- カラム名等の具体的仕様については `03_db_schema.md` 以外を参照しないこと。
- 人間からの個別指示は `06_prompt_dictionary.md` の形式に従う場合がある。
- 出力コード内に `\ua0` 等の不正文字を絶対に含めないこと。