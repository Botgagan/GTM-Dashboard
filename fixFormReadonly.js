const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const oldState = `    // Clear out heavily-detailed fields if linking to an existing organization
    const [details, setDetails] = useState(linkedOrg ? '' : (originalPayload.mappedEventData?.description || ''));
    const [logo, setLogo] = useState(linkedOrg ? '' : (originalPayload.logo || ''));
    const [images, setImages] = useState<string[]>(linkedOrg ? [] : (originalPayload.images || []));
    const [accessibility, setAccessibility] = useState<string[]>(linkedOrg ? [''] : (originalPayload.accessibility || ['']));
    const [offerings, setOfferings] = useState<string[]>(linkedOrg ? [''] : (originalPayload.offerings || ['']));
    const [amenities, setAmenities] = useState<string[]>(linkedOrg ? [''] : (originalPayload.amenities || ['']));
    const [payments, setPayments] = useState<string[]>(linkedOrg ? [''] : (originalPayload.payments || ['']));`;

const newState = `    // Populate heavily-detailed fields from linked organization's rich_data if available
    const [details, setDetails] = useState(linkedOrg ? (linkedOrg.rich_data?.description || '') : (originalPayload.mappedEventData?.description || ''));
    const [logo, setLogo] = useState(linkedOrg ? (linkedOrg.rich_data?.logo || '') : (originalPayload.logo || ''));
    const [images, setImages] = useState<string[]>(linkedOrg ? (linkedOrg.rich_data?.images || []) : (originalPayload.images || []));
    const [accessibility, setAccessibility] = useState<string[]>(linkedOrg ? (linkedOrg.rich_data?.accessibility || ['']) : (originalPayload.accessibility || ['']));
    const [offerings, setOfferings] = useState<string[]>(linkedOrg ? (linkedOrg.rich_data?.offerings || ['']) : (originalPayload.offerings || ['']));
    const [amenities, setAmenities] = useState<string[]>(linkedOrg ? (linkedOrg.rich_data?.amenities || ['']) : (originalPayload.amenities || ['']));
    const [payments, setPayments] = useState<string[]>(linkedOrg ? (linkedOrg.rich_data?.payments || ['']) : (originalPayload.payments || ['']));
    const [googleLink, setGoogleLink] = useState(linkedOrg ? (linkedOrg.rich_data?.googleBusinessLink || '') : (originalPayload.googleBusinessLink || ''));
`;

content = content.replace(oldState, newState);

// Let's remove the previous googleLink which we missed above
const googleLinkOld = `    const [googleLink, setGoogleLink] = useState(linkedOrg ? '' : (originalPayload.googleBusinessLink || ''));`;
content = content.replace(googleLinkOld, '');

// Now we need to add `disabled={!!linkedOrg}` or similar to inputs. But it's easier to add a CSS class or prop. Let's do `const isReadOnly = !!linkedOrg;` at the top and disable everything.
const isReadOnly = `    const isReadOnly = !!linkedOrg;`;

// wait, replacing every input is hard via regex. I'll just use a find-and-replace for `<Input ` and `<Textarea `
content = content.replace(/<Input /g, '<Input disabled={!!linkedOrg} ');
content = content.replace(/<textarea /g, '<textarea disabled={!!linkedOrg} ');
content = content.replace(/onChange=\{handleLogoUpload\}/g, 'onChange={handleLogoUpload} disabled={!!linkedOrg} ');
content = content.replace(/onChange=\{handleImageUpload\}/g, 'onChange={handleImageUpload} disabled={!!linkedOrg} ');

// Disable 'Add' array buttons and delete buttons
content = content.replace(/onClick=\{\(\) => addArrayItem/g, 'disabled={!!linkedOrg} onClick={() => addArrayItem');
content = content.replace(/onClick=\{\(\) => removeArrayItem/g, 'disabled={!!linkedOrg} onClick={() => removeArrayItem');

// Disable top action buttons except close
content = content.replace(/onClick=\{handleSave\}/g, 'onClick={handleSave} disabled={!!linkedOrg} ');
content = content.replace(/onClick=\{handleSyncCohort\}/g, 'onClick={handleSyncCohort} disabled={!!linkedOrg} ');

fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("Updated EditableOrgForm to show rich_data and be read-only");
