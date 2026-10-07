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

  if (isEditingEvent) {`;

appTsx = appTsx.replace(
  "  if (isEditingEvent) {",
  changeHandler
);

const renderCell = `      <TableCell>
        <Select value={ev?.eventTypeId || "84bf505a-5f86-4c2b-a81a-4683cb45eabc"} onValueChange={handleEventTypeChange} disabled={isResolved}>
          <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            {eventTypes.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>`;

appTsx = appTsx.replace(
  "      </TableCell>\n      <TableCell>\n        <a href={scrape.source_url}",
  renderCell + "\n        <a href={scrape.source_url}"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Injected Event Type dropdown");
