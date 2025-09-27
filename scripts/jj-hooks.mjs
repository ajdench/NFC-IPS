#!/usr/bin/env node

/**
 * JJ Hooks: Integration hooks for build/test processes
 * Automatically triggers JJ commits during development workflows
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

class JJHooks {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.memoryUpdateScript = resolve(projectRoot, 'memory/update.sh');
    }

    /**
     * Create JJ commit with automatic message generation
     */
    async autoCommit(context, description) {
        try {
            console.log(`🔄 Creating JJ commit for ${context}...`);

            // Ensure JJ repo exists
            await this.ensureJJRepo();

            // Generate contextual commit message
            const message = this.generateContextualMessage(context, description);

            // Create commit
            await execAsync(`jj commit -m "${message}"`, { cwd: this.projectRoot });
            console.log(`✅ JJ commit created: ${message.split('\n')[0]}`);

            // Update memory system
            await this.updateMemory(context, description);

            return true;
        } catch (error) {
            console.error(`❌ JJ commit failed for ${context}:`, error.message);
            return false;
        }
    }

    /**
     * Generate contextual commit message
     */
    generateContextualMessage(context, description) {
        const timestamp = new Date().toISOString().split('T')[0];
        const contexts = {
            'build': {
                type: 'build',
                scope: 'process',
                prefix: 'Build process'
            },
            'test': {
                type: 'test',
                scope: 'validation',
                prefix: 'Test validation'
            },
            'dev': {
                type: 'feat',
                scope: 'dev',
                prefix: 'Development'
            },
            'deploy': {
                type: 'deploy',
                scope: 'release',
                prefix: 'Deployment'
            },
            'fix': {
                type: 'fix',
                scope: 'core',
                prefix: 'Bug fix'
            },
            'refactor': {
                type: 'refactor',
                scope: 'code',
                prefix: 'Code refactor'
            }
        };

        const config = contexts[context] || {
            type: 'chore',
            scope: context,
            prefix: 'Update'
        };

        const shortDesc = description.length > 50 ?
            description.substring(0, 47) + '...' : description;

        return `${config.type}(${config.scope}): ${shortDesc}

${config.prefix}: ${description}

🤖 Auto-generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
Timestamp: ${timestamp}`;
    }

    /**
     * Ensure JJ repository exists
     */
    async ensureJJRepo() {
        try {
            await execAsync('jj status', { cwd: this.projectRoot });
        } catch (error) {
            console.log('🔧 Initializing JJ repository...');
            try {
                await execAsync('jj git import', { cwd: this.projectRoot });
            } catch (importError) {
                await execAsync('jj git init --colocate', { cwd: this.projectRoot });
            }
        }
    }

    /**
     * Update memory system
     */
    async updateMemory(context, description) {
        try {
            const updateMessage = `Auto-JJ ${context}: ${description}`;
            await execAsync(`"${this.memoryUpdateScript}" "${updateMessage}"`, {
                cwd: this.projectRoot
            });
        } catch (error) {
            console.log('⚠️  Memory update failed:', error.message);
        }
    }

    /**
     * Hook for build process
     */
    async buildHook(success, buildOutput) {
        const description = success ?
            'Build completed successfully' :
            `Build failed: ${buildOutput.substring(0, 100)}`;

        return this.autoCommit('build', description);
    }

    /**
     * Hook for test process
     */
    async testHook(success, testResults) {
        const description = success ?
            'All tests passing' :
            `Test failures detected: ${testResults.substring(0, 100)}`;

        return this.autoCommit('test', description);
    }

    /**
     * Hook for development server
     */
    async devHook(description = 'Development server changes') {
        return this.autoCommit('dev', description);
    }

    /**
     * Hook for deployment
     */
    async deployHook(target, success) {
        const description = success ?
            `Deployment to ${target} successful` :
            `Deployment to ${target} failed`;

        return this.autoCommit('deploy', description);
    }

    /**
     * Generic fix hook
     */
    async fixHook(description) {
        return this.autoCommit('fix', description);
    }

    /**
     * Generic refactor hook
     */
    async refactorHook(description) {
        return this.autoCommit('refactor', description);
    }
}

// CLI interface for manual hook triggers
if (import.meta.url === `file://${process.argv[1]}`) {
    const hooks = new JJHooks();
    const [,, command, ...args] = process.argv;

    switch (command) {
        case 'build':
            hooks.buildHook(args[0] === 'success', args[1] || '');
            break;
        case 'test':
            hooks.testHook(args[0] === 'success', args[1] || '');
            break;
        case 'dev':
            hooks.devHook(args[0] || 'Development changes');
            break;
        case 'deploy':
            hooks.deployHook(args[0] || 'production', args[1] === 'success');
            break;
        case 'fix':
            hooks.fixHook(args[0] || 'Bug fix applied');
            break;
        case 'refactor':
            hooks.refactorHook(args[0] || 'Code refactoring');
            break;
        default:
            console.log(`
Usage: node jj-hooks.mjs <command> [args...]

Commands:
  build <success|failure> [output]    - Hook for build process
  test <success|failure> [results]    - Hook for test process
  dev [description]                   - Hook for development changes
  deploy <target> <success|failure>   - Hook for deployment
  fix <description>                   - Hook for bug fixes
  refactor <description>             - Hook for refactoring

Examples:
  node jj-hooks.mjs build success
  node jj-hooks.mjs test failure "Type errors found"
  node jj-hooks.mjs dev "Updated UI components"
  node jj-hooks.mjs deploy production success
            `);
    }
}

export default JJHooks;