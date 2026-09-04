const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const badEventRow = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
  const ev = payload.mappedEventData;

  // Determine status
  let eventStatus = 'new';
  if (ev.date && ev.endDate && ev.endDate !== "2026-08-15") {
    const start = new Date(ev.date).getTime();
    const end = new Date(ev.endDate).getTime();
    const now = Date.now();
    if (now > end) eventStatus = 'expired';
    else if (now >= start && now <= end) eventStatus = 'ongoing';
  }

  const handleApprove = async () => {`;

const goodEventRow = `function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {
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

  const handleApprove = async () => {`;

content = content.replace(badEventRow, goodEventRow);

const badStatusCell = `      <TableCell>
        {isResolved ? (
          <Badge variant={scrape.status === 'approved' ? 'default' : 'destructive'} className="capitalize">
            {scrape.status}
          </Badge>
        ) : (
          <Badge variant="outline" className={
            eventStatus === 'new' ? 'bg-blue-50 text-blue-700' : 
            eventStatus === 'ongoing' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'
          }>
            {eventStatus}
          </Badge>
        )}
      </TableCell>`;

const goodStatusCell = `      <TableCell>
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
      </TableCell>`;

content = content.replace(badStatusCell, goodStatusCell);

const badActionsCell = `      <TableCell className="text-right align-middle">
        <div className="flex items-center justify-end gap-2">
          {!isResolved ? (
            <>
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
      </TableCell>`;

const goodActionsCell = `      <TableCell className="text-right align-middle">
        <div className="flex items-center justify-end gap-2 relative">
          {!isResolved ? (
            <>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsLinking(true)} title="Search and Link to Existing Organization">
                <Search className="w-4 h-4 text-slate-600" />
              </Button>
              <Button size="sm" variant="default" onClick={handleApprove} disabled={isApproving}>
                {isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle className="w-3 h-3 mr-2" />}
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>

              {isLinking && (
                <div className="absolute right-0 top-10 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2">
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
            </>
          ) : (
             <span className="text-xs text-muted-foreground mr-4 font-medium uppercase tracking-wider">{scrape.status}</span>
          )}
        </div>
      </TableCell>`;

content = content.replace(badActionsCell, goodActionsCell);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated PendingEventRow with search and badges");
