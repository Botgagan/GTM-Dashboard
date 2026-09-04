const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const badSignature = `export function EditableOrgForm({ scrape, onRefresh, onClose }: { scrape: any, onRefresh: () => void, onClose: () => void }) {
    const originalPayload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;`;

const goodSignature = `export function EditableOrgForm({ scrape, orgs, onRefresh, onClose }: { scrape: any, orgs?: any[], onRefresh: () => void, onClose: () => void }) {
    const originalPayload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
    
    // Auto-fill from Linked Org if it exists
    const linkedOrg = scrape.linked_org_id && orgs ? orgs.find(o => o.id === scrape.linked_org_id) : null;
    `;

content = content.replace(badSignature, goodSignature);

const badState = `    // Form State
    const [googleLink, setGoogleLink] = useState(originalPayload.googleBusinessLink || '');
    const [orgName, setOrgName] = useState(originalPayload.primaryOrganizer || '');
    const [phone, setPhone] = useState(originalPayload.contactInfo?.phones?.[0] || '');
    const [email, setEmail] = useState(originalPayload.contactInfo?.emails?.[0] || '');
    const [website, setWebsite] = useState(originalPayload.contactInfo?.website || '');
    const [details, setDetails] = useState(originalPayload.mappedEventData?.description || '');`;

const goodState = `    // Form State
    const [googleLink, setGoogleLink] = useState(originalPayload.googleBusinessLink || '');
    const [orgName, setOrgName] = useState(linkedOrg ? linkedOrg.name : (originalPayload.primaryOrganizer || ''));
    const [phone, setPhone] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'phone')?.contact_value || '') : (originalPayload.contactInfo?.phones?.[0] || ''));
    const [email, setEmail] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'email')?.contact_value || '') : (originalPayload.contactInfo?.emails?.[0] || ''));
    const [website, setWebsite] = useState(linkedOrg?.website || originalPayload.contactInfo?.website || '');
    const [details, setDetails] = useState(originalPayload.mappedEventData?.description || '');`;

content = content.replace(badState, goodState);

const saveFuncAnchor = `    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPayload = {`;

const newSaveFunc = `    const handleSave = async () => {
        setIsSaving(true);
        try {
            // If the user manually edited the name away from the linked org's name, break the link!
            if (scrape.linked_org_id && linkedOrg && orgName !== linkedOrg.name) {
                console.log("Name was edited. Breaking the link to create a new organization.");
                await fetch(\`\${API_BASE}/pending-scrapes/\${scrape.id}/link-org\`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orgId: null })
                });
            }

            const updatedPayload = {`;

content = content.replace(saveFuncAnchor, newSaveFunc);

const headerAnchor = `<DialogTitle className="text-xl">Review & Edit Organization Details</DialogTitle>
                </DialogHeader>`;

const newHeader = `<DialogTitle className="text-xl">
                    Review & Edit Organization Details
                    {scrape.linked_org_id && linkedOrg && (
                        <span className="ml-3 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Linked to Existing Organization
                        </span>
                    )}
                </DialogTitle>
                </DialogHeader>`;

content = content.replace(headerAnchor, newHeader);

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Updated EditableOrgForm.tsx to dynamically pre-fill linked data and handle unlinking");
