#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

const FILES_TO_COPY = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'style.css', dest: 'style.css' },
    { src: 'script.js', dest: 'script.js' },
    { src: 'README-gh-pages.md', dest: 'README.md' },
    { src: 'payload-1.json', dest: 'payload-1.json' },
    { src: 'payload-2.json', dest: 'payload-2.json' }
];

async function ensureCleanBuildDir() {
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });
}

async function copyStaticFiles() {
    for (const { src, dest } of FILES_TO_COPY) {
        const srcPath = path.join(rootDir, src);
        const destPath = path.join(buildDir, dest);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied ${src} → ${dest}`);
    }
}

async function copyResources() {
    const resourcesSrc = path.join(rootDir, 'resources');
    const resourcesDest = path.join(buildDir, 'resources');
    await fs.cp(resourcesSrc, resourcesDest, { recursive: true });
    console.log(`Copied resources/ → resources/`);
}

// ✅ Ensure /nfc/ips/home.html exists by duplicating index.html
async function ensureNestedHome() {
    const srcPath = path.join(rootDir, 'index.html');
    const nestedDest = path.join(buildDir, 'nfc/ips/home.html');

    await fs.mkdir(path.dirname(nestedDest), { recursive: true });
    await fs.copyFile(srcPath, nestedDest);
    console.log(`Created nested home at nfc/ips/home.html`);
}

async function main() {
    try {
        console.log('Cleaning build directory...');
        await ensureCleanBuildDir();

        console.log('Copying static files...');
        await copyStaticFiles();

        console.log('Copying resources...');
        await copyResources();

        console.log('Ensuring nested home.html exists...');
        await ensureNestedHome();

        console.log('✅ Build directory ready at', buildDir);
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

await main();
