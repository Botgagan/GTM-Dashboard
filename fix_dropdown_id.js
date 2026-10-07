const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldCode = `        <Select value={ev?.eventTypeId || "84bf505a-5f86-4c2b-a81a-4683cb45eabc"} onValueChange={handleEventTypeChange} disabled={isResolved}>
          <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            {eventTypes.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>`;

const newCode = `        {eventTypes.length === 0 ? (
          <div className="h-8 text-xs w-[130px] border border-input rounded-md flex items-center px-3 text-muted-foreground bg-slate-50/50">Loading...</div>
        ) : (
          <Select value={ev?.eventTypeId || "84bf505a-5f86-4c2b-a81a-4683cb45eabc"} onValueChange={handleEventTypeChange} disabled={isResolved}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Event Type" /></SelectTrigger>
            <SelectContent>
              {eventTypes.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}`;

appTsx = appTsx.replace(oldCode, newCode);
fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Fixed dropdown ID rendering bug");
