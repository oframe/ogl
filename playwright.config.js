import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    use: {
        browserName: 'chromium',
        launchOptions: {
            args: [
                '--enable-unsafe-webgpu',
                '--enable-features=Vulkan',
                '--use-angle=swiftshader',
                '--use-webgpu-adapter=swiftshader',
            ],
        },
    },
    webServer: {
        command: 'npx serve . -l 8399 --no-clipboard',
        port: 8399,
        reuseExistingServer: true,
    },
});
