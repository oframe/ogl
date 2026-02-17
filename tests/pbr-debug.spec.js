import { test } from '@playwright/test';
import { join } from 'path';

const examples = ['pbr', 'textures', 'normal-maps', 'base-primitives'];

for (const name of examples) {
    test(`screenshot ${name}`, async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`http://localhost:8399/examples/${name}.html`);
        await page.waitForTimeout(4000);
        await page.screenshot({ path: join(process.cwd(), 'tests', `${name}-screenshot.png`) });
        console.log(`${name} errors:`, errors.length ? errors : 'none');
    });
}
