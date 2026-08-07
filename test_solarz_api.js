const https = require('https');

const uuid = "27541927-a490-4d88-8e83-56e627db2396";
const urls = [
  `https://app.solarz.com.br/shareable/usina?uuid=${uuid}`,
  `https://app.solarz.com.br/shareable/kpi?uuid=${uuid}`
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`\n=== Response from ${url} ===`);
        console.log(JSON.stringify(json, null, 2).slice(0, 1500));
      } catch(e) { }
    });
  }).on('error', err => {});
});
