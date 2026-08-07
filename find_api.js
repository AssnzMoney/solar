const https = require('https');

const urls = [
  "https://app.solarz.com.br/pages/_next/static/chunks/pages/shareable/usina/%5BusinaId%5D-54c4136485f702cc.js",
  "https://app.solarz.com.br/pages/_next/static/chunks/main-44793c3a0a6b3211.js"
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const apiMatches = data.match(/https:\/\/[^"']+/g);
      if (apiMatches) {
        const unique = [...new Set(apiMatches)].filter(m => m.includes('api') || m.includes('solarz'));
        console.log(`Matches in ${url}:`, unique.slice(0, 20));
      }
      
      const pathMatches = data.match(/\/api\/[^"']+/g);
      if (pathMatches) {
        const uniquePaths = [...new Set(pathMatches)];
        console.log(`Path matches in ${url}:`, uniquePaths.slice(0, 20));
      }
    });
  });
});
