import './MenuModal.css';

function MenuModal({ links, onImport, categories, setCategories }) {
  // エクスポート：JSONファイルとしてダウンロード
  const handleExport = () => {
    // ★リンクとカテゴリを1つの「セット」にして書き出す
    const exportData = {
      links: links,
      categories: categories
    };
    
    // JSON形式に変換してダウンロード
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal_links_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // インポート：ファイルを選択して読み込み
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // ★過去のバックアップ（配列）か、新しいバックアップ（オブジェクト）かを判定
        if (Array.isArray(parsedData)) {
          // 古い形式：リンクデータのみ復元
          onImport(parsedData, null);
        } else if (parsedData.links && parsedData.categories) {
          // 新しい形式：リンクとカテゴリの両方を復元
          onImport(parsedData.links, parsedData.categories);
        } else {
          alert('対応していないファイル形式です');
        }
        
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // ファイル選択をリセット
  };

  return (    
    <div className="menu-container">
      <section className="menu-section">
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
          カテゴリ設定（全10枠）
        </h3>
        <div className="category-edit-list">
          {categories.map((cat, index) => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ width: '30px', fontWeight: 'bold', color: '#555' }}>
                {index + 1}.
              </span>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setCategories(prev => prev.map(c => 
                    c.id === cat.id ? { ...c, name: newName } : c
                  ));
                }}
                placeholder="カテゴリ名（空欄も可）"
                style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
          ※カテゴリ名を変更すると、即座に保存・反映されます。
        </p>
      </section>
      <section className="menu-section">
        <h3>データのバックアップ</h3>
        <p>現在のリンク集をJSONファイルとして保存します。</p>
        <button className="menu-action-btn export" onClick={handleExport}>
          JSONエクスポート
        </button>
      </section>

      <section className="menu-section">
        <h3>データの復元・移行</h3>
        <p>保存済みのJSONファイルを読み込みます。</p>
        <label className="menu-action-btn import">
          JSONインポート
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </section>

      <section className="menu-section">
        <h3>アプリ情報</h3>
        <p>Portal_LinkMaster v1.0</p>
        <p>登録件数: {links.length} 件</p>
      </section>
    </div>
  );
}

export default MenuModal;