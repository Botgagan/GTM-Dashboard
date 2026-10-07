const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  "const [cities, setCities] = useState<string[]>([]);",
  "const [cities, setCities] = useState<string[]>([]);\n  const [eventTypes, setEventTypes] = useState<any[]>([]);"
);

const fetchCode = `  const fetchEventTypes = async () => {
    try {
      const res = await fetch('https://devapi.cohort.social/eventv2/getEventTypes');
      const data = await res.json();
      if (data && data.data && data.data.list) {
        setEventTypes(data.data.list);
      }
    } catch (e) { console.error('Failed to fetch event types', e); }
  };`;

appTsx = appTsx.replace(
  "  const fetchCities = async () => {",
  fetchCode + "\n\n  const fetchCities = async () => {"
);

appTsx = appTsx.replace(
  "fetchCities();\n  }, []);",
  "fetchCities();\n    fetchEventTypes();\n  }, []);"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Injected eventTypes state and fetch");
