#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

const COPY_TARGETS = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'style.css', dest: 'style.css' },
    { src: 'script.js', dest: 'script.js' },
    { src: 'README-gh-pages.md', dest: 'README.md' },
    { src: 'payload-1.json', dest: 'payload-1.json' },
    { src: 'payload-2.json', dest: 'payload-2.json' },
    { src: 'resources', dest: 'resources' },
    { src: 'nfc', dest: 'nfc' }
];

async function ensureCleanBuildDir() {
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });
}

let fileCopyCount = 0;
let directoryCopyCount = 0;
const copiedFiles = [];

async function logCopy(srcAbsolute, destAbsolute) {
    const sourceRelative = path.relative(rootDir, srcAbsolute);
    const destRelative = path.relative(buildDir, destAbsolute);
    copiedFiles.push(destRelative);
    fileCopyCount += 1;
    console.log(`Copied file: ${sourceRelative} → ${destRelative}`);
}

async function copyFileWithLogging(srcAbsolute, destAbsolute) {
    await fs.mkdir(path.dirname(destAbsolute), { recursive: true });
    await fs.copyFile(srcAbsolute, destAbsolute);
    await logCopy(srcAbsolute, destAbsolute);
}

async function copyDirectory(srcAbsolute, destAbsolute) {
    await fs.mkdir(destAbsolute, { recursive: true });
    const entries = await fs.readdir(srcAbsolute, { withFileTypes: true });

    for (const entry of entries) {
        const nextSrc = path.join(srcAbsolute, entry.name);
        const nextDest = path.join(destAbsolute, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(nextSrc, nextDest);
        } else if (entry.isFile()) {
            await copyFileWithLogging(nextSrc, nextDest);
        }
    }
}

async function copyTargets() {
    for (const { src, dest } of COPY_TARGETS) {
        const srcPath = path.join(rootDir, src);
        const destPath = path.join(buildDir, dest);
        const stats = await fs.stat(srcPath);

        if (stats.isDirectory()) {
            directoryCopyCount += 1;
            console.log(`Copying directory: ${src} → ${dest}`);
            await copyDirectory(srcPath, destPath);
        } else if (stats.isFile()) {
            await copyFileWithLogging(srcPath, destPath);
        }
    }
}

async function verifyNestedHome() {
    const relativeHomePath = 'nfc/ips/home.html';
    const nestedPath = path.join(buildDir, relativeHomePath);
    const sourceHome = path.join(rootDir, relativeHomePath);
    const rootIndex = path.join(rootDir, 'index.html');

    try {
        await fs.access(sourceHome, fsConstants.F_OK);
    } catch {
        throw new Error(`Source file missing: ${relativeHomePath}`);
    }

    let needsCopy = false;
    let syncReason = 'out_of_sync';

    try {
        const [sourceContent, nestedContent] = await Promise.all([
            fs.readFile(sourceHome),
            fs.readFile(nestedPath)
        ]);

        if (!nestedContent.equals(sourceContent)) {
            const rootIndexContent = await fs.readFile(rootIndex);

            if (nestedContent.equals(rootIndexContent)) {
                syncReason = 'matched_root_redirect';
            }

            needsCopy = true;
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            needsCopy = true;
            syncReason = 'missing';
        } else {
            throw error;
        }
    }

    if (needsCopy) {
        await copyFileWithLogging(sourceHome, nestedPath);
        console.log(`Synchronized nested home at nfc/ips/home.html (${syncReason})`);
    } else {
        console.log('Verified nested home at nfc/ips/home.html');
    }
}

async function main() {
    try {
        console.log('Cleaning build directory...');
        await ensureCleanBuildDir();

        console.log('Copying targets...');
        await copyTargets();

        console.log('Verifying nested home.html...');
        await verifyNestedHome();

        console.log('✅ Build directory ready at', buildDir);
        console.log('Build summary:', {
            directoriesProcessed: directoryCopyCount,
            filesCopied: fileCopyCount,
            sampleFiles: copiedFiles.slice(0, 10),
            totalLoggedFiles: copiedFiles.length
        });
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

await main();
