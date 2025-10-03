#!/usr/bin/env node
/**
 * Update military rank to use HL7 v2 Table 0141 instead of NATO STANAG 2116
 * Maps OR-1 (Private) to E1 (Enlisted 1)
 */

const fs = require('fs');
const path = require('path');

// HL7 v2 Table 0141 - Military Rank/Grade
// https://www.hl7.eu/v2plusvocab/ValueSet-Hl7VS-militaryRank-GradeV100.html
const HL7_RANK_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v2-0141';

// NATO STANAG 2116 to HL7 v2 Table 0141 mapping
const RANK_MAP = {
  'OR1': { code: 'E1', display: 'Enlisted 1' },
  'OR2': { code: 'E2', display: 'Enlisted 2' },
  'OR3': { code: 'E3', display: 'Enlisted 3' },
  'OR4': { code: 'E4', display: 'Enlisted 4' },
  'OR5': { code: 'E5', display: 'Enlisted 5' },
  'OR6': { code: 'E6', display: 'Enlisted 6' },
  'OR7': { code: 'E7', display: 'Enlisted 7' },
  'OR8': { code: 'E8', display: 'Enlisted 8' },
  'OR9': { code: 'E9', display: 'Enlisted 9' },
  'OF1': { code: 'O1', display: 'Officer 1' },
  'OF2': { code: 'O2', display: 'Officer 2' },
  'OF3': { code: 'O3', display: 'Officer 3' },
  'OF4': { code: 'O4', display: 'Officer 4' },
  'OF5': { code: 'O5', display: 'Officer 5' },
  'OF6': { code: 'O6', display: 'Officer 6' },
  'OF7': { code: 'O7', display: 'Officer 7' },
  'OF8': { code: 'O8', display: 'Officer 8' },
  'OF9': { code: 'O9', display: 'Officer 9' },
  'OF10': { code: 'O10', display: 'Officer 10' }
};

function updateRank(filePath) {
  console.log(`\n📄 Reading ${filePath}...`);
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const patientEntry = bundle.entry.find(entry => entry.resource?.resourceType === 'Patient');

  if (!patientEntry) {
    console.error('❌ No Patient resource found');
    return;
  }

  const patient = patientEntry.resource;

  if (!patient.extension) {
    console.error('❌ No extensions found');
    return;
  }

  // Find military rank extension
  const rankExt = patient.extension.find(ext =>
    ext.url === 'https://fhir.nato.int/StructureDefinition/military-rank' ||
    ext.url.includes('military-rank')
  );

  if (!rankExt) {
    console.error('❌ No military rank extension found');
    return;
  }

  const currentCode = rankExt.valueCodeableConcept?.coding?.[0]?.code;
  const currentDisplay = rankExt.valueCodeableConcept?.coding?.[0]?.display;
  const rankText = rankExt.valueCodeableConcept?.text;

  console.log('\n🎖️  Current rank:');
  console.log('   System:', rankExt.valueCodeableConcept?.coding?.[0]?.system);
  console.log('   Code:', currentCode);
  console.log('   Display:', currentDisplay);
  console.log('   Text:', rankText);

  // Map NATO code to HL7 code
  const hl7Rank = RANK_MAP[currentCode];

  if (!hl7Rank) {
    console.warn(`⚠️  No HL7 mapping found for ${currentCode}`);
    return;
  }

  // Update to HL7 v2 Table 0141
  rankExt.valueCodeableConcept.coding = [{
    system: HL7_RANK_SYSTEM,
    code: hl7Rank.code,
    display: hl7Rank.display
  }];

  // Keep the text field (e.g., "Drummer")
  console.log('\n✅ Updated to HL7 v2 Table 0141:');
  console.log('   System:', HL7_RANK_SYSTEM);
  console.log('   Code:', hl7Rank.code);
  console.log('   Display:', hl7Rank.display);
  console.log('   Text:', rankText, '(preserved)');

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n💾 Saved to ${filePath}\n`);
}

const filePath = path.join(__dirname, 'ips-fhir-json-1.json');
updateRank(filePath);

console.log('✨ Done!\n');
