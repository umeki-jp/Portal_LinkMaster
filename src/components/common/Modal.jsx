import { useEffect, useRef, useState } from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, contentClassName = '' }) {
  const contentRef = useRef(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const [translateY, setTranslateY] = useState(0);

  // 背景のスクロールを止める＆閉じた直後に位置をリセットする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTranslateY(0);
    } else {
      document.body.style.overflow = '';
      setTranslateY(0);
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
    // コンテンツがスクロール可能な場合、最上部にいる時だけ引っ張りを許可
    const scrollTop = contentRef.current ? contentRef.current.scrollTop : 0;
    if (scrollTop <= 1) { // 1px以下のズレまで許容
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    } else {
      isDragging.current = false;
    }
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
    
    // 100px 以上下に引っ張られたら閉じる
    if (translateY > 100) {
      onClose();
    } else {
      // 届かなければ元の位置へスッと戻る
      setTranslateY(0);
    }
  };

  return (
    <div className="modal-overlay">
      {/* 白い枠の中をクリックした時は、裏の黒背景までクリック判定が貫通しないようにストップする */}
      <div 
        className={modalContentClassName} 
        onClick={(e) => e.stopPropagation()}
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateY(${translateY}px)`, 
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out' 
        }}
      >
        {/* スマホ用の「下に引っ張れる」ことを示すバー */}
        <div className="swipe-bar" onClick={onClose} title="閉じる"></div>

        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* ここに詳細メモや入力フォームなど、各画面の中身が入ります */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;