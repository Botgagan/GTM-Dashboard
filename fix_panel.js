const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  "function ScrapedEventsPanel({ pendingScrapes, orgs, onRefresh }: { pendingScrapes: any[], orgs: any[], onRefresh: () => void }) {",
  "function ScrapedEventsPanel({ pendingScrapes, orgs, eventTypes, onRefresh }: { pendingScrapes: any[], orgs: any[], eventTypes: any[], onRefresh: () => void }) {"
);

appTsx = appTsx.replace(
  /<ScrapedEventsPanel pendingScrapes=\{pendingScrapes\} orgs=\{orgs\} onRefresh=\{fetchDashboardData\} \/>/g,
  "<ScrapedEventsPanel pendingScrapes={pendingScrapes} orgs={orgs} eventTypes={eventTypes} onRefresh={fetchDashboardData} />"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated ScrapedEventsPanel");
