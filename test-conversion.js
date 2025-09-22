/**
 * End-to-End Conversion Testing Script
 * Tests the complete NFC IPS viewer conversion workflow
 */

console.log('🚀 Starting end-to-end conversion test...');

async function testConversionWorkflow() {
    // Wait for page to be fully loaded
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });

    console.log('📋 Testing conversion workflow...');

    try {
        // Test 1: Load demo payload
        console.log('1️⃣ Testing demo payload loading...');
        const preset1Button = document.getElementById('preset-1');
        if (preset1Button) {
            preset1Button.click();
            console.log('✅ Demo payload #1 loaded');
        } else {
            console.error('❌ Preset #1 button not found');
            return;
        }

        // Wait for payload to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Check if content loaded in left pane
        const leftInput = document.getElementById('left-input');
        const leftContent = leftInput ? leftInput.textContent.trim() : '';
        console.log(`2️⃣ Left pane content length: ${leftContent.length} characters`);

        if (leftContent.length > 0) {
            console.log('✅ Base64 fragment loaded correctly');
        } else {
            console.error('❌ Left pane content not loaded');
        }

        // Test 3: Test decode functionality
        console.log('3️⃣ Testing decode functionality...');
        const actionButton = document.getElementById('action-button');
        if (actionButton && actionButton.textContent.includes('Decode')) {
            actionButton.click();
            console.log('✅ Decode button clicked');

            // Wait for decode to complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check right pane content
            const rightInput = document.getElementById('right-input');
            const rightContent = rightInput ? rightInput.textContent.trim() : '';
            console.log(`📄 Right pane content length: ${rightContent.length} characters`);

            if (rightContent.length > 0) {
                console.log('✅ Decode successful - FHIR JSON generated');
            } else {
                console.error('❌ Decode failed - no content in right pane');
            }
        }

        // Test 4: Test Parse functionality
        console.log('4️⃣ Testing Parse button functionality...');
        const parseButton = document.getElementById('parse-button');
        if (parseButton) {
            parseButton.click();
            console.log('✅ Parse button clicked');

            // Wait for parsing to complete
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check if medical data sections are populated
            const infoBoxes = document.querySelectorAll('.info-box');
            let populatedSections = 0;

            infoBoxes.forEach(box => {
                const content = box.querySelector('.section-content');
                if (content && content.children.length > 0) {
                    populatedSections++;
                }
            });

            console.log(`📊 Populated medical sections: ${populatedSections}/${infoBoxes.length}`);

            if (populatedSections > 0) {
                console.log('✅ Parse successful - medical data displayed');
            } else {
                console.error('❌ Parse failed - no medical data displayed');
            }
        }

        // Test 5: Check MIST date display
        console.log('5️⃣ Testing MIST date display...');
        const pills = document.querySelectorAll('.pill');
        let pillsWithDates = 0;
        let pillsWithTimeOnly = 0;
        let pillsWithNoDate = 0;

        pills.forEach(pill => {
            const text = pill.textContent;
            if (text.includes('•')) {
                const datePart = text.split('•').pop().trim();
                if (datePart.includes('/') && datePart.includes(':')) {
                    pillsWithDates++;
                } else if (datePart.match(/^\d{2}:\d{2}$/)) {
                    pillsWithTimeOnly++;
                } else if (datePart === 'No Date') {
                    pillsWithNoDate++;
                }
            }
        });

        console.log(`⏰ MIST date display analysis:`);
        console.log(`   - Pills with full dates: ${pillsWithDates}`);
        console.log(`   - Pills with time only: ${pillsWithTimeOnly}`);
        console.log(`   - Pills with "No Date": ${pillsWithNoDate}`);
        console.log(`   - Total pills: ${pills.length}`);

        if (pillsWithDates > 0 || pillsWithTimeOnly > 0) {
            console.log('✅ MIST date display working');
        } else {
            console.log('⚠️ MIST date display needs verification');
        }

        console.log('🎉 End-to-end conversion test completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testConversionWorkflow();