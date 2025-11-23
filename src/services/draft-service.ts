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
      await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds to ensure frame is ready
      page.setDefaultNavigationTimeout(60000);

      await page.goto('https://draftlol.dawe.gg/', { waitUntil: 'domcontentloaded', timeout: 60000 });

      // 2. Wait for the "Create Room" button. 
      const createButtonSelector = 'button, a, div[role="button"]'; 
      try {
          await page.waitForSelector(createButtonSelector, { timeout: 10000 });
      } catch (e) {
          console.log(`Timeout waiting for generic button selector: ${e}. Continuing to inspect page...`);
      }

      // Small delay to ensure hydration
      await new Promise(r => setTimeout(r, 2000));

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
          (target as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!buttonClicked) {
        console.error('Could not find "Create" button.');
        return null;
      }

      // 3. Wait for the draft room to load.
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (url === 'https://draftlol.dawe.gg/') {
          console.error('Navigation to room failed. URL did not change.');
          return null;
      }

      console.log('Room created at:', url);

      // 4. Extract links.
      const links = await page.evaluate(() => {
         const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
         
         const urlInputs = inputs.filter(i => i.value.includes(window.location.origin));
         
         return {
             blue: urlInputs[0]?.value || '', 
             red: urlInputs[1]?.value || '',  
             spectator: urlInputs[2]?.value || '' 
         };
      });

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
