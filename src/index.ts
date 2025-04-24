import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Export all locales individually for direct access
export { default as en } from './locales/en.json';
export { default as es } from './locales/es.json';
export { default as fr } from './locales/fr.json';
export { default as de } from './locales/de.json';
export { default as ja } from './locales/ja.json';
export { default as ko } from './locales/ko.json';
export { default as zh } from './locales/zh.json';

// Export the resources object for i18next initialization
export const resources = {
  en: { translation: require('./locales/en.json') },
  es: { translation: require('./locales/es.json') },
  fr: { translation: require('./locales/fr.json') },
  de: { translation: require('./locales/de.json') },
  ja: { translation: require('./locales/ja.json') },
  ko: { translation: require('./locales/ko.json') },
  zh: { translation: require('./locales/zh.json') },
} as const;

export type LocaleKey = keyof typeof resources;

// Export configuration constants
export const defaultNS = 'translation';
export const fallbackLng = 'en';

// Export a helper to initialize i18next with our configuration
export const initI18n = (options?: {
  lng?: LocaleKey;
  debug?: boolean;
  interpolation?: Record<string, unknown>;
}) => {
  return i18n.use(initReactI18next).init({
    resources,
    lng: options?.lng || fallbackLng,
    fallbackLng,
    defaultNS,
    debug: options?.debug || false,
    interpolation: {
      escapeValue: false,
      ...options?.interpolation,
    },
  });
};

// Export the i18n instance as default
export default i18n;
