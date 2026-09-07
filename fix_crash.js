const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const pendingRowOld = `      <TableCell className="whitespace-nowrap">
        <span className="font-semibold text-slate-900 text-[11px]">{dateDisplay}</span>
      </TableCell>`;
const pendingRowNew = `      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.startTime || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endDate || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endTime || 'N/A'}</span></TableCell>`;
content = content.replace(pendingRowOld, pendingRowNew);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Replaced dateDisplay with 4 columns in PendingEventRow");
