// --- CONFIGURATION ---

const infoBoxConfig = [
    { title: 'Patient', colorClass: 'grey', dataKey: 'patient' },
    { title: 'Point of Injury and/or Illness (POI)', colorClass: 'red', specialClass: 'poi-box' },
    { title: 'Casualty Evacuation (CASEVAC)', colorClass: 'orange' },
    { title: 'Medical Evacuation (MEDEVAC)', colorClass: 'yellow' },
    { title: 'Role 1 Care (R1)', colorClass: 'green' },
    { title: 'Role 2 Care (R2)', colorClass: 'blue' },
    { title: 'Role 3 Care (R3)', colorClass: 'purple' }
];

// --- UTILITY FUNCTIONS ---

function decodeBase64(str) {
    try {
        // Attempt to decode from Base64
        const decoded = atob(str);
        // Further check if the result is a valid JSON string, otherwise it might be random text
        JSON.parse(decoded);
        return decoded;
    } catch (e) {
        // If it fails, it's likely not Base64 or not valid JSON, so return the original string
        return str;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// --- DATA FUNCTIONS ---

async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching JSON from ${url}:`, error);
        return null;
    }
}

// --- RENDERING FUNCTIONS ---

function createInfoBoxes() {
    const container = document.getElementById('info-boxes-container');
    if (!container) return;

    infoBoxConfig.forEach(config => {
        const wrapperClass = config.specialClass ? 'poi-box-wrapper' : 'info-box-wrapper';
        const boxClass = config.specialClass ? 'poi-box' : `info-box ${config.colorClass}`;

        const wrapper = document.createElement('div');
        wrapper.className = wrapperClass;

        const box = document.createElement('div');
        box.className = boxClass;
        if(config.dataKey) box.dataset.key = config.dataKey;

        const title = document.createElement('h2');
        title.className = config.specialClass ? 'poi-title' : 'info-title';
        title.textContent = config.title;

        box.appendChild(title);
        wrapper.appendChild(box);
        container.appendChild(wrapper);
    });
}

function createPatientDetailsElement(patientData) {
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('patient-details-container');

    const name = patientData.name?.[0] || {};
    const details = [
        { label: 'Title', value: name.prefix?.[0] },
        { label: 'Forename', value: name.given?.[0] },
        { label: 'Surname', value: name.family },
        { label: 'Sex', value: patientData.gender },
        { label: 'Date of Birth', value: formatDate(patientData.birthDate) },
        { label: 'Service Number', value: patientData.identifier?.find(id => id.type?.coding?.some(c => c.code === 'MIL'))?.value },
        { label: 'NHS Number', value: patientData.identifier?.find(id => id.type?.text === 'NHS Number')?.value }
    ];

    details.forEach(detail => {
        if (detail.value) {
            const detailBox = document.createElement('div');
            detailBox.classList.add('detail-box');
            const labelSpan = document.createElement('span');
            labelSpan.classList.add('detail-label');
            labelSpan.textContent = detail.label;
            const valueSpan = document.createElement('span');
            valueSpan.classList.add('detail-value');
            valueSpan.textContent = detail.value;
            detailBox.appendChild(labelSpan);
            detailBox.appendChild(valueSpan);
            detailsContainer.appendChild(detailBox);
        }
    });
    return detailsContainer;
}

function addGhostItems(container, count) {
    for (let i = 0; i < count; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('detail-ghost-item');
        container.appendChild(ghost);
    }
}

function renderPatientBox(ipsData) {
    const patientBox = document.querySelector('[data-key="patient"]');
    if (!patientBox) return;

    const patientTitle = patientBox.querySelector('.info-title');
    const existingDetails = patientBox.querySelector('.patient-details-container');
    if (existingDetails) existingDetails.remove();

    if (ipsData && ipsData.resourceType === 'Patient') {
        patientTitle.textContent = 'Patient';
        const detailsElement = createPatientDetailsElement(ipsData);
        patientBox.appendChild(detailsElement);
        addGhostItems(detailsElement, 10);
    } else {
        patientTitle.textContent = 'Patient (No data)';
    }
}

function renderPayloadDisplay(data) {
    const payloadDisplay = document.getElementById('payload-display');
    if (payloadDisplay) {
        payloadDisplay.textContent = JSON.stringify(data, null, 2);
    }
}

function processAndRenderAll(ipsData) {
    if (!ipsData) {
        alert('Error: Could not load or parse IPS data.');
        return;
    }
    renderPatientBox(ipsData);
    renderPayloadDisplay(ipsData);
}

// --- INITIALIZATION ---

async function init() {
    createInfoBoxes();

    const payloadToggle = document.getElementById('payload-toggle');
    const parseButton = document.getElementById('parse-button');
    const jsonInput = document.getElementById('json-input');

    async function loadAndRenderPayload(payloadName) {
        const data = await fetchJson(payloadName);
        processAndRenderAll(data);
    }

    // Initial load
    loadAndRenderPayload('payload-1.json');

    // Event Listeners
    payloadToggle.addEventListener('change', () => {
        const selectedPayload = payloadToggle.checked ? 'payload-2.json' : 'payload-1.json';
        loadAndRenderPayload(selectedPayload);
    });

    parseButton.addEventListener('click', () => {
        const rawInput = jsonInput.textContent.trim();
        if (!rawInput) {
            alert('Input is empty.');
            return;
        }

        const decodedInput = decodeBase64(rawInput);
        
        try {
            const parsedJson = JSON.parse(decodedInput);
            processAndRenderAll(parsedJson);
        } catch (e) {
            alert('Invalid JSON. Please check the format.');
            console.error('Error parsing custom JSON:', e);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);