import { createI18n } from 'vue-i18n'

// Export all locales individually for direct access
export { default as en } from './locales/en/default.json'
export { default as fr } from './locales/fr/default.json'
export { default as jp } from './locales/jp/default.json'
export { default as pt } from './locales/pt/default.json'

// Export the messages object for vue-i18n initialization
export const messages = {
    en: require('./locales/en/default.json'),
    fr: require('./locales/fr/default.json'),
    pt: require('./locales/pt/default.json'),
    jp: require('./locales/jp/default.json'),
} as const

export type LocaleKey = keyof typeof messages

// Export configuration constants
export const fallbackLocale = 'en'

// Export a helper to initialize vue-i18n with our configuration
export const createI18nInstance = (options?: {
    locale?: LocaleKey
    fallbackLocale?: LocaleKey
    legacy?: boolean
    globalInjection?: boolean
}) => {
    return createI18n({
        locale: options?.locale || fallbackLocale,
        fallbackLocale: options?.fallbackLocale || fallbackLocale,
        messages,
        legacy: options?.legacy ?? false,
        globalInjection: options?.globalInjection ?? true,
    })
}

// Export default instance
export default createI18nInstance()
