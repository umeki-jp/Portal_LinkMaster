import React, { useState, useEffect } from 'react';
import './MenuModal.css';
import { USAGE_STEPS, USAGE_NOTES } from '../../data/usageGuide';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ★ Googleログイン画像のインポート (ファイル名修正済み)
import googleSignInImg from '../../assets/images/web_light_sq_SI@3x.png';

function MenuModal({ links, onImport, categories, setCategories }) {
  const { t, isDarkMode, setIsDarkMode, language, setLanguage } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('system');

  // --- ログイン関連のステート ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // ★ 追加：パスワード表示/非表示の切り替え
  const [showPassword, setShowPassword] = useState(false);

  // --- カテゴリ編集関連のステート ---
  const [localCategories, setLocalCategories] = useState(categories);
  const [saveMessage, setSaveMessage] = useState('');

  // 親データが変わったら一時保存用にも反映
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // ★ 追加：Googleログイン処理
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Umeki_Hubの設定に合わせます。通常は空でOK
        redirectTo: window.location.origin 
      }
    });
    if (error) alert(error.message);
  };

  // メール/パスワードログイン処理
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoginError(t('loginError'));
    } else {
      setEmail('');
      setPassword('');
      setShowPassword(false); // パスワード表示を元に戻す
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // カテゴリ保存処理（5秒メッセージ付き）
  const handleSaveCategories = () => {
    setCategories(localCategories);
    setSaveMessage(t('updateSuccess'));
    setTimeout(() => {
      setSaveMessage('');
    }, 5000);
  };

  // エクスポート/インポート処理
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
              
              {user ? (
                // --- ログイン中 ---
                <div>
                  <p className="account-status">
                    👤 {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                  </p>
                  <div style={{ marginTop: '15px' }}>
                    <button className="menu-action-btn" onClick={handleLogout}>
                      {t('logoutBtn')}
                    </button>
                  </div>
                </div>
              ) : (
                // --- 未ログイン ---
                <div className="login-container">
                  {/* ★ Googleログインボタン */}
                  <button className="google-login-btn" onClick={handleGoogleLogin}>
                    <img src={googleSignInImg} alt={t('loginWithGoogle')} />
                  </button>

                  <div className="login-separator">
                    <span>{t('or')}</span>
                  </div>

                  {/* メール/パスワードログイン */}
                  <form onSubmit={handleLogin} className="email-login-form">
                    <input 
                      type="email" 
                      placeholder={t('email')} 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="login-input"
                    />
                    
                    {/* ★ パスワード入力（目のアイコン付き） */}
                    <div className="password-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} /* ★ 表示/非表示を切り替え */
                        placeholder={t('password')} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="login-input password-input"
                      />
                      <button 
                        type="button" /* submitを防ぐ */
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {loginError && <p className="login-error-msg">{loginError}</p>}
                    
                    <button type="submit" className="menu-action-btn login-submit-btn">
                      {t('loginBtn')}
                    </button>
                  </form>
                  <p className="hint-text">{t('hubLoginHint')}</p>
                </div>
              )}
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
                <a href="https://umeki-hub.vercel.app/" target="_app" rel="noopener noreferrer">{t('legalNotice')}</a>
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
                {localCategories.map((cat, index) => (
                  <div key={cat.id} className="category-edit-row">
                    <span className="category-edit-num">{index + 1}.</span>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setLocalCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c));
                      }}
                      placeholder={t('categoryNamePlaceholder')}
                      className="category-edit-input"
                    />
                  </div>
                ))}
              </div>

              <div className="category-save-area">
                <button className="menu-action-btn export" onClick={handleSaveCategories} style={{ backgroundColor: '#1a73e8' }}>
                  {t('updateBtn')}
                </button>
                {saveMessage && (
                  <span className="animate-fade-in update-success-msg">
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