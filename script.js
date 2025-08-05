// Function to decode Base64
function decodeBase64(str) {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        console.error("Error decoding Base64: ", e);
        return null;
    }
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to display patient data
async function displayPatientData() {
    const patientBox = document.querySelector('.info-box.grey');
    const patientTitle = patientBox.querySelector('.info-title');

    try {
        const response = await fetch('default-ips.json');
        const patientData = await response.json();

        const title = patientData.name[0].prefix ? patientData.name[0].prefix[0] : '';
        const forename = patientData.name[0].given ? patientData.name[0].given[0] : '';
        const surname = patientData.name[0].family ? patientData.name[0].family : '';
        const sex = patientData.gender ? patientData.gender : '';
        const dob = patientData.birthDate ? formatDate(patientData.birthDate) : '';

        let serviceNumber = '';
        let nhsNumber = '';

        patientData.identifier.forEach(identifier => {
            if (identifier.type && identifier.type.text === 'Service Number') {
                serviceNumber = identifier.value;
            }
            if (identifier.type && identifier.type.text === 'NHS Number') {
                nhsNumber = identifier.value;
            }
        });

        // Update the title of the box
        patientTitle.textContent = 'Patient';

        // Create a new paragraph for the patient details
        const detailsParagraph = document.createElement('p');
        detailsParagraph.textContent = `Title: ${title}, Forename: ${forename}, Surname: ${surname}, Sex: ${sex}, Date of Birth: ${dob}, Service Number: ${serviceNumber}, NHS Number: ${nhsNumber}`;
        
        // Append the new paragraph below the title
        patientBox.appendChild(detailsParagraph);

    } catch (error) {
        console.error('Error fetching or parsing patient data:', error);
        patientTitle.textContent = 'Patient (Error loading data)';
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', displayPatientData);