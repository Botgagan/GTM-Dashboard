const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add handleOpenSearch and buttonRef to PendingEventRow
const topOfComponent = `  const [isEditingEvent, setIsEditingEvent] = useState(false);`;
const newStates = `  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const handleOpenSearch = () => {
    if (isLinking) {
      setIsLinking(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 320) {
        setDropdownStyle({
          position: 'fixed',
          top: Math.max(10, rect.top - 310),
          left: Math.max(10, rect.right - 300),
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: Math.max(10, rect.right - 300),
        });
      }
    }
    setIsLinking(true);
  };`;
content = content.replace(topOfComponent, newStates);

// 2. Change search button onClick
content = content.replace(
  `<Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsLinking(!isLinking)} title="Search and Link to Existing Organization">`,
  `<Button ref={buttonRef} size="icon" variant="outline" className="h-8 w-8" onClick={handleOpenSearch} title="Search and Link to Existing Organization">`
);

// 3. Change dropdown styling
content = content.replace(
  `<div className="absolute right-0 top-12 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left">`,
  `<div style={dropdownStyle} className="w-[300px] z-[99999] bg-white border shadow-lg rounded-md p-2 text-left">`
);

// 4. Update EditableEventRow Read Mode specifically
const iifeRegex = /\{event\.event_date \? \(\s*<span className="font-semibold text-slate-900 text-\[11px\]">\{\s*\(\(\) => \{[\s\S]*?\}\)\(\)\s*\}<\/span>\s*\) : '-'\}/g;
content = content.replace(iifeRegex, `<span className="font-medium text-[11px]">{event.start_date || 'N/A'}</span></TableCell><TableCell className="whitespace-nowrap"><span className="font-medium text-[11px]">{event.start_time || 'N/A'}</span></TableCell><TableCell className="whitespace-nowrap"><span className="font-medium text-[11px]">{event.end_date || 'N/A'}</span></TableCell><TableCell className="whitespace-nowrap"><span className="font-medium text-[11px]">{event.end_time || 'N/A'}`);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Restored combobox logic and fixed read mode");
