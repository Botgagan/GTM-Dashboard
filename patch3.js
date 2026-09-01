const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(
    /const fetchDashboardData = async \(\) => \{\s*try \{\s*const res = await fetch\(`\$\{API_BASE\}\/dashboard`\);/,
    "const fetchCities = async () => {\n    try {\n      const res = await fetch(`${API_BASE}/cities`);\n      const data = await res.json();\n      setCities(['All', ...data.filter(Boolean)]);\n    } catch (e) { console.error(e); }\n  };\n\n  const fetchDashboardData = async () => {\n    try {\n      const q = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n      const res = await fetch(`${API_BASE}/dashboard${q}`);"
);

content = content.replace(
    /useEffect\(\(\) => \{\s*fetchDashboardData\(\);\s*\}, \[\]\);/,
    "useEffect(() => {\n    fetchCities();\n  }, []);\n\n  useEffect(() => {\n    fetchDashboardData();\n  }, [globalCityFilter]);"
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Patch applied!");
