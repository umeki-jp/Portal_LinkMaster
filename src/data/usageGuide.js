// data/usageGuide.js

export const getUsageData = (lang = 'ja') => {
  const isJa = lang === 'ja';

  const steps = [
    { 
      prefix: '①', 
      text: isJa ? 'トップ画面の「+新規リンク」からリンクを追加します。' : 'Add links via "+ Add Link" on the top screen.' 
    },
    { 
      prefix: '②', 
      text: isJa ? 'カテゴリや表示順を調整して、見やすい順番に整理します。' : 'Organize your links by adjusting categories and order.' 
    },
    { 
      prefix: '③', 
      text: isJa ? '必要に応じて「お気に入り」や「強調」を設定します。' : 'Set "Favorites" or "Highlights" as needed.' 
    },
    { 
      prefix: '④', 
      text: isJa ? '【ブラウザ版】データ保全のため、定期的にJSONエクスポートを実行してください。' : '[Local] Export JSON regularly to ensure data safety.' 
    },
    { 
      prefix: '⑤', 
      text: isJa ? '【クラウド版】ログイン時はデータが自動保存され、他端末と同期可能です。' : '[Cloud] Data is auto-saved and synced across devices when logged in.' 
    },
    { 
      prefix: '⑥', 
      text: isJa ? '【クラウド版】設定から特定のグループを「メイン」に固定し、初期表示にできます。' : '[Cloud] Set a specific group as "Main" for the default view.' 
    },
  ];

  const notes = [
    { 
      prefix: '⚠', 
      text: isJa ? 'メモ欄にはパスワード等の機密情報は入力しないでください。' : 'Do not enter sensitive info like passwords in memos.' 
    },
    { 
      prefix: '⚠', 
      text: isJa ? 'ブラウザ版（未ログイン）は、キャッシュ削除によりデータが消える場合があります。' : 'Local data (unlogged) may be lost if browser cache is cleared.' 
    },
    { 
      prefix: '⚠', 
      text: isJa ? 'クラウド利用中も、重要な変更後はJSONエクスポートでのバックアップを推奨します。' : 'Even with cloud sync, regular JSON exports are recommended for backups.' 
    },
  ];

  return { steps, notes };
};