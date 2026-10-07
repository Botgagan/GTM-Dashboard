const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  `             </div>
           );
        })()}
      <TableCell>`,
  `             </div>
           );
        })()}
      </TableCell>
      <TableCell>`
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Fixed JSX syntax error");
