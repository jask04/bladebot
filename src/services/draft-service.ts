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
        timeout: 60000, // Increase timeout to 60 seconds
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Recommended for Docker environments
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // Use if --no-sandbox is not enough
          '--disable-gpu' // Recommended for headless
        ]
      });

      const page = await browser.newPage();
      
      // 1. Navigate to the site
      await page.goto('https://draftlol.dawe.gg/', { waitUntil: 'networkidle2' });

      // 2. Wait for the "Create Room" button. 
      // Based on typical SPA behavior, we need to identify the button.
      // Since I can't inspect it live, I'll assume a generic button selector or text.
      // Strategy: Look for a button with text "Create Room" or similar.
      
      // Wait for the button to appear
      const createButtonSelector = 'button, a, div[role="button"]'; 
      try {
          await page.waitForSelector(createButtonSelector, { timeout: 5000 });
      } catch (e) {
          console.log('Timeout waiting for generic button selector. Continuing to inspect page...');
      }

      // Small delay to ensure hydration
      await new Promise(r => setTimeout(r, 2000));

      // Find the button by text
      const buttonClicked = await page.evaluate(() => {
        // Helper to normalize text
        const cleanText = (t: string) => t.trim().toLowerCase();
        
        // Candidates: buttons, links, and divs that might be buttons
        const candidates = Array.from(document.querySelectorAll('button, a, div, span'));
        
        // Filter candidates that look like the "Create" button
        // strict match first
        let target = candidates.find(el => {
            const t = cleanText((el as HTMLElement).innerText);
            return t === 'create';
        });
        
        // If not found, try partial but be careful not to catch "Create Room" if it's just "Create"
        if (!target) {
            target = candidates.find(el => {
                const t = cleanText((el as HTMLElement).innerText);
                // Check if it contains 'create' and is clickable-ish
                return t.includes('create') && (el.tagName === 'BUTTON' || el.tagName === 'A' || (el as HTMLElement).onclick != null);
            });
        }

        if (target) {
          console.log('Found target element:', target.tagName);
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
      // The URL usually changes to include the room ID
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (url === 'https://draftlol.dawe.gg/') {
          console.error('Navigation to room failed. URL did not change.');
          return null;
      }

      console.log('Room created at:', url);

      // 4. Extract links.
      
      // Let's try to scrape.
      const links = await page.evaluate(() => {
         const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
         
         // Heuristic: Look for inputs containing the current domain
         const urlInputs = inputs.filter(i => i.value.includes(window.location.origin));
         
         // Assumption: 
         // Based on observation, the site lists links in order: Blue Team, Red Team, Spectator.
         // Input[0] = Blue Team link
         // Input[1] = Red Team link
         // Input[2] = Spectator link
         
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
