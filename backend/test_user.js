const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: 'C:/event scraping demo/backend/.env' });
async function testAdminId(adminId) {
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
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    formData.append('logo', dummyBuffer, { filename: 'dummy.png', contentType: 'image/png' });
    const headers = { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.COHORT_ACCESS_TOKEN}` };
    try {
        const response = await axios.post('https://devapi.cohort.social/organization', formData, { headers });
        console.log(`? SUCCESS -> Org ID: ${response.data?.data?.id || response.data?.data?.organization?.id}`);
    } catch (error) {
        console.error(`? FAILED -> ${JSON.stringify(error.response?.data?.errors || error.message)}`);
    }
}
testAdminId('28f6f32a-97fc-4b80-b1dd-30a3933858a4');
