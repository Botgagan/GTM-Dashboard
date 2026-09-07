const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /\/\/ Format helper to match:[\s\S]*?function formatEventDateTimeString[\s\S]*?return res;\n    \} catch \(e\) \{\n      return \`\$\{d\} \$\{t\}\`;\n    \}\n  \};\n\n  let res = formatPart\(dateStr, startTime\);\n  if \(endDateStr && endDateStr !== "2026-08-15"\) \{\n    res \+= " to " \+ formatPart\(endDateStr, endTime\);\n  \}\n  \/\/ Append timezone indicator\n  res \+= " \(IST\)";\n  return res;\n}/;

if (content.match(regex)) {
    content = content.replace(regex, '');
    console.log("Removed formatEventDateTimeString");
} else {
    // try looser regex
    const looseRegex = /function formatEventDateTimeString[\s\S]*?return res;\n\}/;
    if (content.match(looseRegex)) {
        content = content.replace(looseRegex, '');
        console.log("Removed formatEventDateTimeString (loose)");
    } else {
        console.log("Could not find formatEventDateTimeString");
    }
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
