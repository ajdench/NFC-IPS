// Payload Page Controller
document.addEventListener('DOMContentLoaded', () => {
    console.log('Payload page initializing...');

    const toolkit = window.NfcIps;
    if (!toolkit) {
        console.error('NfcIps toolkit not available; aborting payload encoder setup.');
        return;
    }

    const { showMessage, encodeFhirToFragment } = toolkit;

    // Navigation
    const mainTitle = document.getElementById('main-title');
    mainTitle.addEventListener('click', () => {
        window.location.href = 'viewer.html';
    });

    // Pane elements
    const panes = {
        topLeft: {
            input: document.getElementById('top-left-input'),
            charCount: document.getElementById('top-left-char-count'),
            title: document.getElementById('top-left-title'),
            action: document.getElementById('top-left-action')
        },
        topRight: {
            input: document.getElementById('top-right-input'),
            charCount: document.getElementById('top-right-char-count'),
            title: document.getElementById('top-right-title')
        },
        bottomLeft: {
            input: document.getElementById('bottom-left-input'),
            charCount: document.getElementById('bottom-left-char-count'),
            title: document.getElementById('bottom-left-title'),
            action: document.getElementById('bottom-left-action')
        },
        bottomRight: {
            input: document.getElementById('bottom-right-input'),
            charCount: document.getElementById('bottom-right-char-count'),
            title: document.getElementById('bottom-right-title')
        }
    };

    // Character count updates
    function updateCharCount(inputElement, countElement) {
        const text = inputElement.textContent || '';
        const count = text.length;
        countElement.textContent = `${count.toLocaleString()} characters`;
    }

    // Add input listeners for character counting
    Object.values(panes).forEach(pane => {
        if (pane.input && pane.charCount) {
            pane.input.addEventListener('input', () => updateCharCount(pane.input, pane.charCount));
        }
    });

    // Title toggle functionality (for right panes)
    function setupTitleToggle(titleElement, outputElement) {
        titleElement.addEventListener('click', () => {
            const currentFormat = titleElement.getAttribute('data-format');
            if (currentFormat === 'fragment') {
                titleElement.setAttribute('data-format', 'fhir');
                titleElement.textContent = 'IPS FHIR JSON';
            } else {
                titleElement.setAttribute('data-format', 'fragment');
                titleElement.textContent = 'URL Fragment';
            }
        });
    }

    setupTitleToggle(panes.topRight.title, panes.topRight.input);
    setupTitleToggle(panes.bottomRight.title, panes.bottomRight.input);

    // Encode/Decode functionality
    async function performEncode(sourceElement, targetElement) {
        try {
            const inputText = sourceElement.textContent.trim();
            if (!inputText) {
                showMessage('No input to encode', 'warning');
                return;
            }

            // Parse as JSON first to validate
            const parsedJson = JSON.parse(inputText);

            if (typeof encodeFhirToFragment !== 'function') {
                showMessage('Encoding functions not available', 'error');
                return;
            }

            const { fragment } = await encodeFhirToFragment(parsedJson);
            targetElement.textContent = fragment;
            updateCharCount(targetElement, targetElement.parentElement.querySelector('.char-count'));
            showMessage('Successfully encoded to URL fragment', 'success');
        } catch (error) {
            console.error('Encoding error:', error);
            showMessage('Error encoding: ' + error.message, 'error');
        }
    }

    // Action button handlers
    panes.topLeft.action.addEventListener('click', () => {
        performEncode(panes.topLeft.input, panes.topRight.input);
    });

    panes.bottomLeft.action.addEventListener('click', () => {
        performEncode(panes.bottomLeft.input, panes.bottomRight.input);
    });

    // Load initial content
    loadInitialContent();

    function loadInitialContent() {
        // Load current IPS FHIR from main page if available
        const storedFhir = localStorage.getItem('currentIpsFhir');
        if (storedFhir) {
            panes.topLeft.input.textContent = storedFhir;
            updateCharCount(panes.topLeft.input, panes.topLeft.charCount);
        }

        // Load simplified template
        const simplifiedTemplate = createSimplifiedTemplate();
        panes.bottomLeft.input.textContent = simplifiedTemplate;
        updateCharCount(panes.bottomLeft.input, panes.bottomLeft.charCount);
    }

    function createSimplifiedTemplate() {
        return JSON.stringify({
            "resourceType": "Bundle",
            "id": "[BUNDLE_ID]",
            "type": "document",
            "timestamp": "[TIMESTAMP]",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": "[PATIENT_ID]",
                        "identifier": [
                            {
                                "system": "https://fhir.nhs.uk/Id/nhs-number",
                                "value": "[NHS_NUMBER]"
                            }
                        ],
                        "name": [
                            {
                                "family": "[LAST_NAME]",
                                "given": ["[FIRST_NAME]"]
                            }
                        ],
                        "gender": "[GENDER]",
                        "birthDate": "[YYYY-MM-DD]"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "[OBSERVATION_ID]",
                        "status": "final",
                        "category": [
                            {
                                "coding": [
                                    {
                                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                        "code": "vital-signs"
                                    }
                                ]
                            }
                        ],
                        "code": {
                            "coding": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "[LOINC_CODE]",
                                    "display": "[VITAL_NAME]"
                                }
                            ]
                        },
                        "subject": {
                            "reference": "Patient/[PATIENT_ID]"
                        },
                        "valueQuantity": {
                            "value": "[VALUE]",
                            "unit": "[UNIT]"
                        },
                        "effectiveDateTime": "[TIMESTAMP]"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Condition",
                        "id": "[CONDITION_ID]",
                        "clinicalStatus": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                    "code": "active"
                                }
                            ]
                        },
                        "code": {
                            "coding": [
                                {
                                    "system": "http://snomed.info/sct",
                                    "code": "[SNOMED_CODE]",
                                    "display": "[CONDITION_NAME]"
                                }
                            ]
                        },
                        "subject": {
                            "reference": "Patient/[PATIENT_ID]"
                        },
                        "onsetDateTime": "[TIMESTAMP]"
                    }
                }
            ]
        }, null, 2);
    }

    // Initialize character counts
    Object.values(panes).forEach(pane => {
        if (pane.input && pane.charCount) {
            updateCharCount(pane.input, pane.charCount);
        }
    });

    console.log('Payload page initialized');
});
