const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const targetStr = `      <TableCell className="whitespace-nowrap">
        <span className="font-semibold text-slate-900 text-[11px]">{dateDisplay}</span>
      </TableCell>`;
      
const replaceStr = `      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.startTime || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endDate || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{ev?.endTime || 'N/A'}</span></TableCell>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Successfully replaced targetStr");
} else {
    console.log("targetStr NOT FOUND! Here is a debug of the surrounding area:");
    const idx = content.indexOf('{dateDisplay}');
    if (idx > -1) {
        console.log(content.substring(idx - 100, idx + 100));
    }
}
