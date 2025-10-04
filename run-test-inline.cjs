const http = require('http');

// Script to inject into page
const testScript = `
<script>
window.testResults = {};
window.addEventListener('load', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!window.pipelineValidator) {
        window.testResults.error = 'Validation framework not loaded';
        return;
    }

    try {
        await window.pipelineValidator.init();
        const result = await window.pipelineValidator.runTest('ips-fhir-json-1.json');
        
        const orig = await window.pipelineValidator.storage.getStage(result.testId, 'input_fhir');
        const recon = await window.pipelineValidator.storage.getStage(result.testId, 'fhir_reconstruction');
        
        const origStr = JSON.stringify(orig.data, null, 2);
        const reconStr = JSON.stringify(recon.data, null, 2);
        
        const diffs = window.pipelineValidator.deepCompare(orig.data, recon.data);
        
        window.testResults = {
            originalChars: origStr.length,
            reconstructedChars: reconStr.length,
            difference: reconStr.length - origStr.length,
            totalDifferences: diffs.length,
            differences: diffs.slice(0, 20)
        };
        
        console.log('TEST COMPLETE:', JSON.stringify(window.testResults, null, 2));
    } catch (error) {
        window.testResults.error = error.message;
        console.error('TEST ERROR:', error.message);
    }
});
</script>
`;

console.log('This approach requires browser automation.');
console.log('Installing puppeteer with: npm install puppeteer');
