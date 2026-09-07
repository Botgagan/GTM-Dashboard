const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /const dateDisplay = formatEventDateTimeString\([\s\S]*?payload\.mappedEventData\?\.timezoneOffset\s*\);/;

if (content.match(regex)) {
    content = content.replace(regex, '');
    console.log("Removed unused dateDisplay");
} else {
    console.log("Could not find dateDisplay");
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
