const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const regex = /const setClauses = fields\.map\(\(f, i\) => \`\$\{f\} = \$\{i \+ 2\}\`\)\.join\(', '\);/g;
const replacement = 'const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(\', \');';

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
    console.log("Fixed missing $ in updateOrganization query!");
} else {
    console.log("Regex not found in db.ts");
}
