const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Update TableRow to have elevated z-index when isLinking is true
const oldRow = `<TableRow className={cn("bg-white", isResolved && "opacity-60")}>`;
const newRow = `<TableRow className={cn("bg-white transition-all", isResolved && "opacity-60", isLinking && "relative z-50 shadow-sm")}>`;

// We also need to make sure the Actions TableCell is elevated
const oldCell = `<TableCell className="text-right align-middle relative">`;
const newCell = `<TableCell className={cn("text-right align-middle relative", isLinking && "z-50")}>`;

content = content.replace(oldRow, newRow);
content = content.replace(oldCell, newCell);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed CSS Stacking Context for dropdown");
