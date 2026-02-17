import { test, expect } from '@playwright/test';
import { join } from 'path';

function exampleTest(name) {
    test(`${name} example renders`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(`http://localhost:8399/examples/${name}.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        console.log(`[${name}] Errors:`, errors.length ? errors.join('\n') : 'none');

        await page.screenshot({ path: join(process.cwd(), 'tests', `${name}-screenshot.png`) });

        expect(errors.length).toBe(0);
    });
}

exampleTest('base-primitives');
exampleTest('triangle-screen-shader');
exampleTest('scene-graph');
exampleTest('torus');
exampleTest('indexed-vs-non-indexed');
exampleTest('draw-modes');
exampleTest('fresnel');
exampleTest('high-mesh-count');
exampleTest('orbit-controls');
exampleTest('render-to-texture');
exampleTest('instancing');
exampleTest('fog');
exampleTest('wireframe-shader');
exampleTest('pbr');
