#!/usr/bin/env node
/**
 * SNOMED CT Code Validator
 * Uses SNOMED International Snowstorm API for code validation
 *
 * API: https://snowstorm.ihtsdotools.org/fhir
 * License: Reference purposes only (not for production systems)
 */

const https = require('https');

const SNOWSTORM_FHIR_BASE = 'https://snowstorm.ihtsdotools.org/fhir';

/**
 * Lookup a SNOMED CT code using FHIR CodeSystem $lookup operation
 * @param {string} code - SNOMED CT code (e.g., "233604007")
 * @returns {Promise<Object>} - Lookup result with display name and details
 */
async function lookupSnomedCode(code) {
  const url = `${SNOWSTORM_FHIR_BASE}/CodeSystem/$lookup?system=http://snomed.info/sct&code=${code}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (res.statusCode === 200 && result.resourceType === 'Parameters') {
            // Extract display name from Parameters resource
            const displayParam = result.parameter?.find(p => p.name === 'display');
            const designationParams = result.parameter?.filter(p => p.name === 'designation') || [];

            resolve({
              code: code,
              valid: true,
              display: displayParam?.valueString || 'Unknown',
              designations: designationParams.map(d => d.part?.find(p => p.name === 'value')?.valueString).filter(Boolean),
              fullResponse: result
            });
          } else {
            resolve({
              code: code,
              valid: false,
              error: result.issue?.[0]?.diagnostics || 'Code not found',
              fullResponse: result
            });
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });
  });
}

/**
 * Validate multiple SNOMED codes
 * @param {string[]} codes - Array of SNOMED CT codes
 * @returns {Promise<Object[]>} - Array of validation results
 */
async function validateSnomedCodes(codes) {
  const results = [];

  for (const code of codes) {
    try {
      console.log(`Validating SNOMED CT code: ${code}...`);
      const result = await lookupSnomedCode(code);
      results.push(result);

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.valid) {
        console.log(`  ✅ ${code}: ${result.display}`);
      } else {
        console.log(`  ❌ ${code}: ${result.error}`);
      }
    } catch (error) {
      console.error(`  ❌ ${code}: ${error.message}`);
      results.push({
        code: code,
        valid: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Extract all SNOMED codes from preset-1-source.yaml
 */
function extractCodesFromYaml() {
  const fs = require('fs');
  const yaml = fs.readFileSync('./preset-1-source.yaml', 'utf8');

  // Extract all SNOMED codes (pattern: system: sct, code: "XXXXXXXX")
  const sctCodePattern = /code:\s*["']?(\d{6,18})["']?/g;
  const systemSctPattern = /system:\s*sct/g;

  const codes = new Set();
  const lines = yaml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line or previous line mentions 'sct' system
    const prevLine = i > 0 ? lines[i - 1] : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

    if (line.includes('system: sct') || prevLine.includes('system: sct') || nextLine.includes('system: sct')) {
      const match = line.match(/code:\s*["']?(\d{6,18})["']?/);
      if (match) {
        codes.add(match[1]);
      }
    }
  }

  return Array.from(codes);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - extract and validate all codes from YAML
    console.log('📋 Extracting SNOMED codes from preset-1-source.yaml...\n');
    const codes = extractCodesFromYaml();
    console.log(`Found ${codes.length} unique SNOMED codes\n`);

    validateSnomedCodes(codes).then(results => {
      console.log('\n📊 VALIDATION SUMMARY\n');
      console.log('='.repeat(60));

      const valid = results.filter(r => r.valid);
      const invalid = results.filter(r => !r.valid);

      console.log(`\n✅ Valid codes: ${valid.length}`);
      valid.forEach(r => {
        console.log(`   ${r.code}: ${r.display}`);
      });

      if (invalid.length > 0) {
        console.log(`\n❌ Invalid codes: ${invalid.length}`);
        invalid.forEach(r => {
          console.log(`   ${r.code}: ${r.error}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log(`\nTotal: ${results.length} codes (${valid.length} valid, ${invalid.length} invalid)`);

      // Export results to JSON
      const fs = require('fs');
      fs.writeFileSync('./snomed-validation-results.json', JSON.stringify(results, null, 2));
      console.log('\n💾 Results saved to: snomed-validation-results.json');
    }).catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    // Validate specific codes provided as arguments
    validateSnomedCodes(args).then(results => {
      results.forEach(r => {
        if (r.valid) {
          console.log(`${r.code}: ${r.display}`);
        } else {
          console.log(`${r.code}: ERROR - ${r.error}`);
        }
      });
    }).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  }
}

module.exports = { lookupSnomedCode, validateSnomedCodes };
