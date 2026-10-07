const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf8');

content = content.replace(
    /let adminId = 'df0e077b-a203-48a3-acc1-41da79656543';\s*\/\/\s*The Cohort API expects the Community Membership ID, NOT the User's dbId!\s*\/\/\s*Using the ID provided by the user's admin list response\.\s*adminId = 'c32158f7-91ab-40a2-a0bc-504d9a4f96fd';/,
    "let adminId = '28f6f32a-97fc-4b80-b1dd-30a3933858a4'; // Using the current user's actual ID from /user/profile"
);

fs.writeFileSync('backend/src/apiClient.ts', content);
console.log("Updated adminId");
