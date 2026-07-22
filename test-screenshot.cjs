const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Krishna/Desktop/3D_PRINTING_WEB/aira3d-screenshot.png', fullPage: true });
    
    const title = await page.title();
    const url = page.url();
    const bodyText = await page.textContent('body');
    
    console.log('Title:', title);
    console.log('URL:', url);
    console.log('Body text length:', bodyText?.length);
    console.log('Body preview:', bodyText?.substring(0, 300));
    
    const navbar = await page.$('nav');
    console.log('Navbar found:', !!navbar);
    
    const footer = await page.$('footer');
    console.log('Footer found:', !!footer);
    
    const h1 = await page.$('h1');
    console.log('H1 found:', !!h1);
    if (h1) console.log('H1 text:', await h1.textContent());
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
  console.log('Done');
})();
