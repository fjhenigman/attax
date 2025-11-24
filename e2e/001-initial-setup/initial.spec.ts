import { test, expect } from '@playwright/test';

/**
 * Test 001: Initial Setup
 * 
 * This test validates the initial game state and rendering when the game loads.
 * It verifies:
 * - Initial board layout with 7x7 grid
 * - Starting piece positions (red: top-left & bottom-right, blue: top-right & bottom-left)
 * - Initial scores (2-2)
 * - Red player starts first
 */
test.describe('001 - Initial Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for canvas to be fully rendered
    await page.locator('#game-canvas').waitFor({ state: 'visible' });
    // Give the renderer time to complete initial draw
    await page.waitForTimeout(100);
  });

  test('initial board state displays correctly', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Screenshot 0000: Initial board with starting positions
    await expect(page).toHaveScreenshot('0000-initial-board.png', {
      maxDiffPixelRatio: 0,
    });
  });

  test('red player turn indicator shown at start', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // The initial state should show "RED's Turn" in the UI
    // Screenshot 0001: Red player turn indicator
    await expect(page).toHaveScreenshot('0001-red-player-turn.png', {
      maxDiffPixelRatio: 0,
    });
  });

  test('initial scores are 2-2', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Both players start with 2 pieces each
    // This is visually verified via the score display in the screenshot
    await expect(page).toHaveScreenshot('0002-initial-scores.png', {
      maxDiffPixelRatio: 0,
    });
  });
});
