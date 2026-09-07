const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldInsert = `    // DB: Save event
    await insertEvent({
        orgId,
        title: eventTitle,
        eventDate: fullStartTimestamp,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        location: finalLocation,
        hindUrl: createdEvent?.eventUrl,
        sourceUrl: url,
        cohortEventId: createdEvent?.id
    });`;

const newInsert = `    // DB: Save event
    await insertEvent({
        orgId,
        title: eventTitle,
        startDate: mappedEventData.date,
        startTime: mappedEventData.startTime,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        endTime: mappedEventData.endTime,
        location: finalLocation,
        hindUrl: createdEvent?.eventUrl,
        sourceUrl: url,
        cohortEventId: createdEvent?.id
    });`;

content = content.replace(oldInsert, newInsert);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated insertEvent call in pipeline.ts");
