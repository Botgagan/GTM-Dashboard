const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldBlock = `            <div className="flex flex-col items-end gap-2">
              {org.status !== 'failed' && !org.id.startsWith('new-') && (`;
const newBlock = `            <div className="flex flex-col items-end gap-2">
              {org.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                  onClick={(e) => { e.stopPropagation(); handleLinkManualOrg(org.id); }}
                  disabled={linkingManualOrg === org.id}
                >
                  {linkingManualOrg === org.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  ) : (
                    <LinkIcon className="w-3 h-3 mr-1.5" />
                  )}
                  Link Manual Org
                </Button>
              )}
              {org.status !== 'failed' && !org.id.startsWith('new-') && (`;

content = content.replace(oldBlock, newBlock);
content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Successfully inserted Manual Link button");
