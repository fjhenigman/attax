// Input handler for Attax game
import type { AppStore, CombinedState } from './store';
import { selectPiece, deselectPiece, makeMove } from './store/actions';
import { GameRenderer } from './renderer';

export class InputHandler {
  private store: AppStore;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, store: AppStore, renderer: GameRenderer) {
    this.canvas = canvas;
    this.store = store;
    this.renderer = renderer;
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
    const state = this.store.getState() as CombinedState;
    const gameState = state.game;
    const networkState = state.network;
    
    // Don't process input if game is finished
    if (gameState.gameStatus === 'finished') return;
    
    // In online mode, only allow input when it's our turn
    if (networkState.mode === 'online' && networkState.connectionStatus === 'connected') {
      if (gameState.currentPlayer !== networkState.playerColor) {
        return; // Not our turn
      }
    }
    
    const position = this.renderer.getBoardPosition(clientX, clientY);
    if (!position) return;
    
    const cell = gameState.board[position.row]?.[position.col];
    if (!cell) return;
    
    if (gameState.selectedPiece) {
      // A piece is already selected - try to make a move
      const isValidMove = gameState.validMoves.some(
        m => m.row === position.row && m.col === position.col
      );
      
      if (isValidMove) {
        this.store.dispatch(makeMove(gameState.selectedPiece, position));
      } else if (cell.type === 'piece' && cell.owner === gameState.currentPlayer) {
        // Clicked on another own piece - select it instead
        this.store.dispatch(selectPiece(position));
      } else {
        // Clicked elsewhere - deselect
        this.store.dispatch(deselectPiece());
      }
    } else if (cell.type === 'piece' && cell.owner === gameState.currentPlayer) {
      // Select this piece
      this.store.dispatch(selectPiece(position));
    }
  }
}
