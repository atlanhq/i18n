import fs from 'fs'
// eslint-disable-next-line import/default
import VueI18NExtract from 'vue-i18n-extract'
import path from 'path'
import { glob } from 'glob'

const OPENAPI_API_KEY = process.env.OPENAPI_API_KEY

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const configuration = {
    apiKey: OPENAPI_API_KEY, // Replace with your OpenAI API key
}

/**
 * Translate text in batches using the OpenAI API.
 * @param {string[]} texts - The texts to translate.
 * @param {string} targetLanguage - The desired target language.
 * @returns {Promise<string[]>} - Translated texts.
 */
async function translateTextBatch(texts, targetLanguage, inputPrompt) {
    const prompt =
        inputPrompt ??
        `Can you translate this array of texts to ${targetLanguage} with just the translation, no other text. Make sure you do not translate the word/number between curly braces,i.e., { }. Also, if it's a punctuation, do not translate it. This is for a localization file in a Data catalog SaaS product, so adjust the context accordingly. Make sure to not miss any values in the translation. If you are not sure about the translation, just leave it as it is. Make sure it's in the same order as the original text. \n\n${JSON.stringify(texts)}`

    const response = await fetch(OPENAI_API_URL, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${configuration.apiKey}`,
        },
        method: 'POST',
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 1,
        }),
    })
    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI API')
    }
    return JSON.parse(data.choices[0].message.content.trim())
}

/**
 * Recursively translate JSON data.
 * @param {Object} data - JSON object to translate.
 * @param {string} targetLanguage - The desired target language.
 * @returns {Promise<Object>} - Translated JSON object.
 */
async function translateJson(data, targetLanguage) {
    const translatedData = {}
    const keys = Object.entries(data)
    const batchSize = 200

    for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)
        const textsToTranslate = batch
            .map(([, value]) => value)
            .filter((value) => typeof value === 'string')

        try {
            let translations = await translateTextBatch(
                textsToTranslate,
                targetLanguage
            )

            if (translations.length < batchSize) {
                const inputPrompt =
                    'Looks like some keys are not being translated or are missing. Please translate them and validate once again'
                translations = await translateTextBatch(
                    textsToTranslate,
                    targetLanguage,
                    inputPrompt
                )
            }

            batch.forEach(([key], index) => {
                translatedData[key] = translations[index] || data[key]
            })
        } catch (e) {
            console.error(`Error translating batch: ${e.message}`)
            return textsToTranslate // fallback to original text on error
        }
    }
    return translatedData
}

/**
 * Translate a localization JSON file.
 * @param {Record<string, string>} missingEnglishKeys - An object of missing translated keys
 * @param {string} targetLanguage - The desired target language.
 */
async function translateLocalizationJson(missingEnglishKeys, targetLanguage) {
    try {
        return await translateJson(missingEnglishKeys, targetLanguage)
    } catch (error) {
        console.error(`Error translating to ${targetLanguage}: ${error.message}`)
        return {}
    }
}

async function loadLocales(pattern) {
    const locales = {}
    const files = await glob(pattern)

    for (const filePath of files) {
        const language = path.basename(filePath, '.json')
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        locales[language] = JSON.parse(fileContent)
    }

    return locales
}

; (async function () {
    const report = await VueI18NExtract.createI18NReport({
        vueFiles: './src/**/*.?(js|vue|ts)',
        languageFiles: './src/locales/**/*.json',
    })

    // `vue-i18n-extract` mishandles single quotes within `t` function calls, and double escapes them. As a result
    // they aren't matched to an existing string within the language file, so we manually remove those backslashes
    // and re-filter out entries.
    const allLocales = await loadLocales('./src/locales/**/*.json')

    const missingKeys = Object.groupBy(
        report.missingKeys
            .map((reportItem) => ({
                path: reportItem.path.replace(/\\'/g, "'"),
                language: reportItem.language,
            }))
            .filter(
                ({ path, language }) =>
                    !Object.keys(allLocales[language]).includes(path)
            ),
        ({ language }) => language
    )

    for (const language in missingKeys) {
        if (language === 'en') {
            fs.writeFileSync(
                './src/locales/en/default.json',
                JSON.stringify(
                    {
                        ...allLocales[language],
                        ...Object.fromEntries(
                            missingKeys.en.map(({ path }) => [path, path])
                        ),
                    },
                    null,
                    4
                )
            )
        } else if (OPENAPI_API_KEY) {
            const translatedLabels = await translateLocalizationJson(
                Object.fromEntries(
                    missingKeys[language].map(({ path }) => [path, path])
                ),

                language
            )

            fs.writeFileSync(
                `./src/locales/${language}/default.json`,
                JSON.stringify(
                    {
                        ...allLocales[language],
                        ...translatedLabels,
                    },
                    null,
                    4
                )
            )
        }
    }
})()

// Translation script will be copied here from atlan-frontend repository
