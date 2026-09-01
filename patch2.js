const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add states to App
const appStartStr = "export default function App() {\n";
if (!content.includes('const [globalCityFilter')) {
    content = content.replace(
        appStartStr,
        appStartStr + "  const [globalCityFilter, setGlobalCityFilter] = useState('All');\n  const [cities, setCities] = useState<string[]>([]);\n"
    );
}

// 2. Add fetch cities to App
const fetchDashboardStr = "const fetchDashboardData = async () => {\n    try {\n      const res = await fetch(`${API_BASE}/dashboard`);";
if (content.includes(fetchDashboardStr)) {
    content = content.replace(
        "const fetchDashboardData = async () => {\n    try {\n      const res = await fetch(`${API_BASE}/dashboard`);",
        "const fetchCities = async () => {\n    try {\n      const res = await fetch(`${API_BASE}/cities`);\n      const data = await res.json();\n      setCities(['All', ...data.filter(Boolean)]);\n    } catch (e) { console.error(e); }\n  };\n\n  const fetchDashboardData = async () => {\n    try {\n      const q = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n      const res = await fetch(`${API_BASE}/dashboard${q}`);"
    );
} else {
    console.log("Could not find fetchDashboardData");
}

// Update pending-scrapes and scraped-urls in fetchDashboardData
content = content.replace(
    "const resPending = await fetch(`${API_BASE}/pending-scrapes`);",
    "const q = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n      const resPending = await fetch(`${API_BASE}/pending-scrapes${q}`);"
);
content = content.replace(
    "const scrapedRes = await fetch(`${API_BASE}/scraped-urls?filter=all`);",
    "const q2 = globalCityFilter !== 'All' ? `&city=${encodeURIComponent(globalCityFilter)}` : '';\n      const scrapedRes = await fetch(`${API_BASE}/scraped-urls?filter=all${q2}`);"
);

// Fetch cities in useEffect
content = content.replace(
    "useEffect(() => {\n    fetchDashboardData();\n  }, []);",
    "useEffect(() => {\n    fetchCities();\n  }, []);\n\n  useEffect(() => {\n    fetchDashboardData();\n  }, [globalCityFilter]);"
);

// 3. Add Select UI to Header
content = content.replace(
    "<h2 className=\"text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2\">\n            <Activity className=\"w-6 h-6 text-indigo-600\"/> Hind Event Scraper\n          </h2>\n          <div className=\"flex items-center gap-4\">",
    "<h2 className=\"text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2\">\n            <Activity className=\"w-6 h-6 text-indigo-600\"/> Hind Event Scraper\n          </h2>\n          <div className=\"flex items-center gap-4\">\n            <Select value={globalCityFilter} onValueChange={setGlobalCityFilter}>\n                 <SelectTrigger className=\"w-[180px] h-9 bg-white\">\n                     <SelectValue placeholder=\"All Cities\" />\n                 </SelectTrigger>\n                 <SelectContent>\n                     {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}\n                 </SelectContent>\n             </Select>"
);

// 4. Remove local filtering from EventsPanel
const eventsPanelRegex = /function EventsPanel\(\{.*?\}\) \{([\s\S]*?)return \(/;
content = content.replace(eventsPanelRegex, `function EventsPanel({ events, orgId, onSendEvent, onRefresh }: { events: Event[], orgId: string, onSendEvent?: (eventId: string) => void, onRefresh: () => void }) {
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  return (`);

content = content.replace(
    /        <Select value=\{selectedLocation\}[\s\S]*?<\/Select>/,
    ""
);

content = content.replace(
    /filteredEvents\.length === 0/g,
    "localEvents.length === 0"
);
content = content.replace(
    /filteredEvents\.map/g,
    "localEvents.map"
);


fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch applied!");
