// src/constants/languages.js

export const LANGUAGES = {
  ja: {
    // UI・基本操作
    search: "検索",
    addLink: "リンク追加",
    settings: "設定",
    login: "ログイン",
    logout: "ログアウト",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    delete: "削除",
    close: "閉じる",
    urlCopied: "URLをコピーしました！",

    // グループ・カテゴリ関連
    localGroup: "ブラウザ版",
    group: "グループ",
    category: "カテゴリ",
    uncategorized: "未分類",
    groupEdit: "グループ編集",
    groupCopy: "グループコピー",
    favorites: "★ よく使う（お気に入り）",
    localGroup: "ブラウザ版",

    // 検索・タグ関連
    searchPlaceholder: "フリーワードまたはタグで検索...",
    tagsMaster: "タグ一覧",
    selectTags: "タグを選択",

    // メニューモーダル用
    tabSystem: "⚙️ システム",
    tabData: "💾 データ管理",
    tabGroup: "📁 カテゴリ設定",
    
    accountInfo: "アカウント情報",
    guestUser: "👤 ゲスト（未ログイン）",
    loginFutureUpdate: "※ログイン機能は今後のアップデートで追加されます。",
    
    uiSettings: "UI設定",
    displayMode: "画面モード",
    lightMode: "☀️ ライトモード",
    darkMode: "🌙 ダークモード",
    languageSetting: "言語 (Language)",
    japanese: "日本語",
    english: "English",
    
    legalInfo: "法的情報・ポリシー",
    termsOfService: "利用規約",
    privacyPolicy: "プライバシーポリシー",
    legalNotice: "特定商取引法に基づく表記",
    
    usageInstructions: "使用方法",
    notes: "注意事項",
    
    dataBackup: "データのバックアップ",
    dataBackupDesc: "現在のリンク集とカテゴリ設定をJSONファイルとして保存します。（※未ログイン時のブラウザデータ用）",
    jsonExport: "JSONエクスポート",
    dataRestore: "データの復元・移行",
    dataRestoreDesc: "保存済みのJSONファイルを読み込みます。",
    jsonImport: "JSONインポート",
    
    categorySettingsTitle: "カテゴリ設定（全10枠）",
    categoryNamePlaceholder: "カテゴリ名（空欄も可）",
    categoryEditHint: "※「更新する」ボタンを押すまで保存されません。",
    updateBtn: "更新する",
    updateSuccess: "✅ カテゴリを更新しました",
    

    // メッセージ・警告
    localSaveNote: "※未ログインのため、データはブラウザのみに保存されます。",
    cloudSyncWarning: "ログイン中はクラウドのデータでローカルデータが上書きされます。",
    copyConfirmWarning: "リンク数の少ないグループへのコピーです。本当によろしいですか？",
    deleteConfirm: "本当に削除しますか？"
  },
  en: {
    // UI & Basic Operations
    search: "Search",
    addLink: "Add Link",
    settings: "Settings",
    login: "Login",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    urlCopied: "URL copied!",

    // Groups & Categories
    localGroup: "Browser",
    group: "Group",
    category: "Category",
    uncategorized: "Uncategorized",
    groupEdit: "Edit Group",
    groupCopy: "Copy Group",
    favorites: "★ Favorites",
    localGroup: "Browser",

    // Search & Tags
    searchPlaceholder: "Search by keyword or tags...",
    tagsMaster: "Tags Master",
    selectTags: "Select Tags",

    // menu modal
    tabSystem: "⚙️ System",
    tabData: "💾 Data Mgmt",
    tabGroup: "📁 Categories",
    
    accountInfo: "Account Info",
    guestUser: "👤 Guest (Not logged in)",
    loginFutureUpdate: "*Login feature will be added in a future update.",
    
    uiSettings: "UI Settings",
    displayMode: "Display Mode",
    lightMode: "☀️ Light Mode",
    darkMode: "🌙 Dark Mode",
    languageSetting: "Language",
    japanese: "日本語",
    english: "English",
    
    legalInfo: "Legal & Policies",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    legalNotice: "Specified Commercial Transactions",
    
    usageInstructions: "How to Use",
    notes: "Notes",
    
    dataBackup: "Data Backup",
    dataBackupDesc: "Save your current links and categories as a JSON file. (*For local browser data)",
    jsonExport: "Export JSON",
    dataRestore: "Data Restore & Migration",
    dataRestoreDesc: "Load a previously saved JSON file.",
    jsonImport: "Import JSON",
    
    categorySettingsTitle: "Category Settings (10 slots)",
    categoryNamePlaceholder: "Category name (can be empty)",
    categoryEditHint: "*Changes are not saved until you click the Update button.",
    updateBtn: "Update",
    updateSuccess: "✅ Categories updated successfully",

    // Messages & Warnings
    localSaveNote: "*Data will be saved only to the browser (Not logged in).",
    cloudSyncWarning: "Local data will be overwritten by cloud data while logged in.",
    copyConfirmWarning: "Copying to a group with fewer links. Are you sure?",
    deleteConfirm: "Are you sure you want to delete?"
  }
};

// 全グループ共通のプリセットタグ一覧
export const COMMON_TAGS = [
  "重要",
  "毎日",
  "月曜",
  "火曜",
  "水曜",
  "木曜",
  "金曜",
  "土曜",
  "日曜",
  "経理",
  "総務",
  "労務",
  "営業",
  "開発"
];