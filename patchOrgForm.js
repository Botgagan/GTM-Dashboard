const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

// 1. Fix handleSync function to send orgName and googleBusinessLink
const handleSyncOld = `    const handleSync = async () => {
        if (!googleLink) return;
        setIsSyncing(true);
        try {
            // We will build this endpoint next
            const res = await fetch(\`\${API_BASE}/sync-google-business\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: googleLink })
            });
            const data = await res.json();
            if (data.name) setOrgName(data.name);
            if (data.phone) setPhone(data.phone);
            if (data.website) setWebsite(data.website);
            if (data.logo) setLogo(data.logo);
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

content = content.replace(handleSyncOld, handleSyncNew);
content = content.replace(handleSyncOld.replace(/\n/g, '\r\n'), handleSyncNew.replace(/\n/g, '\r\n'));

// 2. Remove the disabled check for googleLink
content = content.replace(
    'onClick={handleSync} disabled={isSyncing || !googleLink}',
    'onClick={handleSync} disabled={isSyncing || !orgName}'
);

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("EditableOrgForm patched.");
