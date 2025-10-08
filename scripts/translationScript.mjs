import fs from 'fs'
import VueI18NExtract from 'vue-i18n-extract'
import path from 'path'
import { glob } from 'glob'

// Fix: Correct the environment variable name
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const BASE_DIRECTORY = process.env.BASE_DIRECTORY

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const configuration = {
    apiKey: OPENAI_API_KEY,
}

/**
 * Translate text in batches using the OpenAI API.
 * @param {string[]} texts - The texts to translate.
 * @param {string} targetLanguage - The desired target language.
 * @returns {Promise<string[]>} - Translated texts.
 */
async function translateTextBatch(texts, targetLanguage, inputPrompt) {
    console.log(
        `Starting translation batch of ${texts.length} texts to ${targetLanguage}`
    )

    // Improve the prompt to be very explicit about returning JSON
    const prompt =
        inputPrompt ??
        `Translate this array of texts to ${targetLanguage}. 
        IMPORTANT: Your response must be ONLY a valid JSON array of translated strings, nothing else.
        No introduction, explanation, or formatting outside the JSON array.
        Do not translate any content within curly braces like {name} or {count}.
        Do not translate punctuation.
        This is for a localization file in a Data catalog SaaS product, so adjust the context accordingly.
        If you're unsure about a translation, keep the original text.
        Return exactly the same number of items as in the input array.
        Input array: ${JSON.stringify(texts)}`

    try {
        console.log(
            `Sending translation request to OpenAI API for ${targetLanguage}`
        )
        console.log(`API key present: ${Boolean(configuration.apiKey)}`)

        const response = await fetch(OPENAI_API_URL, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${configuration.apiKey}`,
            },
            method: 'POST',
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3, // Reduced from 1.0 to make responses more deterministic
                response_format: { type: 'json_object' }, // Force JSON output
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(
                `OpenAI API error: ${response.status} ${response.statusText}`
            )
            console.error(`Error details: ${errorText}`)
            throw new Error(
                `OpenAI API error: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()

        if (
            !data.choices ||
            !data.choices[0] ||
            !data.choices[0].message ||
            !data.choices[0].message.content
        ) {
            console.error(
                'Unexpected API response structure:',
                JSON.stringify(data)
            )
            throw new Error('Invalid API response structure')
        }

        const content = data.choices[0].message.content.trim()
        console.log(
            'Raw API response content:',
            content.substring(0, 100) + '...'
        )

        let parsedContent
        try {
            // First try to parse the entire content as JSON
            parsedContent = JSON.parse(content)

            // If parsedContent has a translations array field, use that
            if (
                parsedContent.translations &&
                Array.isArray(parsedContent.translations)
            ) {
                return parsedContent.translations
            }

            // If it's just an array directly, use that
            if (Array.isArray(parsedContent)) {
                return parsedContent
            }

            // Try to find a field that's an array with the right length
            for (const key in parsedContent) {
                if (
                    Array.isArray(parsedContent[key]) &&
                    parsedContent[key].length === texts.length
                ) {
                    return parsedContent[key]
                }
            }

            // If we have an object but no suitable array, convert object values to array
            if (typeof parsedContent === 'object') {
                const values = Object.values(parsedContent)
                if (values.length === texts.length) {
                    return values
                }
            }

            console.error(
                'Could not find an appropriate translation array in:',
                parsedContent
            )
            throw new Error(
                'Response has valid JSON but not the expected translation array format'
            )
        } catch (parseError) {
            // If JSON parse fails, try to extract a JSON array from the content
            console.error('Error parsing API response:', parseError.message)
            console.log('Trying to extract JSON array from text response...')

            // Look for array-like patterns and try to parse them
            const arrayMatch = content.match(/\[([\s\S]*)\]/)
            if (arrayMatch) {
                try {
                    const extractedArray = JSON.parse(`[${arrayMatch[1]}]`)
                    console.log(
                        `Successfully extracted an array with ${extractedArray.length} items`
                    )
                    return extractedArray
                } catch (e) {
                    console.error('Failed to extract array:', e.message)
                }
            }

            // If all else fails, create a fallback translation array
            console.error('Using original text as fallback')
            return texts
        }
    } catch (error) {
        console.error(`Error in translateTextBatch:`, error)
        // Return original texts as fallback
        return texts
    }
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
    const batchSize = 100 // Reduced from 200 to minimize chances of errors

    console.log(
        `Translating ${keys.length} keys to ${targetLanguage} in batches of ${batchSize}`
    )

    for (let i = 0; i < keys.length; i += batchSize) {
        console.log(
            `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(keys.length / batchSize)}`
        )

        const batch = keys.slice(i, i + batchSize)
        const textsToTranslate = batch
            .map(([, value]) => value)
            .filter((value) => typeof value === 'string')

        console.log(`Batch has ${textsToTranslate.length} strings to translate`)

        try {
            console.log(`Translating batch to ${targetLanguage}...`)
            let translations = await translateTextBatch(
                textsToTranslate,
                targetLanguage
            )

            // Check if we got fewer translations than expected
            if (translations.length < textsToTranslate.length) {
                console.warn(
                    `Got ${translations.length} translations for ${textsToTranslate.length} texts. Retrying...`
                )

                const inputPrompt = `Translate these ${textsToTranslate.length} texts to ${targetLanguage}. 
                VERY IMPORTANT: Your response must contain EXACTLY ${textsToTranslate.length} translated items in a JSON array.
                Do not translate content in {curly braces}. Return only a valid JSON array of strings.
                Input: ${JSON.stringify(textsToTranslate)}`

                translations = await translateTextBatch(
                    textsToTranslate,
                    targetLanguage,
                    inputPrompt
                )

                if (translations.length < textsToTranslate.length) {
                    console.error(
                        `Still got fewer translations (${translations.length}) than source texts (${textsToTranslate.length})`
                    )
                    // Pad the translations array with original values if needed
                    while (translations.length < textsToTranslate.length) {
                        const missingIndex = translations.length
                        translations.push(textsToTranslate[missingIndex])
                    }
                }
            }

            // Assign translations back to keys
            batch.forEach(([key, value], index) => {
                if (typeof value === 'string') {
                    // Find the corresponding index in the filtered textsToTranslate array
                    const translationIndex = textsToTranslate.indexOf(value)
                    if (
                        translationIndex !== -1 &&
                        translations[translationIndex]
                    ) {
                        translatedData[key] = translations[translationIndex]
                    } else {
                        // Fallback to the original value
                        translatedData[key] = value
                    }
                } else {
                    // Non-string values are kept as-is
                    translatedData[key] = value
                }
            })

            console.log(
                `Successfully translated batch ${Math.floor(i / batchSize) + 1}`
            )
        } catch (e) {
            console.error(
                `Error translating batch ${Math.floor(i / batchSize) + 1}:`,
                e
            )

            // Fallback: use original values for this batch
            batch.forEach(([key, value]) => {
                translatedData[key] = value
            })
        }
    }

    console.log(
        `Translation completed for ${targetLanguage}. Keys translated: ${Object.keys(translatedData).length}`
    )
    return translatedData
}

/**
 * Translate a localization JSON file.
 * @param {Record<string, string>} missingEnglishKeys - An object of missing translated keys
 * @param {string} targetLanguage - The desired target language.
 */
async function translateLocalizationJson(missingEnglishKeys, targetLanguage) {
    try {
        console.log(
            `Starting translation of ${Object.keys(missingEnglishKeys).length} keys to ${targetLanguage}`
        )
        return await translateJson(missingEnglishKeys, targetLanguage)
    } catch (error) {
        console.error(`Failed to translate to ${targetLanguage}:`, error)
        return {}
    }
}

async function loadLocales(pattern) {
    console.log(`Loading locale files from ${pattern}`)
    const locales = {}
    const files = await glob(pattern)
    console.log(`Found ${files.length} locale files`)

    for (const filePath of files) {
        const language = path.basename(filePath, '.json')
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            try {
                locales[language] = JSON.parse(fileContent)
                console.log(
                    `Loaded ${language}.json with ${Object.keys(locales[language]).length} keys`
                )
            } catch (parseError) {
                console.error(
                    `Error parsing ${filePath}: ${parseError.message}`
                )
                // Initialize with empty object if parsing fails
                locales[language] = {}
            }
        } catch (readError) {
            console.error(`Error reading ${filePath}: ${readError.message}`)
            locales[language] = {}
        }
    }

    return locales
}

async function synchronizeLocaleFiles(allLocales) {
    console.log(
        'Synchronizing and ordering all locale files with en.json as reference...'
    )

    // English is our reference
    const enLocale = allLocales['en']
    const enKeys = Object.keys(enLocale)
    console.log(`Reference en.json has ${enKeys.length} keys`)

    // Track which keys need translation
    const keysNeedingTranslation = {}

    // Process each non-English locale
    for (const language in allLocales) {
        if (language === 'en' || language === 'dprod') continue

        const localeFile = allLocales[language]
        const orderedLocale = {}
        let existingCount = 0
        let missingCount = 0

        // Add keys in the same order as en.json
        for (const key of enKeys) {
            if (key in localeFile) {
                // Use existing translation
                orderedLocale[key] = localeFile[key]
                existingCount++
            } else {
                // Mark as needing translation (temporarily use English value)
                orderedLocale[key] = enLocale[key]
                missingCount++

                // Track for later translation
                if (!keysNeedingTranslation[language]) {
                    keysNeedingTranslation[language] = []
                }
                keysNeedingTranslation[language].push({
                    path: key,
                    language,
                })
            }
        }

        console.log(
            `${language}.json: kept ${existingCount} translations, identified ${missingCount} missing keys`
        )

        // Write the ordered locale file
        fs.writeFileSync(
            `${BASE_DIRECTORY}/src/locales/default/${language}.json`,
            JSON.stringify(orderedLocale, null, 4)
        )

        // Update in memory
        allLocales[language] = orderedLocale
    }

    console.log('All locale files synchronized and ordered!')
    return keysNeedingTranslation
}

; (async function () {
    console.log('Starting translation script...')

    if (!OPENAI_API_KEY) {
        console.error(
            'OPENAI_API_KEY environment variable is not set. Translations will not be performed.'
        )
        console.log(
            'Please set the OPENAI_API_KEY environment variable and run the script again.'
        )
        process.exit(1)
    }

    console.log('Creating I18N report with vue-i18n-extract...')
    const report = await VueI18NExtract.createI18NReport({
        vueFiles: `./frontend/src/**/*.?(js|vue|ts)`,
        languageFiles: `${BASE_DIRECTORY}/src/locales/default/*.json`,
    })

    console.log('Report created. Processing missing keys...')

    // `vue-i18n-extract` mishandles single quotes within `t` function calls, and double escapes them. As a result
    // they aren't matched to an existing string within the language file, so we manually remove those backslashes
    // and re-filter out entries.
    const allLocales = await loadLocales(`${BASE_DIRECTORY}/src/locales/default/*.json`)

    // First process missing keys from code
    console.log('Processing missing keys from report...')
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

    // Add missing keys to English
    if (missingKeys.en && missingKeys.en.length > 0) {
        console.log(`Adding ${missingKeys.en.length} missing keys to en.json`)
        allLocales['en'] = {
            ...allLocales['en'],
            ...Object.fromEntries(
                missingKeys.en.map(({ path }) => [path, path])
            ),
        }

        // Write updated en.json
        fs.writeFileSync(
            `${BASE_DIRECTORY}/src/locales/default/en.json`,
            JSON.stringify(allLocales['en'], null, 4)
        )
    }

    // Then synchronize all other locale files with en.json
    const keysNeedingTranslation = await synchronizeLocaleFiles(allLocales)

    // Now translate any missing keys in non-English locales
    for (const language in keysNeedingTranslation) {
        if (language === 'dprod') continue
        if (OPENAI_API_KEY && keysNeedingTranslation[language].length > 0) {
            console.log(
                `Translating ${keysNeedingTranslation[language].length} missing keys for ${language}...`
            )

            const missingEnglishKeys = Object.fromEntries(
                keysNeedingTranslation[language].map(({ path }) => [
                    path,
                    allLocales['en'][path],
                ])
            )

            const translatedLabels = await translateLocalizationJson(
                missingEnglishKeys,
                language
            )

            // Update locale file with translations
            const updatedLocale = { ...allLocales[language] }

            // Replace placeholders with translations
            let keysAdded = 0
            for (const key in translatedLabels) {
                if (
                    translatedLabels[key] &&
                    translatedLabels[key] !== missingEnglishKeys[key]
                ) {
                    updatedLocale[key] = translatedLabels[key]
                    keysAdded++
                }
            }

            // Write updated locale file
            fs.writeFileSync(
                `${BASE_DIRECTORY}/src/locales/default/${language}.json`,
                JSON.stringify(updatedLocale, null, 4)
            )

            console.log(
                `Added ${keysAdded} translated keys to ${language}.json`
            )
        }
    }

    console.log('Translation process complete!')
})()
