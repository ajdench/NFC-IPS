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
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Error decoding Base64: ", e);
        return null;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// --- DATA FUNCTIONS ---

async function getIPSData() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const decodedJson = decodeBase64(hash);
        if (decodedJson) {
            try {
                return JSON.parse(decodedJson);
            } catch (e) {
                console.error("Error parsing JSON from URL:", e);
            }
        }
    }
    try {
        const response = await fetch('default-ips.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching default patient data:', error);
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
        // Add a data attribute to easily select the box later
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
        { label: 'Service Number', value: patientData.identifier?.find(id => id.type?.text === 'Service Number')?.value },
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
    } else {
        patientTitle.textContent = 'Patient (No data)';
    }
}

function renderMainContent(ipsData) {
    const container = document.querySelector('.main-content-wrapper .container');
    if (!container) return;
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'info-title';
    title.textContent = 'Payload';
    container.appendChild(title);

    if (ipsData) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-all';
        pre.textContent = JSON.stringify(ipsData, null, 2);
        container.appendChild(pre);
    } else {
        const p = document.createElement('p');
        p.textContent = 'Error: Could not load or parse IPS data. Please check the console for details.';
        p.style.color = 'var(--text-color-error)';
        container.appendChild(p);
    }
}

// --- INITIALIZATION ---

async function init() {
    createInfoBoxes(); // Create the static layout first
    const ipsData = await getIPSData();
    renderPatientBox(ipsData);
    renderMainContent(ipsData);
}

document.addEventListener('DOMContentLoaded', init);
