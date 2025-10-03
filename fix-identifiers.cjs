#!/usr/bin/env node
/**
 * Fix Patient identifiers to include proper type.coding for NH/MIL codes
 * Required for CodeRef converter to extract nhs_id and service_id
 */

const fs = require('fs');
const path = require('path');

function fixIdentifiers(filePath) {
  console.log(`\n📄 Reading ${filePath}...`);
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const patientEntry = bundle.entry.find(entry => entry.resource?.resourceType === 'Patient');

  if (!patientEntry) {
    console.error('❌ No Patient resource found');
    return;
  }

  const patient = patientEntry.resource;

  if (!patient.identifier) {
    console.error('❌ No identifiers found');
    return;
  }

  console.log('\n🔧 Fixing identifiers...\n');

  patient.identifier.forEach(identifier => {
    // Fix NHS number (missing type.coding)
    if (identifier.system === 'https://fhir.nhs.uk/Id/nhs-number') {
      if (!identifier.type) {
        identifier.type = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'NH',
            display: 'National Health Service Number'
          }],
          text: 'NHS Number'
        };
        console.log('✅ Added type.coding to NHS number');
        console.log('   System:', identifier.system);
        console.log('   Value:', identifier.value);
        console.log('   Type code:', identifier.type.coding[0].code);
      }
    }

    // Verify MIL identifier (should already have type.coding)
    if (identifier.type?.coding?.[0]?.code === 'MIL') {
      console.log('✅ MIL identifier already has type.coding');
      console.log('   System:', identifier.system);
      console.log('   Value:', identifier.value);
      console.log('   Type code:', identifier.type.coding[0].code);
    }
  });

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n💾 Saved to ${filePath}\n`);
}

const filePath = path.join(__dirname, 'ips-fhir-json-1.json');
fixIdentifiers(filePath);

console.log('✨ Done!\n');
