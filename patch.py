import sys
import re

with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "EditableOrgForm" not in content:
    content = "import { EditableOrgForm } from './EditableOrgForm';\nimport { EditableEventForm } from './EditableEventForm';\n" + content

# 2. Add isEditingEvent state to PendingEventRow
content = content.replace(
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);",
    "function PendingEventRow({ scrape, onRefresh, onViewOrg }: { scrape: any, onRefresh: () => void, onViewOrg: () => void }) {\n  const [isApproving, setIsApproving] = useState(false);\n  const [isEditingEvent, setIsEditingEvent] = useState(false);"
)

# 3. Replace Event Title cell
content = content.replace(
    """      <TableCell className="font-medium max-w-[200px] truncate select-all cursor-text" title={payload.eventTitle}>
        {payload.eventTitle}
      </TableCell>""",
    """      <TableCell className="max-w-[200px] group relative">
        <div className="flex items-center gap-2 pr-6">
          <span className="font-medium text-[11px] truncate cursor-text select-all" title={payload.eventTitle}>{payload.eventTitle || 'N/A'}</span>
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={() => setIsEditingEvent(true)} title="Edit Event Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
        </div>
        {isEditingEvent && <EditableEventForm scrape={scrape} onRefresh={onRefresh} onClose={() => setIsEditingEvent(false)} />}
      </TableCell>"""
)

# 4. Replace View button in PendingEventRow
content = content.replace(
    """      <TableCell>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={onViewOrg}>
          View
        </Button>
      </TableCell>""",
    """      <TableCell className="max-w-[200px] group relative">
        <div className="flex items-center gap-2 pr-6">
          <span className="font-medium text-[11px] truncate" title={payload.primaryOrganizer}>{payload.primaryOrganizer || 'N/A'}</span>
          <Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" onClick={onViewOrg} title="Edit Organization Details">
            <Edit className="w-3 h-3 text-slate-600" />
          </Button>
        </div>
      </TableCell>"""
)

# 5. Delete old ScrapedEventsPanel Dialog
dialog_start = content.find("<Dialog open={expandedPending !== null}")
if dialog_start != -1:
    dialog_end = content.find("</Dialog>", dialog_start)
    if dialog_end != -1:
        dialog_block = content[dialog_start:dialog_end + 9]
        content = content.replace(dialog_block, """      {expandedPending !== null && activeScrape && (
        <EditableOrgForm 
          scrape={activeScrape} 
          onRefresh={onRefresh} 
          onClose={() => setExpandedPending(null)} 
        />
      )}""")

with open("frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
