const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldInsertEvent = `    // DB: Save event
    await insertEvent({
        orgId,
        title: eventTitle,
        eventDate: fullStartTimestamp,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        location: finalLocation,
        hindUrl: eventUrl,
        sourceUrl: targetUrl,
        cohortEventId: newEventId,
        status: subcommunityId ? 'new' : 'failed',
        hindStatus: approvalStatus
    });`;

const newInsertEvent = `    // DB: Save event
    await insertEvent({
        orgId,
        title: eventTitle,
        eventDate: fullStartTimestamp,
        startDate: mappedEventData.date,
        startTime: mappedEventData.startTime,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        endTime: mappedEventData.endTime,
        location: finalLocation,
        hindUrl: eventUrl,
        sourceUrl: targetUrl,
        cohortEventId: newEventId,
        status: subcommunityId ? 'new' : 'failed',
        hindStatus: approvalStatus
    });`;

if (content.includes(oldInsertEvent)) {
    content = content.replace(oldInsertEvent, newInsertEvent);
    fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
    console.log("Updated pipeline.ts insertEvent with split date columns");
} else {
    console.log("Could not find oldInsertEvent to replace! Try using a regex or inspecting the file.");
}
