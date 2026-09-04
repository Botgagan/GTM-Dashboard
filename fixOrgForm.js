const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const oldState = `    // Form State
    const [googleLink, setGoogleLink] = useState(originalPayload.googleBusinessLink || '');
    const [orgName, setOrgName] = useState(linkedOrg ? linkedOrg.name : (originalPayload.primaryOrganizer || ''));
    const [phone, setPhone] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'phone')?.contact_value || '') : (originalPayload.contactInfo?.phones?.[0] || ''));
    const [email, setEmail] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'email')?.contact_value || '') : (originalPayload.contactInfo?.emails?.[0] || ''));
    const [website, setWebsite] = useState(linkedOrg?.website || originalPayload.contactInfo?.website || '');
    const [details, setDetails] = useState(originalPayload.mappedEventData?.description || '');
    
    const [logo, setLogo] = useState(originalPayload.logo || '');
    const [images, setImages] = useState<string[]>(originalPayload.images || []);
    
    const [accessibility, setAccessibility] = useState<string[]>(originalPayload.accessibility || ['']);
    const [offerings, setOfferings] = useState<string[]>(originalPayload.offerings || ['']);
    const [amenities, setAmenities] = useState<string[]>(originalPayload.amenities || ['']);
    const [payments, setPayments] = useState<string[]>(originalPayload.payments || ['']);`;

const newState = `    // Form State
    const [googleLink, setGoogleLink] = useState(linkedOrg ? '' : (originalPayload.googleBusinessLink || ''));
    const [orgName, setOrgName] = useState(linkedOrg ? linkedOrg.name : (originalPayload.primaryOrganizer || ''));
    const [phone, setPhone] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'phone')?.contact_value || '') : (originalPayload.contactInfo?.phones?.[0] || ''));
    const [email, setEmail] = useState(linkedOrg && linkedOrg.contacts ? (linkedOrg.contacts.find((c: any) => c.contact_type === 'email')?.contact_value || '') : (originalPayload.contactInfo?.emails?.[0] || ''));
    const [website, setWebsite] = useState(linkedOrg?.website || originalPayload.contactInfo?.website || '');
    
    // Clear out heavily-detailed fields if linking to an existing organization
    const [details, setDetails] = useState(linkedOrg ? '' : (originalPayload.mappedEventData?.description || ''));
    const [logo, setLogo] = useState(linkedOrg ? '' : (originalPayload.logo || ''));
    const [images, setImages] = useState<string[]>(linkedOrg ? [] : (originalPayload.images || []));
    const [accessibility, setAccessibility] = useState<string[]>(linkedOrg ? [''] : (originalPayload.accessibility || ['']));
    const [offerings, setOfferings] = useState<string[]>(linkedOrg ? [''] : (originalPayload.offerings || ['']));
    const [amenities, setAmenities] = useState<string[]>(linkedOrg ? [''] : (originalPayload.amenities || ['']));
    const [payments, setPayments] = useState<string[]>(linkedOrg ? [''] : (originalPayload.payments || ['']));`;

content = content.replace(oldState, newState);
fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
console.log("EditableOrgForm updated to clear details on linked orgs");
