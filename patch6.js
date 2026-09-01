const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Fix setFilter typing error
content = content.replace(/onValueChange=\{setFilter\}/g, 'onValueChange={(v: any) => setFilter(v)}');

// 2. Add isEditingEvent state to PendingEventRow
content = content.replace(
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);",
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);\n  const [isEditingEvent, setIsEditingEvent] = useState(false);"
);
// In case of \r\n
content = content.replace(
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\r\n  const [isApproving, setIsApproving] = useState(false);",
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\r\n  const [isApproving, setIsApproving] = useState(false);\r\n  const [isEditingEvent, setIsEditingEvent] = useState(false);"
);

// 3. Replace Event Title cell in PendingEventRow
const oldTitleCell = `<TableCell className="font-medium max-w-[200px] truncate select-all cursor-text" title={payload.eventTitle}>
        {payload.eventTitle}
      </TableCell>`;
const newTitleCell = `<TableCell className="max-w-[200px] group relative">
        <div className="flex items-center gap-2 pr-6">
          <span className="font-medium text-[11px] truncate cursor-text select-all" title={payload.eventTitle}>{payload.eventTitle || 'N/A'}</span>
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
        </div>
        {isEditingEvent && <EditableEventForm scrape={scrape} onRefresh={onRefresh} onClose={() => setIsEditingEvent(false)} />}
      </TableCell>`;
content = content.replace(oldTitleCell, newTitleCell);
content = content.replace(oldTitleCell.replace(/\n/g, '\r\n'), newTitleCell);

// 4. Remove unused variables to suppress TS errors
content = content.replace("const payload = activeScrape ? (typeof activeScrape.payload === 'string' ? JSON.parse(activeScrape.payload) : activeScrape.payload) : null;", "");

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch6 applied.");
