const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Edit Mode
const oldEditRow = `<TableCell><Input className="h-8 text-xs" value={editData.event_date || ''} onChange={e => setEditData({...editData, event_date: e.target.value})} placeholder="Date/Time" /></TableCell>`;
const newEditRow = `<TableCell><Input className="h-8 text-xs w-[100px]" value={editData.start_date || ''} onChange={e => setEditData({...editData, start_date: e.target.value})} placeholder="Start Date" /></TableCell>
        <TableCell><Input className="h-8 text-xs w-[80px]" value={editData.start_time || ''} onChange={e => setEditData({...editData, start_time: e.target.value})} placeholder="Time" /></TableCell>
        <TableCell><Input className="h-8 text-xs w-[100px]" value={editData.end_date || ''} onChange={e => setEditData({...editData, end_date: e.target.value})} placeholder="End Date" /></TableCell>
        <TableCell><Input className="h-8 text-xs w-[80px]" value={editData.end_time || ''} onChange={e => setEditData({...editData, end_time: e.target.value})} placeholder="Time" /></TableCell>`;
content = content.replace(oldEditRow, newEditRow);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated edit mode in App.tsx");
