const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const badRow = `<TableCell className="whitespace-nowrap"><span className="font-medium text-[11px]">{event.end_time || 'N/A'}
      </TableCell>`;
const goodRow = `<TableCell className="whitespace-nowrap"><span className="font-medium text-[11px]">{event.end_time || 'N/A'}</span></TableCell>`;
content = content.replace(badRow, goodRow);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed missing closing span tag");
