import { useState, useEffect } from 'react';
import './LinkFormModal.css';
import { CATEGORIES } from '../../data/mockData';
import { useSettings } from '../../contexts/SettingsContext';
import { COMMON_TAGS } from '../../constants/languages';

function LinkFormModal({ isOpen, onSubmit, initialData, allCategories, groups, activeGroup }) {
    const { t, language } = useSettings();
    // フォームの入力項目を管理するステート
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        groupId: activeGroup || 'local',
        categoryId: '', 
        browser: '', // デフォルトを空欄に
        shortMemo: '',
        detailMemo: '',
        isFavorite: false,
        isHighlighted: false,
        tags: '',
        order: 10
    });

    const currentGroupId = formData.groupId || activeGroup || 'local';
    const categoryOptions = allCategories 
        ? allCategories.filter(c => (c.group_id || c.groupId || 'local') === currentGroupId)
        : [];

    // 編集モードの場合、初期値をセットする
    useEffect(() => {
        if (initialData) {
            const initGroupId = initialData.group_id || initialData.groupId || 'local';
            setFormData({
                ...initialData,
                groupId: initGroupId,
                categoryId: initialData.category_id || initialData.categoryId || '',
                browser: initialData.browser ?? '',
                tags: initialData.tags ? initialData.tags.join(', ') : ''
            });
        } else {
            // 新規の場合はリセット（browserは空欄に固定）
            const initGroupId = activeGroup || 'local';
            const initCategories = allCategories ? allCategories.filter(c => (c.group_id || c.groupId || 'local') === initGroupId) : [];
            setFormData({
                title: '', url: '', 
                groupId: initGroupId,
                categoryId: initCategories.length > 0 ? initCategories[0].id : '', 
                browser: '',
                shortMemo: '', detailMemo: '', isFavorite: false,
                isHighlighted: false, tags: '', order: 10
            });
        }
    }, [initialData, isOpen, activeGroup, allCategories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'groupId') {
            const newCategories = allCategories ? allCategories.filter(c => (c.group_id || c.groupId || 'local') === value) : [];
            setFormData(prev => ({
                ...prev,
                groupId: value,
                categoryId: newCategories.length > 0 ? newCategories[0].id : ''
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleToggleTag = (tag) => {
        setFormData(prev => {
            const currentTags = prev.tags ? prev.tags.split(',').map(t => t.trim()).filter(t => t !== '') : [];
            if (currentTags.includes(tag)) {
                return { ...prev, tags: currentTags.filter(t => t !== tag).join(', ') };
            } else {
                return { ...prev, tags: [...currentTags, tag].join(', ') };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. 基本的な必須チェック
        if (!formData.title.trim() || !formData.url.trim()) {
            alert(t('titleUrlRequired'));
            return;
        }

        // 2. 名称の長さチェック（念のためJS側でも）
        if (formData.title.length > 50) {
            alert(t('titleMaxLength'));
            return;
        }

        // 3. タグの合計文字数チェック
        if (formData.tags.length > 100) {
            alert(t('tagsMaxLength'));
            return;
        }

        // 4. URL形式チェック
        if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
            alert(t('urlFormatError'));
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
            <div className="form-row">
                <div className="form-group" style={{ flex: 1.5 }}>
                    <label>{t('linkTitle')}</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} maxLength="50" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('groupManagement') || 'グループ'}</label>
                    <select name="groupId" value={formData.groupId} onChange={handleChange}>
                    {groups && groups.map(g => (
                        <option key={g.id} value={g.id}>
                        {g.id === 'local' ? t('localGroup') : g.name}
                        </option>
                    ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>{t('urlKey')}</label>
                <input type="url" name="url" value={formData.url} onChange={handleChange} maxLength="200" required />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>{t('category')}</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                    {categoryOptions.map((cat, index) => (
                        <option key={cat.id} value={cat.id}>
                        {index + 1}: {cat.name}
                        </option>
                    ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>{t('recBrowser')}</label>
                    <select name="browser" value={formData.browser} onChange={handleChange}>
                        <option value="">{t('selectRecBrowser')}</option>
                        <option value="Edge">Edge</option>
                        <option value="Chrome">Chrome</option>
                        <option value="Firefox">Firefox</option>
                        <option value="Safari">Safari</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>{t('shortMemoLabel')}</label>
                <input type="text" name="shortMemo" value={formData.shortMemo} onChange={handleChange} maxLength="50" />
            </div>

            <div className="form-group">
                <label>{t('detailMemoLabel')}</label>
                <textarea name="detailMemo" value={formData.detailMemo} onChange={handleChange} rows="4" maxLength="1000"></textarea>
            </div>

            <div className="form-group">
                <label>{t('tagsLabel')}</label>
                <div className="tag-presets">
                    {(COMMON_TAGS[language] || COMMON_TAGS.ja).map(tag => {
                        const isSelected = formData.tags.split(',').map(t => t.trim()).includes(tag);
                        return (
                            <button 
                                key={tag} 
                                type="button" 
                                className={`preset-tag-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleToggleTag(tag)}
                            >
                                #{tag}
                            </button>
                        );
                    })}
                </div>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} maxLength="100" placeholder={t('tagsPlaceholder')} />
            </div>

            <div className="form-checkbox-group">
                <label>
                    <input type="checkbox" name="isFavorite" checked={formData.isFavorite} onChange={handleChange} />
                    {t('isFavoriteLabel')}
                </label>
                <label>
                    <input type="checkbox" name="isHighlighted" checked={formData.isHighlighted} onChange={handleChange} />
                    {t('isHighlightedLabel')}
                </label>
            </div>

            <div className="form-group order-inline-group">
                <label htmlFor="order">{t('displayOrder')}</label>
                <input
                    id="order"
                    className="order-input"
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder={t('orderPlaceholder')}
                />
                <span className="order-note">{t('orderNote')}</span>
            </div>

            <div className="form-actions">
                <button type="submit" className="save-btn">{t('saveSubmit')}</button>
            </div>
        </form>
    );
}

export default LinkFormModal;