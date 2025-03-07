/**
 * JavaScript Minification Script
 *
 * Processes all JavaScript files in the public-scripts directory,
 * creating minified versions in the public directory.
 *
 * Uses esbuild for fast and efficient minification.
 *
 * Generated by Claude (claude-3.7-sonnet-thinking)
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { colors, formatSize, log, logError, logGroup, logSuccess } from './utils/logger.js'

// Get current directory and relevant paths
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptsDir = path.resolve(__dirname, '../src/public-scripts')
const publicScriptsDir = path.resolve(__dirname, '../public/scripts')

// Statistics tracking
let processedCount = 0
let totalInputSize = 0
let totalOutputSize = 0

/**
 * Get a filename without extension
 * @param {string} filename - File path with extension
 * @returns {string} Filename without extension
 */
function getBaseName(filename) {
  return path.basename(filename, path.extname(filename))
}

/**
 * Compile TypeScript to JavaScript
 * @param {string} inputFile - Source TS file
 * @param {string} outputFile - Target JS file
 * @returns {Promise<{ success: boolean }>} Result status
 */
async function compileTypeScript(inputFile, outputFile) {
  try {
    await build({
      entryPoints: [inputFile],
      outfile: outputFile,
      platform: 'browser',
      format: 'esm',
      target: 'es2020',
      bundle: false,
      minify: false,
      sourcemap: false,
    })

    // Log completion of TypeScript compilation
    log(
      'compile',
      `${colors.yellow}${path.basename(inputFile)}${colors.reset} → ${colors.bold}${path.basename(outputFile)}${colors.reset}`,
    )

    return { success: true }
  } catch (err) {
    logError(`Failed to compile ${path.basename(inputFile)}`, err.message)
    return { success: false }
  }
}

/**
 * Minify a JavaScript file using esbuild
 * @param {string} inputFile - Source JS file path
 * @param {string} outputFile - Output minified file path
 * @returns {Promise<{ success: boolean }>} Result status
 */
async function minifyFile(inputFile, outputFile) {
  try {
    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(outputFile)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Minify the file using esbuild
    await build({
      entryPoints: [inputFile],
      outfile: outputFile,
      platform: 'browser',
      format: 'esm',
      bundle: false,
      minify: true,
      sourcemap: false,
    })

    // Calculate file sizes and savings
    const inputStats = fs.statSync(inputFile)
    const outputStats = fs.statSync(outputFile)
    const inputSize = inputStats.size
    const outputSize = outputStats.size
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1)

    // Update statistics
    totalInputSize += inputSize
    totalOutputSize += outputSize
    processedCount++

    // Report file processing results
    log(
      'minify',
      `${colors.yellow}${path.basename(inputFile)}${colors.reset} → `
      + `${colors.bold}${path.basename(outputFile)}${colors.reset}  ${formatSize(outputSize)} ${colors.dim}|${colors.reset} saved: ${colors.green}${savings}%${colors.reset}`,
    )

    return { success: true }
  } catch (err) {
    logError(`Failed to minify ${path.basename(inputFile)}`, err.message)
    return { success: false }
  }
}

/**
 * Process TypeScript files, then minify the resulting JS
 * @param {string} inputFile - Source TS file path
 * @param {string} outputFile - Output minified JS file path
 * @returns {Promise<boolean>} Success or failure
 */
async function processTypeScriptFile(inputFile, outputFile) {
  try {
    // First compile TS to JS (intermediate file in the same directory as source)
    const baseName = getBaseName(inputFile)
    const intermediateFile = path.join(path.dirname(inputFile), `${baseName}.js`)

    // Compile TypeScript to JavaScript
    const compileResult = await compileTypeScript(inputFile, intermediateFile)
    if (!compileResult.success) {
      return false
    }

    // Then minify the compiled JS
    const minifyResult = await minifyFile(intermediateFile, outputFile)

    // 删除中间生成的JS文件，不需要保留
    try {
      fs.unlinkSync(intermediateFile)
      log('cleanup', `${colors.dim}Removed intermediate file ${path.basename(intermediateFile)}${colors.reset}`)
    } catch {
      // 删除失败不影响整体流程
      log('cleanup', `${colors.yellow}Warning: Could not remove intermediate file ${path.basename(intermediateFile)}${colors.reset}`)
    }

    return minifyResult.success
  } catch (err) {
    logError(`Failed to process TypeScript file: ${path.basename(inputFile)}`, err.message)
    return false
  }
}

/**
 * Check if a file needs processing based on timestamps
 * @param {string} inputFile - Source file path
 * @param {string} outputFile - Output file path
 * @returns {boolean} True if the file needs processing
 */
function needsProcessing(inputFile, outputFile) {
  // If output doesn't exist, it needs processing
  if (!fs.existsSync(outputFile)) {
    return true
  }

  // Check timestamps - if input is newer, it needs processing
  const inputStats = fs.statSync(inputFile)
  const outputStats = fs.statSync(outputFile)
  return inputStats.mtime > outputStats.mtime
}

/**
 * Process all JavaScript and TypeScript files in the scripts directory
 *
 * @returns {Promise<void>}
 */
async function processScriptsDirectory() {
  const startTime = Date.now()

  // Display the group header
  logGroup('Minifying Public Scripts', 'esbuild')

  // Read all files in the scripts directory
  const files = fs.readdirSync(scriptsDir)

  // Count files to process
  const scriptFiles = files.filter(file =>
    (file.endsWith('.js') || file.endsWith('.ts'))
    && !file.endsWith('.min.js')
    && !file.startsWith('_'),
  )

  if (scriptFiles.length === 0) {
    log('minify', `${colors.yellow}No JavaScript or TypeScript files found to process${colors.reset}`)
    console.log('')
    return
  }

  // Process all valid script files
  for (const file of scriptFiles) {
    const inputFile = path.join(scriptsDir, file)
    const isTypeScript = file.endsWith('.ts')
    const baseName = getBaseName(file)
    const outputFile = path.join(publicScriptsDir, `${baseName}.min.js`)

    // Check if the file needs processing
    if (!needsProcessing(inputFile, outputFile)) {
      log('minify', `${colors.dim}${file}${colors.reset} ${colors.green}✓${colors.reset} up to date`)
      continue
    }

    // Process TypeScript or JavaScript based on extension
    if (isTypeScript) {
      await processTypeScriptFile(inputFile, outputFile)
    } else {
      await minifyFile(inputFile, outputFile)
    }
  }

  // Calculate execution time
  const endTime = Date.now()
  const duration = endTime - startTime

  // Report if no files needed processing
  if (processedCount === 0) {
    logSuccess(`All files are already up to date`)
  } else {
    const savingsPercent = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)
    const savedBytes = totalInputSize - totalOutputSize

    logSuccess(`Processed ${processedCount} files in ${duration}ms (saved ${formatSize(savedBytes)}, ${savingsPercent}%)`)
  }

  // Add blank line after group
  console.log('')
}

// Execute the main function
processScriptsDirectory().catch((err) => {
  logError(`Unhandled exception`, err.stack || err)
  process.exit(1)
})
