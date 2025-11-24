// Attax game - Main entry point
import { configureStore } from './store';
import { newGame } from './store/actions';
import { GameRenderer } from './renderer';
import { InputHandler } from './input';
import { AnimationManager } from './animation';

class AttaxGame {
  private store;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private animationManager: AnimationManager;

  constructor() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    
    // Setup store
    this.store = configureStore();
    
    // Setup animation manager
    this.animationManager = new AnimationManager();
    
    // Setup renderer
    this.renderer = new GameRenderer(this.canvas);
    this.renderer.setAnimationManager(this.animationManager);
    
    // Setup input handler
    new InputHandler(this.canvas, this.store, this.renderer, this.animationManager);
    
    // Subscribe to state changes
    this.store.subscribe(() => {
      this.renderer.render(this.store.getState());
    });
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    const container = document.getElementById('app');
    if (container) {
      this.renderer.resize(container.clientWidth, container.clientHeight);
      this.renderer.render(this.store.getState());
    }
  }

  public mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    
    // Setup container styles
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.backgroundColor = '#2D3748';
    
    // Create header with New Game button
    const header = document.createElement('div');
    header.style.padding = '10px';
    header.style.display = 'flex';
    header.style.justifyContent = 'center';
    header.style.gap = '20px';
    
    const title = document.createElement('h1');
    title.textContent = 'Attax';
    title.style.color = '#FFFFFF';
    title.style.margin = '0';
    title.style.fontFamily = 'Arial, sans-serif';
    
    const newGameBtn = document.createElement('button');
    newGameBtn.id = 'new-game-btn';
    newGameBtn.textContent = 'New Game';
    newGameBtn.style.padding = '10px 20px';
    newGameBtn.style.fontSize = '16px';
    newGameBtn.style.cursor = 'pointer';
    newGameBtn.style.backgroundColor = '#48BB78';
    newGameBtn.style.color = 'white';
    newGameBtn.style.border = 'none';
    newGameBtn.style.borderRadius = '5px';
    newGameBtn.addEventListener('click', () => {
      this.store.dispatch(newGame());
    });
    
    header.appendChild(title);
    header.appendChild(newGameBtn);
    
    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.style.flex = '1';
    canvasContainer.style.width = '100%';
    canvasContainer.style.display = 'flex';
    canvasContainer.style.justifyContent = 'center';
    canvasContainer.style.alignItems = 'center';
    canvasContainer.style.overflow = 'hidden';
    
    canvasContainer.appendChild(this.canvas);
    
    container.appendChild(header);
    container.appendChild(canvasContainer);
    
    // Set initial canvas size
    const rect = canvasContainer.getBoundingClientRect();
    this.renderer.resize(rect.width, rect.height);
    
    // Initial render
    this.renderer.render(this.store.getState());
  }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new AttaxGame();
  game.mount('app');
});
