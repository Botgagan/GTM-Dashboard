const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const oldFunc = `  const fetchDashboardData = async () => {
    try {
      const q = globalCityFilter !== 'All' ? \`?city=\${encodeURIComponent(globalCityFilter)}\` : '';
      const res = await fetch(\`\${API_BASE}/dashboard\${q}\`);
      const data = await res.json();
      setOrgs(data);
      const resPending = await fetch(\`\${API_BASE}/pending-scrapes\${q}\`);
      const dataPending = await resPending.json();
      setPendingScrapes(dataPending);

      const q2 = globalCityFilter !== 'All' ? \`&city=\${encodeURIComponent(globalCityFilter)}\` : '';
      const scrapedRes = await fetch(\`\${API_BASE}/scraped-urls?filter=all\${q2}\`);
      const scrapedData = await scrapedRes.json();
      setUrlsCount(scrapedData.length);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };`;

const newFunc = `  const fetchDashboardData = async () => {
    try {
      const q = globalCityFilter !== 'All' ? \`?city=\${encodeURIComponent(globalCityFilter)}\` : '';
      const res = await fetch(\`\${API_BASE}/dashboard\${q}\`);
      const data = await res.json();
      setOrgs(data);
      const resPending = await fetch(\`\${API_BASE}/pending-scrapes\${q}\`);
      const dataPending = await resPending.json();
      setPendingScrapes(dataPending);

      const q2 = globalCityFilter !== 'All' ? \`&city=\${encodeURIComponent(globalCityFilter)}\` : '';
      const scrapedRes = await fetch(\`\${API_BASE}/scraped-urls?filter=all\${q2}\`);
      const scrapedData = await scrapedRes.json();
      setUrlsCount(scrapedData.length);
      
      // Keep master filter in sync dynamically
      fetchCities();
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };`;

appTsx = appTsx.replace(oldFunc, newFunc);
fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated fetchDashboardData");
