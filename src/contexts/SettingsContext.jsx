// src/contexts/SettingsContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { LANGUAGES } from '../constants/languages';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // 1. 言語設定 (前回選んだ言語をブラウザに記憶。初回は日本語)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('u1344_language') || 'ja';
  });

  // 2. ダークモード設定 (前回選んだ状態を記憶。初回はダークモードON)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('u1344_dark_mode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  // 言語が変更されたらブラウザに保存
  useEffect(() => {
    localStorage.setItem('u1344_language', language);
  }, [language]);

  // ダークモードが変更されたらブラウザに保存し、画面全体に 'dark-mode' クラスを付け外しする
  useEffect(() => {
    localStorage.setItem('u1344_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // 辞書から文字を引っ張ってくる関数 `t`
  const t = (key) => {
    return LANGUAGES[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, isDarkMode, setIsDarkMode, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 呼び出し用の便利フック
export const useSettings = () => useContext(SettingsContext);