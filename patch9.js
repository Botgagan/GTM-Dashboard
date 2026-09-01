const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Revert main tab name back to "Scraped URLs"
content = content.replace(
    'Cron-Job & Manual Scraping',
    'Scraped URLs'
);
content = content.replace(
    'Cron-Job & Manual Scraping',
    'Scraped URLs'
);

// 2. Add sourceTab state to ScrapedUrlsPanel
content = content.replace(
    '  const [filter, setFilter] = useState(\'all\');',
    '  const [filter, setFilter] = useState(\'all\');\n  const [sourceTab, setSourceTab] = useState<\'cron-job\' | \'manual\'>(\'cron-job\');'
);
content = content.replace(
    '  const [filter, setFilter] = useState(\'all\');\r\n',
    '  const [filter, setFilter] = useState(\'all\');\r\n  const [sourceTab, setSourceTab] = useState<\'cron-job\' | \'manual\'>(\'cron-job\');\r\n'
);

// 3. Add sourceTab filter buttons to the UI
const filterUiOld = `<div className="flex items-center justify-between">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>`;

const filterUiNew = `<div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${sourceTab === 'cron-job' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}\`}
              onClick={() => setSourceTab('cron-job')}
            >
              Cron-Job Scraping
            </button>
            <button
              className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${sourceTab === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}\`}
              onClick={() => setSourceTab('manual')}
            >
              Manual Scraping
            </button>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>`;

content = content.replace(filterUiOld, filterUiNew);
content = content.replace(filterUiOld.replace(/\n/g, '\r\n'), filterUiNew.replace(/\n/g, '\r\n'));

// CLOSE THE DIV I JUST OPENED
const selectCloseOld = `</SelectContent>
        </Select>`;
const selectCloseNew = `</SelectContent>
        </Select>
        </div>`;
content = content.replace(selectCloseOld, selectCloseNew);
content = content.replace(selectCloseOld.replace(/\n/g, '\r\n'), selectCloseNew.replace(/\n/g, '\r\n'));


// 4. Update the map function to filter by sourceTab
content = content.replace(
    '            urls.map((u) => (',
    '            urls.filter(u => (u.source || \'cron-job\') === sourceTab).map((u) => ('
);
content = content.replace(
    '            urls.map((u: any) => (',
    '            urls.filter((u: any) => (u.source || \'cron-job\') === sourceTab).map((u: any) => ('
);

// 5. Update the empty state check
content = content.replace(
    '          {urls.length === 0 ? (',
    '          {urls.filter(u => (u.source || \'cron-job\') === sourceTab).length === 0 ? ('
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch9 applied.");
