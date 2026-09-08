const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');

// Replace DialogContent and inner div
content = content.replace(
    /<DialogContent className="sm:max-w-\[700px\] max-h-\[90vh\] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none" >\s*<div className="bg-white rounded-lg flex flex-col w-full h-full border">/,
    `<DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">`
);

// Replace DialogHeader
content = content.replace(
    /<DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10 flex flex-row items-center justify-between rounded-t-lg">/,
    `<DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">`
);

// We need to remove the closing </div> that paired with the inner <div className="bg-white...">
// Looking for the closing </div> right before </DialogContent>
content = content.replace(
    /<\/div>\s*<\/DialogContent>/,
    `</DialogContent>`
);

// Look for the main content area which has `className="p-6 space-y-6 overflow-y-auto bg-slate-50/50"` or something similar.
// Actually let's check what it has currently.
fs.writeFileSync('frontend/src/EditableEventForm.tsx', content, 'utf-8');
console.log("Updated Dialog structure in EditableEventForm");
