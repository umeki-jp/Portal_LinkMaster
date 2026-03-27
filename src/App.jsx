import { useState, useEffect } from 'react';
import './App.css';
import { CATEGORIES, INITIAL_LINKS } from './data/mockData';
import Modal from './components/common/Modal';
import LinkCard from './components/LinkCard';
import LinkFormModal from './components/modals/LinkFormModal';
import MenuModal from './components/modals/MenuModal';

function App() {
  // 1. データの読み込み（初期化）
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('portal_links');
    return saved ? JSON.parse(saved) : INITIAL_LINKS; // 初回はサンプルを表示
  });
  
  // 2. データの自動保存（linksが更新されるたびに実行）
  useEffect(() => {
    localStorage.setItem('portal_links', JSON.stringify(links));
  }, [links]);

  // モーダル管理用のステート
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  

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
  const handleImportData = (importedLinks) => {
    // 必要に応じて重複チェックやマージ処理を追加可能
    setLinks(importedLinks);
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

  const filteredLinks = links.filter(link => {
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      (link.shortMemo || "").toLowerCase().includes(query) ||
      (link.tags && link.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });

  const favoriteLinks = filteredLinks.filter(link => link.isFavorite);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌏Link-Master</h1>
        {/* 検索窓を追加 */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="名称、メモ、タグで検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>
        <div className="header-actions">
          <button className="menu-btn" onClick={() => setIsMenuOpen(true)}>メニュー</button>
          <button className="add-btn" onClick={() => { setSelectedLink(null); setIsFormOpen(true); }}>
            ＋ 新規リンク
          </button>
        </div>
      </header>

      <main className="app-main">
        {favoriteLinks.length > 0 && (
          <section className="category-section favorite-section">
            <h2 className="category-title">★ よく使う（お気に入り）</h2>
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

        {CATEGORIES.sort((a, b) => a.order - b.order).map(category => {
          const categoryLinks = filteredLinks
            .filter(link => link.categoryId === category.id)
            .sort((a, b) => a.order - b.order);

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
      >
        <LinkFormModal 
          isOpen={isFormOpen} 
          onSubmit={handleSaveLink} 
          initialData={selectedLink} 
        />
      </Modal>

      {/* メニュー用モーダルを追加 */}
      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="システムメニュー">
        <MenuModal links={links} onImport={handleImportData} />
      </Modal>
    </div>
  );
}

export default App;