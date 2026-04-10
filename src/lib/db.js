import { supabase } from './supabase';

export const db = {
  // ==========================================
  // 1. 全データの一括取得（ログイン時に使用）
  // ==========================================
  async fetchAll() {
    // テーブル名を 'lm_...' に変更しています
    const { data: groups, error: gErr } = await supabase.from('lm_groups').select('*').order('order_index');
    const { data: categories, error: cErr } = await supabase.from('lm_categories').select('*').order('order_index');
    const { data: links, error: lErr } = await supabase.from('lm_links').select('*').order('created_at');

    if (gErr || cErr || lErr) {
      console.error('DB Fetch Error:', { gErr, cErr, lErr });
      throw new Error('クラウドからのデータ取得に失敗しました');
    }

    return { groups, categories, links };
  },

  // ==========================================
  // 2. グループ操作 (lm_groups)
  // ==========================================
  // 引数に is_main を追加
  async insertGroup(name, order_index, is_main = false) {
    const { data, error } = await supabase
      .from('lm_groups')
      .insert([{ name, order_index, is_main }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 更新時も is_main を扱えるように（引数の updates に含まれる想定）
  async updateGroup(id, updates) {
    const { data, error } = await supabase
      .from('lm_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 特定のグループを「メイン」に設定し、他を解除する処理
  // SQLの制約(one_main_group_per_user)があるため、確実に1つにするための関数
  async setMainGroup(groupId) {
    // 1. まず自分の全グループの is_main を false にする
    await supabase.from('lm_groups').update({ is_main: false }).neq('id', groupId);
    // 2. 指定したグループを true にする
    const { data, error } = await supabase
      .from('lm_groups')
      .update({ is_main: true })
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGroup(id) {
    // 1. 紐づいているリンクを削除
    await supabase.from('lm_links').delete().eq('group_id', id);
    // 2. 紐づいているカテゴリを削除
    await supabase.from('lm_categories').delete().eq('group_id', id);
    // 3. グループ本体を削除
    const { error } = await supabase.from('lm_groups').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 3. カテゴリ操作 (lm_categories)
  // ==========================================
  async insertCategory(group_id, name, order_index) {
    const { data, error } = await supabase.from('lm_categories').insert([{ group_id, name, order_index }]).select().single();
    if (error) throw error;
    return data;
  },
  async updateCategory(id, updates) {
    const { data, error } = await supabase.from('lm_categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 4. リンク操作 (lm_links)
  // ==========================================
  // db.js
  async insertLink(linkData) {
    // UI用のフラグ (isCloud) だけ除外して、あとはDBへ直送
    const { isCloud: _, ...dbPayload } = linkData;
    
    const { data, error } = await supabase
      .from('lm_links')
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLink(id, updates) {
    const { isCloud: _, ...dbPayload } = updates;
    const { data, error } = await supabase
      .from('lm_links')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async deleteLink(id) {
    const { error } = await supabase.from('lm_links').delete().eq('id', id);
    if (error) throw error;
  }
};