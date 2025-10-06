#!/usr/bin/env node
/**
 * Test script to debug FHIR → CodeRef → FHIR conversion
 * Run with: node test-conversion.mjs
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the original FHIR payload
const payload1 = JSON.parse(fs.readFileSync(join(__dirname, 'payload-1.json'), 'utf8'));

console.log('=== ORIGINAL FHIR ANALYSIS ===');
console.log('Total entries:', payload1.entry.length);

// Count resources by type
const resourceTypes = {};
payload1.entry.forEach(entry => {
    const type = entry.resource.resourceType;
    resourceTypes[type] = (resourceTypes[type] || 0) + 1;
});

console.log('\nResource types:');
Object.entries(resourceTypes).sort().forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
});

// Check careStage extensions
console.log('\n=== CARE STAGE ANALYSIS ===');
const careStages = {};
let withExtension = 0;
let withoutExtension = 0;

payload1.entry.forEach((entry, index) => {
    const resource = entry.resource;
    if (!resource) return;

    // Skip Patient and Composition
    if (['Patient', 'Composition', 'Organization', 'AllergyIntolerance'].includes(resource.resourceType)) {
        return;
    }

    const ext = resource.extension?.find(e =>
        e.url === 'http://example.org/fhir/StructureDefinition/care-stage'
    );

    if (ext) {
        withExtension++;
        const stage = ext.valueCode || ext.valueString;
        careStages[stage] = (careStages[stage] || 0) + 1;

        if (index < 5) {
            console.log(`Sample ${index}: ${resource.resourceType} → ${stage}`);
        }
    } else {
        withoutExtension++;
        if (withoutExtension <= 3) {
            console.log(`NO EXTENSION: ${resource.resourceType} (${resource.id})`);
        }
    }
});

console.log(`\nResources with care-stage extension: ${withExtension}`);
console.log(`Resources without care-stage extension: ${withoutExtension}`);

console.log('\nCare stages distribution:');
Object.entries(careStages).sort().forEach(([stage, count]) => {
    console.log(`  ${stage}: ${count}`);
});

// Detailed look at first few clinical resources
console.log('\n=== DETAILED RESOURCE INSPECTION ===');
let clinicalCount = 0;
payload1.entry.forEach(entry => {
    const resource = entry.resource;
    if (!resource) return;

    if (['Observation', 'Condition', 'Procedure', 'MedicationAdministration'].includes(resource.resourceType)) {
        clinicalCount++;
        if (clinicalCount <= 3) {
            console.log(`\n${resource.resourceType} (${resource.id}):`);
            console.log('  Extension:', JSON.stringify(resource.extension, null, 2));
            console.log('  Code:', resource.code?.coding?.[0]?.code);
            console.log('  Display:', resource.code?.coding?.[0]?.display);
            console.log('  Time:', resource.effectiveDateTime || resource.onsetDateTime || resource.performedDateTime);
        }
    }
});

console.log(`\nTotal clinical resources examined: ${clinicalCount}`);
