const fs = require('fs');
const diff = JSON.parse(fs.readFileSync('/Users/andrew.dench/Downloads/differences-9.json'));
const original = JSON.parse(fs.readFileSync('/Users/andrew.dench/Documents/nfc-ips/ips-fhir-json-1.json'));

const originalEncs = original.entry.filter(e => e.resource.resourceType === 'Encounter').map(e => ({id: e.resource.id, type: e.resource.type[0].coding[0].code}));

const entryDiff = diff.find(d => d.path === 'entry');
const reconstructedEncs = entryDiff.right.filter(e => e.resource.resourceType === 'Encounter').map(e => ({id: e.resource.id, type: e.resource.type[0].coding[0].code}));

console.log('Reconstructed encounters (' + reconstructedEncs.length + '):');
reconstructedEncs.forEach(enc => console.log('  ' + enc.id.padEnd(30) + ' | ' + enc.type));

console.log('\nMissing encounters:');
const missing = originalEncs.filter(o => !reconstructedEncs.find(r => r.id === o.id));
missing.forEach(enc => console.log('  ' + enc.id.padEnd(30) + ' | ' + enc.type));
