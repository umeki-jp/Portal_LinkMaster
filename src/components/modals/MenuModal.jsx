import React, { useState, useEffect } from 'react'; // ★ useEffect を追加
import './MenuModal.css';
import { USAGE_STEPS, USAGE_NOTES } from '../../data/usageGuide';
import { useSettings } from '../../contexts/SettingsContext';

function MenuModal({ links, onImport, categories, setCategories }) {
  const { t, isDarkMode, setIsDarkMode, language, setLanguage } = useSettings();
  const [activeTab, setActiveTab] = useState('system');

  // ★ 追加：カテゴリ編集用の一時保存ステートと、メッセージ用ステート
  const [localCategories, setLocalCategories] = useState(categories);
  const [saveMessage, setSaveMessage] = useState('');

  // ★ 追加：メニューが開かれた時などに、親の最新データを一時保存ステートにコピーする
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // ★ 追加：更新ボタンを押した時の処理
  const handleSaveCategories = () => {
    setCategories(localCategories); // 親データ（アプリ全体）に反映
    setSaveMessage(t('updateSuccess')); // 「更新しました」メッセージを表示
    
    // 5秒後にメッセージを消す
    setTimeout(() => {
      setSaveMessage('');
    }, 5000);
  };

  // エクスポート処理
  const handleExport = () => {
    const exportData = { links: links, categories: categories };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal_links_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // インポート処理
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (Array.isArray(parsedData)) {
          onImport(parsedData, null);
        } else if (parsedData.links && parsedData.categories) {
          onImport(parsedData.links, parsedData.categories);
        } else {
          alert('対応していないファイル形式です');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (    
    <div className="menu-modal-layout">
      
      {/* --- 左側：サイドバー --- */}
      <div className="menu-sidebar">
        <button className={`menu-tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          {t('tabSystem')}
        </button>
        <button className={`menu-tab-btn ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
          {t('tabData')}
        </button>
        <button className={`menu-tab-btn ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
          {t('tabGroup')}
        </button>
      </div>

      {/* --- 右側：コンテンツエリア --- */}
      <div className="menu-content-area">

        {/* 【タブ1】システム / アカウント */}
        {activeTab === 'system' && (
          <div className="menu-tab-pane animate-fade-in">
            <section className="menu-section">
              <h3>{t('accountInfo')}</h3>
              <p className="account-status">{t('guestUser')}</p>
              <p className="hint-text">{t('loginFutureUpdate')}</p>
            </section>

            <section className="menu-section">
              <h3>{t('uiSettings')}</h3>
              <div className="setting-row">
                <span>{t('displayMode')}</span>
                <button className="toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? t('darkMode') : t('lightMode')}
                </button>
              </div>
              <div className="setting-row">
                <span>{t('languageSetting')}</span>
                <button className="toggle-btn" onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}>
                  {language === 'ja' ? t('japanese') : t('english')}
                </button>
              </div>
            </section>

            <section className="menu-section">
              <h3>{t('legalInfo')}</h3>
              <div className="policy-links">
                <a href="https://umeki-hub.vercel.app/" target="_blank" rel="noopener noreferrer">{t('termsOfService')}</a>
                <a href="https://umeki-hub.vercel.app/" target="_blank" rel="noopener noreferrer">{t('privacyPolicy')}</a>
                <a href="https://umeki-hub.vercel.app/" target="_blank" rel="noopener noreferrer">{t('legalNotice')}</a>
              </div>
            </section>

            <section className="menu-section">
              <h3>{t('usageInstructions')}</h3>
              <ul className="usage-list">
                {USAGE_STEPS.map((step) => (
                  <li key={step.text}><span className="usage-prefix">{step.prefix}</span>{step.text}</li>
                ))}
              </ul>
              <h3 style={{marginTop: '15px'}}>{t('notes')}</h3>
              <ul className="usage-list usage-notes">
                {USAGE_NOTES.map((note) => (
                  <li key={note.text}><span className="usage-prefix">{note.prefix}</span>{note.text}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* 【タブ2】データ管理 */}
        {activeTab === 'data' && (
          <div className="menu-tab-pane animate-fade-in">
            <section className="menu-section">
              <h3>{t('dataBackup')}</h3>
              <p>{t('dataBackupDesc')}</p>
              <button className="menu-action-btn export" onClick={handleExport}>{t('jsonExport')}</button>
            </section>

            <section className="menu-section">
              <h3>{t('dataRestore')}</h3>
              <p>{t('dataRestoreDesc')}</p>
              <label className="menu-action-btn import">
                {t('jsonImport')}
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </section>
          </div>
        )}

        {/* 【タブ3】カテゴリ設定 */}
        {activeTab === 'group' && (
          <div className="menu-tab-pane animate-fade-in">
            <section className="menu-section">
              <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
                {t('categorySettingsTitle')}
              </h3>
              
              <div className="category-edit-list">
                {/* ★ map の対象を categories から localCategories に変更 */}
                {localCategories.map((cat, index) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ width: '30px', fontWeight: 'bold', color: '#555' }}>{index + 1}.</span>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        // ★ 親の setCategories ではなく、一時保存の setLocalCategories を書き換える
                        setLocalCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c));
                      }}
                      placeholder={t('categoryNamePlaceholder')}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                ))}
              </div>

              {/* ★ 新規追加：更新ボタンとサクセスメッセージ */}
              <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                  className="menu-action-btn export" 
                  onClick={handleSaveCategories}
                  style={{ backgroundColor: '#1a73e8' }} /* 青色にして目立たせる */
                >
                  {t('updateBtn')}
                </button>
                
                {saveMessage && (
                  <span className="animate-fade-in" style={{ color: '#28a745', fontWeight: 'bold' }}>
                    {saveMessage}
                  </span>
                )}
              </div>

              <p className="hint-text">{t('categoryEditHint')}</p>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}

export default MenuModal;