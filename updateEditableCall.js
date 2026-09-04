const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const badEditableCall = `<EditableOrgForm 
          scrape={activeScrape} 
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />`;

const goodEditableCall = `<EditableOrgForm 
          scrape={activeScrape} 
          orgs={orgs}
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />`;

content = content.replace(badEditableCall, goodEditableCall);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated EditableOrgForm call in App.tsx to pass orgs array");
