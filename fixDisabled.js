const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

// Fix 1: handleSave
content = content.replace('disabled={!!linkedOrg}  disabled={isSaving}', 'disabled={!!linkedOrg || isSaving}');
content = content.replace('disabled={!!linkedOrg}  disabled={isSyncing}', 'disabled={!!linkedOrg || isSyncing}');

// Fix 2: inputs disabled
// Let's check lines 245 and 262
content = content.replace(/disabled=\{\!\!linkedOrg\} disabled/g, 'disabled={!!linkedOrg || ');
content = content.replace(/disabled=\{isUploadingImage\} disabled=\{\!\!linkedOrg\}/g, 'disabled={isUploadingImage || !!linkedOrg}');
content = content.replace(/disabled=\{isUploadingLogo\} disabled=\{\!\!linkedOrg\}/g, 'disabled={isUploadingLogo || !!linkedOrg}');

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Fixed double disabled");
