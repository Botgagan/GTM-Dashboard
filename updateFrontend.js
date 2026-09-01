const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const oldMap = `            if (data.googleBusinessLink) setGoogleLink(data.googleBusinessLink);`;
const newMap = `            if (data.googleBusinessLink) setGoogleLink(data.googleBusinessLink);\n            if (data.logo) setLogo(data.logo);\n            if (data.images && data.images.length > 0) setImages(data.images);`;

content = content.replace(oldMap, newMap);
fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Frontend EditableOrgForm updated for images/logo.");
