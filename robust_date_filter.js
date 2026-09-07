const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /const year = date\.getFullYear\(\);\s*const month = String\(date\.getMonth\(\) \+ 1\)\.padStart\(2, '0'\);\s*const day = String\(date\.getDate\(\)\)\.padStart\(2, '0'\);\s*const dateString = `\$\{year\}-\$\{month\}-\$\{day\}`;\s*return ev\.date === dateString;/g;

const replacement = `if (!ev.date) return false;
        let evDate = new Date(ev.date);
        
        // Handle strict DD-MM-YYYY or MM-DD-YYYY if JS fails
        if (isNaN(evDate.getTime()) && ev.date.includes('/')) {
            const parts = ev.date.split('/');
            if (parts.length === 3) {
                // assume DD/MM/YYYY for Indian events if MM > 12, or just let Date parse it
                evDate = new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}\`);
                if (isNaN(evDate.getTime())) {
                   evDate = new Date(\`\${parts[2]}-\${parts[0]}-\${parts[1]}\`);
                }
            }
        }
        
        if (!isNaN(evDate.getTime())) {
            return evDate.getFullYear() === date.getFullYear() &&
                   evDate.getMonth() === date.getMonth() &&
                   evDate.getDate() === date.getDate();
        }
        return false;`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Made date filter comparison robust against varying AI date formats");
} else {
    console.log("Could not find date comparison logic to replace");
}
