/**
 * Generate Preset #4 Test FHIR Bundle
 * 3 vitals (Heart rate, Respiratory rate, Temperature) at all 11 care stages
 * 3 conditions at all 11 care stages
 * 3 events at all 11 care stages
 */

import fs from 'fs';

const careStages = [
  { code: 'poi', display: 'Point of Injury' },
  { code: 'casevac', display: 'Casualty Evacuation' },
  { code: 'axp', display: 'Ambulance Exchange Point' },
  { code: 'medevac', display: 'Medical Evacuation' },
  { code: 'r1_phec', display: 'Role 1 PHEC' },
  { code: 'r1_phc', display: 'Role 1 PHC' },
  { code: 'fwd_tacevac', display: 'Forward Tactical Evacuation' },
  { code: 'r2_dhc', display: 'Role 2 DHC' },
  { code: 'rear_tacevac', display: 'Rear Tactical Evacuation' },
  { code: 'r3_dhc', display: 'Role 3 DHC' },
  { code: 'stratevac', display: 'Strategic Evacuation' }
];

const vitals = [
  { loincCode: '8867-4', display: 'Heart rate', value: 80, unit: 'beats/min' },
  { loincCode: '9279-1', display: 'Respiratory rate', value: 16, unit: 'breaths/min' },
  { loincCode: '8310-5', display: 'Body temperature', value: 37.0, unit: 'Cel' }
];

const conditions = [
  { snomedCode: '386661006', display: 'Fever' },
  { snomedCode: '25064002', display: 'Headache' },
  { snomedCode: '62315008', display: 'Diarrhea' }
];

const events = [
  { snomedCode: '387517004', display: 'Paracetamol', dose: '500 mg', route: 'Oral' },
  { snomedCode: '372756006', display: 'Ibuprofen', dose: '400 mg', route: 'Oral' },
  { snomedCode: '387207008', display: 'Ondansetron', dose: '4 mg', route: 'Intravenous' }
];

const bundle = {
  resourceType: 'Bundle',
  id: 'ips-test-preset4',
  meta: {
    profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips']
  },
  type: 'document',
  timestamp: '2025-10-19T16:00:00Z',
  identifier: {
    system: 'urn:ietf:rfc:3986',
    value: 'urn:uuid:preset4-test-bundle'
  },
  entry: []
};

// Add Composition
bundle.entry.push({
  fullUrl: 'urn:uuid:composition-preset4',
  resource: {
    resourceType: 'Composition',
    id: 'composition-preset4',
    status: 'final',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '60591-5',
        display: 'Patient summary Document'
      }]
    },
    subject: { reference: 'urn:uuid:patient-preset4' },
    date: '2025-10-19T16:00:00Z',
    author: [{ display: 'Test System' }],
    title: 'International Patient Summary - Preset #4 Test',
    section: []
  }
});

// Add Patient
bundle.entry.push({
  fullUrl: 'urn:uuid:patient-preset4',
  resource: {
    resourceType: 'Patient',
    id: 'patient-preset4',
    name: [{
      given: ['Thomas'],
      family: 'Hodge'
    }],
    gender: 'male',
    birthDate: '1998-03-15'
  }
});

// Generate Encounters and Resources for each care stage
careStages.forEach((stage, stageIndex) => {
  const encounterUuid = `urn:uuid:encounter-${stage.code}`;
  const baseTime = new Date('2025-10-19T10:00:00Z');
  baseTime.setHours(baseTime.getHours() + stageIndex);

  // Create Encounter
  bundle.entry.push({
    fullUrl: encounterUuid,
    resource: {
      resourceType: 'Encounter',
      id: `encounter-${stage.code}`,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB'
      },
      type: [{
        coding: [{
          system: 'http://medis.org.uk/fhir/CodeSystem/opcp-care-stages',
          code: stage.code,
          display: stage.display
        }]
      }],
      subject: { reference: 'urn:uuid:patient-preset4' },
      period: {
        start: baseTime.toISOString()
      }
    }
  });

  // Add 3 Vitals (Observations)
  vitals.forEach((vital, vitalIndex) => {
    const vitalTime = new Date(baseTime);
    vitalTime.setMinutes(vitalTime.getMinutes() + (vitalIndex * 10));
    
    bundle.entry.push({
      fullUrl: `urn:uuid:obs-${stage.code}-${vitalIndex}`,
      resource: {
        resourceType: 'Observation',
        id: `obs-${stage.code}-${vitalIndex}`,
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: vital.loincCode,
            display: vital.display
          }]
        },
        subject: { reference: 'urn:uuid:patient-preset4' },
        encounter: { reference: encounterUuid },
        effectiveDateTime: vitalTime.toISOString(),
        valueQuantity: {
          value: vital.value + (stageIndex * 2),
          unit: vital.unit,
          system: 'http://unitsofmeasure.org',
          code: vital.unit
        }
      }
    });
  });

  // Add 3 Conditions
  conditions.forEach((condition, condIndex) => {
    const condTime = new Date(baseTime);
    condTime.setMinutes(condTime.getMinutes() + 30 + (condIndex * 5));
    
    bundle.entry.push({
      fullUrl: `urn:uuid:cond-${stage.code}-${condIndex}`,
      resource: {
        resourceType: 'Condition',
        id: `cond-${stage.code}-${condIndex}`,
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active'
          }]
        },
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: condition.snomedCode,
            display: condition.display
          }]
        },
        subject: { reference: 'urn:uuid:patient-preset4' },
        encounter: { reference: encounterUuid },
        recordedDate: condTime.toISOString()
      }
    });
  });

  // Add 3 Events (MedicationAdministrations)
  events.forEach((event, eventIndex) => {
    const eventTime = new Date(baseTime);
    eventTime.setMinutes(eventTime.getMinutes() + 50 + (eventIndex * 10));
    
    bundle.entry.push({
      fullUrl: `urn:uuid:med-${stage.code}-${eventIndex}`,
      resource: {
        resourceType: 'MedicationAdministration',
        id: `med-${stage.code}-${eventIndex}`,
        status: 'completed',
        medicationCodeableConcept: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: event.snomedCode,
            display: event.display
          }]
        },
        subject: { reference: 'urn:uuid:patient-preset4' },
        context: { reference: encounterUuid },
        effectiveDateTime: eventTime.toISOString(),
        dosage: {
          dose: {
            value: parseInt(event.dose),
            unit: event.dose.split(' ')[1]
          },
          route: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: event.route === 'Oral' ? '26643006' : '47625008',
              display: event.route
            }]
          }
        }
      }
    });
  });
});

console.log(`Generated FHIR Bundle with:`);
console.log(`  - ${careStages.length} Encounters (care stages)`);
console.log(`  - ${careStages.length * 3} Observations (vitals)`);
console.log(`  - ${careStages.length * 3} Conditions`);
console.log(`  - ${careStages.length * 3} MedicationAdministrations (events)`);
console.log(`  - Total: ${bundle.entry.length} entries`);

fs.writeFileSync('./ips-fhir-json-4.json', JSON.stringify(bundle, null, 2));
console.log('\nWritten to ips-fhir-json-4.json');
