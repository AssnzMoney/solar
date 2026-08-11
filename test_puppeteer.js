const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  console.log('Navigating to SolarZ...');
  await page.goto('https://app.solarz.com.br/pages/shareable/usina/27541927-a490-4d88-8e83-56e627db2396', { waitUntil: 'networkidle2' });
  
  // Wait a bit for React to render
  await new Promise(r => setTimeout(r, 5000));
  
  // Extract text from the page to see what's there
  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- Page Text ---');
  console.log(text.slice(0, 2000));
  
  await browser.close();
})();
