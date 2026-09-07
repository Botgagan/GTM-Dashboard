const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const target = `  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;`;
const insert = `  useEffect(() => {
    if (isLinking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLinking]);
  
  const payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;`;

content = content.replace(target, insert);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Added body scroll lock when combobox is open");
