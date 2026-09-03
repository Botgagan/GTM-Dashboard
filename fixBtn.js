const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const badBtnText = `<Button onClick={submitManualOrg} disabled={!manualOrgModal.url}>Link & Push</Button>`;
const goodBtnText = `<Button onClick={submitManualOrg} disabled={!manualOrgModal.url}>Save</Button>`;
content = content.replace(badBtnText, goodBtnText);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Changed button text to Save");
