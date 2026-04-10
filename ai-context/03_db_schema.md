| table_name    | column_name           | data_type                | is_nullable | column_default               |
| ------------- | --------------------- | ------------------------ | ----------- | ---------------------------- |
| lm_categories | id                    | uuid                     | NO          | gen_random_uuid()            |
| lm_categories | user_id               | uuid                     | NO          | auth.uid()                   |
| lm_categories | group_id              | uuid                     | NO          | null                         |
| lm_categories | name                  | text                     | YES         | null                         |
| lm_categories | order_index           | integer                  | NO          | 0                            |
| lm_categories | created_at            | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| lm_groups     | id                    | uuid                     | NO          | gen_random_uuid()            |
| lm_groups     | user_id               | uuid                     | NO          | auth.uid()                   |
| lm_groups     | name                  | text                     | NO          | null                         |
| lm_groups     | order_index           | integer                  | NO          | 0                            |
| lm_groups     | created_at            | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| lm_groups     | is_main               | boolean                  | YES         | false                        |
| lm_links      | id                    | uuid                     | NO          | gen_random_uuid()            |
| lm_links      | user_id               | uuid                     | NO          | auth.uid()                   |
| lm_links      | group_id              | uuid                     | NO          | null                         |
| lm_links      | category_id           | uuid                     | NO          | null                         |
| lm_links      | title                 | text                     | NO          | null                         |
| lm_links      | url                   | text                     | NO          | null                         |
| lm_links      | shortMemo             | text                     | YES         | null                         |
| lm_links      | detailMemo            | text                     | YES         | null                         |
| lm_links      | tags                  | ARRAY                    | YES         | '{}'::text[]                 |
| lm_links      | isFavorite            | boolean                  | YES         | false                        |
| lm_links      | order                 | integer                  | NO          | 0                            |
| lm_links      | created_at            | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| lm_links      | browser               | text                     | YES         | null                         |
| lm_links      | isHighlighted         | boolean                  | YES         | false                        |
| profiles      | id                    | uuid                     | NO          | null                         |
| profiles      | display_name          | text                     | YES         | null                         |
| profiles      | notify_news           | boolean                  | YES         | false                        |
| profiles      | notify_magazine       | boolean                  | YES         | false                        |
| profiles      | updated_at            | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| profiles      | is_deleted            | boolean                  | YES         | false                        |
| profiles      | deletion_requested_at | timestamp with time zone | YES         | null                         |