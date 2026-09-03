const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldCall = `                      sendingToInstantly={sendingToInstantly}
                      onRefresh={fetchDashboardData}
                      loadingDetails={loadingDetails}
                      orgDetails={orgDetails}
                      handleToggleContact={handleToggleContact}
                    />`;
const newCall = `                      sendingToInstantly={sendingToInstantly}
                      onRefresh={fetchDashboardData}
                      loadingDetails={loadingDetails}
                      orgDetails={orgDetails}
                      handleToggleContact={handleToggleContact}
                      linkingManualOrg={linkingManualOrg}
                      handleLinkManualOrg={handleLinkManualOrg}
                    />`;
content = content.replace(oldCall, newCall);
content = content.replace(oldCall.replace(/\n/g, '\r\n'), newCall.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Passed props correctly this time");
