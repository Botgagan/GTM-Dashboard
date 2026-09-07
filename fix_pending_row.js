const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldRowBlockRegex = /<TableCell className="whitespace-nowrap">\s*<span className="font-semibold text-slate-900 text-\[11px\]">\{dateDisplay\}<\/span>\s*<\/TableCell>\s*<TableCell className="max-w-\[200px\] whitespace-normal">[\s\S]*?<\/TableCell>/;

const newRowBlock = `<TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.startTime || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endDate || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endTime || 'N/A'}</span></TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = payload.contactInfo?.city || ev?.city;
           const area = payload.finalLocation || ev?.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>`;

if (content.match(oldRowBlockRegex)) {
    content = content.replace(oldRowBlockRegex, newRowBlock);
    console.log("Successfully fixed PendingEventRow!");
} else {
    console.log("Failed to match oldRowBlockRegex in PendingEventRow");
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
