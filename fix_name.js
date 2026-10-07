const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf8');

content = content.replace(
    /formData\.append\('name', `\$\{organizerName\} \$\{Date\.now\(\)\}`\);/g,
    "formData.append('name', organizerName);"
);

fs.writeFileSync('backend/src/apiClient.ts', content);
console.log("Removed Date.now() from name.");
