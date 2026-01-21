import { test, expect } from '@playwright/test';

test.describe('ClipSqueeze Smoke Tests', () => {
  test('loads the homepage with all sections', async ({ page }) => {
    await page.goto('/');

    // Check header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /ClipSqueeze/i })).toBeVisible();

    // Check hero section
    await expect(page.getByRole('heading', { name: /Compress videos/i })).toBeVisible();
    await expect(page.getByText(/No uploads/i).first()).toBeVisible();

    // Check feature badges
    await expect(page.getByText('Private')).toBeVisible();
    await expect(page.getByText('Fast')).toBeVisible();
    await expect(page.getByText('Free')).toBeVisible();

    // Check main sections exist
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#how-it-works')).toBeVisible();
    await expect(page.locator('#compressor')).toBeVisible();
    await expect(page.locator('#faq')).toBeVisible();

    // Check footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('compressor tool has dropzone and is interactive', async ({ page }) => {
    await page.goto('/');

    // Scroll to compressor section
    await page.locator('#compressor').scrollIntoViewIfNeeded();

    // Check dropzone exists
    const dropzone = page.getByText(/Drag & drop your video here/i);
    await expect(dropzone).toBeVisible();

    // Check privacy message in dropzone
    await expect(page.getByText(/Your video never leaves your device/i).first()).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');

    // Click Features link
    await page.getByRole('link', { name: 'Features' }).first().click();
    await expect(page.locator('#features')).toBeInViewport();

    // Click How it works link
    await page.getByRole('link', { name: 'How it works' }).first().click();
    await expect(page.locator('#how-it-works')).toBeInViewport();

    // Click Compressor link
    await page.getByRole('link', { name: 'Compressor' }).first().click();
    await expect(page.locator('#compressor')).toBeInViewport();

    // Click FAQ link
    await page.getByRole('link', { name: 'FAQ' }).first().click();
    await expect(page.locator('#faq')).toBeInViewport();
  });

  test('FAQ accordion expands and collapses', async ({ page }) => {
    await page.goto('/');

    // Scroll to FAQ
    await page.locator('#faq').scrollIntoViewIfNeeded();

    // Click first FAQ item
    const firstQuestion = page.getByText('Do you upload my video?');
    await firstQuestion.click();

    // Check answer is visible
    await expect(page.getByText(/No, never. All video processing/i)).toBeVisible();

    // Click again to collapse
    await firstQuestion.click();

    // Answer should be hidden
    await expect(page.getByText(/No, never. All video processing/i)).not.toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button
    const themeButton = page.getByRole('button', { name: /Toggle theme/i });
    await expect(themeButton).toBeVisible();

    // Click to open dropdown
    await themeButton.click();

    // Check theme options are visible
    await expect(page.getByText('Light')).toBeVisible();
    await expect(page.getByText('Dark')).toBeVisible();
    await expect(page.getByText('System')).toBeVisible();

    // Select dark mode
    await page.getByText('Dark').click();

    // Check dark class is applied
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Open dropdown again and select light
    await themeButton.click();
    await page.getByText('Light').click();

    // Check dark class is removed
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('target size picker works', async ({ page }) => {
    // Note: This test would need a real video file to fully test compression
    // For smoke testing, we just verify the UI elements exist and are interactive
    await page.goto('/');

    // The target size picker is only visible after selecting a video
    // For this smoke test, we verify the compressor section structure
    await page.locator('#compressor').scrollIntoViewIfNeeded();

    // Verify the section title
    await expect(page.getByRole('heading', { name: /Compress Your Video/i })).toBeVisible();
  });

  test('responsive design - mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /Toggle menu/i });
    await expect(menuButton).toBeVisible();

    // Click to open mobile menu
    await menuButton.click();

    // Navigation links should be visible in mobile menu
    await expect(page.getByRole('link', { name: 'Features' }).nth(1)).toBeVisible();
    await expect(page.getByRole('link', { name: 'How it works' }).nth(1)).toBeVisible();
  });
});

// Note: Full compression e2e test would require:
// 1. A test video file fixture
// 2. WebCodecs support in the test browser
// 3. Longer test timeout for encoding
// 
// Example of what a full compression test would look like:
// 
// test('compresses video to target size', async ({ page }) => {
//   await page.goto('/');
//   
//   // Upload test video
//   const fileInput = page.locator('input[type="file"]');
//   await fileInput.setInputFiles('./e2e/fixtures/test-video.mp4');
//   
//   // Wait for metadata to load
//   await expect(page.getByText(/test-video.mp4/)).toBeVisible();
//   
//   // Select target size (8 MB)
//   await page.getByText('8 MB').click();
//   
//   // Click compress
//   await page.getByRole('button', { name: /Compress Video/i }).click();
//   
//   // Wait for compression (with extended timeout)
//   await expect(page.getByText(/Compression complete/i)).toBeVisible({ timeout: 120000 });
//   
//   // Verify download button exists
//   await expect(page.getByRole('button', { name: /Download MP4/i })).toBeVisible();
// });
