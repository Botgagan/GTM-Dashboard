const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regexClose = /<EditableOrgForm\s*scrape=\{activeScrape\}\s*orgs=\{orgs\}\s*onRefresh=\{onRefresh\}\s*onClose=\{\(\) => setExpandedPending\(null\)\}\s*\/>\s*\)\}\s*<\/>\s*\);\s*\}/m;

const newClose = `<EditableOrgForm 
          scrape={activeScrape} 
          orgs={orgs}
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />
      )}
    </div>
  );
}`;

if (regexClose.test(content)) {
    content = content.replace(regexClose, newClose);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Fixed the unclosed div syntax error");
} else {
    console.log("Regex match failed for close tag");
}
