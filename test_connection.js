const CORE_API_URL = 'http://localhost:3000';
const CORE_SYSTEM_SECRET = '962b32aafcf9995d6809f167941f4b2d5459dfe2b608afa72ac20492a83fb590';

async function test() {
    console.log(`Connecting to ${CORE_API_URL}/api/verify-session...`);
    try {
        const response = await fetch(`${CORE_API_URL}/api/verify-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CORE_SYSTEM_SECRET}`
            },
            body: JSON.stringify({ reference: 'test-ref-verification' })
        });

        const status = response.status;
        const data = await response.json().catch(() => ({}));
        console.log(`Status: ${status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`Fetch failed: ${e.message}`);

        if (e.message.includes('ECONNREFUSED')) {
            console.log('Trying 127.0.0.1 instead of localhost...');
            try {
                const response2 = await fetch(`http://127.0.0.1:3000/api/verify-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CORE_SYSTEM_SECRET}`
                    },
                    body: JSON.stringify({ reference: 'test-ref-verification' })
                });
                console.log(`Status (127.0.0.1): ${response2.status}`);
            } catch (e2) {
                console.error(`Fetch (127.0.0.1) failed: ${e2.message}`);
            }
        }
    }
}

test();
