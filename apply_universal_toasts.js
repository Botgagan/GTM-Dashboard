const fs = require('fs');

// 1. Update EditableOrgDialog.tsx
let dialogContent = fs.readFileSync('frontend/src/EditableOrgDialog.tsx', 'utf-8');
if (!dialogContent.includes('import { toast }')) {
    dialogContent = 'import { toast } from "@/components/ui/toast";\n' + dialogContent;
}
dialogContent = dialogContent.replace(/onRefresh\(\);\r?\n\s+onClose\(\);/g, 'toast.add({ type: "success", description: org ? "Organization updated successfully." : "Organization created successfully." });\n      onRefresh();\n      onClose();');
dialogContent = dialogContent.replace(/console\.error\('Failed to save organization', e\);\r?\n\s+\}/g, 'console.error("Failed to save organization", e);\n      toast.add({ type: "error", description: "Failed to save organization." });\n    }');
fs.writeFileSync('frontend/src/EditableOrgDialog.tsx', dialogContent);

// 2. Update App.tsx for Deletes & Toggles
let appContent = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// handleDeleteOrg (line 103 ish)
appContent = appContent.replace(/await fetch\(`\$\{API_BASE\}\/org\/\$\{org\.id\}`\, \{ method\: \'DELETE\' \}\);\r?\n\s+onRefresh\(\);/g, 'await fetch(`${API_BASE}/org/${org.id}`, { method: "DELETE" });\n      toast.add({ description: "Organization deleted." });\n      onRefresh();');

// togglePlatform
appContent = appContent.replace(/fetchPlatforms\(\);\r?\n\s+\} catch \(e\) \{/g, 'fetchPlatforms();\n      toast.add({ description: "Platform toggled." });\n    } catch (e) {');

// addPlatform
appContent = appContent.replace(/fetchPlatforms\(\);\r?\n\s+form\.reset\(\);\r?\n\s+\} catch \(e\) \{/g, 'fetchPlatforms();\n      form.reset();\n      toast.add({ type: "success", description: "Platform added." });\n    } catch (e) {');

// handleReject
appContent = appContent.replace(/if \(res\.ok\) onRefresh\(\);/g, 'if (res.ok) { toast.add({ description: "Event rejected." }); onRefresh(); }');

// linkOrg
appContent = appContent.replace(/if \(res\.ok\) \{\r?\n\s+onRefresh\(\);\r?\n\s+setManualOrgModal/g, 'if (res.ok) {\n        toast.add({ type: "success", description: "Organization linked successfully." });\n        onRefresh();\n        setManualOrgModal');

// delete contact
appContent = appContent.replace(/await fetch\(`\$\{API_BASE\}\/contacts\/\$\{contact\.id\}`\, \{ method\: \'DELETE\' \}\);\r?\n\s+onRefresh\(\);/g, 'await fetch(`${API_BASE}/contacts/${contact.id}`, { method: "DELETE" });\n      toast.add({ description: "Contact deleted." });\n      onRefresh();');

// delete event
appContent = appContent.replace(/await fetch\(`\$\{API_BASE\}\/events\/\$\{event\.id\}`\, \{ method\: \'DELETE\' \}\);\r?\n\s+onRefresh\(\);/g, 'await fetch(`${API_BASE}/events/${event.id}`, { method: "DELETE" });\n      toast.add({ description: "Event deleted." });\n      onRefresh();');

// save contact
appContent = appContent.replace(/onRefresh\(\);\r?\n\s+setIsEditing\(false\);\r?\n\s+\} catch/g, 'toast.add({ type: "success", description: "Contact saved." });\n      onRefresh();\n      setIsEditing(false);\n    } catch');

// save event
appContent = appContent.replace(/onRefresh\(\);\r?\n\s+setIsEditing\(false\);\r?\n\s+\} catch/g, 'toast.add({ type: "success", description: "Event saved." });\n      onRefresh();\n      setIsEditing(false);\n    } catch');

fs.writeFileSync('frontend/src/App.tsx', appContent);
console.log("Applied universal toasts!");
