const fs = require('fs');
let content = fs.readFileSync('frontend/src/EditableEventForm.tsx', 'utf-8');

const oldPayloadLogic = `            const updatedPayload = {
                ...originalPayload,
                mappedEventData: {
                    ...originalPayload.mappedEventData,
                    title,
                    description,
                    date,
                    startTime,
                    endDate,
                    endTime,
                    location,
                    city,
                    price,
                    eventType,
                    timezoneOffset
                }
            };`;

const newPayloadLogic = `            const updatedPayload = {
                ...originalPayload,
                eventTitle: title,
                finalLocation: location,
                fullStartTimestamp: \`\${date}T\${startTime}:00\${timezoneOffset}\`,
                contactInfo: {
                    ...(originalPayload.contactInfo || {}),
                    city: city
                },
                mappedEventData: {
                    ...originalPayload.mappedEventData,
                    title,
                    description,
                    date,
                    startTime,
                    endDate,
                    endTime,
                    location,
                    city,
                    price,
                    eventType,
                    timezoneOffset
                }
            };`;

content = content.replace(oldPayloadLogic, newPayloadLogic);
fs.writeFileSync('frontend/src/EditableEventForm.tsx', content, 'utf-8');
console.log("Updated EditableEventForm.tsx payload sync");
