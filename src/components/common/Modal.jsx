import './Modal.css';

function Modal({ isOpen, onClose, title, children }) {
  // isOpenがfalse（開いていない状態）の時は何も画面に描画しない
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* 白い枠の中をクリックした時は、裏の黒背景までクリック判定が貫通しないようにストップする */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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