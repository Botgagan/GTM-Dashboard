const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /<TableCell className="whitespace-nowrap">\s*\{event\.event_date \? \([\s\S]*?<TableCell className="max-w-\[200px\] whitespace-normal">\s*\{event\.location \? \([\s\S]*?<\/TableCell>/;

const newViewBlock = `<TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_date || 'N/A'}</span></TableCell>
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
      </TableCell>`;

if (content.match(regex)) {
    content = content.replace(regex, newViewBlock);
    console.log("Successfully replaced EditableEventRow view block!");
} else {
    console.log("Failed to match EditableEventRow regex");
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
