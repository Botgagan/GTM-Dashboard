const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Remove openDirection
content = content.replace(/  const \[openDirection, setOpenDirection\] = useState\<'down' \| 'up'\>\('down'\);\r?\n/, '');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Removed unused openDirection state");
