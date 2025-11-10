import { readdirSync, writeFileSync, mkdirSync, unlinkSync, existsSync, statSync, readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'tsup'

// Get absolute paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// Configuration
const CONFIG = {
  localesDir: join(projectRoot, 'src/locales/default'),
  distDir: join(projectRoot, 'dist'),
  langDeclarationTemplate: join(projectRoot, 'src/locale-module.d.ts.template'),
}

// Utility functions
const log = {
  warn: (msg, ...args) => console.warn(`⚠️ ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args),
  success: (msg, ...args) => console.log(`✅ ${msg}`, ...args)
}


/**
 * Get all language files from the locales directory
 */
function getLanguageFiles() {
  // Validate directory exists
  if (!existsSync(CONFIG.localesDir) || !statSync(CONFIG.localesDir).isDirectory()) {
    throw new Error(`Locales directory does not exist: ${CONFIG.localesDir}`)
  }
  
  const files = readdirSync(CONFIG.localesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''))
    .sort()
  
  if (files.length === 0) {
    throw new Error(`No JSON language files found in ${CONFIG.localesDir}`)
  }
  
  console.log(`Found ${files.length} language files: ${files.join(', ')}`)
  return files
}

/**
 * Create TypeScript entry files for each language
 */
function createEntryFiles(languageFiles) {
  languageFiles.forEach(lang => {
    const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
    const jsonFile = join(CONFIG.localesDir, `${lang}.json`)
    
    if (!existsSync(jsonFile)) {
      throw new Error(`JSON file does not exist: ${jsonFile}`)
    }
    
    writeFileSync(entryFile, `import ${lang} from './${lang}.json';\nexport default ${lang};`)
  })
}

/**
 * Copy TypeScript declaration files for individual languages from source template
 */
function generateLanguageDeclarations(languageFiles) {
  if (!existsSync(CONFIG.langDeclarationTemplate)) {
    throw new Error(`Declaration template not found: ${CONFIG.langDeclarationTemplate}`)
  }
  
  const templateContent = readFileSync(CONFIG.langDeclarationTemplate, 'utf8')
  
  languageFiles.forEach(lang => {
    const langDir = join(CONFIG.distDir, lang)
    // Replace {{LANG}} placeholder with actual language code
    const content = templateContent.replace(/\{\{LANG\}\}/g, lang)
    
    writeFileSync(join(langDir, 'index.d.ts'), content)
    
    log.success(`Generated TypeScript declarations for ${lang}`)
  })
}

/**
 * Copy main TypeScript declaration files from source
 */
function copyMainDeclarations() {
  const sourceDtsFile = join(projectRoot, 'src/index.d.ts')
  
  if (!existsSync(sourceDtsFile)) {
    throw new Error('Source declaration file not found: src/index.d.ts')
  }
  
  const content = readFileSync(sourceDtsFile, 'utf8')
  
  writeFileSync(join(CONFIG.distDir, 'index.d.ts'), content)
  writeFileSync(join(CONFIG.distDir, 'index.d.mts'), content)
  
  log.success('Copied main declarations from source')
}

/**
 * Build individual language files using tsup
 */
async function buildLanguageFiles(languageFiles) {
  const { build } = await import('tsup')
  
  // Create all output directories upfront
  languageFiles.forEach(lang => {
    const langDir = join(CONFIG.distDir, lang)
    mkdirSync(langDir, { recursive: true })
  })
  
  // Build all languages in parallel
  const buildPromises = languageFiles.map(async (lang) => {
    const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
    const langDir = join(CONFIG.distDir, lang)
    
    if (!existsSync(entryFile)) {
      throw new Error(`Entry file does not exist: ${entryFile}`)
    }
    
    const tsupConfig = defineConfig({
      entry: {
        index: entryFile
      },
      format: ['cjs', 'esm'],
      dts: false,
      clean: false,
      splitting: false,
      sourcemap: false,
      minify: false,
      outDir: langDir,
      outExtension: ({ format }) => ({
        js: format === 'cjs' ? '.js' : '.mjs'
      }),
      configFile: false
    })
    
    await build(tsupConfig)
    log.success(`Built ${lang}`)
  })
  
  await Promise.all(buildPromises)
}

/**
 * Clean up temporary files
 */
function cleanupFiles(languageFiles) {
  languageFiles.forEach(lang => {
    // Remove temporary TypeScript entry files
    const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
    if (existsSync(entryFile)) {
      unlinkSync(entryFile)
    }
    
    // Remove duplicate files from root dist directory
    const duplicateFiles = [
      join(CONFIG.distDir, `${lang}.js`),
      join(CONFIG.distDir, `${lang}.mjs`)
    ]
    
    duplicateFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file)
      }
    })
  })
}

/**
 * Main execution
 */
async function main() {
  console.log('🌍 Building individual language files...')
  const startTime = Date.now()
  
  let languageFiles = []
  
  try {
    languageFiles = getLanguageFiles()
    
    createEntryFiles(languageFiles)
    await buildLanguageFiles(languageFiles)
    generateLanguageDeclarations(languageFiles)
    copyMainDeclarations()
    
    const duration = Date.now() - startTime
    console.log(`🎉 Successfully built ${languageFiles.length} languages in ${duration}ms`)
    
  } catch (error) {
    log.error(`Build failed: ${error.message}`)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    // Always cleanup temporary files
    if (languageFiles.length > 0) {
      cleanupFiles(languageFiles)
    }
  }
}

// Run the script
main().catch(error => {
  log.error(`Unhandled error: ${error.message}`)
  process.exit(1)
})
