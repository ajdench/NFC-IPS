/**
 * Preset #1 Data Analysis Report
 * Analyzes ips-fhir-json-1.json and reports expected vs actual display
 */

import fs from 'fs';

const fhirBundle = JSON.parse(fs.readFileSync('./ips-fhir-json-1.json', 'utf8'));

console.log('='.repeat(80));
console.log('PRESET #1 (ips-fhir-json-1.json) - COMPREHENSIVE DATA ANALYSIS');
console.log('='.repeat(80));
console.log();

// 1. Map Encounters to Care Stages
console.log('1. ENCOUNTER → CARE STAGE MAPPING');
console.log('-'.repeat(80));

const encounterMap = new Map();
fhirBundle.entry
    .filter(e => e.resource?.resourceType === 'Encounter')
    .forEach(e => {
        const careStageCode = e.resource.type?.[0]?.coding?.find(c => 
            c.system === 'http://medis.org.uk/fhir/CodeSystem/opcp-care-stages'
        )?.code;
        encounterMap.set(e.fullUrl, {
            id: e.resource.id,
            careStage: careStageCode,
            uuid: e.fullUrl
        });
    });

encounterMap.forEach((val, key) => {
    console.log(`  ${val.careStage?.padEnd(12)} → ${key}`);
});
console.log();

// 2. Count Resources per Encounter
console.log('2. RESOURCES PER ENCOUNTER');
console.log('-'.repeat(80));

const resourcesByEncounter = new Map();
fhirBundle.entry
    .filter(e => e.resource?.encounter?.reference)
    .forEach(e => {
        const encounterRef = e.resource.encounter.reference;
        if (!resourcesByEncounter.has(encounterRef)) {
            resourcesByEncounter.set(encounterRef, []);
        }
        resourcesByEncounter.get(encounterRef).push({
            type: e.resource.resourceType,
            id: e.resource.id
        });
    });

encounterMap.forEach((encInfo, uuid) => {
    const resources = resourcesByEncounter.get(uuid) || [];
    console.log(`  ${encInfo.careStage?.padEnd(12)} (${encInfo.id}): ${resources.length} resources`);
});
console.log();

// 3. Resource Type Distribution
console.log('3. RESOURCE TYPE DISTRIBUTION BY CARE STAGE');
console.log('-'.repeat(80));

const typesByCareStage = new Map();
fhirBundle.entry
    .filter(e => e.resource?.encounter?.reference)
    .forEach(e => {
        const encounterRef = e.resource.encounter.reference;
        const encInfo = encounterMap.get(encounterRef);
        if (!encInfo) return;
        
        const careStage = encInfo.careStage;
        if (!typesByCareStage.has(careStage)) {
            typesByCareStage.set(careStage, new Map());
        }
        
        const typeCounts = typesByCareStage.get(careStage);
        const resourceType = e.resource.resourceType;
        typeCounts.set(resourceType, (typeCounts.get(resourceType) || 0) + 1);
    });

typesByCareStage.forEach((typeCounts, careStage) => {
    console.log(`  ${careStage}:`);
    typeCounts.forEach((count, type) => {
        console.log(`    - ${type}: ${count}`);
    });
});
console.log();

// 4. Expected UI Display
console.log('4. EXPECTED UI DISPLAY (by care stage)');
console.log('-'.repeat(80));

typesByCareStage.forEach((typeCounts, careStage) => {
    const obs = typeCounts.get('Observation') || 0;
    const cond = typeCounts.get('Condition') || 0;
    const proc = typeCounts.get('Procedure') || 0;
    const med = typeCounts.get('MedicationAdministration') || 0;
    const img = typeCounts.get('ImagingStudy') || 0;
    
    console.log(`  ${careStage}:`);
    console.log(`    Vitals:     ${obs} (Observations)`);
    console.log(`    Conditions: ${cond}`);
    console.log(`    Events:     ${proc + med + img} (${proc} Procedures + ${med} MedicationAdministrations + ${img} ImagingStudies)`);
    
    // Map to internal care stage keys
    const keyMap = {
        'poi': 'poi',
        'casevac': 'casevac',
        'axp': 'axp',
        'medevac': 'medevac',
        'r1_phec': 'r1',
        'r1_phc': 'r1',
        'fwd_tacevac': 'fwdTacevac',
        'r2_dhc': 'r2',
        'rear_tacevac': 'rearTacevac',
        'r3_dhc': 'r3',
        'stratevac': 'stratevac'
    };
    console.log(`    UI Section: ${keyMap[careStage] || careStage}`);
    console.log();
});

// 5. R1 Combined (PHEC + PHC)
console.log('5. R1 COMBINED DATA (r1_phec + r1_phc → r1 section)');
console.log('-'.repeat(80));

const r1phec = typesByCareStage.get('r1_phec') || new Map();
const r1phc = typesByCareStage.get('r1_phc') || new Map();

const r1Combined = new Map();
[...r1phec.entries(), ...r1phc.entries()].forEach(([type, count]) => {
    r1Combined.set(type, (r1Combined.get(type) || 0) + count);
});

console.log('  R1 Section Total:');
r1Combined.forEach((count, type) => {
    console.log(`    - ${type}: ${count}`);
});
console.log();

// 6. Vitals Chart Expected Data
console.log('6. VITALS CHART - EXPECTED CARE STAGES');
console.log('-'.repeat(80));

const vitalsStages = [];
typesByCareStage.forEach((typeCounts, careStage) => {
    const obs = typeCounts.get('Observation') || 0;
    if (obs > 0) {
        const keyMap = {
            'poi': 'poi',
            'r1_phec': 'r1',
            'r1_phc': 'r1',
            'r2_dhc': 'r2'
        };
        const key = keyMap[careStage] || careStage;
        if (!vitalsStages.includes(key)) {
            vitalsStages.push(key);
        }
    }
});

console.log(`  Care stages with vitals: ${vitalsStages.join(', ')}`);
console.log(`  Expected in chart legend: ${vitalsStages.length} stages`);
console.log();

// 7. All Resources Summary
console.log('7. TOTAL RESOURCES SUMMARY');
console.log('-'.repeat(80));

const totalWithEncounter = fhirBundle.entry.filter(e => e.resource?.encounter?.reference).length;
const totalEncounters = encounterMap.size;
const totalEntries = fhirBundle.entry.length;

console.log(`  Total Bundle Entries:     ${totalEntries}`);
console.log(`  Total Encounters:         ${totalEncounters}`);
console.log(`  Resources with Encounter: ${totalWithEncounter}`);
console.log(`  Resources without:        ${totalEntries - totalEncounters - totalWithEncounter}`);
console.log();

// 8. Missing/Empty Stages
console.log('8. EMPTY CARE STAGES (should show "No data available")');
console.log('-'.repeat(80));

const allStages = ['poi', 'casevac', 'axp', 'medevac', 'r1_phec', 'r1_phc', 'fwd_tacevac', 'r2_dhc', 'rear_tacevac', 'r3_dhc', 'stratevac'];
const emptyStages = allStages.filter(stage => !typesByCareStage.has(stage) || typesByCareStage.get(stage).size === 0);

emptyStages.forEach(stage => {
    const keyMap = {
        'poi': 'poi',
        'casevac': 'casevac',
        'axp': 'axp',
        'medevac': 'medevac',
        'r1_phec': 'r1',
        'r1_phc': 'r1',
        'fwd_tacevac': 'fwdTacevac',
        'r2_dhc': 'r2',
        'rear_tacevac': 'rearTacevac',
        'r3_dhc': 'r3',
        'stratevac': 'stratevac'
    };
    console.log(`  ${stage.padEnd(12)} → ${keyMap[stage]} section`);
});

console.log();
console.log('='.repeat(80));
console.log('END OF REPORT');
console.log('='.repeat(80));
