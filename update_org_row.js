const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Add import
if (!content.includes('EditableOrgDialog')) {
    content = content.replace(
        "import { EditableEventForm } from './EditableEventForm';",
        "import { EditableEventForm } from './EditableEventForm';\nimport { EditableOrgDialog } from './EditableOrgDialog';"
    );
}

// Replace the `if (isEditing) { return ... }` block inside EditableOrgRow
const rowRegex = /if \(isEditing\) \{\s*return \(\s*<TableRow className="bg-muted\/50 align-top">[\s\S]*?<\/TableRow>\s*\);\s*\}/;
content = content.replace(rowRegex, `if (isEditing) {
    // We now just let the normal row render, and attach the Dialog below it.
}`);

// Now find where EditableOrgRow returns its TableRow and insert the Dialog before the closing tag.
// It looks like: return ( <React.Fragment> <TableRow ...> ... </TableRow> {expandedOrg...} </React.Fragment> )
// Wait, the EditableOrgRow returns:
// return (
//   <React.Fragment>
//     <TableRow ...>...</TableRow>
//     {expandedOrg?.id === org.id ...}
//   </React.Fragment>
// )
const returnRegex = /(<TableRow className="hover:bg-slate-50\/50 group transition-colors[^>]*>)/;
content = content.replace(returnRegex, `$1
      {isEditing && <EditableOrgDialog org={org} onClose={() => setIsEditing(false)} onRefresh={onRefresh} />}`);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx to use EditableOrgDialog");
