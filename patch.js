const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

if (!content.includes('EditableOrgForm')) {
    content = "import { EditableOrgForm } from './EditableOrgForm';\nimport { EditableEventForm } from './EditableEventForm';\n" + content;
}

content = content.replace(
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);",
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);\n  const [isEditingEvent, setIsEditingEvent] = useState(false);"
);

content = content.replace(
    "      <TableCell className=\"font-medium max-w-[200px] truncate select-all cursor-text\" title={payload.eventTitle}>\n        {payload.eventTitle}\n      </TableCell>",
    "      <TableCell className=\"max-w-[200px] group relative\">\n        <div className=\"flex items-center gap-2 pr-6\">\n          <span className=\"font-medium text-[11px] truncate cursor-text select-all\" title={payload.eventTitle}>{payload.eventTitle || 'N/A'}</span>\n          <Button variant=\"outline\" size=\"icon\" className=\"h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2\" onClick={() => setIsEditingEvent(true)} title=\"Edit Event Details\">\n            <Edit className=\"w-3 h-3 text-slate-600\" />\n          </Button>\n        </div>\n        {isEditingEvent && <EditableEventForm scrape={scrape} onRefresh={onRefresh} onClose={() => setIsEditingEvent(false)} />}\n      </TableCell>"
);

content = content.replace(
    "      <TableCell>\n        <Button variant=\"outline\" size=\"sm\" className=\"h-6 text-[10px] px-2\" onClick={onViewOrg}>\n          View\n        </Button>\n      </TableCell>",
    "      <TableCell className=\"max-w-[200px] group relative\">\n        <div className=\"flex items-center gap-2 pr-6\">\n          <span className=\"font-medium text-[11px] truncate\" title={payload.primaryOrganizer}>{payload.primaryOrganizer || 'N/A'}</span>\n          <Button variant=\"outline\" size=\"icon\" className=\"h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2\" onClick={onViewOrg} title=\"Edit Organization Details\">\n            <Edit className=\"w-3 h-3 text-slate-600\" />\n          </Button>\n        </div>\n      </TableCell>"
);

const dialogStart = content.indexOf("<Dialog open={expandedPending !== null}");
if (dialogStart !== -1) {
    const dialogEnd = content.indexOf("</Dialog>", dialogStart);
    if (dialogEnd !== -1) {
        const dialogBlock = content.substring(dialogStart, dialogEnd + 9);
        content = content.replace(dialogBlock, "      {expandedPending !== null && activeScrape && (\n        <EditableOrgForm \n          scrape={activeScrape} \n          onRefresh={onRefresh} \n          onClose={() => setExpandedPending(null)} \n        />\n      )}");
    }
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch applied successfully via Node.");
