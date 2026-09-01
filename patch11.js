const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Hide the Select filter when manual tab is active
const selectHtmlOld = `<Select value={filter} onValueChange={(v: any) => setFilter(v)}>`;
const selectHtmlNew = `{sourceTab === 'cron-job' && (
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>`;
content = content.replace(selectHtmlOld, selectHtmlNew);

const selectCloseOld = `</SelectContent>
        </Select>
        </div>`;
const selectCloseNew = `</SelectContent>
        </Select>
          )}
        </div>`;
content = content.replace(selectCloseOld, selectCloseNew);
content = content.replace(selectCloseOld.replace(/\n/g, '\r\n'), selectCloseNew.replace(/\n/g, '\r\n'));

// 2. Hide Manage Platforms button when manual tab is active
const buttonOld = `<Button variant="outline" onClick={() => setShowPlatformManager(true)} className="flex items-center gap-2">`;
const buttonNew = `{sourceTab === 'cron-job' && (
        <Button variant="outline" onClick={() => setShowPlatformManager(true)} className="flex items-center gap-2">`;
content = content.replace(buttonOld, buttonNew);

const buttonCloseOld = `<Settings className="w-4 h-4" /> Manage Platforms
        </Button>`;
const buttonCloseNew = `<Settings className="w-4 h-4" /> Manage Platforms
        </Button>
        )}`;
content = content.replace(buttonCloseOld, buttonCloseNew);
content = content.replace(buttonCloseOld.replace(/\n/g, '\r\n'), buttonCloseNew.replace(/\n/g, '\r\n'));

// 3. Remove the filter logic and wrap the table in a conditional
content = content.replace(
    '{urls.filter(u => (u.source || \'cron-job\') === sourceTab).length === 0 ? (',
    '{urls.length === 0 ? ('
);
content = content.replace(
    'urls.filter(u => (u.source || \'cron-job\') === sourceTab).map((u) => (',
    'urls.map((u) => ('
);
content = content.replace(
    'urls.filter((u: any) => (u.source || \'cron-job\') === sourceTab).map((u: any) => (',
    'urls.map((u: any) => ('
);

// We need to match the specific Table inside ScrapedUrlsPanel
// The table is right after {sourceTab === 'manual' && urlProcessingUI}
const tableOldBlock = `{sourceTab === 'manual' && urlProcessingUI}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Discovered At</TableHead>
            <TableHead>Platform</TableHead>`;

const tableNewBlock = `{sourceTab === 'manual' && urlProcessingUI}

      {sourceTab === 'cron-job' && (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Discovered At</TableHead>
            <TableHead>Platform</TableHead>`;

content = content.replace(tableOldBlock, tableNewBlock);
content = content.replace(tableOldBlock.replace(/\n/g, '\r\n'), tableNewBlock.replace(/\n/g, '\r\n'));

const tableCloseBlock = `</TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={showPlatformManager}`;
const tableCloseBlockNew = `</TableRow>
            ))
          )}
        </TableBody>
      </Table>
      )}

      <Dialog open={showPlatformManager}`;

content = content.replace(tableCloseBlock, tableCloseBlockNew);
content = content.replace(tableCloseBlock.replace(/\n/g, '\r\n'), tableCloseBlockNew.replace(/\n/g, '\r\n'));


fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch11 applied.");
