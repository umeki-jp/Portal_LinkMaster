import { useEffect, useRef, useState } from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, contentClassName = '' }) {
  const contentRef = useRef(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const [translateY, setTranslateY] = useState(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 背景のスクロールを止める
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // isOpenがfalse（開いていない状態）の時は何も画面に描画しない
  if (!isOpen) return null;

  const modalContentClassName = contentClassName
    ? `modal-content ${contentClassName}`
    : 'modal-content';

  // スワイプダウン（下に引っ張る）で閉じる処理
  const handleTouchStart = (e) => {
    // ヘッダーやスワイプバーのエリアを触った時のみ許可する
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    setIsDraggingState(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // 下方向にだけ引っ張れるようにする
    if (diff > 0) {
      setTranslateY(diff);
    } else {
      setTranslateY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);
    
    // 120px 以上下に引っ張られたら閉じる（少し基準を緩める）
    if (translateY > 120) {
      onClose();
    } else {
      // 届かなければ元の位置へスッと戻る
      setTranslateY(0);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* 白い枠の中をクリックした時は、裏の黒背景までクリック判定が貫通しないようにストップする */}
      <div 
        className={modalContentClassName} 
        onClick={(e) => e.stopPropagation()}
        ref={contentRef}
        style={{ 
          transform: `translateY(${translateY}px)`, 
          transition: isDraggingState ? 'none' : 'transform 0.3s ease-out' 
        }}
      >
        {/* ----- ドラッグ可能エリア ----- */}
        <div 
          className="modal-drag-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab', paddingBottom: '5px' }} /* ヘッダー周辺にタッチ判定を限定 */
        >
          {/* スマホ用の「下に引っ張れる」ことを示すバー */}
          <div className="swipe-bar" onClick={onClose} title="閉じる"></div>

          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        {/* --------------------------- */}
        <div className="modal-body">
          {/* ここに詳細メモや入力フォームなど、各画面の中身が入ります */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
