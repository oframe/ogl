import { test, expect } from '@playwright/test';
import { join } from 'path';

test('renders a WebGPU triangle', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:8399/tests/triangle.html');

    // Wait for render to complete
    await page.waitForFunction(
        () => document.title === 'rendered' || document.title.startsWith('error') || document.title.startsWith('gpu-error'),
        { timeout: 15000 }
    );

    const title = await page.title();
    console.log('Page title:', title);

    const debugInfo = await page.evaluate(() => window._debugInfo);
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    if (title.startsWith('error:') && title.includes('not supported')) {
        test.skip(true, title);
        return;
    }

    // Save screenshot
    await page.screenshot({ path: join(process.cwd(), 'tests', 'triangle-screenshot.png') });

    // Check for GPU validation errors
    if (title.startsWith('gpu-error')) {
        console.log('GPU validation errors detected!');
    }

    expect(title).toBe('rendered');
});
