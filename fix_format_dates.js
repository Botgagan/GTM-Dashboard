const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldFunc = /function formatEventDateTime.*?return \{ date: dateStr, time: timeStr \|\| '' \};\r?\n\}/s;

const newFunc = `function formatEventDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined) {
  if (!dateStr || dateStr === 'N/A') return { date: 'N/A', time: '' };
  
  let formattedDate = dateStr;
  let formattedTime = timeStr || '';

  try {
    let cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    let dDate = new Date(cleanDate + 'T00:00:00'); 
    if (!isNaN(dDate.getTime())) {
       formattedDate = dDate.toLocaleDateString();
    }
    
    if (timeStr && timeStr !== 'N/A') {
      let t = timeStr.trim();
      if (t.match(/^\\d{1,2}:\\d{2}(:\\d{2})?$/)) {
         if (t.length <= 5) t += ':00';
         let dTime = new Date(cleanDate + 'T' + t);
         if (!isNaN(dTime.getTime())) {
            formattedTime = dTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         }
      } else {
         formattedTime = timeStr; 
      }
    } else if (dateStr.includes('T') && !dateStr.endsWith('T00:00:00.000Z')) {
       let d = new Date(dateStr);
       if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString();
          formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
       }
    } else if (dateStr.endsWith('T00:00:00.000Z')) {
       formattedTime = '';
    }
  } catch(e) {}
  
  return { date: formattedDate, time: formattedTime };
}`;

appTsx = appTsx.replace(oldFunc, newFunc);
fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated formatEventDateTime");
