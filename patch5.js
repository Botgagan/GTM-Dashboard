const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const targetHeader = `<header className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hind GTM Dashboard</h1>
        </div>
      </header>`;

const newHeader = `<header className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Hind GTM Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={globalCityFilter} onValueChange={setGlobalCityFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-white">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>`;

content = content.replace(targetHeader, newHeader);

// Fix the \r\n vs \n matching issue just in case
if (!content.includes('Select value={globalCityFilter}')) {
    const targetHeader2 = targetHeader.replace(/\n/g, '\r\n');
    content = content.replace(targetHeader2, newHeader);
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch5 applied!");
