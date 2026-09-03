const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Modify the state in App component
const stateInsertion = `  const [linkingManualOrg, setLinkingManualOrg] = useState<string | null>(null);`;
const newState = `  const [linkingManualOrg, setLinkingManualOrg] = useState<string | null>(null);
  const [manualOrgModal, setManualOrgModal] = useState<{isOpen: boolean, orgId: string | null, url: string}>({isOpen: false, orgId: null, url: ""});`;
content = content.replace(stateInsertion, newState);

// 2. Modify handleLinkManualOrg logic to just open the modal (no wait, we'll replace handleLinkManualOrg completely or just have a new submit function)
const oldHandleLink = `  const handleLinkManualOrg = async (orgId: string) => {
    const manualUrl = prompt("Please paste the URL of the organization you manually created on Hind Social:\\n(e.g., https://turbo.cohort.social/admin/organisation-profile?comId=...&orgId=...)");
    if (!manualUrl) return;

    setLinkingManualOrg(orgId);
    try {
      const res = await fetch(\`\${API_BASE}/org/\${orgId}/retry-manual\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualUrl })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Success! The manual organization was linked, the event was pushed, and the record has been moved to Unclaimed Communities.");
        fetchDashboardData();
      } else {
        alert(\`Failed: \${data.error}\`);
      }
    } catch (e: any) {
      alert(\`Error: \${e.message}\`);
    } finally {
      setLinkingManualOrg(null);
    }
  };`;

const newSubmitLogic = `  const handleLinkManualOrg = (orgId: string) => {
    setManualOrgModal({ isOpen: true, orgId, url: "" });
  };

  const submitManualOrg = async () => {
    const { orgId, url: manualUrl } = manualOrgModal;
    if (!orgId || !manualUrl) return;

    setManualOrgModal({ isOpen: false, orgId: null, url: "" });
    setLinkingManualOrg(orgId);
    
    try {
      const res = await fetch(\`\${API_BASE}/org/\${orgId}/retry-manual\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualUrl })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Success! The manual organization was linked, the event was pushed, and the record has been moved to Unclaimed Communities.");
        fetchDashboardData();
      } else {
        alert(\`Failed: \${data.error}\`);
      }
    } catch (e: any) {
      alert(\`Error: \${e.message}\`);
    } finally {
      setLinkingManualOrg(null);
    }
  };`;
content = content.replace(oldHandleLink, newSubmitLogic);

// 3. Add the Dialog at the end of the App component before the final closing div
const dialogMarkup = `      <Dialog open={manualOrgModal.isOpen} onOpenChange={(isOpen) => setManualOrgModal(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Manual Organization</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please paste the URL of the organization you manually created on Hind Social:
              <br/>
              <span className="text-xs font-mono text-slate-500">(e.g., https://turbo.cohort.social/admin/organisation-profile?comId=...&orgId=...)</span>
            </p>
            <Input 
              value={manualOrgModal.url}
              onChange={(e) => setManualOrgModal(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://turbo.cohort.social/..."
              className="w-full"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setManualOrgModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button onClick={submitManualOrg} disabled={!manualOrgModal.url}>Link & Push</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

content = content.replace(/    <\/div>\s*?\);\s*?}\s*?(?=(function TabButton))/s, dialogMarkup + '\n\n');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx with Shadcn Dialog");
