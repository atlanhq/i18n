import { createI18n } from 'vue-i18n'


// Type definitions
export type LocaleKey = 'de' | 'dprod' | 'en' | 'fr' | 'jp' | 'pt'
export interface Message {
  [key: string]: string | Message
}
export type CreateI18nInstanceOptions = {
    locale?: LocaleKey
    fallbackLocale?: LocaleKey
    legacy?: boolean
    globalInjection?: boolean
    messages?: Record<LocaleKey, Message>
    formatFallbackMessages?: boolean
}


// Export all locales individually for direct access
import enData from './locales/default/en.json'
import frData from './locales/default/fr.json'
import jpData from './locales/default/jp.json'
import ptData from './locales/default/pt.json'
import deData from './locales/default/de.json'
import dprodData from './locales/default/dprod.json'

export const en: Message = enData
export const fr: Message = frData
export const jp: Message = jpData
export const pt: Message = ptData
export const de: Message = deData
export const dprod: Message = dprodData

// Export the messages object for vue-i18n initialization
export const messages: Record<LocaleKey, Message> = {
    en,
    fr,
    pt,
    jp,
    de,
    dprod,
} as const

// Export configuration constants
export const fallbackLocale: LocaleKey = 'en'

// Export a helper to initialize vue-i18n with our configuration
export const createI18nInstance = (options?: CreateI18nInstanceOptions) => {
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
