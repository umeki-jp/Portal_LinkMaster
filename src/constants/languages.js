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
    copyUrlBtn: "URLコピー",

    // グループ・カテゴリ関連
    localGroup: "ブラウザ版",
    group: "グループ",
    category: "カテゴリ",
    uncategorized: "未分類",
    groupEdit: "グループ編集",
    groupCopy: "グループコピー",
    favorites: "★ よく使う（お気に入り）",
    groupManagement: "グループ管理",
    addGroupBtn: "＋ 新規追加",
    copyGroupBtn: "複製",
    deleteGroupBtn: "削除",
    newGroupNameHint: "新しいグループ名を入力...",
    loginRequiredHint: "※この機能はログイン後に利用可能になります。",
    moveUp: "上へ",
    moveDown: "下へ",

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
    site: "🌸オフィシャルサイト",
    support: "☕サポート",
    
    usageInstructions: "使用方法",
    notes: "注意事項",
    
    dataBackup: "データのバックアップ",
    dataBackupDesc: "現在のリンク集とカテゴリ設定をJSONファイルとして保存します。（※未ログイン時のブラウザデータ用）",
    jsonExport: "JSONエクスポート",
    dataRestore: "データの復元・移行",
    dataRestoreDesc: "保存済みのJSONファイルを読み込みます。",
    jsonImport: "JSONインポート",
    
    categorySettingsTitle: "カテゴリ設定",
    categoryNamePlaceholder: "カテゴリ名（空欄も可）",
    categoryEditHint: "※「更新する」ボタンを押すまで保存されません。",
    updateBtn: "更新する",
    updateSuccess: "✅ カテゴリを更新しました",

    email: "メールアドレス",
    password: "パスワード",
    loginBtn: "ログイン",
    logoutBtn: "ログアウト",
    loginError: "ログインに失敗しました。情報が正しいか確認してください。",
    hubLoginHint: "※Umeki_Hubのアカウントでログインできます。",
    or: "または",
    loginWithGoogle: "Googleでログイン",
    showPassword: "パスワードを表示",
    hidePassword: "パスワードを非表示",
    

    // メッセージ・警告
    localSaveNote: "※未ログインのため、データはブラウザのみに保存されます。",
    cloudSyncWarning: "ログイン中はクラウドのデータでローカルデータが上書きされます。",
    copyConfirmWarning: "リンク数の少ないグループへのコピーです。本当によろしいですか？",
    deleteConfirm: "本当に削除しますか？",

    // リンクフォーム用
    titleUrlRequired: "リンク名称とURLは必須項目です。",
    titleMaxLength: "リンク名称は50文字以内で入力してください。",
    tagsMaxLength: "タグは合計で30文字以内にしてください。",
    urlFormatError: "URLは http:// または https:// から入力してください。",
    linkTitle: "リンク名称",
    urlKey: "URL",
    recBrowser: "推奨ブラウザ",
    selectRecBrowser: "-- 選択してください --",
    shortMemoLabel: "簡易メモ（一覧に表示）",
    detailMemoLabel: "詳細メモ（ポップアップに表示）",
    tagsLabel: "タグ（カンマ区切りで最大3つ推奨）",
    tagsPlaceholder: "毎日, 重要, 経理",
    isFavoriteLabel: "お気に入り（最上部に表示）",
    isHighlightedLabel: "強調（行をハイライト）",
    displayOrder: "表示順",
    orderPlaceholder: "例: 10, 20, 30...",
    orderNote: "※数字が小さいほど上に表示",
    saveSubmit: "保存する"
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
    copyUrlBtn: "Copy URL",

    // Groups & Categories
    localGroup: "Browser",
    group: "Group",
    category: "Category",
    uncategorized: "Uncategorized",
    groupEdit: "Edit Group",
    groupCopy: "Copy Group",
    favorites: "★ Favorites",
    groupManagement: "Group Management",
    addGroupBtn: "+ Add New",
    copyGroupBtn: "Copy",
    deleteGroupBtn: "Delete",
    newGroupNameHint: "New group name...",
    loginRequiredHint: "*This feature is available after login.",
    moveUp: "Up",
    moveDown: "Down",

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
    site: "🌸Official Site",
    support: "☕Support",
    
    usageInstructions: "How to Use",
    notes: "Notes",
    
    dataBackup: "Data Backup",
    dataBackupDesc: "Save your current links and categories as a JSON file. (*For local browser data)",
    jsonExport: "Export JSON",
    dataRestore: "Data Restore & Migration",
    dataRestoreDesc: "Load a previously saved JSON file.",
    jsonImport: "Import JSON",
    
    categorySettingsTitle: "Category Settings",
    categoryNamePlaceholder: "Category name (can be empty)",
    categoryEditHint: "*Changes are not saved until you click the Update button.",
    updateBtn: "Update",
    updateSuccess: "✅ Categories updated successfully",

    email: "Email",
    password: "Password",
    loginBtn: "Login",
    logoutBtn: "Logout",
    loginError: "Login failed. Please check your credentials.",
    hubLoginHint: "*You can log in with your Umeki_Hub account.",
    or: "or",
    loginWithGoogle: "Sign in with Google",
    showPassword: "Show password",
    hidePassword: "Hide password",

    // Messages & Warnings
    localSaveNote: "*Data will be saved only to the browser (Not logged in).",
    cloudSyncWarning: "Local data will be overwritten by cloud data while logged in.",
    copyConfirmWarning: "Copying to a group with fewer links. Are you sure?",
    deleteConfirm: "Are you sure you want to delete?",

    // Link Form
    titleUrlRequired: "Link title and URL are required.",
    titleMaxLength: "Link title must be under 50 characters.",
    tagsMaxLength: "Tags must be under 30 characters in total.",
    urlFormatError: "URL must start with http:// or https://",
    linkTitle: "Link Title",
    urlKey: "URL",
    recBrowser: "Recommended Browser",
    selectRecBrowser: "-- Select Browser --",
    shortMemoLabel: "Short Memo (List view)",
    detailMemoLabel: "Detail Memo (Popup)",
    tagsLabel: "Tags (Comma separated, max 3 recommended)",
    tagsPlaceholder: "Daily, Important, Accounting",
    isFavoriteLabel: "Favorite (Pin to top)",
    isHighlightedLabel: "Highlight (Highlight row)",
    displayOrder: "Display Order",
    orderPlaceholder: "e.g., 10, 20, 30...",
    orderNote: "*Smaller numbers display higher",
    saveSubmit: "Save"
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