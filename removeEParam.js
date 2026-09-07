const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Remove 'e' param
content = content.replace(/const handleOpenSearch = \(e: React\.MouseEvent\) => \{/g, 'const handleOpenSearch = () => {');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Removed unused 'e' param");
