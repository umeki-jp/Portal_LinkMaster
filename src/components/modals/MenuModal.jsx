import './MenuModal.css';

function MenuModal({ links, onImport }) {
  // エクスポート：JSONファイルとしてダウンロード
  const handleExport = () => {
    const dataStr = JSON.stringify(links, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `portal_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // インポート：ファイルを選択して読み込み
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          if (window.confirm('現在のデータが上書きされます。よろしいですか？')) {
            onImport(importedData);
            alert('データのインポートが完了しました！');
          }
        } else {
          alert('有効なJSON形式ではありません。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="menu-container">
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