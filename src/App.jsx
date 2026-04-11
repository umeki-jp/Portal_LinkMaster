import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { CATEGORIES, INITIAL_LINKS } from './data/mockData';
import Modal from './components/common/Modal';
import LinkCard from './components/LinkCard';
import LinkFormModal from './components/modals/LinkFormModal';
import MenuModal from './components/modals/MenuModal';
import { useSettings } from './hooks/useSettings';
import { COMMON_TAGS } from './constants/languages';
import { useAuth } from './hooks/useAuth';
import { db } from './lib/db';
import { sanitizeLinksForState } from './lib/linkValidation';
import { MAX_IMPORT_LINK_COUNT, normalizeImportedData } from './lib/importValidation';
import {
  consumeStorageRecoveryNotices,
  isValidStoredCategories,
  isValidStoredGroups,
  isValidStoredLinks,
  readStoredJson,
} from './lib/storageRecovery';

const LOCAL_GROUP = { id: 'local', name: 'ブラウザ版' };

const getLocalLinks = () => {
  const parsedLinks = readStoredJson('portal_links', INITIAL_LINKS, isValidStoredLinks)
    .map(l => ({ ...l, isCloud: false }));
  return sanitizeLinksForState(parsedLinks);
};

const getLocalCategories = () => {
  return readStoredJson('portal_categories', CATEGORIES, isValidStoredCategories)
    .map(c => ({ ...c, isCloud: false }));
};

const getLocalGroups = () => {
  let initialGroups = readStoredJson('portal_groups', [LOCAL_GROUP], isValidStoredGroups)
    .map(g => ({ ...g, isCloud: false }));

  if (!initialGroups.some(g => g.id === 'local')) {
    initialGroups = [LOCAL_GROUP, ...initialGroups];
  }

  return initialGroups;
};

function App() {
  // ★設定コンテキストから「言語設定」と「翻訳関数」を呼び出す
  const { language, setLanguage, isDarkMode, setIsDarkMode, t } = useSettings();
  const { user } = useAuth();
  const hasShownRecoveryNotice = useRef(false);

  // 1. 最初から「ブラウザ版」を選択状態にする
  const [activeGroup, setActiveGroup] = useState('local');

  // 2. 起動した瞬間に、localStorageからデータを直接読み込む（useEffectを待たない）
  const [links, setLinks] = useState(() => getLocalLinks());

  const [categories, setCategories] = useState(() => getLocalCategories());

  const [groups, setGroups] = useState(() => getLocalGroups());

  const [isLoading, setIsLoading] = useState(false); // 初期値はfalseにしておく

  const syncCloudState = useCallback(async () => {
    const data = await db.fetchAll();

    const cloudGroups = data.groups.map(g => ({ ...g, isCloud: true }));
    const cloudCategories = data.categories.map(c => ({ ...c, isCloud: true }));
    const cloudLinks = sanitizeLinksForState(data.links.map(l => ({ ...l, isCloud: true })));

    const localLinks = getLocalLinks();
    const localCats = getLocalCategories();
    const localGroups = getLocalGroups();

    setGroups([...localGroups, ...cloudGroups]);
    setCategories([...localCats, ...cloudCategories]);
    setLinks([...localLinks, ...cloudLinks]);

    return { cloudGroups };
  }, []);

  const handleCloudMutationFailure = useCallback(async ({
    error,
    logMessage,
    alertMessage,
    rollback,
  }) => {
    console.error(logMessage, error);

    if (typeof rollback === 'function') {
      rollback();
    }

    try {
      await syncCloudState();
    } catch (syncError) {
      console.error('Cloud resync failed:', syncError);
    }

    alert(alertMessage);
  }, [syncCloudState]);

  useEffect(() => {
    if (hasShownRecoveryNotice.current) return;

    const notices = consumeStorageRecoveryNotices();
    if (notices.length === 0) return;

    const storageLabels = {
      portal_links: t('storageRecoveryLinksLabel'),
      portal_categories: t('storageRecoveryCategoriesLabel'),
      portal_groups: t('storageRecoveryGroupsLabel'),
      u1344_language: t('storageRecoveryLanguageLabel'),
      u1344_dark_mode: t('storageRecoveryThemeLabel'),
    };

    const detailLines = notices.map(({ key, backupKey }) => {
      const label = storageLabels[key] || key;
      return backupKey
        ? `- ${label}: ${backupKey}`
        : `- ${label}`;
    });

    hasShownRecoveryNotice.current = true;
    alert(
      `${t('storageRecoveryDetected')}\n\n${detailLines.join('\n')}\n\n${t('storageRecoveryBackupHint')}`
    );
  }, [t]);

  // A. 初期読込 & ログイン/ログアウト時のデータ切り替え
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      if (user) {
        // --- ☁️ ログイン中: クラウド(Supabase)から取得 ---
        try {
          const { cloudGroups } = await syncCloudState();

          // アクティブなグループが未設定なら local か クラウドの最初のIDにする
          setActiveGroup(prevActiveGroup => {
            if (!prevActiveGroup || prevActiveGroup === '') {
              return cloudGroups.length > 0 ? cloudGroups[0].id : 'local';
            }

            return prevActiveGroup;
          });
        } catch (error) {
          console.error("Cloud fetch error:", error);
        }
      } else {
        // --- 💻 未ログイン: ローカルストレージ(ブラウザ版)から取得 ---
        const localLinks = getLocalLinks();
        const localCats = getLocalCategories();
        const localGroups = getLocalGroups();

        setLinks(localLinks);
        setCategories(localCats);
        setGroups(localGroups);
        setActiveGroup('local');
      }
      setIsLoading(false);
    };

    loadInitialData();
  }, [user, syncCloudState]);

  // B. ブラウザ版(Local)データの自動保存
  // ログインの有無に関わらず、読み込み完了後は常にローカルに最新を保持（爆速起動のため）
  useEffect(() => {
    if (!isLoading) {
      const localLinksToSave = links.filter(l => !l.isCloud);
      const localCatsToSave = categories.filter(c => !c.isCloud);
      const localGroupsToSave = groups.filter(g => !g.isCloud);

      localStorage.setItem('portal_links', JSON.stringify(sanitizeLinksForState(localLinksToSave)));
      localStorage.setItem('portal_categories', JSON.stringify(localCatsToSave));
      localStorage.setItem('portal_groups', JSON.stringify(localGroupsToSave));
    }
  }, [links, categories, groups, isLoading]);

  // C. カテゴリ枠の自動生成 (クラウド・ローカル両対応)
  useEffect(() => {
    if (isLoading || !activeGroup) return;

    // クラウド側データは group_id, ローカル側データは groupId 
    const currentGroupCats = categories.filter(c => (c.group_id || c.groupId || 'local') === activeGroup);

    const isCloudGroup = user && activeGroup !== 'local' && !activeGroup.startsWith('group_');

    // ★ バグ起因で保存されてしまったダミーID (_cat) を持つカテゴリがクラウドグループに存在する場合、除去する
    if (isCloudGroup) {
      const hasDummyCats = currentGroupCats.some(c => typeof c.id === 'string' && c.id.includes('_cat'));
      if (hasDummyCats) {
        setCategories(prev => prev.filter(c => {
          const isTargetGroup = (c.groupId === activeGroup || c.group_id === activeGroup);
          const isDummy = typeof c.id === 'string' && c.id.includes('_cat');
          return !(isTargetGroup && isDummy);
        }));
        return; // 次のレンダリングで currentGroupCats.length === 0 の処理へ移行させる
      }
    }
    
    if (currentGroupCats.length === 0) {
      if (activeGroup === 'local' || activeGroup.startsWith('group_') || !user) { 
        // ローカル版グループの場合はダミーIDで生成
        const newCats = Array.from({ length: 10 }).map((_, i) => ({
          id: activeGroup === 'local' ? `local_cat${i + 1}` : `${activeGroup}_cat${i + 1}`,
          name: '',
          order: i + 1,
          groupId: activeGroup
        }));
        setCategories(prev => [...prev, ...newCats]);
      } else if (user) {
        // クラウドグループでカテゴリがまだない場合は、リアルなUUIDを発行するためSupabaseに枠を作る
        const initCloudCats = async () => {
          try {
            const promises = Array.from({ length: 10 }).map((_, i) => 
               db.insertCategory(activeGroup, '', i + 1)
            );
            const newCloudCats = await Promise.all(promises);
            setCategories(prev => [...prev, ...newCloudCats.map(c => ({...c, isCloud: true}))]);
          } catch(error) {
            console.error("Cloud category init error:", error);
          }
        };
        initCloudCats();
      }
    }
  }, [activeGroup, categories, isLoading, user]);

  // UI・モーダル管理用のステート
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchTags, setSelectedSearchTags] = useState([]);

  const toggleSearchTag = (tag) => {
    setSelectedSearchTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const [closedCategories, setClosedCategories] = useState([]);
  const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);
  const toggleCategory = (categoryId) => {
    setClosedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };

  // ==========================================
  // 現在のグループのデータだけを抽出する
  // ==========================================
  // データ読込中や activeGroup が未定の場合は空配列を返すようにガード
  const activeGroupLinks = activeGroup
    ? links.filter(link => (link.group_id || link.groupId || 'local') === activeGroup)
    : [];

  const activeGroupCategories = activeGroup
    ? categories.filter(cat => (cat.group_id || cat.groupId || 'local') === activeGroup)
    : [];

  // ==========================================
  // グループ管理のロジック
  // ==========================================
  const handleAddGroup = async (groupName) => {
    if (groups.length >= 10) {
      alert('グループは最大10個まで作成できます。');
      return;
    }

    // ★ログインしている場合はクラウドへ、そうでなければローカルへ保存を振り分けます
    if (user) {
      try {
        // db.js の関数を使い、クラウド(Supabase)に保存
        const newGroup = await db.insertGroup(groupName, groups.length);
        setGroups(prev => [...prev, { ...newGroup, isCloud: true }]);
        setActiveGroup(newGroup.id);
      } catch {
        alert("クラウドへのグループ作成に失敗しました。");
      }
    } else {
      // 未ログイン時は今まで通りのローカル処理
      const newGroupId = `group_${Date.now()}`;
      const newGroup = { id: newGroupId, name: groupName, isCloud: false };
      setGroups(prev => [...prev, newGroup]);
      setActiveGroup(newGroupId);
    }
  };

  const handleUpdateGroupName = async (groupId, newName) => {
    const previousGroups = groups;

    // UIのレスポンスを速くするため、まずは画面上の表示（state）を更新します
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));

    // ログインしており、かつ操作対象が「ブラウザ版(local)」でない場合はクラウドも更新
    if (user && groupId !== 'local') {
      try {
        // db.js の関数を使い、Supabaseのデータを書き換えます
        await db.updateGroup(groupId, { name: newName });
      } catch (error) {
        await handleCloudMutationFailure({
          error,
          logMessage: 'クラウドのグループ名更新に失敗:',
          alertMessage: 'グループ名の保存に失敗しました。画面をクラウドの最新状態に戻しました。',
          rollback: () => setGroups(previousGroups),
        });
      }
    }
    // ※未ログイン時は、既存のuseEffect(B)がlocalStorageへ自動保存してくれます
  };

  // 特定のグループをメインに設定する処理
  const handleSetMainGroup = async (groupId) => {
    // ブラウザ版（local）はメイン設定の対象外
    if (groupId === 'local') return;

    const targetGroup = groups.find(g => g.id === groupId);
    const isCurrentlyMain = targetGroup?.is_main;

    try {
      if (isCurrentlyMain) {
        // すでにメインの場合は解除（単一グループの更新）
        await db.updateGroup(groupId, { is_main: false });
        setGroups(prev => prev.map(g => 
          g.id === groupId ? { ...g, is_main: false } : g
        ));
      } else {
        // 新たにメインに設定する場合（他を解除してこれを設定）
        if (user && !groupId.startsWith('group_')) {
          // クラウドに実体があるUUIDグループの場合
          await db.setMainGroup(groupId);
        }

        // フロントエンドのステートを一括更新
        setGroups(prev => prev.map(g => {
          if (g.id === groupId) {
            return { ...g, is_main: true };
          } else {
            // 他の「ブラウザ版以外」のグループはすべてメインから外す
            return g.id === 'local' ? g : { ...g, is_main: false };
          }
        }));
      }
    } catch (error) {
      console.error("Main group toggle error:", error);
      alert("メイングループの設定更新に失敗しました。");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    // 「ブラウザ版」そのものは削除させないガード
    if (groupId === 'local') {
      alert('「ブラウザ版」グループは削除できません。');
      return;
    }

    if (!window.confirm('このグループと、グループ内のすべてのリンク・カテゴリを削除します。よろしいですか？')) return;

    const groupToDelete = groups.find(g => g.id === groupId);

    if (user && groupToDelete && groupToDelete.isCloud) {
      // ☁️ ログイン中 & クラウドのグループを消す場合
      try {
        // db.js の関数を呼び出し。DB側の設定(Cascade)によりカテゴリ・リンクも一瞬で消えます
        await db.deleteGroup(groupId);

        // 手元の画面(State)からも削除して同期させる
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setCategories(prev => prev.filter(c => (c.group_id || c.groupId) !== groupId));
        setLinks(prev => prev.filter(l => (l.group_id || l.groupId) !== groupId));
      } catch {
        alert("クラウドからの削除に失敗しました。");
      }
    } else {
      // 💻 未ログイン または ログイン中に作成した「ローカルな追加グループ」を消す場合
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setLinks(prev => prev.filter(l => (l.groupId || 'local') !== groupId));
      setCategories(prev => prev.filter(c => (c.groupId || 'local') !== groupId));
    }

    // 消したグループを開いていた場合、別のグループに自動で切り替える
    if (activeGroup === groupId) {
      // ログイン中なら残りのクラウドグループの先頭へ、未ログインなら「local」へ
      const fallback = user ? (groups.find(g => g.id !== groupId)?.id || '') : 'local';
      setActiveGroup(fallback);
    }
  };

  const handleCopyGroup = async (sourceGroupId, sourceGroupName) => {
    if (groups.length >= 10) {
      alert('グループは最大10個まで作成できます。');
      return;
    }
    const newGroupName = `${sourceGroupName}のコピー`;

    if (user) {
      // ☁️ クラウド(Supabase)上で複製する
      try {
        // 1. グループを作成
        const newGroup = await db.insertGroup(newGroupName, groups.length, false);
        const newGroupId = newGroup.id;

        // 2. カテゴリを複製
        const sourceCats = categories.filter(c => (c.groupId || c.group_id || 'local') === sourceGroupId).sort((a,b) => (a.order || a.order_index) - (b.order || b.order_index));
        
        const newCatsPromises = sourceCats.map((c, i) => 
          db.insertCategory(newGroupId, c.name, i + 1)
        );
        const insertedCats = await Promise.all(newCatsPromises);
        
        // 元のカテゴリIDを新しいカテゴリUUIDにマッピングするための辞書
        const catIdMap = {};
        sourceCats.forEach((sc, i) => {
          catIdMap[sc.id] = insertedCats[i]?.id || insertedCats[0]?.id;
        });

        // 3. リンクを複製
        const sourceLinks = links.filter(l => (l.groupId || l.group_id || 'local') === sourceGroupId);
        const newLinksPromises = sourceLinks.map((l, i) => {
          const oldCatId = l.category_id || l.categoryId || l.category;
          const newCatId = catIdMap[oldCatId] || insertedCats[0]?.id;
          return db.insertLink({
            title: l.title || '',
            url: l.url || '',
            shortMemo: l.shortMemo || '',
            detailMemo: l.detailMemo || '',
            browser: l.browser || '',
            tags: l.tags || [],
            isFavorite: !!l.isFavorite,
            isHighlighted: !!l.isHighlighted,
            group_id: newGroupId,    // DBと一致
            category_id: newCatId,   // DBと一致
            order: i + 1
          });
        });
        await Promise.all(newLinksPromises);

        // 4. ステートを直接更新せず、DBから最新状態を再取得して同期する（二重表示防止）
        const freshData = await db.fetchAll();

        const cloudGroups = freshData.groups.map(g => ({ ...g, isCloud: true }));
        const cloudCategories = freshData.categories.map(c => ({ ...c, isCloud: true }));
        const cloudLinks = sanitizeLinksForState(freshData.links.map(l => ({ ...l, isCloud: true })));

        // ローカルは維持し、クラウド分だけ最新にリフレッシュ
        setGroups(prev => [...prev.filter(g => !g.isCloud), ...cloudGroups]);
        setCategories(prev => [...prev.filter(c => !c.isCloud), ...cloudCategories]);
        setLinks(prev => [...prev.filter(l => !l.isCloud), ...cloudLinks]);

        setActiveGroup(newGroupId);

      } catch (error) {
        console.error("Cloud copy error:", error);
        alert('クラウドでのグループ複製に失敗しました。');
      }
    } else {
      // 💻 未ログイン時のローカル複製処理
      const newGroupId = `group_${Date.now()}`;
      setGroups(prev => [...prev, { 
        id: newGroupId, 
        name: newGroupName, 
        isCloud: false 
      }]);

      // カテゴリの複製とIDマッピング
      const sourceCats = categories.filter(c => (c.groupId || 'local') === sourceGroupId);
      const copiedCats = sourceCats.map((c, i) => ({
        ...c,
        id: `${newGroupId}_cat${i + 1}`,
        groupId: newGroupId,
        isCloud: false
      }));

      const catIdMap = {};
      sourceCats.forEach((sc, i) => {
        catIdMap[sc.id] = copiedCats[i].id;
      });

      // リンクの複製（新しいカテゴリIDに付け替える）
      const sourceLinks = links.filter(l => (l.groupId || 'local') === sourceGroupId);
      const copiedLinks = sourceLinks.map(l => ({
        ...l,
        id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        groupId: newGroupId,
        categoryId: catIdMap[l.categoryId || l.category_id] || copiedCats[0].id,
        createdAt: new Date().toISOString(),
        isCloud: false
      }));

      setCategories(prev => [...prev, ...copiedCats]);
      setLinks(prev => [...prev, ...copiedLinks]);

      setActiveGroup(newGroupId);
    }
  };

  // グループを1つ上へ移動する処理
  const handleMoveGroupUp = (index) => {
    if (index === 0) return; // すでに一番上の場合は何もしない
    const previousGroups = groups;
    const newGroups = [...groups];
    const temp = newGroups[index - 1];
    newGroups[index - 1] = newGroups[index];
    newGroups[index] = temp;
    
    setGroups(newGroups);

    // クラウド環境であれば、並び替え後の順序(order_index)を全更新する
    if (user) {
      Promise.all(
        newGroups.map((g, i) => (
          g.isCloud && g.id !== 'local' && !g.id.startsWith('group_')
            ? db.updateGroup(g.id, { order_index: i })
            : Promise.resolve()
        ))
      ).catch(async (error) => {
        await handleCloudMutationFailure({
          error,
          logMessage: 'Order move up error:',
          alertMessage: 'グループ並び順の保存に失敗しました。画面をクラウドの最新状態に戻しました。',
          rollback: () => setGroups(previousGroups),
        });
      });
    }
  };

  // グループを1つ下へ移動する処理
  const handleMoveGroupDown = (index) => {
    if (index === groups.length - 1) return; // すでに一番下の場合は何もしない
    const previousGroups = groups;
    const newGroups = [...groups];
    const temp = newGroups[index + 1];
    newGroups[index + 1] = newGroups[index];
    newGroups[index] = temp;
    
    setGroups(newGroups);

    // クラウド環境であれば、並び替え後の順序(order_index)を全更新する
    if (user) {
      Promise.all(
        newGroups.map((g, i) => (
          g.isCloud && g.id !== 'local' && !g.id.startsWith('group_')
            ? db.updateGroup(g.id, { order_index: i })
            : Promise.resolve()
        ))
      ).catch(async (error) => {
        await handleCloudMutationFailure({
          error,
          logMessage: 'Order move down error:',
          alertMessage: 'グループ並び順の保存に失敗しました。画面をクラウドの最新状態に戻しました。',
          rollback: () => setGroups(previousGroups),
        });
      });
    }
  };

  // ドラッグ＆ドロップ用ハンドラー
  const handleGroupDragStart = (e, index) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedGroupIndex === null || draggedGroupIndex === dropIndex) return;

    const previousGroups = groups;
    const newGroups = [...groups];
    const draggedItem = newGroups.splice(draggedGroupIndex, 1)[0];
    newGroups.splice(dropIndex, 0, draggedItem);

    setGroups(newGroups);
    setDraggedGroupIndex(null);

    // クラウド環境であれば、並び替え後の順序(order_index)を全更新する
    if (user) {
      Promise.all(
        newGroups.map((g, i) => (
          g.isCloud && g.id !== 'local' && !g.id.startsWith('group_')
            ? db.updateGroup(g.id, { order_index: i })
            : Promise.resolve()
        ))
      ).catch(async (error) => {
        await handleCloudMutationFailure({
          error,
          logMessage: 'Order move error:',
          alertMessage: 'グループ並び順の保存に失敗しました。画面をクラウドの最新状態に戻しました。',
          rollback: () => setGroups(previousGroups),
        });
      });
    }
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupIndex(null);
  };

  // ブラウザ版 ➔ クラウドへのコピー（バックアップ/初期同期）
  const handleBackupLocalToCloud = async () => {
    if (!user) return;

    const cloudGroupCount = groups.filter(g => g.isCloud).length;
    if (cloudGroupCount >= 10) {
      alert('クラウドのグループ枠（最大10個）に空きがありません。');
      return;
    }

    if (!window.confirm('現在のブラウザ版の内容を、クラウドの新しいグループとしてコピーしますか？')) return;

    setIsLoading(true);
    try {
      // 1. 新規グループ作成
      const newGroup = await db.insertGroup('ブラウザ版からのコピー', cloudGroupCount);
      const newGroupId = newGroup.id;

      // 2. ブラウザ版のカテゴリを抽出（groupIdが'local'、または未定義のもの）
      const localCats = categories.filter(c => !c.isCloud && (c.groupId === 'local' || !c.groupId || (c.group_id === 'local')));
      const catMap = {};
      const newCloudCatsForState = [];

      for (const [i, cat] of localCats.entries()) {
        const orderValue = cat.order || (i + 1);
        const createdCat = await db.insertCategory(newGroupId, cat.name || '', orderValue);
        
        catMap[cat.id] = createdCat.id; // 旧IDと新UUIDを紐付け
        newCloudCatsForState.push({ ...createdCat, isCloud: true });
      }

      // 3. ブラウザ版のリンクを抽出
      const localLinks = links.filter(l => !l.isCloud && (l.groupId === 'local' || !l.groupId || (l.group_id === 'local')));
      
      const fallbackCatId = newCloudCatsForState.length > 0 ? newCloudCatsForState[0].id : null;

      const linkPromises = localLinks.map(link => {
        // カテゴリIDの変換
        const targetCatId = catMap[link.categoryId] || fallbackCatId;

       return db.insertLink({
          title: link.title || '',
          url: link.url || '',
          shortMemo: link.shortMemo || '',   // DBと完全一致
          detailMemo: link.detailMemo || '', // DBと完全一致
          browser: link.browser || '',
          order: link.order || 10,
          tags: link.tags || [],
          isFavorite: !!link.isFavorite,     // DBと完全一致
          isHighlighted: !!link.isHighlighted, // DBと完全一致
          group_id: newGroupId,              // DBの "group_id" と一致
          category_id: targetCatId           // DBの "category_id" と一致
        });
      });

      const uploadedLinks = await Promise.all(linkPromises);

      // 4. フロントエンドのステートを更新（既存のデータに付け加える）
      setGroups(prev => [...prev, { ...newGroup, isCloud: true }]);
      setCategories(prev => [...prev, ...newCloudCatsForState]);
      setLinks(prev => [...prev, ...uploadedLinks.map(l => ({ ...l, isCloud: true }))]);

      alert(`コピー完了：カテゴリ ${newCloudCatsForState.length}件、リンク ${uploadedLinks.length}件をクラウドに保存しました。`);
    } catch (error) {
      console.error("Backup to cloud error:", error);
      alert("コピー中にエラーが発生しました。詳細はコンソールを確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // クラウドグループ ➔ ブラウザ版への上書きコピー（リストア）
  const handleRestoreCloudToLocal = async (sourceGroupId) => {
    if (!user || !sourceGroupId) return;

    const sourceGroup = groups.find(g => g.id === sourceGroupId);
    if (!sourceGroup) return;

    const msg = `【警告】\n現在のブラウザ版のデータはすべて消去され、\n「${sourceGroup.name}」の内容で上書きされます。\n\n本当によろしいですか？`;
    if (!window.confirm(msg)) return;

    try {
      // 1. 対象グループのクラウドデータを抽出
      const cloudLinks = links.filter(l => (l.group_id || l.groupId) === sourceGroupId);
      const cloudCats = categories.filter(c => (c.group_id || c.groupId) === sourceGroupId);

      // 2. IDをローカル形式（local_catX / local_linkX）に変換するためのマップ作成
      const catMap = {};
      const newLocalCats = cloudCats.map((cat, i) => {
        const newId = `local_cat${i + 1}`;
        catMap[cat.id] = newId;
        return {
          id: newId,
          name: cat.name,
          order: cat.order || i + 1,
          groupId: 'local',
          isCloud: false
        };
      });

      const newLocalLinks = sanitizeLinksForState(cloudLinks.map(link => ({
        id: `local_link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: link.title,
        url: link.url,
        shortMemo: link.short_memo || link.shortMemo,
        detailMemo: link.detail_memo || link.detailMemo,
        tags: link.tags,
        isFavorite: link.is_favorite || link.isFavorite,
        categoryId: catMap[link.category_id || link.categoryId] || 'local_cat1',
        groupId: 'local',
        isCloud: false,
        createdAt: new Date().toISOString()
      })));

      // 3. ブラウザ版以外のデータ（他グループ）は残しつつ、ブラウザ版(local)だけを差し替える
      setCategories(prev => [
        ...prev.filter(c => (c.group_id || c.groupId || 'local') !== 'local'),
        ...newLocalCats
      ]);
      setLinks(prev => [
        ...prev.filter(l => (l.group_id || l.groupId || 'local') !== 'local'),
        ...newLocalLinks
      ]);

      // 4. 強制的にブラウザ版タブへ切り替え
      setActiveGroup('local');
      alert('ブラウザ版への上書きコピーが完了しました。');

    } catch (error) {
      console.error("Restore from cloud error:", error);
      alert("コピー中にエラーが発生しました。");
    }
  };

  // インポート処理
  const handleImportData = (importedLinks, importedCategories) => {
    let normalizedImport;

    try {
      const currentLocalCategories = categories.filter(c => (c.group_id || c.groupId || 'local') === 'local');
      normalizedImport = normalizeImportedData({
        importedLinks,
        importedCategories,
        currentLocalCategories,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_VALID_IMPORT_LINKS') {
        throw new Error(language === 'en'
          ? 'No valid links were found in the imported file.'
          : 'インポートファイル内に有効なリンクが見つかりませんでした。');
      }

      throw new Error(language === 'en'
        ? 'Unsupported file format.'
        : '対応していないファイル形式です');
    }

    const { links: normalizedLinks, categories: normalizedCategories, warnings } = normalizedImport;

    setLinks(prev => [
      ...prev.filter(l => (l.group_id || l.groupId || 'local') !== 'local'),
      ...sanitizeLinksForState(normalizedLinks),
    ]);

    if (normalizedCategories) {
      setCategories(prev => [
        ...prev.filter(c => (c.group_id || c.groupId || 'local') !== 'local'),
        ...normalizedCategories,
      ]);
    }

    setActiveGroup('local');
    setIsMenuOpen(false);

    const warningLines = [];
    if (warnings.invalidLinks > 0) {
      warningLines.push(language === 'en'
        ? `- Skipped invalid links: ${warnings.invalidLinks}`
        : `- 不正なリンクを除外: ${warnings.invalidLinks}件`);
    }
    if (warnings.extraLinks > 0) {
      warningLines.push(language === 'en'
        ? `- Skipped links over the ${MAX_IMPORT_LINK_COUNT}-item limit: ${warnings.extraLinks}`
        : `- 上限${MAX_IMPORT_LINK_COUNT}件を超えたリンクを除外: ${warnings.extraLinks}件`);
    }
    if (warnings.invalidCategories > 0) {
      warningLines.push(language === 'en'
        ? `- Skipped invalid categories: ${warnings.invalidCategories}`
        : `- 不正なカテゴリを除外: ${warnings.invalidCategories}件`);
    }
    if (warnings.extraCategories > 0) {
      warningLines.push(language === 'en'
        ? `- Skipped categories over the 10-item limit: ${warnings.extraCategories}`
        : `- 上限10件を超えたカテゴリを除外: ${warnings.extraCategories}件`);
    }
    if (warnings.truncatedStrings) {
      warningLines.push(language === 'en'
        ? '- Some text fields were truncated to fit length limits.'
        : '- 一部の文字列は長さ制限に合わせて切り詰めました。');
    }
    if (warnings.usedDefaultCategories) {
      warningLines.push(language === 'en'
        ? '- Category data was missing or invalid, so default local categories were used.'
        : '- カテゴリデータが不足または不正だったため、既定のローカルカテゴリを使用しました。');
    }

    if (warningLines.length > 0) {
      return {
        warningMessage: language === 'en'
          ? `Import completed with adjustments.\n\n${warningLines.join('\n')}`
          : `インポート時に一部データを調整しました。\n\n${warningLines.join('\n')}`,
      };
    }

    return null;
  };

  // メニューからカテゴリだけを更新する専用処理
  const handleUpdateCategories = async (updatedActiveCategories) => {
    const previousCategories = categories;

    setCategories(prev => {
      // クラウドデータの持つ group_id を追加して判定する
      const otherCategories = prev.filter(c => (c.group_id || c.groupId || 'local') !== activeGroup);
      // どのような場合でも1グループあたりのカテゴリは最大10個までに切り詰める
      const safeUpdatedCategories = updatedActiveCategories.slice(0, 10);
      return [...otherCategories, ...safeUpdatedCategories];
    });

    // ログイン中かつクラウドグループなら、データベースも更新
    if (user && activeGroup !== 'local') {
      try {
        // 全カテゴリをループして更新（本来は変更されたものだけが理想ですが、まずは一括対応）
        for (const cat of updatedActiveCategories) {
          // cat.id がDBのUUID形式であることを想定
          await db.updateCategory(cat.id, { name: cat.name });
        }
      } catch (error) {
        await handleCloudMutationFailure({
          error,
          logMessage: 'Category update error:',
          alertMessage: 'カテゴリ更新の保存に失敗しました。画面をクラウドの最新状態に戻しました。',
          rollback: () => setCategories(previousCategories),
        });
      }
    }
  };

  // 新規・編集の保存ボタンが押された時（今のグループに紐付ける）
  const handleSaveLink = async (data) => {
    // 1. 重複チェック（保存先グループ内）
    const targetGroupLinks = links.filter(link => (link.group_id || link.groupId || 'local') === data.groupId);
    const isDuplicate = targetGroupLinks.some(link =>
      link.url === data.url && link.id !== (selectedLink?.id || null)
    );
    if (isDuplicate && !window.confirm('このURLは既に登録されています。重複して登録しますか？')) return;

    const isEditing = !!(selectedLink && selectedLink.id);

    // ★重要：data.groupId が 'local' なら、ログイン状態に関わらず 100% ローカル処理
    // または 未ログインなら強制的にローカル処理
    if (!user || data.groupId === 'local') {
      if (isEditing) {
        // ローカル更新
        setLinks(prev => prev.map(l => 
          l.id === selectedLink.id ? { ...data, id: selectedLink.id, groupId: data.groupId, categoryId: data.categoryId, isCloud: false } : l
        ));
      } else {
        // ローカル新規
        const newLink = { 
          ...data, 
          id: `local_link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
          createdAt: new Date().toISOString(), 
          groupId: data.groupId, 
          categoryId: data.categoryId,
          isCloud: false 
        };
        setLinks(prev => [...prev, newLink]);
      }
    } 
    // ★それ以外（UUID形式のグループID）かつ ログイン中ならクラウド処理
    else if (user) {
      try {
        if (isEditing) {
          const updated = await db.updateLink(selectedLink.id, {
            title: data.title || '',
            url: data.url || '',
            shortMemo: data.shortMemo || '',
            detailMemo: data.detailMemo || '',
            browser: data.browser || '',
            order: data.order || 10,
            tags: data.tags || [],
            isFavorite: !!data.isFavorite,
            isHighlighted: !!data.isHighlighted,
            group_id: data.groupId, 
            category_id: data.categoryId // カテゴリ変更用
          });
          setLinks(prev => prev.map(l => l.id === selectedLink.id ? { ...updated, isCloud: true } : l));
        } else {
          const newLink = await db.insertLink({
            title: data.title || '',
            url: data.url || '',
            shortMemo: data.shortMemo || '',
            detailMemo: data.detailMemo || '',
            browser: data.browser || '',
            order: data.order || 10,
            tags: data.tags || [],
            isFavorite: !!data.isFavorite,
            isHighlighted: !!data.isHighlighted,
            group_id: data.groupId,
            category_id: data.categoryId
          });
          setLinks(prev => [...prev, { ...newLink, isCloud: true }]);
        }
      } catch (error) {
        console.error("Cloud save error:", error);
        alert("クラウドへの保存に失敗しました。ID形式が正しくない可能性があります。");
        return;
      }
    }

    setIsFormOpen(false);
    setSelectedLink(null);
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('このリンクを削除してもよろしいですか？')) return;

    if (user && activeGroup !== 'local') {
      try {
        await db.deleteLink(id);
        setLinks(prev => prev.filter(l => l.id !== id));
      } catch {
        alert("クラウドからの削除に失敗しました。");
      }
    } else {
      // ローカル削除
      setLinks(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleEditClick = (link) => {
    setSelectedLink(link);
    setIsFormOpen(true);
  };

  const handleDetailClick = (link) => {
    setSelectedLink(link);
    setIsDetailOpen(true);
  };

  // ★検索フィルタの対象を「activeGroupLinks」に変更
  const filteredLinks = activeGroupLinks.filter(link => {
    const query = searchQuery.toLowerCase();
    const matchText =
      link.title.toLowerCase().includes(query) ||
      (link.shortMemo || "").toLowerCase().includes(query) ||
      (link.tags && link.tags.some(tag => tag.toLowerCase().includes(query)));

    const matchTags = selectedSearchTags.length === 0 ||
      selectedSearchTags.every(selectedTag => link.tags && link.tags.includes(selectedTag));

    return matchText && matchTags;
  });

  const favoriteLinks = filteredLinks.filter(link => link.isFavorite);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Link Master</h1>
        <div className="header-actions">
          {/* 文字を辞書対応 */}
          <button className="menu-btn" onClick={() => setIsMenuOpen(true)} style={{ position: 'relative' }}>
            <span className="hide-on-mobile">{t('settings')}</span>
            <span className="show-on-mobile">⚙️</span>
            {user && <span className="online-badge" title="ログイン中"></span>}
          </button>
          <button className="add-btn" onClick={() => { setSelectedLink(null); setIsFormOpen(true); }}>
            <span className="hide-on-mobile">＋ {t('addLink')}</span>
            <span className="show-on-mobile">＋</span>
          </button>
          {/* ダークモード切替ボタン */}
          <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {/* 言語切替ボタン */}
          <button className="icon-btn" onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}>
            {language === 'ja' ? 'JA/EN' : 'EN/JA'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* =========================================
            コントロールバー（グループタブ ＆ 検索ボタン）
            ========================================= */}
        <div className="control-bar">
          <div className="group-tabs">
            {/* groups ステートから自動でタブを生成 */}
            {groups.map((group, index) => (
              <button
                key={group.id}
                className={`tab-btn ${activeGroup === group.id ? 'active' : ''} ${draggedGroupIndex === index ? 'dragging' : ''}`}
                onClick={() => setActiveGroup(group.id)}
                draggable
                onDragStart={(e) => handleGroupDragStart(e, index)}
                onDragOver={handleGroupDragOver}
                onDrop={(e) => handleGroupDrop(e, index)}
                onDragEnd={handleGroupDragEnd}
                style={{ opacity: draggedGroupIndex === index ? 0.5 : 1 }}
              >
                {group.id === 'local' ? t('localGroup') : group.name}
              </button>
            ))}
          </div>

          <button
            className={`search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title={t('search')}
          >
            🔍
          </button>
        </div>

        {/* =========================================
            検索パネル（ボタンを押すと展開されるエリア）
            ========================================= */}
        {isSearchOpen && (
          <div className="search-panel">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input full-width"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}>×</button>
              )}
            </div>

            <div className="tag-filter-area">
              <span className="tag-filter-label">{t('presetTagSearch')}</span>
              <div className="tag-list">
                {(COMMON_TAGS[language] || COMMON_TAGS.ja).map(tag => (
                  <button
                    key={tag}
                    className={`filter-tag-btn ${selectedSearchTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleSearchTag(tag)}
                  >
                    # {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {favoriteLinks.length > 0 && (
          <section className="category-section favorite-section">
            <h2 className="category-title">{t('favorites')}</h2>
            <div className="link-grid">
              {favoriteLinks.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onDetailClick={handleDetailClick}
                  onEditClick={() => handleEditClick(link)}
                  onDeleteClick={() => handleDeleteLink(link.id)}
                />
              ))}
            </div>
          </section>
        )}

        {categories.sort((a, b) => a.order - b.order).map(category => {
          // link.category_id (クラウド) と link.categoryId (ローカル) の両方に対応
          const categoryLinks = filteredLinks
            .filter(link => (link.category_id || link.categoryId) === category.id)
            .sort((a, b) => Number(a.order || a.order_index || 0) - Number(b.order || b.order_index || 0));

          if (categoryLinks.length === 0) return null;

          const isOpen = !closedCategories.includes(category.id);

          return (
            <section key={category.id} className="category-section">
              {/* ★タイトルをクリック可能にし、アイコンと件数を表示 */}
              <h2
                className={`category-title accordion-header ${isOpen ? 'is-open' : ''}`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="arrow">{isOpen ? '▼' : '▶'}</span>
                {category.name}
                <span className="count">({categoryLinks.length})</span>
              </h2>

              {/* ★isOpen が true の時だけリストを表示 */}
              {isOpen && (
                <div className="link-grid">
                  {categoryLinks.map(link => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onDetailClick={handleDetailClick}
                      onEditClick={() => handleEditClick(link)}
                      onDeleteClick={() => handleDeleteLink(link.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          
          <span className="copyright">
            &copy; {new Date().getFullYear()} Umeki / LinkMaster. All rights reserved.
          </span>
        </div>
      </footer>

      {/* 詳細メモ用モーダル */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="詳細メモ">
        {selectedLink && (
          <div className="detail-memo-content">
            {/* detail_memo (クラウド) と detailMemo (ローカル) の両方に対応 */}
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {selectedLink.detail_memo || selectedLink.detailMemo}
            </p>
          </div>
        )}
      </Modal>

      {/* 登録・編集用モーダル */}
      <Modal
        key={`form-${isFormOpen ? (selectedLink?.id ?? `new-${activeGroup}`) : 'closed'}`}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedLink ? "リンクを編集" : "新規リンク登録"}
        contentClassName="menu-modal-content"
      >
        <LinkFormModal
          onSubmit={handleSaveLink}
          initialData={selectedLink}
          allCategories={categories}
          groups={groups}
          activeGroup={activeGroup}
        />
      </Modal>

      {/* メニュー用モーダル */}
      <Modal
        key={`menu-${isMenuOpen ? activeGroup : 'closed'}`}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="システムメニュー"
        contentClassName="menu-modal-content"
      >
        <MenuModal
          links={links}
          onImport={handleImportData}
          categories={activeGroupCategories}       // カテゴリデータを渡す
          setCategories={handleUpdateCategories} // 更新用の関数を渡す
          groups={groups}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          onAddGroup={handleAddGroup}
          onUpdateGroupName={handleUpdateGroupName}
          onDeleteGroup={handleDeleteGroup}
          onCopyGroup={handleCopyGroup}
          onMoveGroupUp={handleMoveGroupUp}
          onMoveGroupDown={handleMoveGroupDown}
          onSetMainGroup={handleSetMainGroup}
          onBackupLocalToCloud={handleBackupLocalToCloud}
          onRestoreCloudToLocal={handleRestoreCloudToLocal}
        />
      </Modal>
    </div>
  );
}

export default App;
