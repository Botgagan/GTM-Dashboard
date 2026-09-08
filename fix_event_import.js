const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');

content = content.replace(
    /import \{ Dialog, DialogContent, DialogHeader, DialogTitle \} from "@\/components\/ui\/dialog";/,
    `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";`
);

fs.writeFileSync('frontend/src/EditableEventForm.tsx', content, 'utf-8');
console.log("Added DialogFooter import");
