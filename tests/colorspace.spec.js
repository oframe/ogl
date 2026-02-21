import { test, expect } from '@playwright/test';

test('check copyExternalImageToTexture color space behavior', async ({ page }) => {
    await page.goto('http://localhost:8399/examples/test-colorspace.html');

    // Wait for the test to complete
    await page.waitForFunction(() => {
        const output = document.getElementById('output').textContent;
        return output.includes('Max diff:') && output.includes('GPU Comparison');
    }, null, { timeout: 15000 });

    const output = await page.evaluate(() => document.getElementById('output').textContent);
    console.log(output);
});
