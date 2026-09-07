const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Add Popover and CalendarUI imports
const importBlock = `import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";`;

if (!content.includes('PopoverContent')) {
    content = content.replace(
        `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"`,
        `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"\n${importBlock}`
    );
}

// 2. Replace the ScrapedEventsPanel header and logic
const regexPanel = /function ScrapedEventsPanel\(\{ pendingScrapes, orgs, onRefresh \}: \{ pendingScrapes: any\[\], orgs: any\[\], onRefresh: \(\) => void \}\) \{[\s\S]*?<Table>/m;

const newPanel = `function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {
  const [expandedPending, setExpandedPending] = useState<{ id: string, type: 'org' | 'contacts' } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const activeScrape = expandedPending ? pendingScrapes.find(s => s.id === expandedPending.id) : null;

  const filteredScrapes = pendingScrapes.filter(scrape => {
      if (!date) return true;
      const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
      const ev = payload?.mappedEventData || {};
      
      // format selected date to YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = \`\${year}-\${month}-\${day}\`;

      return ev.date === dateString;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-end p-3 border-b">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<Button variant="outline" id="date" className="justify-start font-normal">{date ? date.toLocaleDateString() : "Select date"}</Button>} />
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <CalendarUI
              mode="single"
              selected={date}
              defaultMonth={date}
              captionLayout="dropdown"
              onSelect={(d) => {
                setDate(d);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Table>`;

content = content.replace(regexPanel, newPanel);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Successfully replaced the DatePicker implementation");
