const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Fix the mapping bug
content = content.replace(
    `            pendingScrapes.map(scrape => (`,
    `            filteredScrapes.map(scrape => (`
);

// 2. Add Clear button next to the PopoverTrigger
const oldToolbar = `<div className="flex justify-end p-3 border-b">
        <Popover open={open} onOpenChange={setOpen}>`;

const newToolbar = `<div className="flex justify-end items-center gap-2 p-3 border-b">
        {date && (
          <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="h-9 px-2 text-slate-500 hover:text-slate-700">
            <X className="w-4 h-4 mr-1" /> Clear Filter
          </Button>
        )}
        <Popover open={open} onOpenChange={setOpen}>`;

content = content.replace(oldToolbar, newToolbar);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed the mapping and added Clear button.");
