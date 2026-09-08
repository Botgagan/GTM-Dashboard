const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');

const regex = /if \(data\.images && data\.images\.length > 0\) setImages\(data\.images\);/;
const replacement = `if (data.images && data.images.length > 0) setImages(data.images);
            if (data.accessibility && data.accessibility.length > 0) setAccessibility(data.accessibility);
            if (data.offerings && data.offerings.length > 0) setOfferings(data.offerings);
            if (data.amenities && data.amenities.length > 0) setAmenities(data.amenities);
            if (data.payments && data.payments.length > 0) setPayments(data.payments);`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('frontend/src/EditableOrgForm.tsx', content, 'utf-8');
    console.log("Updated handleSync to apply accessibility, offerings, amenities, payments.");
} else {
    console.log("Regex not found in EditableOrgForm");
}
