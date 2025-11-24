// Canvas renderer for Attax game
import type { GameState, Position, Player } from './types';
import { BOARD_SIZE } from './game/board';
import type { AnimationManager, AnimatedPiece, ConversionAnimation } from './animation';

// Colors from the design document
const COLORS = {
  background: '#2D3748',
  gridLines: '#4A5568',
  emptyCells: '#1A202C',
  red: '#E53E3E',
  blue: '#3182CE',
  redBright: '#FC5252',  // Brighter red for pulse
  blueBright: '#4299E1', // Brighter blue for pulse
  selectionHighlight: '#F6E05E',
  validMoveHint: 'rgba(72, 187, 120, 0.5)',
  text: '#FFFFFF',
  textDark: '#2D3748'
};

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;
  private uiHeight: number = 80;
  private animationManager: AnimationManager | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2d context');
    }
    this.ctx = ctx;
    this.calculateDimensions();
  }

  private calculateDimensions(): void {
    const availableWidth = this.canvas.width;
    const availableHeight = this.canvas.height - this.uiHeight;
    
    // Calculate cell size to fit the board
    this.cellSize = Math.min(
      Math.floor(availableWidth / BOARD_SIZE),
      Math.floor(availableHeight / BOARD_SIZE)
    );
    
    // Center the board
    const boardWidth = this.cellSize * BOARD_SIZE;
    const boardHeight = this.cellSize * BOARD_SIZE;
    this.boardOffsetX = Math.floor((availableWidth - boardWidth) / 2);
    this.boardOffsetY = Math.floor((availableHeight - boardHeight) / 2);
  }

  public setAnimationManager(manager: AnimationManager): void {
    this.animationManager = manager;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.calculateDimensions();
  }

  public render(state: GameState): void {
    this.clear();
    this.drawGrid();
    this.drawValidMoves(state.validMoves);
    this.drawPieces(state);
    this.drawAnimations();
    this.drawSelection(state.selectedPiece);
    this.drawUI(state);
  }

  private clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGrid(): void {
    // Draw cell backgrounds
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = this.boardOffsetX + col * this.cellSize;
        const y = this.boardOffsetY + row * this.cellSize;
        
        this.ctx.fillStyle = COLORS.emptyCells;
        this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
      }
    }
    
    // Draw grid lines
    this.ctx.strokeStyle = COLORS.gridLines;
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i <= BOARD_SIZE; i++) {
      const x = this.boardOffsetX + i * this.cellSize;
      const y = this.boardOffsetY + i * this.cellSize;
      
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.boardOffsetY);
      this.ctx.lineTo(x, this.boardOffsetY + BOARD_SIZE * this.cellSize);
      this.ctx.stroke();
      
      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(this.boardOffsetX, y);
      this.ctx.lineTo(this.boardOffsetX + BOARD_SIZE * this.cellSize, y);
      this.ctx.stroke();
    }
  }

  private drawPieces(state: GameState): void {
    // Get positions that are being animated (should not be drawn normally)
    const animatedPositions = this.animationManager?.getAnimatedPositions() ?? 
      { source: null, destination: null, conversions: [] };
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = state.board[row][col];
        if (cell.type === 'piece' && cell.owner) {
          // Skip positions that are being animated
          if (this.isPositionAnimated({ row, col }, animatedPositions)) {
            continue;
          }
          this.drawPiece(row, col, cell.owner);
        }
      }
    }
  }

  private isPositionAnimated(
    pos: Position, 
    animated: { source: Position | null; destination: Position | null; conversions: Position[] }
  ): boolean {
    if (animated.source && animated.source.row === pos.row && animated.source.col === pos.col) {
      return true;
    }
    if (animated.destination && animated.destination.row === pos.row && animated.destination.col === pos.col) {
      return true;
    }
    for (const conv of animated.conversions) {
      if (conv.row === pos.row && conv.col === pos.col) {
        return true;
      }
    }
    return false;
  }

  private drawPiece(row: number, col: number, owner: 'red' | 'blue'): void {
    this.drawPieceAtPosition(
      this.boardOffsetX + col * this.cellSize + this.cellSize / 2,
      this.boardOffsetY + row * this.cellSize + this.cellSize / 2,
      owner,
      1,  // scale
      1   // opacity
    );
  }

  private drawPieceAtPosition(
    x: number, 
    y: number, 
    owner: Player, 
    scale: number = 1, 
    opacity: number = 1,
    shadow?: { opacity: number; blur: number; offsetY: number }
  ): void {
    const radius = this.cellSize * 0.4 * scale;
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // Draw shadow if provided
    if (shadow && shadow.opacity > 0) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${shadow.opacity})`;
      this.ctx.beginPath();
      this.ctx.ellipse(
        x, 
        y + shadow.offsetY, 
        radius * 0.9, 
        radius * 0.4, 
        0, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = owner === 'red' ? COLORS.red : COLORS.blue;
    this.ctx.fill();
    
    // Add a subtle border
    this.ctx.strokeStyle = owner === 'red' ? '#C53030' : '#2B6CB0';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawAnimations(): void {
    if (!this.animationManager || !this.animationManager.isAnimating()) {
      return;
    }

    // Draw source piece pulse (for clone moves)
    const sourcePulse = this.animationManager.getSourcePieceState();
    if (sourcePulse) {
      this.drawAnimatedPiece(sourcePulse);
    }

    // Draw moving piece
    const movingPiece = this.animationManager.getMovingPieceState();
    if (movingPiece) {
      this.drawAnimatedPiece(movingPiece);
    }

    // Draw conversion animations
    const conversions = this.animationManager.getConversionStates();
    for (const conv of conversions) {
      this.drawConversionAnimation(conv);
    }
  }

  private drawAnimatedPiece(piece: AnimatedPiece): void {
    const x = this.boardOffsetX + piece.position.col * this.cellSize + this.cellSize / 2 + 
              piece.offsetX * this.cellSize;
    const y = this.boardOffsetY + piece.position.row * this.cellSize + this.cellSize / 2 + 
              piece.offsetY * this.cellSize;
    
    this.drawPieceAtPosition(
      x, 
      y, 
      piece.owner, 
      piece.scale, 
      piece.opacity,
      piece.shadow.opacity > 0 ? piece.shadow : undefined
    );
  }

  private drawConversionAnimation(conv: ConversionAnimation): void {
    const x = this.boardOffsetX + conv.position.col * this.cellSize + this.cellSize / 2;
    const y = this.boardOffsetY + conv.position.row * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize * 0.4;

    // Determine which color to show based on rotation (flip effect)
    // 0-90 degrees: show fromOwner with horizontal squeeze
    // 90-180 degrees: show toOwner with horizontal expand
    const rotation = conv.rotation;
    const isFirstHalf = rotation < 90;
    const owner = isFirstHalf ? conv.fromOwner : conv.toOwner;
    
    // Calculate the horizontal scale for flip effect
    // At 0 degrees: full width, at 90 degrees: zero width
    const angle = isFirstHalf ? rotation : (180 - rotation);
    const scaleX = Math.cos((angle * Math.PI) / 180);

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scaleX, 1);
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = owner === 'red' ? COLORS.red : COLORS.blue;
    this.ctx.fill();
    
    this.ctx.strokeStyle = owner === 'red' ? '#C53030' : '#2B6CB0';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawSelection(selectedPiece: Position | null): void {
    if (!selectedPiece) return;
    
    const x = this.boardOffsetX + selectedPiece.col * this.cellSize;
    const y = this.boardOffsetY + selectedPiece.row * this.cellSize;
    
    this.ctx.strokeStyle = COLORS.selectionHighlight;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
  }

  private drawValidMoves(validMoves: Position[]): void {
    for (const move of validMoves) {
      const x = this.boardOffsetX + move.col * this.cellSize;
      const y = this.boardOffsetY + move.row * this.cellSize;
      
      this.ctx.fillStyle = COLORS.validMoveHint;
      this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
    }
  }

  private drawUI(state: GameState): void {
    const uiY = this.boardOffsetY + BOARD_SIZE * this.cellSize + 20;
    
    // Draw scores
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    
    // Red score
    this.ctx.fillStyle = COLORS.red;
    this.ctx.fillText(`Red: ${state.scores.red}`, this.boardOffsetX, uiY);
    
    // Blue score
    this.ctx.fillStyle = COLORS.blue;
    this.ctx.textAlign = 'right';
    const boardRight = this.boardOffsetX + BOARD_SIZE * this.cellSize;
    this.ctx.fillText(`Blue: ${state.scores.blue}`, boardRight, uiY);
    
    // Current player or winner
    this.ctx.textAlign = 'center';
    const centerX = this.boardOffsetX + (BOARD_SIZE * this.cellSize) / 2;
    
    if (state.gameStatus === 'finished') {
      this.ctx.fillStyle = COLORS.text;
      if (state.winner === 'draw') {
        this.ctx.fillText("It's a Draw!", centerX, uiY);
      } else {
        this.ctx.fillStyle = state.winner === 'red' ? COLORS.red : COLORS.blue;
        this.ctx.fillText(`${state.winner?.toUpperCase()} Wins!`, centerX, uiY);
      }
    } else {
      this.ctx.fillStyle = state.currentPlayer === 'red' ? COLORS.red : COLORS.blue;
      this.ctx.fillText(`${state.currentPlayer.toUpperCase()}'s Turn`, centerX, uiY);
    }
  }

  public getBoardPosition(clientX: number, clientY: number): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    const col = Math.floor((x - this.boardOffsetX) / this.cellSize);
    const row = Math.floor((y - this.boardOffsetY) / this.cellSize);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    
    return null;
  }
}
