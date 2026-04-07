#!/usr/bin/env node

/**
 * Local PR Coverage Report Generator
 *
 * This script generates a code coverage report for changed files in a PR by:
 * 1. Detecting changed files vs. origin/main (or specified base branch)
 * 2. Identifying affected modules from the changed files
 * 3. Running only the relevant module tests locally
 * 4. Generating a coverage report table for the changed files
 *
 * Usage:
 *   node local-pr-coverage.mjs [options]
 *
 * Options:
 *   --base-branch <branch>       Base branch to compare against (default: origin/develop)
 *   --client-modules <modules>   Comma-separated list of client modules to test (e.g., core,shared)
 *   --server-modules <modules>   Comma-separated list of server modules to test (e.g., core,exam)
 *   --skip-tests                 Skip running tests, use existing coverage data
 *   --client-only                Only run client tests
 *   --server-only                Only run server tests
 *   --print                      Print results to console (default: copy to clipboard)
 *   --verbose                    Enable verbose logging
 *   --help                       Show help
 */

import {execSync, execFileSync, spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Configuration
const CLIENT_SRC_PREFIX = 'src/main/webapp/app/';
const CLIENT_TEST_PREFIX = 'src/test/webapp/app/';
const SERVER_SRC_PREFIX = 'src/main/java/de/tum/cit/aet/';
const SERVER_TEST_PREFIX = 'src/test/java/de/tum/cit/aet/';
const VITEST_COVERAGE_SUMMARY = path.join(PROJECT_ROOT, 'build/test-results/vitest/coverage/coverage-summary.json');
const SERVER_COVERAGE_DIR = path.join(PROJECT_ROOT, 'build/reports/jacoco');

// Module name validation pattern - only allow safe characters (alphanumeric, dash, underscore)
const SAFE_MODULE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate and filter module names to prevent shell injection
 */
function validateModuleNames(modules, optionName) {
  const validModules = [];
  for (const module of modules) {
    if (SAFE_MODULE_NAME_PATTERN.test(module)) {
      validModules.push(module);
    } else {
      console.error(`Error: Invalid module name "${module}" in ${optionName}. Module names can only contain letters, numbers, dashes, and underscores.`);
      process.exit(1);
    }
  }
  return validModules;
}

/**
 * Validate branch name to prevent shell injection and invalid refs
 * Allows: alphanumeric, dash, underscore, dot, forward slash (for origin/branch)
 * Disallows: empty, leading dash, shell metacharacters, path traversal, control chars
 */
function validateBranchName(branch) {
  if (!branch || branch.length === 0) {
    console.error('Error: Branch name cannot be empty.');
    process.exit(1);
  }

  if (branch.startsWith('-')) {
    console.error(`Error: Invalid branch name "${branch}". Branch names cannot start with a dash.`);
    process.exit(1);
  }

  // Check for path traversal
  if (branch.includes('..')) {
    console.error(`Error: Invalid branch name "${branch}". Path traversal sequences are not allowed.`);
    process.exit(1);
  }

  // Allow only safe characters: alphanumeric, dash, underscore, dot, forward slash
  const safeBranchPattern = /^[a-zA-Z0-9_.\/-]+$/;
  if (!safeBranchPattern.test(branch)) {
    console.error(`Error: Invalid branch name "${branch}". Branch names can only contain letters, numbers, dashes, underscores, dots, and forward slashes.`);
    process.exit(1);
  }

  // Check for shell metacharacters (extra safety)
  const shellMetaChars = /[;|&<>*?()[\]{}\\!'"` \t\n\r]/;
  if (shellMetaChars.test(branch)) {
    console.error(`Error: Invalid branch name "${branch}". Shell metacharacters are not allowed.`);
    process.exit(1);
  }

  return branch;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    baseBranch: 'origin/main',
    clientModules: [], // Explicitly specified client modules
    serverModules: [], // Explicitly specified server modules
    skipTests: false,
    clientOnly: false,
    serverOnly: false,
    print: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-branch':
        if (i + 1 >= args.length) {
          console.error('Error: --base-branch requires a value');
          process.exit(1);
        }
        options.baseBranch = validateBranchName(args[++i]);
        break;
      case '--client-modules':
        if (i + 1 >= args.length) {
          console.error('Error: --client-modules requires a comma-separated list of modules');
          process.exit(1);
        }
        options.clientModules = validateModuleNames(
          args[++i].split(',').map((m) => m.trim()).filter(Boolean),
          '--client-modules'
        );
        break;
      case '--server-modules':
        if (i + 1 >= args.length) {
          console.error('Error: --server-modules requires a comma-separated list of modules');
          process.exit(1);
        }
        options.serverModules = validateModuleNames(
          args[++i].split(',').map((m) => m.trim()).filter(Boolean),
          '--server-modules'
        );
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--client-only':
        options.clientOnly = true;
        break;
      case '--server-only':
        options.serverOnly = true;
        break;
      case '--print':
        options.print = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        // Only error on unknown options (starting with '-'), not positional values
        if (args[i].startsWith('-')) {
          console.error(`Error: Unknown option '${args[i]}'`);
          console.error('Run with --help to see available options.');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Local PR Coverage Report Generator

Generates a code coverage report for changed files by running tests locally
for only the affected modules. This is faster and more reliable than waiting
for CI builds.

Usage:
  node local-pr-coverage.mjs [options]
  npm run coverage:pr [-- options]

Options:
  --base-branch <branch>       Base branch to compare against (default: origin/develop)
  --client-modules <modules>   Comma-separated list of client modules to test (e.g., core,shared)
  --server-modules <modules>   Comma-separated list of server modules to test (e.g., core,job)
  --skip-tests                 Skip running tests, use existing coverage data
  --client-only                Only run client tests (auto-detected or specified modules)
  --server-only                Only run server tests (auto-detected or specified modules)
  --print                      Print results to console (default: copy to clipboard)
  --verbose                    Enable verbose logging
  --help                       Show this help

Module Selection:
  By default, modules to test are auto-detected from changed files.
  Use --client-modules or --server-modules to override which modules to test.
  The coverage report always shows only the files that changed vs. the base branch.

Available Modules:
  Client: core, shared, application, job, interview, etc.
  Server: core, application, job, interview, etc.

Examples:
  # Auto-detect modules from changed files
  node local-pr-coverage.mjs

  # Test specific client modules only
  npm run coverage:pr -- --client-modules core,shared --client-only

  # Test specific server modules only
  npm run coverage:pr -- --server-modules core,job --server-only

  # Mix: auto-detect client, specify server modules
  npm run coverage:pr -- --server-modules core

  # Skip tests and use existing coverage data
  npm run coverage:pr -- --skip-tests --client-modules core
`);
}

function log(message, options) {
  if (options.verbose) {
    console.log(`[DEBUG] ${message}`);
  }
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

/**
 * Get list of changed files compared to base branch
 */
function getChangedFiles(baseBranch, options) {
  try {
    // Fetch the base branch to ensure we have the latest
    // Strip a single leading 'origin/' if present for the fetch command
    const fetchBranch = baseBranch.startsWith('origin/') ? baseBranch.substring(7) : baseBranch;
    try {
      execFileSync('git', ['fetch', 'origin', fetchBranch], {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
      });
    } catch {
      log(`Could not fetch ${baseBranch}, using local version`, options);
    }

    // Get the merge base using argument array (no shell interpolation)
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', baseBranch], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    log(`Merge base: ${mergeBase}`, options);

    // Get changed files using argument array
    const diffOutput = execFileSync('git', ['diff', '--name-status', `${mergeBase}...HEAD`], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });

    const changes = {};
    for (const line of diffOutput.split('\n').filter(Boolean)) {
      const [status, ...fileParts] = line.split('\t');
      // For renames (R), git outputs "R100\told_path\tnew_path" - take only the new path
      const filePath = status.charAt(0) === 'R' ? fileParts[fileParts.length - 1] : fileParts.join('\t');
      if (filePath) {
        changes[filePath] =
          {
            A: 'added',
            D: 'deleted',
            M: 'modified',
            R: 'renamed',
          }[status.charAt(0)] || 'unknown';
      }
    }

    return changes;
  } catch (err) {
    error(`Failed to get changed files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Filter and categorize changed files into client and server
 */
function categorizeChangedFiles(changedFiles, options) {
  const clientFiles = {};
  const serverFiles = {};
  const clientModules = new Set();
  const serverModules = new Set();

  // Files to exclude from coverage reporting (cannot be properly tested)
  const excludedClientPatterns = ['.module.ts', '.spec.ts', '.routes.ts', '.route.ts', '.model.ts'];
  const excludedClientPrefixes = ['generated/'];
  const excludedClientFiles = ['app.component.ts', 'app.config.ts', 'app.constants.ts', 'app.routes.ts'];

  for (const [filePath, changeType] of Object.entries(changedFiles)) {
    // Client files
    if (filePath.startsWith(CLIENT_SRC_PREFIX) && filePath.endsWith('.ts')) {
      // Skip excluded patterns
      if (excludedClientPatterns.some((pattern) => filePath.endsWith(pattern))) {
        log(`Skipping (excluded pattern): ${filePath}`, options);
        continue;
      }

      const relativePath = filePath.substring(CLIENT_SRC_PREFIX.length);

      // Skip generated files and other excluded prefixes
      if (excludedClientPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
        log(`Skipping (excluded prefix): ${filePath}`, options);
        continue;
      }

      // Skip excluded files
      if (excludedClientFiles.includes(relativePath)) {
        log(`Skipping (excluded file): ${filePath}`, options);
        continue;
      }

      clientFiles[relativePath] = changeType;

      // Extract module name (first directory after app/)
      const moduleName = relativePath.split('/')[0];
      if (moduleName && !relativePath.includes('/')) {
        // File is directly in app/, not in a module
        log(`Client file (root): ${relativePath}`, options);
      } else if (moduleName) {
        clientModules.add(moduleName);
        log(`Client file: ${relativePath} (module: ${moduleName})`, options);
      }
    }
    // Server files
    else if (filePath.startsWith(SERVER_SRC_PREFIX) && filePath.endsWith('.java')) {
      const relativePath = filePath.substring('src/main/java/'.length);
      serverFiles[relativePath] = changeType;

      // Extract module name
      const afterAet = filePath.substring(SERVER_SRC_PREFIX.length);
      const moduleName = afterAet.split('/')[0];
      if (moduleName) {
        serverModules.add(moduleName);
      }

      log(`Server file: ${relativePath} (module: ${moduleName})`, options);
    }
    // Client test files — map back to source file for coverage reporting
    else if (filePath.startsWith(CLIENT_TEST_PREFIX) && filePath.endsWith('.spec.ts')) {
      const relativePath = filePath.substring(CLIENT_TEST_PREFIX.length).replace('.spec.ts', '.ts');

      // Skip if the source file is already tracked
      if (clientFiles[relativePath]) {
        log(`Skipping test (source already tracked): ${filePath}`, options);
        continue;
      }

      // Only include if the corresponding source file exists
      const sourceFile = path.join(PROJECT_ROOT, CLIENT_SRC_PREFIX, relativePath);
      if (fs.existsSync(sourceFile)) {
        clientFiles[relativePath] = changeType;
        const moduleName = relativePath.split('/')[0];
        if (moduleName && relativePath.includes('/')) {
          clientModules.add(moduleName);
        }
        log(`Client test file: ${filePath} → source: ${relativePath} (module: ${moduleName})`, options);
      } else {
        log(`Skipping test (no matching source): ${filePath}`, options);
      }
    }
    // Server test files — map back to source file for coverage reporting
    else if (filePath.startsWith(SERVER_TEST_PREFIX) && filePath.endsWith('Test.java')) {
      const relativePath = filePath.substring('src/test/java/'.length).replace('Test.java', '.java');

      // Skip if the source file is already tracked
      if (serverFiles[relativePath]) {
        log(`Skipping test (source already tracked): ${filePath}`, options);
        continue;
      }

      // Only include if the corresponding source file exists
      const sourceFile = path.join(PROJECT_ROOT, 'src/main/java', relativePath);
      if (fs.existsSync(sourceFile)) {
        serverFiles[relativePath] = changeType;
        const afterAet = relativePath.substring('de/tum/cit/aet/'.length);
        const moduleName = afterAet.split('/')[0];
        if (moduleName) {
          serverModules.add(moduleName);
        }
        log(`Server test file: ${filePath} → source: ${relativePath} (module: ${moduleName})`, options);
      } else {
        log(`Skipping test (no matching source): ${filePath}`, options);
      }
    } else {
      log(`Skipping: ${filePath}`, options);
    }
  }

  return {
    clientFiles,
    serverFiles,
    clientModules: Array.from(clientModules),
    serverModules: Array.from(serverModules),
  };
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Run client tests for specific modules
 */
async function runClientTests(modules, options) {
  if (modules.length === 0) {
    info('No client modules to test');
    return true;
  }

  info(`Running client tests for modules: ${modules.join(', ')}`);
  log(`Running prebuild...`, options);

  // Run prebuild first (separate command, no shell interpolation)
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const prebuildResult = spawnSync(npmCmd, ['run', 'prebuild'], {
      cwd: PROJECT_ROOT,
      stdio: options.verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
    });
    if (prebuildResult.status !== 0) {
      warn('Prebuild failed');
      if (!options.verbose && prebuildResult.stdout) {
        console.log(prebuildResult.stdout);
      }
      if (!options.verbose && prebuildResult.stderr) {
        console.error(prebuildResult.stderr);
      }
      return false;
    }
  } catch (err) {
    warn(`Prebuild failed: ${err.message}`);
    return false;
  }

  let allSuccess = true;

  if (modules.length > 0) {
    log(`Running Vitest for modules: ${modules.join(', ')}`, options);
    try {
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      // Build coverage include patterns for only the modules being tested
      // This prevents measuring coverage for unrelated modules
      const coverageIncludes = modules.map(m => `src/main/webapp/app/${m}/**/*.ts`);
      const vitestArgs = [
        'vitest', 'run', '--coverage',
        // Override coverage.include to only measure the modules being tested
        ...coverageIncludes.map(pattern => `--coverage.include=${pattern}`),
        // Disable global thresholds since we're only testing a subset
        '--coverage.thresholds.lines=0',
        '--coverage.thresholds.statements=0',
        '--coverage.thresholds.branches=0',
        '--coverage.thresholds.functions=0',
        // Filter test files to only run tests for these modules
        ...modules,
      ];
      log(`Running: npx ${vitestArgs.join(' ')}`, options);
      const vitestResult = spawnSync(npxCmd, vitestArgs, {
        cwd: PROJECT_ROOT,
        stdio: options.verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large test outputs
      });
      if (vitestResult.status !== 0) {
        warn(`Vitest exited with code ${vitestResult.status || 1}`);

        // Extract and display failed tests summary
        const allOutput = (vitestResult.stdout || '') + (vitestResult.stderr || '');
        const failedTests = extractVitestFailedTests(allOutput);
        if (failedTests.length > 0) {
          printFailedTestsSummary(failedTests);
        } else if (!options.verbose) {
          // If no failed tests found in output, show raw output
          if (vitestResult.stdout) {
            console.log(vitestResult.stdout);
          }
          if (vitestResult.stderr) {
            console.error(vitestResult.stderr);
          }
        }
        allSuccess = false;
      } else {
        success('Vitest tests completed');
      }
    } catch (err) {
      warn(`Vitest failed: ${err.message}`);
      allSuccess = false;
    }
  }

  return allSuccess;
}

/**
 * Extract failed test names from Gradle output
 */
function extractFailedTests(output) {
  if (!output) return [];
  const failedTests = [];
  const lines = output.split('\n');
  for (const line of lines) {
    // Match patterns like "SomeTest > someMethod() FAILED" or "SomeTest > someMethod(param) FAILED"
    const match = line.match(/^\s*(\S+)\s*>\s*(.+?)\s+FAILED\s*$/);
    if (match) {
      failedTests.push(`${match[1]} > ${match[2]}`);
    }
  }
  return failedTests;
}

/**
 * Extract failed test names from Vitest output
 */
function extractVitestFailedTests(output) {
  if (!output) return [];
  const failedTests = [];
  const lines = output.split('\n');
  let currentFile = null;

  for (const line of lines) {
    // Match "FAIL src/main/webapp/app/..." lines
    const fileMatch = line.match(/FAIL\s+(.+\.spec\.ts)/);
    if (fileMatch) {
      currentFile = fileMatch[1].split('/').pop(); // Get just the filename
      continue;
    }

    // Match "✕ test name" or "× test name" lines (failure indicators)
    const testMatch = line.match(/^\s*[✕×]\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/);
    if (testMatch && currentFile) {
      failedTests.push(`${currentFile} > ${testMatch[1]}`);
    }
  }
  return failedTests;
}

/**
 * Print a summary of failed tests
 */
function printFailedTestsSummary(failedTests) {
  if (failedTests.length === 0) return;

  console.log('\n' + '─'.repeat(60));
  error(`${failedTests.length} test(s) failed:`);
  console.log('');
  for (const test of failedTests.slice(0, 20)) { // Limit to first 20
    console.log(`  ❌ ${test}`);
  }
  if (failedTests.length > 20) {
    console.log(`  ... and ${failedTests.length - 20} more`);
  }
  console.log('─'.repeat(60) + '\n');
}

/**
 * Run server tests for specific modules
 */
async function runServerTests(modules, options) {
  if (modules.length === 0) {
    info('No server modules to test');
    return true;
  }

  info(`Running server tests for modules: ${modules.join(', ')}`);

  // Select Gradle wrapper based on platform
  const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const modulesArg = modules.join(',');

  log(`Running: ${gradleWrapper} test -DincludeModules=${modulesArg} jacocoTestReport -x webapp`, options);

  try {
    // Use spawnSync with argument array for safety
    // maxBuffer is set to 50MB to handle large test outputs (default is 1MB which can cause the process to be killed)
    const gradleResult = spawnSync(gradleWrapper, [
      'test',
      `-DincludeModules=${modulesArg}`,
      'jacocoTestReport',
      '-x', 'webapp'
    ], {
      cwd: PROJECT_ROOT,
      stdio: options.verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
      shell: process.platform === 'win32', // Windows needs shell for .bat files
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large test outputs
    });
    if (gradleResult.status !== 0) {
      warn(`Server tests exited with code ${gradleResult.status || 1}`);

      // Extract and display failed tests summary
      const allOutput = (gradleResult.stdout || '') + (gradleResult.stderr || '');
      const failedTests = extractFailedTests(allOutput);
      if (failedTests.length > 0) {
        printFailedTestsSummary(failedTests);
      } else if (!options.verbose) {
        // If no failed tests found in output, show raw output
        if (gradleResult.stdout) {
          console.log(gradleResult.stdout);
        }
        if (gradleResult.stderr) {
          console.error(gradleResult.stderr);
        }
      }
      return false;
    }
    success('Server tests completed');
    return true;
  } catch (err) {
    warn(`Server tests failed: ${err.message}`);
    return false;
  }
}

/**
 * Look up coverage for a file in a coverage summary
 */
function lookupCoverageInSummary(fullPath, coverageSummary) {
  if (!coverageSummary) {
    return null;
  }

  for (const [coveragePath, metrics] of Object.entries(coverageSummary)) {
    if (coveragePath.endsWith(fullPath) || coveragePath.includes(fullPath)) {
      if (metrics.lines && typeof metrics.lines.pct === 'number') {
        return `${metrics.lines.pct.toFixed(2)}%`;
      }
    }
  }

  return null;
}

/**
 * Get client coverage for a specific file from coverage-summary.json
 */
function getClientFileCoverage(filePath, vitestCoverageSummary = null) {
  // The coverage summary uses full paths from src/main/webapp/
  const fullPath = `src/main/webapp/app/${filePath}`;

  const vitestCoverage = lookupCoverageInSummary(fullPath, vitestCoverageSummary);
  if (vitestCoverage !== null) {
    return vitestCoverage;
  }
}

/**
 * Parse JaCoCo XML report to get coverage for a specific source file.
 * Uses the <sourcefile> element which aggregates coverage across all classes
 * in the file (including inner classes and anonymous classes).
 */
function getServerFileCoverage(filePath, moduleName) {
  // Extract just the filename (e.g., "BuildJobContainerService.java")
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];

  // Use default JaCoCo report path
  const reportPaths = [path.join(SERVER_COVERAGE_DIR, 'test', 'jacocoTestReport.xml')];

  for (const reportPath of reportPaths) {
    if (!fs.existsSync(reportPath)) {
      continue;
    }

    try {
      const xmlContent = fs.readFileSync(reportPath, 'utf-8');

      // Search for <sourcefile name="FileName.java"> element which contains
      // aggregated coverage for the entire source file (all classes within it)
      const sourceFileRegex = new RegExp(`<sourcefile[^>]*name="${escapeRegex(fileName)}"[^>]*>([\\s\\S]*?)</sourcefile>`, 'gi');

      const match = xmlContent.match(sourceFileRegex);
      if (match && match.length > 0) {
        // Use the first (and typically only) sourcefile match
        const sourceFileContent = match[0];

        // Find the sourcefile-level LINE counter (the LAST one, after all line entries)
        const lineCounterRegex = /<counter[^>]*type="LINE"[^>]*\/?>/gi;
        const allLineCounters = sourceFileContent.match(lineCounterRegex);

        if (allLineCounters && allLineCounters.length > 0) {
          // The sourcefile-level counter is the LAST one
          const sourceFileLevelCounter = allLineCounters[allLineCounters.length - 1];

          // Extract missed and covered values
          const missedMatch = sourceFileLevelCounter.match(/missed="(\d+)"/);
          const coveredMatch = sourceFileLevelCounter.match(/covered="(\d+)"/);

          if (missedMatch && coveredMatch) {
            const missed = parseInt(missedMatch[1], 10);
            const covered = parseInt(coveredMatch[1], 10);
            const total = missed + covered;
            if (total > 0) {
              const percentage = (covered / total) * 100;
              return `${percentage.toFixed(2)}%`;
            }
          }
        }
      }
    } catch (err) {
      // Continue to next report
    }
  }

  return null;
}

/**
 * Strip inline block comments from a line (handles multiple inline comment segments)
 */
function stripInlineBlockComments(line) {
  // Iteratively remove all /* ... */ segments on the same line
  let result = line;
  let prevResult;
  do {
    prevResult = result;
    result = result.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
  } while (result !== prevResult);
  return result;
}

/**
 * Get line count of a source file (excluding empty lines and comments)
 */
function getSourceFileLineCount(absolutePath) {
  try {
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n');
    // Count non-empty, non-comment lines
    let count = 0;
    let inBlockComment = false;
    for (const line of lines) {
      let processedLine = line;

      // Handle multi-line block comments
      if (inBlockComment) {
        const endIndex = processedLine.indexOf('*/');
        if (endIndex !== -1) {
          // Block comment ends on this line, keep content after */
          inBlockComment = false;
          processedLine = processedLine.substring(endIndex + 2);
        } else {
          // Still inside block comment, skip entire line
          continue;
        }
      }

      // Check if a multi-line block comment starts on this line
      const startIndex = processedLine.indexOf('/*');
      if (startIndex !== -1) {
        const endIndex = processedLine.indexOf('*/', startIndex + 2);
        if (endIndex === -1) {
          // Block comment starts but doesn't end on this line
          inBlockComment = true;
          processedLine = processedLine.substring(0, startIndex);
        } else {
          // Inline block comment(s) - strip them all
          processedLine = stripInlineBlockComments(processedLine);
        }
      }

      // Strip single-line comments
      const singleLineCommentIndex = processedLine.indexOf('//');
      if (singleLineCommentIndex !== -1) {
        processedLine = processedLine.substring(0, singleLineCommentIndex);
      }

      // Check if there's any code remaining
      const trimmed = processedLine.trim();
      if (trimmed === '' || trimmed === '*') {
        continue;
      }
      count++;
    }
    return count;
  } catch {
    return null;
  }
}

/**
 * Count expect() calls in a client test file
 */
function countClientExpects(sourceFilePath) {
  // Convert source file path to spec file path
  const specFilePath = sourceFilePath.replace('.ts', '.spec.ts');
  const absolutePath = path.join(PROJECT_ROOT, 'src/test/webapp/app', specFilePath);

  try {
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    const content = fs.readFileSync(absolutePath, 'utf-8');
    // Count expect( calls
    const matches = content.match(/expect\s*\(/g);
    return matches ? matches.length : 0;
  } catch {
    return null;
  }
}
/**
 * Build coverage table for client files
 */
function buildClientCoverageTable(clientFiles, options) {
  if (Object.keys(clientFiles).length === 0) {
    return null;
  }

  let vitestCoverageSummary = null;
  if (fs.existsSync(VITEST_COVERAGE_SUMMARY)) {
    try {
      vitestCoverageSummary = JSON.parse(fs.readFileSync(VITEST_COVERAGE_SUMMARY, 'utf-8'));
      log('Loaded Vitest coverage-summary.json', options);
    } catch (err) {
      log(`Failed to parse Vitest coverage data: ${err.message}`, options);
    }
  } else {
    log('Vitest coverage-summary.json not found', options);
  }

  if (!vitestCoverageSummary) {
    return 'Coverage data not found. Run tests first or check if coverage-summary.json exists.';
  }

  const rows = [];
  for (const [filePath, changeType] of Object.entries(clientFiles)) {
    const fileName = filePath.split('/').pop();

    // Skip spec files
    if (fileName.endsWith('.spec.ts')) {
      continue;
    }

    const coverage = getClientFileCoverage(filePath, vitestCoverageSummary);
    const absoluteSourcePath = path.join(PROJECT_ROOT, 'src/main/webapp/app', filePath);
    const lineCount = getSourceFileLineCount(absoluteSourcePath);
    const expectCount = countClientExpects(filePath);

    // Calculate ratio: expects per 100 lines of source code
    let ratio = null;
    if (lineCount && lineCount > 0 && expectCount !== null) {
      ratio = (expectCount / lineCount) * 100;
    }

    rows.push({
      file: fileName,
      coverage: coverage || `not found (${changeType})`,
      lineCount: lineCount !== null ? lineCount : '?',
      expectCount: expectCount !== null ? expectCount : '?',
      ratio: ratio !== null ? ratio.toFixed(1) : '?',
    });
  }

  if (rows.length === 0) {
    return null;
  }

  let table = '| Class/File | Line Coverage | Lines | Expects | Ratio |\n';
  table += '|------------|-------------:|------:|--------:|------:|\n';
  for (const row of rows) {
    table += `| ${row.file} | ${row.coverage} | ${row.lineCount} | ${row.expectCount} | ${row.ratio} |\n`;
  }

  return table;
}

/**
 * Build coverage table for server files
 */
function buildServerCoverageTable(serverFiles) {
  if (Object.keys(serverFiles).length === 0) {
    return null;
  }

  const rows = [];
  for (const [filePath, changeType] of Object.entries(serverFiles)) {
    const fileName = filePath.split('/').pop();

    // Determine which module this file belongs to
    const afterAet = filePath.replace('de/tum/cit/aet/', '');
    const moduleName = afterAet.split('/')[0];

    const coverage = getServerFileCoverage(filePath, moduleName);
    const absoluteSourcePath = path.join(PROJECT_ROOT, 'src/main/java', filePath);
    const lineCount = getSourceFileLineCount(absoluteSourcePath);

    rows.push({
      file: fileName,
      coverage: coverage || `not found (${changeType})`,
      lineCount: lineCount !== null ? lineCount : '?',
    });
  }

  if (rows.length === 0) {
    return null;
  }

  let table = '| Class/File | Line Coverage | Lines |\n';
  table += '|------------|-------------:|------:|\n';
  for (const row of rows) {
    table += `| ${row.file} | ${row.coverage} | ${row.lineCount} |\n`;
  }

  return table;
}

/**
 * Copy text to clipboard (cross-platform)
 */
function copyToClipboard(text) {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      execSync('pbcopy', {input: text});
    } else if (platform === 'linux') {
      try {
        execSync('xclip -selection clipboard', {input: text});
      } catch {
        execSync('xsel --clipboard --input', {input: text});
      }
    } else if (platform === 'win32') {
      execSync('clip', {input: text});
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('\n📊 Local PR Coverage Report Generator\n');

  // Check if modules are explicitly specified for testing
  const hasExplicitClientModules = options.clientModules.length > 0;
  const hasExplicitServerModules = options.serverModules.length > 0;

  // Step 1: Always get changed files (needed for coverage report filtering)
  info(`Comparing against ${options.baseBranch}...`);
  const changedFiles = getChangedFiles(options.baseBranch, options);

  const totalChanges = Object.keys(changedFiles).length;
  if (totalChanges === 0) {
    info('No changed files found');
    process.exit(0);
  }
  info(`Found ${totalChanges} changed files`);

  // Step 2: Categorize changed files
  const categorized = categorizeChangedFiles(changedFiles, options);
  const {clientFiles, serverFiles} = categorized;

  // Modules to test: use explicit if specified, otherwise auto-detected
  let clientModulesToTest = hasExplicitClientModules ? options.clientModules : categorized.clientModules;
  let serverModulesToTest = hasExplicitServerModules ? options.serverModules : categorized.serverModules;

  if (hasExplicitClientModules) {
    info(`Using explicitly specified client modules for testing: ${clientModulesToTest.join(', ')}`);
  }
  if (hasExplicitServerModules) {
    info(`Using explicitly specified server modules for testing: ${serverModulesToTest.join(', ')}`);
  }

  info(`Client: ${Object.keys(clientFiles).length} changed files, testing ${clientModulesToTest.length} modules (${clientModulesToTest.join(', ') || 'none'})`);
  info(`Server: ${Object.keys(serverFiles).length} changed files, testing ${serverModulesToTest.length} modules (${serverModulesToTest.join(', ') || 'none'})`);

  // Step 3: Run tests if not skipped
  if (!options.skipTests) {
    console.log('');

    if (!options.serverOnly && clientModulesToTest.length > 0) {
      const clientSuccess = await runClientTests(clientModulesToTest, options);
      if (!clientSuccess) {
        error('Client tests failed');
        process.exit(1);
      }
    }

    if (!options.clientOnly && serverModulesToTest.length > 0) {
      const serverSuccess = await runServerTests(serverModulesToTest, options);
      if (!serverSuccess) {
        error('Server tests failed');
        process.exit(1);
      }
    }
  } else {
    info('Skipping tests, using existing coverage data');
  }

  // Step 4: Build coverage tables (always based on changed files, not all files in modules)
  console.log('\n📋 Building coverage report...\n');

  let result = '';

  if (!options.serverOnly) {
    const clientTable = buildClientCoverageTable(clientFiles, options);
    if (clientTable) {
      result += `#### Client\n\n${clientTable}\n`;
    }
  }

  if (!options.clientOnly) {
    const serverTable = buildServerCoverageTable(serverFiles);
    if (serverTable) {
      result += `#### Server\n\n${serverTable}\n`;
    }
  }

  if (!result) {
    info('No coverage data to report');
    process.exit(0);
  }

  // Step 5: Output results
  console.log('─'.repeat(60));
  console.log(result);
  console.log('─'.repeat(60));

  if (!options.print) {
    if (copyToClipboard(result)) {
      success('Coverage report copied to clipboard!');
    } else {
      warn('Could not copy to clipboard. Use --print to print to console.');
    }
  }

  console.log('');
}

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
