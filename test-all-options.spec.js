// @ts-check
const { test, expect } = require('@playwright/test');

const URL = 'https://portfolio-3d-main-one.vercel.app/';

test.describe('All 11 Service Options', () => {
  test.setTimeout(120000); // 2 min timeout for full page load

  let page;
  let errors = [];
  let warnings = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    // Collect console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ text: msg.text(), location: msg.location() });
      }
      if (msg.type() === 'warning') {
        warnings.push({ text: msg.text(), location: msg.location() });
      }
    });

    // Collect uncaught exceptions
    page.on('pageerror', err => {
      errors.push({ text: `PAGE ERROR: ${err.message}`, stack: err.stack });
    });

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    // Wait extra for React + Three.js to mount
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    // Print collected errors
    if (errors.length > 0) {
      console.log('\n========== CONSOLE ERRORS ==========');
      errors.forEach((e, i) => {
        console.log(`\n--- Error ${i + 1} ---`);
        console.log(e.text);
        if (e.stack) console.log(e.stack);
        if (e.location) console.log(`  at ${e.location.url}:${e.location.lineNumber}`);
      });
    }
    if (warnings.length > 0) {
      console.log('\n========== CONSOLE WARNINGS ==========');
      warnings.forEach((w, i) => {
        console.log(`\n--- Warning ${i + 1} ---`);
        console.log(w.text.substring(0, 300));
      });
    }
    await page.context().close();
  });

  test('Page loads successfully', async () => {
    const title = await page.title();
    console.log(`Page title: ${title}`);
    // Page should have content
    const body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(0);
    await page.screenshot({ path: 'screenshots/00-page-loaded.png', fullPage: false });
  });

  test('Option 1: Hex Grid (ServicesSection)', async () => {
    // Scroll to hex grid section
    const section = page.locator('[class*="hex"], [class*="Hex"], [id*="hex"], [id*="services"]').first();
    if (await section.count() > 0) {
      await section.scrollIntoViewIfNeeded();
    } else {
      // Try scrolling to first canvas
      await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-hex-grid.png' });

    // Try clicking on canvas for hex interaction
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/01-hex-clicked.png' });
      }
    }
    console.log(`Option 1 errors so far: ${errors.length}`);
  });

  test('Option 2: Solar System (ServicesSolar)', async () => {
    // Find section 2
    await scrollToSection(page, 2);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/02-solar.png' });

    // Click on a planet
    const canvases = page.locator('canvas');
    const count = await canvases.count();
    if (count >= 2) {
      const canvas = canvases.nth(1);
      const box = await canvas.boundingBox();
      if (box) {
        // Click off-center to hit a planet
        await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/02-solar-clicked.png' });
      }
    }
    console.log(`Option 2 errors so far: ${errors.length}`);
  });

  test('Option 3: Card Deck (ServicesCards3D)', async () => {
    await scrollToSection(page, 3);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-cards.png' });

    // Try clicking a card
    const card = page.locator('[class*="card"], [class*="Card"]').first();
    if (await card.count() > 0) {
      await card.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-card-flipped.png' });
    }
    console.log(`Option 3 errors so far: ${errors.length}`);
  });

  test('Option 4: OS Desktop (ServicesOS)', async () => {
    await scrollToSection(page, 4);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/04-os-desktop.png' });

    // Try dragging a window
    const window = page.locator('[class*="window"], [class*="Window"]').first();
    if (await window.count() > 0) {
      await window.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/04-os-window-clicked.png' });
    }

    // Try clicking taskbar items
    const taskbar = page.locator('[class*="taskbar"], [class*="Taskbar"]').first();
    if (await taskbar.count() > 0) {
      await page.screenshot({ path: 'screenshots/04-os-taskbar.png' });
    }
    console.log(`Option 4 errors so far: ${errors.length}`);
  });

  test('Option 5: Cylinder Timeline (ServicesTimeline)', async () => {
    await scrollToSection(page, 5);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/05-cylinder.png' });

    // Look for rotation controls
    const arrows = page.locator('button, [class*="arrow"], [class*="Arrow"], [class*="nav"], [class*="control"]');
    const arrowCount = await arrows.count();
    for (let i = 0; i < Math.min(arrowCount, 3); i++) {
      const arrow = arrows.nth(i);
      if (await arrow.isVisible()) {
        await arrow.click();
        await page.waitForTimeout(800);
      }
    }
    await page.screenshot({ path: 'screenshots/05-cylinder-rotated.png' });
    console.log(`Option 5 errors so far: ${errors.length}`);
  });

  test('Option 6: City Map (ServicesMap)', async () => {
    await scrollToSection(page, 6);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-citymap.png' });

    // Click on buildings
    const buildings = page.locator('[class*="building"], [class*="Building"], rect, [class*="map"] rect');
    const bCount = await buildings.count();
    if (bCount > 0) {
      await buildings.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/06-citymap-clicked.png' });
    }
    console.log(`Option 6 errors so far: ${errors.length}`);
  });

  test('Option 7: Portal Doors (ServicesPortal)', async () => {
    await scrollToSection(page, 7);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/07-portal.png' });

    // Click on canvas for portal interaction
    const canvases = page.locator('canvas');
    const cCount = await canvases.count();
    for (let i = 0; i < cCount; i++) {
      const canvas = canvases.nth(i);
      if (await canvas.isVisible()) {
        const box = await canvas.boundingBox();
        if (box && box.y > 0) {
          // Click on left side for a door
          await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.5);
          await page.waitForTimeout(1500);
          await page.screenshot({ path: 'screenshots/07-portal-door-clicked.png' });
          break;
        }
      }
    }
    console.log(`Option 7 errors so far: ${errors.length}`);
  });

  test('Option 8: Globe (ServicesGlobe)', async () => {
    await scrollToSection(page, 8);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/08-globe.png' });

    // Click on canvas for globe pins
    const canvases = page.locator('canvas');
    const cCount = await canvases.count();
    for (let i = 0; i < cCount; i++) {
      const canvas = canvases.nth(i);
      if (await canvas.isVisible()) {
        const box = await canvas.boundingBox();
        if (box && box.y > 0) {
          await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/08-globe-clicked.png' });
          break;
        }
      }
    }
    console.log(`Option 8 errors so far: ${errors.length}`);
  });

  test('Option 9: Terminal (ServicesTerminal)', async () => {
    await scrollToSection(page, 9);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/09-terminal.png' });

    // Type a number to select a service
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/09-terminal-selected.png' });

    await page.keyboard.press('3');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/09-terminal-selected2.png' });
    console.log(`Option 9 errors so far: ${errors.length}`);
  });

  test('Option 10: Morphing Blob (ServicesMorphing)', async () => {
    await scrollToSection(page, 10);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/10-morphing.png' });

    // Click service buttons
    const buttons = page.locator('button');
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const text = await btn.textContent();
        if (text && (text.includes('Branding') || text.includes('Web') || text.includes('Auto') || text.includes('Data') || text.includes('Growth') || text.includes('Infra'))) {
          await btn.click();
          await page.waitForTimeout(1200);
          await page.screenshot({ path: `screenshots/10-morphing-btn-${i}.png` });
          break;
        }
      }
    }
    console.log(`Option 10 errors so far: ${errors.length}`);
  });

  test('Option 11: Cartoon Desktop (ServicesDesktop)', async () => {
    await scrollToSection(page, 11);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/11-cartoon.png' });

    // Click on canvas for cartoon objects
    const canvases = page.locator('canvas');
    const cCount = await canvases.count();
    for (let i = 0; i < cCount; i++) {
      const canvas = canvases.nth(i);
      if (await canvas.isVisible()) {
        const box = await canvas.boundingBox();
        if (box && box.y > 0) {
          await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/11-cartoon-clicked.png' });
          break;
        }
      }
    }
    console.log(`Option 11 errors so far: ${errors.length}`);
  });

  test('Final error summary', async () => {
    console.log('\n========== FINAL SUMMARY ==========');
    console.log(`Total console errors: ${errors.length}`);
    console.log(`Total console warnings: ${warnings.length}`);

    // Print all unique errors
    const uniqueErrors = [...new Set(errors.map(e => e.text))];
    console.log(`\nUnique errors (${uniqueErrors.length}):`);
    uniqueErrors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.substring(0, 500)}`);
    });

    // Take final full page screenshot
    await page.screenshot({ path: 'screenshots/99-final.png', fullPage: true });
  });
});

// Helper: scroll to a section by number
async function scrollToSection(page, sectionNum) {
  // Try to find section labels or headers that indicate which option we're viewing
  // The site likely has section-by-section layout, so scroll by viewport heights
  await page.evaluate((num) => {
    // Look for section elements or specific text
    const allSections = document.querySelectorAll('section, [class*="section"], [class*="Section"], [class*="services"], [class*="Services"]');
    if (allSections.length >= num) {
      allSections[num - 1].scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // Fallback: scroll by estimated position
    const totalHeight = document.documentElement.scrollHeight;
    const sectionHeight = totalHeight / 12; // ~12 sections total
    window.scrollTo({ top: sectionHeight * num, behavior: 'smooth' });
  }, sectionNum);
  await page.waitForTimeout(1500);
}
