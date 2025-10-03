#!/usr/bin/env node
/**
 * Updates ips-fhir-json-1.json Encounters to add proper type.coding structure
 * according to IPS-OPCP specification
 */

const fs = require('fs');
const path = require('path');

// Care stage mapping from IPS-OPCP-SPECIFICATION.md
const CARE_STAGE_MAPPING = {
  'poi': { code: 'poi', display: 'Point of Injury' },
  'casevac': { code: 'casevac', display: 'Casualty Evacuation' },
  'axp': { code: 'axp', display: 'Ambulance Exchange Point' },
  'medevac': { code: 'medevac', display: 'Medical Evacuation' },
  'r1_phec': { code: 'r1_phec', display: 'Role 1 PHEC' },
  'r1_phc': { code: 'r1_phc', display: 'Role 1 PHC' },
  'fwd_tacevac': { code: 'fwd_tacevac', display: 'Forward TACEVAC' },
  'r2': { code: 'r2_dhc', display: 'Role 2' },
  'rear_tacevac': { code: 'rear_tacevac', display: 'Rear TACEVAC' },
  'r3': { code: 'r3_dhc', display: 'Role 3' },
  'stratevac': { code: 'stratevac', display: 'STRATEVAC' }
};

const SYSTEM_URI = 'http://medis.org.uk/fhir/CodeSystem/opcp-care-stages';

function extractCareStageFromId(encounterId) {
  // Extract care stage from ID like "enc-poi-phcill" or "enc-r1_phec-phcill"
  const match = encounterId.match(/^enc-([^-]+)/);
  if (!match) return null;
  return match[1];
}

function updateEncounterType(encounter) {
  const careStageKey = extractCareStageFromId(encounter.id);
  if (!careStageKey || !CARE_STAGE_MAPPING[careStageKey]) {
    console.warn(`⚠️  Unknown care stage in Encounter ID: ${encounter.id}`);
    return encounter;
  }

  const mapping = CARE_STAGE_MAPPING[careStageKey];

  // Preserve existing text if present
  const existingText = encounter.type?.[0]?.text || null;

  // Create new type with coding
  encounter.type = [{
    coding: [{
      system: SYSTEM_URI,
      code: mapping.code,
      display: mapping.display
    }],
    text: existingText
  }];

  console.log(`✅ Updated ${encounter.id}: ${mapping.code} - ${mapping.display}`);
  return encounter;
}

function processBundle(filePath) {
  console.log(`\n📄 Reading ${filePath}...`);
  const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let encounterCount = 0;

  // Update all Encounter resources
  bundle.entry.forEach(entry => {
    if (entry.resource?.resourceType === 'Encounter') {
      updateEncounterType(entry.resource);
      encounterCount++;
    }
  });

  console.log(`\n✅ Updated ${encounterCount} Encounter resources`);

  // Write back to file
  const outputPath = filePath;
  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n💾 Saved to ${outputPath}`);
}

// Main execution
const filePath = path.join(__dirname, 'ips-fhir-json-1.json');
processBundle(filePath);

console.log('\n✨ Done!\n');
