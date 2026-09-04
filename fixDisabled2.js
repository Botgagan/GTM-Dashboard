const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

content = content.replace('disabled={!!linkedOrg}  disabled={isUploadingImage}', 'disabled={!!linkedOrg || isUploadingImage}');
content = content.replace('disabled={!!linkedOrg}  disabled={isUploadingLogo}', 'disabled={!!linkedOrg || isUploadingLogo}');

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Fixed double disabled on inputs");
