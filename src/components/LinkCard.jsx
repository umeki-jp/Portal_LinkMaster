import { useState } from 'react';
import './LinkCard.css';
import { useSettings } from '../contexts/SettingsContext';

function LinkCard({ link, onDetailClick, onEditClick, onDeleteClick }) {
  // ★設定コンテキストから翻訳関数を取得
  const { t } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  // URLをクリップボードにコピーする関数
  const copyUrl = (e) => {
    e.stopPropagation(); // リンク自体のクリックイベントを防ぐ
    navigator.clipboard.writeText(link.url);
    alert(t('urlCopied')); // 翻訳対応
  };

  // タグを最初の3つだけに制限する
  const displayTags = link.tags ? link.tags.slice(0, 3) : [];

  return (
    // クラス名を link-row に統一
    <div className={`link-row ${link.isHighlighted ? 'highlighted' : ''} ${isExpanded ? 'expanded' : ''}`}>

      {/* 1. タイトルとブラウザラベル（メイン情報） */}
      <div className="col-main">
        <h3 className="link-title">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.url}
          >
            {link.title}
          </a>
        </h3>
        <span className="browser-badge">{link.browser}</span>
        {link.isFavorite && <span className="fav-star">★</span>}
      </div>

      {/* モバイル用展開ボタン (CSSでモバイル時のみ表示) */}
      <button 
        className="mobile-expand-btn" 
        onClick={() => setIsExpanded(!isExpanded)}
        title="詳細情報"
      >
        {isExpanded ? '▲' : '▼'}
      </button>

      {/* 展開ラッパー */}
      <div className="link-details-wrapper">
        {/* 2. 簡易メモ */}
        <div className="col-memo">
          <p className="short-memo">{link.shortMemo}</p>
        </div>

        {/* 3. タグ */}
        <div className="col-tags">
          <div className="tags-container">
            {displayTags.map(tag => (
              <span key={tag} className="tag-badge">{tag}</span>
            ))}
          </div>
        </div>

        {/* 4. アクションボタン（右側に集約） */}
        <div className="col-actions">
          <button className="action-btn detail" onClick={() => onDetailClick(link)}>{t('detail')}</button>
          <button className="action-btn copy" onClick={copyUrl}>{t('copyUrlBtn')}</button>
          <button className="action-btn edit" onClick={() => onEditClick(link)}>{t('edit')}</button>
          <button className="action-btn delete" onClick={() => onDeleteClick(link.id)} style={{ color: 'red' }}>{t('delete')}</button>
        </div>
      </div>
    </div>
  );
}

export default LinkCard;