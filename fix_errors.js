const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Fix imports
content = `import { Calendar as CalendarUI } from "@/components/ui/calendar";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { X } from "lucide-react";\n` + content;

// Fix TS errors in ScrapedEventsPanel
content = content.replace(`let payload = {};`, `let payload: any = {};`);

// Fix TS errors in EditableEventRow
content = content.replace(`function EditableEventRow({ event, orgId, onSendEvent, onRefresh }: any)`, `export function EditableEventRow({ event, orgId, onSendEvent, onRefresh, setIsEditing, handleDelete }: any)`);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed App.tsx imports and types");
