const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add state and handler to PendingEventRow
const topOfComponent = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);`;

const newStates = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  const handleOpenSearch = (e: React.MouseEvent) => {
    if (isLinking) {
      setIsLinking(false);
      return;
    }
    const spaceBelow = window.innerHeight - e.clientY;
    if (spaceBelow < 320) {
      setOpenDirection('up');
    } else {
      setOpenDirection('down');
    }
    setIsLinking(true);
  };`;
content = content.replace(topOfComponent, newStates);

// 2. Change onClick for search button
const oldSearchButton = `<Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsLinking(!isLinking)} title="Search and Link to Existing Organization">`;
const newSearchButton = `<Button size="icon" variant="outline" className="h-8 w-8" onClick={handleOpenSearch} title="Search and Link to Existing Organization">`;
content = content.replace(oldSearchButton, newSearchButton);

// 3. Change dropdown absolute positioning
const oldDropdownDiv = `<div className="absolute right-0 top-12 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left">`;
const newDropdownDiv = `<div className={\`absolute right-0 \${openDirection === 'up' ? 'bottom-12 mb-2' : 'top-12'} w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left\`}>`;
content = content.replace(oldDropdownDiv, newDropdownDiv);

// 4. Hide Unlink button conditionally
const oldUnlink = `<Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink (New Org)</Button>`;
const newUnlink = `{isLinked && <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink (New Org)</Button>}`;
content = content.replace(oldUnlink, newUnlink);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx with smart dropdown positioning and conditional unlink");
