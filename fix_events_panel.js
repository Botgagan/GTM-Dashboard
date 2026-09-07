const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Update EditableEventRow View Mode
const oldViewModeRegex = /<TableCell className="whitespace-nowrap">[\s\S]*?<TableCell className="max-w-\[200px\] whitespace-normal">[\s\S]*?<\/TableCell>\s*<TableCell>\s*\{event\.hind_url \?/g;

const newViewMode = `<TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_time || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_time || 'N/A'}</span></TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = event.city;
           const area = event.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>
      <TableCell>
        {event.hind_url ?`;

if (content.match(oldViewModeRegex)) {
    content = content.replace(oldViewModeRegex, newViewMode);
    console.log("Replaced EditableEventRow view mode");
} else {
    console.log("Could not find EditableEventRow view mode");
}

// 2. Update EventsPanel Headers
const oldHeadersRegex = /<TableHead>Event Title<\/TableHead>\s*<TableHead>Status<\/TableHead>\s*<TableHead>Date & Time<\/TableHead>\s*<TableHead>Location<\/TableHead>/;
const newHeaders = `<TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Location</TableHead>`;

if (content.match(oldHeadersRegex)) {
    content = content.replace(oldHeadersRegex, newHeaders);
    console.log("Replaced EventsPanel headers");
} else {
    console.log("Could not find EventsPanel headers");
    
    // Maybe it already has Start Date, Start Time? Wait, my earlier grep showed:
    /*
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Location</TableHead>
    */
    // Let me check if it's already split!
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
