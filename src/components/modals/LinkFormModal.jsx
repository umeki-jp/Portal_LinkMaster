import { useState, useEffect } from 'react';
import './LinkFormModal.css';
import { CATEGORIES } from '../../data/mockData';

function LinkFormModal({ isOpen, onSubmit, initialData, categories }) {
    // フォームの入力項目を管理するステート
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        categoryId: '1',
        browser: '', // デフォルトを空欄に
        shortMemo: '',
        detailMemo: '',
        isFavorite: false,
        isHighlighted: false,
        tags: '',
        order: 10
    });

    // 編集モードの場合、初期値をセットする
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                browser: initialData.browser ?? '',
                tags: initialData.tags ? initialData.tags.join(', ') : ''
            });
        } else {
            // 新規の場合はリセット（browserは空欄に固定）
            setFormData({
                title: '', url: '', categoryId: '1', browser: '',
                shortMemo: '', detailMemo: '', isFavorite: false,
                isHighlighted: false, tags: '', order: 10
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. 基本的な必須チェック
        if (!formData.title.trim() || !formData.url.trim()) {
            alert('リンク名称とURLは必須項目です。');
            return;
        }

        // 2. 名称の長さチェック（念のためJS側でも）
        if (formData.title.length > 50) {
            alert('リンク名称は50文字以内で入力してください。');
            return;
        }

        // 3. タグの合計文字数チェック
        if (formData.tags.length > 30) {
            alert('タグは合計で30文字以内にしてください。');
            return;
        }

        // 4. URL形式チェック
        if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
            alert('URLは http:// または https:// から入力してください。');
            return;
        }

        // 保存用データの作成
        const processedData = {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            updatedAt: new Date().toISOString()
        };

        onSubmit(processedData);
    };

    return (
        <form className="link-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>リンク名称</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} maxLength="50" required />
            </div>

            <div className="form-group">
                <label>URL</label>
                <input type="url" name="url" value={formData.url} onChange={handleChange} maxLength="200" required />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>カテゴリ</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                    {categories.map((cat, index) => (
                        <option key={cat.id} value={cat.id}>
                        {index + 1}: {cat.name}  {/* ★「1: システム（メイン）」のように表示 */}
                        </option>
                    ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>推奨ブラウザ</label>
                    <select name="browser" value={formData.browser} onChange={handleChange}>
                        <option value="">-- 選択してください --</option>
                        <option value="Edge">Edge</option>
                        <option value="Chrome">Chrome</option>
                        <option value="Firefox">Firefox</option>
                        <option value="Safari">Safari</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>簡易メモ（一覧に表示）</label>
                <input type="text" name="shortMemo" value={formData.shortMemo} onChange={handleChange} maxLength="50" />
            </div>

            <div className="form-group">
                <label>詳細メモ（ポップアップに表示）</label>
                <textarea name="detailMemo" value={formData.detailMemo} onChange={handleChange} rows="4" maxLength="1000"></textarea>
            </div>

            <div className="form-group">
                <label>タグ（カンマ区切りで最大3つ推奨）</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} maxLength="30" placeholder="毎日, 重要, 経理" />
            </div>

            <div className="form-checkbox-group">
                <label>
                    <input type="checkbox" name="isFavorite" checked={formData.isFavorite} onChange={handleChange} />
                    お気に入り（最上部に表示）
                </label>
                <label>
                    <input type="checkbox" name="isHighlighted" checked={formData.isHighlighted} onChange={handleChange} />
                    強調（行をハイライト）
                </label>
            </div>

            <div className="form-actions">
                <button type="submit" className="save-btn">保存する</button>
            </div>
        </form>
    );
}

export default LinkFormModal;