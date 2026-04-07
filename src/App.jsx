import { useState, useEffect } from 'react';
import './App.css';
import { CATEGORIES, INITIAL_LINKS } from './data/mockData';
import Modal from './components/common/Modal';
import LinkCard from './components/LinkCard';
import LinkFormModal from './components/modals/LinkFormModal';
import MenuModal from './components/modals/MenuModal';
import { useSettings } from './contexts/SettingsContext';
import { COMMON_TAGS } from './constants/languages';
import { useAuth } from './contexts/AuthContext';

function App() {
  // ★設定コンテキストから「言語設定」と「翻訳関数」を呼び出す
  const { language, setLanguage, isDarkMode, setIsDarkMode, t } = useSettings();
  const { user } = useAuth();
  
  // 1. データの読み込み（初期化）
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('portal_links');
    return saved ? JSON.parse(saved) : INITIAL_LINKS; // 初回はサンプルを表示
  });
  
  // 2. データの自動保存（linksが更新されるたびに実行）
  useEffect(() => {
    localStorage.setItem('portal_links', JSON.stringify(links));
  }, [links]);

  // 1. カテゴリデータの読み込み（初期化）
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('portal_categories');
    return saved ? JSON.parse(saved) : CATEGORIES; // 初回はmockDataの10枠を表示
  });

  // 2. カテゴリデータの自動保存
  useEffect(() => {
    localStorage.setItem('portal_categories', JSON.stringify(categories));
  }, [categories]);

  // モーダル管理用のステート
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState('local'); // 現在表示中のグループ
  const [isSearchOpen, setIsSearchOpen] = useState(false); // 検索パネルの開閉
  const [selectedSearchTags, setSelectedSearchTags] = useState([]); // 選択中の検索タグ

  const toggleSearchTag = (tag) => {
    setSelectedSearchTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  

  // --- 処理ロジック ---

  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.map(c => c.id) // 最初は全部開いた状態にする
  );

  //  カテゴリの開閉を切り替える関数
  const toggleCategory = (categoryId) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) // あれば消す（閉じる）
        : [...prev, categoryId]               // なければ足す（開く）
    );
  };

  // インポート処理（MenuModal用）
  const handleImportData = (importedLinks, importedCategories) => {
    // リンクデータの復元
    setLinks(importedLinks);
    
    // ★カテゴリデータも入っていれば復元する
    if (importedCategories) {
      setCategories(importedCategories);
    }
    
    setIsMenuOpen(false); // メニューを閉じる
  };

  // 新規・編集の保存ボタンが押された時
  const handleSaveLink = (data) => {
    // 重複チェック（編集時は自分自身を除外して判定）
    const isDuplicate = links.some(link => 
      link.url === data.url && link.id !== (selectedLink?.id || null)
    );

    if (isDuplicate) {
      if (!window.confirm('このURLは既に登録されています。重複して登録しますか？')) {
        return; // キャンセルした場合は保存を中断
      }
    }

    if (selectedLink && selectedLink.id) {
      // 編集処理
      setLinks(prev => prev.map(l => l.id === selectedLink.id ? { ...data, id: selectedLink.id } : l));
    } else {
      // 新規登録
      const newLink = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
      setLinks(prev => [...prev, newLink]);
    }
    setIsFormOpen(false);
    setSelectedLink(null);
  };

  // 削除ボタンが押された時
  const handleDeleteLink = (id) => {
    if (window.confirm('このリンクを削除してもよろしいですか？')) {
      setLinks(prev => prev.filter(l => l.id !== id));
    }
  };

  // 編集ボタンが押された時
  const handleEditClick = (link) => {
    setSelectedLink(link);
    setIsFormOpen(true);
  };

  const handleDetailClick = (link) => {
    setSelectedLink(link);
    setIsDetailOpen(true);
  };

  // タグ検索にも対応したフィルタリング
  const filteredLinks = links.filter(link => {
    const query = searchQuery.toLowerCase();
    
    // フリーワードのチェック
    const matchText = 
      link.title.toLowerCase().includes(query) ||
      (link.shortMemo || "").toLowerCase().includes(query) ||
      (link.tags && link.tags.some(tag => tag.toLowerCase().includes(query)));
      
    // タグ選択のチェック（選択されているタグを「すべて」含んでいるか。※AND検索）
    const matchTags = selectedSearchTags.length === 0 || 
      selectedSearchTags.every(selectedTag => link.tags && link.tags.includes(selectedTag));

    // ワードとタグ両方の条件を満たせば表示
    return matchText && matchTags;
  });

  const favoriteLinks = filteredLinks.filter(link => link.isFavorite);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Link Master</h1>       
        <div className="header-actions">
          {/* 文字を辞書対応 */}
          <button className="menu-btn" onClick={() => setIsMenuOpen(true)} style={{ position: 'relative' }}>
            {t('settings')}
            {user && <span className="online-badge" title="ログイン中"></span>}
          </button>
          <button className="add-btn" onClick={() => { setSelectedLink(null); setIsFormOpen(true); }}>
            ＋ {t('addLink')}
          </button>
          {/* ダークモード切替ボタン */}
          <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {/* 言語切替ボタン */}
          <button className="icon-btn" onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}>
            {language === 'ja' ? 'JA/EN' : 'EN/JA'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* =========================================
            コントロールバー（グループタブ ＆ 検索ボタン）
            ========================================= */}
        <div className="control-bar">
          <div className="group-tabs">
            <button 
              className={`tab-btn ${activeGroup === 'local' ? 'active' : ''}`}
              onClick={() => setActiveGroup('local')}
            >
              {t('localGroup')}
            </button>
            {/* ※ログイン機能実装後に、ここにグループ1〜5のタブが動的に並びます */}
          </div>
          
          <button 
            className={`search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title={t('search')}
          >
            🔍
          </button>
        </div>

        {/* =========================================
            検索パネル（ボタンを押すと展開されるエリア）
            ========================================= */}
        {isSearchOpen && (
          <div className="search-panel">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input full-width"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>×</button>
              )}
            </div>
            
            <div className="tag-filter-area">
              <span className="tag-filter-label">タグ検索:</span>
              <div className="tag-list">
                {COMMON_TAGS.map(tag => (
                  <button 
                    key={tag}
                    className={`filter-tag-btn ${selectedSearchTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleSearchTag(tag)}
                  >
                    # {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {favoriteLinks.length > 0 && (
          <section className="category-section favorite-section">
            <h2 className="category-title">{t('favorites')}</h2>
            <div className="link-grid">
              {favoriteLinks.map(link => (
                <LinkCard 
                  key={link.id} 
                  link={link} 
                  onDetailClick={handleDetailClick}
                  onEditClick={() => handleEditClick(link)} 
                  onDeleteClick={() => handleDeleteLink(link.id)} 
                />
              ))}
            </div>
          </section>
        )}

        {categories.sort((a, b) => a.order - b.order).map(category => {
          const categoryLinks = filteredLinks
            .filter(link => link.categoryId === category.id)
            .sort((a, b) => Number(a.order) - Number(b.order));

          if (categoryLinks.length === 0) return null;

          const isOpen = openCategories.includes(category.id);

          return (
            <section key={category.id} className="category-section">
              {/* ★タイトルをクリック可能にし、アイコンと件数を表示 */}
              <h2 
                className={`category-title accordion-header ${isOpen ? 'is-open' : ''}`} 
                onClick={() => toggleCategory(category.id)}
              >
                <span className="arrow">{isOpen ? '▼' : '▶'}</span>
                {category.name}
                <span className="count">({categoryLinks.length})</span>
              </h2>
              
              {/* ★isOpen が true の時だけリストを表示 */}
              {isOpen && (
                <div className="link-grid">
                  {categoryLinks.map(link => (
                    <LinkCard 
                      key={link.id} 
                      link={link} 
                      onDetailClick={handleDetailClick}
                      onEditClick={() => handleEditClick(link)}
                      onDeleteClick={() => handleDeleteLink(link.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <a href="https://umeki-hub.vercel.app/" target="_blank" rel="noopener noreferrer" className="footer-link">総合サイト</a>
          <span className="copyright">
            &copy; {new Date().getFullYear()} Umeki / LinkMaster. All rights reserved.
          </span>
        </div>
      </footer>

      {/* 詳細メモ用モーダル */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="詳細メモ">
        {selectedLink && (
          <div className="detail-memo-content">
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedLink.detailMemo}</p>
          </div>
        )}
      </Modal>

      {/* 登録・編集用モーダル */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedLink ? "リンクを編集" : "新規リンク登録"}
        contentClassName="menu-modal-content"
      >
        <LinkFormModal 
          isOpen={isFormOpen} 
          onSubmit={handleSaveLink} 
          initialData={selectedLink}
          categories={categories} 
        />
      </Modal>

      {/* メニュー用モーダルを追加 */}
      <Modal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="システムメニュー"
        contentClassName="menu-modal-content"
      >
        <MenuModal 
          links={links} 
          onImport={handleImportData} 
          categories={categories}       // カテゴリデータを渡す
          setCategories={setCategories} // 更新用の関数を渡す
        />
      </Modal>
    </div>
  );
}

export default App;