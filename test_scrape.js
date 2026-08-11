const https = require('https');
https.get('https://app.solarz.com.br/pages/shareable/usina/27541927-a490-4d88-8e83-56e627db2396', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const match = d.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (match) {
      console.log(JSON.stringify(JSON.parse(match[1]).props, null, 2).slice(0, 1000));
    } else {
      console.log('No NEXT_DATA');
      // let's see if there is any other script containing data
      const matches = d.match(/JSON\.parse\((.*?)\)/g);
      console.log('Other JSON.parse:', matches);
    }
  });
});
