const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const hookTarget = `  useEffect(() => {
    fetchDashboardData();
  }, [globalCityFilter]);`;

const hookReplacement = `  useEffect(() => {
    fetchDashboardData();
    
    // Background polling every 15 seconds to catch cron job & automated scrape updates silently
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [globalCityFilter]);`;

content = content.replace(hookTarget, hookReplacement);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Added 15s interval polling to App.tsx");
