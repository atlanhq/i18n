import fs from 'fs'
import path from 'path'

// Import the translateTextBatch function from the existing translation script
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const BASE_DIRECTORY = process.env.BASE_DIRECTORY
const ARTIFACT_PATH = process.env.ARTIFACT_PATH

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const configuration = {
    apiKey: OPENAI_API_KEY,
}

/**
 * Translate text in batches using the OpenAI API.
 * This is copied from translationScript.mjs to avoid import issues
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
                temperature: 0.3,
                response_format: { type: 'json_object' },
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
 * Load existing locale files
 */
async function loadLocales() {
    console.log('Loading existing locale files...')
    const locales = {}
    const localeDir = path.join(BASE_DIRECTORY, 'src/locales/default')
    
    try {
        const files = fs.readdirSync(localeDir)
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const language = path.basename(file, '.json')
                const filePath = path.join(localeDir, file)
                
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf-8')
                    locales[language] = JSON.parse(fileContent)
                    console.log(
                        `Loaded ${language}.json with ${Object.keys(locales[language]).length} keys`
                    )
                } catch (parseError) {
                    console.error(
                        `Error parsing ${filePath}: ${parseError.message}`
                    )
                    locales[language] = {}
                }
            }
        }
    } catch (error) {
        console.error(`Error reading locale directory: ${error.message}`)
    }
    
    return locales
}

/**
 * Process the artifact and translate strings
 */
async function processArtifact() {
    console.log('Starting artifact translation process...')

    if (!OPENAI_API_KEY) {
        console.error(
            'OPENAI_API_KEY environment variable is not set. Translations will not be performed.'
        )
        process.exit(1)
    }

    if (!ARTIFACT_PATH) {
        console.error(
            'ARTIFACT_PATH environment variable is not set.'
        )
        process.exit(1)
    }

    // Read the artifact file
    console.log(`Reading artifact from: ${ARTIFACT_PATH}`)
    let artifactData
    try {
        let actualPath = ARTIFACT_PATH

        // Check if the path is a directory, and if so, look for the JSON file inside
        if (fs.statSync(ARTIFACT_PATH).isDirectory()) {
            const files = fs.readdirSync(ARTIFACT_PATH)
            const jsonFile = files.find(file => file.endsWith('.json'))
            if (jsonFile) {
                actualPath = path.join(ARTIFACT_PATH, jsonFile)
                console.log(`Found JSON file in directory: ${actualPath}`)
            } else {
                console.error('No JSON file found in artifact directory')
                process.exit(1)
            }
        }

        const artifactContent = fs.readFileSync(actualPath, 'utf-8')
        artifactData = JSON.parse(artifactContent)
    } catch (error) {
        console.error(`Error reading artifact file: ${error.message}`)
        process.exit(1)
    }

    // Extract labels array
    if (!artifactData.labels || !Array.isArray(artifactData.labels)) {
        console.error('Artifact does not contain a valid "labels" array')
        process.exit(1)
    }

    const labels = artifactData.labels
    console.log(`Found ${labels.length} labels to translate`)

    if (labels.length === 0) {
        console.log('No labels to translate. Exiting.')
        return
    }

    // Load existing locales
    const locales = await loadLocales()
    
    // Get target languages (exclude English as it's the source)
    const targetLanguages = Object.keys(locales).filter(lang => lang !== 'en')
    
    if (targetLanguages.length === 0) {
        console.log('No target languages found. Exiting.')
        return
    }

    console.log(`Target languages: ${targetLanguages.join(', ')}`)

    // Process translations for each language
    for (const language of targetLanguages) {
        console.log(`\nTranslating to ${language}...`)
        
        const batchSize = 20
        const translatedLabels = []
        
        // Process in batches of 20
        for (let i = 0; i < labels.length; i += batchSize) {
            const batch = labels.slice(i, i + batchSize)
            console.log(
                `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(labels.length / batchSize)} (${batch.length} items)`
            )
            
            try {
                const translations = await translateTextBatch(batch, language)
                translatedLabels.push(...translations)
                
                // Add a small delay between batches to be respectful to the API
                if (i + batchSize < labels.length) {
                    console.log('Waiting 2 seconds before next batch...')
                    await new Promise(resolve => setTimeout(resolve, 2000))
                }
            } catch (error) {
                console.error(`Error translating batch: ${error.message}`)
                // Use original labels as fallback
                translatedLabels.push(...batch)
            }
        }

        // Create key-value pairs for the translations
        const translationEntries = {}
        labels.forEach((label, index) => {
            // Create a more robust key from the label
            let key = label
                .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
                .trim()
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .toLowerCase()

            // Ensure key is not empty and handle duplicates
            if (!key) {
                key = `label_${index}`
            }

            // Handle duplicate keys by appending index
            let finalKey = key
            let counter = 1
            while (translationEntries[finalKey] !== undefined) {
                finalKey = `${key}_${counter}`
                counter++
            }

            translationEntries[finalKey] = translatedLabels[index] || label
        })

        // Update the locale file
        const updatedLocale = {
            ...locales[language],
            ...translationEntries
        }

        // Write the updated locale file
        const localeFilePath = path.join(BASE_DIRECTORY, 'src/locales/default', `${language}.json`)
        fs.writeFileSync(
            localeFilePath,
            JSON.stringify(updatedLocale, null, 4)
        )

        console.log(`Updated ${language}.json with ${Object.keys(translationEntries).length} new translations`)
    }

    console.log('\nArtifact translation process complete!')
}

// Run the process
processArtifact().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
