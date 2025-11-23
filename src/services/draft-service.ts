import puppeteer from 'puppeteer';

export interface DraftLinks {
  blue: string;
  red: string;
  spectator: string;
}

export class DraftService {
  static async createDraft(): Promise<DraftLinks | null> {
    let browser;
    try {
      console.log('Launching browser for draft creation...');
      browser = await puppeteer.launch({
        headless: true,
        timeout: 60000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.waitForTimeout(3000); // Wait 3 seconds to ensure frame is ready
      page.setDefaultNavigationTimeout(60000);

      console.log('[Draft Debug] Navigating to draftlol.dawe.gg...');
      await page.goto('https://draftlol.dawe.gg/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`[Draft Debug] Page loaded. Current URL: ${page.url()}`);

      // 2. Wait for the "Create Room" button. 
      const createButtonSelector = 'button, a, div[role="button"]'; 
      console.log(`[Draft Debug] Waiting for create button selector: ${createButtonSelector}`);
      try {
          await page.waitForSelector(createButtonSelector, { timeout: 10000 }); // Increased timeout for selector
          console.log('[Draft Debug] Create button selector found.');
      } catch (e) {
          console.log(`[Draft Debug] Timeout waiting for generic button selector: ${e}. Continuing to inspect page...`);
      }

      // Small delay to ensure hydration
      await new Promise(r => setTimeout(r, 2000));
      console.log('[Draft Debug] Executing page.evaluate to find and click button...');

      // Find the button by text
      const buttonClicked = await page.evaluate(() => {
        const cleanText = (t: string) => t.trim().toLowerCase();
        const candidates = Array.from(document.querySelectorAll('button, a, div, span'));
        
        let target = candidates.find(el => {
            const t = cleanText((el as HTMLElement).innerText);
            return t === 'create';
        });
        
        if (!target) {
            target = candidates.find(el => {
                const t = cleanText((el as HTMLElement).innerText);
                return t.includes('create') && (el.tagName === 'BUTTON' || el.tagName === 'A' || (el as HTMLElement).onclick != null);
            });
        }

        if (target) {
          console.log('Found target element:', target.tagName);
          (target as HTMLElement).click();
          return true;
        }
        console.log('No create button found within page.evaluate.');
        return false;
      });
      console.log(`[Draft Debug] Button click attempt result: ${buttonClicked}`);

      if (!buttonClicked) {
        console.error('Could not find "Create" button.');
        return null;
      }

      // 3. Wait for the draft room to load.
      console.log('[Draft Debug] Waiting for navigation to new room URL...');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('[Draft Debug] Navigation complete.');
      
      const url = page.url();
      console.log(`[Draft Debug] New URL after navigation: ${url}`);
      if (url === 'https://draftlol.dawe.gg/') {
          console.error('Navigation to room failed. URL did not change.');
          return null;
      }

      console.log('Room created at:', url);

      // 4. Extract links.
      console.log('[Draft Debug] Executing page.evaluate to extract links...');
      const links = await page.evaluate(() => {
         const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
         
         const urlInputs = inputs.filter(i => i.value.includes(window.location.origin));
         
         return {
             blue: urlInputs[0]?.value || '', 
             red: urlInputs[1]?.value || '',  
             spectator: urlInputs[2]?.value || '' 
         };
      });
      console.log(`[Draft Debug] Extracted links: ${JSON.stringify(links)}`);

      if (!links.blue || !links.red || !links.spectator) {
          console.warn('Could not scrape specific team links. Returning main URL for all as fallback.');
          return {
              blue: url,
              red: url,
              spectator: url
          };
      }


      return {
        blue: links.blue,
        red: links.red,
        spectator: links.spectator
      };

    } catch (error) {
      console.error('Error creating draft:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
