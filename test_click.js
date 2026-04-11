const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle0' });
    console.log('Page loaded');
    
    // Check if the rules modal exists
    const modalExists = await page.$('#rulesModal');
    console.log('Rules modal exists:', !!modalExists);
    
    // Find event card
    const eventCard = await page.$('.event-card');
    if (eventCard) {
      console.log('Clicking the first event card...');
      await eventCard.click();
      
      // Wait a moment for modal animation
      await new Promise(r => setTimeout(r, 500));
      
      const isActive = await page.evaluate(() => {
        return document.getElementById('rulesModal').classList.contains('active');
      });
      console.log('Is rules modal active after click?', isActive);
    } else {
      console.log('No event card found');
    }
  } catch (err) {
    console.error('Script error:', err.message);
  } finally {
    await browser.close();
  }
})();
