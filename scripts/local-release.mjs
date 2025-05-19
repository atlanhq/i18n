#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

/**
 * This script allows you to run the semantic-release process locally
 * for testing purposes without actually publishing or creating GitHub releases.
 */

// Create the semantic-release config file
const releaseConfig = {
    branches: ['main'],
    // Use a local repository URL to avoid GitHub authentication
    repositoryUrl: 'file://' + process.cwd(),
    plugins: [
        ['@semantic-release/commit-analyzer', {
            preset: 'angular',
            releaseRules: [
                { type: 'chore', scope: 'i18n', release: 'patch' },
                { type: 'feat', release: 'minor' },
                { type: 'fix', release: 'patch' },
                { type: 'perf', release: 'patch' }
            ]
        }],
        '@semantic-release/release-notes-generator',
        // Skip the npm plugin to avoid publishing attempts
        // Skip the git plugin to avoid Git operations
        // Skip the GitHub plugin to avoid GitHub API calls
    ],
    // These options will run semantic-release in dry-run mode
    dryRun: true,
    ci: false
};

// Write the config to a temp file
console.log('📝 Creating temporary semantic-release config...');
writeFileSync('./.releaserc.json', JSON.stringify(releaseConfig, null, 2));

try {
    // Run semantic-release in dry run mode with debug output
    console.log('🚀 Running semantic-release in analysis-only mode...');
    execSync('npx semantic-release --dry-run --no-ci --debug', { stdio: 'inherit' });
    console.log('\n✅ Analysis completed successfully!');
} catch (error) {
    console.error('\n❌ Error running semantic-release:', error.message);
    process.exit(1);
} finally {
    // Clean up the config
    try {
        // Remove the config file
        execSync('rm ./.releaserc.json');
        console.log('🧹 Cleaned up temporary configuration');
    } catch (cleanupError) {
        console.warn('⚠️ Warning: Could not clean up temporary files:', cleanupError.message);
    }
}

console.log('\n📋 Usage Instructions:');
console.log('  • This was an analysis-only run - no actual releases were created');
console.log('  • The output above shows what version would be created based on your commits');
console.log('  • To test with different version types, create commits with appropriate prefixes:');
console.log('    - feat: for a minor release');
console.log('    - fix: for a patch release');
console.log('    - chore(i18n): for a patch release');
console.log('    - perf: for a patch release');
console.log('\n⚠️  Note: This local test only checks commit analysis and version calculation');
console.log('   The actual GitHub workflow will include additional steps like Git tagging and npm publishing'); 