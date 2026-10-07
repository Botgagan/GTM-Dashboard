const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: 'C:/event scraping demo/backend/.env' });

async function testAdminId(adminId) {
    const apiUrl = `https://devapi.cohort.social/api/v1/organization`; // Wait, is it /api/v1/organization or just /organization? Let's check apiClient.ts again
    
    const contactInfoObj = { email: `test-admin-${Date.now()}@placeholder.com` };

    const formData = new FormData();
    formData.append('type', 'virtual');
    formData.append('joiningMethod', 'open-signup');
    formData.append('lockPermissionForOrganization', 'true');
    formData.append('adminId', adminId);
    formData.append('name', `Test Org ${Date.now()}`);
    formData.append('contactInfo', JSON.stringify(contactInfoObj));
    formData.append('philosophy', '684ee90a-6498-4c58-a425-bdbe93886eb7');
    formData.append('community', '69c6a422-3638-46b9-b27e-99c844adcfd8');
    
    const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    formData.append('logo', dummyBuffer, { filename: 'dummy.png', contentType: 'image/png' });

    const headers = { ...formData.getHeaders() };
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.post('https://devapi.cohort.social/organization', formData, { headers });
        console.log(`? SUCCESS with adminId: ${adminId} -> Org ID: ${response.data?.data?.id || response.data?.data?.organization?.id}`);
        return true;
    } catch (error) {
        console.error(`? FAILED with adminId: ${adminId} -> ${JSON.stringify(error.response?.data?.errors || error.message)}`);
        return false;
    }
}

async function run() {
    console.log("Testing original adminId...");
    const res1 = await testAdminId('df0e077b-a203-48a3-acc1-41da79656543');
    if (!res1) {
        console.log("\nTesting current adminId...");
        await testAdminId('c32158f7-91ab-40a2-a0bc-504d9a4f96fd');
    }
}

run();
