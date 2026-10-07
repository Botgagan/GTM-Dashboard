const fs = require('fs');
let baseTs = fs.readFileSync('backend/src/platforms/base.ts', 'utf-8');

const oldLogic = `            if (aiData.startTime && startTime === "06:00:00Z") startTime = aiData.startTime;
            if (aiData.endTime) aiEndTime = aiData.endTime;`;

const newLogic = `            if (aiData.startTime && startTime === "06:00:00Z") startTime = aiData.startTime;
            
            // Calculate end time mathematically using duration to avoid AI timezone hallucinations
            if (aiData.startTime && aiData.durationMinutes) {
                const s = aiData.startTime.split(':');
                if (s.length >= 2) {
                    const dur = parseInt(aiData.durationMinutes);
                    if (dur && dur > 0 && dur !== 270) {
                        let totalMinutes = parseInt(s[0]) * 60 + parseInt(s[1]) + dur;
                        let hh = Math.floor(totalMinutes / 60) % 24;
                        let mm = totalMinutes % 60;
                        aiEndTime = \`\${hh.toString().padStart(2, '0')}:\${mm.toString().padStart(2, '0')}:00\`;
                    } else if (aiData.endTime) {
                        aiEndTime = aiData.endTime;
                    }
                } else if (aiData.endTime) {
                    aiEndTime = aiData.endTime;
                }
            } else if (aiData.endTime) {
                aiEndTime = aiData.endTime;
            }`;

baseTs = baseTs.replace(oldLogic, newLogic);
fs.writeFileSync('backend/src/platforms/base.ts', baseTs);
console.log("Updated base.ts AI end time parsing");
