// src/contexts/SettingsContext.jsx
import React, { useState, useEffect } from 'react';
import { LANGUAGES } from '../constants/languages';
import { SettingsContext } from './settings-context';
import { readStoredJson, readStoredString } from '../lib/storageRecovery';

const isSupportedLanguage = (value) => Object.prototype.hasOwnProperty.call(LANGUAGES, value);

export const SettingsProvider = ({ children }) => {
  // 1. 言語設定 (前回選んだ言語をブラウザに記憶。初回は日本語)
  const [language, setLanguage] = useState(() => {
    return readStoredString('u1344_language', 'ja', isSupportedLanguage);
  });

  // 2. ダークモード設定 (前回選んだ状態を記憶。初回はダークモードON)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return readStoredJson('u1344_dark_mode', true, (value) => typeof value === 'boolean');
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
