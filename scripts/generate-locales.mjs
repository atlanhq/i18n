import { readdirSync, writeFileSync, mkdirSync, unlinkSync, renameSync, existsSync, statSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'tsup'

// Get absolute paths for better reliability
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// Configuration
const CONFIG = {
  localesDir: join(projectRoot, 'src/locales/default'),
  distDir: join(projectRoot, 'dist'),
}

function logWarn(message, ...args) {
  console.warn(`⚠️ ${message}`, ...args)
}

function logError(message, ...args) {
  console.error(`❌ ${message}`, ...args)
}


/**
 * Validate that required directories exist
 */
function validateDirectories() {
  if (!existsSync(CONFIG.localesDir)) {
    throw new Error(`Locales directory does not exist: ${CONFIG.localesDir}`)
  }
  
  if (!statSync(CONFIG.localesDir).isDirectory()) {
    throw new Error(`Locales path is not a directory: ${CONFIG.localesDir}`)
  }
  
  // Directory validation passed
}

/**
 * Get all language files from the locales directory with validation
 */
function getLanguageFiles() {
  try {
    const files = readdirSync(CONFIG.localesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .sort() // Sort for consistent output
    
    if (files.length === 0) {
      throw new Error(`No JSON language files found in ${CONFIG.localesDir}`)
    }
    
    console.log(`Found ${files.length} language files: ${files.join(', ')}`)
    return files
  } catch (error) {
    logError(`Failed to read locales directory: ${error.message}`)
    throw error
  }
}

/**
 * Create TypeScript entry files for each language with validation
 */
function createEntryFiles(languageFiles) {
  for (const lang of languageFiles) {
    try {
      const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
      const jsonFile = join(CONFIG.localesDir, `${lang}.json`)
      
      // Validate that the JSON file exists
      if (!existsSync(jsonFile)) {
        throw new Error(`JSON file does not exist: ${jsonFile}`)
      }
      
      const content = `import ${lang} from './${lang}.json';\nexport default ${lang};`
      writeFileSync(entryFile, content)
    } catch (error) {
      logError(`Failed to create entry file for ${lang}: ${error.message}`)
      throw error
    }
  }
}

/**
 * Build individual language files using tsup config with enhanced error handling
 */
async function buildLanguageFiles(languageFiles) {
  try {
    // Import and use tsup programmatically
    const { build } = await import('tsup')
    
    // Build each language individually to get proper folder structure
    for (const lang of languageFiles) {
      const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
      const langDir = join(CONFIG.distDir, lang)
      
      // Validate entry file exists
      if (!existsSync(entryFile)) {
        throw new Error(`Entry file does not exist: ${entryFile}`)
      }
      
      // Ensure language directory exists
      mkdirSync(langDir, { recursive: true })
      
      // Create tsup config for this language
      const tsupConfig = defineConfig({
        entry: [entryFile],
        format: ['cjs', 'esm'],
        dts: true,
        clean: false,
        splitting: false,
        sourcemap: false,
        minify: false,
        outDir: langDir,
        outExtension: ({ format }) => ({
          js: format === 'cjs' ? '.js' : '.mjs',
          dts: format === 'cjs' ? '.d.ts' : '.d.mts'
        }),
        configFile: false // Don't use the main tsup config
      })
      
      try {
        await build(tsupConfig)
        
        // Rename files to index format with validation
        const filesToRename = [
          { from: `${lang}.js`, to: 'index.js' },
          { from: `${lang}.mjs`, to: 'index.mjs' },
          { from: `${lang}.d.ts`, to: 'index.d.ts' },
          { from: `${lang}.d.mts`, to: 'index.d.mts' }
        ]
        
        for (const file of filesToRename) {
          const fromPath = join(langDir, file.from)
          const toPath = join(langDir, file.to)
          
          if (existsSync(fromPath)) {
            renameSync(fromPath, toPath)
          }
        }
        
        console.log(`✅ Built ${lang}`)
      } catch (error) {
        logError(`Error building ${lang}: ${error.message}`)
        throw error
      }
    }
  } catch (error) {
    logError(`Failed to build language files: ${error.message}`)
    throw error
  }
}

/**
 * Clean up temporary TypeScript files and duplicate files with enhanced error handling
 */
function cleanupEntryFiles(languageFiles) {
  for (const lang of languageFiles) {
    // Remove temporary TypeScript entry files
    const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
    try {
      if (existsSync(entryFile)) {
        unlinkSync(entryFile)
      }
    } catch (error) {
      logWarn(`Could not remove entry file: ${entryFile} - ${error.message}`)
    }
    
    // Remove duplicate files from root dist directory
    const duplicateFiles = [
      join(CONFIG.distDir, `${lang}.js`),
      join(CONFIG.distDir, `${lang}.mjs`),
      join(CONFIG.distDir, `${lang}.d.ts`),
      join(CONFIG.distDir, `${lang}.d.mts`)
    ]
    
    for (const file of duplicateFiles) {
      try {
        if (existsSync(file)) {
          unlinkSync(file)
        }
      } catch (error) {
        logWarn(`Could not remove duplicate file: ${file} - ${error.message}`)
      }
    }
  }
}

/**
 * Main execution with comprehensive error handling
 */
async function main() {
  console.log('🌍 Building individual language files...')
  
  const startTime = Date.now()
  let languageFiles = []
  
  try {
    // Step 0: Validate directories
    validateDirectories()
    
    // Step 1: Get language files
    languageFiles = getLanguageFiles()
    
    // Step 2: Create TypeScript entry files
    createEntryFiles(languageFiles)
    
    // Step 3: Build with tsup config
    await buildLanguageFiles(languageFiles)
    
    // Step 4: Clean up temporary files
    cleanupEntryFiles(languageFiles)
    
    const duration = Date.now() - startTime
    console.log(`🎉 Successfully built ${languageFiles.length} languages in ${duration}ms`)
    
  } catch (error) {
    logError(`Error building language files: ${error.message}`)
    
    // Attempt cleanup on error
    if (languageFiles.length > 0) {
      try {
        cleanupEntryFiles(languageFiles)
      } catch (cleanupError) {
        logWarn(`Cleanup failed: ${cleanupError.message}`)
      }
    }
    
    process.exit(1)
  }
}

// Run the script with error handling
main().catch(error => {
  logError(`Unhandled error: ${error.message}`)
  process.exit(1)
})
