const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Ensure popover/calendar imports
if (!content.includes('import { Calendar as CalendarUI }')) {
    content = content.replace(
        'import { cn } from "@/lib/utils";',
        `import { cn } from "@/lib/utils";\nimport { Calendar as CalendarUI } from "@/components/ui/calendar";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";`
    );
}

// 2. Rewrite ScrapedEventsPanel to include DateFilter logic and UI perfectly
const oldScrapedEventsPanelRegex = /function ScrapedEventsPanel[\s\S]*?(?=function PendingEventRow)/;
const newScrapedEventsPanel = `function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  
  const filteredScrapes = pendingScrapes.filter(scrape => {
      if (!date) return true;
      let payload = {};
      try {
        payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
      } catch (e) {
        return false;
      }
      const ev = payload?.mappedEventData || {};
      
      if (!ev.date) return false;
      let evDate = new Date(ev.date);
      if (isNaN(evDate.getTime()) && ev.date.includes('/')) {
          const parts = ev.date.split('/');
          if (parts.length === 3) {
              evDate = new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}\`);
              if (isNaN(evDate.getTime())) evDate = new Date(\`\${parts[2]}-\${parts[0]}-\${parts[1]}\`);
          }
      }
      if (!isNaN(evDate.getTime())) {
          return evDate.getFullYear() === date.getFullYear() && evDate.getMonth() === date.getMonth() && evDate.getDate() === date.getDate();
      }
      return false;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-end items-center gap-2 p-3 border-b">
        {date && (
          <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="h-9 px-2 text-slate-500 hover:text-slate-700">
            <X className="w-4 h-4 mr-1" /> Clear Filter
          </Button>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<Button variant="outline" id="date" className="justify-start font-normal">{date ? date.toLocaleDateString() : "Select date"}</Button>} />
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <CalendarUI mode="single" selected={date} month={date} onSelect={(d) => { setDate(d); setOpen(false); }} />
          </PopoverContent>
        </Popover>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Title</TableHead>
            <TableHead>New/Existing Org</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source URL</TableHead>
            <TableHead>Org Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredScrapes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                No pending scraped events.
              </TableCell>
            </TableRow>
          ) : (
            filteredScrapes.map(scrape => (
              <PendingEventRow key={scrape.id} scrape={scrape} orgs={orgs} onRefresh={onRefresh} onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })} />
            ))
          )}
        </TableBody>
      </Table>
      {expandedPending !== null && activeScrape && (
        <EditableOrgForm scrape={activeScrape} orgs={orgs} onRefresh={onRefresh} onClose={() => setExpandedPending(null)} />
      )}
    </div>
  );
}
`;

content = content.replace(oldScrapedEventsPanelRegex, newScrapedEventsPanel);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Restored ScrapedEventsPanel and DateFilter");
