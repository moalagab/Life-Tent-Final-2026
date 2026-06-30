import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useLanguage() {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';

  const changeLanguage = useCallback((lang: 'ar' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
  }, [currentLanguage, changeLanguage]);

  return {
    t,
    currentLanguage,
    isRTL,
    changeLanguage,
    toggleLanguage,
  };
}
