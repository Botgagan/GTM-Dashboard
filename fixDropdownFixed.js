const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add buttonRef and dropdownStyle to PendingEventRow
const topOfComponent = `  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');`;
const newStates = `  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});`;
content = content.replace(topOfComponent, newStates);

// 2. Rewrite handleOpenSearch to calculate exact fixed coordinates
const oldHandleOpenSearch = `  const handleOpenSearch = (e: React.MouseEvent) => {
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
const newHandleOpenSearch = `  const handleOpenSearch = (e: React.MouseEvent) => {
    if (isLinking) {
      setIsLinking(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 320) {
        // Open upwards
        setDropdownStyle({
          position: 'fixed',
          top: Math.max(10, rect.top - 310),
          left: Math.max(10, rect.right - 300), // 300px width
        });
      } else {
        // Open downwards
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: Math.max(10, rect.right - 300),
        });
      }
    }
    setIsLinking(true);
  };`;
content = content.replace(oldHandleOpenSearch, newHandleOpenSearch);

// 3. Add ref to the search button
const oldSearchButton = `<Button size="icon" variant="outline" className="h-8 w-8" onClick={handleOpenSearch} title="Search and Link to Existing Organization">`;
const newSearchButton = `<Button ref={buttonRef} size="icon" variant="outline" className="h-8 w-8" onClick={handleOpenSearch} title="Search and Link to Existing Organization">`;
content = content.replace(oldSearchButton, newSearchButton);

// 4. Change dropdown from absolute to fixed with style
const oldDropdownDiv = `<div className={\`absolute right-0 \${openDirection === 'up' ? 'bottom-12 mb-2' : 'top-12'} w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left\`}>`;
const newDropdownDiv = `<div style={dropdownStyle} className="w-[300px] z-[99999] bg-white border shadow-lg rounded-md p-2 text-left">`;
content = content.replace(oldDropdownDiv, newDropdownDiv);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx to use React fixed portal logic");
