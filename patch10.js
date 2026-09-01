const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// 1. Update ScrapedUrlsPanel definition
content = content.replace(
    'function ScrapedUrlsPanel({ setUrlsCount }: { setUrlsCount: (n: number) => void }) {',
    'function ScrapedUrlsPanel({ setUrlsCount, urlProcessingUI }: { setUrlsCount: (n: number) => void, urlProcessingUI?: React.ReactNode }) {'
);

// 2. Insert urlProcessingUI conditionally
content = content.replace(
    '      </div>\n\n      <Table>',
    '      </div>\n\n      {sourceTab === \'manual\' && urlProcessingUI}\n\n      <Table>'
);
content = content.replace(
    '      </div>\r\n\r\n      <Table>',
    '      </div>\r\n\r\n      {sourceTab === \'manual\' && urlProcessingUI}\r\n\r\n      <Table>'
);

// 3. Extract URL processing section and move it
const startIndex = content.indexOf('{/* URL Processing Section */}');
const endIndex = content.indexOf('{/* Dashboard Section */}');

if (startIndex !== -1 && endIndex !== -1) {
    let sectionString = content.substring(startIndex, endIndex);
    
    // Remove it from main
    content = content.replace(sectionString, '');
    
    // The string has some trailing whitespace, trim it if needed, or just inject it
    // Pass it into ScrapedUrlsPanel invocation
    content = content.replace(
        '<ScrapedUrlsPanel setUrlsCount={setUrlsCount} />',
        `<ScrapedUrlsPanel \n                setUrlsCount={setUrlsCount} \n                urlProcessingUI={\n                  <>\n                    ${sectionString.trim()}\n                  </>\n                }\n              />`
    );
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch10 applied.");
