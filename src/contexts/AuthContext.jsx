// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // ログイン中のユーザー情報
  const [loading, setLoading] = useState(true); // 状態確認中のローディング表示用

  useEffect(() => {
    // 1. 初回起動時に現在のログイン状態を確認
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    // 2. ログインやログアウトの状態変化を監視（自動的に検知）
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // クリーンアップ
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 呼び出し用の便利フック
export const useAuth = () => useContext(AuthContext);