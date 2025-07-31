const http = require('http');

// Simple test script to verify the application is working
function testEndpoint(path, expectedStatus = 200) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 8080,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === expectedStatus) {
                    console.log(`${path} - Status: ${res.statusCode}`);
                    resolve({ status: res.statusCode, data: data });
                } else {
                    console.log(`${path} - Expected: ${expectedStatus}, Got: ${res.statusCode}`);
                    reject(new Error(`Unexpected status code: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (err) => {
            console.log(`${path} - Error: ${err.message}`);
            reject(err);
        });

        req.setTimeout(5000, () => {
            console.log(`${path} - Timeout`);
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('Starting Weather Dashboard Tests...\n');
    
    try {
        // Test health endpoint
        await testEndpoint('/health');
        
        // Test main page
        await testEndpoint('/');
        
        // Test weather API with valid coordinates
        await testEndpoint('/api/weather?latitude=40.7128&longitude=-74.0060');
        
        // Test analytics endpoint
        await testEndpoint('/api/analytics');
        
        // Test invalid coordinates 
        await testEndpoint('/api/weather?latitude=invalid&longitude=invalid', 400);
        
        // Test missing parameters 
        await testEndpoint('/api/weather', 400);
        
        console.log('\nAll tests passed! Application is working correctly.');
        
    } catch (error) {
        console.log('\nTests failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { testEndpoint, runTests };