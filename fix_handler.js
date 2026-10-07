const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const changeHandler = `  const handleEventTypeChange = async (newTypeId: string) => {
    try {
      const updatedPayload = {
        ...payload,
        mappedEventData: {
          ...ev,
          eventTypeId: newTypeId
        }
      };
      await fetch(\`\${API_BASE}/pending-scrapes/\${scrape.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: updatedPayload })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkOrg`;

appTsx = appTsx.replace(
  "  const handleLinkOrg",
  changeHandler
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Injected handleEventTypeChange");
