#!/usr/bin/env node

/**
 * Auto-JJ: Automatic Jujitsu version control for code changes
 * Monitors file changes and automatically creates JJ commits
 */

import { spawn, exec } from 'child_process';
import { watch } from 'fs';
import { resolve, relative } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AutoJJ {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.watchPatterns = options.watchPatterns || [
            'script.js',
            'style.css',
            'index.html',
            'package.json',
            'scripts/*.js',
            'scripts/*.mjs'
        ];
        this.ignorePatterns = options.ignorePatterns || [
            'node_modules',
            '.git',
            'build',
            'memory/active',
            '*.log',
            '.DS_Store'
        ];
        this.commitDelay = options.commitDelay || 2000; // 2 second delay
        this.pendingCommit = null;
        this.changedFiles = new Set();
        this.isCommitting = false;
    }

    /**
     * Start monitoring for file changes
     */
    start() {
        console.log('🔍 Auto-JJ: Starting file monitoring...');
        this.setupWatchers();
        console.log('✅ Auto-JJ: Monitoring active for automatic commits');
    }

    /**
     * Setup file system watchers for code files
     */
    setupWatchers() {
        const watchPaths = [
            'script.js',
            'style.css',
            'index.html',
            'package.json',
            'scripts'
        ];

        watchPaths.forEach(path => {
            const fullPath = resolve(this.projectRoot, path);
            try {
                watch(fullPath, { recursive: true }, (eventType, filename) => {
                    if (filename && !this.shouldIgnoreFile(filename)) {
                        this.handleFileChange(resolve(fullPath, filename || ''));
                    }
                });
                console.log(`📁 Watching: ${path}`);
            } catch (error) {
                console.log(`⚠️  Could not watch ${path}: ${error.message}`);
            }
        });
    }

    /**
     * Check if file should be ignored
     */
    shouldIgnoreFile(filename) {
        return this.ignorePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(filename);
            }
            return filename.includes(pattern);
        });
    }

    /**
     * Handle file change event
     */
    handleFileChange(filePath) {
        if (this.isCommitting) return;

        const relativePath = relative(this.projectRoot, filePath);
        console.log(`📝 File changed: ${relativePath}`);

        this.changedFiles.add(relativePath);

        // Debounce commits - wait for changes to settle
        if (this.pendingCommit) {
            clearTimeout(this.pendingCommit);
        }

        this.pendingCommit = setTimeout(() => {
            this.createAutoCommit();
        }, this.commitDelay);
    }

    /**
     * Create automatic JJ commit
     */
    async createAutoCommit() {
        if (this.isCommitting || this.changedFiles.size === 0) return;

        this.isCommitting = true;
        const files = Array.from(this.changedFiles);
        this.changedFiles.clear();

        try {
            console.log('🔄 Creating automatic JJ commit...');

            // Generate commit message
            const message = this.generateCommitMessage(files);

            // Check if JJ repo exists, initialize if needed
            await this.ensureJJRepo();

            // Stage and commit changes
            await this.commitChanges(message, files);

            // Update memory system
            await this.updateMemory(message);

            console.log('✅ Auto-commit completed');

        } catch (error) {
            console.error('❌ Auto-commit failed:', error.message);
        } finally {
            this.isCommitting = false;
        }
    }

    /**
     * Generate appropriate commit message based on changed files
     */
    generateCommitMessage(files) {
        const fileCategories = {
            ui: files.filter(f => f.includes('style.css') || f.includes('index.html')),
            logic: files.filter(f => f.includes('script.js')),
            config: files.filter(f => f.includes('package.json') || f.startsWith('scripts/')),
            docs: files.filter(f => f.endsWith('.md'))
        };

        let type = 'chore';
        let scope = '';
        let description = '';

        if (fileCategories.ui.length > 0) {
            type = 'feat';
            scope = 'ui';
            description = 'Update styling and layout';
        } else if (fileCategories.logic.length > 0) {
            type = 'feat';
            scope = 'core';
            description = 'Update application logic';
        } else if (fileCategories.config.length > 0) {
            type = 'build';
            scope = 'config';
            description = 'Update configuration';
        } else if (fileCategories.docs.length > 0) {
            type = 'docs';
            description = 'Update documentation';
        }

        const fileList = files.length <= 3 ? files.join(', ') : `${files.length} files`;
        const message = scope ?
            `${type}(${scope}): ${description}\n\nAuto-commit: ${fileList}` :
            `${type}: ${description}\n\nAuto-commit: ${fileList}`;

        return message;
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
                // Import existing git repo if present
                await execAsync('jj git import', { cwd: this.projectRoot });
                console.log('✅ JJ repository initialized from Git');
            } catch (importError) {
                // Initialize new JJ repo
                await execAsync('jj git init --colocate', { cwd: this.projectRoot });
                console.log('✅ New JJ repository initialized');
            }
        }
    }

    /**
     * Commit changes using JJ
     */
    async commitChanges(message, files) {
        try {
            // Add files to JJ
            for (const file of files) {
                try {
                    await execAsync(`jj file add "${file}"`, { cwd: this.projectRoot });
                } catch (error) {
                    // File might already be tracked
                    console.log(`📄 File already tracked: ${file}`);
                }
            }

            // Create commit
            await execAsync(`jj commit -m "${message}"`, { cwd: this.projectRoot });
            console.log(`📝 JJ commit created: ${message.split('\n')[0]}`);

        } catch (error) {
            throw new Error(`JJ commit failed: ${error.message}`);
        }
    }

    /**
     * Update memory system with commit info
     */
    async updateMemory(message) {
        try {
            const updateScript = resolve(this.projectRoot, 'memory/update.sh');
            const updateMessage = `Auto-JJ commit: ${message.split('\n')[0]}`;

            await execAsync(`"${updateScript}" "${updateMessage}"`, { cwd: this.projectRoot });
            console.log('📝 Memory system updated');

            // Update CLAUDE.md timestamps for 1-hour TTL crash recovery
            const claudeUpdateScript = resolve(this.projectRoot, 'memory/update-claude-md.sh');
            await execAsync(`"${claudeUpdateScript}" "Auto-JJ timestamp refresh"`, { cwd: this.projectRoot });
            console.log('🔄 CLAUDE.md timestamps refreshed');

            const refreshFlag = process.env.CODEX_REFRESH_TTL;
            const shouldRefreshCodex = typeof refreshFlag === 'string'
                ? !['0', 'false', 'off'].includes(refreshFlag.toLowerCase())
                : false;

            if (shouldRefreshCodex) {
                const codexUpdateScript = resolve(this.projectRoot, 'memory/update-codex-md.sh');
                await execAsync(`"${codexUpdateScript}" "Auto-JJ Codex timestamp refresh"`, { cwd: this.projectRoot });
                console.log('🔄 AGENTS.md timestamps refreshed for Codex');
            }
        } catch (error) {
            console.log('⚠️  Could not update memory system:', error.message);
        }
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.pendingCommit) {
            clearTimeout(this.pendingCommit);
        }
        console.log('🛑 Auto-JJ monitoring stopped');
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const autoJJ = new AutoJJ();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Auto-JJ...');
        autoJJ.stop();
        process.exit(0);
    });

    autoJJ.start();
}

export default AutoJJ;
