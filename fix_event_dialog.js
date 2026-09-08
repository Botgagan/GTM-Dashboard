const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');

// 1. Remove buttons from DialogHeader
content = content.replace(
    /<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/DialogHeader>/,
    `</DialogHeader>`
);

// 2. Fix main content div to be scrollable
content = content.replace(
    /<div className="p-6 space-y-8 bg-slate-50\/50 rounded-b-lg">/,
    `<div className="p-6 space-y-8 bg-slate-50/50 overflow-y-auto flex-1">`
);

// 3. Add DialogFooter with the buttons right before </DialogContent>
content = content.replace(
    /<\/div>\s*<\/DialogContent>/,
    `</div>
                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSaving ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : null}
                        Save Event
                    </Button>
                </DialogFooter>
            </DialogContent>`
);

fs.writeFileSync('frontend/src/EditableEventForm.tsx', content, 'utf-8');
console.log("Updated EditableEventForm perfectly");
