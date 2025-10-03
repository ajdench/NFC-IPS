#!/usr/bin/env node
/**
 * Test script to verify Encounter.type.coding extraction works correctly
 */

const fs = require('fs');
const path = require('path');

// Read the updated IPS file
const ipsPath = path.join(__dirname, 'ips-fhir-json-1.json');
const bundle = JSON.parse(fs.readFileSync(ipsPath, 'utf8'));

console.log('\n🧪 Testing Encounter.type.coding Extraction\n');
console.log('═'.repeat(80));

// Build Encounter map
const encounterMap = new Map();
bundle.entry.forEach(entry => {
    if (entry.resource?.resourceType === 'Encounter') {
        const encounter = entry.resource;
        const careStage = encounter.type?.[0]?.coding?.find(coding =>
            coding.system === 'http://medis.org.uk/fhir/CodeSystem/opcp-care-stages'
        );

        if (careStage) {
            encounterMap.set(entry.fullUrl, {
                id: encounter.id,
                code: careStage.code,
                display: careStage.display,
                period: encounter.period
            });
        }
    }
});

console.log(`\n✅ Found ${encounterMap.size} Encounters with type.coding:\n`);
encounterMap.forEach((enc, ref) => {
    console.log(`   ${enc.code.padEnd(15)} | ${enc.display.padEnd(25)} | ${enc.id}`);
});

// Test resource linking
console.log('\n' + '═'.repeat(80));
console.log('\n🔗 Testing Resource → Encounter Linking:\n');

const resourceTypes = ['Observation', 'Condition', 'MedicationAdministration', 'Procedure'];
const resourceCounts = {};

resourceTypes.forEach(type => resourceCounts[type] = { withEncounter: 0, withoutEncounter: 0 });

bundle.entry.forEach(entry => {
    if (!entry.resource || !resourceTypes.includes(entry.resource.resourceType)) return;

    const resource = entry.resource;
    const type = resource.resourceType;

    if (resource.encounter?.reference) {
        const encounterInfo = encounterMap.get(resource.encounter.reference);
        if (encounterInfo) {
            resourceCounts[type].withEncounter++;
        }
    } else {
        resourceCounts[type].withoutEncounter++;
    }
});

console.log('Resource Type'.padEnd(30) + 'With Encounter'.padEnd(20) + 'Without Encounter');
console.log('-'.repeat(70));
resourceTypes.forEach(type => {
    const counts = resourceCounts[type];
    console.log(
        type.padEnd(30) +
        String(counts.withEncounter).padEnd(20) +
        String(counts.withoutEncounter)
    );
});

// Sample extraction test
console.log('\n' + '═'.repeat(80));
console.log('\n📋 Sample Care Stage Extraction Test:\n');

const sampleResources = bundle.entry
    .filter(entry => entry.resource?.encounter?.reference)
    .slice(0, 5);

sampleResources.forEach(entry => {
    const resource = entry.resource;
    const encounterInfo = encounterMap.get(resource.encounter.reference);

    if (encounterInfo) {
        console.log(`   ${resource.resourceType.padEnd(25)} → ${encounterInfo.code.padEnd(15)} (${encounterInfo.display})`);
    }
});

console.log('\n' + '═'.repeat(80));
console.log('\n✨ Test Complete!\n');

// Summary
const totalWithEncounter = Object.values(resourceCounts).reduce((sum, counts) => sum + counts.withEncounter, 0);
const totalWithoutEncounter = Object.values(resourceCounts).reduce((sum, counts) => sum + counts.withoutEncounter, 0);

console.log(`Summary:`);
console.log(`  • ${encounterMap.size} Encounters with type.coding`);
console.log(`  • ${totalWithEncounter} resources linked to Encounters`);
console.log(`  • ${totalWithoutEncounter} resources without Encounter links`);
console.log();
