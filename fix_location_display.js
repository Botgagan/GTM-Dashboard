const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldLogic = `        {(() => {
           const city = ev?.city || payload.contactInfo?.city;
           const area = payload.finalLocation || ev?.location;
           if (!city && (!area || area === 'Online')) return <span className="font-medium text-[11px]">Online</span>;
           return (
             <div className="flex flex-col gap-0.5">
               {city && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && area !== 'Online' && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}`;

const newLogic = `        {(() => {
           let city = ev?.city;
           if (!city || city.toLowerCase() === 'unknown' || city.toLowerCase() === 'n/a') {
               city = payload.contactInfo?.city || city;
           }
           let area = payload.finalLocation || ev?.location;
           
           if ((!city || city.toLowerCase() === 'unknown') && (!area || area === 'Online')) {
               return <span className="font-medium text-[11px]">Online</span>;
           }
           
           return (
             <div className="flex flex-col gap-0.5">
               {city && city.toLowerCase() !== 'unknown' && <span className="font-semibold text-slate-900 text-[11px]">{city}</span>}
               {area && <span className="text-[10px] text-muted-foreground leading-tight">{area}</span>}
             </div>
           );
        })()}`;

appTsx = appTsx.replace(oldLogic, newLogic);
fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated location display in PendingEventRow");
