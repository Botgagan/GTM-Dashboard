const fs = require('fs');

function fixCn(file) {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('import { cn } from "cn"')) {
        content = content.replace('import { cn } from "cn"', 'import { cn } from "@/lib/utils"');
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`Fixed cn import in ${file}`);
    }
}

fixCn('frontend/src/components/ui/calendar.tsx');
fixCn('frontend/src/components/ui/popover.tsx');
