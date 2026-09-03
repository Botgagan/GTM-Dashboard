const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

// Fix 1: Remove the invalid import destructurings from db
const badImport = `const { pool, getAdminInviteLink, getSubcommunityDetails, submitEventToCohortApi, getEventDetails } = await import('./db');`;
const goodImport = `const { pool } = await import('./db');`;
content = content.replace(badImport, goodImport);

// Fix 2: Fix insertEvent parameters
const badInsert = `            await insertEvent({
                orgId: localOrgId,
                title: eventTitle,
                description: mappedEventData.description,
                startDate: fullStartTimestamp,
                location: finalLocation,
                url: targetUrl,
                cohortEventId: newEventId,
                cohortEventUrl: eventUrl,
                hindStatus: approvalStatus
            });`;
            
const goodInsert = `            await insertEvent({
                orgId: localOrgId,
                title: eventTitle,
                eventDate: fullStartTimestamp,
                endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
                location: finalLocation,
                hindUrl: eventUrl,
                sourceUrl: targetUrl,
                cohortEventId: newEventId,
                status: 'new',
                hindStatus: approvalStatus
            });`;
content = content.replace(badInsert, goodInsert);
content = content.replace(badInsert.replace(/\n/g, '\r\n'), goodInsert.replace(/\n/g, '\r\n'));

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Fixed pipeline.ts typescript errors");
