const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ui/table.tsx', 'utf-8');

// Remove overflow-x-auto to prevent the table container from clipping absolutely positioned dropdowns
content = content.replace('className="relative w-full overflow-x-auto"', 'className="relative w-full overflow-visible"');

fs.writeFileSync('frontend/src/components/ui/table.tsx', content, 'utf-8');
console.log("Removed overflow clipping from table component");
