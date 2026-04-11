// src/contexts/AuthContext.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // ログイン中のユーザー情報
  const [loading, setLoading] = useState(true); // 状態確認中のローディング表示用

  useEffect(() => {
    let isMounted = true;

    // 1. 初回起動時に現在のログイン状態を確認
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setUser(data.session?.user || null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // 2. ログインやログアウトの状態変化を監視（自動的に検知）
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // クリーンアップ
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
