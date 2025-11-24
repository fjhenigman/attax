import { test, expect } from '@playwright/test';

/**
 * Test 003: Jump Move
 * 
 * This test validates jump move mechanics - when a piece moves 2 cells away.
 * A jump move occurs when a piece moves 2 cells in any direction (including diagonals).
 * Unlike clone, the original piece is removed (piece "jumps" to new location).
 * 
 * Test scenario:
 * 1. Red selects piece at (0,0) - top-left corner
 * 2. Valid moves are highlighted (cells within 2 squares)
 * 3. Red clicks on (2,0) to jump
 * 4. Piece moves - original disappears, new piece appears at destination
 * 5. Score remains: Red 2, Blue 2 (no conversion, just relocation)
 */
test.describe('003 - Jump Move', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#game-canvas').waitFor({ state: 'visible' });
    await page.waitForTimeout(100);
  });

  test('jump move relocates piece 2 cells away', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Calculate board coordinates
    const availableHeight = box!.height - 80;
    const cellSize = Math.min(box!.width, availableHeight) / 7;
    const boardWidth = cellSize * 7;
    const boardHeight = cellSize * 7;
    const offsetX = box!.x + (box!.width - boardWidth) / 2;
    const offsetY = box!.y + (availableHeight - boardHeight) / 2;

    // Screenshot 0000: Before any move
    await expect(page).toHaveScreenshot('0000-before-jump.png', {
      maxDiffPixelRatio: 0,
    });

    // Click on red piece at (0,0) - top-left
    const pieceX = offsetX + cellSize * 0.5;
    const pieceY = offsetY + cellSize * 0.5;
    await page.mouse.click(pieceX, pieceY);
    await page.waitForTimeout(50);

    // Screenshot 0001: Piece selected with valid moves highlighted
    await expect(page).toHaveScreenshot('0001-piece-selected-for-jump.png', {
      maxDiffPixelRatio: 0,
    });

    // Click on cell (2,0) to jump (2 cells down)
    const destX = offsetX + cellSize * 0.5;
    const destY = offsetY + cellSize * 2.5;
    await page.mouse.click(destX, destY);
    await page.waitForTimeout(50);

    // Screenshot 0002: After jump move - piece relocated
    await expect(page).toHaveScreenshot('0002-after-jump.png', {
      maxDiffPixelRatio: 0,
    });
  });
});
