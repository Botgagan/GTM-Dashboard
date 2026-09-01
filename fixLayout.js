const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const oldLayout = `<div className="bg-white border rounded-lg p-5 shadow-sm space-y-6 flex gap-8">`;
const newLayout = `<div className="bg-white border rounded-lg p-5 shadow-sm flex flex-col gap-6">`;

content = content.replace(oldLayout, newLayout);
fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Layout fixed to vertical stacking.");
