import { createI18n } from 'vue-i18n'

// Export all locales individually for direct access
export { default as en } from './locales/default/en.json'
export { default as fr } from './locales/default/fr.json'
export { default as jp } from './locales/default/jp.json'
export { default as pt } from './locales/default/pt.json'
export { default as de } from './locales/default/de.json'
export { default as dprod } from './locales/default/dprod.json'

// Export the messages object for vue-i18n initialization
export const messages = {
    en: require('./locales/default/en.json'),
    fr: require('./locales/default/fr.json'),
    pt: require('./locales/default/pt.json'),
    jp: require('./locales/default/jp.json'),
    de: require('./locales/default/de.json'),
    dprod: require('./locales/default/dprod.json'),
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
    messages?: Record<LocaleKey, Record<string, string>>
    formatFallbackMessages?: boolean
}) => {
    return createI18n({
        locale: options?.locale || fallbackLocale,
        fallbackLocale: options?.fallbackLocale || fallbackLocale,
        messages: options?.messages || messages,
        legacy: options?.legacy ?? false,
        globalInjection: options?.globalInjection ?? true,
        formatFallbackMessages: options?.formatFallbackMessages ?? false,
    })
}

// Export default instance
export default createI18nInstance()
