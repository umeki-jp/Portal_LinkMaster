import React, { useState, useEffect } from 'react';
import './MenuModal.css';
import { getUsageData } from '../../data/usageGuide';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

// ★ Googleログイン画像のインポート
import googleSignInImg from '../../assets/images/web_light_sq_SI@3x.png';

function MenuModal({
  links, onImport, categories, setCategories,
  groups, activeGroup, setActiveGroup, onAddGroup, onUpdateGroupName, onDeleteGroup, onCopyGroup, onMoveGroupUp, onMoveGroupDown, onSetMainGroup,
  onBackupLocalToCloud, onRestoreCloudToLocal
}) {
  const { t, isDarkMode, setIsDarkMode, language, setLanguage } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('system');

  const { steps, notes } = getUsageData(language);

  // --- ログイン関連のステート ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // パスワード表示/非表示の切り替え
  const [showPassword, setShowPassword] = useState(false);

  // --- カテゴリ編集関連のステート ---
  const [localCategories, setLocalCategories] = useState(() => Array.isArray(categories) ? categories.slice(0, 10) : []);
  const [saveMessage, setSaveMessage] = useState('');

  // activeGroupの変更などで親から新しい categories が渡されたら同期する
  useEffect(() => {
    setLocalCategories(Array.isArray(categories) ? categories.slice(0, 10) : []);
  }, [categories]);

  // 新規グループ名入力用
  const [newGroupName, setNewGroupName] = useState('');

  // --- データ管理用のステート ---
  const [selectedSourceGroupId, setSelectedSourceGroupId] = useState('');

  // --- グループ追加処理 ---
  const handleAddNewGroup = () => {
    if (newGroupName.trim() !== '') {
      onAddGroup(newGroupName.trim());
      setNewGroupName(''); // 入力欄をクリア
    }
  };

  // Googleログイン処理
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
        let importResult = null;
        if (Array.isArray(parsedData)) {
          importResult = onImport(parsedData, null);
        } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.links)) {
          importResult = onImport(parsedData.links, parsedData.categories ?? null);
        } else {
          throw new Error(language === 'en'
            ? 'Unsupported file format.'
            : '対応していないファイル形式です');
        }

        if (importResult?.warningMessage) {
          alert(importResult.warningMessage);
        }
      } catch (error) {
        alert(error instanceof Error
          ? error.message
          : (language === 'en'
            ? 'Failed to load the file. Please check that it is a valid JSON file.'
            : 'ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- タブ表示用ヘルパー: 先頭のアイコン(絵文字)と残りのテキストを分離 ---
  const renderTab = (text) => {
    if (!text) return null;
    const chars = [...String(text)];
    const icon = chars[0];
    const rest = chars.slice(1).join('').trim();
    return (
      <span className="tab-inner">
        <span className="tab-icon">{icon}</span>
        <span className="tab-text"> {rest}</span>
      </span>
    );
  };

  return (
    <div className="menu-modal-layout">

      {/* --- 左側：サイドバー --- */}
      <div className="menu-sidebar">
        <button className={`menu-tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          {renderTab(t('tabSystem'))}
        </button>
        <button className={`menu-tab-btn ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
          {renderTab(t('tabData'))}
        </button>

        {/* グループ管理（ログイン必須の案内が出るタブ） */}
        <button className={`menu-tab-btn ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
          {renderTab(t('groupManagement'))}
        </button>

        {/* カテゴリ設定（常に表示されるタブ） */}
        <button className={`menu-tab-btn ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab('category')}>
          {renderTab(t('categorySettingsTitle') || '📁カテゴリ設定')}
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
              <h3>{t('usageInstructions')}</h3>
              <ul className="usage-list">
                {/* getUsageData から取得した steps を使用 */}
                {steps.map((step, index) => (
                  <li key={index}>
                    <span className="usage-prefix">{step.prefix}</span>
                    {step.text}
                  </li>
                ))}
              </ul>

              <h3 style={{ marginTop: '15px' }}>{t('notes')}</h3>
              <ul className="usage-list usage-notes">
                {/* getUsageData から取得した notes を使用 */}
                {notes.map((note, index) => (
                  <li key={index}>
                    <span className="usage-prefix">{note.prefix}</span>
                    {note.text}
                  </li>
                ))}
              </ul>
            </section>

            <section className="menu-section">
              <h3>{t('legalInfo')}</h3>
              <div className="policy-links">
                <a href="https://umeki-hub.vercel.app/policy" target="_blank" rel="noopener noreferrer">{t('termsOfService')}</a>
                <a href="https://umeki-hub.vercel.app/privacy" target="_blank" rel="noopener noreferrer">{t('privacyPolicy')}</a>
                <a href="https://umeki-hub.vercel.app/profile" target="_blank" rel="noopener noreferrer">{t('legalNotice')}</a>
              </div>
            </section>

            <section className="menu-section">
              <div className="site-link">
                <a href="https://umeki-hub.vercel.app/" target="_blank" rel="noopener noreferrer">{t('site')}</a>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <a href="https://buymeacoffee.com/u1344" target="_blank" rel="noopener noreferrer">{t('support')}</a>
                  <a href="https://buymeacoffee.com/u1344" target="_blank" rel="noopener noreferrer">
                    <img src="/bmc-button.png" alt="Buy Me a Coffee" style={{ height: '32px', verticalAlign: 'middle', borderRadius: '4px' }} />
                  </a>
                </span>
              </div>
            </section>

          </div>
        )}

        {/* 【タブ2】データ管理 / Data Management */}
        {activeTab === 'data' && (
          <div className="menu-tab-pane animate-fade-in">

            {/* --- セクション1：ブラウザ版バックアップ --- */}
            <section className="menu-section">
              <h3>{language === 'en' ? 'Browser-local Backup (JSON)' : 'ブラウザ版バックアップ'}</h3>
              <p>
                {language === 'en' ? 'Save or restore Browser-local data as a JSON file.' : 'ブラウザ版（localStorage）のデータをJSONファイルとして保存・復元します。'}
              </p>
              <div className="data-action-group">
                <button className="menu-action-btn export" onClick={handleExport}>
                  {language === 'en' ? 'Export JSON' : 'JSONバックアップ'}
                </button>
                <label className="menu-action-btn import">
                  {language === 'en' ? 'Import JSON' : 'JSONから復元'}
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
              </div>
            </section>

            {/* --- セクション2：クラウド同期（ログイン時のみ表示） --- */}
            {user && (
              <>
                {/* ブラウザ版 → クラウド */}
                <section className="menu-section cloud-sync-section">
                  <h3>{language === 'en' ? 'Copy to Cloud (Local → Group)' : 'クラウドへコピー'}</h3>
                  <p>
                    {language === 'en' ? 'Copy current local data to a new cloud group.' : '現在のブラウザ版の内容を、クラウドの新しいグループとして追加します。'}
                  </p>
                  <button
                    className="menu-action-btn cloud-copy-btn"
                    onClick={onBackupLocalToCloud}
                    disabled={groups.filter(g => g.isCloud).length >= 10}
                  >
                    {language === 'en' ? 'Copy Local to Cloud' : 'ブラウザ版をクラウドへコピー'}
                  </button>
                </section>

                {/* クラウド → ブラウザ版 */}
                <section className="menu-section cloud-sync-section">
                  <h3>{language === 'en' ? 'Copy to Browser (Group → Local)' : 'ブラウザ版へコピー'}</h3>
                  <p>
                    {language === 'en' ? 'Overwrite local data with the selected cloud group content.' : '選択したクラウドグループの内容で、ブラウザ版を上書きします。'}
                  </p>
                  <div className="restore-controls">
                    <select
                      className="login-input"
                      value={selectedSourceGroupId}
                      onChange={(e) => setSelectedSourceGroupId(e.target.value)}
                    >
                      <option value="">{language === 'en' ? '-- Select Source --' : '-- コピー元を選択 --'}</option>
                      {groups.filter(g => g.isCloud).map(g => {
                        // すべてのリンクを対象に、現在のグループID(g.id)と一致するものを数える
                        const linkCount = links.filter(l => {
                          const gid = l.group_id || l.groupId;
                          return String(gid) === String(g.id);
                        }).length;

                        return (
                          <option key={g.id} value={g.id}>
                            {g.name} ({linkCount} {language === 'en' ? 'links' : '件'})
                          </option>
                        );
                      })}
                    </select>
                    <button
                      className="menu-action-btn danger-btn"
                      onClick={() => onRestoreCloudToLocal(selectedSourceGroupId)}
                      disabled={!selectedSourceGroupId}
                    >
                      {language === 'en' ? 'Overwrite Local Data' : 'ブラウザ版へ上書き実行'}
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* 【タブ3】グループ管理（ログイン時のみ利用可能） */}
        {activeTab === 'group' && (
          <div className="menu-tab-pane animate-fade-in">
            <section className="menu-section">
              <h3>{t('groupManagement')}</h3>

              {user ? (
                // --- ログインしている場合 ---
                <>
                  <div className="group-management-list">
                    {groups.map((group, index) => (
                      <div key={group.id} className="group-edit-row">
                        <div className="group-edit-main">
                          <span className="group-active-indicator">{group.id === activeGroup ? '▶' : ''}</span>
                          <input
                            type="text"
                            value={group.id === 'local' ? t('localGroup') : group.name}
                            onChange={(e) => onUpdateGroupName(group.id, e.target.value)}
                            disabled={group.id === 'local'}
                            className="login-input"
                            style={{ flex: 1 }}
                          />
                        </div>
                        {group.id !== 'local' && (
                          <div className="group-actions">
                            {/* ログイン中かつ、ブラウザ版(local)でなければボタンを表示 */}
                            {user && group.id !== 'local' && (
                              <button
                                className={`menu-action-btn small-btn main-toggle-btn ${group.is_main ? 'main-active' : ''}`}
                                onClick={() => onSetMainGroup(group.id)}
                              >
                                {group.is_main ? '★ ' + (t('Main') || 'メイン') : '☆ ' + (t('setMain') || 'メインに設定')}
                              </button>
                            )}
                            {/* 上下移動ボタン */}
                            <button className="menu-action-btn small-btn" onClick={() => onMoveGroupUp(index)}>
                              ↑<span className="hide-on-mobile"> {t('moveUp')}</span>
                            </button>
                            <button className="menu-action-btn small-btn" onClick={() => onMoveGroupDown(index)}>
                              ↓<span className="hide-on-mobile"> {t('moveDown')}</span>
                            </button>
                            <button className="menu-action-btn small-btn" onClick={() => onCopyGroup(group.id, group.name)}>{t('copyGroupBtn')}</button>
                            <button className="menu-action-btn small-btn danger-btn" onClick={() => onDeleteGroup(group.id)}>{t('deleteGroupBtn')}</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* --- 新規 --- */}
                  <div className="add-group-row group-edit-row">
                    <div className="group-edit-main">
                      <span className="group-active-indicator"></span> {/* 上と開始位置を合わせるための空インジケータ */}
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder={t('newGroupNameHint')}
                        className="login-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div className="group-actions">
                      <button className="menu-action-btn primary-btn add-group-btn" onClick={handleAddNewGroup}>
                        {t('addGroupBtn')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // --- ログインしていない場合 ---
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <p style={{ color: '#555', margin: 0 }}>{t('loginRequiredHint')}</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 【タブ4】カテゴリ設定（常に表示） */}
        {activeTab === 'category' && (
          <div className="menu-tab-pane animate-fade-in">
            <section className="menu-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>
                  {t('categorySettingsTitle')}
                </h3>
                <select
                  value={activeGroup}
                  onChange={(e) => setActiveGroup(e.target.value)}
                  className="login-input"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.9rem', marginBottom: 0 }}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.id === 'local' ? t('localGroup') : g.name}
                    </option>
                  ))}
                </select>
              </div>

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
                      className="login-input"
                    />
                  </div>
                ))}
              </div>

              <div className="category-save-area">
                <button className="menu-action-btn export" onClick={handleSaveCategories} style={{ backgroundColor: '#1a73e8' }}>
                  {t('updateBtn')}
                </button>
                {saveMessage && <span className="animate-fade-in update-success-msg">{saveMessage}</span>}
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
