const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add state and filtering logic
const oldPanelStart = `function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  

  return (
    <>
      <Table>`;

const newPanelStart = `function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;

  const filteredScrapes = pendingScrapes.filter(scrape => {
      if (!dateFilter) return true;
      const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
      const ev = payload.mappedEventData || {};
      return ev.date === dateFilter;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center p-3 bg-white border-b">
        <span className="text-sm font-medium text-slate-700 ml-2">Pending Scrapes</span>
        <div className="flex items-center gap-2 mr-2">
          <label className="text-xs font-medium text-slate-500">Filter by Start Date:</label>
          <div className="relative flex items-center">
            <Input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="h-8 text-xs w-[140px]"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-8 text-slate-400 hover:text-slate-600"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <Table>`;

content = content.replace(oldPanelStart, newPanelStart);

// 2. Replace mapping array
content = content.replace(
  `{pendingScrapes.length === 0 ? (`,
  `{filteredScrapes.length === 0 ? (`
);

// We have to be careful with the map replacement
const oldMap = `{pendingScrapes.map((scrape: any) => (
              <PendingEventRow 
                key={scrape.id} 
                scrape={scrape}`;

const newMap = `{filteredScrapes.map((scrape: any) => (
              <PendingEventRow 
                key={scrape.id} 
                scrape={scrape}`;

content = content.replace(oldMap, newMap);

// 3. Fix the closing tag of ScrapedEventsPanel
const oldClose = `      </Table>
      
      {expandedPending && activeScrape && (
        <PendingDetailsModal 
          scrape={activeScrape} 
          type={expandedPending.type}
          onClose={() => setExpandedPending(null)} 
        />
      )}
    </>
  );
}`;

const newClose = `      </Table>
      
      {expandedPending && activeScrape && (
        <PendingDetailsModal 
          scrape={activeScrape} 
          type={expandedPending.type}
          onClose={() => setExpandedPending(null)} 
        />
      )}
    </div>
  );
}`;

content = content.replace(oldClose, newClose);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Successfully injected date filter UI and logic into ScrapedEventsPanel");
