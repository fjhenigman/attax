import { test, expect } from '@playwright/test';

/**
 * Test 004: Piece Conversion
 * 
 * This test validates piece conversion mechanics - when opponent pieces adjacent to
 * the destination cell are converted to the current player's color.
 * 
 * Test scenario:
 * 1. Start with a sequence of moves to set up a conversion scenario
 * 2. Red clones near blue piece
 * 3. Blue piece is converted to red
 * 4. Scores update accordingly
 */
test.describe('004 - Piece Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#game-canvas').waitFor({ state: 'visible' });
    await page.waitForTimeout(100);
  });

  test('adjacent opponent pieces are converted after move', async ({ page }) => {
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

    // Helper to click on a board cell
    const clickCell = async (row: number, col: number) => {
      const x = offsetX + cellSize * (col + 0.5);
      const y = offsetY + cellSize * (row + 0.5);
      await page.mouse.click(x, y);
      await page.waitForTimeout(50);
    };

    // Screenshot 0000: Initial state
    await expect(page).toHaveScreenshot('0000-initial-state.png', {
      maxDiffPixelRatio: 0,
    });

    // Red's turn: Clone from (0,0) to (0,1) - moving towards blue at (0,6)
    await clickCell(0, 0); // Select red piece
    await expect(page).toHaveScreenshot('0001-red-selects-piece.png', {
      maxDiffPixelRatio: 0,
    });
    
    await clickCell(0, 1); // Clone right
    await expect(page).toHaveScreenshot('0002-after-red-clone.png', {
      maxDiffPixelRatio: 0,
    });

    // Blue's turn: Clone from (0,6) to (0,5) - moving towards red
    await clickCell(0, 6); // Select blue piece
    await expect(page).toHaveScreenshot('0003-blue-selects-piece.png', {
      maxDiffPixelRatio: 0,
    });
    
    await clickCell(0, 5); // Clone left
    await expect(page).toHaveScreenshot('0004-after-blue-clone.png', {
      maxDiffPixelRatio: 0,
    });

    // Red's turn: Clone from (0,1) to (0,2)
    await clickCell(0, 1); // Select red piece
    await clickCell(0, 2); // Clone right
    await expect(page).toHaveScreenshot('0005-red-advances.png', {
      maxDiffPixelRatio: 0,
    });

    // Blue's turn: Clone from (0,5) to (0,4)
    await clickCell(0, 5); // Select blue piece
    await clickCell(0, 4); // Clone left
    await expect(page).toHaveScreenshot('0006-blue-advances.png', {
      maxDiffPixelRatio: 0,
    });

    // Red's turn: Clone from (0,2) to (0,3) - this should be adjacent to blue at (0,4)
    await clickCell(0, 2); // Select red piece
    await clickCell(0, 3); // Clone to (0,3) - adjacent to blue at (0,4)
    
    // Screenshot showing conversion: Blue at (0,4) should now be converted to red
    await expect(page).toHaveScreenshot('0007-conversion-occurs.png', {
      maxDiffPixelRatio: 0,
    });
  });
});
