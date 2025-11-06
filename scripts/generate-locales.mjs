import { readdirSync, writeFileSync, mkdirSync, unlinkSync, renameSync, existsSync, statSync, readFileSync } from 'fs'
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
 * Generate TypeScript declaration files for individual languages
 */
function generateLanguageDeclarations(languageFiles) {
  const declarationTemplate = (lang) => `declare module '@atlanhq/i18n/${lang}' {
  interface Message {
    [key: string]: string | Message
  }
  const langData: Message
  export default langData
}`
  
  languageFiles.forEach(lang => {
    const langDir = join(CONFIG.distDir, lang)
    const content = declarationTemplate(lang)
    
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
  
  for (const lang of languageFiles) {
    const entryFile = join(CONFIG.localesDir, `${lang}.ts`)
    const langDir = join(CONFIG.distDir, lang)
    
    if (!existsSync(entryFile)) {
      throw new Error(`Entry file does not exist: ${entryFile}`)
    }
    
    mkdirSync(langDir, { recursive: true })
    
    const tsupConfig = defineConfig({
      entry: [entryFile],
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
    
    // Rename files to index format
    const filesToRename = [
      { from: `${lang}.js`, to: 'index.js' },
      { from: `${lang}.mjs`, to: 'index.mjs' }
    ]
    
    filesToRename.forEach(({ from, to }) => {
      const fromPath = join(langDir, from)
      const toPath = join(langDir, to)
      if (existsSync(fromPath)) {
        renameSync(fromPath, toPath)
      }
    })
    
    log.success(`Built ${lang}`)
  }
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
  
  try {
    const languageFiles = getLanguageFiles()
    
    createEntryFiles(languageFiles)
    await buildLanguageFiles(languageFiles)
    generateLanguageDeclarations(languageFiles)
    copyMainDeclarations()
    cleanupFiles(languageFiles)
    
    const duration = Date.now() - startTime
    console.log(`🎉 Successfully built ${languageFiles.length} languages in ${duration}ms`)
    
  } catch (error) {
    log.error(`Build failed: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  log.error(`Unhandled error: ${error.message}`)
  process.exit(1)
})
