const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. URL Processing Section text
content = content.replace(
    '<h2 className="text-lg font-semibold text-slate-900 mb-4">Process New Event</h2>',
    '<h2 className="text-lg font-semibold text-slate-900 mb-4">Scrap new event</h2>'
);
content = content.replace(
    'placeholder="Paste BookMyShow, AllEvents, or District.in URL..."',
    'placeholder="Paste event url from allevents,meraevents, eventbrite etc"'
);
content = content.replace(
    '>\n              Start Pipeline\n            </button>',
    '>\n              Scrap\n            </button>'
);
content = content.replace(
    '>\r\n              Start Pipeline\r\n            </button>',
    '>\r\n              Scrap\r\n            </button>'
);
// Some cases might have different whitespace
content = content.replace(
    'Start Pipeline',
    'Scrap'
); // fallback

// 2. Tab name
content = content.replace(
    '>\n                Scraped URLs\n              </TabButton>',
    '>\n                Cron-Job & Manual Scraping\n              </TabButton>'
);
content = content.replace(
    '>\r\n                Scraped URLs\r\n              </TabButton>',
    '>\r\n                Cron-Job & Manual Scraping\r\n              </TabButton>'
);
content = content.replace('Scraped URLs', 'Cron-Job & Manual Scraping'); // fallback

// 3. ScrapedUrlsPanel table headers
content = content.replace(
    '<TableHead>Status</TableHead>\n          </TableRow>',
    '<TableHead>Source</TableHead>\n            <TableHead>Status</TableHead>\n          </TableRow>'
);
content = content.replace(
    '<TableHead>Status</TableHead>\r\n          </TableRow>',
    '<TableHead>Source</TableHead>\r\n            <TableHead>Status</TableHead>\r\n          </TableRow>'
);
// fallback
if (!content.includes('<TableHead>Source</TableHead>')) {
    content = content.replace('<TableHead>Status</TableHead>', '<TableHead>Source</TableHead><TableHead>Status</TableHead>');
}

// 4. ScrapedUrlsPanel table cells
content = content.replace(
    '</TableCell>\n                <TableCell>\n                  <Badge',
    '</TableCell>\n                <TableCell><Badge variant="secondary" className="capitalize">{u.source || \'cron-job\'}</Badge></TableCell>\n                <TableCell>\n                  <Badge'
);
content = content.replace(
    '</TableCell>\r\n                <TableCell>\r\n                  <Badge',
    '</TableCell>\r\n                <TableCell><Badge variant="secondary" className="capitalize">{u.source || \'cron-job\'}</Badge></TableCell>\r\n                <TableCell>\r\n                  <Badge'
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch8 applied.");
