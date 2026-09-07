const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Fix edit button
content = content.replace(/<Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick=\{\(\) => setIsEditingEvent\(true\)\} title="Edit Event Details">[\s\S]*?<\/Button>/, `{!isResolved && (
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
          )}`);

// Remove dateDisplay block
content = content.replace(/const dateDisplay = formatEventDateTimeString\([\s\S]*?\);\s*return \(/, 'return (');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed the missed replacements robustly");
