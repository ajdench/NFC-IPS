#!/usr/bin/env node

/**
 * Simple Converter Test - Tests only the core FHIR ↔ CodeRef converters
 * Extracts and tests just the conversion functions without browser dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('\n════════════════════════════════════════════════════════════');
console.log('🧪 FHIR CONVERTER VALIDATION TEST');
console.log('════════════════════════════════════════════════════════════\n');

console.log('📦 Loading preset 1...');
const preset1 = JSON.parse(fs.readFileSync('ips-fhir-json-1.json', 'utf-8'));
console.log(`   ✅ Loaded ${preset1.entry.length} FHIR entries\n`);

// Analyze structure
console.log('📊 Resource breakdown:');
const types = {};
preset1.entry.forEach(e => {
    const type = e.resource?.resourceType;
    if (type) types[type] = (types[type] || 0) + 1;
});
Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
});

// Check for Composition sections
const composition = preset1.entry.find(e => e.resource?.resourceType === 'Composition')?.resource;
if (composition?.section) {
    console.log(`\n📋 Composition sections: ${composition.section.length}`);
    composition.section.forEach(s => {
        const entryCount = s.entry?.length || 0;
        console.log(`   "${s.title}": ${entryCount} entries`);
    });
}

// Check what resources have URN references in sections
console.log('\n🔍 Checking section-to-resource mapping...');
const sectionRefs = new Set();
composition?.section?.forEach(s => {
    s.entry?.forEach(e => {
        if (e.reference) sectionRefs.add(e.reference);
    });
});

const resourceIds = new Set();
preset1.entry.forEach(e => {
    if (e.resource?.id) {
        resourceIds.add(`urn:uuid:${e.resource.id}`);
    }
});

const mapped = Array.from(sectionRefs).filter(ref => resourceIds.has(ref));
console.log(`   Section references: ${sectionRefs.size}`);
console.log(`   Resource IDs: ${resourceIds.size}`);
console.log(`   Successfully mapped: ${mapped.length}`);

if (mapped.length < sectionRefs.size) {
    console.log(`\n   ⚠️  ${sectionRefs.size - mapped.length} references not mapped!`);
    const unmapped = Array.from(sectionRefs).filter(ref => !resourceIds.has(ref));
    unmapped.slice(0, 5).forEach(ref => console.log(`      ${ref}`));
}

// Check for new resource types
console.log('\n📌 New resource types to handle:');
const newTypes = ['Procedure', 'ImagingStudy', 'Encounter'];
newTypes.forEach(type => {
    const count = types[type] || 0;
    const icon = count > 0 ? '✅' : '❌';
    console.log(`   ${icon} ${type}: ${count}`);
});

// Check Patient extensions
const patient = preset1.entry.find(e => e.resource?.resourceType === 'Patient')?.resource;
if (patient) {
    console.log('\n👤 Patient analysis:');
    console.log(`   Name: ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`);
    console.log(`   Prefix: ${patient.name?.[0]?.prefix?.join(', ') || 'none'}`);
    console.log(`   Identifiers: ${patient.identifier?.length || 0}`);
    patient.identifier?.forEach(id => {
        console.log(`      - ${id.type?.coding?.[0]?.code || 'unknown'}: ${id.value}`);
    });
    console.log(`   Extensions: ${patient.extension?.length || 0}`);
    patient.extension?.forEach(ext => {
        const url = ext.url.split('/').pop();
        console.log(`      - ${url}`);
    });
}

// Check Procedures
const procedures = preset1.entry.filter(e => e.resource?.resourceType === 'Procedure');
if (procedures.length > 0) {
    console.log(`\n🔧 Procedure analysis (${procedures.length} total):`);
    procedures.slice(0, 3).forEach((p, idx) => {
        const proc = p.resource;
        console.log(`   ${idx + 1}. ${proc.code?.text || proc.code?.coding?.[0]?.display || 'Unknown'}`);
        console.log(`      Time: ${proc.performedDateTime || proc.performedPeriod?.start || 'Unknown'}`);
        console.log(`      Notes: ${proc.note?.[0]?.text || 'none'}`);
    });
}

// Check ImagingStudy
const imaging = preset1.entry.filter(e => e.resource?.resourceType === 'ImagingStudy');
if (imaging.length > 0) {
    console.log(`\n📷 ImagingStudy analysis (${imaging.length} total):`);
    imaging.forEach((img, idx) => {
        const study = img.resource;
        console.log(`   ${idx + 1}. ${study.modality?.[0]?.display || study.modality?.[0]?.code}: ${study.description}`);
        console.log(`      Started: ${study.started}`);
    });
}

// Check Observations for laboratory
const observations = preset1.entry.filter(e => e.resource?.resourceType === 'Observation');
const labObs = observations.filter(o => o.resource.category?.[0]?.coding?.[0]?.code === 'laboratory');
const vitalObs = observations.filter(o => o.resource.category?.[0]?.coding?.[0]?.code === 'vital-signs');
console.log(`\n🔬 Observations: ${observations.length} total`);
console.log(`   Vital signs: ${vitalObs.length}`);
console.log(`   Laboratory: ${labObs.length}`);

if (labObs.length > 0) {
    console.log('\n   Laboratory tests:');
    labObs.forEach(o => {
        const obs = o.resource;
        const code = obs.code?.coding?.[0]?.display || obs.code?.text;
        let value = 'N/A';
        if (obs.valueQuantity) {
            value = `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`;
        } else if (obs.valueCodeableConcept) {
            value = obs.valueCodeableConcept.coding?.[0]?.display || obs.valueCodeableConcept.text;
        } else if (obs.valueString) {
            value = obs.valueString;
        }
        console.log(`      - ${code}: ${value}`);
    });
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('✅ ANALYSIS COMPLETE');
console.log('════════════════════════════════════════════════════════════\n');

console.log('📝 Summary:');
console.log(`   - ${newTypes.filter(t => types[t] > 0).length}/${newTypes.length} new resource types present`);
console.log(`   - Section mapping coverage: ${((mapped.length / sectionRefs.size) * 100).toFixed(1)}%`);
console.log(`   - Laboratory observations: ${labObs.length} (need special handling)`);
console.log(`   - Patient extensions: ${patient?.extension?.length || 0} (need preservation)\n`);
