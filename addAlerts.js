const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const handleSyncOld = `    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(\`\${API_BASE}/sync-google-business\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgName: orgName, googleBusinessLink: googleLink })
            });
            const data = await res.json();
            if (data.orgName) setOrgName(data.orgName);
            if (data.phone) setPhone(data.phone);
            if (data.email) setEmail(data.email);
            if (data.websiteUrl) setWebsite(data.websiteUrl);
            if (data.description) setDetails(data.description);
            if (data.googleBusinessLink) setGoogleLink(data.googleBusinessLink);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };`;

const handleSyncNew = `    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(\`\${API_BASE}/sync-google-business\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgName: orgName, googleBusinessLink: googleLink })
            });
            if (!res.ok) {
                alert("Failed to sync. Is the backend running?");
                return;
            }
            const data = await res.json();
            if (data.error) {
                alert("Error from server: " + data.error);
                return;
            }
            if (data.orgName) setOrgName(data.orgName);
            if (data.phone) setPhone(data.phone);
            if (data.email) setEmail(data.email);
            if (data.websiteUrl) setWebsite(data.websiteUrl);
            if (data.description) setDetails(data.description);
            if (data.googleBusinessLink) setGoogleLink(data.googleBusinessLink);
            alert("Auto-fill complete!");
        } catch (e) {
            console.error(e);
            alert("Auto-fill failed. Check console.");
        } finally {
            setIsSyncing(false);
        }
    };`;

content = content.replace(handleSyncOld, handleSyncNew);
content = content.replace(handleSyncOld.replace(/\n/g, '\r\n'), handleSyncNew.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Added alerts to AutoFill.");
