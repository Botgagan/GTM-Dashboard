const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

// 1. Set default googleLink
const oldState = `const [googleLink, setGoogleLink] = useState('');`;
const newState = `const [googleLink, setGoogleLink] = useState(originalPayload.googleBusinessLink || '');`;
content = content.replace(oldState, newState);

// 2. Disable Auto-Fill if no link
const oldButton = `<Button variant="secondary" className="h-10 px-4 whitespace-nowrap" onClick={handleSync} disabled={isSyncing || !orgName}>`;
const newButton = `<Button variant="secondary" className="h-10 px-4 whitespace-nowrap" onClick={handleSync} disabled={isSyncing || !googleLink}>`;
content = content.replace(oldButton, newButton);
content = content.replace(oldButton.replace(/\n/g, '\r\n'), newButton.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("EditableOrgForm updated for Google Maps link pre-fill and button disable.");
