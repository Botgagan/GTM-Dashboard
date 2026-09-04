const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Header
content = content.replace(
    '<TableHead>Link Status</TableHead>',
    '<TableHead>New/Existing Org</TableHead>'
);

// 2. PendingEventRow Badges
const badgeOld = `{isResolved ? (
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
        )}`;

const badgeNew = `{isLinked ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 max-w-[120px] truncate" title={\`Existing Org: \${linkedOrgName}\`}>
            Existing
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            New
          </Badge>
        )}`;
content = content.replace(badgeOld, badgeNew);

// 3. Transparent overlay
const overlayOld = `{isLinking && !isResolved && (
          <div className="absolute right-0 top-12 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left">`;
const overlayNew = `{isLinking && !isResolved && (
          <>
          <div className="fixed inset-0 z-40" onClick={() => setIsLinking(false)} />
          <div className="absolute right-0 top-12 w-[300px] z-50 bg-white border shadow-lg rounded-md p-2 text-left">`;
content = content.replace(overlayOld, overlayNew);

const overlayEndOld = `</div>
        )}`;
const overlayEndNew = `</div>
          </>
        )}`;
content = content.replace(overlayEndOld, overlayEndNew);

// 4. Remove tickmark
const tickOld = `{isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle className="w-3 h-3 mr-2" />}
                Approve`;
const tickNew = `{isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                Approve`;
content = content.replace(tickOld, tickNew);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("App.tsx UI updated");
