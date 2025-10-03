#!/usr/bin/env node
/**
 * Test SNOMED hierarchy inference for allergy categories
 * Uses Snowstorm training API to traverse SNOMED CT relationships
 */

const https = require('https');

const SNOWSTORM_BASE = 'https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN';

// Test cases from ips-fhir-json-1.json
const TEST_ALLERGIES = [
  { code: '300913006', expectedCategory: 'food', description: 'Allergy to shellfish' }
];

// Known parent concepts for categorization
const CATEGORY_PARENTS = {
  '414285001': 'food',      // Food allergy
  '419199007': 'medication', // Allergy to substance
  '232347008': 'environment' // Dander (animal) allergy
};

async function lookupConcept(code) {
  return new Promise((resolve, reject) => {
    const url = `${SNOWSTORM_BASE}/concepts/${code}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getParents(code) {
  return new Promise((resolve, reject) => {
    const url = `${SNOWSTORM_BASE}/concepts/${code}/parents?stated=false&offset=0&limit=10`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.items || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function inferCategoryFromHierarchy(code, visited = new Set(), depth = 0) {
  if (depth > 10) return null; // Prevent infinite loops
  if (visited.has(code)) return null;
  visited.add(code);

  // Check if this code is a known category parent
  if (CATEGORY_PARENTS[code]) {
    return CATEGORY_PARENTS[code];
  }

  // Get parents and check recursively
  try {
    const parents = await getParents(code);

    for (const parent of parents) {
      const category = await inferCategoryFromHierarchy(parent.conceptId, visited, depth + 1);
      if (category) return category;
    }
  } catch (err) {
    console.error(`Error getting parents for ${code}:`, err.message);
  }

  return null;
}

async function testAllergyInference() {
  console.log('\n🧪 Testing SNOMED Hierarchy Inference for Allergy Categories\n');
  console.log('═'.repeat(80));

  for (const testCase of TEST_ALLERGIES) {
    console.log(`\n📋 Testing: ${testCase.code}`);

    try {
      // Lookup concept
      const concept = await lookupConcept(testCase.code);
      console.log(`   Display: ${concept.pt?.term || concept.fsn?.term}`);
      console.log(`   Expected category: ${testCase.expectedCategory}`);

      // Get immediate parents
      const parents = await getParents(testCase.code);
      console.log(`\n   Immediate parents (${parents.length}):`);
      parents.forEach(p => {
        console.log(`     • ${p.conceptId}: ${p.pt?.term || p.fsn?.term}`);
      });

      // Infer category
      console.log(`\n   🔍 Inferring category...`);
      const inferredCategory = await inferCategoryFromHierarchy(testCase.code);

      if (inferredCategory) {
        console.log(`   ✅ Inferred: ${inferredCategory}`);
        if (inferredCategory === testCase.expectedCategory) {
          console.log(`   ✅ MATCH! Category inference successful`);
        } else {
          console.log(`   ⚠️  MISMATCH: Expected ${testCase.expectedCategory}, got ${inferredCategory}`);
        }
      } else {
        console.log(`   ❌ Could not infer category from hierarchy`);
      }

    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Category Parent Concepts Used:\n');
  Object.entries(CATEGORY_PARENTS).forEach(([code, category]) => {
    console.log(`   ${code} → ${category}`);
  });

  console.log('\n💡 Recommendation:\n');
  console.log('   If hierarchy traversal works:');
  console.log('   • Store only SNOMED code in CodeRef');
  console.log('   • Infer category on decode using SNOMED API');
  console.log('   • Saves ~10 bytes per allergy');
  console.log('');
  console.log('   If hierarchy traversal fails:');
  console.log('   • Store category explicitly in CodeRef');
  console.log('   • More reliable, no API dependency');
  console.log('   • Costs ~10 bytes per allergy');

  console.log('\n✨ Test Complete!\n');
}

testAllergyInference().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
