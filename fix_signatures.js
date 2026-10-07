const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  "function PendingEventRow({ scrape, orgs, onRefresh, onViewOrg }: { scrape: any, orgs: any[], onRefresh: () => void, onViewOrg: () => void }) {",
  "function PendingEventRow({ scrape, orgs, eventTypes, onRefresh, onViewOrg }: { scrape: any, orgs: any[], eventTypes: any[], onRefresh: () => void, onViewOrg: () => void }) {"
);

appTsx = appTsx.replace(
  /<PendingEventRow key=\{scrape\.id\} scrape=\{scrape\} orgs=\{orgs\} onRefresh=\{onRefresh\} onViewOrg=\{\(\) => setExpandedPending\(\{ id: scrape\.id, type: 'org' \}\)\} \/>/g,
  "<PendingEventRow key={scrape.id} scrape={scrape} orgs={orgs} eventTypes={eventTypes} onRefresh={onRefresh} onViewOrg={() => setExpandedPending({ id: scrape.id, type: 'org' })} />"
);

// We also need to pass eventTypes from App -> to the Scraped Events Tab component
// Let's find how Scraped Events Tab is rendered.
appTsx = appTsx.replace(
  /export function ScrapedEventsTab\(\{ pendingScrapes, orgs, onRefresh \}/g,
  "export function ScrapedEventsTab({ pendingScrapes, orgs, eventTypes, onRefresh }"
);

// And where it's called
appTsx = appTsx.replace(
  /<ScrapedEventsTab pendingScrapes=\{pendingScrapes\} orgs=\{orgs\} onRefresh=\{fetchDashboardData\} \/>/g,
  "<ScrapedEventsTab pendingScrapes={pendingScrapes} orgs={orgs} eventTypes={eventTypes} onRefresh={fetchDashboardData} />"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated PendingEventRow signatures");
