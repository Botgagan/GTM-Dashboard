const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const stateCode = `  const [sendingToInstantly, setSendingToInstantly] = useState<string | null>(null);`;
const newStateCode = `  const [sendingToInstantly, setSendingToInstantly] = useState<string | null>(null);
  const [linkingManualOrg, setLinkingManualOrg] = useState<string | null>(null);

  const handleLinkManualOrg = async (orgId: string) => {
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

content = content.replace(stateCode, newStateCode);

const btnCode = `            <div className="flex flex-col gap-1.5 ml-4">
              {org.status === 'unclaimed' && (
                <Button 
                  variant="outline" 
                  size="sm" `;
const newBtnCode = `            <div className="flex flex-col gap-1.5 ml-4">
              {org.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                  onClick={(e) => { e.stopPropagation(); handleLinkManualOrg(org.id); }}
                  disabled={linkingManualOrg === org.id}
                >
                  {linkingManualOrg === org.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <LinkIcon className="w-3 h-3 mr-1.5" />
                  )}
                  Link Manual Org
                </Button>
              )}
              {org.status === 'unclaimed' && (
                <Button 
                  variant="outline" 
                  size="sm" `;

content = content.replace(btnCode, newBtnCode);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Added Link Manual Org button to frontend App.tsx");
