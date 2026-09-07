const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Fix Imports
content = `import { Calendar as CalendarUI } from "@/components/ui/calendar";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { X } from "lucide-react";\n` + content;

// 2. Fix ScrapedEventsPanel
content = content.replace(
`function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  

  return (
    <>
      <Table>`,
`function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;
  
  const filteredScrapes = pendingScrapes.filter(scrape => {
      if (!date) return true;
      let payload: any = {};
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
      <Table>`
);

content = content.replace(
    `pendingScrapes.map(scrape =>`,
    `filteredScrapes.map(scrape =>`
);

content = content.replace(
    `</Table>

            {expandedPending !== null && activeScrape && (
        <EditableOrgForm 
          scrape={activeScrape} 
          orgs={orgs}
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />
      )}
    </>`,
    `</Table>
      {expandedPending !== null && activeScrape && (
        <EditableOrgForm scrape={activeScrape} orgs={orgs} onRefresh={onRefresh} onClose={() => setExpandedPending(null)} />
      )}
    </div>`
);


// 3. PendingEventRow Location
const targetLocation = `<TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const loc = payload.finalLocation || 'Online';
           if (loc === 'Online') return <span className="font-medium text-[11px]">Online</span>;
           const parts = loc.split('\\n');
           return (
             <div className="flex flex-col gap-0.5">
               <span className="font-semibold text-slate-900 text-[11px]">{parts[0]}</span>
               {parts[1] && <span className="text-[10px] text-muted-foreground leading-tight">{parts[1]}</span>}
             </div>
           );
        })()}
      </TableCell>`;
const replacementLocation = `<TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = payload.contactInfo?.city || ev?.city;
           const area = payload.finalLocation || ev?.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>`;
content = content.replace(targetLocation, replacementLocation);

// 4. PendingEventRow Footer
const targetFooter = `<div className="border-t pt-2 mt-1">
                <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink (New Org)</Button>
                <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => setIsLinking(false)}>Cancel</Button>
              </div>`;
const replacementFooter = `<div className="border-t pt-2 mt-2 flex flex-col gap-1.5 pb-1">
                {isLinked && (
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink Org</Button>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setIsLinking(false)}>Cancel</Button>
              </div>`;
content = content.replace(targetFooter, replacementFooter);


// 5. EventsPanel Headers
const targetHeaders = `<TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>`;
const replacementHeaders = `<TableHead>Event Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Location</TableHead>`;
content = content.replace(targetHeaders, replacementHeaders);


// 6. EditableEventRow View Mode
const oldViewBlock = `<TableCell className="whitespace-nowrap">
        {event.event_date ? (
           <span className="font-semibold text-slate-900 text-[11px]">{
             (() => {
                try {
                  const formatPart = (d: Date) => {
                    let dStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '');
                    dStr = dStr.replace(/^([A-Za-z]+)\\s/, '$1, ');
                    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return \`\${dStr} • \${timeStr}\`;
                  };
                  // Strip timezone offset (Z or +05:30) to prevent browser from shifting the time
                  const cleanStartDate = event.event_date.substring(0, 19);
                  const sd = new Date(cleanStartDate);
                  if (isNaN(sd.getTime())) return event.event_date;
                  let res = formatPart(sd);
                  if (event.end_date && event.end_date !== "2026-08-15") {
                     const cleanEndDate = event.end_date.substring(0, 19);
                     const ed = new Date(cleanEndDate);
                     if (!isNaN(ed.getTime())) res += " to " + formatPart(ed);
                  }
                  // We can't know the original timezone from postgres UTC string reliably here,
                  // but assuming the user wants to see it in their local timezone (IST):
                  res += " (IST)";
                  return res;
                } catch(e) { return event.event_date; }
             })()
           }</span>
        ) : '-'}
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {event.location ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-900">{event.location.split('\\n')[0]}</span>
            {event.location.split('\\n')[1] && <span className="text-[10px] text-muted-foreground leading-tight">{event.location.split('\\n')[1]}</span>}
          </div>
        ) : '-'}
      </TableCell>`;

const newViewBlock = `<TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.start_time || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_date || 'N/A'}</span></TableCell>
      <TableCell className="whitespace-nowrap"><span className="font-medium text-slate-700 text-[11px]">{event.end_time || 'N/A'}</span></TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
        {(() => {
           const city = event.city;
           const area = event.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}
      </TableCell>`;

content = content.replace(oldViewBlock, newViewBlock);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Safely applied ALL UI and filter updates via string replacements");
