// Input handler for Attax game
import type { AppStore } from './store';
import { selectPiece, deselectPiece, makeMove } from './store/actions';
import { GameRenderer } from './renderer';
import { AnimationManager } from './animation';
import { getMoveType, getConvertedPieces } from './game/moves';

export class InputHandler {
  private store: AppStore;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private animationManager: AnimationManager;

  constructor(
    canvas: HTMLCanvasElement, 
    store: AppStore, 
    renderer: GameRenderer,
    animationManager: AnimationManager
  ) {
    this.canvas = canvas;
    this.store = store;
    this.renderer = renderer;
    this.animationManager = animationManager;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    
    // Click events for mouse input
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouch(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.processInput(touch.clientX, touch.clientY);
  }

  private handleClick(event: MouseEvent): void {
    this.processInput(event.clientX, event.clientY);
  }

  private processInput(clientX: number, clientY: number): void {
    // Block input during animations
    if (this.animationManager.isAnimating()) return;
    
    const state = this.store.getState();
    
    // Don't process input if game is finished
    if (state.gameStatus === 'finished') return;
    
    const position = this.renderer.getBoardPosition(clientX, clientY);
    if (!position) return;
    
    const cell = state.board[position.row]?.[position.col];
    if (!cell) return;
    
    if (state.selectedPiece) {
      // A piece is already selected - try to make a move
      const isValidMove = state.validMoves.some(
        m => m.row === position.row && m.col === position.col
      );
      
      if (isValidMove) {
        this.executeMove(state.selectedPiece, position);
      } else if (cell.type === 'piece' && cell.owner === state.currentPlayer) {
        // Clicked on another own piece - select it instead
        this.store.dispatch(selectPiece(position));
      } else {
        // Clicked elsewhere - deselect
        this.store.dispatch(deselectPiece());
      }
    } else if (cell.type === 'piece' && cell.owner === state.currentPlayer) {
      // Select this piece
      this.store.dispatch(selectPiece(position));
    }
  }

  private executeMove(from: { row: number; col: number }, to: { row: number; col: number }): void {
    const state = this.store.getState();
    const moveType = getMoveType(from, to);
    const player = state.currentPlayer;
    
    // Calculate which pieces will be converted after the move
    // We need to simulate the board state after the piece moves
    const simulatedBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    simulatedBoard[to.row][to.col] = { type: 'piece', owner: player };
    if (moveType === 'jump') {
      simulatedBoard[from.row][from.col] = { type: 'empty' };
    }
    const convertedPositions = getConvertedPieces(simulatedBoard, to, player);
    
    // Start animation
    this.animationManager.startMoveAnimation(
      moveType,
      from,
      to,
      player,
      convertedPositions,
      () => {
        // onFrame callback - trigger render
        this.renderer.render(state);
      },
      () => {
        // onComplete callback - apply the actual move
        this.store.dispatch(makeMove(from, to));
      }
    );
  }
}
