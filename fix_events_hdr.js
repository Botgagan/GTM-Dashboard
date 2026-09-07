const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldHeaders = `<TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>`;

const newHeaders = `<TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Location</TableHead>`;

if (content.includes(oldHeaders)) {
    content = content.replace(oldHeaders, newHeaders);
    console.log("Fixed EventsPanel headers");
} else {
    // Try with regex ignoring whitespace
    const headerRegex = /<TableHead>Event Title<\/TableHead>\s*<TableHead>Status<\/TableHead>\s*<TableHead>Date & Time<\/TableHead>\s*<TableHead>Location<\/TableHead>/;
    if (content.match(headerRegex)) {
        content = content.replace(headerRegex, newHeaders);
        console.log("Fixed EventsPanel headers via regex");
    } else {
        console.log("Failed to match EventsPanel headers");
    }
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
