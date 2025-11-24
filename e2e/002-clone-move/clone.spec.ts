import { test, expect } from '@playwright/test';

/**
 * Test 002: Clone Move
 * 
 * This test validates clone move mechanics - when a piece is duplicated to an adjacent cell.
 * A clone move occurs when a piece moves 1 cell in any direction (including diagonals).
 * 
 * Test scenario:
 * 1. Red selects piece at (0,0) - top-left corner
 * 2. Valid moves are highlighted (adjacent empty cells)
 * 3. Red clicks on (1,0) to clone
 * 4. Piece is duplicated - original stays, new piece appears at destination
 * 5. Score updates: Red 3, Blue 2
 */
test.describe('002 - Clone Move', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#game-canvas').waitFor({ state: 'visible' });
    await page.waitForTimeout(100);
  });

  test('clone move duplicates piece to adjacent cell', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Calculate board coordinates
    // Board is 7x7, centered in canvas area (below header)
    const availableHeight = box!.height - 80; // UI height offset
    const cellSize = Math.min(box!.width, availableHeight) / 7;
    const boardWidth = cellSize * 7;
    const boardHeight = cellSize * 7;
    const offsetX = box!.x + (box!.width - boardWidth) / 2;
    const offsetY = box!.y + (availableHeight - boardHeight) / 2;

    // Screenshot 0000: Before any move
    await expect(page).toHaveScreenshot('0000-before-move.png', {
      maxDiffPixelRatio: 0,
    });

    // Click on red piece at (0,0) - top-left
    const pieceX = offsetX + cellSize * 0.5;
    const pieceY = offsetY + cellSize * 0.5;
    await page.mouse.click(pieceX, pieceY);
    await page.waitForTimeout(50);

    // Screenshot 0001: Piece selected with valid moves highlighted
    await expect(page).toHaveScreenshot('0001-piece-selected.png', {
      maxDiffPixelRatio: 0,
    });

    // Click on adjacent cell (1,0) to clone
    const destX = offsetX + cellSize * 0.5;
    const destY = offsetY + cellSize * 1.5;
    await page.mouse.click(destX, destY);
    await page.waitForTimeout(50);

    // Screenshot 0002: After clone move - piece duplicated
    await expect(page).toHaveScreenshot('0002-after-clone.png', {
      maxDiffPixelRatio: 0,
    });
  });
});
