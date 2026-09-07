const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Update ScrapedEventsPanel Headers
content = content.replace(
  `<TableHead>Date & Time</TableHead>`,
  `<TableHead>Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>End Time</TableHead>`
);

// 2. Update EventsPanel Headers
content = content.replace(
  `<TableHead>Date & Time</TableHead>`,
  `<TableHead>Start Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>`
);

// 3. Update PendingEventRow
const oldPendingRowRegex = /<TableCell className="whitespace-nowrap">\s*<span className="font-semibold text-slate-900 text-\[11px\]">\{dateDisplay\}<\/span>\s*<\/TableCell>/;
const newPendingRow = `<TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev.date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev.startTime || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev.endDate || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev.endTime || 'N/A'}</span></TableCell>`;
content = content.replace(oldPendingRowRegex, newPendingRow);

// 4. Update PendingEventRow hide Edit button
const oldEditBtn = `<Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>`;
const newEditBtn = `{!isResolved && (
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
          )}`;
content = content.replace(oldEditBtn, newEditBtn);

// 5. Remove unused dateDisplay in PendingEventRow
const dateDisplayRegex = /  const dateDisplay = formatEventDateTimeString\([\s\S]*?\);\r?\n\r?\n/;
content = content.replace(dateDisplayRegex, '');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Re-applied table headers and PendingEventRow split");
