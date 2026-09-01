const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');
content = content.replace("import React, { useState, useEffect, useRef, useMemo } from 'react';", "import React, { useState, useEffect, useRef } from 'react';");
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');

let eventForm = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');
eventForm = eventForm.replace("import React, { useState } from 'react';", "import { useState } from 'react';");
fs.writeFileSync('frontend/src/EditableEventForm.tsx', eventForm, 'utf-8');

let orgForm = fs.readFileSync('frontend/src/EditableOrgForm.tsx', 'utf-8');
orgForm = orgForm.replace("import React, { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';");
orgForm = orgForm.replace("import React, { useState } from 'react';", "import { useState } from 'react';"); // fallback
fs.writeFileSync('frontend/src/EditableOrgForm.tsx', orgForm, 'utf-8');

console.log("Unused imports removed.");
