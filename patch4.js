const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add states
content = content.replace(
    "export default function App() {\n  const [url, setUrl] = useState('');",
    "export default function App() {\n  const [globalCityFilter, setGlobalCityFilter] = useState('All');\n  const [cities, setCities] = useState<string[]>([]);\n  const [url, setUrl] = useState('');"
);
content = content.replace(
    "export default function App() {\r\n  const [url, setUrl] = useState('');",
    "export default function App() {\r\n  const [globalCityFilter, setGlobalCityFilter] = useState('All');\r\n  const [cities, setCities] = useState<string[]>([]);\r\n  const [url, setUrl] = useState('');"
);

// 2. Fix the fetchDashboardData duplicate 'q'
const fetchDashboardDataRegex = /const fetchDashboardData = async \(\) => \{\s*try \{\s*const q = globalCityFilter !== 'All' \? `\?city=\$\{encodeURIComponent\(globalCityFilter\)\}` : '';\s*const res = await fetch\(`\$\{API_BASE\}\/dashboard\$\{q\}`\);\s*const data = await res\.json\(\);\s*setOrgs\(data\);\s*const q = globalCityFilter !== 'All' \? `\?city=\$\{encodeURIComponent\(globalCityFilter\)\}` : '';/g;

content = content.replace(fetchDashboardDataRegex, "const fetchDashboardData = async () => {\n    try {\n      const q = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n      const res = await fetch(`${API_BASE}/dashboard${q}`);\n      const data = await res.json();\n      setOrgs(data);");

// 3. Fix the SelectRootChangeEventDetails error
// Find <Select value={selectedLocation} onValueChange={(v) => setSelectedLocation(v || "All Locations")}>
// Actually it says line 591... let's fix it by casting to any or just (v: any)
content = content.replace(
    /onValueChange=\{\(v\) => setSelectedLocation\(v \|\| "All Locations"\)\}/g,
    "onValueChange={(v: any) => setSelectedLocation(v || \"All Locations\")}"
);

// 4. Fix hideClose error in EditableEventForm and EditableOrgForm
let eventForm = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');
eventForm = eventForm.replace(/hideClose/g, "");
fs.writeFileSync('frontend/src/EditableEventForm.tsx', eventForm, 'utf-8');

let orgForm = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');
orgForm = orgForm.replace(/hideClose/g, "");
fs.writeFileSync('frontend/src/EditableOrgForm.tsx', orgForm, 'utf-8');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch4 applied.");
