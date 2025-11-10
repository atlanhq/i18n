import { createI18n } from 'vue-i18n'

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
export declare const en: Message
export declare const fr: Message
export declare const jp: Message
export declare const pt: Message
export declare const de: Message
export declare const dprod: Message

// Messages object for vue-i18n initialization
export declare const messages: {
  readonly [key in LocaleKey]: Message
}

// Fallback locale configuration
export declare const fallbackLocale: LocaleKey

// Helper function to initialize vue-i18n with our configuration
export declare function createI18nInstance(options?: CreateI18nInstanceOptions): ReturnType<typeof createI18n>

// Default i18n instance
declare const _default: ReturnType<typeof createI18n>
export default _default

