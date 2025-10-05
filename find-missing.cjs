const fs = require('fs');
const diff = JSON.parse(fs.readFileSync('/Users/andrew.dench/Downloads/differences-10.json'));
const original = JSON.parse(fs.readFileSync('/Users/andrew.dench/Documents/nfc-ips/ips-fhir-json-1.json'));

const entryDiff = diff.find(d => d.path === 'entry');
const reconstructed = entryDiff.right;

// Find missing Observation
const originalObs = original.entry.filter(e => e.resource.resourceType === 'Observation').map(e => e.resource.id);
const reconObs = reconstructed.filter(e => e.resource.resourceType === 'Observation').map(e => e.resource.id);
const missingObs = originalObs.filter(id => !reconObs.includes(id));

console.log('Missing Observation (' + missingObs.length + '):');
missingObs.forEach(id => {
  const resource = original.entry.find(e => e.resource.id === id).resource;
  const category = resource.category?.[0]?.coding?.[0]?.code || 'unknown';
  const code = resource.code?.coding?.[0]?.code || resource.code?.text || 'unknown';
  console.log('  ' + id.padEnd(30) + ' | category: ' + category.padEnd(12) + ' | code: ' + code);
});

// Find missing Condition
const originalCond = original.entry.filter(e => e.resource.resourceType === 'Condition').map(e => e.resource.id);
const reconCond = reconstructed.filter(e => e.resource.resourceType === 'Condition').map(e => e.resource.id);
const missingCond = originalCond.filter(id => !reconCond.includes(id));

console.log('\nMissing Condition (' + missingCond.length + '):');
missingCond.forEach(id => {
  const resource = original.entry.find(e => e.resource.id === id).resource;
  const code = resource.code?.coding?.[0]?.code || 'unknown';
  console.log('  ' + id.padEnd(30) + ' | code: ' + code);
});

// Find MedicationAdministrations that became Procedures
const originalMedAdmin = original.entry.filter(e => e.resource.resourceType === 'MedicationAdministration');
const reconProc = reconstructed.filter(e => e.resource.resourceType === 'Procedure');

console.log('\nOriginal MedicationAdministrations (4):');
originalMedAdmin.forEach(entry => {
  const code = entry.resource.medicationCodeableConcept?.coding?.[0]?.code || 'unknown';
  console.log('  ' + entry.resource.id.padEnd(30) + ' | code: ' + code);
});

console.log('\nReconstructed Procedures (6 - should be 2):');
reconProc.forEach(entry => {
  const code = entry.resource.code?.coding?.[0]?.code || 'unknown';
  console.log('  ' + entry.resource.id.padEnd(30) + ' | code: ' + code);
});
