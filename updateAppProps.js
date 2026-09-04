const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const anchorPropPass = `<ScrapedEventsPanel pendingScrapes={pendingScrapes} onRefresh={fetchDashboardData} />`;
const newPropPass = `<ScrapedEventsPanel pendingScrapes={pendingScrapes} orgs={orgs} onRefresh={fetchDashboardData} />`;
content = content.replace(anchorPropPass, newPropPass);

const funcAnchor = `function ScrapedEventsPanel({ pendingScrapes, onRefresh }: { pendingScrapes: any[], onRefresh: () => void }) {`;
const newFuncAnchor = `function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {`;
content = content.replace(funcAnchor, newFuncAnchor);

const theadAnchor = `<TableHead>Event Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source URL</TableHead>
            <TableHead>Org Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>`;
const newThead = `<TableHead>Event Title</TableHead>
            <TableHead>Link Status</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source URL</TableHead>
            <TableHead>Org Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>`;
content = content.replace(theadAnchor, newThead);

const colSpanAnchor = `<TableCell colSpan={7} className="h-32 text-center text-muted-foreground">`;
content = content.replace(colSpanAnchor, colSpanAnchor); // Keep as 7 columns since we replaced Status with Link Status

const rowPropAnchor = `<PendingEventRow 
                key={scrape.id} 
                scrape={scrape} 
                onRefresh={onRefresh} 
                onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })}
              />`;
const newRowProp = `<PendingEventRow 
                key={scrape.id} 
                scrape={scrape} 
                orgs={orgs}
                onRefresh={onRefresh} 
                onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })}
              />`;
content = content.replace(rowPropAnchor, newRowProp);

const rowFuncAnchor = `function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {`;
const newRowFunc = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");`;
content = content.replace(rowFuncAnchor, newRowFunc);


const badgeStatusLogic = `// Determine status
  let eventStatus = 'new';
  if (ev.date && ev.endDate && ev.endDate !== "2026-08-15") {
    const start = new Date(ev.date).getTime();
    const end = new Date(ev.endDate).getTime();
    const now = Date.now();
    if (now > end) eventStatus = 'expired';
    else if (now >= start && now <= end) eventStatus = 'ongoing';
  }`;
content = content.replace(badgeStatusLogic, badgeStatusLogic + `\n  const isLinked = !!scrape.linked_org_id;\n  const linkedOrgName = scrape.linked_org_name || "Existing Org";`);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx definitions and headers");
