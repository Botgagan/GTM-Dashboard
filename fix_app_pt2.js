const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Stacked Location Column in PendingEventRow
const oldLocationRegex = /<TableCell className="max-w-\[200px\] whitespace-normal">[\s\S]*?<\/TableCell>\s*<TableCell>\s*<a href=\{scrape\.source_url\}/;

const newLocation = `<TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = payload.contactInfo?.city || ev?.city;
           const area = payload.finalLocation || ev?.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>
      <TableCell>
        <a href={scrape.source_url}`;

content = content.replace(oldLocationRegex, newLocation);


// 2. Fix the Combobox Footer in PendingEventRow
const oldComboboxFooterRegex = /<div className="border-t pt-2 mt-1">\s*<Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick=\{\(\) => handleLinkOrg\(null\)\}>Unlink \(New Org\)<\/Button>\s*<Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1" onClick=\{\(\) => setIsLinking\(false\)\}>Cancel<\/Button>\s*<\/div>/;

const newComboboxFooter = `<div className="border-t pt-2 mt-2 flex flex-col gap-1.5 pb-1">
                {isLinked && (
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink Org</Button>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setIsLinking(false)}>Cancel</Button>
              </div>`;

content = content.replace(oldComboboxFooterRegex, newComboboxFooter);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Restored PendingEventRow location and combobox UI");
