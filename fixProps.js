const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Update component definition
const oldDef = `function EditableOrgRow({ org, expandedOrg, toggleExpand, handleSendToInstantly, sendingToInstantly, onRefresh }: any) {`;
const newDef = `function EditableOrgRow({ org, expandedOrg, toggleExpand, handleSendToInstantly, sendingToInstantly, onRefresh, linkingManualOrg, handleLinkManualOrg }: any) {`;
content = content.replace(oldDef, newDef);

// 2. Update where it is called
const oldCall = `                  filteredOrgs.map(org => (
                    <EditableOrgRow 
                      key={org.id}
                      org={org}
                      expandedOrg={expandedOrg}
                      toggleExpand={toggleExpand}
                      handleSendToInstantly={handleSendToInstantly}
                      sendingToInstantly={sendingToInstantly}
                      onRefresh={fetchDashboardData}
                    />
                  ))`;
const newCall = `                  filteredOrgs.map(org => (
                    <EditableOrgRow 
                      key={org.id}
                      org={org}
                      expandedOrg={expandedOrg}
                      toggleExpand={toggleExpand}
                      handleSendToInstantly={handleSendToInstantly}
                      sendingToInstantly={sendingToInstantly}
                      onRefresh={fetchDashboardData}
                      linkingManualOrg={linkingManualOrg}
                      handleLinkManualOrg={handleLinkManualOrg}
                    />
                  ))`;
content = content.replace(oldCall, newCall);
content = content.replace(oldCall.replace(/\n/g, '\r\n'), newCall.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Passed props to EditableOrgRow");
