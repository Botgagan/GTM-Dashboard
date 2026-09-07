const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldFooter = `<div className="border-t pt-2 mt-1">
                <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink (New Org)</Button>
                <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => setIsLinking(false)}>Cancel</Button>
              </div>`;

const newFooter = `<div className="border-t pt-2 mt-2 flex flex-col gap-1.5 pb-1">
                {isLinked && (
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink Org</Button>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setIsLinking(false)}>Cancel</Button>
              </div>`;

if (content.includes(oldFooter)) {
    content = content.replace(oldFooter, newFooter);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Updated combobox footer UI logic");
} else {
    console.log("Could not find footer logic in App.tsx");
}
