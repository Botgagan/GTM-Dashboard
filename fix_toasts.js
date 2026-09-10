const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// Add import if not exists
if (!content.includes('import { Toaster, toast }')) {
    content = 'import { Toaster, toast } from "@/components/ui/toast";\n' + content;
}

// Add <Toaster /> inside the main App component before the last closing div
if (!content.includes('<Toaster />')) {
    // Find the end of the App component. The last component in the file is probably App or EditableOrgDialog
    // Wait, let's find `export default function App() {`
    // and replace its main `return (` ... `)` to include Toaster.
    // Actually, App is the default export. Let's just find the final `</div>` of the App component.
    const appEndIndex = content.lastIndexOf('</div>\n  );\n}');
    if (appEndIndex !== -1) {
        content = content.substring(0, appEndIndex) + '  <Toaster />\n    ' + content.substring(appEndIndex);
    }
}

// Replace alerts
content = content.replace(/alert\(`Approval failed: \$\{err\.error\}`\);/g, 'toast.add({ type: "error", description: `Approval failed: ${err.error}`, priority: "high" });');
content = content.replace(/alert\(e\.message\);/g, 'toast.add({ type: "error", description: e.message, priority: "high" });');

content = content.replace(/alert\("Success! The manual organization was linked, the event was pushed, and the record has been moved to Unclaimed Communities."\);/g, 'toast.add({ type: "success", description: "Success! Manual organization linked and event pushed to Unclaimed Communities." });');
content = content.replace(/alert\(`Failed: \$\{data\.error\}`\);/g, 'toast.add({ type: "error", description: `Failed: ${data.error}`, priority: "high" });');
content = content.replace(/alert\(`Error: \$\{e\.message\}`\);/g, 'toast.add({ type: "error", description: `Error: ${e.message}`, priority: "high" });');

content = content.replace(/alert\(data\.message\);/g, 'toast.add({ type: "success", description: data.message });');
content = content.replace(/alert\(`Error: \$\{data\.error\}`\);/g, 'toast.add({ type: "error", description: `Error: ${data.error}`, priority: "high" });');
content = content.replace(/alert\(`Request failed: \$\{err\.message\}`\);/g, 'toast.add({ type: "error", description: `Request failed: ${err.message}`, priority: "high" });');

content = content.replace(/alert\('Successfully synced all organizations and events from Cohort!'\);/g, 'toast.add({ type: "success", description: "Successfully synced all organizations and events from Cohort!" });');
content = content.replace(/alert\(`Failed to sync: \$\{error\.error\}`\);/g, 'toast.add({ type: "error", description: `Failed to sync: ${error.error}`, priority: "high" });');
content = content.replace(/alert\(`Sync failed: \$\{e\.message\}`\);/g, 'toast.add({ type: "error", description: `Sync failed: ${e.message}`, priority: "high" });');

content = content.replace(/alert\('Failed to save contact'\);/g, 'toast.add({ type: "error", description: "Failed to save contact", priority: "high" });');
content = content.replace(/alert\('Failed to save event'\);/g, 'toast.add({ type: "error", description: "Failed to save event", priority: "high" });');

fs.writeFileSync('frontend/src/App.tsx', content);
console.log("Replaced alerts with toasts!");
