const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf8');

// Change signature
content = content.replace(
    /export async function createSubcommunity\(organizerName: string, phoneStr: string, emailStr: string\): Promise<string \| null> \{/,
    "export async function createSubcommunity(organizerName: string, phoneStr: string, emailStr: string, imageUrl?: string): Promise<string | null> {"
);

// Replace dummy image logic
const oldLogic = `    // Add dummy image
    const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    formData.append('image', dummyBuffer, { filename: 'dummy.jpg', contentType: 'image/jpeg' });`;

const newLogic = `    // Attach real image if provided, otherwise fallback to dummy
    let imageAttached = false;
    if (imageUrl && imageUrl.startsWith('http')) {
        try {
            const axios = require('axios');
            console.log(\`Downloading org image from \${imageUrl}...\`);
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data, 'binary');
            formData.append('image', buffer, { filename: 'org.jpg', contentType: 'image/jpeg' });
            imageAttached = true;
            console.log(\`? Org Image successfully attached.\`);
        } catch(e) {
            console.log(\`?? Failed to download org image. Falling back to dummy.\`);
        }
    }
    
    if (!imageAttached) {
        const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        formData.append('image', dummyBuffer, { filename: 'dummy.jpg', contentType: 'image/jpeg' });
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('backend/src/apiClient.ts', content);
console.log("Updated createSubcommunity");
