import { test, expect } from '@playwright/test';

/**
 * Test 005: Turn Management
 * 
 * This test validates turn switching between players.
 * After each valid move, the turn switches to the opponent.
 * 
 * Test scenario:
 * 1. Red starts (Red's Turn indicator shown)
 * 2. Red makes a move
 * 3. Turn switches to Blue (Blue's Turn indicator shown)
 * 4. Blue makes a move
 * 5. Turn switches back to Red
 */
test.describe('005 - Turn Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#game-canvas').waitFor({ state: 'visible' });
    await page.waitForTimeout(100);
  });

  test('turn switches between players after each move', async ({ page }) => {
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

    // Screenshot 0000: Red's turn at start
    await expect(page).toHaveScreenshot('0000-red-turn-start.png', {
      maxDiffPixelRatio: 0,
    });

    // Red makes a move: select (0,0), clone to (1,0)
    await clickCell(0, 0);
    await clickCell(1, 0);

    // Screenshot 0001: Blue's turn after Red moves
    await expect(page).toHaveScreenshot('0001-blue-turn.png', {
      maxDiffPixelRatio: 0,
    });

    // Blue makes a move: select (0,6), clone to (0,5)
    await clickCell(0, 6);
    await clickCell(0, 5);

    // Screenshot 0002: Red's turn again after Blue moves
    await expect(page).toHaveScreenshot('0002-red-turn-again.png', {
      maxDiffPixelRatio: 0,
    });
  });
});
