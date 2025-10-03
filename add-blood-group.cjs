#!/usr/bin/env node
/**
 * Add blood group as Patient extension from existing Observation
 * Enables CodeRef converter to extract blood_group field
 */

const fs = require('fs');
const path = require('path');

function addBloodGroupExtension(filePath) {
  console.log(`\n📄 Reading ${filePath}...`);
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Find blood group Observation (LOINC 882-1)
  const bloodGroupObs = bundle.entry.find(entry =>
    entry.resource?.resourceType === 'Observation' &&
    entry.resource?.code?.coding?.some(c => c.code === '882-1')
  )?.resource;

  if (!bloodGroupObs) {
    console.error('❌ No blood group Observation found (LOINC 882-1)');
    return;
  }

  const bloodGroupCode = bloodGroupObs.valueCodeableConcept?.coding?.[0]?.code;
  const bloodGroupDisplay = bloodGroupObs.valueCodeableConcept?.coding?.[0]?.display;

  console.log('\n🩸 Found blood group Observation:');
  console.log('   Code:', bloodGroupCode);
  console.log('   Display:', bloodGroupDisplay);

  // Find Patient resource
  const patientEntry = bundle.entry.find(entry => entry.resource?.resourceType === 'Patient');

  if (!patientEntry) {
    console.error('❌ No Patient resource found');
    return;
  }

  const patient = patientEntry.resource;

  // Check if blood group extension already exists
  const existingExt = patient.extension?.find(ext =>
    ext.url === 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup'
  );

  if (existingExt) {
    console.log('\n✅ Blood group extension already exists');
    console.log('   Code:', existingExt.valueCodeableConcept?.coding?.[0]?.code);
    return;
  }

  // Add blood group extension
  if (!patient.extension) {
    patient.extension = [];
  }

  patient.extension.push({
    url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
    valueCodeableConcept: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: bloodGroupCode,
        display: bloodGroupDisplay
      }]
    }
  });

  console.log('\n✅ Added blood group extension to Patient:');
  console.log('   URL: http://hl7.org/fhir/StructureDefinition/patient-bloodGroup');
  console.log('   System: http://snomed.info/sct');
  console.log('   Code:', bloodGroupCode);
  console.log('   Display:', bloodGroupDisplay);

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n💾 Saved to ${filePath}\n`);
}

const filePath = path.join(__dirname, 'ips-fhir-json-1.json');
addBloodGroupExtension(filePath);

console.log('✨ Done!\n');
