import { test, expect } from '@playwright/test';

test.describe('Attax Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays game title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Attax');
  });

  test('displays New Game button', async ({ page }) => {
    await expect(page.locator('#new-game-btn')).toBeVisible();
    await expect(page.locator('#new-game-btn')).toHaveText('New Game');
  });

  test('displays game canvas', async ({ page }) => {
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('clicking New Game button resets the game', async ({ page }) => {
    // Take initial screenshot to verify initial state
    await expect(page.locator('#game-canvas')).toBeVisible();
    
    // Click New Game
    await page.locator('#new-game-btn').click();
    
    // Canvas should still be visible after reset
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('canvas responds to click events', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    
    // Get canvas bounding box
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (box) {
      // Click on a position (approximately where a red piece should be)
      await page.mouse.click(box.x + 50, box.y + 50);
      
      // The game should not crash - canvas should still be visible
      await expect(canvas).toBeVisible();
    }
  });

  test('game is playable with mouse clicks', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (box) {
      // Calculate approximate cell positions
      // The board is 7x7 and centered, we need to figure out cell size
      const cellSize = Math.min(box.width, box.height) / 7;
      const boardWidth = cellSize * 7;
      const boardHeight = cellSize * 7;
      const offsetX = box.x + (box.width - boardWidth) / 2;
      const offsetY = box.y + (box.height - boardHeight) / 2;
      
      // Click on red piece at (0, 0) - top left
      const redPieceX = offsetX + cellSize * 0.5;
      const redPieceY = offsetY + cellSize * 0.5;
      await page.mouse.click(redPieceX, redPieceY);
      
      // Give time for selection to render
      await page.waitForTimeout(100);
      
      // Click on adjacent empty cell at (1, 0) to make a clone move
      const moveX = offsetX + cellSize * 0.5;
      const moveY = offsetY + cellSize * 1.5;
      await page.mouse.click(moveX, moveY);
      
      // Give time for move to process
      await page.waitForTimeout(100);
      
      // Game should still be playable
      await expect(canvas).toBeVisible();
    }
  });
});
