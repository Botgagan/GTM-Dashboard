const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ui/table.tsx', 'utf-8');

// Restore overflow-x-auto so table horizontal scrolling works again
content = content.replace('className="relative w-full overflow-visible"', 'className="relative w-full overflow-x-auto"');

fs.writeFileSync('frontend/src/components/ui/table.tsx', content, 'utf-8');
console.log("Restored overflow-x-auto to table component");
