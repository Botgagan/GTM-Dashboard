const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(
    `import { Send, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Edit, Trash, Plus, Link as LinkIcon, Search, Play, Activity, RefreshCw, Users, Calendar, Settings, Loader2 } from 'lucide-react';`,
    `import { Send, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Edit, Trash, Plus, Link as LinkIcon, Search, Play, Activity, RefreshCw, Users, Calendar, Settings, Loader2, X } from 'lucide-react';`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Added X import");
