# SNOMED CT API Quick Reference

## ✅ Working API (Development/Testing)

**Base URL**: `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/`

### Endpoints

**Concept Lookup by ID**:
```bash
curl "https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts/233604007"
```

**Search by Term**:
```bash
curl "https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/MAIN/concepts?term=pneumonia&limit=10"
```

### Response Format
```json
{
  "conceptId": "233604007",
  "active": true,
  "fsn": {
    "term": "Pneumonia (disorder)",
    "lang": "en"
  },
  "pt": {
    "term": "Pneumonia",
    "lang": "en"
  }
}
```

## Usage with Node.js

```javascript
const https = require('https');

async function lookupSnomedCode(code) {
  const url = `https://snowstorm-training.snomedtools.org/snowstorm/snomed-ct/browser/MAIN/concepts/${code}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const result = JSON.parse(data);
        resolve({
          code: code,
          valid: result.conceptId ? true : false,
          display: result.pt?.term || result.fsn?.term
        });
      });
    }).on('error', reject);
  });
}
```

## Validator Script

Use the pre-built validator:
```bash
node validate-snomed-snowstorm.cjs [codes...]
```

Or validate all codes in YAML:
```bash
node validate-snomed-snowstorm.cjs
```

## Important Notes

- ⚠️ **NOT for production** - Training instance only
- 📝 International SNOMED CT edition (not UK-specific codes)
- 🕐 Rate limiting: 200ms delay between requests recommended
- 📋 For production: Use NHS Terminology Server or local Snowstorm instance

## API Documentation

- Official Snowstorm API docs: https://github.com/IHTSDO/snowstorm/blob/master/docs/using-the-api.md
- Snowstorm GitHub: https://github.com/IHTSDO/snowstorm
- SNOMED in 5 minutes: http://snomedin5minutes.org/

## Known Issues

❌ **Not working** (as of 2025-10-03):
- `browser.ihtsdotools.org` - ECONNREFUSED
- `snowstorm.ihtsdotools.org` - ECONNREFUSED  
- `lookup.snomedtools.org` - ECONNREFUSED
- `ontology.nhs.uk/production1/fhir` - CodeSystem not found errors (requires auth)
