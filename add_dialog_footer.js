const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');
content = content.replace('  DialogTitle,\n} from "@/components/ui/dialog";', '  DialogTitle,\n  DialogFooter,\n} from "@/components/ui/dialog";');
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Imported DialogFooter");
