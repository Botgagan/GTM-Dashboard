const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const startIndex = content.indexOf('function PendingEventRow({ scrape, onRefresh');
const endIndex = content.indexOf('function EventsPanel(', startIndex);

const oldBlock = content.substring(startIndex, endIndex);

const newBlock = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
  const ev = payload.mappedEventData;

  const isLinked = !!scrape.linked_org_id;
  const linkedOrgName = scrape.linked_org_name || "Existing Org";

  const handleLinkOrg = async (orgId: string | null) => {
    try {
      await fetch(\`\${API_BASE}/pending-scrapes/\${scrape.id}/link-org\`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });
      setIsLinking(false);
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(\`\${API_BASE}/pending-scrapes/\${scrape.id}/approve\`, { method: 'POST' });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(\`Approval failed: \${err.error}\`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/pending-scrapes/\${scrape.id}/reject\`, { method: 'POST' });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isResolved = scrape.status === 'approved' || scrape.status === 'rejected';

  const dateDisplay = formatEventDateTimeString(
     ev.date, 
     ev.startTime, 
     ev.endDate, 
     ev.endTime, 
     payload.mappedEventData?.timezoneOffset
  );

  return (
    <TableRow className={cn("bg-white", isResolved && "opacity-60")}>
      <TableCell className="max-w-[200px] group relative">
        <div className="flex items-center gap-2 pr-6">
          <span className="font-medium text-[11px] truncate cursor-text select-all" title={payload.eventTitle}>{payload.eventTitle || 'N/A'}</span>
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
        </div>
        {isEditingEvent && <EditableEventForm scrape={scrape} onRefresh={onRefresh} onClose={() => setIsEditingEvent(false)} />}
      </TableCell>
      <TableCell>
        {isResolved ? (
          <Badge variant={scrape.status === 'approved' ? 'default' : 'destructive'} className="capitalize">
            {scrape.status}
          </Badge>
        ) : isLinked ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 max-w-[120px] truncate" title={\`Linked to: \${linkedOrgName}\`}>
            Linked: {linkedOrgName}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            New Organization
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="font-semibold text-slate-900 text-[11px]">{dateDisplay}</span>
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal">
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
      </TableCell>
      <TableCell>
        <a href={scrape.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] break-all flex items-center gap-1">
          <LinkIcon className="w-3 h-3" /> Link
        </a>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={onViewOrg}>
          View
        </Button>
      </TableCell>
      <TableCell className="text-right align-middle relative">
        <div className="flex items-center justify-end gap-2">
          {!isResolved ? (
            <>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsLinking(!isLinking)} title="Search and Link to Existing Organization">
                <Search className="w-4 h-4 text-slate-600" />
              </Button>
              <Button size="sm" variant="default" onClick={handleApprove} disabled={isApproving}>
                {isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle className="w-3 h-3 mr-2" />}
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
            </>
          ) : (
             <span className="text-xs text-muted-foreground mr-4 font-medium uppercase tracking-wider">{scrape.status}</span>
          )}
        </div>

        {isLinking && !isResolved && (
          <div className="absolute right-0 top-12 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search existing orgs..." 
                className="h-8 text-xs"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1">
              {orgs
                .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 10)
                .map(o => (
                  <div 
                    key={o.id}
                    className="text-left text-xs p-2 hover:bg-slate-100 rounded cursor-pointer"
                    onClick={() => handleLinkOrg(o.id)}
                  >
                    <div className="font-semibold">{o.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{o.city || 'No location'}</div>
                  </div>
                ))
              }
              {orgs.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-xs text-muted-foreground p-2">No organizations found.</div>
              )}
            </div>
            <div className="border-t pt-2 mt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-red-600" onClick={() => handleLinkOrg(null)}>Unlink (New Org)</Button>
              <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => setIsLinking(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Successfully replaced PendingEventRow completely");
