const puppeteer = require('puppeteer');
const fs = require('fs');

const URL = 'https://starcitizen.fandom.com/wiki/List_of_ships';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Loading ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Debug: log page title to confirm page loaded
    const title = await page.title();
    console.log('Page title:', title);

    // Try to find tables with a more general selector to debug
    const tablesCount = await page.$$eval('table', tables => tables.length);
    console.log(`Found ${tablesCount} tables on the page`);

    // Wait for the first table in case class is different
    await page.waitForSelector('table', { timeout: 10000 });

    // Extract ships data from first table
    const ships = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return null;

      const rows = table.querySelectorAll('tbody tr');
      const result = {};

      rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length === 0) return;

        const name = cols[0].innerText.trim();
        if (!name) return;

        result[name] = {
          name,
          size: cols[1].innerText.trim(),
          role: cols[2].innerText.trim(),
          cargo: cols[5].innerText.trim(),
          crewMin: cols[6].innerText.trim(),
          crewMax: cols[7].innerText.trim(),
          manufacturer: cols[13].innerText.trim(),
        };
      });

      return result;
    });

    await browser.close();

    if (!ships) {
      console.log('No table found on the page.');
      return;
    }

    fs.writeFileSync('ships.json', JSON.stringify(ships, null, 2));
    console.log(`✅ Scraped ${Object.keys(ships).length} ships and saved to ships.json`);

  } catch (err) {
    console.error('Error:', err);
  }
})();
